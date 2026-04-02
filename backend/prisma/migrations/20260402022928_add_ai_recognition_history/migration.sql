-- CreateTable
CREATE TABLE `AiRecognitionHistory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `imageUrl` VARCHAR(191) NOT NULL,
    `result` TEXT NOT NULL,
    `itemCount` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'success',
    `errorMessage` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
