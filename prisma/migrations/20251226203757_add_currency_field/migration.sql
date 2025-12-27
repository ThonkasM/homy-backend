-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('BOB', 'USD', 'ARS', 'PEN', 'CLP', 'MXN', 'COP');

-- AlterTable
ALTER TABLE "properties" ADD COLUMN     "currency" "Currency" NOT NULL DEFAULT 'BOB';

-- CreateIndex
CREATE INDEX "properties_currency_idx" ON "properties"("currency");
