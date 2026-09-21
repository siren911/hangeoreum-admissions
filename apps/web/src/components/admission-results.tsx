'use client';

import { useState } from 'react';
import { ArrowUpRight, BookOpen, ChartNoAxesColumnIncreasing, ChevronDown, CircleHelp, HeartPulse, Leaf, Search, Stethoscope } from 'lucide-react';
import { admissionResults2026, admissionCategoryLabels, filterAdmissionResults, resultStatisticLabels, RESULTS_AS_OF, type AdmissionCategory, type AdmissionResult2026, type ResultFilter } from '@j/core';
import styles from './admission-results.module.css';

const categories = ['korean-medicine', 'dentistry', 'medicine'] as const;
const categoryIcons = { 'korean-medicine': Leaf, dentistry: HeartPulse, medicine: Stethoscope };
const number = (value: number) => value.toLocaleString('ko-KR', { maximumFractionDigits: 2 });

export default function AdmissionResults() {
  const [category, setCategory] = useState<AdmissionCategory | 'all'>('korean-medicine');
  const [query, setQuery] = useState('');
  const [statistic, setStatistic] = useState<ResultFilter>('all');
  const rows = filterAdmissionResults(category, query, statistic);
  const total = admissionResults2026.length;
  const published = admissionResults2026.filter(row => row.status === 'published').length;
  const withheld = admissionResults2026.filter(row => row.status === 'withheld').length;
  const unverified = total - published - withheld;
  function chooseCategory(value: AdmissionCategory | 'all') { setCategory(value); setQuery(''); setStatistic('all'); }

  return <section className={styles.dashboard} aria-label="2026학년도 정시 입결 대시보드">
    <div className={styles.overview}>
      <div className={styles.overviewCopy}>
        <span className={styles.eyebrow}><BookOpen size={14}/> OFFICIAL RESULTS · 2026</span>
        <h2>지난 합격 결과를<br/> 학교별로 확인하세요.</h2>
        <p>2026학년도 정시 일반전형 중심의 공개 자료입니다.<br/>숫자 옆의 <b>통계 기준과 단위</b>를 함께 읽어 주세요.</p>
        <span className={styles.yearNote}>2025년 수능 → 2026년 입학 결과</span>
      </div>
      <div className={styles.coverage}>
        <span className={styles.coverageLabel}>수록한 {total}개 전형의 자료 현황</span>
        <div className={styles.coverageNumbers}>
          <div><b>{published}</b><span>입결 확인</span></div>
          <div><b>{withheld}</b><span>성적 비공개</span></div>
          <div><b>{unverified}</b><span>추가 확인 필요</span></div>
        </div>
        <div className={styles.coverageBar} aria-hidden="true"><i style={{ flex: published }}/><i style={{ flex: withheld }}/><i style={{ flex: unverified }}/></div>
        <p>대학 입학처·대교협 어디가 자료<br/>정리 기준 {RESULTS_AS_OF.replaceAll('-', '.')}</p>
      </div>
    </div>

    <div className={styles.categories} role="group" aria-label="입결 계열 선택">
      {categories.map(key => {
        const Icon = categoryIcons[key];
        const tracks = admissionResults2026.filter(row => row.category === key);
        const universities = new Set(tracks.map(row => row.university)).size;
        return <button key={key} className={category === key ? styles.categoryActive : ''} aria-pressed={category === key} onClick={() => chooseCategory(key)}><Icon size={23}/><span><b>{admissionCategoryLabels[key]}</b><small>{universities}개 대학 · {tracks.length}개 전형</small></span><ArrowUpRight size={17}/></button>;
      })}
    </div>
    <p className={styles.scope}>현재 워크스페이스의 검토 대학과 확인된 인문·자연 전형을 수록했습니다. 전국 모든 대학·전형의 전수 목록은 아닙니다. 지역인재·수시 입결은 포함하지 않습니다.</p>

    <div className={styles.readingGuide}>
      <CircleHelp size={19}/><div><b>70%컷은 마지막 합격자의 점수가 아니에요.</b><p>등록자를 성적순으로 놓았을 때 약 70% 위치의 값입니다. 평균·80%컷·전체 합격자 통계는 서로 구분하며, 대학마다 환산 방식이 달라 총점 크기로 순위를 매기지 않습니다.</p></div>
    </div>
    <div className={styles.toolbar}>
      <div className={styles.sectionTitle}><h2>{category === 'all' ? '전체 계열' : admissionCategoryLabels[category]} 입결 <span>{rows.length}</span></h2><button aria-pressed={category === 'all'} onClick={() => chooseCategory('all')}>전체 계열 보기</button></div>
      <div className={styles.filters}>
        <label className={styles.search}><Search size={16}/><input aria-label="입결 대학·전형 검색" value={query} onChange={e => setQuery(e.target.value)} placeholder="대학·전형 검색" type="search"/></label>
        <select aria-label="입결 통계 기준" value={statistic} onChange={e => setStatistic(e.target.value as ResultFilter)}>
          <option value="all">모든 통계</option>
          {Object.entries(resultStatisticLabels).map(([value,label]) => <option value={value} key={value}>{label}</option>)}
          <option value="withheld">성적 비공개</option><option value="unverified">추가 확인 필요</option>
        </select>
      </div>
    </div>
    <div className={styles.listCaption}><span>2026 당시 모집군·인원 · 학교명 가나다순</span><span>모집인원 미확인은 0명을 뜻하지 않습니다.</span></div>
    <div className={styles.results} aria-live="polite" aria-atomic="false">
      {[...rows].sort((a,b) => a.university.localeCompare(b.university, 'ko') || a.id.localeCompare(b.id)).map(row => <ResultCard key={row.id} row={row}/>)}
      {rows.length === 0 && <div className={styles.empty}><Search size={27}/><h3>조건에 맞는 결과가 없어요</h3><p>검색어나 통계 기준을 바꿔 보세요.</p><button className="button secondary" onClick={() => {setQuery('');setStatistic('all');}}>검색·필터 초기화</button></div>}
    </div>
    <div className={styles.bottomNote}><ChartNoAxesColumnIncreasing size={18}/><p>이 화면은 <b>2026 실제 공개 결과</b>입니다. 2027 예상 컷·안정 목표·현재 입력한 가상 점수와는 별도로 보관합니다. 올해 재현의 과목으로 지원할 수 있는지는 ‘재현 맞춤 추천’, ‘치대 선택지’, ‘의대 선택지’에서 확인하세요.</p></div>
  </section>;
}

