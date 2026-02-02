/**
 * QMS Memory Search - Self-Contained Local Memory Search
 * 
 * Drop-in replacement for OpenClaw's failing built-in memory_search.
 * Uses TF-IDF ranking for intelligent search without API dependencies.
 */

import { readFileSync, writeFileSync, existsSync, statSync, watch, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Global state

// Get workspace root (go up from skills/qms-memory to main directory)
const __dirname = dirname(fileURLToPath(import.meta.url));
const WORKSPACE_ROOT = resolve(__dirname, '../..');
const INDEX_FILE = join(__dirname, '.qms-memory-index.json');

// Global state
let searchIndex = null;
let fileWatcher = null;
let rebuildTimer = null;
const DEBOUNCE_MS = 2000;

/**
 * Simple tokenizer for search terms
 */
class Tokenizer {
  constructor() {
    this.stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
      'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have',
      'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could',
      'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'
    ]);
  }

  tokenize(text) {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !this.stopWords.has(word));
  }

  tokenizeQuery(query) {
    // For queries, don't filter stop words as aggressively
    return query.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 1);
  }
}

/**
 * TF-IDF Calculator for search relevance
 */
class TFIDFCalculator {
  constructor(documents) {
    this.documents = documents;
    this.documentCount = documents.length;
    this.termDocumentCount = new Map(); // term -> number of documents containing it
    this.buildTermDocumentCounts();
  }

  buildTermDocumentCounts() {
    for (const doc of this.documents) {
      const uniqueTerms = new Set(Object.keys(doc.termFreqs));
      for (const term of uniqueTerms) {
        this.termDocumentCount.set(term, (this.termDocumentCount.get(term) || 0) + 1);
      }
    }
  }

  calculateTFIDF(document, term) {
    const tf = document.termFreqs[term] || 0;
    if (tf === 0) return 0;

    const df = this.termDocumentCount.get(term) || 0;
    if (df === 0) return 0;

    // TF-IDF calculation: tf * log(N/df)
    const tfidf = tf * Math.log(this.documentCount / df);
    return tfidf;
  }

  calculateDocumentScore(document, queryTerms) {
    let score = 0;
    for (const term of queryTerms) {
      score += this.calculateTFIDF(document, term);
    }
    return score;
  }
}

/**
 * Memory Search Index
 */
class MemorySearchIndex {
  constructor() {
    this.tokenizer = new Tokenizer();
    this.documents = [];
    this.ready = false;
  }

  async initialize() {
    try {
      await this.loadOrBuildIndex();
      this.setupFileWatcher();
      this.ready = true;
      console.log(`🧠 QMS Memory Search initialized: ${this.documents.length} documents indexed`);
    } catch (error) {
      console.error('Failed to initialize QMS Memory Search:', error);
      this.ready = false;
    }
  }

  async loadOrBuildIndex() {
    // Check if index exists and is current
    if (this.isIndexCurrent()) {
      await this.loadIndex();
    } else {
      await this.buildIndex();
    }
  }

  isIndexCurrent() {
    if (!existsSync(INDEX_FILE)) return false;

    try {
      const indexStat = statSync(INDEX_FILE);
      const memoryFiles = this.getMemoryFiles();
      
      // Check if any memory file is newer than index
      for (const file of memoryFiles) {
        const fileStat = statSync(file);
        if (fileStat.mtime > indexStat.mtime) {
          return false;
        }
      }
      return true;
    } catch {
      return false;
    }
  }

  async loadIndex() {
    try {
      const indexData = JSON.parse(readFileSync(INDEX_FILE, 'utf-8'));
      this.documents = indexData.documents || [];
      console.log(`📖 Loaded QMS index: ${this.documents.length} documents`);
    } catch (error) {
      console.warn('Failed to load index, rebuilding:', error.message);
      await this.buildIndex();
    }
  }

  async buildIndex() {
    console.log('🔨 Building QMS memory index...');
    const startTime = Date.now();

    this.documents = [];
    const memoryFiles = this.getMemoryFiles();

    for (const filePath of memoryFiles) {
      try {
        await this.indexFile(filePath);
      } catch (error) {
        console.warn(`Failed to index ${filePath}:`, error.message);
      }
    }

    // Save index to disk
    const indexData = {
      version: '1.0.0',
      created: new Date().toISOString(),
      documents: this.documents,
      fileCount: this.documents.length,
      termCount: this.getUniqueTermCount()
    };

    writeFileSync(INDEX_FILE, JSON.stringify(indexData, null, 2));
    
    const buildTime = Date.now() - startTime;
    console.log(`✅ QMS index built in ${buildTime}ms: ${this.documents.length} documents, ${this.getUniqueTermCount()} unique terms`);
  }

  getMemoryFiles() {
    const patterns = [
      join(WORKSPACE_ROOT, 'MEMORY.md'),
      join(WORKSPACE_ROOT, 'memory', '*.md'),
      join(WORKSPACE_ROOT, 'memory', '**', '*.md')
    ];

    const files = [];
    for (const pattern of patterns) {
      try {
        // Simple glob implementation for memory files
        if (pattern.endsWith('MEMORY.md')) {
          if (existsSync(pattern)) files.push(pattern);
        } else {
          // For memory/*.md pattern, manually scan directory
          const memoryDir = join(WORKSPACE_ROOT, 'memory');
          if (existsSync(memoryDir)) {
            try {
              const dirFiles = readdirSync(memoryDir);
              for (const file of dirFiles) {
                if (file.endsWith('.md')) {
                  files.push(join(memoryDir, file));
                }
              }
            } catch (err) {
              console.warn('Error reading memory directory:', err.message);
            }
          }
        }
      } catch (error) {
        console.warn(`Error processing pattern ${pattern}:`, error.message);
      }
    }

    return [...new Set(files)]; // Remove duplicates
  }

