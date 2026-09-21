import { describe, it, expect } from 'vitest';
import { professionalOptions, getProfessionalOptions, compareProfessionalOption, professionalReference, makeTarget, emptyScores, type ProfessionalOption } from '@j/core';

const get = (id: string) => professionalOptions.find(o => o.id === id)!;
describe('medical and dental eligibility and evidence', () => {
  it('separates 2027 eligible seats from excluded and conditional seats', () => {
    const allowed = professionalOptions.filter(o => o.eligibility === 'allowed');
    expect(allowed.filter(o => o.category === 'dentistry').reduce((n,o) => n+o.seats,0)).toBe(69);
    expect(allowed.filter(o => o.category === 'medicine').reduce((n,o) => n+o.seats,0)).toBe(255);
    expect(get('wku-dent-human').seats).toBe(4);
    expect(get('wku-dent-natural').seats).toBe(6);
  });
  it.each(['gachon-med','wku-med','wku-dent-natural'])('%s cannot be made eligible by perfect scores', id => {
    const result = compareProfessionalOption(get(id), makeTarget(100,100,100,100,1,1));
    expect(result.status).toBe('ineligible');
    expect(result.value).toBeNull();
  });
  it.each(['ewha-med-human','ewha-med-natural'])('%s does not infer J’s gender or issue an admissions signal', id => {
    expect(compareProfessionalOption(get(id), makeTarget(100,100,100,100)).status).toBe('conditional');
  });
  it('does not borrow the natural dentistry result for Wonkwang humanities', () => {
    expect(get('wku-dent-human').historical.kind).toBe('withheld');
    expect(professionalReference(get('wku-dent-human'))).toBeNull();
    expect(compareProfessionalOption(get('wku-dent-human'), makeTarget(100,100,100,100)).status).toBe('unavailable');
  });
  it('uses the correct general-admission native 70% scores', () => {
    const expected = { 'yonsei-med':660, 'yonsei-dent':684.4, 'korea-med':698.74, 'cau-med':815.24, 'hanyang-med':887.71, 'ajou-med':989.71, 'catholic-med':666.5, 'khu-med':420.81, 'khu-dent':414.96 };
    for (const [id, value] of Object.entries(expected)) {
      const h = get(id).historical;
      expect('converted70' in h && h.converted70).toBe(value);
    }
  });
  it('preserves different comparison metrics and does not compare native totals to percentiles', () => {
    const scores = makeTarget(98,99,98,98);
    expect(compareProfessionalOption(get('yonsei-dent'), scores)).toMatchObject({value:'98.33',reference:'98.33',gap:'0.00'});
    expect(compareProfessionalOption(get('khu-med'), scores)).toMatchObject({value:'98.40',reference:'98.95',gap:'-0.55'});
    expect(compareProfessionalOption(get('catholic-med'), scores)).toMatchObject({value:'98.25',reference:'99.20',gap:'-0.95'});
  });
  it('compares before display rounding', () => {
    const o = get('khu-med');
    const fixture: ProfessionalOption = {...o, historical:{...o.historical,kind:'cut',percentile70:98.005,metric:'khu-natural',metricLabel:'test'}};
    expect(compareProfessionalOption(fixture,makeTarget(100,100,100,100))).toMatchObject({gap:'2.00',status:'near'});
  });
  it('changes the signal with input and retains an explicit comparison-only meaning', () => {
    expect(compareProfessionalOption(get('khu-dent'),makeTarget(95,95,95,95)).status).toBe('below');
    expect(compareProfessionalOption(get('khu-dent'),makeTarget(98,98,98,98)).status).toBe('near');
    expect(compareProfessionalOption(get('khu-dent'),makeTarget(100,100,100,100)).status).toBe('above');
  });
  it.each(['korean','math','world','korea','english','history'] as const)('requires valid %s input', key => {
    for (const invalid of [null,NaN,-1,101,2.5]) expect(compareProfessionalOption(get('yonsei-med'),{...makeTarget(99,99,99,99),[key]:invalid}).status).toBe('missing');
    expect(compareProfessionalOption(get('yonsei-med'),emptyScores()).status).toBe('missing');
  });
  it('shows the requested social-studies options first without losing the complete catalog', () => {
    expect(getProfessionalOptions('medicine').map(o => o.id)).toEqual(['hanyang-med', 'ajou-med']);
    expect(getProfessionalOptions('dentistry').map(o => o.id)).toEqual(['wku-dent-human']);
    for (const category of ['medicine', 'dentistry'] as const) {
      const all = getProfessionalOptions(category, 'all');
      expect(new Set(all.map(o => o.id)).size).toBe(all.length);
      expect(all).toHaveLength(professionalOptions.filter(o => o.category === category).length);
      expect(all.slice(0, getProfessionalOptions(category).length)).toEqual(getProfessionalOptions(category));
      expect(getProfessionalOptions(category).every(o => o.gun === '나' && o.eligibility === 'allowed')).toBe(true);
    }
  });
  it('uses Ajou general admission rather than its restricted regional or rural seats', () => {
    expect(get('ajou-med')).toMatchObject({gun:'나', seats:10, eligibility:'allowed', bonusGap:true});
    expect(get('ajou-med').historical).toMatchObject({converted70:989.71,profile:{korean:97,math:100,inquiry1:100,inquiry2:99,english:3,history:1}});
    expect(compareProfessionalOption(get('ajou-med'),makeTarget(97,100,100,99,1,1))).toMatchObject({value:'98.83',reference:'98.83',gap:'0.00'});
  });
  it('does not include unverified zero values in published profiles', () => {
    for (const o of professionalOptions) {
      expect(o.source).toMatch(/^https:\/\//);
      expect(o.historical.year).toBe(2026);
      expect(o.seats).toBeGreaterThan(0);
      if(o.historical.kind==='profile') {
        expect(o.historical.profile.english).toBeGreaterThanOrEqual(1);
        expect(o.historical.profile.history).toBeGreaterThanOrEqual(1);
      }
    }
  });
});
