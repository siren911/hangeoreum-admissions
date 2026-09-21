'use client';

import { ChevronDown, ArrowUpRight } from 'lucide-react';
import { historicalScoreContext, gradeRangeLabel, absoluteRawRange, satGradeCuts, satSources, percentileKeys, type Scores } from '@j/core';
import styles from './score-context.module.css';

const names = { korean: '국어 · 화작', math: '수학 · 미적분', world: '세계지리', korea: '한국지리' };
export default function ScoreContext({ scores, title, showKoreanMedicineTarget = true }: { scores: Scores; title: string; showKoreanMedicineTarget?: boolean }) {
  return <section className={styles.section} aria-label="2026 수능 기준 등급과 점수 해설">
    <header><span>점수 읽는 법 · 2026학년도 수능 기준</span><h2>이 백분위, 어느 정도 점수일까요?</h2><p>선택 성적: <b>{title}</b>. 2026 수능 성적 분포에 대입한 비교입니다. 2027 성적을 환산한 값은 아닙니다.</p></header>
    <div className={styles.grid}>
      {percentileKeys.map(key => { const c = historicalScoreContext(key, scores[key]); return <article key={key}><span>{names[key]}</span><strong>{gradeRangeLabel(key, scores[key])}</strong><p>백분위 <b>{scores[key] ?? '—'}</b></p><small>{c ? `2026 표준점수 ${c.standardMin}${c.standardMin === c.standardMax ? '' : `~${c.standardMax}`}점${c.exact ? '' : ' 부근'}` : '0~100의 정수를 입력하세요'}</small></article>; })}
      {(['english', 'history'] as const).map(key => <article key={key}><span>{key === 'english' ? '영어' : '한국사'}</span><strong>{absoluteRawRange(key, scores[key]) ? `${scores[key]}등급` : '등급 확인 필요'}</strong><p>원점수 <b>{absoluteRawRange(key, scores[key]) ?? '—'}</b></p><small>절대평가 · 등급별 원점수 범위</small></article>)}
    </div>
    <p className={styles.note}>국수탐의 원점수는 백분위만으로 정할 수 없습니다. 같은 백분위에 표준점수·등급이 여러 개면 범위로 표시하고, 2026년에 없던 백분위는 양옆 구간으로 안내합니다.</p>
    {showKoreanMedicineTarget && <div className={styles.target}><b>한의대 준비용 실전 연습 목표</b><span>화작 <strong>95점 이상</strong> · 미적분 <strong>96점 이상</strong> · 지리 각각 <strong>48~50점</strong> · 영어 <strong>93~95점</strong></span><small>국어·수학·영어 100점, 탐구 과목당 50점 만점. 실수 여유를 두기 위한 학습 제안이며 선택한 백분위의 환산 원점수나 합격컷이 아닙니다.</small></div>}
    <details className={styles.details}><summary>2026 수능 1·2·3등급컷과 출처 보기 <ChevronDown size={16} /></summary>
      <div className={styles.tableWrap}><table><caption>확정 표준점수컷과 당시 원점수 추정치를 구분합니다</caption><thead><tr><th>과목</th><th>1등급</th><th>2등급</th><th>3등급</th><th>점수 종류</th></tr></thead><tbody>
        {percentileKeys.map(key => <tr key={key}><th>{names[key]}<small>확정 표준점수</small></th>{satGradeCuts[key].slice(0, 3).map((cut, i) => <td key={i}>{cut}점</td>)}<td>평가원 확정 표준점수</td></tr>)}
        <tr><th>화작<small>EBS 예상 원점수</small></th><td>90점</td><td>82점</td><td>74점</td><td>EBS 예상 원점수</td></tr>
        <tr><th>미적분<small>EBS 예상 원점수</small></th><td>87점</td><td>78점</td><td>69점</td><td>EBS 예상 원점수</td></tr>
        <tr><th>영어<small>확정 원점수</small></th><td>90점</td><td>80점</td><td>70점</td><td>확정 원점수</td></tr>
        <tr><th>한국사<small>확정 원점수</small></th><td>40점</td><td>35점</td><td>30점</td><td>확정 원점수</td></tr>
      </tbody></table></div>
      <p>각 등급이 시작되는 하한 점수입니다. EBS 원점수는 <b>2025.11.13 시험일 20시 가채점 예상</b>으로, 최종 확정컷과 구분해 읽어주세요. 화작·미적분은 공통/선택 과목 득점 조합에 따라 원점수컷이 달라질 수 있습니다. 두 지리의 원점수컷은 확인된 자료가 없어 표준점수컷만 제공합니다.</p>
      <p>표준점수·등급은 평가원 공개 CSV를 사용했습니다. 백분위는 같은 표준점수 인원의 절반을 포함한 하위 누적 비율을 정수로 반올림하여 재구성했습니다. 이 비교값을 대학 환산점수 계산기에 자동 입력하지 않습니다.</p>
      <div className={styles.links}><a href={satSources.grades} target="_blank" rel="noreferrer">평가원 등급컷 <ArrowUpRight size={13} /></a><a href={satSources.distribution} target="_blank" rel="noreferrer">평가원 성적 분포 <ArrowUpRight size={13} /></a><a href={satSources.raw} target="_blank" rel="noreferrer">EBS 당시 발표 <ArrowUpRight size={13} /></a></div>
    </details>
  </section>;
}