function ResultCard({row}: {row: AdmissionResult2026}) {
  const published = row.status === 'published';
  return <article className={styles.card} aria-label={`${row.university} ${row.program} 2026 입결`}>
    <div className={styles.cardBody}>
      <div className={styles.school}>
        <div className={styles.tags}><span>{admissionCategoryLabels[row.category]}</span>{row.priority && <span className={styles.priority}>재현 관심 전형</span>}</div>
        <h3>{row.university}</h3><p>{row.program}</p><small>{row.selection}</small>
      </div>
      <div className={styles.recruitment}>
        <span className={styles.fieldLabel}>2026 모집</span>
        <strong>{row.gun ? `${row.gun}군` : '군 미확인'}<i/> {row.seats === null ? '인원 미확인' : <>{row.seats}<small>명</small></>}</strong>
        {row.competition !== null && <p>경쟁률 {number(row.competition)} : 1</p>}
      </div>
      <div className={styles.scoreBlock}>
        <span className={`${styles.statistic} ${row.statistic === 'registered-mean' || row.statistic === 'admitted-70' ? styles.differentStatistic : ''} ${!published ? styles.pending : ''}`}>{published ? resultStatisticLabels[row.statistic] : row.status === 'withheld' ? '성적 비공개' : '입결 추가 확인 필요'}</span>
        {published ? <div className={styles.metrics}>{row.metrics.map((metric,index) => <div key={index}><span>{metric.label}</span><div><b>{number(metric.value)}</b><small>{metric.unit}</small></div></div>)}</div> : <p className={styles.unavailable}>{row.status === 'withheld' ? '소수 모집으로 대학이 점수를 공개하지 않았습니다.' : '검증된 2026 점수를 아직 확보하지 못했습니다.'}</p>}
      </div>
    </div>
    <div className={styles.cardFooter}>
      <details className={styles.detail}>
        <summary>해석·성적 구성·자료 기준 <ChevronDown size={15}/></summary>
        <div className={styles.detailBody}>
          {row.note && <p>{row.note}</p>}
          {row.profile && <div className={styles.profile}>
            <b>공개된 70% 위치의 과목 성적</b>
            <div className={styles.profileScores}>{([['국어',row.profile.korean,'백분위'],['수학',row.profile.math,'백분위'],['탐구1',row.profile.inquiry1,'백분위'],['탐구2',row.profile.inquiry2,'백분위'],['영어',row.profile.english,'등급'],['한국사',row.profile.history,'등급']] as const).map(([label,value,unit]) => <span key={label}>{label}<strong>{value}</strong><small>{unit}</small></span>)}</div>
            <p>{row.profile.note}</p>
          </div>}
          <dl><div><dt>모집인원 기준</dt><dd>{row.seatsNote}</dd></div><div><dt>공식 자료 위치</dt><dd>{row.source.page}</dd></div><div><dt>대조·정리일</dt><dd>{row.checkedAt}</dd></div></dl>
        </div>
      </details>
      <a className={styles.source} href={row.source.url} target="_blank" rel="noreferrer" aria-label={`${row.university} ${row.program} ${row.source.label}`}>{row.status === 'unverified' ? '공식 자료 확인' : '공식 입결 보기'} <ArrowUpRight size={14}/></a>
    </div>
  </article>;
}
