import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDefectTypeDto, UpdateDefectTypeDto, CreateDefectSampleDto } from './dto/create-defect.dto';

@Injectable()
export class DefectsService {
  private readonly logger = new Logger(DefectsService.name);

  constructor(private prisma: PrismaService) {}

  // ==================== 缺陷类型管理 ====================

  async getDefectTypes() {
    return this.prisma.defectType.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { samples: true, annotations: true }
        }
      }
    });
  }

  async getDefectTypeById(id: number) {
    const defectType = await this.prisma.defectType.findUnique({
      where: { id },
      include: {
        samples: {
          orderBy: { createdAt: 'desc' },
          include: {
            annotations: true
          }
        },
        _count: {
          select: { samples: true, annotations: true }
        }
      }
    });

    if (!defectType) {
      throw new NotFoundException(`缺陷类型 ID ${id} 不存在`);
    }

    return defectType;
  }

  async createDefectType(dto: CreateDefectTypeDto) {
    // 自动生成代码
    const code = dto.code || `DEFECT-${Date.now()}`;

    return this.prisma.defectType.create({
      data: {
        code,
        name: dto.name,
        description: dto.description,
        category: dto.category,
        color: dto.color || '#ff0000',
      },
    });
  }

  async updateDefectType(id: number, dto: UpdateDefectTypeDto) {
    const defectType = await this.prisma.defectType.findUnique({
      where: { id },
    });

    if (!defectType) {
      throw new NotFoundException(`缺陷类型 ID ${id} 不存在`);
    }

    return this.prisma.defectType.update({
      where: { id },
      data: dto,
    });
  }

  async deleteDefectType(id: number) {
    const defectType = await this.prisma.defectType.findUnique({
      where: { id },
    });

    if (!defectType) {
      throw new NotFoundException(`缺陷类型 ID ${id} 不存在`);
    }

    return this.prisma.defectType.delete({
      where: { id },
    });
  }

  // ==================== 缺陷样本管理 ====================

  async getDefectSamples(params?: { defectTypeId?: number; page?: number; limit?: number }) {
    try {
      const { defectTypeId, page = 1, limit = 20 } = params || {};

      const where: any = defectTypeId ? { defectTypeId } : {};

      const skip = (page - 1) * limit;

      this.logger.log(`📊 查询样本：defectTypeId=${defectTypeId}, page=${page}, limit=${limit}`);

      // 暂时移除 include，测试是否是关联查询的问题
      const [data, total] = await Promise.all([
        this.prisma.defectSample.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.defectSample.count({ where }),
      ]);

      this.logger.log(`✅ 查询成功：${data.length} 条样本，共 ${total} 条`);

      return { data, total, page, limit };
    } catch (error: any) {
      this.logger.error(`❌ 查询样本失败:`, error.message);
      this.logger.error(`错误堆栈:`, error.stack);
      throw error;
    }
  }

  async getDefectSampleById(id: number) {
    const sample = await this.prisma.defectSample.findUnique({
      where: { id },
      include: {
        defectType: true,
        annotations: true,
      },
    });

    if (!sample) {
      throw new NotFoundException(`样本 ID ${id} 不存在`);
    }

    return sample;
  }

  async createDefectSample(dto: CreateDefectSampleDto) {
    const sample = await this.prisma.defectSample.create({
      data: {
        defectTypeId: dto.defectTypeId,
        imageUrl: dto.imageUrl,
        description: dto.description,
        sourcePath: dto.sourcePath,
      },
    });

    // 如果有标注信息，批量创建
    if (dto.annotations && dto.annotations.length > 0) {
      await this.prisma.defectAnnotation.createMany({
        data: dto.annotations.map(anno => ({
          sampleId: sample.id,
          defectTypeId: dto.defectTypeId,
          x: anno.x,
          y: anno.y,
          width: anno.width,
          height: anno.height,
          confidence: anno.confidence,
          description: anno.description,
        })),
      });
    }

    return this.getDefectSampleById(sample.id);
  }

  async updateDefectSample(id: number, dto: Partial<CreateDefectSampleDto>) {
    const sample = await this.prisma.defectSample.findUnique({
      where: { id },
    });

    if (!sample) {
      throw new NotFoundException(`样本 ID ${id} 不存在`);
    }

    // 移除 defectTypeId，因为更新时不应该修改关联
    const { defectTypeId, annotations, ...updateData } = dto;

    return this.prisma.defectSample.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteDefectSample(id: number) {
    const sample = await this.prisma.defectSample.findUnique({
      where: { id },
    });

    if (!sample) {
      throw new NotFoundException(`样本 ID ${id} 不存在`);
    }

    return this.prisma.defectSample.delete({
      where: { id },
    });
  }

  // ==================== 缺陷标注管理 ====================

  async createAnnotation(sampleId: number, defectTypeId: number, annotation: any) {
    return this.prisma.defectAnnotation.create({
      data: {
        sampleId,
        defectTypeId,
        x: annotation.x,
        y: annotation.y,
        width: annotation.width,
        height: annotation.height,
        confidence: annotation.confidence,
        description: annotation.description,
      },
    });
  }

  async getAnnotationsBySample(sampleId: number) {
    return this.prisma.defectAnnotation.findMany({
      where: { sampleId },
      include: {
        defectType: true,
      },
    });
  }

  async deleteAnnotation(id: number) {
    return this.prisma.defectAnnotation.delete({
      where: { id },
    });
  }

  // ==================== 样本库导入 ====================

  async importFromFolder(folderPath: string, defectTypeId: number) {
    this.logger.log(`📂 开始从文件夹导入样本：${folderPath}`);
    
    // 这里需要文件系统操作，暂时返回成功
    return {
      success: true,
      message: '样本导入功能开发中',
    };
  }
}
