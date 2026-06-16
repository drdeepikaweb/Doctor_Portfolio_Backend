-- Make email optional for appointment and contact form submissions.
ALTER TABLE "appointments" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "contact_messages" ALTER COLUMN "email" DROP NOT NULL;
