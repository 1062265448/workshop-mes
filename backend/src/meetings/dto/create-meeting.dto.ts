import {
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
  IsArray,
  ValidateNested,
  IsEnum,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMeetingDto {
  @IsString()
  title: string; // 会议主题

  @IsString()
  @IsOptional()
  description?: string; // 会议描述

  @IsString()
  @IsOptional()
  @IsEnum(['general', 'weekly', 'review', 'emergency'])
  type?: string; // 会议类型

  @IsDateString()
  startTime: string; // 开始时间

  @IsDateString()
  endTime: string; // 结束时间

  @IsString()
  @IsOptional()
  location?: string; // 会议地点

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  @Type(() => Number)
  participantIds?: number[]; // 参会人员 ID 列表
}

export class UpdateMeetingDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  @IsEnum(['general', 'weekly', 'review', 'emergency'])
  type?: string;

  @IsDateString()
  @IsOptional()
  startTime?: string;

  @IsDateString()
  @IsOptional()
  endTime?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  @IsEnum(['scheduled', 'ongoing', 'completed', 'cancelled'])
  status?: string;

  @IsString()
  @IsOptional()
  notes?: string; // 会议纪要
}

export class CreateMeetingTaskDto {
  @IsString()
  title: string; // 任务标题

  @IsString()
  @IsOptional()
  description?: string; // 任务描述

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  assigneeId?: number; // 负责人 ID

  @IsDateString()
  @IsOptional()
  dueDate?: string; // 截止日期

  @IsString()
  @IsOptional()
  @IsEnum(['pending', 'in_progress', 'done', 'cancelled'])
  status?: string; // 任务状态

  @IsString()
  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'urgent'])
  priority?: string; // 优先级
}

export class AddParticipantDto {
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  userId: number;
}

export class UpdateParticipantStatusDto {
  @IsString()
  @IsEnum(['pending', 'confirmed', 'absent'])
  status: string;
}
