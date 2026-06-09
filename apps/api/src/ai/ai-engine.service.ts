import { Injectable, Logger } from '@nestjs/common';
import { OpenAIService } from './openai.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Core AI engine orchestrating various intelligence tasks.
 * Each method builds a prompt, calls OpenAIService, and parses JSON results.
 */
@Injectable()
export class AiEngineService {
  private readonly logger = new Logger(AiEngineService.name);

  constructor(
    private readonly openAI: OpenAIService,
    private readonly prisma: PrismaService,
  ) {}

  /** Generic helper to call OpenAI with a prompt and parse JSON response */
  private async callAi<T>(prompt: string): Promise<T> {
    const raw = await this.openAI.generate(prompt, 0.7);
    try {
      // Attempt to parse JSON; fallback to raw string if parsing fails
      return JSON.parse(raw) as T;
    } catch (e) {
      this.logger.error('Failed to parse AI response as JSON', e);
      // Return raw string casted to any to avoid breaking callers
      return raw as any;
    }
  }

  // ---------- Recommendation methods ----------
  async getBudgetRecommendations(orgId: string) {
    const prompt = `You are a SaaS marketing assistant. Provide budget allocation recommendations for organization ${orgId}. Return JSON with fields: recommendedBudget (number), rationale (string).`;
    return this.callAi<{ recommendedBudget: number; rationale: string }>(prompt);
  }

  async getCreativeRecommendations(orgId: string) {
    const prompt = `Provide creative asset suggestions (e.g., copy, images) for organization ${orgId}. Return JSON array of objects with fields: type, suggestion, rationale.`;
    return this.callAi<any[]>(prompt);
  }

  async getAudienceRecommendations(orgId: string) {
    const prompt = `Suggest audience targeting ideas for organization ${orgId}. Return JSON array with fields: segmentName, criteria, rationale.`;
    return this.callAi<any[]>(prompt);
  }

  async getKeywordRecommendations(orgId: string) {
    const prompt = `Generate a list of high‑potential keywords for organization ${orgId}. Return JSON array with fields: keyword, expectedCTR, rationale.`;
    return this.callAi<any[]>(prompt);
  }

  // ---------- Opportunity detection ----------
  async detectOpportunities(orgId: string) {
    const prompt = `Analyze the current campaign data for organization ${orgId} and identify opportunities such as underperforming campaigns, budget waste, audience fatigue, and creative fatigue. Return JSON object with arrays for each category containing relevant identifiers and brief explanations.`;
    return this.callAi<any>(prompt);
  }

  // ---------- Scoring ----------
  async computeScores(orgId: string) {
    const prompt = `Compute health, growth, and optimization scores (0‑100) for organization ${orgId} based on its marketing performance data. Return JSON with fields: healthScore, growthScore, optimizationScore, commentary.`;
    return this.callAi<any>(prompt);
  }

  // ---------- Forecasting ----------
  async forecastMetrics(orgId: string) {
    const prompt = `Provide revenue, lead, and ROAS forecasts for the next 30 days for organization ${orgId}. Return JSON with fields: revenueForecast, leadForecast, roasForecast, confidenceInterval.`;
    return this.callAi<any>(prompt);
  }

  /** Store insight payload in Prisma */
  async storeInsight(orgId: string, type: string, payload: any) {
    await this.prisma.client.aiInsight.create({
      data: {
        organizationId: orgId,
        type,
        payload,
      },
    });
  }
}
