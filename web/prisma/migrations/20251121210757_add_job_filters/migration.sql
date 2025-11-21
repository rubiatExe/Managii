-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "category" TEXT,
ADD COLUMN     "isRelevant" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "location" TEXT;
