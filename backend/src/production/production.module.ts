import { Module } from '@nestjs/common';
import { ProductionController } from './production.controller';
import { ProductionService } from './production.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [ProductionController],
  providers: [ProductionService, PrismaService],
  exports: [ProductionService],
})
export class ProductionModule {}
