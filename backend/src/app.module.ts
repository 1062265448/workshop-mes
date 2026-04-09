import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ProductionModule } from './production/production.module';
import { CommonModule } from './common/common.module';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    CommonModule,
    // DistributionModule,  // 暂时禁用，待重构
    // DefectsModule,       // 暂时禁用，待修复
    // MeetingsModule,      // 暂时禁用
    ProductionModule,
  ],
  controllers: [],
  providers: [PrismaService],
})
export class AppModule {}
