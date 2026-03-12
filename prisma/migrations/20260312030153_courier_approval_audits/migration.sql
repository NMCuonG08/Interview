-- CreateEnum
CREATE TYPE "CourierApprovalAction" AS ENUM ('APPROVE', 'REJECT');

-- CreateTable
CREATE TABLE "courier_approval_audits" (
    "id" SERIAL NOT NULL,
    "courier_id" INTEGER NOT NULL,
    "actor_user_id" INTEGER NOT NULL,
    "action" "CourierApprovalAction" NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "courier_approval_audits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "courier_approval_audits_courier_id_created_at_idx" ON "courier_approval_audits"("courier_id", "created_at");

-- CreateIndex
CREATE INDEX "courier_approval_audits_actor_user_id_created_at_idx" ON "courier_approval_audits"("actor_user_id", "created_at");

-- AddForeignKey
ALTER TABLE "courier_approval_audits" ADD CONSTRAINT "courier_approval_audits_courier_id_fkey" FOREIGN KEY ("courier_id") REFERENCES "couriers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courier_approval_audits" ADD CONSTRAINT "courier_approval_audits_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
