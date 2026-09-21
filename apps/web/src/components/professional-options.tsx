'use client';

import { useState } from 'react';
import { ArrowRight, ArrowUpRight, ChevronDown, MapPin } from 'lucide-react';
import { getProfessionalOptions, professionalPriorityIds, compareProfessionalOption, professionalComparisonFormula, PROFESSIONAL_AS_OF, makeTarget, type ProfessionalCategory, type ProfessionalOption, type Scores } from '@j/core';
import ScoreContext from './score-context';
import styles from './professional-options.module.css';

const labels = { dentistry: '치대', medicine: '의대' };
function sourceLink(url: string, page: string) {
  const number = page.startsWith('PDF') ? page.match(/\d+/)?.[0] : null;
  return url + (number ? `#page=${number}` : '');
}
function History({ option }: { option: ProfessionalOption }) {
  const h = option.historical;
  return <section className={styles.history} aria-label={`${option.university} ${option.program} 2026 입결`}>
    <header><b>2026 공식 입결</b><span>{h.kind === 'withheld' ? '소수 모집 · 비공개' : h.kind === 'unverified' ? '검증 전' : '최종등록자 70%컷'}</span></header>
    <p>{h.selection}</p>
    {(h.kind === 'profile' || h.kind === 'cut') && <>
      {'converted70' in h && h.converted70 !== undefined && <div className={styles.cut}><span>당시 대학 환산점수</span><strong>{h.converted70.toFixed(2)}<small>점</small></strong></div>}
      {h.kind === 'cut' && <div className={styles.cut}><span>{h.metricLabel}</span><strong>{h.percentile70.toFixed(2)}</strong></div>}
      {h.kind === 'profile' && <><p>70% 위치에 공개된 과목 성적 <small>국수탐 백분위 · 영어/한국사 등급</small></p><dl className={styles.profile}>{Object.entries({ 국어: h.profile.korean, 수학: h.profile.math, 탐구1: h.profile.inquiry1, 탐구2: h.profile.inquiry2, 영어: `${h.profile.english}등급`, 한국사: `${h.profile.history}등급` }).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><small>{h.inquiryNote} 세지·한지 점수나 과목별 최소 요구점수가 아닙니다.</small></>}
    </>}
    {h.note && <p>{h.note}</p>}
    <a href={sourceLink(h.source, h.page)} target="_blank" rel="noreferrer">입결 원문 · {h.page} <ArrowUpRight size={13} /></a>
  </section>;
}

export default function ProfessionalOptions({ category, scores, title, onEdit, onSample }: { category: ProfessionalCategory; scores: Scores; title: string; onEdit: () => void; onSample: (input: Scores, title: string) => void }) {
  const [scope, setScope] = useState<'priority' | 'all'>('priority');
  const [region, setRegion] = useState('전체');
  const [gun, setGun] = useState('전체');
  const [condition, setCondition] = useState('전체');
  const [university, setUniversity] = useState('전체');
  const name = labels[category];
  const fullCatalog = getProfessionalOptions(category, 'all');
  const catalog = getProfessionalOptions(category, scope);
  const allowed = catalog.filter(o => o.eligibility === 'allowed');
  const universities = [...new Set(fullCatalog.map(o => o.university))];
  const options = catalog.filter(o => (region === '전체' || o.metro) && (gun === '전체' || o.gun === gun) && (university === '전체' || o.university === university) && (condition === '전체' || (condition === '지원 가능' ? o.eligibility === 'allowed' : o.eligibility !== 'allowed')));
  const sample = category === 'medicine' ? makeTarget(99, 100, 99, 99, 1, 1) : makeTarget(98, 99, 99, 99, 1, 1);
  const reset = () => { setRegion('전체'); setGun('전체'); setCondition('전체'); setUniversity('전체'); };
  return <div className={styles.root}>
    <section className={styles.intro}>
      <span className={styles.eyebrow}>{category === 'dentistry' ? 'DENTISTRY' : 'MEDICINE'} · 한의대와 함께 검토</span>
      <h2>사탐을 선택한 재현,<br /><em>{category === 'medicine' ? '한양대·아주대부터 비교하세요.' : '원광대 인문 치대를 살펴보세요.'}</em></h2>
      <p>화작 · 미적분 · 세계지리 · 한국지리 / 검정고시 / 일반 정시<br />요청한 대학을 먼저 보여드립니다. 과목 적합성 중심의 검토 대상이며 합격 가능 순위는 아닙니다.</p>
    </section>
    <section className={styles.priorityGuide} aria-label={`${name} 우선 검토 안내`}>
      <b>{category === 'medicine' ? '한양대 의예 44명 · 아주대 의학 10명' : '원광대 치의예과(인문) 4명'}</b>
      <p>{category === 'medicine' ? '두 곳 모두 사탐 2과목과 검정고시 지원을 허용합니다. 한양대는 탐구 가산 추후 공지·수능 비교내신, 아주대는 미적분 3% 가산·과탐 3% 가산·면접 5%를 함께 보세요.' : '사탐 2과목을 허용하고 과탐 가산 격차가 없는 인문 전형입니다. 국어 표준점수를 1.2배 반영합니다. 자연 전형 6명은 과탐 필수이므로 재현의 후보에 합산하지 않습니다.'}</p>
      <strong>한양 의대 · 아주 의대 · 원광 인문 치대는 모두 나군 → 셋 중 1곳만 지원</strong>
      <small>나군 한의대까지 함께 비교해 원서 한 장을 정해야 합니다. 아래 인원을 모두 지원할 수 있다는 뜻은 아닙니다.</small>
    </section>
    <div className={styles.scope} role="group" aria-label={`${name} 검토 범위`}>
      <button aria-pressed={scope === 'priority'} onClick={() => { setScope('priority'); reset(); }}>재현 우선 검토 {professionalPriorityIds[category].length}개 전형</button>
      <button aria-pressed={scope === 'all'} onClick={() => { setScope('all'); reset(); }}>다른 대학도 보기 · 전체 {fullCatalog.length}개 전형</button>
    </div>
    <p className={styles.scopeNote}>{scope === 'priority' ? '요청한 대학을 집중 비교합니다. 다른 사탐 허용 대학도 전체 목록에서 볼 수 있습니다.' : `공식 자료를 검증한 ${universities.length}개 대학 · ${fullCatalog.length}개 전형입니다. 전국 전수 목록은 아닙니다.`}</p>
    <div className={styles.stats}><div><strong>{allowed.length}</strong><span>{scope === 'priority' ? '우선 검토 · 과목·학력 조건 충족' : '목록 중 과목·학력 조건 충족'}</span></div><div><strong>{allowed.reduce((n, o) => n + o.seats, 0)}<small>명</small></strong><span>위 전형의 2027 일반 모집 합계</span></div><div><strong>{scope === 'priority' ? '나군' : catalog.length - allowed.length}</strong><span>{scope === 'priority' ? '우선 검토 전형의 모집군' : '별도 자격 확인 또는 과탐 필수'}</span></div></div>
    <p className={styles.caption}>모집군·인원은 <b>2027 정시요강</b> 기준이며 수시 이월 전입니다. 전년도 입결 인원·지역인재·농어촌 인원을 합산하지 않았습니다.</p>
    <section className={styles.scoreBar} aria-label={`${name}와 공유하는 시뮬레이터 점수`}>
      <div><span>현재 가상 입력 · 실제 재현 성적 아님</span><b>{title}</b><p>국어 {scores.korean ?? '—'} · 수학 {scores.math ?? '—'} · 세지 {scores.world ?? '—'} · 한지 {scores.korea ?? '—'} <small>백분위</small><br />영어 {scores.english ?? '—'}등급 · 한국사 {scores.history ?? '—'}등급</p></div><button onClick={onEdit}>성적 수정하기 <ArrowRight size={15} /></button>
    </section>
    <div className={styles.sample}><div><b>점수 감을 잡는 학습용 예시</b><p>국어 {sample.korean} · 수학 {sample.math} · 세지 {sample.world} · 한지 {sample.korea} / 영어·한국사 1등급<br /><small>공개 성적 수준을 참고한 조합입니다. 올해 예상컷·합격 보장 점수가 아닙니다.</small></p></div><button onClick={() => onSample(sample, `${name} 학습용 조합`)}>이 예시로 비교 <ArrowRight size={14} /></button></div>
    {scope === 'all' && <><section className={styles.picker} aria-label={`${name} 대학 필터`}><b>대학 바로 찾기</b><div>{['전체', ...universities].map(u => <button key={u} aria-pressed={university === u} onClick={() => { setUniversity(u); setRegion('전체'); setGun('전체'); setCondition('전체'); }}>{u.replace('대학교', '대')}</button>)}</div></section>
    <div className={styles.filters}>
      <label>지역 <select value={region} onChange={e => setRegion(e.target.value)}><option>전체</option><option>서울·수도권</option></select></label>
      <label>모집군 <select value={gun} onChange={e => setGun(e.target.value)}><option>전체</option><option>가</option><option>나</option><option>다</option></select></label>
      <label>지원 조건 <select value={condition} onChange={e => setCondition(e.target.value)}><option>전체</option><option>지원 가능</option><option>조건 확인·제한</option></select></label><span>{options.length}개 전형</span>
    </div>
    </>}
    <div className={styles.legend}><span><i data-tone="below" />참고값보다 2점 넘게 낮음</span><span><i data-tone="near" />−2~+2점 미만</span><span><i data-tone="above" />2점 이상 높음</span><p>색은 <b>과거 성적 참고값과의 차이</b>입니다. 과탐 가산·영어·한국사·면접을 포함한 합격 위험도·안정 판정이 아닙니다.</p></div>
    <section className={`${styles.grid} ${options.length === 1 ? styles.single : ''}`} aria-label={`${name} 전형 목록`} aria-live="polite">{options.map(option => {
      const result = compareProfessionalOption(option, scores);
      const allowedOption = option.eligibility === 'allowed';
      return <article key={option.id} className={styles.card} data-eligibility={option.eligibility}>
        <div className={styles.meta}><span><MapPin size={12} />{option.location}</span><b>{option.gun}군 · 일반 {option.seats}명</b></div>
        {professionalPriorityIds[category].includes(option.id) && <span className={styles.priorityBadge}>재현 우선 검토 · 사탐 2과목 허용</span>}
        <h3>{option.university}</h3><h4>{option.program}</h4><p className={styles.selection}>{option.selection}</p>
        <div className={styles.eligibility} data-kind={option.eligibility} data-gap={option.bonusGap}>{option.eligibilityReason}</div>
        <p className={styles.bonus}>{option.bonus}</p>
        <History option={option} />
        <div className={styles.comparison} data-tone={result.status}><b><i />{result.label}</b>{result.value !== null ? <><div><span>입력 참고값<strong>{result.value}</strong></span><span>{option.historical.kind === 'profile' ? '공개 성적 참고평균' : '공식 백분위 참고컷'}<strong>{result.reference}</strong></span><span>차이<strong>{Number(result.gap) > 0 ? '+' : ''}{result.gap}</strong></span></div><p>{option.historical.kind === 'profile' ? '국수탐 단순평균 비교 · 대학이 발표한 백분위 합격컷 아님' : '백분위 지표 비교 · 대학 환산총점 아님'}</p></> : <p>{!allowedOption ? option.preparation : result.status === 'missing' ? '시뮬레이터에서 국수탐 백분위와 영어·한국사 등급을 입력하세요.' : option.historical.note}</p>}</div>
        {allowedOption && <p className={styles.preparation}>{option.preparation}</p>}
        {allowedOption && scores.english !== null && scores.english >= 2 && <p className={styles.warning}>영어 {scores.english}등급 손실은 위 백분위 색에 포함되지 않습니다. 대학별 영어 반영표를 확인하세요.</p>}
        <a className={styles.source} href={sourceLink(option.source, option.sourcePage)} target="_blank" rel="noreferrer">2027 공식 모집요강 · {option.sourcePage} <ArrowUpRight size={14} /></a>
        <details className={styles.details}><summary>환산 방식·검정고시·비교 로직 <ChevronDown size={14} /></summary><p><b>2027 전형과 환산 방식</b><br />{option.method}</p><p><b>재현의 검정고시 조건</b><br />{option.ged}</p><p><b>화면의 점수 비교 산식</b><br />{professionalComparisonFormula(option)}</p><p>탐구1·2 자리에 현재 입력의 세지·한지를 넣습니다. 반올림 전 차이로 색을 정하며 ±2점은 화면 비교 구간입니다. 영어·한국사·가산점·면접·비교내신은 이 색에 포함하지 않습니다. 2027 실제 환산에 필요한 점수와 자료는 위 대학별 반영 방식을 확인하세요.</p><p>70%컷은 최저 합격점이나 모든 과목의 최소 요구점수가 아닙니다. 대학 환산점수는 대학 간·연도 간 직접 비교할 수 없습니다.</p>{option.extraSource && <a href={option.extraSource.url} target="_blank" rel="noreferrer">{option.extraSource.label} <ArrowUpRight size={13} /></a>}</details>
      </article>;
    })}</section>
    {!options.length && <div className={styles.empty}>이 필터에 해당하는 수록 전형이 없습니다. 미수록 대학의 지원 불가를 뜻하지 않습니다.<button onClick={reset}>전체 보기</button></div>}
    <section className={styles.next}><h3>한의대와 원서를 조합할 때</h3><p>같은 모집군의 일반대학에는 한 곳만 지원할 수 있습니다. 한양 의예·아주 의학·원광 치의예(인문)은 모두 나군이므로 나군 한의대와 함께 비교해 한 곳을 선택해야 합니다.</p><p>이 목록은 과목·검정고시 조건으로 검토할 선택지입니다. 서울 거주 자체의 가산은 반영하지 않았습니다. 올해 컷 상승 폭을 재수생 수만으로 일괄 가산하지 않았습니다.</p></section>
    <ScoreContext showKoreanMedicineTarget={false} scores={scores} title={`${name} 탭의 현재 가상 입력`} />
    <p className={styles.caption}>확인일 {PROFESSIONAL_AS_OF} · 2027 요강 / 2026 입결 · 수시 이월 후 인원 재확인 · 전국 중 공식 자료를 검증한 전형 예시만 수록</p>
  </div>;
}
