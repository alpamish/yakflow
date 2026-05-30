/*
  Warnings:

  - You are about to drop the column `amountBase` on the `VoyageExpense` table. All the data in the column will be lost.
  - You are about to drop the column `exchangeRate` on the `VoyageExpense` table. All the data in the column will be lost.
  - You are about to drop the column `amountBase` on the `VoyageRevenue` table. All the data in the column will be lost.
  - You are about to drop the column `exchangeRate` on the `VoyageRevenue` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "VoyageTEU" ADD COLUMN "notes" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Shipment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shipmentNumber" TEXT NOT NULL,
    "direction" TEXT NOT NULL DEFAULT 'import',
    "transportMode" TEXT NOT NULL DEFAULT 'sea',
    "customerId" TEXT,
    "shipper" TEXT,
    "consignee" TEXT,
    "notifyParty" TEXT,
    "bookingNumber" TEXT,
    "blNumber" TEXT,
    "awbNumber" TEXT,
    "cargoType" TEXT,
    "imoClass" TEXT,
    "originCountry" TEXT,
    "destinationCountry" TEXT,
    "portOfLoading" TEXT,
    "portOfDischarge" TEXT,
    "finalDestination" TEXT,
    "etd" DATETIME,
    "eta" DATETIME,
    "vesselName" TEXT,
    "voyageNumber" TEXT,
    "voyageId" TEXT,
    "freeDays" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "remarks" TEXT,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Shipment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Shipment_voyageId_fkey" FOREIGN KEY ("voyageId") REFERENCES "Voyage" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Shipment" ("awbNumber", "blNumber", "bookingNumber", "cargoType", "consignee", "createdAt", "createdBy", "customerId", "destinationCountry", "direction", "eta", "etd", "finalDestination", "freeDays", "id", "imoClass", "notifyParty", "originCountry", "portOfDischarge", "portOfLoading", "remarks", "shipmentNumber", "shipper", "status", "transportMode", "updatedAt", "vesselName", "voyageNumber") SELECT "awbNumber", "blNumber", "bookingNumber", "cargoType", "consignee", "createdAt", "createdBy", "customerId", "destinationCountry", "direction", "eta", "etd", "finalDestination", "freeDays", "id", "imoClass", "notifyParty", "originCountry", "portOfDischarge", "portOfLoading", "remarks", "shipmentNumber", "shipper", "status", "transportMode", "updatedAt", "vesselName", "voyageNumber" FROM "Shipment";
DROP TABLE "Shipment";
ALTER TABLE "new_Shipment" RENAME TO "Shipment";
CREATE UNIQUE INDEX "Shipment_shipmentNumber_key" ON "Shipment"("shipmentNumber");
CREATE TABLE "new_VoyageExpense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "voyageId" TEXT NOT NULL,
    "expenseType" TEXT NOT NULL,
    "vendorId" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "amount" REAL NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "weight" REAL,
    "description" TEXT,
    "invoiceNumber" TEXT,
    "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
    "expenseDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VoyageExpense_voyageId_fkey" FOREIGN KEY ("voyageId") REFERENCES "Voyage" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VoyageExpense_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_VoyageExpense" ("amount", "createdAt", "currency", "description", "expenseDate", "expenseType", "id", "invoiceNumber", "paymentStatus", "updatedAt", "vendorId", "voyageId") SELECT "amount", "createdAt", "currency", "description", "expenseDate", "expenseType", "id", "invoiceNumber", "paymentStatus", "updatedAt", "vendorId", "voyageId" FROM "VoyageExpense";
DROP TABLE "VoyageExpense";
ALTER TABLE "new_VoyageExpense" RENAME TO "VoyageExpense";
CREATE TABLE "new_VoyageRevenue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "voyageId" TEXT NOT NULL,
    "teuRecordId" TEXT,
    "revenueType" TEXT NOT NULL,
    "customerId" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "amount" REAL NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "weight" REAL,
    "description" TEXT,
    "invoiceNumber" TEXT,
    "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
    "dueDate" DATETIME,
    "revenueDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VoyageRevenue_voyageId_fkey" FOREIGN KEY ("voyageId") REFERENCES "Voyage" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VoyageRevenue_teuRecordId_fkey" FOREIGN KEY ("teuRecordId") REFERENCES "VoyageTEU" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "VoyageRevenue_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_VoyageRevenue" ("amount", "createdAt", "currency", "description", "id", "invoiceNumber", "paymentStatus", "revenueDate", "revenueType", "updatedAt", "voyageId") SELECT "amount", "createdAt", "currency", "description", "id", "invoiceNumber", "paymentStatus", "revenueDate", "revenueType", "updatedAt", "voyageId" FROM "VoyageRevenue";
DROP TABLE "VoyageRevenue";
ALTER TABLE "new_VoyageRevenue" RENAME TO "VoyageRevenue";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
