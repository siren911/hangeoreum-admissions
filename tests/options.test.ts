import { describe, expect, it } from 'vitest';
import { generalOptions, compareGeneralOption, generalReference, historicalScoreContext, absoluteRawRange, satGradeCuts, makeTarget, emptyScores } from '@j/core';
const option = (id: string) => generalOptions.find(o => o.id === id)!;

describe('same-year general university comparisons', () => {
  it('compares Gachon with its 2026 formula and keeps the changed 2027 formula separate', () => {
    // K80 M90 E1=98 Tbest70. 2026: 98*.35+90*.25+80*.2+70*.2=86.8
    // 2027: 90*.4+80*.3+98*.2+70*.1=86.6
    const result = compareGeneralOption(option('gcu-economics'), makeTarget(80, 90, 70, 60));
    expect(result.value).toBe('86.80');
    expect(result.current).toBe('86.60');
    expect(result.gap).toBe('0.30');
  });
  it('averages the two inquiries before the three-domain SSU average', () => {
    expect(compareGeneralOption(option('ssu-business'), makeTarget(90, 80, 100, 60)).value).toBe('83.33');
  });
  it('uses different Kyung Hee social and natural weights', () => {
    const input = makeTarget(90, 80, 100, 60);
    expect(compareGeneralOption(option('khu-business'), input).value).toBe('83.50');
    expect(compareGeneralOption(option('khu-computer'), input).value).toBe('82.50');
  });
  it('does not compare missing, fractional, out-of-range or non-finite scores', () => {
    for (const bad of [null, NaN, Infinity, -1, 101, 90.5]) {
      expect(compareGeneralOption(option('ssu-law'), { ...makeTarget(90, 90, 90, 90), korean: bad }).status).toBe('missing');
    }
    expect(compareGeneralOption(option('ssu-law'), emptyScores()).value).toBeNull();
    expect(compareGeneralOption(option('ssu-law'), { ...makeTarget(90, 90, 90, 90), english: null }).value).toBeNull();
  });
  it('keeps a school without comparable historical results unclassified even at maximum scores', () => {
    expect(compareGeneralOption(option('cau-human'), makeTarget(100, 100, 100, 100)).status).toBe('unverified');
  });
  it('classifies exact browsing boundaries before rounding', () => {
    const template = { ...option('ssu-business'), cut70: 88 };
    expect(compareGeneralOption(template, makeTarget(90, 90, 90, 90)).status).toBe('above');
    expect(compareGeneralOption({ ...template, cut70: 92 }, makeTarget(90, 90, 90, 90)).status).toBe('near');
    expect(compareGeneralOption({ ...template, cut70: 92.001 }, makeTarget(90, 90, 90, 90)).status).toBe('below');
  });
  it('does not reuse Korean-medicine bonus or GED penalty in unrelated general programs', () => {
    const input = makeTarget(90, 90, 90, 90);
    expect(compareGeneralOption(option('gcu-economics'), { ...input, gedPenalty: 15 })).toEqual(compareGeneralOption(option('gcu-economics'), input));
    expect(generalOptions.every(o => ['서울', '경기'].includes(o.location))).toBe(true);
    expect(option('ssu-computer')).toMatchObject({ gun: '다', seats: 20, eligibility: 'bonus-gap' });
  });
});

