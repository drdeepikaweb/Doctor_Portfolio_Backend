-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "aadhaar_no" TEXT,
ADD COLUMN     "consultation_fee" INTEGER,
ADD COLUMN     "id_document_url" TEXT,
ADD COLUMN     "payment_category" TEXT,
ADD COLUMN     "preferred_time" TEXT,
ADD COLUMN     "razorpay_order_id" TEXT,
ADD COLUMN     "razorpay_payment_id" TEXT,
ADD COLUMN     "razorpay_signature" TEXT;

-- AlterTable
ALTER TABLE "consultations" ADD COLUMN     "aadhaar_no" TEXT,
ADD COLUMN     "id_document_url" TEXT,
ADD COLUMN     "razorpay_order_id" TEXT,
ADD COLUMN     "razorpay_payment_id" TEXT,
ADD COLUMN     "razorpay_signature" TEXT;

-- CreateTable
CREATE TABLE "settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("key")
);
