import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMeetingDto, UpdateMeetingDto, CreateMeetingTaskDto } from './dto/create-meeting.dto';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

@Injectable()
export class MeetingsService {
  private readonly logger = new Logger(MeetingsService.name);

  constructor(private prisma: PrismaService) {}

  // ==================== 会议管理 ====================

  async createMeeting(dto: CreateMeetingDto, organizerId: number) {
    this.logger.log(`📝 创建会议：${dto.title}`);

    return this.prisma.meeting.create({
      data: {
        title: dto.title,
        description: dto.description,
        type: dto.type || 'general',
        startTime: dto.startTime,
        endTime: dto.endTime,
        location: dto.location,
        organizerId,
        status: 'scheduled',
      },
      include: {
        organizer: {
          select: { id: true, name: true, username: true },
        },
      },
    });
  }

  async getMeetings(params?: {
    type?: string;
    status?: string;
    organizerId?: number;
    participantId?: number;
    page?: number;
    limit?: number;
  }) {
    const { type, status, organizerId, participantId, page = 1, limit = 20 } = params || {};

    const where: any = {};

    if (type) where.type = type;
    if (status) where.status = status;
    if (organizerId) where.organizerId = organizerId;

    // 如果指定了参会人，筛选包含该参会人的会议
    if (participantId) {
      where.participants = {
        some: {
          userId: participantId,
        },
      };
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.meeting.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startTime: 'desc' },
        include: {
          organizer: {
            select: { id: true, name: true, username: true },
          },
          _count: {
            select: {
              participants: true,
              tasks: true,
            },
          },
        },
      }),
      this.prisma.meeting.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async getMeetingById(id: number) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id },
      include: {
        organizer: {
          select: { id: true, name: true, username: true, email: true },
        },
        participants: {
          include: {
            user: {
              select: { id: true, name: true, username: true, email: true },
            },
          },
        },
        tasks: {
          orderBy: { createdAt: 'desc' },
        },
        attachments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!meeting) {
      throw new NotFoundException(`会议 ID ${id} 不存在`);
    }

    return meeting;
  }

  async updateMeeting(id: number, dto: UpdateMeetingDto) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id },
    });

    if (!meeting) {
      throw new NotFoundException(`会议 ID ${id} 不存在`);
    }

    return this.prisma.meeting.update({
      where: { id },
      data: dto,
    });
  }

  async deleteMeeting(id: number) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id },
    });

    if (!meeting) {
      throw new NotFoundException(`会议 ID ${id} 不存在`);
    }

    return this.prisma.meeting.delete({
      where: { id },
    });
  }

  // ==================== 参会人员管理 ====================

  async addParticipant(meetingId: number, userId: number) {
    return this.prisma.meetingParticipant.create({
      data: {
        meetingId,
        userId,
      },
    });
  }

  async updateParticipantStatus(meetingId: number, userId: number, status: string) {
    return this.prisma.meetingParticipant.update({
      where: {
        meetingId_userId: {
          meetingId,
          userId,
        },
      },
      data: { status },
    });
  }

  async removeParticipant(meetingId: number, userId: number) {
    return this.prisma.meetingParticipant.delete({
      where: {
        meetingId_userId: {
          meetingId,
          userId,
        },
      },
    });
  }

  // ==================== 会议任务管理 ====================

  async createTask(meetingId: number, dto: CreateMeetingTaskDto) {
    return this.prisma.meetingTask.create({
      data: {
        meetingId,
        title: dto.title,
        description: dto.description,
        assigneeId: dto.assigneeId,
        dueDate: dto.dueDate,
        status: dto.status || 'pending',
        priority: dto.priority || 'medium',
      },
    });
  }

  async updateTask(id: number, dto: Partial<CreateMeetingTaskDto>) {
    return this.prisma.meetingTask.update({
      where: { id },
      data: dto,
    });
  }

  async deleteTask(id: number) {
    return this.prisma.meetingTask.delete({
      where: { id },
    });
  }

  async getTasksByMeeting(meetingId: number) {
    return this.prisma.meetingTask.findMany({
      where: { meetingId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ==================== 会议附件管理 ====================

  /**
   * 上传附件文件
   */
  async uploadAttachment(meetingId: number, file: Express.Multer.File) {
    // 验证会议存在
    const meeting = await this.prisma.meeting.findUnique({ where: { id: meetingId } });
    if (!meeting) {
      throw new NotFoundException(`会议 ID ${meetingId} 不存在`);
    }

    // 确保 uploads/meetings 目录存在
    const uploadDir = join(__dirname, '..', '..', 'uploads', 'meetings');
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }

    // 保存文件
    const timestamp = Date.now();
    const ext = file.originalname.split('.').pop() || '';
    const fileName = `${meetingId}_${timestamp}.${ext}`;
    const filePath = join(uploadDir, fileName);

    // 写入文件（Express 已将文件写入临时目录，需要移动）
    const { rename } = await import('fs/promises');
    try {
      await rename(file.path, filePath);
    } catch {
      // 如果 rename 失败，可能文件已在同一分区
      const { copyFile } = await import('fs/promises');
      await copyFile(file.path, filePath);
      const { unlink } = await import('fs');
      unlink(file.path, () => {});
    }

    // 创建附件记录
    return this.prisma.meetingAttachment.create({
      data: {
        meetingId,
        name: file.originalname,
        url: `/uploads/meetings/${fileName}`,
        size: file.size,
        type: file.mimetype,
      },
    });
  }

  async addAttachment(meetingId: number, name: string, url: string, size?: number, type?: string) {
    return this.prisma.meetingAttachment.create({
      data: {
        meetingId,
        name,
        url,
        size,
        type,
      },
    });
  }

  async deleteAttachment(id: number) {
    return this.prisma.meetingAttachment.delete({
      where: { id },
    });
  }

  // ==================== 统计 ====================

  async getStatistics(organizerId?: number) {
    const where: any = organizerId ? { organizerId } : {};

    const [total, completed, pendingTasks, overdueTasks] = await Promise.all([
      this.prisma.meeting.count({ where }),
      this.prisma.meeting.count({ where: { ...where, status: 'completed' } }),
      this.prisma.meetingTask.count({
        where: { meeting: where, status: { not: 'done' } },
      }),
      this.prisma.meetingTask.count({
        where: {
          meeting: where,
          status: { not: 'done' },
          dueDate: { lt: new Date() },
        },
      }),
    ]);

    return {
      totalMeetings: total,
      completedMeetings: completed,
      pendingTasks,
      overdueTasks,
    };
  }
}
