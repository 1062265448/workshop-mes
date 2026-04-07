import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInventoryDto, CreateOrderDto } from './dto/create-inventory.dto';

@Injectable()
export class DistributionService {
  private readonly logger = new Logger(DistributionService.name);

  constructor(private prisma: PrismaService) {}

  // ==================== 库存管理（使用 NickelInventory）====================

  async getInventory(page: number = 1, limit: number = 100, keyword?: string) {
    const skip = (page - 1) * limit;

    const where: any = keyword ? {
      OR: [
        { tankNo: { contains: keyword } },
      ],
    } : {};

    const [data, total] = await Promise.all([
      this.prisma.nickelInventory.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.nickelInventory.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async createInventory(dto: any) {
    // 生成唯一的 tankNo
    const tankNo = dto.tankNo || dto.batchNo || `TANK-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    
    // 字段映射：DTO → Prisma 模型 (支持新旧字段)
    const createData: any = {
      tankNo,
      batchNo: dto.batchNo || tankNo,
      grade: dto.grade || dto.specification || undefined,
      specification: dto.specification || undefined,
      concentration: dto.concentration || parseFloat(dto.grade?.replace('Ni', '') || '99.96') / 100 || 99.96,
      temperature: dto.temperature || 25,
      ph: dto.ph || 7,
      weight: dto.weight !== undefined ? parseFloat(dto.weight) : undefined,
      pieceCount: dto.pieceCount !== undefined ? parseInt(dto.pieceCount) : undefined,
      inspectionDate: dto.inspectionDate ? new Date(dto.inspectionDate) : undefined,
      status: dto.status || 'available',
      location: dto.location || undefined,
    };
    
    this.logger.log('📦 创建库存数据:', createData);
    
    return this.prisma.nickelInventory.create({
      data: createData,
    });
  }

  async deleteInventory(id: number) {
    const inventory = await this.prisma.nickelInventory.findUnique({
      where: { id },
    });

    if (!inventory) {
      throw new NotFoundException(`库存 ID ${id} 不存在`);
    }

    return this.prisma.nickelInventory.delete({
      where: { id },
    });
  }

  async updateInventory(id: number, dto: any) {
    try {
      // 字段映射：前端 → Prisma 模型 (支持新旧字段)
      const updateData: any = {}
      
      if (dto.tankNo !== undefined) updateData.tankNo = dto.tankNo
      if (dto.batchNo !== undefined) updateData.batchNo = dto.batchNo
      if (dto.grade !== undefined) updateData.grade = dto.grade
      if (dto.specification !== undefined) updateData.specification = dto.specification
      if (dto.concentration !== undefined) updateData.concentration = parseFloat(dto.concentration)
      if (dto.temperature !== undefined) updateData.temperature = parseFloat(dto.temperature)
      if (dto.ph !== undefined) updateData.ph = parseFloat(dto.ph)
      if (dto.weight !== undefined) updateData.weight = parseFloat(dto.weight)
      if (dto.pieceCount !== undefined) updateData.pieceCount = parseInt(dto.pieceCount)
      if (dto.inspectionDate !== undefined) updateData.inspectionDate = new Date(dto.inspectionDate)
      if (dto.status !== undefined) updateData.status = dto.status
      if (dto.location !== undefined) updateData.location = dto.location
      
      this.logger.log(`📝 更新库存 ID=${id}, 数据:`, updateData)
      
      return this.prisma.nickelInventory.update({
        where: { id },
        data: updateData,
      });
    } catch (error: any) {
      this.logger.error(`❌ 更新库存失败 ID=${id}:`, error.message)
      throw error
    }
  }

  async batchCreateInventory(items: any[]) {
    this.logger.log(`📦 批量导入 ${items.length} 条库存记录`);
    
    return this.prisma.$transaction(
      items.map((dto: any, index: number) =>
        this.prisma.nickelInventory.create({
          data: {
            // 为每条记录生成唯一的 tankNo（使用索引避免冲突）
            tankNo: dto.tankNo || `${dto.batchNo || 'TANK'}-${index}-${Date.now()}`,
            batchNo: dto.batchNo,
            grade: dto.grade,
            specification: dto.specification,
            concentration: dto.concentration || parseFloat(dto.grade?.replace('Ni', '') || '99.96') / 100 || 99.96,
            temperature: dto.temperature || 25,
            ph: dto.ph || 7,
            weight: dto.weight !== undefined ? parseFloat(dto.weight) : undefined,
            pieceCount: dto.pieceCount !== undefined ? parseInt(dto.pieceCount) : undefined,
            inspectionDate: dto.inspectionDate ? new Date(dto.inspectionDate) : undefined,
            status: dto.status || 'available',
            location: dto.location || undefined,
          },
        })
      )
    );
  }

  // ==================== 客户管理 ====================

  async getCustomers() {
    return this.prisma.customer.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async createCustomer(dto: { name: string; contact?: string; phone?: string }) {
    return this.prisma.customer.create({
      data: {
        name: dto.name,
        contact: dto.contact ?? undefined,
        phone: dto.phone ?? undefined,
      },
    });
  }

  // ==================== 配货单管理 ====================

  async createOrder(dto: any) {
    try {
      // 生成配货单号
      const orderNo = 'DO' + new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);

      // 查找或创建客户
      let customerId: number | undefined = undefined;
      if (dto.customerName) {
        let customer = await this.prisma.customer.findFirst({
          where: { name: dto.customerName },
        });

        if (!customer) {
          customer = await this.prisma.customer.create({
            data: {
              name: dto.customerName,
            },
          });
          this.logger.log(`✅ 创建新客户：${dto.customerName}`);
        }

        customerId = customer.id;
      }

      // 计算总重量和总片数
      let totalWeight = 0;
      let totalPieces = 0;

      if (dto.items && Array.isArray(dto.items)) {
        totalWeight = dto.items.reduce((sum: number, item: any) => sum + (Number(item.weight) || 0), 0);
        totalPieces = dto.items.reduce((sum: number, item: any) => sum + (Number(item.pieces) || 0), 0);
      }

      this.logger.log(`📝 创建配货单数据：`, {
        orderNo,
        customerId,
        customerName: dto.customerName,
        itemsCount: dto.items?.length || 0,
      });

      // 创建配货单（只使用 schema 中存在的字段）
      const order = await this.prisma.distributionOrder.create({
        data: {
          orderNo,
          customerId: customerId!,
          items: JSON.stringify(dto.items ?? []),
          status: 'pending',
        },
      });

      this.logger.log(`✅ 配货单创建成功：${orderNo}`);
      return order;
    } catch (error: any) {
      this.logger.error(`❌ 配货单创建失败：${error.message}`);
      throw error;
    }
  }

  async getOrders(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.distributionOrder.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.distributionOrder.count(),
    ]);

    return { data, total, page, limit };
  }

  async getOrderDetail(id: number) {
    return this.prisma.distributionOrder.findUnique({
      where: { id },
    });
  }

  async deleteOrder(id: number) {
    const order = await this.prisma.distributionOrder.findUnique({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException(`配货单 ${id} 不存在`);
    }

    return this.prisma.distributionOrder.delete({
      where: { id },
    });
  }

  async updateOrderStatus(id: number, status: string, extraData?: any) {
    const order = await this.prisma.distributionOrder.findUnique({
      where: { id },
    });

    if (!order) {
      throw new Error('配货单不存在');
    }

    const updateData: any = { status };
    
    if (status === 'shipped') {
      updateData.shippedAt = new Date();
    }

    return this.prisma.distributionOrder.update({
      where: { id },
      data: updateData,
    });
  }

  async updateOrder(id: number, dto: any) {
    const order = await this.prisma.distributionOrder.findUnique({
      where: { id },
    });

    if (!order) {
      throw new Error('配货单不存在');
    }

    return this.prisma.distributionOrder.update({
      where: { id },
      data: dto,
    });
  }

  // ==================== AI 识别历史 ====================

  async saveRecognitionHistory(imageUrl: string, result: any, itemCount: number, status: string, errorMessage?: string) {
    return this.prisma.aiRecognitionHistory.create({
      data: {
        imageUrl,
        result: JSON.stringify(result),
        itemCount,
        status,
        errorMessage: errorMessage ?? null,
      },
    });
  }

  async getRecognitionHistory(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.aiRecognitionHistory.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.aiRecognitionHistory.count(),
    ]);
    return { data, total, page, limit };
  }

  async deleteRecognitionHistory(id: number) {
    return this.prisma.aiRecognitionHistory.delete({
      where: { id },
    });
  }
}
