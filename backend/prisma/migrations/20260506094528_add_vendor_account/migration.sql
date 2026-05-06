-- AlterTable
ALTER TABLE `expense` ADD COLUMN `mpesaPaidTo` VARCHAR(191) NULL,
    ADD COLUMN `paymentStatus` VARCHAR(191) NOT NULL DEFAULT 'pending',
    ADD COLUMN `vendorAccountId` INTEGER NULL;

-- CreateTable
CREATE TABLE `VendorAccount` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `identifier` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `VendorAccount_identifier_key`(`identifier`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Expense` ADD CONSTRAINT `Expense_vendorAccountId_fkey` FOREIGN KEY (`vendorAccountId`) REFERENCES `VendorAccount`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
