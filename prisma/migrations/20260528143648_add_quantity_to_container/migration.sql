-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Container" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shipmentId" TEXT NOT NULL,
    "containerNumber" TEXT NOT NULL,
    "containerType" TEXT NOT NULL DEFAULT '20DC',
    "containerSize" TEXT NOT NULL DEFAULT '20',
    "sealNumber" TEXT,
    "grossWeight" REAL,
    "netWeight" REAL,
    "volume" REAL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'empty',
    "currentLocation" TEXT,
    "deliveryStatus" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Container_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Container" ("containerNumber", "containerSize", "containerType", "createdAt", "currentLocation", "deliveryStatus", "grossWeight", "id", "netWeight", "sealNumber", "shipmentId", "status", "updatedAt", "volume") SELECT "containerNumber", "containerSize", "containerType", "createdAt", "currentLocation", "deliveryStatus", "grossWeight", "id", "netWeight", "sealNumber", "shipmentId", "status", "updatedAt", "volume" FROM "Container";
DROP TABLE "Container";
ALTER TABLE "new_Container" RENAME TO "Container";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
