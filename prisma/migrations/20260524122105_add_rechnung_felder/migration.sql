-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Rechnung" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kundeId" TEXT NOT NULL,
    "betrag" REAL NOT NULL,
    "faelligkeitsdatum" DATETIME NOT NULL,
    "rechnungsnummer" TEXT NOT NULL,
    "beschreibung" TEXT,
    "mwstSatz" INTEGER NOT NULL DEFAULT 19,
    "zahlungsToken" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'offen',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Rechnung_kundeId_fkey" FOREIGN KEY ("kundeId") REFERENCES "Kunde" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Rechnung" ("betrag", "createdAt", "faelligkeitsdatum", "id", "kundeId", "rechnungsnummer", "status", "updatedAt", "zahlungsToken") SELECT "betrag", "createdAt", "faelligkeitsdatum", "id", "kundeId", "rechnungsnummer", "status", "updatedAt", "zahlungsToken" FROM "Rechnung";
DROP TABLE "Rechnung";
ALTER TABLE "new_Rechnung" RENAME TO "Rechnung";
CREATE UNIQUE INDEX "Rechnung_rechnungsnummer_key" ON "Rechnung"("rechnungsnummer");
CREATE UNIQUE INDEX "Rechnung_zahlungsToken_key" ON "Rechnung"("zahlungsToken");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
