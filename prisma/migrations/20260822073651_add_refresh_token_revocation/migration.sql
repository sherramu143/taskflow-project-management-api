-- AlterTable
ALTER TABLE "refresh_tokens" ADD COLUMN     "revoked_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens"("expires_at");
