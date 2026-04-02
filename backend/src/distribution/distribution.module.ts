import { Module } from '@nestjs/common';
import { DistributionController } from './distribution.controller';
import { DistributionService } from './distribution.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [DistributionController],
  providers: [DistributionService, PrismaService],
  exports: [DistributionService],
})
export class DistributionModule {}
