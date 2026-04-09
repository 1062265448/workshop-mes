-- CreateTable
CREATE TABLE `in_product_task_jg` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `task_id` INTEGER NULL,
    `equip_type` INTEGER NULL,
    `level` INTEGER NULL,
    `size` INTEGER NULL,
    `weight` DOUBLE NULL,
    `product_name` INTEGER NULL,
    `create_time` DATETIME(3) NULL,
    `create_user` INTEGER NULL,
    `update_user` INTEGER NULL,
    `update_time` DATETIME(3) NULL,
    `is_del` INTEGER NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `in_product_task_jz` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `task_id` INTEGER NULL,
    `product_name` INTEGER NULL,
    `weight` DOUBLE NULL,
    `create_time` DATETIME(3) NULL,
    `create_user` INTEGER NULL,
    `update_user` INTEGER NULL,
    `update_time` DATETIME(3) NULL,
    `is_del` INTEGER NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
