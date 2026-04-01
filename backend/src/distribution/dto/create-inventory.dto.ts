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
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateInventoryDto {
  @IsString()
  @MinLength(3)
  batchNo: string; // 批号

  @IsNumber()
  @Min(0)
  weight: number; // 重量 (kg)

  @IsNumber()
  @Min(0)
  pieceCount: number; // 片数

  @IsString()
  @MinLength(2)
  grade: string; // 品级

  @IsString()
  @MinLength(2)
  specification: string; // 规格型号

  @IsString()
  @IsOptional()
  @MinLength(2)
  location?: string; // 存放位置

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  nickelContent?: number; // 镍成分含量 (%)

  @IsString()
  @IsOptional()
  impurityContent?: string; // 杂质含量

  @IsDateString()
  inspectionDate: string; // 检测日期

  @IsString()
  @IsOptional()
  @MinLength(3)
  certificateNo?: string; // 质量证明书编号

  @IsString()
  @IsOptional()
  remark?: string; // 备注
}

export class OrderItemDto {
  @IsNumber()
  @IsPositive()
  inventoryId: number;

  @IsNumber()
  @Min(0)
  weight: number;

  @IsNumber()
  @Min(0)
  pieces: number;
}

export class CreateOrderDto {
  @IsString()
  @MinLength(2)
  customerName: string;

  @IsString()
  @MinLength(2)
  productSpec: string;

  @IsString()
  @MinLength(2)
  targetGrade: string;

  @IsString()
  @IsOptional()
  @MinLength(5)
  remark?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items?: OrderItemDto[];
}
