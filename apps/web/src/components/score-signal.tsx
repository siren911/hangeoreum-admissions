'use client';

import { ArrowDown, ArrowRight, ArrowUpRight, ChevronDown, Sparkles } from 'lucide-react';
import { evaluateSignal, gradeRangeLabel, absoluteRawRange, percentileKeys, signalLabels, SIGNAL_AS_OF, AS_OF, planningSamples, formatScore, schools, type Result, type PlanningSample, type Scores, type SignalLevel } from '@j/core';
import styles from './score-signal.module.css';

const levels: SignalLevel[] = ['red', 'yellow', 'green', 'gray'];
export function SignalBadge({ result }: { result: Result }) {
  const signal = evaluateSignal(result);
  return <span className={`${styles.badge} ${styles[signal.level]}`} title={signal.reason} data-signal={signal.level}><i aria-hidden="true" />{signal.label}</span>;
}

export function SignalLine({ result }: { result: Result }) {
  const signal = evaluateSignal(result);
  return <div className={styles.line}><SignalBadge result={result} /><span>{signal.level === 'gray' ? '자료·입력 확인 필요' : signal.level === 'green' ? '여유 목표 도달' : `초록까지 +${formatScore(signal.toGreen)}${result.schoolId === 'GCU' ? ' 지표점' : '점'}`}</span></div>;
}

export function SignalDetail({ result }: { result: Result }) {
  const signal = evaluateSignal(result);
  const school = schools.find(s => s.id === result.schoolId)!;
  const r = signal.rule;
  return <div className={styles.detail}>
    <div className={styles.detailTitle}><strong>2027 계획 신호등</strong><SignalBadge result={result} /></div>
    <p>{signal.reason}</p>
    {r && <>
      <div className={styles.outlook}><span>2027 예상 기준선 · 계획용</span><b>{r.outlook}<small>{r.outlookUnit}</small></b></div>
      {result.schoolId === 'SJUB' && <p className={styles.metricNote}>위 범위는 수능백분위 지표입니다. 아래 총점 기준은 한국사 1등급·검정고시 감점 0점을 가정한 별도 학습 목표입니다.</p>}
      <div className={styles.ranges}>
        <div className={styles.red}><span>● 위험</span><b>{formatScore(r.yellowAt)} 미만</b></div>
        <div className={styles.yellow}><span>● 중간</span><b>{formatScore(r.yellowAt)} 이상<br />{formatScore(r.greenAt)} 미만</b></div>
        <div className={styles.green}><span>● 안정 목표</span><b>{formatScore(r.greenAt)} 이상</b></div>
      </div>
      <small>이 대학 환산점수 {r.unit} 기준 · 초록은 제안 목표 도달 표시</small>
      <details className={styles.method}>
        <summary>예상 범위·여유 점수는 어떻게 정했나요?<ChevronDown size={15} /></summary>
        <dl><dt>공식 과거 결과</dt><dd>{r.reference}</dd><dt>2027 예상 기준선 · 계획용</dt><dd><b>{r.outlook}</b> {r.outlookUnit}</dd><dt>범위를 정한 가정</dt><dd>{r.assumption}</dd><dt>초록 기준을 정한 가정</dt><dd>{r.buffer}. 여유 폭은 상담용 수동 제안이며 통계적으로 검증된 안전폭이 아닙니다.</dd><dt>해석 조건</dt><dd>{r.limitation}</dd></dl>
        <a href={school.historicalSource ?? school.source} target="_blank" rel="noreferrer">공식 과거 결과 원문 <ArrowUpRight size={13} /></a>
      </details>
    </>}
    {!r && <a className={styles.holdSource} href={school.historicalSource ?? school.source} target="_blank" rel="noreferrer">공식 자료 확인 <ArrowUpRight size={13} /></a>}
  </div>;
}

