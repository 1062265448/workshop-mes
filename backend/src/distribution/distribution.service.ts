import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaClientService } from '../prisma/prisma-client.service';
import { CreateInventoryDto, CreateOrderDto } from './dto/create-inventory.dto';

@Injectable()
export class DistributionService {
  private readonly logger = new Logger(DistributionService.name);

  constructor(private prisma: PrismaClientService) {}

  // ==================== 库存管理 ====================

  async getInventory(page: number = 1, limit: number = 100, keyword?: string) {
    const skip = (page - 1) * limit;

    const where: any = keyword ? {
      OR: [
        { batchNo: { contains: keyword } },
        { grade: { contains: keyword } },
        { specification: { contains: keyword } },
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

  async createInventory(dto: CreateInventoryDto) {
    return this.prisma.nickelInventory.create({
      data: {
        batchNo: dto.batchNo,
        weight: dto.weight,
        pieceCount: dto.pieceCount,
        grade: dto.grade,
        specification: dto.specification,
        location: dto.location || '',
        nickelContent: dto.nickelContent || 0,
        status: 'available',
      },
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

  async updateInventory(id: number, dto: { status?: string; location?: string }) {
    return this.prisma.nickelInventory.update({
      where: { id },
      data: dto,
    });
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
        ...dto,
        status: 'active',
      },
    });
  }

  // ==================== 配货单管理 ====================

  async createOrder(dto: CreateOrderDto) {
    // 生成配货单号
    const orderNo = 'DO' + new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);

    // 查找或创建客户
    let customerId = 0;
    let customer = await this.prisma.customer.findFirst({
      where: { name: dto.customerName },
    });

    if (!customer) {
      customer = await this.prisma.customer.create({
        data: {
          name: dto.customerName,
          status: 'active',
        },
      });
      this.logger.log(`✅ 创建新客户：${dto.customerName}`);
    }

    customerId = customer.id;

    // 计算总重量和总片数
    let totalWeight = 0;
    let totalPieces = 0;

    if (dto.items && Array.isArray(dto.items)) {
      totalWeight = dto.items.reduce((sum, item) => sum + (Number(item.weight) || 0), 0);
      totalPieces = dto.items.reduce((sum, item) => sum + (Number(item.pieces) || 0), 0);
    }

    // 创建配货单
    const order = await this.prisma.distributionOrder.create({
      data: {
        orderNo,
        customerId,
        customerName: dto.customerName,
        productName: '电解镍',
        productSpec: dto.productSpec,
        targetGrade: dto.targetGrade,
        remark: dto.remark,
        status: 'draft',
        totalWeight,
        totalPieces,
        totalPackages: dto.items?.length || 0,
      },
    });

    // 更新库存状态为已预留
    if (dto.items && Array.isArray(dto.items)) {
      for (const item of dto.items) {
        if (item.inventoryId) {
          await this.prisma.nickelInventory.update({
            where: { id: item.inventoryId },
            data: { status: 'reserved' },
          });
        }
      }
    }

    this.logger.log(`✅ 配货单创建成功：${orderNo}`);
    return order;
  }

  async getOrders(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.distributionOrder.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
        },
      }),
      this.prisma.distributionOrder.count(),
    ]);

    return { data, total, page, limit };
  }

  async getOrderDetail(id: number) {
    return this.prisma.distributionOrder.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });
  }

  async deleteOrder(id: number) {
    const order = await this.prisma.distributionOrder.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`配货单 ${id} 不存在`);
    }

    // 使用事务恢复库存状态
    return await this.prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        if (item.inventoryId) {
          await tx.nickelInventory.update({
            where: { id: item.inventoryId },
            data: { status: 'available' },
          });
        }
      }
      
      await tx.distributionItem.deleteMany({
        where: { orderId: id },
      });
      
      return tx.distributionOrder.delete({
        where: { id },
      });
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
      updateData.shipDate = new Date();
      if (extraData?.driverName) {
        updateData.driverName = extraData.driverName;
      }
      if (extraData?.vehicleNo) {
        updateData.vehicleNo = extraData.vehicleNo;
      }
    }

    return this.prisma.distributionOrder.update({
      where: { id },
      data: updateData,
      include: {
        items: true,
      },
    });
  }

  async updateOrder(id: number, dto: any) {
    const order = await this.prisma.distributionOrder.findUnique({
      where: { id },
    });

    if (!order) {
      throw new Error('配货单不存在');
    }

    if (order.status !== 'draft') {
      throw new Error('只有草稿状态的配货单才能修改');
    }

    return this.prisma.distributionOrder.update({
      where: { id },
      data: dto,
      include: {
        items: true,
      },
    });
  }
}
