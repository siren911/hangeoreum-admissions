'use client';

import { useState } from 'react';
import { ArrowRight, ArrowUpRight, Check, ChevronDown, MapPin } from 'lucide-react';
import { generalOptions, compareGeneralOption, generalReference, metricDescriptions, OPTIONS_AS_OF, schools, calculateAll, type Scores, type GeneralTrack } from '@j/core';
import { SignalBadge } from './score-signal';
import ScoreContext from './score-context';
import styles from './general-options.module.css';

export default function GeneralOptions({ scores, title, onEdit }: { scores: Scores; title: string; onEdit: () => void }) {
  const [track, setTrack] = useState<GeneralTrack>('humanities');
  const [region, setRegion] = useState('전체');
  const [gun, setGun] = useState('전체');
  const [university, setUniversity] = useState('전체');
  const universities = [...new Set(generalOptions.map(o => o.university))];
  const pendingCount = generalOptions.filter(o => generalReference(o) === null && !o.historicalResult).length;
  const predecessorCount = generalOptions.filter(o => o.historicalResult?.relationship === 'predecessor').length;
  const comparableCount = generalOptions.filter(o => generalReference(o) !== null).length;
  const options = generalOptions.filter(o => o.track === track && (university === '전체' || o.university === university) && (region === '전체' || o.location === region) && (gun === '전체' || o.gun === gun));
  const med = calculateAll(scores);
  return <div className={styles.root}>
    <section className={styles.intro}><span className={styles.kicker}>SEOUL & METRO · 한의대와 함께 보는 선택지</span><h2>같은 성적으로,<br /><em>다른 진로도 펼쳐보세요.</em></h2><p>화작 · 미적분 · 세계지리 · 한국지리 / 검정고시 / 일반 정시 기준<br />공식 자료를 확인한 <b>{universities.length}개 대학 · {generalOptions.length}개 학과·계열 예시</b>입니다. 목록에 없는 대학은 미수록이며, 재현의 성적으로 제외했다는 뜻이 아닙니다.</p></section>
    <section className={styles.scoreBar} aria-label="시뮬레이터와 공유하는 점수"><div><span>시뮬레이터의 현재 입력</span><b>{title}</b><p>국어 {scores.korean ?? '—'} · 수학 {scores.math ?? '—'} · 세지 {scores.world ?? '—'} · 한지 {scores.korea ?? '—'} <small>백분위</small><br />영어 {scores.english ?? '—'}등급 · 한국사 {scores.history ?? '—'}등급</p></div><button onClick={onEdit}>성적 수정하기 <ArrowRight size={16} /></button></section>
    <section className={styles.universityPicker} aria-label="대학 바로 찾기"><header><h3>대학 바로 찾기</h3><span>성적과 관계없이 표시 · 추천 순위 아님</span></header><div role="group" aria-label="대학 필터">{['전체', ...universities].map(name => <button key={name} aria-pressed={university === name} onClick={() => { setUniversity(name); setRegion('전체'); setGun('전체'); }}>{name.replace('대학교', '대')}<small>{name === '전체' ? generalOptions.length : generalOptions.filter(o => o.university === name).length}</small></button>)}</div><p>연세·고려·서강·건국대를 포함합니다. 문과·이과를 선택해 과목 조건과 모집인원을 확인하세요.</p></section>
    <div className={styles.trackPicker} role="group" aria-label="일반 대학 계열 선택"><button aria-pressed={track === 'humanities'} onClick={() => setTrack('humanities')}><span>문과 · 인문/사회</span><small>지리·경영·법학 등</small></button><button aria-pressed={track === 'science'} onClick={() => setTrack('science')}><span>이과 · 자연/공학</span><small>사탐 허용과 과탐 가산을 함께 확인</small></button></div>
    <div className={styles.explainer}><Check size={18} /><p><b>지원 과목 조건</b>과 <b>점수 비교</b>를 나눠 읽으세요. 과목상 가능해도 합격 가능성을 뜻하지 않습니다. {track === 'science' ? '미적분 가산을 받아도 과탐 가산 격차는 남을 수 있습니다.' : '학교 전체 순위보다 학과별 반영비율과 가산점을 먼저 확인하세요.'}</p></div>
    <div className={styles.filters}><label>지역 <select value={region} onChange={e => setRegion(e.target.value)}><option>전체</option><option>서울</option><option>경기</option></select></label><label>모집군 <select value={gun} onChange={e => setGun(e.target.value)}><option>전체</option><option>가</option><option>나</option><option>다</option></select></label><span>{options.length}개 선택지 · 2027 요강 기준</span></div>
    <p className={styles.legend}><i data-tone="above" />참고선보다 2점 이상 높음 <i data-tone="near" />−2~+2점 미만 <i data-tone="below" />2점 넘게 낮음 <span>국수탐 참고값 비교 · 2027 예상컷·합격 안정 판정 아님</span></p>
    <p className={styles.coverage}>{comparableCount}개 점수 비교 · {predecessorCount}개 개편 전 학부 참고 · {pendingCount}개 과거 결과 확인 전</p>
    <div className={styles.grid} aria-live="polite">{options.map(option => {
      const result = compareGeneralOption(option, scores);
      const past = option.historicalResult;
      return <article key={option.id} className={styles.card}>
        <div className={styles.cardMeta}><span><MapPin size={12} />{option.location}</span><span>{option.gun ? `${option.gun}군 · ${option.seats === null ? '인원 확인 중' : `${option.seats}명`}` : '모집군·인원은 학과별 확인'}</span></div>
        <h3>{option.university}</h3><h4>{option.program}</h4>
        <div className={styles.eligible} data-gap={option.eligibility === 'bonus-gap'}>{option.eligibility === 'bonus-gap' ? '과목상 지원 가능 · 과탐 가산 격차' : '재현의 선택과목으로 지원 가능'}</div>
        <p className={styles.benefit}>{option.benefit}</p>
        {past && <section className={styles.history} aria-label={`${option.university} ${past.program} 2026 공식 결과`}>
          <header><b>2026 공식 입시결과</b><span>{past.relationship === 'predecessor' ? '개편 전 모집단위' : '일반전형 확인'}</span></header>
          <p>{past.program} · {past.selection}</p>
          <div className={styles.historicalCut}><span>당시 대학 환산점수 70%컷</span><b>{past.convertedCut70.toFixed(2)}점</b></div>
          <small>아래는 공식 70% 구간에 공개된 과목 성적입니다.</small>
          <dl className={styles.profile}>{([['국어', past.profile.korean], ['수학', past.profile.math], ['탐구1', past.profile.inquiry1], ['탐구2', past.profile.inquiry2], ['영어', `${past.profile.english}등급`], ['한국사', `${past.profile.history}등급`]] as const).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
          <small>국어·수학·탐구는 백분위. 탐구1·2는 당시 응시 과목으로, 세지·한지 점수나 과목별 최소 요구점수가 아닙니다.</small>
          {past.note && <p className={styles.historyNote}>{past.note}</p>}
        </section>}
        <div className={styles.comparison} data-tone={result.status}><span><i />{result.label}</span>{result.value !== null ? <><div><strong>{result.value}</strong><span>{past ? '공개 성적 참고평균' : '2026 등록자 70%컷'} <b>{result.reference}</b></span><b className={styles.gap}>{Number(result.gap) > 0 ? '+' : ''}{result.gap}</b></div><small>{past ? '큰 숫자: 입력한 국수탐 단순평균 · 참고평균: 공개 성적을 같은 방식으로 계산한 값' : option.metric === 'gcu' ? '2026 방식으로 계산한 입력 · 영어 포함' : '국수탐 백분위 참고지표 · 영어·한국사·가산 미포함'}</small></> : <p>{result.status === 'missing' ? '시뮬레이터에서 국수탐 백분위와 영어·한국사 등급을 입력하세요.' : (past?.note || option.comparisonNote || '지원 조건만 확인했습니다. 동일 기준의 과거 성적을 검증하기 전에는 점수로 순위를 매기지 않습니다.')}</p>}{past && result.value !== null && <p className={styles.profileMeaning}>이 색은 공개 성적 예시와의 평균 차이입니다. 대학이 발표한 백분위 합격컷이나 2027 합격 가능성은 아닙니다. 영어·한국사·가산점은 포함하지 않습니다.</p>}</div>
        {scores.english !== null && scores.english >= 3 && <p className={styles.englishNote}>영어 {scores.english}등급: 국수탐 지표가 높아도 영어 손실을 따로 계산해야 합니다.</p>}
        <p className={styles.caution}>{option.caution}</p>{result.current !== null && <p className={styles.currentScore}>2027 일반1 반영지표 <b>{result.current}</b><small>올해 방식 점수 · 작년 컷과 직접 비교하지 않음</small></p>}
        <details className={styles.details}><summary>비교 산식·공식 근거 <ChevronDown size={14} /></summary>{option.formulaNote && <p><b>2027 대학 환산 방식</b><br />{option.formulaNote}</p>}{past && <><p><b>공개 성적 참고평균 계산</b><br />(국어 + 수학 + (탐구1 + 탐구2) ÷ 2) ÷ 3. 현재 입력과 2026 공개 성적에 같은 산식을 적용합니다. 대학이 발표한 환산점수 70%컷을 백분위로 변환한 값이 아닙니다.</p><p>70% 위치의 성적 예시는 등록자 전체의 평균이나 각 과목의 최소점수가 아닙니다. 공개 학생과 재현의 선택과목·영어등급·점수 배치가 다르므로 대학 환산 순위는 달라질 수 있습니다. 대학 환산점수는 대학 간·연도 간 직접 비교하지 않습니다.</p></>}{option.metric && <><p><b>현재 입력으로 계산한 지표</b><br />{metricDescriptions[option.metric]}</p><p>경희·숭실은 대학의 최종 환산총점이 아닙니다. 가천의 컷 비교는 2026 일반전형의 반영지표로 계산하며, 2027 일반1 반영지표를 따로 표시합니다. 반올림 전 차이로 색을 정하며, ±2점은 화면에서 비교하기 위한 구간입니다. 표준점수·변환표·가산·영어·한국사와 지원자 구성이 달라져 올해 결과는 달라질 수 있습니다.</p></>}<p>인원은 2027 수시 이월 전 일반전형입니다. 검정고시 합격 증빙 등 제출서류는 요강의 지원자격·제출서류 절을 확인하세요.</p><a href={option.source + (option.sourcePage.startsWith('PDF') ? '#page=' + option.sourcePage.match(/\d+/)?.[0] : '')} target="_blank" rel="noreferrer">2027 공식 요강 · {option.sourcePage} <ArrowUpRight size={13} /></a>{past && <a href={past.source + (past.page.startsWith('PDF') ? '#page=' + past.page.match(/\d+/)?.[0] : '')} target="_blank" rel="noreferrer">2026 공식 입시결과 · {past.page} <ArrowUpRight size={13} /></a>}{option.historicalSource && <a href={option.historicalSource + (option.historicalPage?.startsWith('PDF') ? '#page=' + option.historicalPage.match(/\d+/)?.[0] : '')} target="_blank" rel="noreferrer">2026 공식 결과 · {option.historicalPage} <ArrowUpRight size={13} /></a>}{option.metric === 'gcu' && <a href="https://admission.gachon.ac.kr/upload/BBS0004/20250430104240WJ4E3D.PDF#page=3" target="_blank" rel="noreferrer">가천 2026·2027 반영비율 변경표 · PDF 3쪽 <ArrowUpRight size={13} /></a>}</details>
      </article>;
    })}</div>
    {options.length === 0 && <div className={styles.empty}>이 조건으로 확인한 학과 예시가 없습니다. 지원 불가라는 뜻은 아닙니다.<button onClick={() => { setUniversity('전체'); setRegion('전체'); setGun('전체'); }}>필터 초기화</button></div>}
    <section className={styles.med}><header><h3>한의대와 원서 조합을 생각한다면</h3><p>같은 입력으로 계산한 한의대 계획 신호등입니다. 일반 대학의 전년도 성적 비교 색과 의미가 다릅니다.</p></header><div className={styles.medGrid}>{(['가', '나', '다'] as const).map(g => <div key={g}><b>{g}군</b>{schools.filter(s => s.gun === g).map(s => <p key={s.id}><span>{s.shortName}</span><SignalBadge result={med.find(r => r.schoolId === s.id)!} /></p>)}</div>)}</div><p className={styles.note}>정시 일반대학은 같은 군에서 한 곳만 지원합니다. 예: 다군 숭실 컴퓨터학부와 상지 한의예 B형은 한 장의 원서를 놓고 선택해야 합니다. 수시 합격자의 정시 지원 제한 등 공통 지원자격도 최종 확인하세요.</p></section>
    <ScoreContext showKoreanMedicineTarget={false} scores={scores} title="시뮬레이터의 현재 입력" />
    <p className={styles.note}>확인일 {OPTIONS_AS_OF} · 서울·경기 소재 예시만 수록 · {comparableCount}개는 참고점수 비교 · {predecessorCount}개는 모집단위 개편으로 이전 학부 결과만 제공 · {pendingCount}개는 과거 결과 확인 전 · 70%컷은 최종 합격자 최저점이 아닙니다.</p>
  </div>;
}
