-- AlterTable
ALTER TABLE "ShipmentRevenue" ADD COLUMN "quantity" REAL NOT NULL DEFAULT 1;
ALTER TABLE "ShipmentRevenue" ADD COLUMN "unitPrice" REAL NOT NULL DEFAULT 0;
ALTER TABLE "ShipmentRevenue" ADD COLUMN "notes" TEXT;

-- Backfill: set quantity=1, unitPrice=amount for existing rows
UPDATE "ShipmentRevenue" SET "quantity" = 1 WHERE "quantity" IS NULL;
UPDATE "ShipmentRevenue" SET "unitPrice" = "amount" WHERE "unitPrice" IS NULL;

-- Drop old columns
ALTER TABLE "ShipmentRevenue" DROP COLUMN "currency";
ALTER TABLE "ShipmentRevenue" DROP COLUMN "exchangeRate";
ALTER TABLE "ShipmentRevenue" DROP COLUMN "tax";
ALTER TABLE "ShipmentRevenue" DROP COLUMN "amountBase";
ALTER TABLE "ShipmentRevenue" DROP COLUMN "taxBase";
