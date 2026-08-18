/*
  Warnings:

  - A unique constraint covering the columns `[renewedFromId]` on the table `Lease` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `lease` ADD COLUMN `cancelReason` VARCHAR(191) NULL,
    ADD COLUMN `cancelledAt` DATETIME(3) NULL,
    ADD COLUMN `renewedFromId` INTEGER NULL,
    MODIFY `status` VARCHAR(191) NOT NULL DEFAULT 'pending_signature';

-- CreateIndex
CREATE UNIQUE INDEX `Lease_renewedFromId_key` ON `Lease`(`renewedFromId`);

-- AddForeignKey
ALTER TABLE `Lease` ADD CONSTRAINT `Lease_renewedFromId_fkey` FOREIGN KEY (`renewedFromId`) REFERENCES `Lease`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
