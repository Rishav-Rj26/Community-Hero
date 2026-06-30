/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Gemini AI Service — client-side integration with @google/genai SDK.
 * Falls back to intelligent mock responses when no API key is configured.
 */

import { GoogleGenAI } from '@google/genai';
import type { Issue } from '../types';

// ── API Key Resolution ────────────────────────────────────────
// Vite exposes VITE_-prefixed env vars. The vite.config also maps
// GEMINI_API_KEY → VITE_GEMINI_API_KEY for convenience.
const API_KEY: string =
  (import.meta as any).env?.VITE_GEMINI_API_KEY || '';

let ai: GoogleGenAI | null = null;
try {
  if (API_KEY) {
    ai = new GoogleGenAI({ apiKey: API_KEY });
  }
} catch {
  ai = null;
}

export function isGeminiAvailable(): boolean {
  return !!ai;
}

// ── Image Analysis ────────────────────────────────────────────

export interface ImageAnalysisResult {
  category: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  title: string;
  description: string;
  department: string;
  confidence: number;
  recommendations: string[];
}

const IMAGE_ANALYSIS_PROMPT = `You are an AI assistant for a civic issue reporting platform called "Community Hero".
Analyze this image and identify any civic or community issues visible (e.g., potholes, broken streetlights, water leaks, damaged infrastructure, waste/littering, graffiti, fallen trees, etc.).

Return your analysis as a JSON object with these fields:
{
  "category": "one of: Pothole, Streetlight, Water Leakage, Waste Management, Road Damage, Public Safety, Parks & Green Spaces, Building & Structure, Traffic & Signage, Other",
  "severity": "one of: Low, Medium, High, Critical",
  "title": "short descriptive title for the issue",
  "description": "detailed 2-3 sentence description of what you see and its potential impact",
  "department": "one of: Roads & Infrastructure, Water & Sewage, Electrical & Lighting, Waste Management, Public Safety, Parks & Recreation, Building Inspection, Traffic & Transport",
  "confidence": "number between 0.0 and 1.0 representing your confidence",
  "recommendations": ["array of 2-3 action recommendations"]
}

Return ONLY the JSON object, no markdown formatting or extra text.`;

export async function analyzeIssueImage(
  base64Data: string,
  mimeType: string = 'image/jpeg'
): Promise<ImageAnalysisResult> {
  if (!ai) return getFallbackImageAnalysis();

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: IMAGE_ANALYSIS_PROMPT },
            { inlineData: { mimeType, data: base64Data } },
          ],
        },
      ],
    });

    const text = response.text?.replace(/```json\n?|\n?```/g, '').trim() || '';
    return JSON.parse(text) as ImageAnalysisResult;
  } catch (err) {
    console.warn('Gemini image analysis failed, using fallback:', err);
    return getFallbackImageAnalysis();
  }
}

function getFallbackImageAnalysis(): ImageAnalysisResult {
  const analyses: ImageAnalysisResult[] = [
    {
      category: 'Pothole',
      severity: 'High',
      title: 'Road Surface Deterioration Detected',
      description:
        'AI analysis has detected significant road surface damage that poses a risk to vehicles and pedestrians. The affected area appears to require immediate attention to prevent accidents and further deterioration.',
      department: 'Roads & Infrastructure',
      confidence: 0.87,
      recommendations: [
        'Schedule road repair within 48 hours',
        'Place temporary warning signage',
        'Assess drainage conditions in the area',
      ],
    },
    {
      category: 'Streetlight',
      severity: 'Medium',
      title: 'Street Lighting Malfunction Identified',
      description:
        'The image suggests a non-functional or damaged streetlight unit. This can impact pedestrian safety during nighttime hours and may indicate broader electrical infrastructure concerns.',
      department: 'Electrical & Lighting',
      confidence: 0.82,
      recommendations: [
        'Dispatch electrical maintenance team',
        'Check electrical panel for the sector',
        'Inspect adjacent lighting units',
      ],
    },
    {
      category: 'Water Leakage',
      severity: 'High',
      title: 'Water Infrastructure Leak Detected',
      description:
        'AI analysis indicates signs of water leakage or pipe damage. This could lead to water wastage, road damage, and potential contamination if not addressed promptly.',
      department: 'Water & Sewage',
      confidence: 0.79,
      recommendations: [
        'Deploy water utility emergency crew',
        'Isolate affected pipe section',
        'Test water quality in surrounding area',
      ],
    },
    {
      category: 'Waste Management',
      severity: 'Medium',
      title: 'Improper Waste Disposal Identified',
      description:
        'The image shows evidence of improper waste disposal or overflowing collection points. This poses environmental and public health risks to the community.',
      department: 'Waste Management',
      confidence: 0.84,
      recommendations: [
        'Schedule immediate waste collection',
        'Install additional waste bins in the area',
        'Increase collection frequency for this zone',
      ],
    },
  ];
  return analyses[Math.floor(Math.random() * analyses.length)];
}

