import { describe, expect, it } from 'vitest';
import { admissionResults2026, filterAdmissionResults, professionalOptions } from '../packages/core/src/index';

const row = (id: string) => {
  const result = admissionResults2026.find(r => r.id === id);
  if (!result) throw new Error(`Missing historical track: ${id}`);
  return result;
};

describe('2026 historical admissions data', () => {
  it('keeps actual 2026 seats separate from the 2027 plan', () => {
    const actual = { 'yonsei-dent': 27, 'yonsei-med': 48, 'korea-med': 22, 'wku-dent-human': 2, 'wku-dent-natural': 12, 'wku-med': 13, 'gachon-med': 13 };
    for (const [id, seats] of Object.entries(actual)) {
      expect(row(id).year).toBe(2026);
      expect(row(id).seats).toBe(seats);
      expect(row(id).seats).not.toBe(professionalOptions.find(o => o.id === id)?.seats);
    }
    expect(row('gcu-km').seats).toBe(21);
    expect(row('dsu-km').seats).toBe(10);
    expect(row('wsu-km').seats).toBe(7);
  });

  it('does not present means or all-admitted results as registered 70% cuts', () => {
    expect(row('wsu-km').statistic).toBe('registered-mean');
    expect(row('deu-km-calculus').statistic).toBe('registered-mean');
    expect(row('smu-km').statistic).toBe('admitted-70');
    expect(row('dju-km').statistic).toBe('registered-80');
    expect(row('dgu-km-2').statistic).toBe('registered-80');
    const cutIds = filterAdmissionResults('korean-medicine', '', 'registered-70').map(r => r.id);
    for (const id of ['wsu-km', 'deu-km-calculus', 'smu-km', 'dju-km', 'dgu-km-2']) expect(cutIds).not.toContain(id);
    expect(row('smu-km').metrics[0]).toMatchObject({ value: 99.3, unit: '/100점' });
  });

  it('does not fill withheld humanities scores with natural-science scores or zero', () => {
    for (const id of ['wku-km-human', 'wku-dent-human']) {
      expect(row(id)).toMatchObject({ status: 'withheld', statistic: null, metrics: [] });
      expect(row(id).profile).toBeUndefined();
    }
    expect(row('wku-km-natural').metrics[0].value).toBe(559.9);
    expect(row('wku-dent-natural').metrics[0].value).toBe(562.4);
  });

  it('keeps unverified results and missing counts distinct from non-disclosure and zero', () => {
    expect(row('pnu-km')).toMatchObject({ status: 'unverified', seats: null, gun: null, metrics: [] });
    expect(row('smu-km').seats).toBeNull();
    expect(row('deu-km-calculus').gun).toBeNull();
    expect(row('deu-km-calculus').seats).toBe(11);
  });

  it('uses the original professional score and profile without inventing a common average cut', () => {
    for (const option of professionalOptions) {
      const historical = option.historical;
      if (historical.kind === 'profile') {
        expect(row(option.id).metrics).toHaveLength(1);
        expect(row(option.id).metrics[0].value).toBe(historical.converted70);
        expect(row(option.id).profile).toMatchObject(historical.profile);
      }
    }
    expect(row('ajou-med').profile?.english).toBe(3);
    expect(row('hanyang-med').metrics[0].value).toBe(887.71);
  });

  it('retains the source, year, unit and publication status on every track', () => {
    expect(new Set(admissionResults2026.map(r => r.id)).size).toBe(admissionResults2026.length);
    for (const r of admissionResults2026) {
      expect(r.year).toBe(2026);
      expect(new URL(r.source.url).protocol).toMatch(/^https?:$/);
      expect(r.source.page.length).toBeGreaterThan(3);
      expect(r.seats === null || (Number.isInteger(r.seats) && r.seats > 0)).toBe(true);
      if (r.status === 'published') {
        expect(r.statistic).not.toBeNull();
        expect(r.metrics.length).toBeGreaterThan(0);
        for (const metric of r.metrics) {
          expect(Number.isFinite(metric.value)).toBe(true);
          expect(metric.value).toBeGreaterThan(0);
          expect(metric.unit.length).toBeGreaterThan(0);
        }
      } else expect(r.metrics).toEqual([]);
    }
  });

  it('combines category, whitespace-insensitive search, and publication filters', () => {
    expect(filterAdmissionResults('dentistry', ' 원 광 ', 'withheld').map(r => r.id)).toEqual(['wku-dent-human']);
    expect(filterAdmissionResults('medicine', '원광', 'withheld')).toEqual([]);
    expect(filterAdmissionResults('all', 'NOT A UNIVERSITY')).toEqual([]);
    expect(filterAdmissionResults('korean-medicine', 'w i s e', 'registered-80')).toHaveLength(2);
  });
});
