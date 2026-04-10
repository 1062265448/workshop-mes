import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ProductionService } from './production.service';
import { CreateInboundRecordDto } from './dto/create-inbound-record.dto';
import { CreateShippingRecordDto } from './dto/create-shipping-record.dto';
import { CreateInventoryDto } from './dto/create-inventory.dto';

@Controller('production')
export class ProductionController {
  constructor(private readonly productionService: ProductionService) {}

  // ==================== 车间管理 ====================

  @Get('workshops')
  async getWorkshops() {
    // 车间数据不常变，可以缓存
    return this.productionService.getWorkshops();
  }
  
  // 清除缓存（调试用）
  @Post('cache/clear')
  async clearCache() {
    this.productionService.clearCache();
    return { message: '缓存已清除' };
  }

  // ==================== 产品规格管理 ====================

  @Get('products')
  async getProducts(
    @Query('category') category?: string,
    @Query('productCode') productCode?: string,
  ) {
    return this.productionService.getProducts({ category, productCode });
  }

  // ==================== 入库管理 ====================

  @Get('inbound')
  async getInboundRecords(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('workshopId') workshopId?: string,
    @Query('productCode') productCode?: string,
    @Query('specType') specType?: string,
  ) {
    return this.productionService.getInboundRecords({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      workshopId: workshopId ? parseInt(workshopId) : undefined,
      productCode,
      specType,
    });
  }

  @Get('inbound/:id')
  async getInboundRecord(@Param('id', ParseIntPipe) id: number) {
    return this.productionService.getInboundRecordById(id);
  }

  @Post('inbound')
  async createInboundRecord(@Body() dto: CreateInboundRecordDto) {
    return this.productionService.createInboundRecord(dto);
  }

  @Put('inbound/:id')
  async updateInboundRecord(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateInboundRecordDto,
  ) {
    return this.productionService.updateInboundRecord(id, dto);
  }

  @Delete('inbound/:id')
  async deleteInboundRecord(@Param('id', ParseIntPipe) id: number) {
    return this.productionService.deleteInboundRecord(id);
  }

  // ==================== 发运管理 ====================

  @Get('shipping')
  async getShippingRecords(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('workshopId') workshopId?: string,
    @Query('productCode') productCode?: string,
  ) {
    return this.productionService.getShippingRecords({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      workshopId: workshopId ? parseInt(workshopId) : undefined,
      productCode,
    });
  }

  @Get('shipping/:id')
  async getShippingRecord(@Param('id', ParseIntPipe) id: number) {
    return this.productionService.getShippingRecordById(id);
  }

  @Post('shipping')
  async createShippingRecord(@Body() dto: CreateShippingRecordDto) {
    return this.productionService.createShippingRecord(dto);
  }

  @Put('shipping/:id')
  async updateShippingRecord(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateShippingRecordDto,
  ) {
    return this.productionService.updateShippingRecord(id, dto);
  }

  @Delete('shipping/:id')
  async deleteShippingRecord(@Param('id', ParseIntPipe) id: number) {
    return this.productionService.deleteShippingRecord(id);
  }

  // ==================== 库存管理 ====================

  @Get('inventory')
  async getInventory(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('workshopId') workshopId?: string,
    @Query('productCode') productCode?: string,
    @Query('specType') specType?: string,
  ) {
    return this.productionService.getInventory({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 100,
      workshopId: workshopId ? parseInt(workshopId) : undefined,
      productCode,
      specType,
    });
  }

  @Post('inventory')
  async createInventory(@Body() dto: CreateInventoryDto) {
    return this.productionService.createInventory(dto);
  }

  @Put('inventory/:id')
  async updateInventory(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateInventoryDto,
  ) {
    return this.productionService.updateInventory(id, dto);
  }

  // ==================== 专用镍统计 ====================

  @Get('special-nickel')
  async getSpecialNickelStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.productionService.getSpecialNickelStats(startDate, endDate);
  }

  @Post('special-nickel')
  async createSpecialNickelStat(@Body() dto: any) {
    return this.productionService.createSpecialNickelStat(dto);
  }

  @Put('special-nickel/:id')
  async updateSpecialNickelStat(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: any,
  ) {
    return this.productionService.updateSpecialNickelStat(id, dto);
  }

  // ==================== 统计报表 ====================

  @Get('stats/daily')
  async getDailyStats(
    @Query('date') date: string,
    @Query('workshopId', new ParseIntPipe({ optional: true })) workshopId?: number,
  ) {
    return this.productionService.getDailyStats(date, workshopId);
  }

  @Get('stats/monthly')
  async getMonthlyStats(
    @Query('year') year: number,
    @Query('month') month: number,
    @Query('workshopId', new ParseIntPipe({ optional: true })) workshopId?: number,
  ) {
    return this.productionService.getMonthlyStats(year, month, workshopId);
  }

  @Get('stats/export-domestic')
  async getExportDomesticStats(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.productionService.getExportDomesticStats(startDate, endDate);
  }
}
