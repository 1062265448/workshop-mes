import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDefectTypeDto, UpdateDefectTypeDto, CreateDefectSampleDto, DefectAnnotationDto } from './dto/create-defect.dto';

@Injectable()
export class DefectsService {
  private readonly logger = new Logger(DefectsService.name);

  constructor(private prisma: PrismaService) {}

  // ==================== 缺陷类型管理 ====================

  async getDefectTypes() {
    return this.prisma.defectType.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { samples: { where: { deletedAt: null } }, annotations: true }
        },
        samples: {
          where: { deletedAt: null },
          take: 6,
          select: {
            id: true,
            imageUrl: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  }

  async getDefectTypeById(id: number) {
    const defectType = await this.prisma.defectType.findUnique({
      where: { id },
      include: {
        samples: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          include: {
            annotations: true
          }
        },
        _count: {
          select: { samples: { where: { deletedAt: null } }, annotations: true }
        }
      }
    });

    if (!defectType || defectType.deletedAt) {
      throw new NotFoundException(`缺陷类型 ID ${id} 不存在`);
    }

    return defectType;
  }

  async createDefectType(dto: CreateDefectTypeDto) {
    return this.prisma.defectType.create({
      data: {
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

    if (!defectType || defectType.deletedAt) {
      throw new NotFoundException(`缺陷类型 ID ${id} 不存在`);
    }

    // 软删除：设置 deletedAt
    return this.prisma.defectType.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ==================== 缺陷样本管理 ====================

  async getDefectSamples(params?: { defectTypeId?: number; page?: number; limit?: number }) {
    try {
      const { defectTypeId, page = 1, limit = 20 } = params || {};

      const where: any = {
        deletedAt: null,
        ...(defectTypeId ? { defectTypeId } : {}),
      };

      const skip = (page - 1) * limit;

      this.logger.log(`📊 查询样本：defectTypeId=${defectTypeId}, page=${page}, limit=${limit}`);

      // 包含标注数量和缺陷类型信息
      const [data, total] = await Promise.all([
        this.prisma.defectSample.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            defectType: true,
            annotations: {
              select: {
                id: true,
                x: true,
                y: true,
                width: true,
                height: true,
                defectTypeId: true,
              },
            },
          },
        }),
        this.prisma.defectSample.count({ where }),
      ]);

      this.logger.log(`✅ 查询成功：${data.length} 条样本，共 ${total} 条`);
      
      // 调试日志：检查标注数据
      data.forEach((sample, index) => {
        if (sample.annotations && sample.annotations.length > 0) {
          this.logger.log(`📌 样本 ${sample.id} 有 ${sample.annotations.length} 个标注`);
          sample.annotations.forEach((anno, annoIndex) => {
            this.logger.log(`  标注 ${annoIndex + 1}: x=${anno.x}, y=${anno.y}, w=${anno.width}, h=${anno.height}`);
          });
        }
      });

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

    if (!sample || sample.deletedAt) {
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
    this.logger.log(`🗑️ 软删除样本 ID: ${id}`);
    
    const sample = await this.prisma.defectSample.findUnique({ where: { id } });
    if (!sample || sample.deletedAt) {
      throw new NotFoundException(`样本 ID ${id} 不存在`);
    }
    
    // 软删除：设置 deletedAt
    return this.prisma.defectSample.update({
      where: { id },
      data: { deletedAt: new Date() },
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

  // ==================== 批量保存标注 ====================

  /**
   * 批量保存标注（一次性替换样本全部标注）
   * 使用事务保证原子性：先删除旧标注 → 再批量创建新标注
   */
  async batchSaveAnnotations(
    sampleId: number,
    defectTypeId: number,
    annotations: DefectAnnotationDto[],
  ) {
    this.logger.log(`📦 批量保存：样本 ${sampleId}, ${annotations?.length || 0} 个标注`);

    // 验证样本存在
    const sample = await this.prisma.defectSample.findUnique({ where: { id: sampleId } });
    if (!sample) {
      throw new NotFoundException(`样本 ID ${sampleId} 不存在`);
    }

    // 事务：删除旧标注 + 批量创建新标注
    const result = await this.prisma.$transaction(async (tx) => {
      // 删除旧标注
      await tx.defectAnnotation.deleteMany({
        where: { sampleId },
      });

      // 批量创建
      if (annotations && annotations.length > 0) {
        await tx.defectAnnotation.createMany({
          data: annotations.map(anno => ({
            sampleId,
            defectTypeId,
            x: anno.x,
            y: anno.y,
            width: anno.width,
            height: anno.height,
            confidence: anno.confidence,
            description: anno.description,
          })),
        });
      }

      return { sampleId, count: annotations?.length || 0 };
    });

    this.logger.log(`✅ 批量保存完成：${result.count} 个标注`);
    return result;
  }

  // ==================== 统计 ====================

  async getStatistics() {
    const [typeCount, sampleCount, annotationCount, todaySampleCount] = await Promise.all([
      this.prisma.defectType.count({ where: { deletedAt: null } }),
      this.prisma.defectSample.count({ where: { deletedAt: null } }),
      this.prisma.defectAnnotation.count(),
      this.prisma.defectSample.count({
        where: {
          deletedAt: null,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    return {
      defectTypes: typeCount,
      samples: sampleCount,
      annotations: annotationCount,
      todaySamples: todaySampleCount,
    };
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
