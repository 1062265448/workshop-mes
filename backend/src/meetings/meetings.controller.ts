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
  BadRequestException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { MeetingsService } from './meetings.service';
import { CreateMeetingDto, UpdateMeetingDto, CreateMeetingTaskDto, AddParticipantDto, UpdateParticipantStatusDto } from './dto/create-meeting.dto';

@Controller('meetings')
export class MeetingsController {
  private readonly logger = new Logger(MeetingsController.name);

  constructor(private readonly meetingsService: MeetingsService) {}

  // ==================== 会议管理 ====================

  @Post()
  async createMeeting(@Body() dto: CreateMeetingDto, @Body('organizerId') organizerId?: number) {
    // TODO: 从认证信息获取 organizerId
    const oid = organizerId || 1; // 临时用 ID 1
    this.logger.log(`📝 创建会议：${dto.title}, 主持人 ID=${oid}`);
    return this.meetingsService.createMeeting(dto, oid);
  }

  @Get()
  async getMeetings(
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('organizerId') organizerId?: string,
    @Query('participantId') participantId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const params: any = {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    };
    if (type) params.type = type;
    if (status) params.status = status;
    if (organizerId) params.organizerId = parseInt(organizerId);
    if (participantId) params.participantId = parseInt(participantId);

    return this.meetingsService.getMeetings(params);
  }

  @Get(':id')
  async getMeetingById(@Param('id', new ParseIntPipe()) id: number) {
    return this.meetingsService.getMeetingById(id);
  }

  @Put(':id')
  async updateMeeting(
    @Param('id', new ParseIntPipe()) id: number,
    @Body() dto: UpdateMeetingDto,
  ) {
    return this.meetingsService.updateMeeting(id, dto);
  }

  @Delete(':id')
  async deleteMeeting(@Param('id', new ParseIntPipe()) id: number) {
    return this.meetingsService.deleteMeeting(id);
  }

  // ==================== 参会人员管理 ====================

  @Post(':id/participants')
  async addParticipant(
    @Param('id', new ParseIntPipe()) id: number,
    @Body() dto: AddParticipantDto,
  ) {
    return this.meetingsService.addParticipant(id, dto.userId);
  }

  @Put(':id/participants/:userId')
  async updateParticipantStatus(
    @Param('id', new ParseIntPipe()) id: number,
    @Param('userId', new ParseIntPipe()) userId: number,
    @Body() dto: UpdateParticipantStatusDto,
  ) {
    return this.meetingsService.updateParticipantStatus(id, userId, dto.status);
  }

  @Delete(':id/participants/:userId')
  async removeParticipant(
    @Param('id', new ParseIntPipe()) id: number,
    @Param('userId', new ParseIntPipe()) userId: number,
  ) {
    return this.meetingsService.removeParticipant(id, userId);
  }

  // ==================== 会议任务管理 ====================

  @Post(':id/tasks')
  async createTask(
    @Param('id', new ParseIntPipe()) id: number,
    @Body() dto: CreateMeetingTaskDto,
  ) {
    return this.meetingsService.createTask(id, dto);
  }

  @Put('tasks/:taskId')
  async updateTask(
    @Param('taskId', new ParseIntPipe()) taskId: number,
    @Body() dto: Partial<CreateMeetingTaskDto>,
  ) {
    return this.meetingsService.updateTask(taskId, dto);
  }

  @Delete('tasks/:taskId')
  async deleteTask(@Param('taskId', new ParseIntPipe()) taskId: number) {
    return this.meetingsService.deleteTask(taskId);
  }

  @Get(':id/tasks')
  async getTasksByMeeting(@Param('id', new ParseIntPipe()) id: number) {
    return this.meetingsService.getTasksByMeeting(id);
  }

  // ==================== 会议附件管理 ====================

  @Post(':id/attachments/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './tmp/uploads',
        filename: (req, file, cb) => {
          const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
      fileFilter: (req, file, cb) => {
        // 允许的文件类型
        const allowedExts = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
          '.jpg', '.jpeg', '.png', '.gif', '.zip', '.rar', '.txt', '.csv'];
        const ext = extname(file.originalname).toLowerCase();
        if (allowedExts.includes(ext)) {
          cb(null, true);
        } else {
          cb(new BadRequestException(`不支持的文件类型: ${ext}`), false);
        }
      },
    }),
  )
  async uploadAttachment(
    @Param('id', new ParseIntPipe()) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.meetingsService.uploadAttachment(id, file);
  }

  @Post(':id/attachments')
  async addAttachment(
    @Param('id', new ParseIntPipe()) id: number,
    @Body('name') name: string,
    @Body('url') url: string,
    @Body('size') size?: number,
    @Body('type') type?: string,
  ) {
    return this.meetingsService.addAttachment(id, name, url, size, type);
  }

  @Delete('attachments/:attachmentId')
  async deleteAttachment(@Param('attachmentId', new ParseIntPipe()) attachmentId: number) {
    return this.meetingsService.deleteAttachment(attachmentId);
  }

  // ==================== 统计 ====================

  @Get('statistics/overview')
  async getStatistics(@Query('organizerId') organizerId?: string) {
    const oid = organizerId ? parseInt(organizerId) : undefined;
    return this.meetingsService.getStatistics(oid);
  }
}
