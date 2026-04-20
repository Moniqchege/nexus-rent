-- CreateTable
CREATE TABLE `PaymentReference` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reference` VARCHAR(191) NOT NULL,
    `tenantId` INTEGER NOT NULL,
    `propertyId` INTEGER NOT NULL,

    UNIQUE INDEX `PaymentReference_reference_key`(`reference`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