  async indexFile(filePath) {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    // Build term frequencies for the entire document
    const termFreqs = {};
    const tokenizedLines = [];

    for (let i = 0; i < lines.length; i++) {
      const lineTokens = this.tokenizer.tokenize(lines[i]);
      tokenizedLines.push({
        lineNumber: i + 1,
        text: lines[i],
        tokens: lineTokens
      });

      // Count term frequencies for the document
      for (const token of lineTokens) {
        termFreqs[token] = (termFreqs[token] || 0) + 1;
      }
    }

    const document = {
      id: filePath,
      path: filePath,
      termFreqs,
      lines: tokenizedLines,
      content
    };

    this.documents.push(document);
  }

  getUniqueTermCount() {
    const terms = new Set();
    for (const doc of this.documents) {
      Object.keys(doc.termFreqs).forEach(term => terms.add(term));
    }
    return terms.size;
  }

  search(query, options = {}) {
    if (!this.ready || this.documents.length === 0) {
      console.warn('QMS index not ready or empty');
      return [];
    }

    const { limit = 10, scoreThreshold = 0.01 } = options;
    const queryTerms = this.tokenizer.tokenizeQuery(query);
    
    if (queryTerms.length === 0) {
      console.warn(`Query "${query}" produced no valid tokens`);
      return [];
    }

    // Calculate TF-IDF scores
    const calculator = new TFIDFCalculator(this.documents);
    const documentScores = [];

    for (const document of this.documents) {
      const score = calculator.calculateDocumentScore(document, queryTerms);
      if (score >= scoreThreshold) {
        // Find matching lines
        const matchingLines = [];
        const snippets = [];

        for (const lineInfo of document.lines) {
          const hasMatch = queryTerms.some(term => 
            lineInfo.tokens.some(token => token.includes(term) || term.includes(token))
          );
          
          if (hasMatch) {
            matchingLines.push(lineInfo.lineNumber);
            snippets.push(lineInfo.text.trim());
          }
        }

        if (matchingLines.length > 0) {
          documentScores.push({
            path: document.path,
            score,
            lineNumbers: matchingLines,
            snippets
          });
        }
      }
    }

    // Sort by score and limit results
    return documentScores
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  setupFileWatcher() {
    if (fileWatcher) return; // Already watching

    try {
      const memoryDir = join(WORKSPACE_ROOT, 'memory');
      const memoryFile = join(WORKSPACE_ROOT, 'MEMORY.md');
      
      // Watch memory directory if it exists
      if (existsSync(memoryDir)) {
        fileWatcher = watch(memoryDir, { recursive: true }, (eventType, filename) => {
          if (filename && filename.endsWith('.md')) {
            this.scheduleRebuild();
          }
        });
      }

      // Watch main MEMORY.md file if it exists
      if (existsSync(memoryFile)) {
        watch(memoryFile, () => this.scheduleRebuild());
      }

      console.log('📁 File watching enabled for memory files');
    } catch (error) {
      console.warn('Failed to setup file watching:', error.message);
    }
  }

  scheduleRebuild() {
    // Debounce rebuilds to avoid excessive work
    if (rebuildTimer) {
      clearTimeout(rebuildTimer);
    }

    rebuildTimer = setTimeout(async () => {
      console.log('🔄 Memory files changed, rebuilding index...');
      await this.buildIndex();
    }, DEBOUNCE_MS);
  }

  async forceRebuild() {
    if (rebuildTimer) {
      clearTimeout(rebuildTimer);
      rebuildTimer = null;
    }
    await this.buildIndex();
  }

  getStatus() {
    return {
      ready: this.ready,
      docCount: this.documents.length,
      indexSize: this.getUniqueTermCount(),
      watching: !!fileWatcher
    };
  }
}

// Global index instance
let globalIndex = null;

async function getIndex() {
  if (!globalIndex) {
    globalIndex = new MemorySearchIndex();
    await globalIndex.initialize();
  }
  return globalIndex;
}

/**
 * Search memory files using QMS system
 * Drop-in replacement for memory_search tool
 */
export async function searchMemory(query, options = {}) {
  try {
    console.log(`🔍 QMS Memory Search: "${query}"`);
    const index = await getIndex();
    const results = index.search(query, options);
    console.log(`📊 Found ${results.length} results`);
    return results;
  } catch (error) {
    console.error('QMS Memory Search failed:', error);
    return [];
  }
}

/**
 * Get memory search system status
 */
export async function getMemorySearchStatus() {
  try {
    const index = await getIndex();
    return index.getStatus();
  } catch (error) {
    console.error('Failed to get QMS status:', error);
    return { ready: false, docCount: 0, indexSize: 0, watching: false };
  }
}

/**
 * Force rebuild memory index
 */
export async function rebuildMemoryIndex() {
  try {
    const index = await getIndex();
    await index.forceRebuild();
    return { success: true, ...index.getStatus() };
  } catch (error) {
    console.error('Failed to rebuild QMS index:', error);
    return { success: false, error: error.message };
  }
}

// Default export for convenience
export default {
  searchMemory,
  getMemorySearchStatus,
  rebuildMemoryIndex
};