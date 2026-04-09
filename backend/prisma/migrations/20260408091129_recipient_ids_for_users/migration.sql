/*
  Warnings:

  - You are about to drop the column `tenantIds` on the `notification` table. All the data in the column will be lost.
  - Added the required column `recipientIds` to the `Notification` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `notification` DROP COLUMN `tenantIds`,
    ADD COLUMN `recipientIds` JSON NOT NULL;

-- AlterTable
ALTER TABLE `user` ALTER COLUMN `role` DROP DEFAULT;
