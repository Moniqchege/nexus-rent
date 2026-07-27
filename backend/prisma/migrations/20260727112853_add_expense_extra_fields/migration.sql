-- AlterTable
ALTER TABLE `expense` ADD COLUMN `invoiceNumber` VARCHAR(191) NULL,
    ADD COLUMN `unit` VARCHAR(191) NULL,
    ADD COLUMN `vendorDescription` VARCHAR(191) NULL,
    ADD COLUMN `vendorEmail` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `Expense_paymentStatus_idx` ON `Expense`(`paymentStatus`);
