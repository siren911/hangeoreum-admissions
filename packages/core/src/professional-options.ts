import Decimal from 'decimal.js';
import type { Scores } from './types';
import { professionalCatalog } from './professional-catalog';

export type ProfessionalCategory = 'dentistry' | 'medicine';
export type ProfessionalHistory = {
  year: 2026; selection: string; source: string; page: string; note: string;
} & (
  | { kind: 'profile'; converted70: number; profile: { korean: number; math: number; inquiry1: number; inquiry2: number; english: number; history: number }; inquiryNote: string }
  | { kind: 'cut'; converted70?: number; percentile70: number; metric: 'khu-natural' | 'four-mean' | null; metricLabel: string }
  | { kind: 'withheld' | 'unverified' }
);
export type ProfessionalOption = {
  id: string; category: ProfessionalCategory; university: string; program: string; selection: string;
  location: string; metro: boolean; gun: '가' | '나' | '다'; seats: number;
  eligibility: 'allowed' | 'science-required' | 'women-only';
  eligibilityReason: string; bonusGap: boolean; bonus: string; method: string; ged: string; preparation: string;
  source: string; sourcePage: string; extraSource?: { url: string; label: string };
  historical: ProfessionalHistory;
};
export const PROFESSIONAL_AS_OF = '2026-09-19';
export const professionalOptions: ProfessionalOption[] = professionalCatalog;

// User-selected first choices for J's social-studies combination, not an admissions ranking.
export const professionalPriorityIds: Record<ProfessionalCategory, readonly string[]> = {
  dentistry: ['wku-dent-human'],
  medicine: ['hanyang-med', 'ajou-med'],
};
export function getProfessionalOptions(category: ProfessionalCategory, scope: 'priority' | 'all' = 'priority'): ProfessionalOption[] {
  const ids = professionalPriorityIds[category];
  const priorities = ids.flatMap(id => professionalOptions.filter(o => o.id === id && o.category === category));
  return scope === 'priority' ? priorities : [...priorities, ...professionalOptions.filter(o => o.category === category && !ids.includes(o.id))];
}


export function professionalReference(option: ProfessionalOption): Decimal | null {
  const h = option.historical;
  if (h.kind === 'profile') {
    const p = h.profile;
    return new Decimal(p.korean).plus(p.math).plus(new Decimal(p.inquiry1).plus(p.inquiry2).div(2)).div(3);
  }
  return h.kind === 'cut' && h.metric ? new Decimal(h.percentile70) : null;
}

export function compareProfessionalOption(option: ProfessionalOption, scores: Scores) {
  const unavailable = (status: 'ineligible' | 'conditional' | 'missing' | 'unavailable', label: string) => ({ status, label, value: null, reference: null, gap: null });
  // Eligibility is a gate, never overridden by high hypothetical scores.
  if (option.eligibility === 'science-required') return unavailable('ineligible', '현재 과목으로 지원 불가');
  if (option.eligibility === 'women-only') return unavailable('conditional', '여성 지원자 조건 확인 필요');
  const keys = ['korean', 'math', 'world', 'korea', 'english', 'history'] as const;
  if (keys.some(k => scores[k] === null || !Number.isInteger(scores[k]) || scores[k]! < (k === 'english' || k === 'history' ? 1 : 0) || scores[k]! > (k === 'english' || k === 'history' ? 9 : 100))) return unavailable('missing', '성적 6개 입력 필요');
  const reference = professionalReference(option);
  if (reference === null) return unavailable('unavailable', option.historical.kind === 'withheld' ? '입결 비공개 · 점수 비교 보류' : '동일 기준의 점수 비교 보류');
  const k = new Decimal(scores.korean!), m = new Decimal(scores.math!);
  const t = new Decimal(scores.world!).plus(scores.korea!).div(2);
  const h = option.historical;
  const metric = h.kind === 'cut' ? h.metric : 'profile';
  const value = metric === 'khu-natural' ? k.mul('.25').plus(m.mul('.40')).plus(t.mul('.35'))
    : metric === 'four-mean' ? k.plus(m).plus(t.mul(2)).div(4)
    : k.plus(m).plus(t).div(3);
  const gap = value.minus(reference);
  const status = gap.gte(2) ? 'above' : gap.lt(-2) ? 'below' : 'near';
  return { status, value: value.toFixed(2), reference: reference.toFixed(2), gap: gap.toFixed(2), label: status === 'above' ? '과거 참고값 상회' : status === 'below' ? '과거 참고값 미달' : '과거 참고값 근접' };
}

export function professionalComparisonFormula(option: ProfessionalOption): string {
  const h = option.historical;
  if (h.kind === 'profile') return '(국어 + 수학 + (탐구1 + 탐구2) ÷ 2) ÷ 3. 공개된 70% 위치의 과목 성적을 같은 방식으로 계산한 참고평균과 비교합니다. 이 평균은 대학이 발표한 백분위 합격컷이 아닙니다.';
  if (h.kind === 'cut' && h.metric === 'khu-natural') return '국어 × 0.25 + 수학 × 0.40 + 두 탐구 평균 × 0.35. 경희대 자연계열의 백분위 반영지표와 비교하며, 표준점수로 계산한 대학 환산총점과는 다릅니다.';
  if (h.kind === 'cut' && h.metric === 'four-mean') return '(국어 + 수학 + 탐구1 + 탐구2) ÷ 4. 가톨릭대가 공개한 반영 과목 백분위 단순평균 70%컷과 비교합니다.';
  return '같은 기준의 비교값을 확인하지 못했거나 지원 조건이 충족되지 않아 점수 비교를 제공하지 않습니다.';
}