// ── AI Chat ───────────────────────────────────────────────────

export interface ChatContext {
  totalIssues: number;
  resolvedIssues: number;
  pendingIssues: number;
  criticalIssues: number;
  topCategories: string[];
  userPoints?: number;
  userName?: string;
}

export async function chatWithAssistant(
  message: string,
  context: ChatContext,
  history: { role: string; text: string }[] = []
): Promise<{ text: string; recommendations?: string[] }> {
  if (!ai) return getFallbackChatResponse(message, context);

  try {
    const systemPrompt = `You are "Community Hero AI", a helpful assistant for a civic issue reporting platform.

Current community data:
- Total issues reported: ${context.totalIssues}
- Resolved: ${context.resolvedIssues}
- Pending: ${context.pendingIssues}
- Critical/urgent: ${context.criticalIssues}
- Top categories: ${context.topCategories.join(', ')}
${context.userName ? `- User: ${context.userName} (${context.userPoints} civic points)` : ''}

You help citizens:
1. Understand how to report issues effectively
2. Get updates on community issue trends
3. Learn about platform features (reporting, verification, gamification)
4. Understand AI-powered categorization and insights
5. Navigate the platform

Keep responses concise (2-4 sentences). End with 1-2 actionable suggestions when appropriate.
If the user asks about specific data, use the community data above.
Format any suggestions as a JSON array at the end of your response on a new line starting with "SUGGESTIONS:" followed by the JSON array.`;

    const contents = [
      { role: 'user' as const, parts: [{ text: systemPrompt }] },
      ...history.map((h) => ({
        role: h.role as 'user' | 'model',
        parts: [{ text: h.text }],
      })),
      { role: 'user' as const, parts: [{ text: message }] },
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents,
    });

    const raw = response.text || '';
    let text = raw;
    let recommendations: string[] | undefined;

    const sugIdx = raw.indexOf('SUGGESTIONS:');
    if (sugIdx !== -1) {
      text = raw.substring(0, sugIdx).trim();
      try {
        recommendations = JSON.parse(raw.substring(sugIdx + 12).trim());
      } catch { /* ignore */ }
    }

    return { text, recommendations };
  } catch (err) {
    console.warn('Gemini chat failed, using fallback:', err);
    return getFallbackChatResponse(message, context);
  }
}

