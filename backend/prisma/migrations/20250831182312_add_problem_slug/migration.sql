/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Problem` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."ProblemLanguage_problemId_languageId_key";

-- DropIndex
DROP INDEX "public"."ProblemTag_problemId_tagId_key";

-- AlterTable
ALTER TABLE "public"."Problem" ADD COLUMN     "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Problem_slug_key" ON "public"."Problem"("slug");
