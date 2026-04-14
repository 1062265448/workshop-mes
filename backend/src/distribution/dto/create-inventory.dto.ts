import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  Min,
  Max,
  MinLength,
  IsArray,
  ValidateNested,
  IsPositive,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

// ==================== 库存 DTO ====================

export class CreateInventoryDto {
  @IsString()
  @MinLength(1)
  batchNo: string; // 批号

  @IsString()
  @MinLength(1)
  grade: string; // 品级 Ni9996/Ni9990/Ni9980/Ni9950

  @IsString()
  @IsOptional()
  @MinLength(1)
  specification?: string; // 规格

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  weight: number; // 重量 kg

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  pieceCount: number; // 片数

  @IsString()
  @IsOptional()
  location?: string; // 存放位置

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  nickelContent?: number; // 镍含量 %

  @IsString()
  @IsOptional()
  impurityContent?: string; // 杂质含量

  @IsDateString()
  @IsOptional()
  inspectionDate?: string; // 检测日期

  @IsString()
  @IsOptional()
  certificateNo?: string; // 质量证明书编号

  @IsString()
  @IsOptional()
  remark?: string; // 备注

  @IsString()
  @IsOptional()
  sourceType?: string; // 来源 ai/manual/import
}

export class UpdateInventoryDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  batchNo?: string;

  @IsString()
  @IsOptional()
  @MinLength(1)
  grade?: string;

  @IsString()
  @IsOptional()
  specification?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  weight?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  pieceCount?: number;

  @IsString()
  @IsOptional()
  location?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  nickelContent?: number;

  @IsString()
  @IsOptional()
  impurityContent?: string;

  @IsDateString()
  @IsOptional()
  inspectionDate?: string;

  @IsString()
  @IsOptional()
  certificateNo?: string;

  @IsString()
  @IsOptional()
  remark?: string;

  @IsString()
  @IsOptional()
  @IsEnum(['available', 'reserved', 'shipped'])
  status?: string;
}

// ==================== 配货单 DTO ====================

export class OrderItemDto {
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  stockId: number; // 库存ID

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  weight: number; // 配货重量

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  pieceCount: number; // 配货片数
}

export class CreateOrderDto {
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  customerId: number;

  @IsString()
  @IsOptional()
  @MinLength(1)
  customerName?: string;

  @IsString()
  @IsOptional()
  productSpec?: string;

  @IsString()
  @IsOptional()
  targetGrade?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsString()
  @IsOptional()
  remark?: string;
}

export class UpdateOrderDto {
  @IsNumber()
  @IsOptional()
  @IsPositive()
  @Type(() => Number)
  customerId?: number;

  @IsString()
  @IsOptional()
  customerName?: string;

  @IsString()
  @IsOptional()
  productSpec?: string;

  @IsString()
  @IsOptional()
  targetGrade?: string;

  @IsString()
  @IsOptional()
  @IsEnum(['draft', 'confirmed', 'shipping', 'shipped', 'cancelled'])
  status?: string;

  @IsString()
  @IsOptional()
  driverName?: string;

  @IsString()
  @IsOptional()
  vehicleNo?: string;

  @IsString()
  @IsOptional()
  remark?: string;
}

// ==================== 客户 DTO ====================

export class CreateCustomerDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  @IsOptional()
  contact?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;
}

export class UpdateCustomerDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  name?: string;

  @IsString()
  @IsOptional()
  contact?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;
}
