import { Module, Global } from '@nestjs/common';
import { QwenAIService } from './services/qwen-ai.service';

@Global()
@Module({
  providers: [QwenAIService],
  exports: [QwenAIService],
})
export class CommonModule {}
