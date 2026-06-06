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
      this.logger.warn('OPENAI_API_KEY is missing. Will try failovers or simulations.');
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
      const activeName = campaigns.length > 0 ? campaigns[0].name : "No active campaigns";
      const roasVal = campaigns.length > 0 ? campaigns[0].roas : "0.0x";
      const mockReply = `[Mock AI Response]: Based on your organization's data, your active campaign (${activeName}) is performing at ${roasVal} ROAS. (Configure OPENAI_API_KEY, ANTHROPIC_API_KEY, or GEMINI_API_KEY to enable full live advice)`;
      await this.logUsage(email, 'chat_simulated', 'MOCK', 50, 0.0);
      return mockReply;
    }

    for (const provider of providersToTry) {
      try {
        this.logger.log(`Attempting AI generation via: ${provider}`);
        const result = await this.executeProviderCall(provider, systemPrompt, userMessage);
        
        await this.logUsage(email, 'chat_query', provider, result.tokens, result.cost);
        return result.text;
      } catch (err) {
        this.logger.error(`AI call to ${provider} failed: ${err.message}. Trying next provider in failover chain...`);
      }
    }

    return 'Sorry, all active AI providers returned errors. Please verify API key configurations.';
  }

  async generateCampaign(params: any) {
    // Return structured AI Campaign metadata
    const name = `${params.businessName || 'Business'} - AI Accelerated PMax`;
    return {
      campaignName: name,
      adGroups: [
        { 
          name: 'High-Intent Search Terms', 
          keywords: ['buy software online', 'best saas tool', 'enterprise solution', 'b2b platform'],
          copy: { headline: "Scale Your Business Faster", description: "The #1 rated enterprise solution for automated Revenue." }
        },
        { 
          name: 'Competitor Conquesting', 
          keywords: ['alternative to hubspot', 'salesforce replacement', 'cheaper crm'],
          copy: { headline: "Switch & Save 50% Today", description: "Don't overpay for legacy systems. Migrate your team in 24 hours." }
        },
        { 
          name: 'Retargeting (Meta/IG)', 
          keywords: ['website visitors 30d', 'cart abandoners', 'newsletter subscribers'],
          copy: { headline: "Still thinking about it?", description: "Claim your 14-day free trial before the offer expires this Friday." }
        }
      ],
      budget: params.budget || '$50/day',
      targeting: {
        demographics: ['Age 25-45', 'Top 10% Household Income'],
        interests: ['Software Development', 'Marketing Strategy', 'B2B Services'],
        locations: ['United States', 'United Kingdom', 'Canada']
      },
      forecast: {
        estimatedCPA: '$24.50',
        predictedConversions: '145/mo',
        roasPotential: '3.8x'
      }
    };
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
}
