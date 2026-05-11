-- Backfill zahlungsToken for existing rows before adding NOT NULL constraint
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

-- Step 1: add nullable column so existing rows can be filled
ALTER TABLE "Rechnung" ADD COLUMN "zahlungsToken" TEXT;

-- Step 2: fill existing rows with unique random hex tokens
UPDATE "Rechnung" SET "zahlungsToken" = lower(hex(randomblob(16))) WHERE "zahlungsToken" IS NULL;

-- Step 3: rebuild table with NOT NULL + UNIQUE constraint
CREATE TABLE "new_Rechnung" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kundeId" TEXT NOT NULL,
    "betrag" REAL NOT NULL,
    "faelligkeitsdatum" DATETIME NOT NULL,
    "rechnungsnummer" TEXT NOT NULL,
    "zahlungsToken" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'offen',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Rechnung_kundeId_fkey" FOREIGN KEY ("kundeId") REFERENCES "Kunde" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Rechnung" ("betrag", "createdAt", "faelligkeitsdatum", "id", "kundeId", "rechnungsnummer", "zahlungsToken", "status", "updatedAt")
    SELECT "betrag", "createdAt", "faelligkeitsdatum", "id", "kundeId", "rechnungsnummer", "zahlungsToken", "status", "updatedAt" FROM "Rechnung";
DROP TABLE "Rechnung";
ALTER TABLE "new_Rechnung" RENAME TO "Rechnung";
CREATE UNIQUE INDEX "Rechnung_rechnungsnummer_key" ON "Rechnung"("rechnungsnummer");
CREATE UNIQUE INDEX "Rechnung_zahlungsToken_key" ON "Rechnung"("zahlungsToken");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
