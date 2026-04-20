-- AlterTable
ALTER TABLE `payment` ADD COLUMN `allocated` DOUBLE NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `rentschedule` ADD COLUMN `allocatedAmount` DOUBLE NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `tenant` ADD COLUMN `creditBalance` DOUBLE NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `PaymentAllocation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `paymentId` INTEGER NOT NULL,
    `scheduleId` INTEGER NOT NULL,
    `amount` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PaymentAllocation_paymentId_idx`(`paymentId`),
    INDEX `PaymentAllocation_scheduleId_idx`(`scheduleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Lease` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `lateFeePercent` DOUBLE NOT NULL,
    `graceDays` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PaymentAllocation` ADD CONSTRAINT `PaymentAllocation_paymentId_fkey` FOREIGN KEY (`paymentId`) REFERENCES `Payment`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentAllocation` ADD CONSTRAINT `PaymentAllocation_scheduleId_fkey` FOREIGN KEY (`scheduleId`) REFERENCES `RentSchedule`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
