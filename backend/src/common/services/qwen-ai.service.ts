import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';

@Injectable()
export class QwenAIService {
  private readonly logger = new Logger(QwenAIService.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get('LLM_API_KEY') || 'sk-7520063d83b24e48989e169eaa263906';
    this.baseUrl = 'https://dashscope.aliyuncs.com/compatible-mode/v1';
  }

  /**
   * 识别库存表格图片
   * @param imagePath 图片路径
   * @returns 识别的库存数据数组
   */
  async identifyInventoryTable(imagePath: string): Promise<any[]> {
    try {
      this.logger.log(`📷 开始识别库存表格：${imagePath}`);

      // 读取图片并转换为 Base64
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      const mimeType = this.getMimeType(imagePath);
      const imageUrl = `data:${mimeType};base64,${base64Image}`;

      // 调用千问 VL 模型
      const result = await this.callQwenVL(imageUrl);

      this.logger.log(`✅ AI 识别完成，识别到 ${result.length} 条记录`);
      
      return result;
    } catch (error: any) {
      this.logger.error(`❌ AI 识别失败：${error.message}`);
      throw error;
    }
  }

  /**
   * 调用千问 VL 模型识别图片
   */
  private async callQwenVL(imageUrl: string): Promise<any[]> {
    const prompt = `你是一位专业的数据录入员。请识别这张库存计量报表图片，提取表格中的所有数据。

表格包含以下列：
- 包号：数字（如 41, 42, 43...）
- 块数：数字（如 34, 33, 32...）
- 净重：数字，单位 kg（如 1523.5）
- 净重小计：数字，单位 kg（某些行有合计值）
- 毛重：数字，单位 kg（如 1529.5）
- 牌号：字符串（如 Ni9996）
- 批号：字符串（如 26-7-084J）
- 计量员：字符串（如 刘娟）
- 日期：日期（如 2026-03-26）

请返回 JSON 数组格式，每个对象包含：
{
  "packageNo": 包号（数字）,
  "pieceCount": 块数（数字）,
  "netWeight": 净重（数字）,
  "netWeightSubtotal": 净重小计（数字或 null）,
  "grossWeight": 毛重（数字）,
  "grade": 牌号（字符串）,
  "batchNo": 批号（字符串）,
  "inspector": 计量员（字符串）,
  "date": 日期（字符串，格式 YYYY-MM-DD）
}

只返回 JSON 数组，不要其他说明文字。如果某些字段无法识别，设为 null。`;

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'qwen-vl-plus',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: imageUrl },
              },
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`千问 API 调用失败：${response.status} ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';

    this.logger.log(`📝 AI 返回内容：${content.substring(0, 200)}...`);

    // 解析 JSON
    try {
      // 提取 JSON 部分（可能包含在代码块中）
      // 先尝试匹配数组格式 [...]
      let jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const items = JSON.parse(jsonMatch[0]);
        if (Array.isArray(items)) {
          return items;
        }
      }
      
      // 再尝试匹配对象格式 {...}
      jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        // 将批号、牌号、日期应用到每个 item
        const { batchNo, grade, date, items } = parsed;
        if (items && Array.isArray(items)) {
          return items.map((item: any) => ({
            ...item,
            batchNo: item.batchNo || batchNo,
            grade: item.grade || grade,
            date: item.date || date,
          }));
        }
        return parsed;
      }
      
      // 最后尝试直接解析
      return JSON.parse(content);
    } catch (parseError) {
      this.logger.warn(`⚠️ JSON 解析失败：${parseError}`);
      this.logger.warn(`原始内容：${content}`);
      return [];
    }
  }

  /**
   * 获取文件 MIME 类型
   */
  private getMimeType(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase() || '';
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
    };
    return mimeTypes[ext] || 'image/jpeg';
  }

  /**
   * 测试 API 连接
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
