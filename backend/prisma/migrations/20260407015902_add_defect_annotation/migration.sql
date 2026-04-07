-- AlterTable
ALTER TABLE `DefectSample` ADD COLUMN `fileSize` INTEGER NULL,
    ADD COLUMN `height` INTEGER NULL,
    ADD COLUMN `sourcePath` TEXT NULL,
    ADD COLUMN `thumbnailUrl` VARCHAR(191) NULL,
    ADD COLUMN `width` INTEGER NULL;

-- AlterTable
ALTER TABLE `DefectType` ADD COLUMN `color` VARCHAR(191) NULL DEFAULT '#ff0000',
    ADD COLUMN `thumbnailUrl` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `DefectAnnotation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sampleId` INTEGER NOT NULL,
    `defectTypeId` INTEGER NOT NULL,
    `x` DECIMAL(8, 4) NOT NULL,
    `y` DECIMAL(8, 4) NOT NULL,
    `width` DECIMAL(8, 4) NOT NULL,
    `height` DECIMAL(8, 4) NOT NULL,
    `confidence` DECIMAL(5, 4) NULL,
    `description` TEXT NULL,
    `annotatedBy` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `DefectAnnotation` ADD CONSTRAINT `DefectAnnotation_sampleId_fkey` FOREIGN KEY (`sampleId`) REFERENCES `DefectSample`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DefectAnnotation` ADD CONSTRAINT `DefectAnnotation_defectTypeId_fkey` FOREIGN KEY (`defectTypeId`) REFERENCES `DefectType`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
