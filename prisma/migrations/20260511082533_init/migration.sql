-- CreateTable
CREATE TABLE "Kunde" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Rechnung" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kundeId" TEXT NOT NULL,
    "betrag" REAL NOT NULL,
    "faelligkeitsdatum" DATETIME NOT NULL,
    "rechnungsnummer" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'offen',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Rechnung_kundeId_fkey" FOREIGN KEY ("kundeId") REFERENCES "Kunde" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Mahnung" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rechnungId" TEXT NOT NULL,
    "stufe" INTEGER NOT NULL,
    "versandtAm" DATETIME,
    "kanal" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ausstehend',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Mahnung_rechnungId_fkey" FOREIGN KEY ("rechnungId") REFERENCES "Rechnung" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Rechnung_rechnungsnummer_key" ON "Rechnung"("rechnungsnummer");
