import { Module } from '@nestjs/common';
import { DefectsController } from './defects.controller';
import { DefectsService } from './defects.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [DefectsController],
  providers: [DefectsService, PrismaService],
  exports: [DefectsService],
})
export class DefectsModule {}
