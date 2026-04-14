import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DistributionModule } from './distribution/distribution.module';
import { DefectsModule } from './defects/defects.module';
import { MeetingsModule } from './meetings/meetings.module';
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
    DistributionModule,
    DefectsModule,
    MeetingsModule,
    ProductionModule,
  ],
  controllers: [],
  providers: [PrismaService],
})
export class AppModule {}
