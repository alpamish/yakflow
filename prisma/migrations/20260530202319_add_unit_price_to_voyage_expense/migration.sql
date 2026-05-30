-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_VoyageExpense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "voyageId" TEXT NOT NULL,
    "expenseType" TEXT NOT NULL,
    "vendorId" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "amount" REAL NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" REAL NOT NULL DEFAULT 0,
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
INSERT INTO "new_VoyageExpense" ("amount", "createdAt", "currency", "description", "expenseDate", "expenseType", "id", "invoiceNumber", "paymentStatus", "quantity", "updatedAt", "vendorId", "voyageId", "weight") SELECT "amount", "createdAt", "currency", "description", "expenseDate", "expenseType", "id", "invoiceNumber", "paymentStatus", "quantity", "updatedAt", "vendorId", "voyageId", "weight" FROM "VoyageExpense";
DROP TABLE "VoyageExpense";
ALTER TABLE "new_VoyageExpense" RENAME TO "VoyageExpense";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
