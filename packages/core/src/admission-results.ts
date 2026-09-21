import { admissionResults2026 } from './admission-results-catalog';
import Decimal from 'decimal.js';

export type AdmissionCategory = 'korean-medicine' | 'dentistry' | 'medicine';
export type ResultStatistic = 'registered-70' | 'registered-80' | 'registered-mean' | 'admitted-70';
export type HistoricalMetric = { label: string; value: number; unit: string };
export type HistoricalScoreProfile = {
  statistic: 'registered-mean' | 'registered-70';
  korean: number; math: number; inquiry1: number; inquiry2: number;
  english: number; history: number | null;
  grades?: { korean: number; math: number; inquiry1: number; inquiry2: number };
  source?: { url: string; page: string; label: string };
  note: string;
};
export type AdmissionResult2026 = {
  id: string;
  year: 2026;
  category: AdmissionCategory;
  university: string;
  program: string;
  selection: string;
  gun: '가' | '나' | '다' | null;
  seats: number | null;
  seatsNote: string;
  competition: number | null;
  note: string;
  source: { url: string; page: string; label: string };
  checkedAt: string;
  priority?: boolean;
  profile?: HistoricalScoreProfile;
  percentileSum?: { value: number; statistic: 'registered-mean'; english: number; source: { url: string; page: string; label: string } };
  percentilePending?: { label: string; reason: string; source: { url: string; page: string; label: string } };
} & (
  | { status: 'published'; statistic: ResultStatistic; metrics: [HistoricalMetric, ...HistoricalMetric[]] }
  | { status: 'withheld' | 'unverified'; statistic: null; metrics: [] }
);

export const RESULTS_AS_OF = '2026-09-21';
export const admissionCategoryLabels: Record<AdmissionCategory, string> = {
  'korean-medicine': '한의대', dentistry: '치대', medicine: '의대',
};
export const resultStatisticLabels: Record<ResultStatistic, string> = {
  'registered-70': '최종등록자 70%컷',
  'registered-80': '최종등록자 80%컷',
  'registered-mean': '최종등록자 평균',
  'admitted-70': '전체 합격자 70%',
};

// Use the published subject percentiles, never invert a university's converted score.
export function admissionPercentileSummary(row: AdmissionResult2026) {
  if (row.status !== 'published') return null;
  if (row.percentileSum) {
    const sum = row.percentileSum;
    if (!Number.isFinite(sum.value) || sum.value < 0 || sum.value > 300) return null;
    return { average: new Decimal(sum.value).div(3).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(), inquiryAverage: null, basis: sum.statistic };
  }
  const p = row.profile;
  if (!p ||
    ![p.korean, p.math, p.inquiry1, p.inquiry2].every(value =>
      typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100)) return null;
  const inquiry = new Decimal(p.inquiry1).plus(p.inquiry2).div(2);
  const average = new Decimal(p.korean).plus(p.math).plus(inquiry).div(3);
  return {
    average: average.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
    inquiryAverage: inquiry.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
    basis: p.statistic,
  };
}
export type ResultFilter = 'all' | ResultStatistic | 'withheld' | 'unverified';
export function filterAdmissionResults(category: AdmissionCategory | 'all', query = '', statistic: ResultFilter = 'all') {
  const normalized = query.replace(/\s/g, '').toLocaleLowerCase('ko');
  return admissionResults2026.filter(row =>
    (category === 'all' || row.category === category) &&
    `${row.university}${row.program}${row.selection}`.replace(/\s/g, '').toLocaleLowerCase('ko').includes(normalized) &&
    (statistic === 'all' || row.statistic === statistic || row.status === statistic),
  );
}
export { admissionResults2026 };
