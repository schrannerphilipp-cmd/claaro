-- CreateTable
CREATE TABLE "SepaMandat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kundeId" TEXT NOT NULL,
    "kontoinhaber" TEXT NOT NULL,
    "iban" TEXT NOT NULL,
    "bic" TEXT NOT NULL,
    "datum" DATETIME NOT NULL,
    "unterschrift" BOOLEAN NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SepaMandat_kundeId_fkey" FOREIGN KEY ("kundeId") REFERENCES "Kunde" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "SepaMandat_kundeId_key" ON "SepaMandat"("kundeId");
