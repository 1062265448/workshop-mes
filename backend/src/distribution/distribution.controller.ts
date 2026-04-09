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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { mkdirSync } from 'fs';
import { DistributionService } from './distribution.service';
import { CreateInventoryDto, CreateOrderDto } from './dto/create-inventory.dto';
import { QwenAIService } from '../common/services/qwen-ai.service';

@Controller('distribution')
export class DistributionController {
  private readonly logger = new Logger(DistributionController.name);
  private readonly uploadDir: string = './uploads/inventory';

  constructor(
    private readonly distributionService: DistributionService,
    private readonly qwenAI: QwenAIService,
  ) {
    // 确保上传目录存在
    try {
      mkdirSync(this.uploadDir, { recursive: true });
    } catch (e) {}
  }

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
  async createInventory(@Body() dto: any) {
    // 直接接收任意对象，不进行 DTO 验证
    return this.distributionService.createInventory(dto);
  }

  @Post('inventory/batch')
  async batchCreateInventory(@Body() items: CreateInventoryDto[]) {
    return this.distributionService.batchCreateInventory(items);
  }

  // ==================== 库存管理 ====================

  @Post('inventory/ai-recognize')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/inventory',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          cb(null, 'inventory-' + uniqueSuffix + extname(file.originalname));
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else {
          cb(new Error('只支持图片文件（JPG/PNG/GIF）'), false);
        }
      },
    }),
  )
  async recognizeInventory(@UploadedFile() file: any) {
    try {
      this.logger.log(`📷 收到库存照片：${file.originalname}`);
      this.logger.log(`🤖 正在调用千问 AI 识别...`);

      const filePath = file.path;
      const aiResult = await this.qwenAI.identifyInventoryTable(filePath);

      this.logger.log(`✅ AI 识别成功，识别到 ${aiResult.length} 条记录`);

      // 保存识别历史
      await this.distributionService.saveRecognitionHistory(
        `/uploads/inventory/${file.filename}`,
        aiResult,
        aiResult.length,
        'success'
      );

      return {
        success: true,
        message: `AI 识别成功，共 ${aiResult.length} 条记录`,
        imageUrl: `/uploads/inventory/${file.filename}`,
        filename: file.originalname,
        size: file.size,
        data: aiResult,
      };
    } catch (error: any) {
      this.logger.error(`❌ AI 识别失败：${error.message}`);
      
      // 保存失败历史
      await this.distributionService.saveRecognitionHistory(
        `/uploads/inventory/${file.filename}`,
        { error: error.message },
        0,
        'failed'
      );
      
      return {
        success: false,
        error: error.message,
        message: 'AI 识别失败，请手动录入',
      };
    }
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
  async createOrder(@Body() dto: any) {
    // 直接接收任意对象，不进行 DTO 验证
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

  // ==================== AI 识别历史 ====================

  @Get('recognition-history')
  async getRecognitionHistory(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.distributionService.getRecognitionHistory(page || 1, limit || 20);
  }

  @Delete('recognition-history/:id')
  async deleteRecognitionHistory(@Param('id', new ParseIntPipe()) id: number) {
    return this.distributionService.deleteRecognitionHistory(id);
  }
}
