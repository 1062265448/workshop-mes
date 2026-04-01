import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DistributionModule } from './distribution/distribution.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    CommonModule,
    DistributionModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
