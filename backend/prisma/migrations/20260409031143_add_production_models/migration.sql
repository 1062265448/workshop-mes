-- CreateTable
CREATE TABLE `in_batch_analys` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `day` VARCHAR(191) NULL,
    `day_time` DATETIME(3) NULL,
    `workshop` INTEGER NULL,
    `productline` INTEGER NULL,
    `batch_no` VARCHAR(191) NULL,
    `level` INTEGER NULL,
    `product_name` INTEGER NULL,
    `analys_user` VARCHAR(191) NULL,
    `analys_no` VARCHAR(191) NULL,
    `analys_result` INTEGER NULL,
    `down_batch_no` VARCHAR(191) NULL,
    `batch_create_time` DATETIME(3) NULL,
    `no` INTEGER NULL,
    `remark` TEXT NULL,
    `create_user` INTEGER NULL,
    `create_time` DATETIME(3) NULL,
    `update_user` INTEGER NULL,
    `update_time` DATETIME(3) NULL,
    `is_del` INTEGER NULL DEFAULT 0,
    `cu` VARCHAR(191) NULL,
    `co` VARCHAR(191) NULL,
    `s` VARCHAR(191) NULL,
    `pb` VARCHAR(191) NULL,
    `zn` VARCHAR(191) NULL,
    `ass` VARCHAR(191) NULL,
    `bi` VARCHAR(191) NULL,
    `sb` VARCHAR(191) NULL,
    `mn` VARCHAR(191) NULL,
    `cd` VARCHAR(191) NULL,
    `fe` VARCHAR(191) NULL,
    `mg` VARCHAR(191) NULL,
    `al` VARCHAR(191) NULL,
    `si` VARCHAR(191) NULL,
    `c` VARCHAR(191) NULL,
    `p` VARCHAR(191) NULL,
    `sn` VARCHAR(191) NULL,
    `other` VARCHAR(191) NULL,
    `nico` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `in_product_plan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `is_workshop` INTEGER NULL,
    `workshop` INTEGER NULL,
    `productline` INTEGER NULL,
    `plan_month` VARCHAR(191) NULL,
    `plan_month_time` DATETIME(3) NULL,
    `plan_weight` DOUBLE NULL,
    `category` INTEGER NULL,
    `create_user` INTEGER NULL,
    `create_time` DATETIME(3) NULL,
    `update_user` INTEGER NULL,
    `update_time` DATETIME(3) NULL,
    `is_del` INTEGER NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `in_product_task` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `day` VARCHAR(191) NULL,
    `day_time` DATETIME(3) NULL,
    `team` INTEGER NULL,
    `plan_time` DATETIME(3) NULL,
    `finish_time` DATETIME(3) NULL,
    `distribute_user` VARCHAR(191) NULL,
    `distribute_time` DATETIME(3) NULL,
    `task_user` VARCHAR(191) NULL,
    `task_time` DATETIME(3) NULL,
    `remark` TEXT NULL,
    `create_user` INTEGER NULL,
    `create_time` DATETIME(3) NULL,
    `update_user` INTEGER NULL,
    `update_time` DATETIME(3) NULL,
    `is_del` INTEGER NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
