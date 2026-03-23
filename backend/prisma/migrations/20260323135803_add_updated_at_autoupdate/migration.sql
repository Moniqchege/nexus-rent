-- DropForeignKey
ALTER TABLE `notification` DROP FOREIGN KEY `Notification_landlordId_fkey`;

-- DropForeignKey
ALTER TABLE `property` DROP FOREIGN KEY `Property_landlordId_fkey`;

-- AlterTable
ALTER TABLE `notification` MODIFY `landlordId` INTEGER NULL;

-- AlterTable
ALTER TABLE `property` MODIFY `landlordId` INTEGER NULL;

-- CreateTable
CREATE TABLE `UserProperty` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `propertyId` INTEGER NOT NULL,
    `roleId` INTEGER NOT NULL,
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `UserProperty_userId_propertyId_roleId_key`(`userId`, `propertyId`, `roleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Property` ADD CONSTRAINT `Property_landlordId_fkey` FOREIGN KEY (`landlordId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_landlordId_fkey` FOREIGN KEY (`landlordId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserProperty` ADD CONSTRAINT `UserProperty_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserProperty` ADD CONSTRAINT `UserProperty_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `Property`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserProperty` ADD CONSTRAINT `UserProperty_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