describe('expanded Seoul university coverage', () => {
  it('keeps all four requested universities in both tracks regardless of score availability', () => {
    for (const university of ['연세대학교', '고려대학교', '서강대학교', '건국대학교']) {
      const rows = generalOptions.filter(o => o.university === university);
      expect(new Set(rows.map(o => o.track))).toEqual(new Set(['humanities', 'science']));
      for (const row of rows) {
        expect(row.location).toBe('서울');
        expect(row.gun).not.toBeNull();
        expect(row.seats).toBeGreaterThan(0);
        expect(row.comparisonNote).toBeTruthy();
        expect(row.formulaNote).toBeTruthy();
        expect(row.historicalResult?.year).toBe(2026);
        expect(row.historicalResult?.source).toMatch(/^https:\/\//);
        if (row.historicalResult?.relationship === 'predecessor') {
          expect(compareGeneralOption(row, makeTarget(100, 100, 100, 100)).status).toBe('unverified');
        } else {
          expect(compareGeneralOption(row, makeTarget(100, 100, 100, 100)).status).toBe('above');
          expect(compareGeneralOption(row, makeTarget(30, 30, 30, 30)).status).toBe('below');
        }
      }
    }
    expect(new Set(generalOptions.map(o => o.id)).size).toBe(generalOptions.length);
  });
  it('uses current general-admission counts without adding GED-ineligible Korea subject-excellence seats', () => {
    expect(option('korea-business')).toMatchObject({ gun: '가', seats: 73 });
    expect(option('korea-computer')).toMatchObject({ gun: '가', seats: 24, eligibility: 'bonus-gap' });
    expect(option('yonsei-business')).toMatchObject({ gun: '가', seats: 113 });
    expect(option('konkuk-computer')).toMatchObject({ gun: '가', seats: 32 });
    expect(option('sogang-ai-open')).toMatchObject({ gun: '다', seats: 36 });
  });
  it('distinguishes social/science bonuses and the separate Yonsei economics scheme', () => {
    expect(option('yonsei-economics').eligibility).toBe('allowed');
    expect(option('yonsei-computer').eligibility).toBe('bonus-gap');
    expect(option('sogang-computer').eligibility).toBe('allowed');
    expect(option('konkuk-computer').eligibility).toBe('allowed');
    expect(option('yonsei-economics').formulaNote).not.toBe(option('yonsei-business').formulaNote);
  });
});

describe('2026 historical grade display', () => {
  it('retains multiple standard scores at the same percentile', () => {
    expect(historicalScoreContext('korean', 98)).toEqual({ exact: true, gradeMin: 1, gradeMax: 1, standardMin: 137, standardMax: 138 });
  });
  it('shows both neighboring grades for a percentile absent from that exam', () => {
    expect(historicalScoreContext('world', 96)).toEqual({ exact: false, gradeMin: 1, gradeMax: 2, standardMin: 67, standardMax: 68 });
  });
  it('uses official subject-specific boundaries and rejects invalid inputs', () => {
    expect(satGradeCuts.korea.slice(0, 3)).toEqual([68, 65, 59]);
    expect(satGradeCuts.world.slice(0, 3)).toEqual([68, 63, 59]);
    for (const bad of [null, -1, 101, NaN, 90.5]) expect(historicalScoreContext('math', bad)).toBeNull();
  });
  it('gives exact absolute-score ranges without confusing English and history', () => {
    expect(absoluteRawRange('english', 2)).toBe('80~89점');
    expect(absoluteRawRange('english', 9)).toBe('0~19점');
    expect(absoluteRawRange('history', 1)).toBe('40~50점');
    expect(absoluteRawRange('history', 9)).toBe('0~4점');
    expect(absoluteRawRange('history', 0)).toBeNull();
  });
});


describe('verified 2026 general-admission results', () => {
  it('retains the published converted cuts without substituting subject-excellence or regional results', () => {
    const published = {
      'yonsei-business': 670.66, 'yonsei-economics': 671.83, 'yonsei-computer': 663.68,
      'korea-business': 659.91, 'korea-computer': 659.82,
      'sogang-business': 504.06, 'sogang-economics': 505.05, 'sogang-computer': 506.72, 'sogang-ai-open': 508.29,
      'konkuk-business': 667.07, 'konkuk-economics': 667.49, 'konkuk-computer': 669.97,
    };
    for (const [id, cut] of Object.entries(published)) expect(option(id).historicalResult?.convertedCut70).toBe(cut);
    expect(option('korea-business').historicalResult?.selection).toBe('일반전형');
  });
  it('computes the reference from the official subject profile, never from the native converted cutoff', () => {
    // Sogang economics: K99 M88 T77/75 -> (99+88+76)/3 = 87.666...;
    // the university's actual converted 70% cutoff remains 505.05.
    const input = makeTarget(99, 88, 77, 75);
    const result = compareGeneralOption(option('sogang-economics'), input);
    expect(result).toMatchObject({ value: '87.67', reference: '87.67', gap: '0.00', status: 'near' });
    expect(option('sogang-economics').cut70).toBeUndefined();
    expect(generalReference(option('konkuk-business'))?.toFixed(2)).toBe('85.83');
    expect(generalReference(option('yonsei-business'))?.toFixed(2)).toBe('91.83');
  });
  it('keeps English and history in the published profile while excluding them from the simple-mean signal', () => {
    expect(option('sogang-business').historicalResult?.profile).toEqual({ korean: 98, math: 88, inquiry1: 86, inquiry2: 92, english: 2, history: 4 });
    const scores = makeTarget(98, 88, 86, 92);
    expect(compareGeneralOption(option('sogang-business'), { ...scores, english: 9, history: 9 }).value).toBe('91.67');
  });
  it('never assigns an automatic signal to either reorganized computer program', () => {
    for (const id of ['yonsei-computer', 'konkuk-computer']) {
      const row = option(id);
      expect(row.historicalResult?.relationship).toBe('predecessor');
      expect(generalReference(row)).toBeNull();
      expect(compareGeneralOption(row, makeTarget(100, 100, 100, 100))).toMatchObject({ status: 'unverified', reference: null, gap: null, value: null });
    }
    expect(generalOptions.filter(o => generalReference(o) !== null)).toHaveLength(22);
    expect(generalOptions.filter(o => o.historicalResult)).toHaveLength(12);
  });
});
