import { describe, it, expect } from 'vitest';
import { calculate, commonTarget, emptyScores, evaluateSignal, planningSamples, signalRules, SIGNAL_VERSION, schools, type SchoolId } from '@j/core';

describe('planning traffic lights, separate from admissions probability', () => {
  it.each(['GCU', 'DJU', 'DSU', 'DGU2', 'SJUB'] as SchoolId[])('%s includes exact lower bounds without rounding first', id => {
    const result = calculate(id, commonTarget);
    const rule = signalRules[id]!;
    const at = (total: string) => evaluateSignal({ ...result, total });
    expect(at(String(Number(rule.yellowAt) - 0.001)).level).toBe('red');
    expect(at(rule.yellowAt).level).toBe('yellow');
    expect(at(String(Number(rule.greenAt) - 0.001)).level).toBe('yellow');
    expect(at(rule.greenAt).level).toBe('green');
    expect(at(rule.greenAt).toGreen).toBe('0');
    expect(at(rule.greenAt).version).toBe(SIGNAL_VERSION);
  });
  it('uses the sample totals rather than assigning colors from preset names', () => {
    const high = planningSamples.find(x => x.id === 'buffer')!.scores;
    expect(evaluateSignal(calculate('GCU', high)).level).toBe('green');
    expect(evaluateSignal(calculate('DGU2', high)).level).toBe('yellow');
    expect(evaluateSignal(calculate('DGU2', high)).toGreen).toBe('2');
    expect(evaluateSignal(calculate('WSU', high)).level).toBe('gray');
    const base = evaluateSignal(calculate('GCU', commonTarget));
    expect(base.level).toBe('yellow');
    expect(base.toGreen).toBe('0.2');
    expect(evaluateSignal(calculate('GCU', { ...commonTarget, english: 2 })).level).toBe('red');
  });
  it('does not treat a mean, a different population, or unpublished results as a cut', () => {
    const complete = { ...commonTarget, koreanStandard: 140, mathStandard: 140, worldStandard: 68, koreaStandard: 68 };
    for (const id of ['WSU', 'SMU', 'WKU', 'KHU', 'DEU', 'PNU'] as SchoolId[]) {
      const signal = evaluateSignal(calculate(id, complete));
      expect(signal.level).toBe('gray');
      expect(signal.rule).toBeNull();
      expect(signal.toGreen).toBeNull();
    }
  });
  it('does not label missing, invalid, or old scores as red or green', () => {
    const result = calculate('GCU', commonTarget);
    expect(evaluateSignal(calculate('GCU', emptyScores())).level).toBe('gray');
    expect(evaluateSignal(calculate('GCU', { ...commonTarget, math: 101 })).level).toBe('gray');
    for (const total of [null, '', 'NaN', 'Infinity', '-1']) expect(evaluateSignal({ ...result, total }).level).toBe('gray');
    expect(evaluateSignal({ ...result, ruleVersion: 'old' }).level).toBe('gray');
    expect(evaluateSignal({ ...result, engineVersion: 'old' }).level).toBe('gray');
  });
  it('changes Sangji with actual history and GED deductions, keeping the target fixed', () => {
    expect(evaluateSignal(calculate('SJUB', commonTarget)).level).toBe('green');
    expect(evaluateSignal(calculate('SJUB', { ...commonTarget, history: 2 })).level).toBe('yellow');
    expect(evaluateSignal(calculate('SJUB', { ...commonTarget, gedPenalty: 5 })).level).toBe('yellow');
    expect(evaluateSignal(calculate('SJUB', { ...commonTarget, gedPenalty: 10 })).level).toBe('red');
    expect(evaluateSignal(calculate('SJUB', { ...commonTarget, gedPenalty: null })).level).toBe('gray');
  });
  it('starts with a red example and covers every school with a readable explanation', () => {
    const sample = planningSamples.find(x => x.id === 'challenge')!;
    for (const id of Object.keys(signalRules) as SchoolId[]) expect(evaluateSignal(calculate(id, sample.scores)).level).toBe('red');
    for (const s of schools) expect(evaluateSignal(calculate(s.id, sample.scores)).reason.length).toBeGreaterThan(10);
  });
});
