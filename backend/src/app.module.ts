import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // 后续添加的模块：
    // TypeOrmModule.forRootAsync(...),
    // AuthModule,
    // UserModule,
    // MeetingModule,
    // SafetyModule,
    // ProductionModule,
    // ProjectModule,
    // DefectTypesModule,
    // DistributionModule,
    // UploadModule,
    // LlmModule (可选),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
