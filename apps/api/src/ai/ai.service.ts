import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { CampaignsService } from '../campaigns/campaigns.service';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../jobs/queue.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private openai: OpenAI | null = null;
  private readonly openAiKey = process.env.OPENAI_API_KEY;
  private readonly openAiBaseUrl = process.env.OPENAI_BASE_URL;
  private readonly anthropicKey = process.env.ANTHROPIC_API_KEY;
  private readonly geminiKey = process.env.GEMINI_API_KEY;

  constructor(
    private campaignsService: CampaignsService,
    private prisma: PrismaService,
    private queueService: QueueService,
  ) {
    if (this.openAiKey) {
      this.openai = new OpenAI({
        apiKey: this.openAiKey,
        ...(this.openAiBaseUrl ? { baseURL: this.openAiBaseUrl } : {})
      });
    } else {
      this.logger.warn('OPENAI_API_KEY is missing. Using configured alternative providers only.');
    }
  }

  async getChatResponse(userMessage: string, email: string = 'arjun@Revenuepilot.com'): Promise<string> {
    const campaigns = (await this.campaignsService.getCampaigns(email)).slice(0, 5);
    const context = JSON.stringify(campaigns);
    const systemPrompt = `You are an expert Ads Manager AI. Analyze this campaign data to answer user questions: ${context}`;

    const providersToTry = [];
    if (this.openAiKey) providersToTry.push('openai');
    if (this.anthropicKey) providersToTry.push('anthropic');
    if (this.geminiKey) providersToTry.push('gemini');

    if (providersToTry.length === 0) {
      return 'AI provider unavailable. Configure OPENAI_API_KEY, ANTHROPIC_API_KEY, or GEMINI_API_KEY to enable live AI responses.';
    }

    for (const provider of providersToTry) {
      try {
        this.logger.log(`Attempting AI generation via: ${provider}`);
        const result = await this.executeProviderCall(provider, systemPrompt, userMessage);

        await this.logUsage(email, 'chat_query', provider, result.tokens, result.cost);
        await this.storeAiInsight(email, 'chat', {
          prompt: userMessage,
          response: result.text,
          provider,
          tokens: result.tokens,
          cost: result.cost,
        });

        return result.text;
      } catch (err) {
        this.logger.error(`AI call to ${provider} failed: ${err.message}. Trying next provider in failover chain...`);
      }
    }

    return 'Sorry, all configured AI providers returned errors. Please verify API key configurations.';
  }

  async generateCampaign(params: any) {
    const providersToTry = [];
    if (this.openAiKey) providersToTry.push('openai');
    if (this.anthropicKey) providersToTry.push('anthropic');
    if (this.geminiKey) providersToTry.push('gemini');

    if (providersToTry.length === 0) {
      throw new Error('No configured AI provider available. Configure OPENAI_API_KEY, ANTHROPIC_API_KEY, or GEMINI_API_KEY.');
    }

    const businessName = params.businessName || 'the business';
    const prompt = `You are a marketing campaign strategist. Generate a campaign plan for ${businessName} using the following input: ${JSON.stringify(params)}. Return a JSON object with fields: campaignName, adGroups (name, keywords, copy headline, copy description), budget, targeting, forecast (estimatedCPA, predictedConversions, roasPotential).`;
    const systemPrompt = `You are a high-performing AI campaign planner. Only output valid JSON.`;

    for (const provider of providersToTry) {
      try {
        this.logger.log(`Generating campaign via: ${provider}`);
        const result = await this.executeProviderCall(provider, systemPrompt, prompt);

        await this.logUsage(params.userEmail || 'system', 'generate_campaign', provider, result.tokens, result.cost);
        await this.storeAiInsight(params.userEmail || 'system', 'campaign_generation', {
          prompt,
          response: result.text,
          provider,
          tokens: result.tokens,
          cost: result.cost,
        });

        try {
          return JSON.parse(result.text);
        } catch (parseError) {
          return { rawOutput: result.text };
        }
      } catch (err) {
        this.logger.error(`Campaign generation call to ${provider} failed: ${err.message}. Trying next provider...`);
      }
    }

    throw new Error('Campaign generation failed for all configured AI providers.');
  }

  private async executeProviderCall(provider: string, systemPrompt: string, userMessage: string) {
    if (provider === 'openai' && this.openai) {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
      });
      const text = completion.choices[0].message.content || '';
      const tokens = completion.usage?.total_tokens || (systemPrompt.length + userMessage.length + text.length) / 4;
      const cost = ((completion.usage?.prompt_tokens || 0) * 0.005 + (completion.usage?.completion_tokens || 0) * 0.015) / 1000;

      return { text, tokens, cost };
    }

    if (provider === 'anthropic' && this.anthropicKey) {
      // Direct HTTP fetch to Anthropic Claude messages endpoint
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': this.anthropicKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1024,
          system: systemPrompt,
          messages: [{ role: 'user', content: userMessage }],
        }),
      });

      if (!res.ok) {
        throw new Error(`Anthropic API returned status ${res.status}`);
      }

      const data = await res.json();
      const text = data.content?.[0]?.text || '';
      const inputTokens = data.usage?.input_tokens || 0;
      const outputTokens = data.usage?.output_tokens || 0;
      const tokens = inputTokens + outputTokens;
      const cost = (inputTokens * 0.003 + outputTokens * 0.015) / 1000;

      return { text, tokens, cost };
    }

    if (provider === 'gemini' && this.geminiKey) {
      // Direct HTTP fetch to Google Gemini content endpoint
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${this.geminiKey}`,
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  { text: `${systemPrompt}\n\nUser Question: ${userMessage}` },
                ],
              },
            ],
          }),
        },
      );

      if (!res.ok) {
        throw new Error(`Gemini API returned status ${res.status}`);
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      // Estimate tokens based on word counts
      const estimatedWords = (systemPrompt.length + userMessage.length + text.length) / 4.7;
      const tokens = Math.ceil(estimatedWords * 1.3);
      const cost = (tokens * 0.00125) / 1000; // rough average

      return { text, tokens, cost };
    }

    throw new Error(`Provider ${provider} is not configured or available.`);
  }

  private async logUsage(email: string, action: string, provider: string, tokens: number, cost: number) {
    this.logger.log(`AI TELEMETRY: ${action} | Provider: ${provider} | Tokens: ${tokens} | Cost Estimate: $${cost.toFixed(5)}`);
    await this.queueService.queueAiLog(email, action, provider, tokens, cost);
  }

  private async storeAiInsight(email: string, type: string, payload: any) {
    const user = await this.prisma.client.user.findUnique({ where: { email } });
    if (!user) {
      return;
    }

    await this.prisma.client.aiInsight.create({
      data: {
        organizationId: user.organizationId,
        type,
        payload,
      }
    });
  }
}
