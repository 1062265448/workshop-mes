import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DistributionService {
  private readonly logger = new Logger(DistributionService.name);

  constructor(private prisma: PrismaService) {}

  // ==================== 库存管理 ====================

  async getInventory(page: number = 1, limit: number = 100, keyword?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (keyword) {
      where.OR = [
        { batchNo: { contains: keyword } },
        { grade: { contains: keyword } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.inboundRecord.findMany({
        where,
        skip,
        take: limit,
        include: { workshop: true, productSpec: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.inboundRecord.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async createInventory(dto: any) {
    return this.prisma.inboundRecord.create({
      data: {
        recordDate: dto.recordDate ? new Date(dto.recordDate) : new Date(),
        workshopId: dto.workshopId,
        productSpecId: dto.productSpecId,
        totalPackageCount: dto.totalPackageCount || 0,
        totalWeight: dto.totalWeight || 0,
        exportPackageCount: dto.exportPackageCount || 0,
        exportWeight: dto.exportWeight || 0,
        domesticPackageCount: dto.domesticPackageCount || 0,
        domesticWeight: dto.domesticWeight || 0,
        remark: dto.remark,
      },
      include: { workshop: true, productSpec: true },
    });
  }

  async updateInventory(id: number, dto: any) {
    return this.prisma.inboundRecord.update({
      where: { id },
      data: {
        ...dto,
        recordDate: dto.recordDate ? new Date(dto.recordDate) : undefined,
      },
    });
  }

  async deleteInventory(id: number) {
    return this.prisma.inboundRecord.delete({ where: { id } });
  }

  async batchCreateInventory(items: any[]) {
    return this.prisma.inboundRecord.createMany({
      data: items.map(item => ({
        recordDate: item.recordDate ? new Date(item.recordDate) : new Date(),
        workshopId: item.workshopId,
        productSpecId: item.productSpecId,
        totalPackageCount: item.totalPackageCount || 0,
        totalWeight: item.totalWeight || 0,
        exportPackageCount: item.exportPackageCount || 0,
        exportWeight: item.exportWeight || 0,
        domesticPackageCount: item.domesticPackageCount || 0,
        domesticWeight: item.domesticWeight || 0,
      })),
    });
  }

  // ==================== 客户管理 ====================

  async getCustomers() {
    return this.prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async createCustomer(dto: any) {
    return this.prisma.customer.create({ data: dto });
  }

  // ==================== 订单管理 ====================

  async getOrder() {
    return this.prisma.distributionOrder.findMany({
      include: { customer: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrders(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.distributionOrder.findMany({
        where: { deletedAt: null },
        skip,
        take: limit,
        include: { customer: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.distributionOrder.count({ where: { deletedAt: null } }),
    ]);
    return { data, total, page, limit };
  }

  async getOrderDetail(id: number) {
    return this.prisma.distributionOrder.findUnique({
      where: { id },
      include: { customer: true },
    });
  }

  async createOrder(dto: any) {
    return this.prisma.distributionOrder.create({
      data: {
        orderNo: dto.orderNo || `ORD-${Date.now()}`,
        customerId: dto.customerId,
        items: JSON.stringify(dto.items || []),
        status: dto.status || 'pending',
      },
    });
  }

  async updateOrder(id: number, dto: any) {
    return this.prisma.distributionOrder.update({
      where: { id },
      data: dto,
    });
  }

  async deleteOrder(id: number) {
    return this.prisma.distributionOrder.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async updateOrderStatus(id: number, status: string, extraData?: any) {
    const data: any = { status };
    if (status === 'shipped' && extraData) {
      data.shippedAt = new Date();
    }
    return this.prisma.distributionOrder.update({
      where: { id },
      data,
    });
  }

  // ==================== AI 识别历史 ====================

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

  async saveRecognitionHistory(imageUrl: string, result: any, itemCount: number, status: string = 'success') {
    return this.prisma.aiRecognitionHistory.create({
      data: {
        imageUrl,
        result: JSON.stringify(result),
        itemCount,
        status,
      },
    });
  }

  async deleteRecognitionHistory(id: number) {
    return this.prisma.aiRecognitionHistory.delete({ where: { id } });
  }
}
