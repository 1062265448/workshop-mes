import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  IsNotEmpty,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDefectTypeDto {
  @IsString()
  @IsNotEmpty()
  name: string; // 缺陷名称

  @IsString()
  @IsOptional()
  code?: string; // 缺陷代码（可选，自动生成）

  @IsString()
  @IsOptional()
  description?: string; // 描述

  @IsString()
  @IsOptional()
  category?: string; // 分类

  @IsString()
  @IsOptional()
  color?: string; // 标注框颜色
}

export class UpdateDefectTypeDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  color?: string;
}

export class DefectAnnotationDto {
  @IsNumber()
  @Min(0)
  @Max(1)
  x: number; // 标注框 X 坐标 (0-1)

  @IsNumber()
  @Min(0)
  @Max(1)
  y: number; // 标注框 Y 坐标 (0-1)

  @IsNumber()
  @Min(0)
  @Max(1)
  width: number; // 标注框宽度 (0-1)

  @IsNumber()
  @Min(0)
  @Max(1)
  height: number; // 标注框高度 (0-1)

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(1)
  confidence?: number; // 置信度

  @IsString()
  @IsOptional()
  description?: string; // 标注说明
}

export class CreateDefectSampleDto {
  @IsNumber()
  defectTypeId: number; // 缺陷类型 ID

  @IsString()
  imageUrl: string; // 图片路径

  @IsString()
  @IsOptional()
  description?: string; // 描述

  @IsString()
  @IsOptional()
  sourcePath?: string; // 样本库原始路径

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DefectAnnotationDto)
  annotations?: DefectAnnotationDto[]; // 标注信息
}

export class UploadDefectImageDto {
  @IsString()
  @IsNotEmpty({ message: '请选择缺陷类型' })
  defectTypeId: string; // FormData 传递的是字符串

  @IsString()
  @IsOptional()
  description?: string;
}

/** 批量保存标注（一次性替换样本全部标注） */
export class BatchSaveAnnotationsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DefectAnnotationDto)
  annotations: DefectAnnotationDto[];
}
