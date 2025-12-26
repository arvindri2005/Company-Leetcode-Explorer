# Vault Journal

## 2024-05-23: Initial Audit

### Fragility Points
- **Single Point of Failure:** Firestore is the primary database.
- **Backup Strategy:** Manual scripts exist (`scripts/backup-firestore.ts`). No automated cron job visible in the repo.
- **Soft Deletes:**
    - `Company` repository does NOT seem to expose a delete method, but memory said it has soft delete. I found `deleteDoc` imported but unused for deleting companies in `company.repository.ts`.
    - `User` repository uses `deleteDoc` and `batch.delete` for:
        - Removing bookmarks (`toggleBookmarkProblem` deletes the doc when unbookmarking).
        - Removing problem status (`setProblemStatus` deletes the doc when status is "none").
    - These "deletes" are actually just removing relationships/status, which might be fine as "Hard Delete" because they are lightweight associations.
    - However, `Education` and `WorkExperience` are just `addDoc` in repository. There is no `delete` or `update` for them exposed in `user.repository.ts` yet.
    - `JobApplication` is NOT implemented in repositories or actions yet.

### Opportunity
The `JobApplication` feature is defined in types but not implemented. I cannot add soft delete to it if it doesn't exist.

However, `scripts/backup-firestore.ts` is a manual script and it:
1.  Doesn't calculate checksums.
2.  Doesn't compress the output (JSON can be large).
3.  Doesn't verify the backup after creation.

### Selected Safeguard
**Improve `scripts/backup-firestore.ts` and `scripts/restore-firestore.ts`**.
I will:
1.  Add Checksum verification (SHA-256) to the backup file.
2.  Add a "Metadata" section to the backup file (version, date, record counts).
3.  Implement a verification step in the backup script that reads back the file and verifies the checksum.

This aligns with "Vault's Philosophy": "Assume a backup is working without verifying its checksum" -> "Never do".

### Plan
1.  Modify `scripts/backup-firestore.ts` to:
    -   Calculate SHA-256 checksum of the backup data.
    -   Include metadata (timestamp, counts, checksum) in the output.
    -   Verify the written file matches the checksum.
2.  Modify `scripts/restore-firestore.ts` to:
    -   Verify the checksum before restoring.
    -   Warn if checksum mismatch.
3.  Test the backup and restore scripts locally (dry run for restore).
