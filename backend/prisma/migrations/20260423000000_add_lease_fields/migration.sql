-- AlterTable
ALTER TABLE `Lease` ADD COLUMN `propertyId` INTEGER NOT NULL,
    ADD COLUMN `tenantId` INTEGER NOT NULL,
    ADD COLUMN `startDate` DATETIME(3) NOT NULL,
    ADD COLUMN `endDate` DATETIME(3) NOT NULL,
    ADD COLUMN `rentAmount` DOUBLE NOT NULL,
    ADD COLUMN `billingCycle` VARCHAR(191) NOT NULL DEFAULT 'monthly',
    ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    ADD COLUMN `signedDocumentUrl` VARCHAR(191) NULL,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- AddForeignKey
ALTER TABLE `Lease` ADD CONSTRAINT `Lease_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `Property`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Lease` ADD CONSTRAINT `Lease_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX `Lease_propertyId_idx` ON `Lease`(`propertyId`);

-- CreateIndex
CREATE INDEX `Lease_tenantId_idx` ON `Lease`(`tenantId`);

-- CreateIndex
CREATE INDEX `Lease_status_idx` ON `Lease`(`status`);

