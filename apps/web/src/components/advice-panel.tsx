'use client';

import { useState } from 'react';
import { ArrowRight, ArrowUpRight, Check, ChevronDown, Info } from 'lucide-react';
import { AS_OF, applicantContext, planningSamples, recommendations, seats, schools, calculate, difference, formatScore, preparationActions, type Scores, type School, type SchoolId, type Gun } from '@j/core';
import styles from './advice-panel.module.css';
import { SignalHero, SignalLine, SignalBadge, SignalDetail, SignalMethod } from './score-signal';
import ScoreContext from './score-context';

const groups: { gun: Gun; ids: SchoolId[]; first: SchoolId[] }[] = [
  { gun: '가', ids: ['GCU', 'DSU', 'DJU', 'PNU'], first: ['GCU', 'DSU'] },
  { gun: '나', ids: ['WSU', 'DEU', 'SMU', 'KHU', 'WKU'], first: ['WSU'] },
  { gun: '다', ids: ['SJUB', 'DGU2'], first: ['SJUB'] },
];
const brief: Record<SchoolId, { name: string; reason: string }> = {
  GCU: { name: '가천대', reason: '과탐 가산 격차 없음 · 고른 성적 활용' },
  DSU: { name: '동신대', reason: '미적 가산 + 높은 지리 한 과목' },
  WSU: { name: '우석대', reason: '미적 가산 + 수학·두 지리 활용' },
  DJU: { name: '대전대', reason: '미적 +3점 · 영어 1등급 중요' },
  DEU: { name: '동의대 미적/기하', reason: '미적 모집에 사탐 지원 가능' },
  KHU: { name: '경희대 인문', reason: '국어·수학 비중 큼 · 영어 1·2 동일' },
  SMU: { name: '세명대', reason: '미적 가산 · 과탐 가산 격차 확인' },
  SJUB: { name: '상지대 B형', reason: '검정고시 감점 0 · 수학 40%' },
  DGU2: { name: '동국 WISE Ⅱ', reason: '사탐 허용 · 2명 소수 모집' },
  WKU: { name: '원광대 인문', reason: '국어 표준점수가 강할 때 비교' },
  PNU: { name: '부산대 학·석사', reason: '7년 과정 · 과탐 가산 격차 확인' },
};
const signed = (value: string | null) => value === null ? '—' : (Number(value) > 0 ? '+' : '') + formatScore(value);
const pageHref = (school: School, page: string) => school.source + '#page=' + (page.match(/PDF\s*(\d+)/)?.[1] ?? '1');

