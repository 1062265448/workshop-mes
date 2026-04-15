import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DistributionService {
  private readonly logger = new Logger(DistributionService.name);

  constructor(private prisma: PrismaService) {}

  // ==================== Inventory ====================

  async getInventory(page = 1, limit = 20, keyword?: string, grade?: string, status?: string, productType?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (keyword) {
      where.OR = [
        { batchNo: { contains: keyword } },
        { grade: { contains: keyword } },
        { specification: { contains: keyword } },
        { location: { contains: keyword } },
      ];
    }
    if (grade) where.grade = grade;
    if (status) where.status = status;
    if (productType) where.productType = productType;

    const [data, total] = await Promise.all([
      this.prisma.inventoryStock.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.inventoryStock.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async getInventoryById(id: number) {
    const stock = await this.prisma.inventoryStock.findUnique({ where: { id } });
    if (!stock) throw new NotFoundException(`Stock ID ${id} not found`);
    return stock;
  }

  async createInventory(dto: any) {
    return this.prisma.inventoryStock.create({
      data: {
        batchNo: dto.batchNo,
        grade: dto.grade,
        productType: dto.productType || null,
        specification: dto.specification || null,
        weight: dto.weight || 0,
        pieceCount: dto.pieceCount || 0,
        location: dto.location || null,
        nickelContent: dto.nickelContent || null,
        impurityContent: dto.impurityContent || null,
        inspectionDate: dto.inspectionDate ? new Date(dto.inspectionDate) : null,
        certificateNo: dto.certificateNo || null,
        remark: dto.remark || null,
        sourceType: dto.sourceType || 'manual',
        sourceImage: dto.sourceImage || null,
        status: 'available',
      },
    });
  }

  async updateInventory(id: number, dto: any) {
    const existing = await this.prisma.inventoryStock.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Stock ID ${id} not found`);
    const data: any = { ...dto };
    Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);
    if (dto.inspectionDate) data.inspectionDate = new Date(dto.inspectionDate);
    return this.prisma.inventoryStock.update({ where: { id }, data });
  }

  async deleteInventory(id: number) {
    const existing = await this.prisma.inventoryStock.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Stock ID ${id} not found`);

    // Check if referenced by ACTIVE order items
    const activeRefs = await this.prisma.distributionOrderItem.count({
      where: {
        stockId: id,
        order: { deletedAt: null },
      },
    });
    if (activeRefs > 0) {
      throw new BadRequestException(`该库存已被 ${activeRefs} 个有效配货单引用，无法删除。请先删除或取消相关配货单。`);
    }

    return this.prisma.inventoryStock.delete({ where: { id } });
  }

  async batchCreateInventory(items: any[]) {
    return this.prisma.inventoryStock.createMany({
      data: items.map((item) => ({
        batchNo: item.batchNo,
        grade: item.grade,
        productType: item.productType || null,
        specification: item.specification || null,
        weight: item.weight || 0,
        pieceCount: item.pieceCount || 0,
        location: item.location || null,
        nickelContent: item.nickelContent || null,
        inspectionDate: item.inspectionDate ? new Date(item.inspectionDate) : null,
        certificateNo: item.certificateNo || null,
        remark: item.remark || null,
        sourceType: item.sourceType || 'batch_import',
        status: 'available',
      })),
    });
  }

  async batchDeleteInventory(ids: number[]) {
    return this.prisma.$transaction(async (tx) => {
      // Check if any are referenced by active orders
      const activeRefs = await tx.distributionOrderItem.count({
        where: {
          stockId: { in: ids },
          order: { deletedAt: null },
        },
      });
      if (activeRefs > 0) {
        throw new BadRequestException(`有 ${activeRefs} 条库存被有效配货单引用，无法删除`);
      }
      // Cascade will clean up order items for deleted orders
      const count = await tx.inventoryStock.deleteMany({
        where: { id: { in: ids } },
      });
      this.logger.log(`Batch deleted ${count.count} inventory items`);
      return count;
    });
  }

  // ==================== Orders ====================

  async getOrders(page = 1, limit = 20, status?: string, customerId?: number) {
    const skip = (page - 1) * limit;
    const where: any = { deletedAt: null };
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;

    const [data, total] = await Promise.all([
      this.prisma.distributionOrder.findMany({
        where, skip, take: limit,
        include: { customer: { select: { id: true, name: true, phone: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.distributionOrder.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async getOrderById(id: number) {
    const order = await this.prisma.distributionOrder.findFirst({
      where: { id, deletedAt: null },
      include: {
        customer: true,
        items: { include: { stock: true }, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!order) throw new NotFoundException(`Order ID ${id} not found`);
    return order;
  }

  async createOrder(dto: any) {
    // Validate stock availability
    for (const item of dto.items || []) {
      const stock = await this.prisma.inventoryStock.findUnique({ where: { id: item.stockId } });
      if (!stock) throw new BadRequestException(`Stock ID ${item.stockId} not found`);
      if (Number(stock.weight) < Number(item.weight)) {
        throw new BadRequestException(`Insufficient stock for batch ${stock.batchNo}: available ${stock.weight}kg, requested ${item.weight}kg`);
      }
    }

    const totalWeight = dto.items.reduce((sum: number, i: any) => sum + Number(i.weight), 0);
    const totalPieces = dto.items.reduce((sum: number, i: any) => sum + Number(i.pieceCount), 0);
    const orderNo = dto.orderNo || `ORD-${Date.now()}`;

    const result = await this.prisma.$transaction(async (tx) => {
      const order = await tx.distributionOrder.create({
        data: {
          orderNo,
          customerId: dto.customerId,
          customerName: dto.customerName || '',
          productSpec: dto.productSpec || null,
          targetGrade: dto.targetGrade || null,
          totalWeight,
          totalPieces,
          status: 'draft',
          remark: dto.remark || null,
          items: {
            create: dto.items.map((item: any) => ({
              stockId: item.stockId,
              weight: item.weight,
              pieceCount: item.pieceCount,
            })),
          },
        },
        include: { items: { include: { stock: true } } },
      });

      // Lock stock
      for (const item of dto.items) {
        await tx.inventoryStock.update({
          where: { id: item.stockId },
          data: { status: 'reserved' },
        });
      }
      return order;
    });

    this.logger.log(`Created order ${orderNo} with ${dto.items.length} items`);
    return result;
  }

  async updateOrder(id: number, dto: any) {
    const order = await this.prisma.distributionOrder.findFirst({ where: { id, deletedAt: null } });
    if (!order) throw new NotFoundException(`Order ID ${id} not found`);
    const data: any = { ...dto };
    Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);
    return this.prisma.distributionOrder.update({ where: { id }, data });
  }

  async deleteOrder(id: number) {
    const order = await this.prisma.distributionOrder.findFirst({
      where: { id, deletedAt: null },
      include: { items: true },
    });
    if (!order) throw new NotFoundException(`Order ID ${id} not found`);

    return this.prisma.$transaction(async (tx) => {
      // Release reserved inventory back to available
      for (const item of order.items) {
        await tx.inventoryStock.update({
          where: { id: item.stockId },
          data: { status: 'available' },
        });
      }
      // Soft delete order
      return tx.distributionOrder.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    });
  }

  async updateOrderStatus(id: number, status: string, extra?: any) {
    const order = await this.prisma.distributionOrder.findFirst({
      where: { id, deletedAt: null },
      include: { items: true },
    });
    if (!order) throw new NotFoundException(`Order ID ${id} not found`);

    const data: any = { status };
    if (status === 'shipping' && extra) {
      data.driverName = extra.driverName || null;
      data.vehicleNo = extra.vehicleNo || null;
    }
    if (status === 'shipped') data.shippedAt = new Date();

    await this.prisma.$transaction(async (tx) => {
      await tx.distributionOrder.update({ where: { id }, data });
      if (status === 'shipped') {
        for (const item of order.items) {
          await tx.inventoryStock.update({ where: { id: item.stockId }, data: { status: 'shipped' } });
        }
      }
      if (status === 'cancelled') {
        for (const item of order.items) {
          await tx.inventoryStock.update({ where: { id: item.stockId }, data: { status: 'available' } });
        }
      }
    });

    this.logger.log(`Order ${order.orderNo} status changed to ${status}`);
    return this.getOrderById(id);
  }

  async batchDeleteOrders(ids: number[]) {
    return this.prisma.$transaction(async (tx) => {
      const orders = await tx.distributionOrder.findMany({
        where: { id: { in: ids }, deletedAt: null },
        include: { items: true },
      });
      if (orders.length === 0) return { count: 0 };

      // Release inventory for all affected orders
      for (const order of orders) {
        for (const item of order.items) {
          await tx.inventoryStock.update({
            where: { id: item.stockId },
            data: { status: 'available' },
          });
        }
      }

      const count = await tx.distributionOrder.updateMany({
        where: { id: { in: ids }, deletedAt: null },
        data: { deletedAt: new Date() },
      });
      this.logger.log(`Batch deleted ${count.count} orders, released inventory`);
      return count;
    });
  }

  // ==================== Customers ====================

  async getCustomers() {
    return this.prisma.customer.findMany({ where: { deletedAt: null }, orderBy: { name: 'asc' } });
  }

  async getCustomerById(id: number) {
    const c = await this.prisma.customer.findFirst({ where: { id, deletedAt: null } });
    if (!c) throw new NotFoundException(`Customer ID ${id} not found`);
    return c;
  }

  async createCustomer(dto: any) {
    return this.prisma.customer.create({
      data: {
        name: dto.name,
        contact: dto.contact || null,
        phone: dto.phone || null,
        address: dto.address || null,
      },
    });
  }

  async updateCustomer(id: number, dto: any) {
    const c = await this.prisma.customer.findFirst({ where: { id, deletedAt: null } });
    if (!c) throw new NotFoundException(`Customer ID ${id} not found`);
    const data: any = { ...dto };
    Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);
    return this.prisma.customer.update({ where: { id }, data });
  }

  async deleteCustomer(id: number) {
    const c = await this.prisma.customer.findFirst({ where: { id, deletedAt: null } });
    if (!c) throw new NotFoundException(`Customer ID ${id} not found`);
    return this.prisma.customer.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  // ==================== AI Recognition History ====================

  async getRecognitionHistory(page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.status = status;
    const [data, total] = await Promise.all([
      this.prisma.aiRecognitionHistory.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.aiRecognitionHistory.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async saveRecognitionHistory(
    imageUrl: string, result: any, itemCount: number,
    status = 'success', errorMessage?: string,
    batchNo?: string, grade?: string, date?: string,
  ) {
    return this.prisma.aiRecognitionHistory.create({
      data: {
        imageUrl,
        result: JSON.stringify(result),
        itemCount,
        status,
        errorMessage: errorMessage || null,
        batchNo: batchNo || null,
        grade: grade || null,
        date: date ? new Date(date) : null,
      },
    });
  }

  async deleteRecognitionHistory(id: number) {
    return this.prisma.aiRecognitionHistory.delete({ where: { id } });
  }

  async batchDeleteRecognitionHistory(ids: number[]) {
    return this.prisma.aiRecognitionHistory.deleteMany({ where: { id: { in: ids } } });
  }

  // ==================== Statistics ====================

  async getStatistics() {
    const [
      totalInventory, availableInventory, reservedInventory, shippedInventory,
      totalOrders, draftOrders, confirmedOrders, shippingOrders, shippedOrders,
      totalCustomers,
    ] = await Promise.all([
      this.prisma.inventoryStock.count(),
      this.prisma.inventoryStock.count({ where: { status: 'available' } }),
      this.prisma.inventoryStock.count({ where: { status: 'reserved' } }),
      this.prisma.inventoryStock.count({ where: { status: 'shipped' } }),
      this.prisma.distributionOrder.count({ where: { deletedAt: null } }),
      this.prisma.distributionOrder.count({ where: { deletedAt: null, status: 'draft' } }),
      this.prisma.distributionOrder.count({ where: { deletedAt: null, status: 'confirmed' } }),
      this.prisma.distributionOrder.count({ where: { deletedAt: null, status: 'shipping' } }),
      this.prisma.distributionOrder.count({ where: { deletedAt: null, status: 'shipped' } }),
      this.prisma.customer.count({ where: { deletedAt: null } }),
    ]);

    const weightAgg = await this.prisma.inventoryStock.aggregate({ _sum: { weight: true } });
    const pieceAgg = await this.prisma.inventoryStock.aggregate({ _sum: { pieceCount: true } });

    return {
      inventory: {
        total: totalInventory, available: availableInventory,
        reserved: reservedInventory, shipped: shippedInventory,
        totalWeight: weightAgg._sum.weight || 0,
        totalPieces: pieceAgg._sum.pieceCount || 0,
      },
      orders: {
        total: totalOrders, draft: draftOrders, confirmed: confirmedOrders,
        shipping: shippingOrders, shipped: shippedOrders,
      },
      customers: { total: totalCustomers },
    };
  }
}
