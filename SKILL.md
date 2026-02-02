---
name: qms-memory
description: "Local TF-IDF memory search to replace failing built-in memory_search. No API keys required!"
author: "OpenClaw Community"
version: "1.0.0"
license: "MIT"
tags: ["memory", "search", "tfidf", "local", "offline"]
---

# QMS Memory Search - Local Memory Search Solution

**🚀 Drop-in replacement for broken built-in memory_search**

OpenClaw's built-in memory_search fails when OpenAI/Google API keys are missing. This skill provides a local, offline alternative using TF-IDF ranking for intelligent search relevance.

## ✨ Features

- **🔍 TF-IDF Search Ranking** - Smart relevance scoring, not just keyword matching
- **⚡ Lightning Fast** - <100ms queries vs slow/failing API calls  
- **🔄 Auto-Indexing** - Rebuilds when memory files change
- **🔒 Fully Offline** - No API keys or external dependencies required
- **📋 Compatible API** - Drop-in replacement, same result format
- **🎯 Context-Aware** - Returns line numbers and snippets for precise results

## 🛠️ Installation

Via ClawdHub (recommended):
```bash
clawdhub install qms-memory
```

Or download manually and place in your `skills/` directory.

## 📖 Usage

### Search Memory Files
```javascript
import { searchMemory } from './skills/qms-memory/index.js';

// Search with query
const results = await searchMemory("prompt injection security");

// Results format:
// [
//   {
//     path: "/path/to/memory/file.md",
//     score: 0.234,
//     lineNumbers: [15, 16, 17],
//     snippets: ["Context around matches..."]
//   }
// ]
```

### Check System Status  
```javascript
import { getMemorySearchStatus } from './skills/qms-memory/index.js';

const status = await getMemorySearchStatus();
// { ready: true, docCount: 12, indexSize: 1500, watching: true }
```

### Force Index Rebuild
```javascript
import { rebuildMemoryIndex } from './skills/qms-memory/index.js';

await rebuildMemoryIndex();
```

## 🎯 What Gets Indexed

Automatically finds and indexes:
- `MEMORY.md` (main memory file)
- `memory/*.md` (daily notes and organized memories)
- Any markdown files in memory directories

File watching automatically rebuilds the index when files change.

## ⚙️ Configuration

Works out of the box! The skill automatically:
1. Detects your workspace root directory
2. Finds memory files to index  
3. Starts file watching for automatic updates
4. Builds TF-IDF index for fast searches

## 🔧 Integration with OpenClaw

### Replace Built-in memory_search

In your agent code, replace:
```javascript
// OLD: Failing built-in version
const results = await memory_search("query");

// NEW: Working QMS version  
import { searchMemory } from './skills/qms-memory/index.js';
const results = await searchMemory("query");
```

### Disable Built-in Memory Search

To stop API key errors, disable the built-in memory search in your OpenClaw config:
```json
{
  "memorySearch": {
    "sources": []
  }
}
```

## 📊 Performance

**Typical Performance:**
- **Index Build:** ~2-3 seconds for 10-15 memory files
- **Search Queries:** <10ms average 
- **Memory Usage:** ~5-10MB for index
- **File Watching:** Minimal overhead, efficient debouncing

**vs Built-in memory_search:**
- **Reliability:** ✅ Always works vs ❌ API key failures
- **Speed:** ✅ <10ms vs ❌ 500ms+ API calls
- **Relevance:** ✅ TF-IDF scoring vs ❌ Simple text matching
- **Offline:** ✅ Fully local vs ❌ Requires external APIs

## 🔧 Troubleshooting

### No Results Found
- Check that memory files exist (`MEMORY.md`, `memory/*.md`)
- Run `await rebuildMemoryIndex()` to force rebuild
- Verify files contain the terms you're searching for

### Index Not Updating
- File watcher should auto-rebuild when files change
- If stuck, restart OpenClaw or manually call `rebuildMemoryIndex()`

### Performance Issues
- Index size scales with content volume
- Consider splitting very large memory files
- File watching has built-in debouncing (2s delay)

## 🤝 Contributing

This skill is open source and community-maintained:
- Report issues via ClawdHub or GitHub
- Contribute improvements and optimizations
- Share usage patterns and tips

## 📄 License

MIT License - Free for personal and commercial use.

---

**🎉 Enjoy reliable, fast memory search without API dependencies!**