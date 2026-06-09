import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);
  private client: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      this.logger.error('OPENAI_API_KEY is not set');
      throw new Error('OPENAI_API_KEY missing');
    }
    this.client = new OpenAI({ apiKey });
  }

  /**
   * Generate a completion from OpenAI with optional temperature.
   * Returns the raw response text.
   */
  async generate(prompt: string, temperature = 0.7): Promise<string> {
    this.logger.log('Calling OpenAI API');
    try {
      const completion = await this.client.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature,
        response_format: { type: 'json_object' },
      });
      return completion.choices[0].message.content ?? '';
    } catch (err) {
      this.logger.error('OpenAI API error', err);
      throw err;
    }
  }
}
