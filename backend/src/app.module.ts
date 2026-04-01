import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DistributionModule } from './distribution/distribution.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DistributionModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
