# Database Management Guide

This guide explains how to manage the application's Firestore database data, including performing backups and restoring data.

## Scripts

We provide utility scripts to backup and restore the Firestore database. These scripts are located in the `scripts/` directory and can be executed via npm/pnpm commands.

### Backup

To create a backup of your Firestore database (including all collections and subcollections defined in the schema):

```bash
npm run db:backup
# or
pnpm db:backup
```

**What it does:**
1.  Connects to the Firestore project defined in your `.env.local`.
2.  Fetches all documents from the root collections: `companies`, `problems`, `users`, `contact-messages`.
3.  Fetches known subcollections (e.g., `users/{userId}/bookmarkedProblems`).
4.  Serializes the data (converting Firestore Timestamps to ISO strings).
5.  Calculates a SHA-256 checksum for integrity verification.
6.  Saves the backup as a JSON file in the project root: `firestore-backup-YYYY-MM-DDTHH-mm-ss-mssZ.json`.

**Output:**
The script generates a JSON file with the following structure:
```json
{
  "metadata": {
    "timestamp": "2024-03-20T10:00:00.000Z",
    "version": "1.1.0",
    "counts": { ... },
    "checksum": "...",
    "environment": "your-project-id"
  },
  "data": {
    "companies": { ... },
    "problems": { ... },
    ...
  }
}
```

### Restore

To restore data from a backup file:

```bash
npm run db:restore [backup-file.json] [-- --force]
# or
pnpm db:restore [backup-file.json] [-- --force]
```

**Arguments:**
-   `backup-file.json` (Optional): The path to the backup file to restore. If not provided, the script uses the most recent backup file found in the current directory.
-   `--force`: Skips checksum verification warnings and forces the restore even if integrity checks fail.

**⚠️ WARNING: Destructive Operation**
The restore script utilizes `setDoc` which will **overwrite** existing documents with the data from the backup. It does *not* delete documents that exist in the database but not in the backup (it is an upset/merge at the collection level, but a replacement at the document level).

**What it does:**
1.  Reads the specified (or latest) backup file.
2.  Verifies the SHA-256 checksum against the metadata.
3.  Writes data back to Firestore in batches (500 operations per batch) to ensure efficiency and respect Firestore limits.
4.  Restores subcollections.

### Troubleshooting

-   **Permission Denied:** Ensure your local environment has valid credentials. The scripts utilize `src/lib/firebase.ts` which expects standard Firebase env vars.
-   **Firestore not initialized:** Check if `.env.local` is correctly set up with all required Firebase configuration keys.
-   **Checksum Mismatch:** If the restore script reports a checksum failure, the backup file might have been modified manually or corrupted. Use `--force` only if you are sure the data is safe to restore.