export function SignalHero({ sample, results, onSelect, onLoad }: { sample: PlanningSample; results: Result[]; onSelect: (id: string) => void; onLoad: (scores: Scores, title: string) => void }) {
  const count = Object.fromEntries(levels.map(level => [level, results.filter(r => evaluateSignal(r).level === level).length])) as Record<SignalLevel, number>;
  const presets = [
    { id: 'challenge', label: '보완이 필요한 예시', color: 'red', detail: '영어·한국사 2등급' },
    { id: 'base', label: '기본 목표 예시', color: 'yellow', detail: '영어·한국사 1등급' },
    { id: 'buffer', label: '여유를 높인 예시', color: 'green', detail: '영어·한국사 1등급' },
  ];
  const scoreFields = [['국어 · 화작', sample.scores.korean], ['수학 · 미적', sample.scores.math], ['세계지리', sample.scores.world], ['한국지리', sample.scores.korea], ['영어', sample.scores.english], ['한국사', sample.scores.history]];
  return <section className={styles.hero} aria-label="점수별 지원 준비 신호등">
    <div className={styles.heroHeading}><span className={styles.kicker}><Sparkles size={14} />2027 한의대 · 재현만의 입시 설계</span><h1>어디를 목표로,<br /><em>얼마나 더 올려야 할까?</em></h1><p>가상 점수 하나로 대학별 목표와 남은 거리를 확인하세요.<br /><b>재현의 현재 성적은 사용하지 않았습니다.</b></p></div>
    <div className={styles.sampleTray}><div className={styles.trayHeading}><b>01</b> 먼저, 비교할 성적을 골라보세요 <span>국수탐은 백분위</span></div>
      <div className={styles.presets}>{presets.map(p => { const s = planningSamples.find(x => x.id === p.id)!; return <button key={p.id} data-tone={p.color} aria-pressed={sample.id === p.id} onClick={() => onSelect(p.id)}><span className={styles.presetLabel}><i />{p.label}</span><strong>{s.scores.korean}<i> / </i>{s.scores.math}<i> / </i>{s.scores.world}<i> / </i>{s.scores.korea}</strong><small>국어 / 수학 / 세지 / 한지 · {p.detail}</small></button>; })}</div>
      <div className={styles.moreSamples}><span>다른 조합도 비교</span>{planningSamples.filter(s => s.id === 'english2' || s.id === 'dongshin').map(s => <button key={s.id} aria-pressed={sample.id === s.id} onClick={() => onSelect(s.id)}>{s.title}<ArrowRight size={12} /></button>)}</div>
    </div>
    <div className={styles.summary}>
      <header><span>선택한 가상 성적</span><b>{sample.title}</b><small>예시별 색은 학교별 신호등에서 확인하세요</small></header>
      <div className={styles.scoreRow}>{scoreFields.map(([label, value], i) => <div key={label}><span>{label}</span><strong>{value}<small>{i > 3 ? '등급' : ''}</small></strong><small>{i < 4 ? '백분위' : '절대평가'}</small><small className={styles.gradeHint}>{i < 4 ? `2026 비교 · ${gradeRangeLabel(percentileKeys[i], Number(value))}` : `원점수 ${absoluteRawRange(i === 4 ? 'english' : 'history', Number(value))}`}</small></div>)}</div>
      <div className={styles.counts} aria-live="polite" aria-atomic="true">{levels.map(level => <div key={level} data-tone={level}><span><i />{signalLabels[level]}</span><b>{count[level]}<small>개</small></b></div>)}</div>
      <div className={styles.summaryFooter}><p>초록 = 제안한 여유 목표 도달. <b>합격확률이나 합격 보장은 아닙니다.</b><br />회색 = 자료·입력 부족. 점수가 낮다는 뜻은 아닙니다.</p><button onClick={() => onLoad({ ...sample.scores }, sample.title)}>직접 점수 바꾸기 <ArrowRight size={16} /></button></div>
    </div>
    <div className={styles.legend}><span><i data-tone="red" />위험 <small>기준선 상단 미달</small></span><span><i data-tone="yellow" />중간 <small>상단 도달 · 여유 부족</small></span><span><i data-tone="green" />안정 목표 <small>상단 + 여유 점수</small></span><a href="#j-signal-method">예상 점수 기준 보기 <ArrowDown size={13} /></a></div>
  </section>;
}

export function SignalMethod({ results }: { results: Result[] }) {
  return <section id="j-signal-method" className={styles.methodSection}>
    <div className={styles.methodHeading}><span>2027 SCORE GUIDE</span><h2>올해 목표는, 이 기준으로 제안합니다</h2><p>예상 기준선은 과거 공개 결과에 변동 가정을 둔 <b>계획용 범위</b>입니다. 검증된 컷 예측은 아닙니다.<br />신호등은 그 범위의 <b>상단</b>부터 중간, 추가 여유를 확보하면 초록으로 표시합니다.</p></div>
    <div className={styles.methodGrid}>{results.filter(result => evaluateSignal(result).rule).map(result => { const s = schools.find(s => s.id === result.schoolId)!; return <article key={s.id}><h3>{s.shortName} <small>{s.track}</small></h3><SignalDetail result={result} /></article>; })}</div>
    <p className={styles.methodNote}>제안일 {SIGNAL_AS_OF.replaceAll('-', '.')} · 공식 자료 확인일 {AS_OF.replaceAll('-', '.')}. 올해 응시자 증가율을 점수에 곱하지 않았습니다. 수능 이후 공식 성적·변환표·수시 이월 인원과 같은 기준의 과거 자료로 다시 검토해야 합니다.</p>
  </section>;
}
