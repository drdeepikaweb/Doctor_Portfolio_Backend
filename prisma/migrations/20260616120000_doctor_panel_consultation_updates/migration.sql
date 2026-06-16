-- AlterTable
ALTER TABLE "consultations" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "consultations" ADD COLUMN "document_urls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "consultations" ADD COLUMN "payment_category" TEXT;
ALTER TABLE "consultations" ADD COLUMN "consultation_fee" INTEGER;

-- Backfill existing single-document rows into the multi-document column.
UPDATE "consultations"
SET "document_urls" = ARRAY["document_url"]::TEXT[]
WHERE "document_url" IS NOT NULL AND "document_urls" = ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "doctors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "doctors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor_sessions" (
    "id" TEXT NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "doctor_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "doctors_email_key" ON "doctors"("email");

-- CreateIndex
CREATE UNIQUE INDEX "doctor_sessions_token_hash_key" ON "doctor_sessions"("token_hash");

-- CreateIndex
CREATE INDEX "doctor_sessions_doctor_id_idx" ON "doctor_sessions"("doctor_id");

-- AddForeignKey
ALTER TABLE "doctor_sessions" ADD CONSTRAINT "doctor_sessions_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
