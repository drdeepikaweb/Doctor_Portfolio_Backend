-- AlterTable
ALTER TABLE "consultations" ADD COLUMN     "payment_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "phonepe_transaction_id" TEXT;
