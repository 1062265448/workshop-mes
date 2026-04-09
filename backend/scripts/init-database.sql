-- ============================================
-- 镍冶炼厂成品车间管理系统 - 数据库初始化脚本
-- 版本：v1.4.0
-- 创建时间：2026-04-09
-- ============================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 如果数据库不存在则创建
CREATE DATABASE IF NOT EXISTS `workshop_mes` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE `workshop_mes`;

-- ============================================
-- 1. 车间表
-- ============================================
DROP TABLE IF EXISTS `workshop`;
CREATE TABLE `workshop` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `workshop_code` VARCHAR(20) NOT NULL COMMENT '车间代码',
  `workshop_name` VARCHAR(100) NOT NULL COMMENT '车间名称',
  `workshop_type` ENUM('电解', '电积') COMMENT '车间类型',
  `sort_order` INT DEFAULT 0 COMMENT '排序顺序',
  `is_active` TINYINT DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`workshop_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='车间表';

INSERT INTO `workshop` (`workshop_code`, `workshop_name`, `workshop_type`, `sort_order`) VALUES
('DY1', '电解一车间', '电解', 1),
('DY2', '电解二车间', '电解', 2),
('DY3', '电解三车间', '电解', 3),
('DY3_DJ', '电解三车间电积', '电积', 4),
('DJ1', '电积一车间', '电积', 5),
('DJ2', '电积二车间', '电积', 6),
('DJ1_128', '电积一车间 (128)', '电积', 7);

-- ============================================
-- 2. 产品规格表
-- ============================================
DROP TABLE IF EXISTS `product_spec`;
CREATE TABLE `product_spec` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `product_code` VARCHAR(20) NOT NULL COMMENT '产品代码',
  `product_name` VARCHAR(100) NOT NULL COMMENT '产品名称',
  `spec_type` ENUM('正板', '镍条', '小块镍', '大板', '块状', '镍扣') COMMENT '规格类型',
  `spec_detail` VARCHAR(50) COMMENT '规格明细',
  `category` ENUM('普通', '电镀专用', '高合金', '含硫') DEFAULT '普通' COMMENT '产品类别',
  `sub_category` VARCHAR(50) COMMENT '子类别',
  `need_export_domestic` TINYINT DEFAULT 0 COMMENT '是否需要出口/国内统计',
  `need_size_breakdown` TINYINT DEFAULT 0 COMMENT '是否需要规格细分统计',
  `unit` VARCHAR(20) DEFAULT '吨' COMMENT '计量单位',
  `sort_order` INT DEFAULT 0 COMMENT '排序顺序',
  `is_active` TINYINT DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_code` (`product_code`),
  KEY `idx_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='产品规格表';

INSERT INTO `product_spec` (`product_code`, `product_name`, `spec_type`, `spec_detail`, `category`, `sub_category`, `need_export_domestic`, `need_size_breakdown`, `sort_order`) VALUES
-- 9996 产品
('9996', '电解镍 9996', '正板', '', '普通', NULL, 1, 0, 1),
('9996', '电解镍 9996', '镍条', '', '普通', NULL, 1, 0, 2),
('9996', '电解镍 9996', '小块镍', '100*100', '普通', NULL, 1, 1, 3),
('9996', '电解镍 9996', '小块镍', '50*50', '普通', NULL, 1, 1, 4),
('9996', '电解镍 9996', '小块镍', '20*20', '普通', NULL, 1, 1, 5),
('9996', '电解镍 9996', '小块镍', '15*15', '普通', NULL, 1, 1, 6),
-- 9997 产品 (电镀专用)
('9997', '电镀专用镍', '正板', '', '电镀专用', NULL, 1, 0, 7),
('9997', '电镀专用镍', '镍条', '', '电镀专用', NULL, 1, 0, 8),
('9997', '电镀专用镍', '大板', '', '电镀专用', '二镍', 0, 0, 9),
('9997', '电镀专用镍', '大板', '', '电镀专用', '一镍', 0, 0, 10),
('9997', '电镀专用镍', '大板', '', '电镀专用', '加压', 0, 0, 11),
('9997', '电镀专用镍', '小块镍', '100*10', '电镀专用', NULL, 0, 0, 12),
-- 9990 产品
('9990', '电解镍 9990', '正板', '', '普通', NULL, 1, 0, 13),
('9990', '电解镍 9990', '镍条', '', '普通', NULL, 1, 0, 14),
-- 9950 产品
('9950', '电解镍 9950', '正板', '', '普通', NULL, 1, 0, 15),
('9950', '电解镍 9950', '镍条', '', '普通', NULL, 1, 0, 16),
-- 9920 产品
('9920', '电解镍 9920', '正板', '', '普通', NULL, 1, 0, 17),
('9920', '电解镍 9920', '镍条', '', '普通', NULL, 1, 0, 18),
-- 高合金产品
('高合金', '高温合金镍', '块状', '', '高合金', NULL, 0, 0, 19),
('高合金', '高温合金 100*100 小块镍', '小块镍', '100*100', '高合金', NULL, 0, 0, 20),
-- 含硫产品
('含硫', '含硫镍块', '块状', '', '含硫', NULL, 0, 0, 21),
-- 镍扣
('镍扣', '镍扣', '镍扣', '', '普通', NULL, 0, 0, 22);

-- ============================================
-- 3. 入库记录表
-- ============================================
DROP TABLE IF EXISTS `inbound_record`;
CREATE TABLE `inbound_record` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `record_date` DATE NOT NULL COMMENT '记录日期',
  `workshop_id` INT NOT NULL COMMENT '车间 ID',
  `product_spec_id` INT NOT NULL COMMENT '产品规格 ID',
  `total_package_count` INT DEFAULT 0 COMMENT '总包数',
  `total_weight` DECIMAL(10,3) DEFAULT 0 COMMENT '总重量 (吨)',
  `export_package_count` INT DEFAULT 0 COMMENT '出口包数',
  `export_weight` DECIMAL(10,3) DEFAULT 0 COMMENT '出口重量',
  `domestic_package_count` INT DEFAULT 0 COMMENT '国内包数',
  `domestic_weight` DECIMAL(10,3) DEFAULT 0 COMMENT '国内重量',
  `remark` TEXT COMMENT '备注',
  `created_by` VARCHAR(50) COMMENT '创建人',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_date` (`record_date`),
  KEY `idx_workshop` (`workshop_id`),
  KEY `idx_product` (`product_spec_id`),
  CONSTRAINT `fk_inbound_workshop` FOREIGN KEY (`workshop_id`) REFERENCES `workshop` (`id`),
  CONSTRAINT `fk_inbound_product` FOREIGN KEY (`product_spec_id`) REFERENCES `product_spec` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='入库记录表';