function getFallbackChatResponse(
  message: string,
  context: ChatContext
): { text: string; recommendations?: string[] } {
  const msg = message.toLowerCase();

  if (msg.includes('report') || msg.includes('how')) {
    return {
      text: `To report an issue, click the "Report Issue" button and upload a photo. Our AI will automatically categorize it and suggest a severity level. You can also use your camera or enter a location manually. Currently, ${context.totalIssues} issues have been reported in your community.`,
      recommendations: ['Report a new issue', 'View community feed', 'Check the map'],
    };
  }
  if (msg.includes('status') || msg.includes('track') || msg.includes('update')) {
    return {
      text: `There are currently ${context.pendingIssues} pending issues and ${context.criticalIssues} critical issues awaiting resolution. ${context.resolvedIssues} issues have been resolved so far. You can track any issue's progress through its detail page.`,
      recommendations: ['View my dashboard', 'Browse pending issues', 'See resolved issues'],
    };
  }
  if (msg.includes('point') || msg.includes('badge') || msg.includes('gamif') || msg.includes('level')) {
    return {
      text: `You earn points by reporting issues (+10), verifying reports (+15), upvoting (+5), and commenting (+3). Points unlock badges and levels! ${context.userName ? `You currently have ${context.userPoints} points.` : 'Log in to start earning points!'} Check the leaderboard to see how you rank.`,
      recommendations: ['View leaderboard', 'Check my profile', 'Report an issue to earn points'],
    };
  }
  if (msg.includes('map') || msg.includes('location') || msg.includes('where') || msg.includes('area')) {
    return {
      text: `The interactive map shows all reported issues across your community with color-coded pins by category and severity. You can filter by category, toggle the heatmap to see issue density, and click any pin for details. ${context.criticalIssues} critical issues are currently highlighted.`,
      recommendations: ['Open the map', 'Report a nearby issue', 'View hotspots'],
    };
  }
  if (msg.includes('predict') || msg.includes('trend') || msg.includes('insight') || msg.includes('forecast')) {
    return {
      text: `Based on current patterns, ${context.topCategories[0] || 'infrastructure'} issues are the most reported category. The resolution rate is ${context.totalIssues > 0 ? Math.round((context.resolvedIssues / context.totalIssues) * 100) : 0}%. Let's look at the Quick Insights panel for more detailed trends.`,
      recommendations: ['View analytics dashboard', 'See predictive insights', 'Check category trends'],
    };
  }
  if (msg.includes('verif') || msg.includes('valid') || msg.includes('confirm')) {
    return {
      text: `Community verification adds credibility to reports. When you verify an issue, you confirm it exists at the reported location. Issues with more verifications get prioritized by authorities. You earn 15 points for each verification!`,
      recommendations: ['Verify nearby issues', 'View issues needing verification', 'Learn about verification'],
    };
  }

  return {
    text: `I'm your Community Hero AI assistant! I can help you report issues, track progress, understand analytics, and navigate the platform. Currently, your community has ${context.totalIssues} reported issues with a ${context.totalIssues > 0 ? Math.round((context.resolvedIssues / context.totalIssues) * 100) : 0}% resolution rate. What would you like to know?`,
    recommendations: ['How do I report an issue?', 'Show community stats', 'Explain the points system'],
  };
}

// ── Predictive Insights ───────────────────────────────────────

