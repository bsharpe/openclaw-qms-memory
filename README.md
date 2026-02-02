# OpenClaw Memory Search Fix - Local TF-IDF Alternative (No API Keys)

**🚀 Drop-in replacement for broken built-in memory_search | Fix "API key not found" errors**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![OpenClaw](https://img.shields.io/badge/OpenClaw-Skill-blue.svg)](https://openclaw.ai)

## Common Errors This Fixes

❌ `memory_search failed: OpenAI API key not found`  
❌ `memory_search error: Google API key missing`  
❌ `memory_search tool failed with status 500`  
❌ `Cannot search memory files - API key required`  
❌ `memory_search not working in OpenClaw`

✅ **All fixed with QMS Memory Search - works offline, no API keys needed!**

## The Problem

OpenClaw's built-in `memory_search` fails when OpenAI/Google API keys are missing, leaving agents unable to search their memory files. Common issues include:

- **memory_search failing** with API key errors
- **Cannot search memory files** due to missing credentials  
- **memory_search tool failed** in OpenClaw installations
- **memory search not working** without external API setup

This affects many users who don't have or want to configure external API keys for basic memory search functionality.

## The Solution

QMS Memory Search provides a **local, offline alternative** using TF-IDF ranking for intelligent search relevance. No API keys required!

## ✨ Features

- **🔍 TF-IDF Search Ranking** - Smart relevance scoring, not just keyword matching
- **⚡ Lightning Fast** - <10ms queries vs 500ms+ API calls  
- **🔄 Auto-Indexing** - Rebuilds when memory files change
- **🔒 Fully Offline** - No API keys or external dependencies required
- **📋 Compatible API** - Drop-in replacement, same result format
- **🎯 Context-Aware** - Returns line numbers and snippets for precise results

## 🛠️ Quick Start

1. **Install the skill:**
   ```bash
   # Download or clone this repo to your OpenClaw skills directory
   git clone https://github.com/bsharpe/openclaw-qms-memory.git skills/qms-memory
   ```

2. **Test installation:**
   ```bash
   cd skills/qms-memory
   node test.js
   ```

3. **Use in your agent:**
   ```javascript
   import { searchMemory } from './skills/qms-memory/index.js';
   
   // Search memory files
   const results = await searchMemory("security best practices");
   
   // Each result contains:
   // {
   //   path: "/path/to/memory/file.md",
   //   score: 0.234,
   //   lineNumbers: [15, 16, 17], 
   //   snippets: ["Context around matches..."]
   // }
   ```

## 📖 What Gets Indexed

Automatically finds and indexes:
- `MEMORY.md` (main memory file)
- `memory/*.md` (daily notes and organized memories)
- Any markdown files in memory directories

## 🔧 Replace Built-in Memory Search

### In Your Code
```javascript
// OLD: Failing built-in version
const results = await memory_search("query");

// NEW: Working QMS version  
import { searchMemory } from './skills/qms-memory/index.js';
const results = await searchMemory("query");
```

### In Your Config
Disable the broken built-in search to stop API key errors:
```json
{
  "memorySearch": {
    "sources": []
  }
}
```

Then restart OpenClaw:
```bash
openclaw gateway restart
```

## 📊 Performance Comparison

| Metric | Built-in memory_search | QMS Memory Search |
|--------|----------------------|-------------------|
| **Reliability** | ❌ Fails without API keys | ✅ Always works |
| **Speed** | ❌ 500ms+ API calls | ✅ <10ms queries |
| **Ranking** | ❌ Simple text matching | ✅ TF-IDF relevance |
| **Dependencies** | ❌ External APIs required | ✅ Fully offline |
| **Setup** | ❌ API key configuration | ✅ Zero configuration |

## 🧪 Example Usage

```javascript
import { searchMemory, getMemorySearchStatus, rebuildMemoryIndex } from './skills/qms-memory/index.js';

// Check system status
const status = await getMemorySearchStatus();
console.log(status);
// { ready: true, docCount: 12, indexSize: 1500, watching: true }

// Search with automatic relevance ranking
const results = await searchMemory("prompt injection security");
console.log(`Found ${results.length} relevant documents`);

// Force index rebuild if needed
await rebuildMemoryIndex();
```

## 🔧 API Reference

### `searchMemory(query, options)`
Search memory files with TF-IDF ranking.

**Parameters:**
- `query` (string) - Search query
- `options` (object, optional)
  - `limit` (number) - Max results to return (default: 10)
  - `scoreThreshold` (number) - Minimum relevance score (default: 0.01)

**Returns:** Array of search results with `path`, `score`, `lineNumbers`, `snippets`

### `getMemorySearchStatus()`
Get current system status.

**Returns:** Object with `ready`, `docCount`, `indexSize`, `watching`

### `rebuildMemoryIndex()`
Force rebuild of search index.

**Returns:** Object with `success` status and updated stats

## 🔧 Troubleshooting

### "memory_search not working" / "memory search failing"
- Replace built-in memory_search with QMS: `import { searchMemory } from './skills/qms-memory/index.js';`
- Disable broken built-in: `{"memorySearch": {"sources": []}}`

### "memory_search API key error" / "OpenAI API key not found"  
- QMS Memory Search requires **no API keys** - works completely offline
- Zero configuration needed - just install and use

### "cannot search memory files" / "memory_search tool failed"
- Ensure memory files exist (`MEMORY.md`, `memory/*.md`) in workspace root
- Check that files contain the terms you're searching for  
- Try `await rebuildMemoryIndex()` to force refresh

### Index Not Updating  
- File watcher auto-rebuilds with 2s debounce
- Restart OpenClaw if file watching seems stuck
- Manual rebuild: `await rebuildMemoryIndex()`

### Permission Issues
- Ensure write access to skill directory for index file
- Check Node.js file system permissions

## 🛡️ Why Local Search Matters

**Privacy:** Your memory files never leave your machine
**Reliability:** No network dependencies or API rate limits  
**Speed:** Local TF-IDF indexing beats remote API calls
**Cost:** No API usage fees or token consumption
**Control:** Full control over indexing and search behavior

## 🔍 Search Keywords

`OpenClaw memory search broken` | `memory_search failing` | `memory search fix` | `OpenClaw API key error` | `memory_search not working` | `local memory search` | `offline memory search` | `TF-IDF search OpenClaw` | `memory_search alternative` | `no API key memory search` | `OpenClaw memory search replacement` | `memory search without API keys`

## 🤝 Contributing

Contributions welcome! This skill helps the entire OpenClaw community.

- **Report bugs** via GitHub Issues
- **Suggest features** for memory search improvements  
- **Submit PRs** for optimizations and fixes
- **Share usage patterns** that could benefit others

## 📄 License

MIT License - Free for personal and commercial use.

## 🔗 Links

- **OpenClaw:** https://openclaw.ai
- **Documentation:** https://docs.openclaw.ai  
- **Community:** https://discord.com/invite/clawd
- **Skills Hub:** https://clawhub.com

---

**🎉 Enjoy reliable, fast memory search without API dependencies!**

*Built by the OpenClaw community, for the OpenClaw community.*