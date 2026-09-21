import { sat2026Data } from './sat-2026-data';
import type { PercentileKey } from './types';

export const satSources = {
  grades: 'https://www.data.go.kr/data/15080193/fileData.do',
  distribution: 'https://www.data.go.kr/data/15080195/fileData.do',
  raw: 'https://about.ebs.co.kr/board/bbs?boardId=31&boardTypeId=1&cmd=view&postId=30004613418',
};
export const satGradeCuts = { korean: sat2026Data.korean.cuts, math: sat2026Data.math.cuts, world: sat2026Data.world.cuts, korea: sat2026Data.korea.cuts };

/** Historical lookup only. Never writes standard scores into the 2027 calculator. */
export function historicalScoreContext(subject: PercentileKey, percentile: number | null) {
  if (percentile === null || !Number.isInteger(percentile) || percentile < 0 || percentile > 100) return null;
  const values: readonly (readonly [number, number, number])[] = sat2026Data[subject].values;
  let matches = values.filter(v => v[0] === percentile);
  const exact = matches.length > 0;
  if (!exact) {
    const lower = Math.max(...values.filter(v => v[0] < percentile).map(v => v[0]));
    const upper = Math.min(...values.filter(v => v[0] > percentile).map(v => v[0]));
    matches = values.filter(v => v[0] === lower || v[0] === upper);
  }
  const grades = matches.map(v => v[2]);
  const standards = matches.map(v => v[1]);
  return { exact, gradeMin: Math.min(...grades), gradeMax: Math.max(...grades), standardMin: Math.min(...standards), standardMax: Math.max(...standards) };
}

export function gradeRangeLabel(subject: PercentileKey, percentile: number | null) {
  const c = historicalScoreContext(subject, percentile);
  if (!c) return '점수 확인 필요';
  return `${c.gradeMin}${c.gradeMin === c.gradeMax ? '' : `~${c.gradeMax}`}등급${c.exact ? ' 수준' : ' 근접 구간'}`;
}

export function absoluteRawRange(subject: 'english' | 'history', grade: number | null) {
  if (grade === null || !Number.isInteger(grade) || grade < 1 || grade > 9) return null;
  if (subject === 'english') return grade === 9 ? '0~19점' : `${100 - grade * 10}~${grade === 1 ? 100 : 109 - grade * 10}점`;
  return grade === 9 ? '0~4점' : `${45 - grade * 5}~${grade === 1 ? 50 : 49 - grade * 5}점`;
}