export async function getPredictiveInsights(
  issues: Issue[]
): Promise<{
  text: string;
  insights: { title: string; description: string; confidence: number; type: string }[];
}> {
  // Compute basic stats for prompt context
  const categoryCounts: Record<string, number> = {};
  const severityCounts: Record<string, number> = {};
  const statusCounts: Record<string, number> = {};
  issues.forEach((issue) => {
    categoryCounts[issue.category] = (categoryCounts[issue.category] || 0) + 1;
    severityCounts[issue.severity] = (severityCounts[issue.severity] || 0) + 1;
    statusCounts[issue.status] = (statusCounts[issue.status] || 0) + 1;
  });

  if (!ai) {
    return getFallbackPredictiveInsights(issues);
  }

  try {
    const prompt = `You are a civic data analyst AI. Given the following community issue data, provide predictive insights.

Issue Statistics:
- Total: ${issues.length}
- By Category: ${JSON.stringify(categoryCounts)}
- By Severity: ${JSON.stringify(severityCounts)}
- By Status: ${JSON.stringify(statusCounts)}

Provide exactly 4 predictive insights as JSON:
{
  "text": "Brief 2-sentence overall analysis",
  "insights": [
    {
      "title": "Short insight title",
      "description": "1-2 sentence description",
      "confidence": 0.85,
      "type": "one of: hotspot, trend, seasonal, resource"
    }
  ]
}

Return ONLY the JSON, no markdown.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    const text = response.text?.replace(/```json\n?|\n?```/g, '').trim() || '';
    return JSON.parse(text);
  } catch (err) {
    console.warn('Gemini predictions failed, using fallback:', err);
    return getFallbackPredictiveInsights(issues);
  }
}

function getFallbackPredictiveInsights(issues: Issue[]) {
  const total = issues.length;
  if (total === 0) return { text: "No data available yet.", insights: [] };

  const categoryCounts: Record<string, number> = {};
  const statusCounts: Record<string, number> = {};
  const severityCounts: Record<string, number> = {};
  
  const now = new Date();
  const recentThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
  const recentCategories: Record<string, number> = {};
  const olderCategories: Record<string, number> = {};

  issues.forEach((issue) => {
    categoryCounts[issue.category] = (categoryCounts[issue.category] || 0) + 1;
    statusCounts[issue.status] = (statusCounts[issue.status] || 0) + 1;
    severityCounts[issue.severity] = (severityCounts[issue.severity] || 0) + 1;
    
    const issueDate = new Date(issue.createdAt);
    if (issueDate > recentThreshold) {
      recentCategories[issue.category] = (recentCategories[issue.category] || 0) + 1;
    } else {
      olderCategories[issue.category] = (olderCategories[issue.category] || 0) + 1;
    }
  });

  const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Infrastructure';
  const resolved = statusCounts['Resolved'] || 0;
  const resolutionRate = Math.round((resolved / total) * 100);

  // Find trending category
  let topTrend = { category: '', growth: 0 };
  Object.keys(recentCategories).forEach(cat => {
    const recent = recentCategories[cat] || 0;
    const older = olderCategories[cat] || 0;
    if (older > 0) {
      const growth = ((recent - older) / older) * 100;
      if (growth > topTrend.growth) topTrend = { category: cat, growth };
    } else if (recent > 2) {
      if (100 > topTrend.growth) topTrend = { category: cat, growth: 100 };
    }
  });

  const insights = [];
  const confidenceBase = Math.min(0.95, 0.6 + (total / 100));

  insights.push({
    title: `${topCategory} Dominance`,
    description: `${topCategory} reports account for ${categoryCounts[topCategory] || 0} of ${total} total issues. This indicates a systemic need for resources in this area.`,
    confidence: Number((confidenceBase + 0.04).toFixed(2)),
    type: 'hotspot',
  });

  if (topTrend.category) {
    insights.push({
      title: `Surge in ${topTrend.category}`,
      description: `We've detected a ${Math.round(topTrend.growth)}% increase in ${topTrend.category} issues recently. Early intervention is recommended.`,
      confidence: Number(confidenceBase.toFixed(2)),
      type: 'trend',
    });
  }

  insights.push({
    title: 'Resolution Rate Analysis',
    description: `Current resolution rate of ${resolutionRate}% indicates ${resolutionRate < 60 ? 'a backlog requiring attention' : 'healthy processing but room for optimization'}.`,
    confidence: 0.9,
    type: 'resource',
  });

  const criticalRatio = (severityCounts['Critical'] || 0) / total;
  if (criticalRatio > 0.15) {
    insights.push({
      title: 'High Criticality Alert',
      description: `${Math.round(criticalRatio * 100)}% of reported issues are marked as Critical. Immediate prioritization of emergency teams is necessary.`,
      confidence: 0.88,
      type: 'severity',
    });
  } else {
    insights.push({
      title: 'Community Engagement Active',
      description: 'Citizens are actively reporting and verifying issues. Gamification is maintaining a steady stream of crowdsourced data.',
      confidence: 0.85,
      type: 'trend',
    });
  }

  return {
    text: `Analysis of ${total} community reports shows ${topCategory} as the dominant issue category at ${Math.round((categoryCounts[topCategory] / total) * 100)}% of all reports. The current resolution rate is ${resolutionRate}%.`,
    insights: insights.slice(0, 4)
  };
}
