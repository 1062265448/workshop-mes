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

  async createInventory(dto: CreateInventoryDto) {
    // 使用 tankNo 作为批号
    return this.prisma.nickelInventory.create({
      data: {
        tankNo: dto.batchNo,
        concentration: dto.nickelContent ?? 99.96,
        temperature: 25,
        ph: 7,
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
    // NickelInventory 没有 status 和 location 字段，忽略
    return this.prisma.nickelInventory.update({
      where: { id },
      data: {},
    });
  }

  async batchCreateInventory(items: CreateInventoryDto[]) {
    return this.prisma.$transaction(
      items.map(dto =>
        this.prisma.nickelInventory.create({
          data: {
            tankNo: dto.batchNo,
            concentration: dto.nickelContent ?? 99.96,
            temperature: 25,
            ph: 7,
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
        },
      });
      this.logger.log(`✅ 创建新客户：${dto.customerName}`);
    }

    customerId = customer.id;

    // 创建配货单（items 作为 JSON 字符串存储）
    const order = await this.prisma.distributionOrder.create({
      data: {
        orderNo,
        customerId,
        items: JSON.stringify(dto.items ?? []),
        status: 'pending',
      },
    });

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
}
