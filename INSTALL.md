# Installation Guide - QMS Memory Search

## Quick Install

1. **Download the skill:**
   ```bash
   # Clone or download the qms-memory skill files
   # to your OpenClaw workspace skills directory
   ```

2. **Place in skills directory:**
   ```bash
   cp -r qms-memory /path/to/your/openclaw/workspace/skills/
   ```

3. **Test the installation:**
   ```bash
   cd skills/qms-memory
   node test.js
   ```

## Usage in Your Agent

Replace failing memory_search calls:

```javascript
// OLD: Failing built-in version
const results = await memory_search("query");

// NEW: Working QMS version
import { searchMemory } from './skills/qms-memory/index.js';
const results = await searchMemory("query");
```

## Disable Built-in Memory Search

To stop API key errors, add to your OpenClaw config:

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

## Verification

The skill should automatically:
- Find MEMORY.md and memory/*.md files
- Build TF-IDF search index
- Start file watching for auto-updates
- Provide <10ms search queries

Check status:
```javascript
import { getMemorySearchStatus } from './skills/qms-memory/index.js';
console.log(await getMemorySearchStatus());
// Should show: { ready: true, docCount: N, indexSize: M, watching: true }
```

## Troubleshooting

**No memory files found:** 
- Ensure MEMORY.md or memory/*.md exist in workspace root
- Check file paths in console output

**Index not updating:**
- File watcher should auto-rebuild (2s debounce)
- Force rebuild: `await rebuildMemoryIndex()`

**Permission errors:**
- Ensure write access to skills/qms-memory/ directory for index file

## Support

Report issues or get help:
- OpenClaw Discord: https://discord.com/invite/clawd
- GitHub: https://github.com/openclaw/openclaw