-- ============================================
-- 4. 发运记录表
-- ============================================
DROP TABLE IF EXISTS `shipping_record`;
CREATE TABLE `shipping_record` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `ship_date` DATE NOT NULL COMMENT '发运日期',
  `workshop_id` INT NOT NULL COMMENT '车间 ID',
  `product_spec_id` INT NOT NULL COMMENT '产品规格 ID',
  `total_package_count` INT DEFAULT 0 COMMENT '总发运包数',
  `total_weight` DECIMAL(10,3) DEFAULT 0 COMMENT '总发运重量',
  `export_package_count` INT DEFAULT 0 COMMENT '出口包数',
  `export_weight` DECIMAL(10,3) DEFAULT 0 COMMENT '出口重量',
  `domestic_package_count` INT DEFAULT 0 COMMENT '国内包数',
  `domestic_weight` DECIMAL(10,3) DEFAULT 0 COMMENT '国内重量',
  `train_section_count` INT DEFAULT 0 COMMENT '火车节数',
  `container_count` INT DEFAULT 0 COMMENT '集装箱箱数',
  `truck_count` INT DEFAULT 0 COMMENT '自提车数',
  `remark` TEXT COMMENT '备注',
  `created_by` VARCHAR(50),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_date` (`ship_date`),
  CONSTRAINT `fk_shipping_workshop` FOREIGN KEY (`workshop_id`) REFERENCES `workshop` (`id`),
  CONSTRAINT `fk_shipping_product` FOREIGN KEY (`product_spec_id`) REFERENCES `product_spec` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='发运记录表';

-- ============================================
-- 5. 库存表
-- ============================================
DROP TABLE IF EXISTS `inventory`;
CREATE TABLE `inventory` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `inventory_date` DATE NOT NULL COMMENT '库存日期',
  `workshop_id` INT NOT NULL COMMENT '车间 ID',
  `product_spec_id` INT NOT NULL COMMENT '产品规格 ID',
  `total_package_count` INT DEFAULT 0 COMMENT '总库存包数',
  `total_weight` DECIMAL(10,3) DEFAULT 0 COMMENT '总库存重量',
  `export_package_count` INT DEFAULT 0 COMMENT '出口库存包数',
  `export_weight` DECIMAL(10,3) DEFAULT 0 COMMENT '出口库存重量',
  `domestic_package_count` INT DEFAULT 0 COMMENT '国内库存包数',
  `domestic_weight` DECIMAL(10,3) DEFAULT 0 COMMENT '国内库存重量',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_date_product` (`inventory_date`, `workshop_id`, `product_spec_id`),
  CONSTRAINT `fk_inventory_workshop` FOREIGN KEY (`workshop_id`) REFERENCES `workshop` (`id`),
  CONSTRAINT `fk_inventory_product` FOREIGN KEY (`product_spec_id`) REFERENCES `product_spec` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='库存表';

