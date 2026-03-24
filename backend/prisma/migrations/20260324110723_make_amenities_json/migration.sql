-- AlterTable
ALTER TABLE `property` ADD COLUMN `amenities` JSON NULL,
    ADD COLUMN `rating` DOUBLE NULL,
    ADD COLUMN `score` DOUBLE NULL;
