-- AlterTable
ALTER TABLE `FavoritePlayer` ADD COLUMN `goals` INTEGER NULL,
    ADD COLUMN `position` VARCHAR(191) NULL,
    ADD COLUMN `rating` DECIMAL(3, 1) NULL;
