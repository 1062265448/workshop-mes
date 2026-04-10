import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInboundRecordDto } from './dto/create-inbound-record.dto';
import { CreateShippingRecordDto } from './dto/create-shipping-record.dto';
import { CreateInventoryDto } from './dto/create-inventory.dto';

@Injectable()
export class ProductionService {
  constructor(private readonly prisma: PrismaService) {}
  
  // 内存缓存
  private cache = new Map<string, { data: any; timestamp: number }>()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 分钟
  
  // 清除缓存（用于调试）
  clearCache() {
    this.cache.clear();
  }

  // ==================== 车间管理 ====================

  async getWorkshops() {
    const cacheKey = 'workshops';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    
    const data = await this.prisma.workshop.findMany({
      where: { isActive: 1 },
      orderBy: { sortOrder: 'asc' },
    });
    
    // 去重处理
    const uniqueData = Array.from(
      new Map(data.map(item => [item.id, item])).values()
    );
    
    console.log(`✅ 车间数据：${uniqueData.length} 条`);
    this.cache.set(cacheKey, { data: uniqueData, timestamp: Date.now() });
    return uniqueData;
  }

  // ==================== 产品规格管理 ====================

  async getProducts(params: { category?: string; productCode?: string }) {
    const cacheKey = `products:${params.category || ''}:${params.productCode || ''}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    
    const { category, productCode } = params;
    const where: any = { isActive: 1 };

    if (category) {
      where.category = category;
    }
    if (productCode) {
      where.productCode = productCode;
    }

    const data = await this.prisma.productSpec.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });
    
    // 去重处理
    const uniqueData = Array.from(
      new Map(data.map(item => [item.id, item])).values()
    );
    
    this.cache.set(cacheKey, { data: uniqueData, timestamp: Date.now() });
    return uniqueData;
  }

  // ==================== 入库管理 ====================

  async getInboundRecords(params: any) {
    const page = params.page ? parseInt(params.page.toString()) : 1;
    const limit = params.limit ? parseInt(params.limit.toString()) : 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (params.workshopId) {
      where.workshopId = parseInt(params.workshopId.toString());
    }
    
    // 产品类型和规格筛选
    if (params.productCode || params.specType) {
      where.productSpec = {};
      if (params.productCode) {
        where.productSpec.productCode = params.productCode;
      }
      if (params.specType) {
        where.productSpec.specType = params.specType;
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.inboundRecord.findMany({
        where,
        skip,
        take: limit,
        include: {
          workshop: true,
          productSpec: true,
        },
        orderBy: { id: 'desc' },
      }),
      this.prisma.inboundRecord.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async getInboundRecordById(id: number) {
    const record = await this.prisma.inboundRecord.findUnique({
      where: { id },
      include: {
        workshop: true,
        productSpec: true,
      },
    });
    if (!record) {
      throw new NotFoundException(`入库记录 ${id} 不存在`);
    }
    return record;
  }

  async createInboundRecord(dto: CreateInboundRecordDto) {
    return this.prisma.inboundRecord.create({
      data: {
        ...dto,
        recordDate: new Date(dto.recordDate),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        workshop: true,
        productSpec: true,
      },
    });
  }

  async updateInboundRecord(id: number, dto: CreateInboundRecordDto) {
    const existing = await this.prisma.inboundRecord.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`入库记录 ${id} 不存在`);
    }

    return this.prisma.inboundRecord.update({
      where: { id },
      data: {
        ...dto,
        recordDate: new Date(dto.recordDate),
        updatedAt: new Date(),
      },
    });
  }

  async deleteInboundRecord(id: number) {
    const existing = await this.prisma.inboundRecord.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`入库记录 ${id} 不存在`);
    }
    return this.prisma.inboundRecord.delete({ where: { id } });
  }

  // ==================== 发运管理 ====================

  async getShippingRecords(params: any) {
    const page = params.page ? parseInt(params.page.toString()) : 1;
    const limit = params.limit ? parseInt(params.limit.toString()) : 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (params.workshopId) {
      where.workshopId = parseInt(params.workshopId.toString());
    }
    
    // 产品类型筛选
    if (params.productCode) {
      where.productSpec = {};
      where.productSpec.productCode = params.productCode;
    }

    const [data, total] = await Promise.all([
      this.prisma.shippingRecord.findMany({
        where,
        skip,
        take: limit,
        include: {
          workshop: true,
          productSpec: true,
        },
        orderBy: { id: 'desc' },
      }),
      this.prisma.shippingRecord.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async getShippingRecordById(id: number) {
    const record = await this.prisma.shippingRecord.findUnique({
      where: { id },
      include: {
        workshop: true,
        productSpec: true,
      },
    });
    if (!record) {
      throw new NotFoundException(`发运记录 ${id} 不存在`);
    }
    return record;
  }

  async createShippingRecord(dto: CreateShippingRecordDto) {
    return this.prisma.shippingRecord.create({
      data: {
        ...dto,
        shipDate: new Date(dto.shipDate),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        workshop: true,
        productSpec: true,
      },
    });
  }

  async updateShippingRecord(id: number, dto: CreateShippingRecordDto) {
    const existing = await this.prisma.shippingRecord.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`发运记录 ${id} 不存在`);
    }

    return this.prisma.shippingRecord.update({
      where: { id },
      data: {
        ...dto,
        shipDate: new Date(dto.shipDate),
        updatedAt: new Date(),
      },
    });
  }

  async deleteShippingRecord(id: number) {
    const existing = await this.prisma.shippingRecord.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`发运记录 ${id} 不存在`);
    }
    return this.prisma.shippingRecord.delete({ where: { id } });
  }

  // ==================== 库存管理 ====================

  async getInventory(params: any) {
    const page = params.page ? parseInt(params.page.toString()) : 1;
    const limit = params.limit ? parseInt(params.limit.toString()) : 100;
    const skip = (page - 1) * limit;
    
    const where: any = {};
    
    if (params.workshopId) {
      where.workshopId = parseInt(params.workshopId.toString());
    }
    
    // 产品类型和规格筛选
    if (params.productCode || params.specType) {
      where.productSpec = {};
      if (params.productCode) {
        where.productSpec.productCode = params.productCode;
      }
      if (params.specType) {
        where.productSpec.specType = params.specType;
      }
    }

    return this.prisma.inventory.findMany({
      where,
      skip,
      take: limit,
      include: {
        workshop: true,
        productSpec: true,
      },
      orderBy: { id: 'desc' },
    });
  }

  async createInventory(dto: CreateInventoryDto) {
    // 检查是否已存在
    const existing = await this.prisma.inventory.findUnique({
      where: {
        inventoryDate_workshopId_productSpecId: {
          inventoryDate: new Date(dto.inventoryDate),
          workshopId: dto.workshopId,
          productSpecId: dto.productSpecId,
        },
      },
    });

    if (existing) {
      // 更新现有记录
      return this.prisma.inventory.update({
        where: { id: existing.id },
        data: {
          totalPackageCount: dto.totalPackageCount,
          totalWeight: dto.totalWeight,
          exportPackageCount: dto.exportPackageCount,
          exportWeight: dto.exportWeight,
          domesticPackageCount: dto.domesticPackageCount,
          domesticWeight: dto.domesticWeight,
          updatedAt: new Date(),
        },
      });
    }

    return this.prisma.inventory.create({
      data: {
        ...dto,
        inventoryDate: new Date(dto.inventoryDate),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  async updateInventory(id: number, dto: CreateInventoryDto) {
    const existing = await this.prisma.inventory.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`库存记录 ${id} 不存在`);
    }

    return this.prisma.inventory.update({
      where: { id },
      data: {
        ...dto,
        inventoryDate: new Date(dto.inventoryDate),
        updatedAt: new Date(),
      },
    });
  }

  // ==================== 专用镍统计 ====================

  async getSpecialNickelStats(startDate?: string, endDate?: string) {
    const where: any = {};

    if (startDate && endDate) {
      where.statDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    return this.prisma.specialNickelStat.findMany({
      where,
      orderBy: { statDate: 'desc' },
    });
  }

  async createSpecialNickelStat(dto: any) {
    return this.prisma.specialNickelStat.create({
      data: {
        ...dto,
        statDate: dto.statDate ? new Date(dto.statDate) : new Date(),
        createdAt: new Date(),
      },
    });
  }

  async updateSpecialNickelStat(id: number, dto: any) {
    const existing = await this.prisma.specialNickelStat.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`专用镍统计记录 ${id} 不存在`);
    }

    return this.prisma.specialNickelStat.update({
      where: { id },
      data: {
        ...dto,
        statDate: dto.statDate ? new Date(dto.statDate) : undefined,
      },
    });
  }

  // ==================== 统计报表 ====================

  async getDailyStats(date: string, workshopId?: number) {
    const targetDate = new Date(date);

    const where: any = { recordDate: targetDate };
    if (workshopId) {
      where.workshopId = workshopId;
    }

    const inboundData = await this.prisma.inboundRecord.findMany({
      where,
      include: { productSpec: true, workshop: true },
    });

    return {
      date,
      workshopId,
      inboundRecords: inboundData,
      totalWeight: inboundData.reduce((sum, r) => sum + Number(r.totalWeight), 0),
      exportWeight: inboundData.reduce((sum, r) => sum + Number(r.exportWeight), 0),
      domesticWeight: inboundData.reduce((sum, r) => sum + Number(r.domesticWeight), 0),
    };
  }

  async getMonthlyStats(year: number, month: number, workshopId?: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const where: any = {
      recordDate: {
        gte: startDate,
        lte: endDate,
      },
    };
    if (workshopId) {
      where.workshopId = workshopId;
    }

    const inboundData = await this.prisma.inboundRecord.findMany({
      where,
      include: { productSpec: true },
    });

    // 按产品规格分组统计
    const statsByProduct = inboundData.reduce((acc, record) => {
      const key = `${record.productSpecId}`;
      if (!acc[key]) {
        acc[key] = {
          productSpecId: record.productSpecId,
          productName: record.productSpec.productName,
          specType: record.productSpec.specType,
          specDetail: record.productSpec.specDetail,
          totalWeight: 0,
          exportWeight: 0,
          domesticWeight: 0,
          packageCount: 0,
        };
      }
      acc[key].totalWeight += Number(record.totalWeight);
      acc[key].exportWeight += Number(record.exportWeight);
      acc[key].domesticWeight += Number(record.domesticWeight);
      acc[key].packageCount += Number(record.totalPackageCount);
      return acc;
    }, {} as any);

    return {
      year,
      month,
      workshopId,
      startDate,
      endDate,
      statsByProduct: Object.values(statsByProduct),
      totalWeight: Object.values(statsByProduct).reduce((sum: any, s: any) => sum + s.totalWeight, 0),
    };
  }

  async getExportDomesticStats(startDate: string, endDate: string) {
    const inboundData = await this.prisma.inboundRecord.findMany({
      where: {
        recordDate: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      include: { productSpec: true },
    });

    const shippingData = await this.prisma.shippingRecord.findMany({
      where: {
        shipDate: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      include: { productSpec: true },
    });

    return {
      startDate,
      endDate,
      inbound: {
        totalWeight: inboundData.reduce((sum, r) => sum + Number(r.totalWeight), 0),
        exportWeight: inboundData.reduce((sum, r) => sum + Number(r.exportWeight), 0),
        domesticWeight: inboundData.reduce((sum, r) => sum + Number(r.domesticWeight), 0),
      },
      shipping: {
        totalWeight: shippingData.reduce((sum, r) => sum + Number(r.totalWeight), 0),
        exportWeight: shippingData.reduce((sum, r) => sum + Number(r.exportWeight), 0),
        domesticWeight: shippingData.reduce((sum, r) => sum + Number(r.domesticWeight), 0),
      },
    };
  }
}
