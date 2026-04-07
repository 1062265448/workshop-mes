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
  Logger,
  UseInterceptors,
  UploadedFile,
  ParseFilePipeBuilder,
  HttpStatus,
  HttpException,
  InternalServerErrorException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { mkdirSync, existsSync } from 'fs';
import { DefectsService } from './defects.service';
import { CreateDefectTypeDto, UpdateDefectTypeDto, CreateDefectSampleDto } from './dto/create-defect.dto';

@Controller('defects')
export class DefectsController {
  private readonly logger = new Logger(DefectsController.name);
  private readonly uploadDir: string = './uploads/defects';

  constructor(private readonly defectsService: DefectsService) {
    // 确保上传目录存在
    try {
      mkdirSync(this.uploadDir, { recursive: true });
    } catch (e) {}
  }

  // ==================== 缺陷类型管理 ====================

  @Get('types')
  async getDefectTypes() {
    return this.defectsService.getDefectTypes();
  }

  @Get('types/:id')
  async getDefectTypeById(@Param('id', new ParseIntPipe()) id: number) {
    return this.defectsService.getDefectTypeById(id);
  }

  @Post('types')
  async createDefectType(@Body() dto: CreateDefectTypeDto) {
    this.logger.log(`📝 创建缺陷类型：${dto.name}`);
    return this.defectsService.createDefectType(dto);
  }

  @Put('types/:id')
  async updateDefectType(
    @Param('id', new ParseIntPipe()) id: number,
    @Body() dto: UpdateDefectTypeDto,
  ) {
    return this.defectsService.updateDefectType(id, dto);
  }

  @Delete('types/:id')
  async deleteDefectType(@Param('id', new ParseIntPipe()) id: number) {
    return this.defectsService.deleteDefectType(id);
  }

  // ==================== 缺陷样本管理 ====================

  @Get('samples')
  async getDefectSamples(
    @Query('defectTypeId') defectTypeId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    this.logger.log(`📥 收到样本查询请求：defectTypeId=${defectTypeId}, page=${page}, limit=${limit}`);
    
    try {
      // 手动转换参数
      const dtId = defectTypeId ? parseInt(defectTypeId) : undefined;
      const p = page ? parseInt(page) : 1;
      const l = limit ? parseInt(limit) : 20;
      
      this.logger.log(`转换后的参数：defectTypeId=${dtId}, page=${p}, limit=${l}`);
      
      const result = await this.defectsService.getDefectSamples({ 
        defectTypeId: dtId, 
        page: p, 
        limit: l 
      });
      
      this.logger.log(`📤 返回样本数据：${result.total} 条`);
      
      return result;
    } catch (error: any) {
      this.logger.error(`❌ 样本查询失败:`, error.message);
      this.logger.error(`错误堆栈:`, error.stack);
      
      throw new InternalServerErrorException({
        message: error.message || '查询失败',
        stack: error.stack,
        details: error,
      });
    }
  }

  @Get('samples/:id')
  async getDefectSampleById(@Param('id', new ParseIntPipe()) id: number) {
    return this.defectsService.getDefectSampleById(id);
  }

  @Post('samples')
  async createDefectSample(@Body() dto: CreateDefectSampleDto) {
    this.logger.log(`📷 创建缺陷样本：缺陷类型 ID=${dto.defectTypeId}`);
    return this.defectsService.createDefectSample(dto);
  }

  @Put('samples/:id')
  async updateDefectSample(
    @Param('id', new ParseIntPipe()) id: number,
    @Body() dto: Partial<CreateDefectSampleDto>,
  ) {
    return this.defectsService.updateDefectSample(id, dto);
  }

  @Delete('samples/:id')
  async deleteDefectSample(@Param('id', new ParseIntPipe()) id: number) {
    return this.defectsService.deleteDefectSample(id);
  }

  // ==================== 图片上传 ====================

  @Post('samples/upload')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/defects',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          cb(null, 'defect-' + uniqueSuffix + extname(file.originalname));
        },
      }),
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
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
  async uploadDefectImage(
    @UploadedFile() file: any,
    @Body('defectTypeId') defectTypeIdStr?: string,
    @Body('description') description?: string,
  ) {
    try {
      this.logger.log(`📷 上传缺陷图片：${file.originalname}`);
      this.logger.log(`缺陷类型 ID 字符串：${defectTypeIdStr}`);

      const defectTypeId = defectTypeIdStr ? parseInt(defectTypeIdStr) : null;
      
      if (!defectTypeId) {
        this.logger.warn('缺少缺陷类型 ID');
        throw new Error('请先选择缺陷类型');
      }
      
      this.logger.log(`缺陷类型 ID: ${defectTypeId}`);

      const imageUrl = `/uploads/defects/${file.filename}`;

      // 创建样本记录
      const sample = await this.defectsService.createDefectSample({
        defectTypeId,
        imageUrl,
        description,
      });

      return {
        success: true,
        message: '图片上传成功',
        imageUrl,
        filename: file.originalname,
        size: file.size,
        sample,
      };
    } catch (error: any) {
      this.logger.error(`❌ 上传失败：${error.message}`);
      throw error;
    }
  }

  // ==================== 缺陷标注 ====================

  @Post('samples/:id/annotations')
  async createAnnotation(
    @Param('id', new ParseIntPipe()) id: number,
    @Body('defectTypeId', new ParseIntPipe()) defectTypeId: number,
    @Body() annotation: any,
  ) {
    this.logger.log(`🎯 创建缺陷标注：样本 ID=${id}, 缺陷类型 ID=${defectTypeId}`);
    return this.defectsService.createAnnotation(id, defectTypeId, annotation);
  }

  @Get('samples/:id/annotations')
  async getAnnotationsBySample(@Param('id', new ParseIntPipe()) id: number) {
    return this.defectsService.getAnnotationsBySample(id);
  }

  @Delete('annotations/:id')
  async deleteAnnotation(@Param('id', new ParseIntPipe()) id: number) {
    return this.defectsService.deleteAnnotation(id);
  }
}
