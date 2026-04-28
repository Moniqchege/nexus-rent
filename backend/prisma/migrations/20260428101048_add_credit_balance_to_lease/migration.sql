/*
  Warnings:

  - You are about to drop the column `tenantId` on the `paymentreference` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `review` table. All the data in the column will be lost.
  - You are about to drop the `tenant` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `userId` to the `PaymentReference` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Review` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `review` DROP FOREIGN KEY `Review_tenantId_fkey`;

-- DropForeignKey
ALTER TABLE `tenant` DROP FOREIGN KEY `Tenant_propertyId_fkey`;

-- DropForeignKey
ALTER TABLE `tenant` DROP FOREIGN KEY `Tenant_userId_fkey`;

-- DropIndex
DROP INDEX `Review_tenantId_fkey` ON `review`;

-- AlterTable
ALTER TABLE `lease` ADD COLUMN `creditBalance` DOUBLE NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `paymentreference` DROP COLUMN `tenantId`,
    ADD COLUMN `userId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `review` DROP COLUMN `tenantId`,
    ADD COLUMN `userId` INTEGER NOT NULL;

-- DropTable
DROP TABLE `tenant`;

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentReference` ADD CONSTRAINT `PaymentReference_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentReference` ADD CONSTRAINT `PaymentReference_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `Property`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
