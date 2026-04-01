import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  Patch,
  Logger,
} from '@nestjs/common';
import { DistributionService } from './distribution.service';
import { CreateInventoryDto, CreateOrderDto } from './dto/create-inventory.dto';

@Controller('distribution')
export class DistributionController {
  private readonly logger = new Logger(DistributionController.name);

  constructor(private readonly distributionService: DistributionService) {}

  // ==================== 库存管理 ====================

  @Get('inventory')
  async getInventory(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('keyword') keyword?: string,
  ) {
    return this.distributionService.getInventory(page || 1, limit || 100, keyword);
  }

  @Post('inventory')
  async createInventory(@Body() dto: CreateInventoryDto) {
    return this.distributionService.createInventory(dto);
  }

  @Delete('inventory/:id')
  async deleteInventory(@Param('id', new ParseIntPipe()) id: number) {
    return this.distributionService.deleteInventory(id);
  }

  @Patch('inventory/:id')
  async updateInventory(
    @Param('id', new ParseIntPipe()) id: number,
    @Body() dto: { status?: string; location?: string },
  ) {
    return this.distributionService.updateInventory(id, dto);
  }

  // ==================== 客户管理 ====================

  @Get('customers')
  async getCustomers() {
    return this.distributionService.getCustomers();
  }

  @Post('customers')
  async createCustomer(@Body() dto: { name: string; contact?: string; phone?: string }) {
    return this.distributionService.createCustomer(dto);
  }

  // ==================== 配货单管理 ====================

  @Post('order')
  async createOrder(@Body() dto: CreateOrderDto) {
    return this.distributionService.createOrder(dto);
  }

  @Get('orders')
  async getOrders(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.distributionService.getOrders(page || 1, limit || 10);
  }

  @Get('order/:id')
  async getOrderDetail(@Param('id', new ParseIntPipe()) id: number) {
    return this.distributionService.getOrderDetail(id);
  }

  @Delete('order/:id')
  async deleteOrder(@Param('id', new ParseIntPipe()) id: number) {
    return this.distributionService.deleteOrder(id);
  }

  @Post('order/:id/confirm')
  async confirmOrder(@Param('id', new ParseIntPipe()) id: number) {
    return this.distributionService.updateOrderStatus(id, 'confirmed');
  }

  @Post('order/:id/ship')
  async shipOrder(
    @Param('id', new ParseIntPipe()) id: number,
    @Body() body: { driverName?: string; vehicleNo?: string },
  ) {
    return this.distributionService.updateOrderStatus(id, 'shipped', body);
  }

  @Patch('order/:id')
  async updateOrder(
    @Param('id', new ParseIntPipe()) id: number,
    @Body() dto: any,
  ) {
    return this.distributionService.updateOrder(id, dto);
  }
}
