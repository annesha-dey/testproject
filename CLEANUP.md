# Cleanup Instructions

## Removing the Old `web/` Directory

The old `web/` directory is no longer needed after restructuring to `backend/` and `frontend/`. However, it may be locked by running processes.

### Steps to Remove:

1. **Stop all running processes:**
   ```bash
   # Stop any running dev servers
   # Press Ctrl+C in any terminal running npm/shopify commands
   ```

2. **Close VS Code or any IDEs** that might have the directory open

3. **Close File Explorer** windows showing the `web/` directory

4. **Check for running Node processes:**
   ```bash
   # Windows
   tasklist | findstr node
   
   # Kill specific process if needed
   taskkill /F /PID <process_id>
   ```

5. **Try removing again:**
   ```bash
   # Windows Command Prompt
   rmdir /s /q web
   
   # Or PowerShell
   Remove-Item -Recurse -Force web
   
   # Or Git Bash
   rm -rf web
   ```

### If Still Locked:

**Option 1: Restart your computer** - This will release all file locks

**Option 2: Use a file unlocker tool** like:
- LockHunter (Windows)
- Unlocker (Windows)

**Option 3: Leave it for now** - The `web/` directory is already ignored in `.gitignore`, so it won't affect your development or git commits. You can delete it later when convenient.

### Verify Database Migration:

Make sure the database file was copied successfully:
```bash
# Check if database exists in backend
ls -la backend/database.sqlite

# Or Windows
dir backend\database.sqlite
```

If the file doesn't exist, copy it manually:
```bash
# Windows Command Prompt
copy web\database.sqlite backend\database.sqlite

# Or PowerShell
Copy-Item web\database.sqlite backend\database.sqlite

# Or Git Bash
cp web/database.sqlite backend/database.sqlite
```

## What's Safe to Delete:

After successfully removing `web/`, these are the only directories you need:
- ✅ `backend/` - Your Express server
- ✅ `frontend/` - Your React app
- ✅ `node_modules/` - Dependencies (can be regenerated)
- ✅ `.shopify/` - Shopify CLI cache

Everything else at the root level (config files, README, etc.) should be kept.
