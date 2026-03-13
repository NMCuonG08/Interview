/*
  Warnings:

  - A unique constraint covering the columns `[external_id]` on the table `couriers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[phone]` on the table `couriers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `couriers` will be added. If there are existing duplicate values, this will fail.
  - The required column `external_id` was added to the `couriers` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "couriers" ADD COLUMN     "approval_status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "email" TEXT,
ADD COLUMN     "external_id" UUID NOT NULL,
ADD COLUMN     "rejection_reason" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "couriers_external_id_key" ON "couriers"("external_id");

-- CreateIndex
CREATE UNIQUE INDEX "couriers_phone_key" ON "couriers"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "couriers_email_key" ON "couriers"("email");

-- CreateIndex
CREATE INDEX "couriers_approval_status_created_at_idx" ON "couriers"("approval_status", "created_at");
