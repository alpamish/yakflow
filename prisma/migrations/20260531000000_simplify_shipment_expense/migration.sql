-- AlterTable
ALTER TABLE "ShipmentExpense" ADD COLUMN "quantity" REAL NOT NULL DEFAULT 1;
ALTER TABLE "ShipmentExpense" ADD COLUMN "unitPrice" REAL NOT NULL DEFAULT 0;

-- Backfill: set quantity=1, unitPrice=amount for existing rows
UPDATE "ShipmentExpense" SET "quantity" = 1 WHERE "quantity" IS NULL;
UPDATE "ShipmentExpense" SET "unitPrice" = "amount" WHERE "unitPrice" IS NULL;

-- Drop old columns
ALTER TABLE "ShipmentExpense" DROP COLUMN "currency";
ALTER TABLE "ShipmentExpense" DROP COLUMN "exchangeRate";
ALTER TABLE "ShipmentExpense" DROP COLUMN "tax";
ALTER TABLE "ShipmentExpense" DROP COLUMN "amountBase";
ALTER TABLE "ShipmentExpense" DROP COLUMN "taxBase";
