import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ParseIntPipe,
  Logger,
  Patch,
  ArgumentMetadata,
  Injectable,
} from '@nestjs/common';
import { PipeTransform } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { mkdirSync } from 'fs';
import { DistributionService } from './distribution.service';
import { QwenAIService } from '../common/services/qwen-ai.service';
import {
  CreateInventoryDto,
  UpdateInventoryDto,
  CreateOrderDto,
  UpdateOrderDto,
  CreateCustomerDto,
  UpdateCustomerDto,
} from './dto/create-inventory.dto';

@Injectable()
class OptionalIntPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (value === undefined || value === null || value === '') return undefined;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? undefined : parsed;
  }
}

@Controller('distribution')
export class DistributionController {
  private readonly logger = new Logger(DistributionController.name);

  constructor(
    private readonly distributionService: DistributionService,
    private readonly qwenAI: QwenAIService,
  ) {
    try {
      mkdirSync('./uploads/inventory', { recursive: true });
    } catch (e) {}
  }

  // ==================== 统计 ====================

  @Get('statistics')
  async getStatistics() {
    return this.distributionService.getStatistics();
  }

  // ==================== 库存管理 ====================

  @Get('inventory')
  async getInventory(
    @Query('page', OptionalIntPipe) page?: number,
    @Query('limit', OptionalIntPipe) limit?: number,
    @Query('keyword') keyword?: string,
    @Query('grade') grade?: string,
    @Query('status') status?: string,
  ) {
    return this.distributionService.getInventory(page || 1, limit || 20, keyword, grade, status);
  }

  @Get('inventory/:id')
  async getInventoryById(@Param('id', new ParseIntPipe()) id: number) {
    return this.distributionService.getInventoryById(id);
  }

  @Post('inventory')
  async createInventory(@Body() dto: CreateInventoryDto) {
    return this.distributionService.createInventory(dto);
  }

  @Post('inventory/batch')
  async batchCreateInventory(@Body() items: any[]) {
    return this.distributionService.batchCreateInventory(items);
  }

  @Patch('inventory/:id')
  async updateInventory(
    @Param('id', new ParseIntPipe()) id: number,
    @Body() dto: UpdateInventoryDto,
  ) {
    return this.distributionService.updateInventory(id, dto);
  }

  @Delete('inventory/:id')
  async deleteInventory(@Param('id', new ParseIntPipe()) id: number) {
    return this.distributionService.deleteInventory(id);
  }

  // ==================== AI 识别 ====================

  @Post('inventory/ai-recognize')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: (_req, _file, cb) => cb(null, './uploads/inventory'),
        filename: (_req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, 'inventory-' + uniqueSuffix + extname(file.originalname));
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else {
          cb(new BadRequestException('只支持图片文件（JPG/PNG/GIF）'), false);
        }
      },
    }),
  )
  async recognizeInventory(@UploadedFile() file: any) {
    this.logger.log(`📷 收到库存照片：${file.originalname}`);
    this.logger.log(`🤖 正在调用千问 AI 识别...`);

    try {
      const aiResult = await this.qwenAI.identifyInventoryTable(file.path);
      this.logger.log(`✅ AI 识别成功，识别到 ${aiResult.length} 条记录`);

      const batchNo = aiResult[0]?.batchNo || '';
      const grade = aiResult[0]?.grade || '';
      const date = aiResult[0]?.date || '';

      await this.distributionService.saveRecognitionHistory(
        `/uploads/inventory/${file.filename}`,
        aiResult,
        aiResult.length,
        'success',
        undefined,
        batchNo,
        grade,
        date,
      );

      return {
        success: true,
        data: aiResult,
        count: aiResult.length,
      };
    } catch (error: any) {
      this.logger.error(`❌ AI 识别失败：${error.message}`);

      await this.distributionService.saveRecognitionHistory(
        `/uploads/inventory/${file.filename}`,
        { error: error.message },
        0,
        'failed',
        error.message,
      );

      return {
        success: false,
        error: error.message,
      };
    }
  }

  // ==================== 客户管理 ====================

  @Get('customers')
  async getCustomers() {
    return this.distributionService.getCustomers();
  }

  @Get('customers/:id')
  async getCustomerById(@Param('id', new ParseIntPipe()) id: number) {
    return this.distributionService.getCustomerById(id);
  }

  @Post('customers')
  async createCustomer(@Body() dto: CreateCustomerDto) {
    return this.distributionService.createCustomer(dto);
  }

  @Put('customers/:id')
  async updateCustomer(
    @Param('id', new ParseIntPipe()) id: number,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.distributionService.updateCustomer(id, dto);
  }

  @Delete('customers/:id')
  async deleteCustomer(@Param('id', new ParseIntPipe()) id: number) {
    return this.distributionService.deleteCustomer(id);
  }

  // ==================== 配货单管理 ====================

  @Get('orders')
  async getOrders(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('status') status?: string,
    @Query('customerId', OptionalIntPipe) customerId?: number,
  ) {
    return this.distributionService.getOrders(page || 1, limit || 20, status, customerId);
  }

  @Get('orders/:id')
  async getOrderById(@Param('id', new ParseIntPipe()) id: number) {
    return this.distributionService.getOrderById(id);
  }

  @Post('orders')
  async createOrder(@Body() dto: CreateOrderDto) {
    return this.distributionService.createOrder(dto);
  }

  @Put('orders/:id')
  async updateOrder(
    @Param('id', new ParseIntPipe()) id: number,
    @Body() dto: UpdateOrderDto,
  ) {
    return this.distributionService.updateOrder(id, dto);
  }

  @Delete('orders/:id')
  async deleteOrder(@Param('id', new ParseIntPipe()) id: number) {
    return this.distributionService.deleteOrder(id);
  }

  @Post('orders/batch-delete')
  async batchDeleteOrders(@Body('ids') ids: number[]) {
    if (!ids || ids.length === 0) {
      throw new BadRequestException('请提供要删除的订单ID');
    }
    return this.distributionService.batchDeleteOrders(ids);
  }

  @Post('orders/:id/confirm')
  async confirmOrder(@Param('id', new ParseIntPipe()) id: number) {
    return this.distributionService.updateOrderStatus(id, 'confirmed');
  }

  @Post('orders/:id/ship')
  async shipOrder(
    @Param('id', new ParseIntPipe()) id: number,
    @Body() body: { driverName?: string; vehicleNo?: string },
  ) {
    return this.distributionService.updateOrderStatus(id, 'shipping', body);
  }

  @Post('orders/:id/deliver')
  async deliverOrder(@Param('id', new ParseIntPipe()) id: number) {
    return this.distributionService.updateOrderStatus(id, 'shipped');
  }

  @Post('orders/:id/cancel')
  async cancelOrder(@Param('id', new ParseIntPipe()) id: number) {
    return this.distributionService.updateOrderStatus(id, 'cancelled');
  }

  // ==================== AI 识别历史 ====================

  @Get('recognition-history')
  async getRecognitionHistory(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('status') status?: string,
  ) {
    return this.distributionService.getRecognitionHistory(page || 1, limit || 20, status);
  }

  @Delete('recognition-history/:id')
  async deleteRecognitionHistory(@Param('id', new ParseIntPipe()) id: number) {
    return this.distributionService.deleteRecognitionHistory(id);
  }

  @Post('recognition-history/batch-delete')
  async batchDeleteRecognitionHistory(@Body('ids') ids: number[]) {
    if (!ids || ids.length === 0) {
      throw new BadRequestException('请提供要删除的记录ID');
    }
    return this.distributionService.batchDeleteRecognitionHistory(ids);
  }
}
