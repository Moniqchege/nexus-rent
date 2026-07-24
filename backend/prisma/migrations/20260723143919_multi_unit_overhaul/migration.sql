/*
  Warnings:

  - You are about to drop the column `baths` on the `property` table. All the data in the column will be lost.
  - You are about to drop the column `beds` on the `property` table. All the data in the column will be lost.
  - You are about to drop the column `floor` on the `property` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `property` table. All the data in the column will be lost.
  - You are about to drop the column `sqft` on the `property` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `lease` ADD COLUMN `depositAmount` DOUBLE NULL,
    ADD COLUMN `unitTypeId` INTEGER NULL;

-- AlterTable
ALTER TABLE `property` DROP COLUMN `baths`,
    DROP COLUMN `beds`,
    DROP COLUMN `floor`,
    DROP COLUMN `price`,
    DROP COLUMN `sqft`,
    ADD COLUMN `floors` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `UnitType` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `propertyId` INTEGER NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `baths` INTEGER NOT NULL,
    `price` DOUBLE NOT NULL,
    `totalUnits` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `UnitType_propertyId_idx`(`propertyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Lease_unitTypeId_idx` ON `Lease`(`unitTypeId`);

-- AddForeignKey
ALTER TABLE `UnitType` ADD CONSTRAINT `UnitType_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `Property`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Lease` ADD CONSTRAINT `Lease_unitTypeId_fkey` FOREIGN KEY (`unitTypeId`) REFERENCES `UnitType`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
