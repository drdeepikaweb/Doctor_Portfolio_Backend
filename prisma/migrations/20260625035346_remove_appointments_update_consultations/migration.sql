-- AlterTable
ALTER TABLE "consultations" DROP COLUMN "symptoms",
ADD COLUMN     "is_completed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_reconsultation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "preferred_date" TIMESTAMP(3),
ADD COLUMN     "preferred_time" TEXT,
ADD COLUMN     "submission_id" TEXT;

-- DropTable
DROP TABLE "appointments";
