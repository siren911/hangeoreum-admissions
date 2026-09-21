import { z } from 'zod';

const percentile = z.number().int().min(0).max(100).nullable();
const grade = z.number().int().min(1).max(9).nullable();
const standard = z.number().int().min(0).max(200).nullable();
export const scoreSchema = z.object({
  korean: percentile, math: percentile, world: percentile, korea: percentile,
  english: grade, history: grade,
  koreanStandard: standard, mathStandard: standard,
  worldStandard: standard, koreaStandard: standard,
  absenceDays: z.number().int().min(0).max(1000),
  gedPenalty: z.union([z.literal(0),z.literal(5),z.literal(10),z.literal(15)]).nullable().default(null),
}).strict();
export type Scores = z.infer<typeof scoreSchema>;
export const percentileKeys = ['korean', 'math', 'world', 'korea'] as const;
export type PercentileKey = typeof percentileKeys[number];
export const labels: Record<keyof Scores, string> = {
  korean: '국어', math: '수학', world: '세계지리', korea: '한국지리',
  english: '영어', history: '한국사', koreanStandard: '국어 표준점수',
  mathStandard: '수학 표준점수', worldStandard: '세계지리 표준점수',
  koreaStandard: '한국지리 표준점수', absenceDays: '미인정 결석 환산일수',
  gedPenalty: '검정고시 평균 구간에 따른 감점',
};
export const emptyScores = (): Scores => ({
  korean: null, math: null, world: null, korea: null, english: null, history: null,
  koreanStandard: null, mathStandard: null, worldStandard: null, koreaStandard: null, absenceDays: 0, gedPenalty: null,
});
export const makeTarget = (k: number, m: number, w: number, g: number, e = 1, h = 1): Scores => ({
  ...emptyScores(), korean: k, math: m, world: w, korea: g, english: e, history: h, gedPenalty: 0,
});
export const commonTarget = makeTarget(98, 99, 98, 98);
export type Gun = '가' | '나' | '다';
export type SchoolId = 'GCU' | 'DJU' | 'DSU' | 'PNU' | 'KHU' | 'DEU' | 'WSU' | 'WKU' | 'SMU' | 'DGU2' | 'SJUB';
export type School = {
  id: SchoolId; name: string; shortName: string; track: string; gun: Gun; region: string;
  accent: string; character: string; target: Scores; targetText: string;
  lead: string; strategy: string[]; bonus: string; englishChange: string;
  historyTip: string; formula: string; basis: 'percentile' | 'standard';
  source: string; page: string; historical: string; historicalSource?: string;
  inquiry: 'best' | 'average';
};
export type Step = { label: string; expression: string; value: string; kind: 'base' | 'bonus' | 'deduction' | 'rounding' };
export type Result = {
  schoolId: SchoolId; status: 'calculated' | 'provisional' | 'missing_input' | 'waiting_table' | 'invalid';
  total: string | null; rawTotal: string | null; steps: Step[]; missing: string[];
  notes: string[]; unit: string; ruleVersion: string; engineVersion: string;
  eligibility: 'needs_review'; subjectCondition: 'pass';
};
export const RULE_VERSION = '2027-J-20260915-v2';
export const ENGINE_VERSION = '0.2.0';
export const AS_OF = '2026-09-15';
export const scenarioRequestSchema = z.object({
  name: z.string().trim().min(1).max(60), scores: scoreSchema,
  ruleVersion: z.literal(RULE_VERSION), origin: z.enum(['manual', 'school_target', 'score_copy']),
  parentId: z.string().uuid().nullable().default(null), idempotencyKey: z.string().uuid(),
}).strict();
export type ScenarioRequest = z.infer<typeof scenarioRequestSchema>;
export type SavedScenario = {
  id: string; name: string; scores: Scores; results: Result[]; createdAt: string;
  ruleVersion: string; engineVersion: string; origin: ScenarioRequest['origin']; parentId: string | null;
  location: 'device' | 'cloud';
};