-- ============================================
-- 6. 专用镍统计表
-- ============================================
DROP TABLE IF EXISTS `special_nickel_stat`;
CREATE TABLE `special_nickel_stat` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `stat_date` DATE NOT NULL COMMENT '统计日期',
  `product_type` VARCHAR(100) NOT NULL COMMENT '产品类型',
  `workshop_id` INT COMMENT '关联车间 ID',
  `inbound_package` INT DEFAULT 0 COMMENT '入库包数',
  `inbound_weight` DECIMAL(10,3) DEFAULT 0 COMMENT '入库重量',
  `inbound_remark` VARCHAR(200) COMMENT '入库备注',
  `shipping_package` INT DEFAULT 0 COMMENT '发运包数',
  `shipping_weight` DECIMAL(10,3) DEFAULT 0 COMMENT '发运重量',
  `inventory_package` INT DEFAULT 0 COMMENT '库存包数',
  `inventory_weight` DECIMAL(10,3) DEFAULT 0 COMMENT '库存重量',
  `remark` TEXT COMMENT '备注',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_date` (`stat_date`),
  KEY `idx_product` (`product_type`),
  CONSTRAINT `fk_special_workshop` FOREIGN KEY (`workshop_id`) REFERENCES `workshop` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='专用镍统计表';

INSERT INTO `special_nickel_stat` (`product_type`) VALUES
('加压电镀专用镍 (大板)'),
('9996 小块镍 100*100'),
('9996 小块镍 50*50'),
('9996 小块镍 20*20'),
('9996 小块镍 15*15'),
('高温合金镍'),
('15*15 小块镍'),
('含硫镍块'),
('镍扣'),
('高温合金 100*100 小块镍');

-- ============================================
-- 7. 裁剪率统计表
-- ============================================
DROP TABLE IF EXISTS `cutting_rate_stat`;
CREATE TABLE `cutting_rate_stat` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `stat_date` DATE NOT NULL COMMENT '统计日期',
  `nickel_plate_type` VARCHAR(50) COMMENT '镍板规格',
  `cut_spec` VARCHAR(50) COMMENT '裁剪规格',
  `piece_count` INT DEFAULT 0 COMMENT '件数',
  `cutting_rate` DECIMAL(5,2) COMMENT '裁剪率 (%)',
  `unit` VARCHAR(20) DEFAULT '片' COMMENT '单位',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_date` (`stat_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='裁剪率统计表';

-- ============================================
-- 8. 装车明细表
-- ============================================
DROP TABLE IF EXISTS `loading_detail`;
CREATE TABLE `loading_detail` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `load_date` DATE NOT NULL COMMENT '装车日期',
  `transport_type` ENUM('火车', '集装箱', '自提') COMMENT '发运类型',
  `section_count` INT DEFAULT 0 COMMENT '节数',
  `weight` DECIMAL(10,3) DEFAULT 0 COMMENT '重量',
  `container_count` INT DEFAULT 0 COMMENT '箱数',
  `truck_count` INT DEFAULT 0 COMMENT '车数',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_date` (`load_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='装车明细表';

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- 完成提示
-- ============================================
SELECT '✅ 数据库初始化完成！' AS message;
SELECT '车间数量：' AS info, COUNT(*) AS count FROM workshop;
SELECT '产品规格数量：' AS info, COUNT(*) AS count FROM product_spec;
SELECT '专用镍产品类型：' AS info, COUNT(*) AS count FROM special_nickel_stat;
