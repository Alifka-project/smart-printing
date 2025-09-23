-- AlterTable
ALTER TABLE "Finishing" ADD COLUMN "cost" REAL;

-- AlterTable
ALTER TABLE "Paper" ADD COLUMN "enteredSheets" INTEGER;
ALTER TABLE "Paper" ADD COLUMN "inputHeight" REAL;
ALTER TABLE "Paper" ADD COLUMN "inputWidth" REAL;
ALTER TABLE "Paper" ADD COLUMN "outputHeight" REAL;
ALTER TABLE "Paper" ADD COLUMN "outputWidth" REAL;
ALTER TABLE "Paper" ADD COLUMN "pricePerPacket" REAL;
ALTER TABLE "Paper" ADD COLUMN "pricePerSheet" REAL;
ALTER TABLE "Paper" ADD COLUMN "recommendedSheets" INTEGER;
ALTER TABLE "Paper" ADD COLUMN "selectedColors" TEXT;
ALTER TABLE "Paper" ADD COLUMN "sheetsPerPacket" INTEGER;

-- AlterTable
ALTER TABLE "Quote" ADD COLUMN "colors" TEXT;

-- CreateTable
CREATE TABLE "QuoteOperational" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quoteId" TEXT NOT NULL,
    "plates" INTEGER,
    "units" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "QuoteOperational_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "QuoteOperational_quoteId_key" ON "QuoteOperational"("quoteId");
