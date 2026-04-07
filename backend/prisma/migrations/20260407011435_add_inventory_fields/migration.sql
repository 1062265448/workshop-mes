-- AlterTable
ALTER TABLE `NickelInventory` ADD COLUMN `batchNo` VARCHAR(191) NULL,
    ADD COLUMN `grade` VARCHAR(191) NULL,
    ADD COLUMN `inspectionDate` DATETIME(3) NULL,
    ADD COLUMN `location` VARCHAR(191) NULL,
    ADD COLUMN `pieceCount` INTEGER NULL,
    ADD COLUMN `specification` VARCHAR(191) NULL,
    ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'available',
    ADD COLUMN `weight` DECIMAL(10, 2) NULL;