export default function AdvicePanel({ onLoad, onSchool }: { onLoad: (scores: Scores, title: string) => void; onSchool: (school: School, scores: Scores) => void }) {
  const [sampleId, setSampleId] = useState('base');
  const [guideId, setGuideId] = useState<SchoolId | null>(null);
  const [logicId, setLogicId] = useState<SchoolId>('GCU');
  const sample = planningSamples.find(s => s.id === sampleId)!;
  const base = planningSamples[0];
  const results = recommendations.map(rec => {
    const school = schools.find(s => s.id === rec.id)!;
    const result = calculate(school.id, sample.scores);
    const baseResult = calculate(school.id, base.scores);
    return { rec, school, result, baseResult, delta: difference(result, baseResult) };
  });
  const logic = results.find(x => x.school.id === logicId)!;
  const fields = [
    ['국어 · 화작', sample.scores.korean, '백분위'], ['수학 · 미적분', sample.scores.math, '백분위'],
    ['세계지리', sample.scores.world, '백분위'], ['한국지리', sample.scores.korea, '백분위'],
    ['영어', sample.scores.english, '등급'], ['한국사', sample.scores.history, '등급'],
  ];

  return <div className={styles.root}>
    <SignalHero sample={sample} results={results.map(x => x.result)} onSelect={setSampleId} onLoad={onLoad} />
    <ScoreContext scores={sample.scores} title={sample.title} />
    <div className={styles.profile} aria-label="추천에 사용한 재현의 조건">
      <div><Check size={16} /><b>화작 · 미적분 · 세계지리 · 한국지리</b></div>
      <p>서울 거주 · 검정고시 평균 95점 이상 · 지역 혜택 없음 <span>현재 성적은 추천에 사용하지 않음</span></p>
    </div>

    <section id="j-priority" aria-label="모집군별 재현 추천 대학">
      <div className={styles.sectionHeading}><span className={styles.eyebrow}>01 · 재현에게 맞는 대학</span><h2>모집군별로, 이 대학부터 비교하세요</h2><p><b>가군 가천·동신 · 나군 우석 · 다군 상지 B형</b>을 먼저 검토합니다.<br />미적분·사탐 조합과 검정고시 조건을 기준으로 비교한 후보입니다.</p></div>
      <div className={styles.basis}><b>2027학년도 정시 요강 기준</b><span>{AS_OF.replaceAll('-', '.')} 확인 · 인원은 수시 이월 전 일반전형</span></div>
      <div className={styles.groupGrid}>
        {groups.map(group => <article className={styles.groupCard} key={group.gun} aria-label={group.gun + '군 추천 후보'}>
          <header><span className={'gun-label gun-' + group.gun}>{group.gun}군</span><small>이 군에서 한 곳 선택</small></header>
          {group.ids.map(id => <a className={styles.candidate + ' ' + (group.first.includes(id) ? styles.firstCandidate : '')} key={id} href={'#guide-' + id} onClick={() => setGuideId(id)}>
            <div><strong>{brief[id].name}</strong><b>{seats[id].focus}<small>명</small></b></div>
            <p>{brief[id].reason}</p>
            <div className={styles.candidateScore}><span>선택 예시</span><strong>{results.find(x => x.school.id === id)!.result.total === null ? <small>계산 대기</small> : <>{formatScore(results.find(x => x.school.id === id)!.result.total)}<small>{id === 'GCU' ? ' /100' : '점'}</small></>}</strong></div>
            <SignalLine result={results.find(x => x.school.id === id)!.result} />
            {group.first.includes(id) && <span className={styles.firstLabel}>우선 검토 <ArrowRight size={12} /></span>}
          </a>)}
        </article>)}
      </div>
      <p className={styles.note}>‘우선 검토’는 과목·전형이 잘 맞는 후보입니다. 합격 가능성이나 안정 지원 순위는 실제 성적과 최종 모집인원을 확인한 뒤 판단합니다.</p>
      <details className={styles.disclosure}>
        <summary>가·나·다군은 어떻게 정해지나요?<ChevronDown size={17} /></summary>
        <div className={styles.disclosureBody}><p><b>대학이 해당 학년도 모집단위·전형별로 정해 공지한 모집군</b>입니다. 매년 영구적으로 고정되는 것은 아니며, 이 화면은 2027학년도 요강을 기준으로 표시합니다.</p><p>재현이 비교하는 대학들은 <b>같은 군에 두 곳을 동시에 지원할 수 없습니다.</b> 예를 들어 가천과 동신 중 한 곳, 나군 후보 중 한 곳, 상지 B와 동국 Ⅱ 중 한 곳을 고르는 구조입니다.</p><p>모집군과 모집인원은 따로 확인합니다. 인원은 수시 이월로 바뀔 수 있고, 모집군도 원서 접수 전 해당 연도 정정 공지를 최종 확인합니다. 우석은 게시 파일의 ‘안’ 표기도 함께 확인합니다.</p><a href="https://enter.woosuk.ac.kr/main/filedown.php?menu=42&no=2600#page=3" target="_blank" rel="noreferrer">2027 요강 · 같은 군 복수지원 금지 안내 PDF 3쪽 <ArrowUpRight size={13} /></a></div>
      </details>
    </section>

    <SignalMethod results={results.map(x => x.result)} />

    <nav className={styles.jumps} aria-label="추천 페이지 바로가기"><a href="#j-guides">대학별 이유·요강</a><a href="#j-target">목표 샘플·환산점수</a><a href="#j-calculation">계산 로직</a></nav>

    <section id="j-guides" aria-label="대학별 추천 이유와 공식 요강">
      <div className={styles.sectionHeading}><span className={styles.eyebrow}>02 · 대학별 상세 근거</span><h2>추천 이유와 조건을 함께 확인하세요</h2><p>대학을 펼치면 지원 전형, 모집인원 구분, 가산점과 공식 요강을 볼 수 있습니다.</p></div>
      <div className={styles.guideList}>{results.map(({ rec, school: s, result }) => <article className={styles.guide} id={'guide-' + s.id} key={s.id}>
        <button className={styles.guideToggle} aria-expanded={guideId === s.id} aria-controls={'guide-body-' + s.id} onClick={() => setGuideId(guideId === s.id ? null : s.id)}>
          <span className={'gun-label gun-' + s.gun}>{s.gun}군</span><span className={styles.guideName}><b>{brief[s.id].name}</b><small>{s.track}</small></span><span className={styles.guideSeats}>{seats[s.id].focus}명</span><ChevronDown size={18} className={guideId === s.id ? styles.rotated : ''} />
        </button>
        <div id={'guide-body-' + s.id} hidden={guideId !== s.id} className={styles.guideBody}>
          <div className={styles.guideFacts}><div><small>재현이 비교할 일반전형</small><strong>{seats[s.id].focus}명</strong></div><div><small>{s.id === 'PNU' ? '해당 과정' : '한의예'} 일반전형 합계</small><strong>{seats[s.id].generalTotal}명</strong></div><div><small>모집군 근거</small><strong>2027 {s.gun}군</strong></div></div>
          <p className={styles.split}>{seats[s.id].split}</p>
          <SignalDetail result={result} />
          <dl className={styles.reasons}><div><dt>추천 이유</dt><dd>{rec.reason}</dd></div><div><dt>함께 볼 조건</dt><dd>{rec.condition}</dd></div><div><dt>선택과목·가산점</dt><dd>{s.bonus} · 탐구 {s.inquiry === 'best' ? '높은 1과목' : '2과목 반영'}<ul>{s.strategy.map(text => <li key={text}>{text}</li>)}</ul></dd></div><div><dt>영어·한국사</dt><dd>영어 {s.englishChange}<br />한국사 {s.historyTip.replace(/^한국사\s*/, '')}</dd></div></dl>
          <div className={styles.guideSources}><b>2027 공식 모집요강</b><a href={pageHref(s, seats[s.id].page)} target="_blank" rel="noreferrer">모집군·인원 · {seats[s.id].page} <ArrowUpRight size={14} /></a><a href={pageHref(s, s.page)} target="_blank" rel="noreferrer">반영 방식 · {s.page} <ArrowUpRight size={14} /></a><small>페이지는 PDF 뷰어 기준입니다. 인원은 수시 이월 전이며 지역인재·정원외를 합산하지 않았습니다.</small></div>
          <button className="button secondary" onClick={() => onSchool(s, sample.scores)}>이 대학의 산식·과거 결과 보기 <ArrowRight size={14} /></button>
        </div>
      </article>)}</div>
      <details className={styles.disclosure}><summary>추가로 지원할 수 있는 전형과 제외한 전형<ChevronDown size={17} /></summary><div className={styles.disclosureBody}><p><b>경희 자연 39명도 재현의 과목 조건상 지원 가능합니다.</b> 인문 13명과 반영비율·과탐 가산이 달라 별도로 비교해야 하며, 현재 계산기는 인문을 주 대상으로 합니다.</p><p>대전 지역인재 4명, 동의 확통 3명, 원광 자연 4명, 동국 Ⅰ 9명, 상지 A 15명은 위의 재현 비교 인원에 넣지 않았습니다. 대구한의대는 인문 확통·자연 과탐 지정 조건으로 현재 조합에서 제외합니다.</p><p>지역인재 여부는 주소만으로 판정하지 않습니다. 재현의 검정고시 학력과 지역 혜택 없음이라는 확인을 반영했습니다. 다른 특별전형 자격은 별도 확인이 필요합니다.</p></div></details>
    </section>

    <section id="j-target" className={styles.sampleSection} aria-label="재현의 목표 점수 샘플">
      <div className={styles.sectionHeading}><span className={styles.eyebrow}>03 · 목표 성적을 넣어 비교</span><h2>같은 성적도 대학에 따라 다르게 계산됩니다</h2><p>아래는 학습 계획용 가상 성적입니다. 환산점수는 공식 산식으로 계산하고, 신호등은 위에서 제안한 계획 기준과 비교합니다.</p></div>
      <div className={styles.sampleOptions} aria-label="점수 샘플 선택">{planningSamples.map(s => <button key={s.id} className={sampleId === s.id ? styles.sampleSelected : ''} aria-pressed={sampleId === s.id} onClick={() => setSampleId(s.id)}><span>{s.title}</span><small>{s.subtitle}</small></button>)}</div>
      <div className={styles.scoreStrip}>{fields.map(([label, value, unit]) => <div key={label}><span>{label}</span><strong>{value}</strong><small>{unit}</small></div>)}</div>
      <p className={styles.sampleExplanation}>{sample.explanation}</p>
      <div className={styles.sampleActions}><span><Info size={15} />국수탐은 백분위, 영어·한국사는 등급</span><button className="button primary" onClick={() => onLoad({ ...sample.scores }, sample.title)}>이 샘플로 점수 바꿔보기 <ArrowRight size={16} /></button></div>
      <div className={styles.tableIntro}><h3>선택 샘플 환산점수</h3><p>선택한 ‘{sample.title}’ 샘플을 대학별 산식에 넣은 결과입니다. 학교를 누르면 아래에 계산 과정이 표시됩니다.</p></div>
      <div className={styles.tableScroll}><table className={styles.scoreTable}><caption className={styles.srOnly}>선택 샘플과 기본 목표의 대학별 환산점수 비교</caption><thead><tr><th scope="col">대학·전형</th><th scope="col">군 / 인원</th><th scope="col">선택 샘플 환산점수</th><th scope="col">2027 계획 신호등</th><th scope="col">기본 목표 대비</th></tr></thead><tbody>{results.map(({ school: s, result, delta }) => <tr key={s.id}>
        <th scope="row"><a href="#j-calculation" onClick={() => setLogicId(s.id)}>{brief[s.id].name} <ArrowRight size={13} /></a></th><td>{s.gun}군 / {seats[s.id].focus}명</td><td>{result.total === null ? <span className={styles.pending}>{s.id === 'WKU' ? '표준점수 필요' : '2027 변환표 대기'}</span> : <><b>{formatScore(result.total)}</b><small>{s.id === 'GCU' ? '/100 지표' : s.id === 'DSU' ? '점 · 최종 자리 처리 전 원값' : '점'}</small></>}</td><td><SignalBadge result={result} /></td><td>{signed(delta)}</td>
      </tr>)}</tbody></table></div>
      <p className={styles.note}>‘기본 목표 대비’ = 선택 샘플 환산점수 − 기본 학습 목표 환산점수. 합격선과의 차이는 아닙니다. 대학마다 총점 단위가 달라 학교 간 숫자 크기로 유불리를 비교할 수 없습니다.</p>

      <section id="j-calculation" className={styles.calculation} aria-label="선택 샘플 환산점수 계산 로직">
        <div className={styles.sectionHeading}><h3>이 점수가 나온 계산 과정</h3><p>선택한 샘플의 실제 입력과 가산·감점을 그대로 보여드립니다.</p></div>
        <ol className={styles.flow}><li><b>1</b> 샘플 성적 선택</li><li><b>2</b> 대학별 반영·가산·감점</li><li><b>3</b> 환산점수와 기본 목표 차이</li></ol>
        <label className={styles.calculationSelect}>계산할 대학<select aria-label="계산할 대학" value={logicId} onChange={e => setLogicId(e.target.value as SchoolId)}>{results.map(({ school: s }) => <option key={s.id} value={s.id}>{brief[s.id].name}</option>)}</select></label>
        <SignalDetail result={logic.result} />
        <p className={styles.formula}>{logic.school.formula}</p>
        <p className={styles.note}>‘국·수·탐’은 백분위, ‘표준’은 표준점수입니다. 영어는 해당 대학의 등급별 점수로 바꿉니다. 현재 샘플: 한국사 {sample.scores.history}등급 · 검정고시 대체 감점 {sample.scores.gedPenalty}점.</p>
        {logic.result.total !== null ? <>
          <ul className={styles.steps}>{logic.result.steps.map((step, index) => <li key={step.label + index}><span><b>{step.label}</b><small>{step.expression}</small></span><strong>{formatScore(step.value)}</strong></li>)}</ul>
          <div className={styles.calculationTotal}><span>선택 샘플 합계<strong>{formatScore(logic.result.total)}{logic.school.id === 'GCU' ? ' /100' : '점'}</strong></span><p>기본 목표 {formatScore(logic.baseResult.total)} → <b>{signed(logic.delta)}</b></p></div>
          {logic.school.id === 'DSU' && <p className={styles.note}>동신은 최종 표시 자리 처리 확인 전 산식 원값입니다. 가산점으로 1,000점을 넘을 수 있습니다.</p>}
        </> : <div className={styles.waiting}><b>추가 자료가 있어야 계산할 수 있습니다.</b><p>{logic.result.missing.join(' · ')}</p><p>백분위로 표준점수를 추정하거나 공식 변환표를 임의로 만들지 않습니다.</p></div>}
        <a className={styles.sourceLink} href={pageHref(logic.school, logic.school.page)} target="_blank" rel="noreferrer">{logic.school.shortName} 2027 산식 근거 · {logic.school.page} <ArrowUpRight size={14} /></a>
        <details className={styles.disclosure}><summary>목표 샘플은 어떻게 정했고, 계산에 무엇이 들어가나요?<ChevronDown size={17} /></summary><div className={styles.disclosureBody}><p>기본 목표는 국어 98·수학 99·지리 98/98, 영어·한국사 1등급으로 정한 학습 계획입니다. 높은 목표는 여기서 국어와 두 지리를 백분위 1씩 올린 준비안입니다. 자동으로 구한 최저 합격 성적이 아닙니다.</p><p><b>환산점수에는 샘플 성적과 대학별 산식만 들어갑니다.</b> 모집인원·N수생 수·작년 합격선은 환산점수에 가산하거나 곱하지 않습니다. 영어 2등급 샘플은 기본 목표에서 영어만 바꿔 손실을 비교합니다.</p><p>동신은 높은 지리 한 과목, 그 외 백분위 산식은 두 과목 평균을 사용합니다. 대전은 총점 1,000점 상한, 세명은 최종 소수 첫째 자리 반올림을 적용합니다. 상지는 재현의 검정고시 평균 95점 이상 조건으로 감점 0점을 적용합니다.</p><p>백분위 99는 원점수 99점이 아닙니다. 추천 순위는 성적에 따라 자동으로 바뀌지 않습니다. 추천은 전형 검토 순서이며 이 표는 점수 변화 비교용입니다.</p></div></details>
      </section>
    </section>

    <details className={styles.disclosure}><summary>2027 경쟁 환경과 재현의 준비 사항<ChevronDown size={17} /></summary><div className={styles.disclosureBody}>
      <h3>N수생 증가는 높은 준비 목표로 고려했습니다</h3><p>교육부 발표 기준 졸업생·검정고시 등은 {applicantContext.nonStudents.toLocaleString('ko-KR')}명, 전년보다 {applicantContext.increase.toLocaleString('ko-KR')}명 증가했습니다. 재수생만의 숫자나 한의대 지원자 수는 아닙니다. 이 숫자만으로 합격선 상승 폭을 계산할 수 없어 기본 목표와 더 높은 준비안을 비교합니다.</p><a href={applicantContext.source} target="_blank" rel="noreferrer">교육부·평가원 원서 접수 결과 · 2026.09.08 <ArrowUpRight size={13} /></a>
      <ul className={styles.preparation}>{preparationActions.map(item => <li key={item.title}><b>{item.title}</b><p>{item.detail}</p></li>)}</ul>
      <h3>검정고시 서류도 함께 준비합니다</h3><p>합격증명서·성적증명서와 온라인 제공 동의 절차를 준비합니다. 고교 재학 이력이 있으면 대학이 요구하는 학생부를 확인합니다. 원서 제출 전 수능 필수영역 응시·수시 합격 여부·서류 마감을 점검합니다.</p>
    </div></details>
  </div>;
}
