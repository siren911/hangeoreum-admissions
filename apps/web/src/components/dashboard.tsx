'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { ChartNoAxesColumnIncreasing, ArrowLeftRight, ArrowRight, ArrowUpRight, Bookmark, BookOpen, Calculator, CalendarDays, Check, ChevronDown, ChevronRight, Cloud, Download, FolderHeart, HeartPulse, Stethoscope, Info, LayoutGrid, Leaf, LogIn, LogOut, Minus, Monitor, Plus, RotateCcw, Save, Search, SlidersHorizontal, Target, Trash2, X } from 'lucide-react';
import { schools, exclusions, commonTarget, emptyScores, labels, percentileKeys, scoreSchema, calculate, calculateAll, difference, formatScore, solveTarget, AS_OF, ENGINE_VERSION, RULE_VERSION, type School, type Scores, type Result, type SchoolId, type PercentileKey, type SavedScenario, type ScenarioRequest } from '@j/core';
import { readDevice, saveDevice, removeDevice } from '@/lib/device-storage';
import AdvicePanel from './advice-panel';
import GeneralOptions from './general-options';
import ProfessionalOptions from './professional-options';
import AdmissionResults from './admission-results';
import { SignalLine, SignalDetail } from './score-signal';
import { seats, recommendations, OPTIONS_AS_OF, PROFESSIONAL_AS_OF, RESULTS_AS_OF } from '@j/core';

type View='advice'|'schools'|'simulator'|'options'|'dentistry'|'medicine'|'saved'|'history';
type RawScores=Record<keyof Scores,string>;
type Session={user:{id:string;name:string}|null;cloudAvailable:boolean;localLoginAvailable:boolean;githubLoginAvailable:boolean};
const toRaw=(s:Scores):RawScores=>Object.fromEntries(Object.entries(s).map(([k,v])=>[k,v===null?'':String(v)])) as RawScores;
const fromRaw=(raw:RawScores):Scores=>Object.fromEntries(Object.entries(raw).map(([k,v])=>[k,v.trim()===''?(k==='absenceDays'?NaN:null):Number(v)])) as Scores;
const dateLabel=(date:string)=>new Intl.DateTimeFormat('ko-KR',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(date));
const basicKeys=['korean','math','world','korea','english','history'] as const;
const standardKeys=['koreanStandard','mathStandard','worldStandard','koreaStandard'] as const;
const subjectSub={korean:'화법과 작문',math:'미적분',world:'사회탐구',korea:'사회탐구',english:'절대평가',history:'절대평가'};

function Modal({title,children,onClose,wide=false}:{title:string;children:ReactNode;onClose:()=>void;wide?:boolean}) {
  const ref=useRef<HTMLDialogElement>(null);
  useEffect(()=>{const d=ref.current;d?.showModal();d?.querySelector<HTMLInputElement>('[autofocus]')?.focus();return()=>{d?.close();};},[]);
  return <dialog ref={ref} className={`modal ${wide?'modal-wide':''}`} onCancel={e=>{e.preventDefault();onClose();}} aria-label={title} onClick={e=>{if(e.target===e.currentTarget){const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)onClose();}}}>
    <div className="modal-heading"><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="닫기"><X size={20}/></button></div>{children}
  </dialog>;
}
function Delta({value}:{value:string|null}) {
  if(value===null) return <span className="muted">—</span>;
  const n=Number(value);return <span className={`delta ${n>0?'positive':n<0?'negative':'neutral'}`}>{n>0?'+':''}{formatScore(value)}{n===0?' 동일':''}</span>;
}
function ResultValue({result}:{result:Result}) {
  if(result.total===null) return <span className="pending-value">{result.status==='waiting_table'?'변환표 대기':result.status==='invalid'?'입력 확인':'점수 입력 필요'}</span>;
  return <><strong className="result-number">{formatScore(result.total)}</strong><span className="score-unit">{result.schoolId==='GCU'?'/100':'점'}</span>{result.status==='provisional'&&<span className="raw-label">산식 원값</span>}</>;
}

export default function Dashboard() {
  const [view,setView]=useState<View>('advice');
  const [gun,setGun]=useState('전체');
  const [query,setQuery]=useState('');
  const [favorites,setFavorites]=useState<string[]>([]);
  const [onlyFavorites,setOnlyFavorites]=useState(false);
  const [raw,setRaw]=useState<RawScores>(()=>toRaw(commonTarget));
  const [baseline,setBaseline]=useState<Scores>({...commonTarget});
  const [inputOrigin,setInputOrigin]=useState<ScenarioRequest['origin']>('school_target');
  const [inputTitle,setInputTitle]=useState('공통 목표 예시');
  const [dirty,setDirty]=useState(false);
  const [advanced,setAdvanced]=useState(false);
  const [detail,setDetail]=useState<School|null>(null);
  const [detailInput,setDetailInput]=useState<Scores|null>(null);
  const [saveOpen,setSaveOpen]=useState(false);
  const [saveName,setSaveName]=useState('');
  const [busy,setBusy]=useState(false);
  const [toast,setToast]=useState('');
  const [deviceRecords,setDeviceRecords]=useState<SavedScenario[]>([]);
  const [cloudRecords,setCloudRecords]=useState<SavedScenario[]>([]);
  const [selectedIds,setSelectedIds]=useState<string[]>([]);
  const [session,setSession]=useState<Session>({user:null,cloudAvailable:false,localLoginAvailable:false,githubLoginAvailable:false});
  const [parentId,setParentId]=useState<string|null>(null);
  const [loginOpen,setLoginOpen]=useState(false);
  const [cloudError,setCloudError]=useState('');
  const [deleteItem,setDeleteItem]=useState<SavedScenario|null>(null);
  const [guideOpen,setGuideOpen]=useState(false);
  const requestIdentity=useRef({fingerprint:'',key:''});
  const scores=useMemo(()=>fromRaw(raw),[raw]);
  const validation=useMemo(()=>scoreSchema.safeParse(scores),[scores]);
  const results=useMemo(()=>calculateAll(scores),[scores]);
  const baseResults=useMemo(()=>calculateAll(baseline),[baseline]);
  const records=[...deviceRecords,...cloudRecords].sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  const compared=selectedIds.map(id=>records.find(r=>`${r.location}:${r.id}`===id)).filter((r):r is SavedScenario=>Boolean(r));
  const filtered=schools.filter(s=>(gun==='전체'||s.gun===gun)&&(!onlyFavorites||favorites.includes(s.id))&&(`${s.name} ${s.track}`.includes(query.trim())));

  async function loadSession() {
    try {const r=await fetch('/api/session',{cache:'no-store'});if(r.ok){const data:Session=await r.json();setSession(data);return data;}} catch {/* Device use remains available. */}
    return null;
  }
  async function loadCloud() {
    setCloudError('');
    try {const r=await fetch('/api/scenarios',{cache:'no-store'});const data=await r.json();if(!r.ok)throw new Error(data.error);setCloudRecords(data.scenarios);}
    catch {setCloudError('클라우드 목록을 불러오지 못했어요. 연결을 확인하고 다시 시도해 주세요.');}
  }
  useEffect(()=>{
    try{setDeviceRecords(readDevice());const saved=JSON.parse(localStorage.getItem('hangeoreum.favorites')??'[]');if(Array.isArray(saved))setFavorites(saved.filter((x:unknown)=>typeof x==='string'&&schools.some(s=>s.id===x)));}catch{setToast('기기 저장 목록을 읽지 못했어요. 브라우저 저장 설정을 확인해 주세요.');}
    void loadSession().then(s=>{if(s?.user&&s.cloudAvailable)void loadCloud();});
    if(new URLSearchParams(window.location.search).get('login')==='failed')setToast('로그인하지 못했어요. 허용된 운영자 계정인지 확인해 주세요.');
  },[]);
  useEffect(()=>{if(!toast)return;const id=setTimeout(()=>setToast(''),5500);return()=>clearTimeout(id);},[toast]);
  useEffect(()=>{const handler=(e:BeforeUnloadEvent)=>{if(dirty){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',handler);return()=>window.removeEventListener('beforeunload',handler);},[dirty]);
  function navigate(v:View){
    setView(v);
    if(window.location.hash) window.history.replaceState(window.history.state,'',window.location.pathname+window.location.search);
    window.scrollTo({top:0,behavior:'instant'});
  }
  function openSchool(school:School,input?:Scores){setDetailInput(input??null);setDetail(school);}
  function loadSample(input:Scores,title:string){setRaw(toRaw(input));setBaseline({...input});setInputTitle(`${title} · 예시`);setInputOrigin('school_target');setParentId(null);setDirty(true);setGun('전체');setQuery('');setOnlyFavorites(false);navigate('simulator');}
  function toggleFavorite(id:string){const next=favorites.includes(id)?favorites.filter(x=>x!==id):[...favorites,id];setFavorites(next);try{localStorage.setItem('hangeoreum.favorites',JSON.stringify(next));}catch{setToast('관심 학교를 이 기기에 저장하지 못했어요.');}}
  function update(key:keyof Scores,value:string){setRaw(r=>({...r,[key]:value}));setDirty(true);setInputOrigin('manual');}
  function bump(key:PercentileKey,amount:number){const value=scores[key];if(value===null||!Number.isFinite(value))return;update(key,String(Math.max(0,Math.min(100,value+amount))));}
  function loadTarget(s?:School){const input=s?.target??commonTarget;setRaw(toRaw(input));setBaseline({...input});setInputTitle(s?`${s.shortName} 목표 예시`:'공통 목표 예시');setInputOrigin('school_target');setParentId(null);setDirty(true);setView('simulator');setDetail(null);setGun('전체');window.scrollTo({top:0,behavior:'smooth'});}
  function clearInput(){const input={...emptyScores(),gedPenalty:0 as const};setRaw(toRaw(input));setBaseline(input);setInputTitle('직접 입력');setInputOrigin('manual');setParentId(null);setDirty(true);}
  function loadRecord(record:SavedScenario){const input={...scoreSchema.parse(record.scores),gedPenalty:record.scores.gedPenalty??0};setRaw(toRaw(input));setBaseline({...input});setInputTitle(record.name);setInputOrigin('score_copy');setParentId(record.location==='cloud'?record.id:null);setDirty(false);navigate('simulator');if(record.ruleVersion!==RULE_VERSION||record.engineVersion!==ENGINE_VERSION){setDirty(true);setToast('저장 당시와 규칙 버전이 달라 현재 규칙으로 새로 계산했어요.');}else setToast('저장한 점수를 불러왔어요. 변경 내용은 새 시나리오로 저장됩니다.');}
  function openSave(){if(!validation.success){setToast('입력 범위를 먼저 확인해 주세요.');return;}setSaveName(inputTitle==='직접 입력'?'나의 점수 조합':inputTitle.replace('예시','시나리오'));setSaveOpen(true);}
  async function save(location:'device'|'cloud') {
    const name=saveName.trim();if(!name){setToast('시나리오 이름을 입력해 주세요.');return;}
    if(!validation.success)return;
    setBusy(true);
    try {
      const fingerprint=JSON.stringify({name,scores,origin:inputOrigin,parentId});
      if(requestIdentity.current.fingerprint!==fingerprint)requestIdentity.current={fingerprint,key:crypto.randomUUID()};
      if(location==='device') {
        const record:SavedScenario={id:crypto.randomUUID(),name,scores:{...scores},results,createdAt:new Date().toISOString(),ruleVersion:RULE_VERSION,engineVersion:ENGINE_VERSION,origin:inputOrigin,parentId:null,location:'device'};
        saveDevice(record);setDeviceRecords(readDevice());
      } else {
        const payload:ScenarioRequest={name,scores,ruleVersion:RULE_VERSION,origin:inputOrigin,parentId,idempotencyKey:requestIdentity.current.key};
        const r=await fetch('/api/scenarios',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
        const data=await r.json();if(!r.ok)throw new Error(data.error??'저장하지 못했어요.');
        setCloudRecords(prev=>[data.scenario,...prev.filter(x=>x.id!==data.scenario.id)]);
      }
      setDirty(false);setSaveOpen(false);requestIdentity.current={fingerprint:'',key:''};setToast(location==='device'?'이 기기에 시나리오를 저장했어요.':'클라우드에 시나리오를 저장했어요.');
    } catch(error){setToast(error instanceof Error?error.message:'저장하지 못했어요. 입력은 유지됩니다.');} finally{setBusy(false);}
  }
  async function loginLocal(){setBusy(true);try{const r=await fetch('/api/auth/local',{method:'POST'});if(!r.ok)throw new Error();await loadSession();await loadCloud();setLoginOpen(false);setToast('로컬 개발 저장소에 연결했어요.');}catch{setToast('개발 로그인을 완료하지 못했어요.');}finally{setBusy(false);}}
  async function logout(){await fetch('/api/auth/logout',{method:'POST'});setCloudRecords([]);setSelectedIds(ids=>ids.filter(x=>x.startsWith('device:')));await loadSession();setToast('로그아웃했어요.');}
  async function deleteRecord(){if(!deleteItem)return;setBusy(true);try{if(deleteItem.location==='device'){removeDevice(deleteItem.id);setDeviceRecords(readDevice());}else{const r=await fetch(`/api/scenarios/${deleteItem.id}`,{method:'DELETE'});if(!r.ok)throw new Error();setCloudRecords(rs=>rs.filter(x=>x.id!==deleteItem.id));}setSelectedIds(ids=>ids.filter(id=>id!==`${deleteItem.location}:${deleteItem.id}`));setDeleteItem(null);setToast('시나리오를 목록에서 삭제했어요.');}catch{setToast('삭제하지 못했어요. 다시 시도해 주세요.');}finally{setBusy(false);}}
  function toggleCompare(record:SavedScenario){const id=`${record.location}:${record.id}`;if(selectedIds.includes(id))setSelectedIds(xs=>xs.filter(x=>x!==id));else if(selectedIds.length<2)setSelectedIds(xs=>[...xs,id]);else setToast('현재 입력과 함께 비교할 시나리오는 2개까지 선택해 주세요.');}
  function download(record:SavedScenario){const blob=new Blob([JSON.stringify(record,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`hangeoreum-${record.id}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),500);}

  const toolbar=<div className="filter-toolbar"><div className="segment" aria-label="모집군 필터">{['전체','가','나','다'].map(g=><button key={g} className={gun===g?'selected':''} onClick={()=>setGun(g)}>{g==='전체'?'전체 대학':`${g}군`}{g==='전체'&&<span>11</span>}</button>)}</div><div className="filter-right"><button className={`soft-button ${onlyFavorites?'active':''}`} onClick={()=>setOnlyFavorites(!onlyFavorites)} aria-pressed={onlyFavorites}><Bookmark size={15}/>관심 대학</button><label className="search"><Search size={16}/><input aria-label="대학 검색" placeholder="대학 검색" value={query} onChange={e=>setQuery(e.target.value)}/></label></div></div>;

  return <div className="app-shell">
    <a className="skip-link" href="#main">본문으로 이동</a>
    <aside className="sidebar">
      <button className="brand" onClick={()=>navigate('advice')} aria-label="한걸음 홈"><span className="brand-mark"><Leaf size={24}/></span><span>한걸음<small>한의대 합격을 향한 설계</small></span></button>
      <div className="workspace-label">나의 입시 워크스페이스</div>
      <nav className="main-nav" aria-label="주요 메뉴">
        <button className={view==='advice'?'nav-active':''} onClick={()=>navigate('advice')}><Target size={19}/>재현 맞춤 추천</button>
        <button className={view==='schools'?'nav-active':''} onClick={()=>navigate('schools')}><LayoutGrid size={19}/>학교별 전략</button>
        <button className={view==='simulator'?'nav-active':''} onClick={()=>navigate('simulator')}><Calculator size={19}/>점수 시뮬레이터</button>
        <button className={view==='options'?'nav-active':''} onClick={()=>navigate('options')}><ArrowLeftRight size={19}/>일반 대학 선택지</button>
        <button className={view==='dentistry'?'nav-active':''} onClick={()=>navigate('dentistry')}><HeartPulse size={19}/>치대 선택지</button>
        <button className={view==='medicine'?'nav-active':''} onClick={()=>navigate('medicine')}><Stethoscope size={19}/>의대 선택지</button>
        <button className={view==='saved'?'nav-active':''} onClick={()=>navigate('saved')}><FolderHeart size={19}/>저장한 시나리오{records.length>0&&<span className="nav-count">{records.length}</span>}</button>
        <button className={view==='history'?'nav-active':''} onClick={()=>navigate('history')}><ChartNoAxesColumnIncreasing size={19}/>2026 입결 현황</button>
      </nav>
      <div className="sidebar-note"><span className="small-eyebrow">재현의 선택과목</span><strong>나에게 맞는 길을,<br/>한 걸음씩.</strong><div className="subject-tags"><span>화법과 작문</span><span>미적분</span><span>세계지리</span><span>한국지리</span></div><p>2027학년도 · 재수생</p></div>
      <div className="sidebar-bottom"><button onClick={()=>setGuideOpen(true)}><BookOpen size={17}/>점수와 자료 읽는 법<ArrowUpRight size={15}/></button><div className="profile"><span className="avatar">재현</span><span><b>재현의 입시 전략</b><small>{session.user?session.user.name:'개인 워크스페이스'}</small></span><button className="icon-button" aria-label={session.user?'로그아웃':'클라우드 로그인'} onClick={()=>session.user?void logout():setLoginOpen(true)}>{session.user?<LogOut size={17}/>:<LogIn size={17}/>}</button></div></div>
    </aside>

    <div className="main-shell">
      <header className="topbar"><div className="breadcrumb">{view==='history'?'2026 정시 결과':'2027 정시'} <ChevronRight size={14}/><span>{view==='advice'?'재현 맞춤 추천':view==='schools'?'학교별 전략':view==='simulator'?'점수 시뮬레이터':view==='options'?'일반 대학 선택지':view==='dentistry'?'치대 선택지':view==='medicine'?'의대 선택지':view==='history'?'2026 입결 현황':'저장한 시나리오'}</span></div><div className="topbar-right"><span className="data-date"><span className="live-dot"/>{view==='history'?'자료 정리':'요강 기준'} {(view==='history'?RESULTS_AS_OF:view==='options'?OPTIONS_AS_OF:view==='dentistry'||view==='medicine'?PROFESSIONAL_AS_OF:AS_OF).replaceAll('-','.')}</span><button className="profile-pill" onClick={()=>setGuideOpen(true)}>재현 <span>한의대 준비</span></button></div></header>
      <main id="main">
        <div className={`page-heading ${view==='advice'?'advice-heading':''}`}><div><div className="eyebrow">{view==='history'?'2026 ADMISSIONS RESULTS':'2027 ADMISSIONS WORKSPACE'}</div><h1>{view==='advice'?'재현에게 맞는 대학과 목표 점수':view==='schools'?'학교별 입시 전략':view==='simulator'?'점수 시뮬레이터':view==='options'?'일반 대학 선택지':view==='dentistry'?'치대 선택지':view==='medicine'?'의대 선택지':view==='history'?'2026 입결 현황':'저장한 시나리오'}</h1><p>{view==='advice'?'추천 대학과 모집군·인원을 먼저 보고, 요강과 목표 점수를 확인하세요.':view==='schools'?'목표 대학의 반영 방식에 맞춰, 확보할 점수와 가산점을 설계하세요.':view==='simulator'?'점수를 바꾸면, 학교별 환산점수와 변화가 바로 보입니다.':view==='history'?'한의대·치대·의대의 과거 입결을 통계 기준과 공식 출처까지 확인하세요.':view==='options'?'입력한 성적으로 서울·수도권의 문과와 이과 선택지를 함께 살펴보세요.':view==='dentistry'||view==='medicine'?'재현의 과목·검정고시 조건, 2027 모집인원과 2026 입결을 함께 확인하세요.':'여러 점수 조합을 보관하고, 나에게 맞는 전략을 비교하세요.'}</p></div>{view!=='advice'&&view!=='history'&&<button className="button primary heading-action" onClick={()=>view==='simulator'?openSave():navigate('simulator')}>{view==='simulator'?<Save size={17}/>:<Calculator size={17}/>} {view==='simulator'?'시나리오 저장':'점수 넣어보기'}{view!=='simulator'&&<ArrowRight size={16}/>}</button>}</div>

        {view==='history'&&<AdmissionResults/>}
        {view==='advice'&&<AdvicePanel onLoad={loadSample} onSchool={openSchool}/>}
        {view==='options'&&<GeneralOptions scores={scores} title={dirty&&inputOrigin==='manual'?'직접 수정한 성적':inputTitle} onEdit={()=>navigate('simulator')}/>}
        {(view==='dentistry'||view==='medicine')&&<ProfessionalOptions key={view} category={view} scores={scores} title={dirty&&inputOrigin==='manual'?'직접 수정한 성적':inputTitle} onEdit={()=>navigate('simulator')} onSample={(input,title)=>{setRaw(toRaw(input));setBaseline({...input});setInputTitle(`${title} · 예시`);setInputOrigin('school_target');setParentId(null);setDirty(true);}}/>}
        {view==='schools'&&<>
          <section className="target-banner" aria-label="공통 학습 목표"><div className="target-banner-copy"><div className="banner-label"><Target size={15}/> 재현의 공통 학습 목표</div><h2>목표가 구체적이면,<br/>준비도 선명해집니다.</h2><p>학교별로 조정할 수 있는 제안 목표예요.</p><button className="text-link" onClick={()=>loadTarget()}>이 점수로 시뮬레이션 <ArrowRight size={15}/></button></div><div className="target-metrics"><div><span>국어</span><strong>98<span>+</span></strong><small>백분위</small></div><div><span>미적분 수학</span><strong>99</strong><small>백분위</small></div><div><span>지리 2과목</span><strong>98<span>/98</span></strong><small>각 백분위</small></div><div><span>영어</span><strong>1<span>등급</span></strong><small>등급 목표</small></div></div><Leaf className="banner-leaf" size={220} strokeWidth={.7}/></section>
          <div className="overview-strip"><span><b>11</b> 비교 대학</span><i/><span><b>7</b> 백분위 기반 전형</span><i/><span><b>4</b> 미적분 가산 대학</span><div className="overview-note"><Info size={14}/> 목표 점수는 합격 커트라인과 달라요.</div></div>
          {toolbar}
          <div className="section-caption"><h2>{onlyFavorites?'관심 대학':gun==='전체'?'재현의 과목으로 비교할 대학':`${gun}군 비교 대학`} <span>{filtered.length}</span></h2><span>학교별 일반전형 기준</span></div>
          <section className="school-grid" aria-label="학교별 전략 목록">{filtered.map(s=><article className="school-card" key={s.id} style={{'--school-accent':s.accent} as CSSProperties}>
            <div className="card-top"><span className={`gun-label gun-${s.gun}`}>{s.gun}군</span><span className="region">{s.region}</span><button className={`icon-button bookmark-button ${favorites.includes(s.id)?'bookmarked':''}`} onClick={()=>toggleFavorite(s.id)} aria-label={`${s.shortName} 관심 대학 ${favorites.includes(s.id)?'해제':'추가'}`} aria-pressed={favorites.includes(s.id)}><Bookmark size={18} fill={favorites.includes(s.id)?'currentColor':'none'}/></button></div>
            <div className="school-title"><span className="school-monogram">{s.character}</span><div><h3>{s.name}</h3><p>{s.track}</p></div></div>
            <p className="school-lead">{s.lead}</p>
            <div className="school-signal"><small>학교 제안 목표를 넣은 신호등</small><SignalLine result={calculate(s.id,s.target)} /></div><p className="school-seat-caption">정시 일반 {seats[s.id].focus}명 · 검토 {recommendations.find(r=>r.id===s.id)?.rank}순위</p><div className="mini-targets" aria-label={`${s.shortName} 제안 목표`}>{percentileKeys.map(key=><div key={key}><span>{key==='world'?'세지':key==='korea'?'한지':labels[key]}</span><b>{s.target[key]}{s.id==='DSU'&&key==='korea'&&<sup>*</sup>}</b></div>)}</div>
            <div className="card-insights"><span><Plus size={14}/>{s.bonus}</span><span><ArrowLeftRight size={14}/>{s.englishChange}</span></div>
            <div className="card-actions"><button className="text-button" onClick={()=>openSchool(s)}>전략 상세 <ChevronRight size={14}/></button><button className="load-target-button" onClick={()=>loadTarget(s)}>목표 불러오기 <ArrowUpRight size={14}/></button></div>
          </article>)}</section>
          {filtered.length===0&&<div className="empty-state"><Search size={28}/><h3>해당하는 대학이 없어요</h3><p>검색어나 모집군 필터를 바꿔 보세요.</p><button className="button secondary" onClick={()=>{setQuery('');setGun('전체');setOnlyFavorites(false);}}>전체 대학 보기</button></div>}
          <div className="footnote"><Info size={15}/><p>국어·수학·탐구는 백분위 목표입니다. 동신대는 지리 상위 1과목을 반영하며, 낮은 과목의 95는 설명용 예시입니다. 과목 조건 외 전체 지원자격은 별도로 확인해야 합니다.</p></div>
          <details className="excluded"><summary>현재 과목 조합에서 제외한 전형 <ChevronDown size={16}/></summary>{exclusions.map(x=><p key={x.name}><b>{x.name}</b> {x.reason} {x.source&&<a href={x.source} target="_blank" rel="noreferrer">공식 요강 ↗</a>}</p>)}</details>
        </>}

        {view==='simulator'&&<>
          <div className="simulator-banner"><div><span className="tag">가상 점수</span><b>{inputTitle}</b><span className="muted">{dirty?'변경 내용 저장 안 됨':'불러온 점수 기준'}</span></div><button className="text-button" onClick={clearInput}><RotateCcw size={14}/>직접 입력</button></div>
          <div className="simulator-layout">
            <section className="input-panel"><div className="panel-title"><h2>점수 입력</h2><span>재현의 선택과목</span></div><p className="panel-description">국수탐은 백분위, 영어·한국사는 등급</p>
              <div className="score-input-grid">{basicKeys.map(key=>{
                const errors=validation.success?[]:validation.error.issues.filter(i=>i.path[0]===key);
                return <div className={`score-field ${errors.length?'has-error':''}`} key={key}><label htmlFor={`score-${key}`}>{labels[key]}<small>{subjectSub[key]}</small></label>{key==='english'||key==='history'?<select id={`score-${key}`} aria-label={`${labels[key]} 등급`} value={raw[key]} onChange={e=>update(key,e.target.value)}><option value="">선택</option>{Array.from({length:9},(_,i)=><option key={i+1} value={i+1}>{i+1}등급</option>)}</select>:<div className="number-control"><button aria-label={`${labels[key]} 백분위 1 낮추기`} onClick={()=>bump(key,-1)} disabled={scores[key]===null||scores[key]===0}><Minus size={13}/></button><input id={`score-${key}`} aria-label={`${labels[key]} 백분위`} type="number" inputMode="numeric" min="0" max="100" step="1" placeholder="—" value={raw[key]} onChange={e=>update(key,e.target.value)} aria-invalid={Boolean(errors.length)}/><button aria-label={`${labels[key]} 백분위 1 높이기`} onClick={()=>bump(key,1)} disabled={scores[key]===null||scores[key]===100}><Plus size={13}/></button></div>}{errors.length>0&&<small className="field-error">{key==='english'||key==='history'?'1~9등급':'0~100 정수'}를 입력해 주세요</small>}</div>;
              })}</div>
              <div className="quick-changes"><span>빠르게 바꿔보기</span><div><button onClick={()=>bump('math',1)} disabled={scores.math===null||scores.math===100}>수학 +1</button><button onClick={()=>update('english',scores.english===1?'2':'1')}>영어 {scores.english===1?'2':'1'}등급</button><button onClick={()=>bump('korea',1)} disabled={scores.korea===null||scores.korea===100}>한지 +1</button></div></div>
              <button className="advanced-toggle" aria-expanded={advanced} onClick={()=>setAdvanced(!advanced)}><SlidersHorizontal size={15}/>표준점수·검정고시 추가 입력<ChevronDown size={15} className={advanced?'rotated':''}/></button>
              {advanced&&<div className="advanced-fields"><p>원광 인문 계산에는 표준점수가 필요해요. 다른 대학의 변환표는 별도 확인합니다.</p>{standardKeys.map(key=><label key={key} htmlFor={key}>{labels[key]}<input id={key} type="number" inputMode="numeric" min="0" max="200" step="1" value={raw[key]} placeholder="미입력" onChange={e=>update(key,e.target.value)}/></label>)}<label htmlFor="ged-penalty">상지 검정고시 평균 구간<select id="ged-penalty" aria-label="상지 검정고시 평균 구간" value={raw.gedPenalty??''} onChange={e=>update('gedPenalty',e.target.value)}><option value="">미확인</option><option value="0">95점 이상 · 감점0점</option><option value="5">85~95점 미만 · 감점5점</option><option value="10">70~85점 미만 · 감점10점</option><option value="15">60~70점 미만 · 감점15점</option></select></label><small>재현은 검정고시 평균95점 이상으로 확인됐습니다. 다른 구간 선택은 가상 비교이며, 이전 결석일수는 계산에 사용하지 않습니다.</small>{!validation.success&&validation.error.issues.some(i=>!basicKeys.includes(i.path[0] as typeof basicKeys[number]))&&<span className="field-error">추가 입력은 범위 안의 정수로 입력해 주세요.</span>}</div>}
              <div className="baseline-box"><span>변화 비교 기준</span><p>{basicKeys.map(k=>`${labels[k]} ${baseline[k]??'—'}`).join(' · ')}</p><button className="text-button" disabled={!validation.success} onClick={()=>{setBaseline({...scores});setToast('현재 점수를 비교 기준으로 고정했어요.');}}>현재 점수를 기준으로 <Check size={14}/></button></div>
              <button className="button primary full-width" onClick={openSave} disabled={!validation.success}><Save size={16}/>시나리오 저장</button>
            </section>
            <section className="results-panel" aria-label="대학별 계산 결과"><div className="results-heading"><h2>학교별 환산 결과 <span>{results.filter(r=>r.total!==null).length}개 계산</span></h2><span className="tag outline">기타 감점 없음 가정</span></div>{toolbar}
              <div className="result-list">{filtered.map(s=>{const r=results.find(x=>x.schoolId===s.id)!;const br=baseResults.find(x=>x.schoolId===s.id)!;const targetResult=calculate(s.id,s.target);return <article className="result-card" key={s.id}><div className="result-card-main"><div className="result-school"><span className={`gun-label gun-${s.gun}`}>{s.gun}군</span><div><h3>{s.name}</h3><small>{s.track}</small></div></div><div className="result-total"><ResultValue result={r}/></div></div>
                <div className="result-signal"><SignalLine result={r} /></div>
                {r.total!==null?<div className="result-bottom"><span>기준 대비 <Delta value={difference(r,br)}/></span><span>{targetResult.total!==null?<>제안 목표 대비 <Delta value={difference(r,targetResult)}/></>:'학교 목표는 학습용 백분위로 제안'}</span><button className="text-button" onClick={()=>openSchool(s)}>계산 근거 <ChevronRight size={14}/></button></div>:<div className="result-bottom"><span className="missing-list">{r.missing.join(' · ')}</span><button className="text-button" onClick={()=>openSchool(s)}>전략 보기 <ChevronRight size={14}/></button></div>}
              </article>;})}</div>
              {filtered.length===0&&<div className="empty-state"><p>조건에 맞는 대학이 없어요.</p></div>}
              <div className="footnote"><Info size={15}/><p>점수 차이는 같은 학교·같은 산식끼리 비교합니다. 제안 목표와의 차이가 합격 가능성을 뜻하지는 않습니다. 동신대는 최종 표시 자리수 확인 전 원값입니다.</p></div>
            </section>
          </div>
        </>}

        {view==='saved'&&<>
          <div className="storage-summary"><div><Monitor size={21}/><span><b>이 기기</b><small>{deviceRecords.length}개 저장 · 현재 브라우저에서 확인</small></span></div><div><Cloud size={21}/><span><b>{session.user?'클라우드 연결':'클라우드 저장'}</b><small>{session.user?`${cloudRecords.length}개 저장 · ${session.user.name}`:'로그인하면 다른 기기에서도 불러올 수 있어요'}</small></span><button className="text-button" onClick={()=>session.user?void loadCloud():setLoginOpen(true)}>{session.user?'새로고침':'로그인'}<ChevronRight size={14}/></button></div></div>
          {cloudError&&<div className="inline-message">{cloudError}<button className="text-button" onClick={()=>void loadCloud()}>다시 시도</button></div>}
          <div className="section-caption"><h2>나의 점수 조합 <span>{records.length}</span></h2><span>현재 입력과 최대 2개 시나리오 비교</span></div>
          <section className="saved-grid">{records.map(record=>{const selected=selectedIds.includes(`${record.location}:${record.id}`);return <article className={`saved-card ${selected?'chosen':''}`} key={`${record.location}:${record.id}`}><div className="saved-card-top"><span className="tag outline">{record.location==='device'?<Monitor size={13}/>:<Cloud size={13}/>} {record.location==='device'?'이 기기':'클라우드'}</span><button className="icon-button" aria-label={`${record.name} 삭제`} onClick={()=>setDeleteItem(record)}><Trash2 size={16}/></button></div><h3>{record.name}</h3><small className="muted">{dateLabel(record.createdAt)} · 가상 점수</small><div className="saved-score-line">{basicKeys.map(k=><span key={k}>{labels[k]}<b>{record.scores[k]??'—'}{(k==='english'||k==='history')&&record.scores[k]!==null?'등급':''}</b></span>)}</div>{(record.ruleVersion!==RULE_VERSION||record.engineVersion!==ENGINE_VERSION)&&<p className="field-error">이전 규칙으로 저장됨 · 불러오면 재계산</p>}<div className="saved-actions"><button className="button secondary" onClick={()=>loadRecord(record)}>불러오기<ArrowUpRight size={14}/></button><button className={`button ${selected?'selected-button':'ghost'}`} onClick={()=>toggleCompare(record)}>{selected?<Check size={14}/>:<Plus size={14}/>}비교</button><button className="icon-button" aria-label={`${record.name} JSON 내보내기`} onClick={()=>download(record)}><Download size={16}/></button></div></article>;})}</section>
          {records.length===0&&<div className="empty-state large"><span className="empty-icon"><FolderHeart size={34}/></span><h3>첫 번째 점수 조합을 저장해 보세요</h3><p>수학을 한 점 올린 조합, 영어를 지킨 조합.<br/>여러 가능성을 저장하고 비교할 수 있어요.</p><button className="button primary" onClick={()=>navigate('simulator')}>시뮬레이터 열기<ArrowRight size={16}/></button></div>}
          {compared.length>0&&<section className="comparison-section"><div className="section-caption"><h2>시나리오 비교</h2><button className="text-button" onClick={()=>setSelectedIds([])}>선택 해제</button></div><div className="table-scroll"><table><thead><tr><th>대학·전형</th><th>현재 입력</th>{compared.map(r=><th key={r.id}>{r.name}<small>{r.location==='device'?'이 기기':'클라우드'}</small></th>)}</tr></thead><tbody>{schools.map(s=><tr key={s.id}><th><span className={`gun-label gun-${s.gun}`}>{s.gun}군</span>{s.shortName}</th><td>{formatScore(results.find(r=>r.schoolId===s.id)!.total)}</td>{compared.map(record=>{const r=record.results.find(x=>x.schoolId===s.id);return <td key={record.id}>{r?formatScore(r.total):'이전 규칙'}{r&&<small>현재 대비 <Delta value={difference(r,results.find(x=>x.schoolId===s.id)!)}/></small>}</td>;})}</tr>)}</tbody></table></div><p className="muted small">단위는 각 대학의 환산점수입니다. 가천은 /100 지표, 동신은 산식 원값입니다. 대학 간 총점 크기는 비교하지 않습니다.</p></section>}
        </>}
        <footer className="page-footer"><span><Leaf size={14}/> 한걸음 · 재현의 2027 입시 워크스페이스</span><button onClick={()=>setGuideOpen(true)}>자료 기준과 사용 안내 <ArrowUpRight size={13}/></button></footer>
      </main>
    </div>

    {detail&&<SchoolDetail school={detail} result={calculate(detail.id,detailInput??scores)} scores={detailInput??scores} onClose={()=>setDetail(null)} onLoad={()=>loadTarget(detail)} onSolveApply={(field,value)=>{if(detailInput)loadSample({...detailInput,[field]:value},'역산 목표');else update(field,String(value));setDetail(null);setView('simulator');}}/>}
    {saveOpen&&<Modal title="이 점수 조합 저장하기" onClose={()=>{if(!busy)setSaveOpen(false);}}><p className="modal-copy">가상 시나리오로 저장합니다. 기존 성적은 바뀌지 않아요.</p><label className="form-label" htmlFor="scenario-name">시나리오 이름</label><input className="text-input" id="scenario-name" maxLength={60} value={saveName} onChange={e=>setSaveName(e.target.value)} placeholder="예: 영어 1등급 유지 전략" autoFocus/><div className="save-preview">{basicKeys.map(k=><span key={k}>{labels[k]} <b>{scores[k]??'—'}</b></span>)}</div><button className="save-option" disabled={busy||!saveName.trim()} onClick={()=>void save('device')}><Monitor size={21}/><span><b>이 기기에 저장</b><small>지금 사용하는 브라우저에 보관해요.</small></span><ArrowRight size={17}/></button><button className="save-option" disabled={busy||!saveName.trim()||!session.user||!session.cloudAvailable} onClick={()=>void save('cloud')}><Cloud size={21}/><span><b>클라우드에 저장</b><small>{session.user&&session.cloudAvailable?'다른 기기에서도 불러올 수 있어요.':'로그인과 저장소 연결 후 사용할 수 있어요.'}</small></span><ArrowRight size={17}/></button>{!session.user&&<button className="text-link" onClick={()=>{setSaveOpen(false);setLoginOpen(true);}}>클라우드 로그인 <LogIn size={15}/></button>}{busy&&<p role="status" className="muted">저장하고 있어요…</p>}</Modal>}
    {loginOpen&&<Modal title="클라우드 로그인" onClose={()=>setLoginOpen(false)}><p className="modal-copy">허용된 운영자 계정으로 로그인하면 점수 조합을 여러 기기에서 사용할 수 있어요.</p>{session.githubLoginAvailable&&<a className="button primary full-width" href="/api/auth/github"><LogIn size={17}/>GitHub로 로그인</a>}{session.localLoginAvailable&&<button className="button secondary full-width" disabled={busy} onClick={()=>void loginLocal()}><Monitor size={17}/>로컬 개발 계정으로 시작</button>}{!session.githubLoginAvailable&&!session.localLoginAvailable&&<div className="inline-message">클라우드 로그인이 아직 연결되지 않았어요. 점수 계산과 이 기기 저장은 바로 사용할 수 있습니다.</div>}<button className="text-button" onClick={()=>setLoginOpen(false)}>기기 저장으로 계속하기 <ArrowRight size={14}/></button></Modal>}
    {deleteItem&&<Modal title="시나리오 삭제" onClose={()=>setDeleteItem(null)}><p className="modal-copy">‘{deleteItem.name}’을 저장 목록에서 삭제합니다.</p><div className="modal-actions"><button className="button secondary" onClick={()=>setDeleteItem(null)}>취소</button><button className="button danger" onClick={()=>void deleteRecord()} disabled={busy}>삭제</button></div></Modal>}
    {guideOpen&&<Modal title="점수와 자료 읽는 법" onClose={()=>setGuideOpen(false)}><div className="guide-content"><h3>신호등은 계획 목표와의 거리입니다</h3><p>빨강은 예상 기준선 상단 미달, 노랑은 상단 도달, 초록은 제안한 여유 목표 도달입니다. 합격확률·합격 보장이 아닙니다. 평균만 공개되거나 변환표가 없는 학교, 입력이 부족한 학교는 회색으로 표시합니다.</p><h3>학교 목표부터 시작해요</h3><p>학교별 목표는 학습 계획을 위한 제안입니다. 공식 합격 커트라인이나 합격확률이 아닙니다.</p><h3>국수탐은 백분위, 영어·한국사는 등급</h3><p>백분위98은 원점수98점과 다릅니다. 표준점수와 대학 변환표가 필요한 학교는 입력·자료가 확보될 때 계산합니다.</p><h3>같은 학교의 점수끼리 비교해요</h3><p>대학마다 총점과 반영비율이 달라 점수 크기로 대학을 순위화하지 않습니다. 과거 평균·70%·80%는 각각 다른 통계입니다.</p><h3>현재 구현 범위</h3><p>재현의 화작·미적분·지리2과목 일반전형 전략과 가상 점수 계산입니다. 검정고시 평균95점 이상인 재현의 백분위7개 전형과 원광 인문 산식을 제공하며 동신은 최종 표시 자리수 확인 전 원값입니다. 경희·동의·부산은 공식 변환표 대기입니다.</p><h3>지원 전에는 자격을 확인해요</h3><p>과목 조건 외 수시 합격 여부·학력·서류·기타 감점은 별도 확인이 필요합니다. 이 화면은 원서 제출이나 최종 지원 확정을 실행하지 않습니다.</p><p className="muted small">공식 요강 확인일 {AS_OF} · 규칙 {RULE_VERSION} · 엔진 {ENGINE_VERSION}</p></div></Modal>}
    {toast&&<div className="toast" role="status"><Check size={17}/><span>{toast}</span><button onClick={()=>setToast('')} aria-label="알림 닫기"><X size={15}/></button></div>}
  </div>;
}

function SchoolDetail({school:s,result,scores,onClose,onLoad,onSolveApply}:{school:School;result:Result;scores:Scores;onClose:()=>void;onLoad:()=>void;onSolveApply:(field:PercentileKey,value:number)=>void}) {
  const [field,setField]=useState<PercentileKey>('math');
  const [target,setTarget]=useState(calculate(s.id,s.target).total??'');
  const [solution,setSolution]=useState<ReturnType<typeof solveTarget>|null>(null);
  return <Modal title={`${s.name} 전략 상세`} onClose={onClose} wide><div className="detail-intro"><span className={`gun-label gun-${s.gun}`}>{s.gun}군</span><span>{s.track}</span><span className="tag outline">재현 과목 조건 충족</span></div><h3 className="detail-lead">{s.lead}</h3><div className="detail-target"><span>제안 학습 목표</span><b>{s.targetText}</b><small>영어 {s.target.english}등급 · {s.historyTip}</small><button className="button primary" onClick={onLoad}>이 목표로 계산하기<ArrowRight size={15}/></button></div><div className="strategy-points">{s.strategy.map((text,i)=><p key={text}><span>{String(i+1).padStart(2,'0')}</span>{text}</p>)}</div><section className="detail-section"><h3>계산 근거</h3><p className="detail-input-label">계산에 사용한 백분위: 국어 {scores.korean??'미입력'} · 수학 {scores.math??'미입력'} · 세지 {scores.world??'미입력'} · 한지 {scores.korea??'미입력'} / 영어 {scores.english??'미입력'} · 한국사 {scores.history??'미입력'}등급</p><div className="detail-result"><ResultValue result={result}/></div><SignalDetail result={result} /><code className="formula">{s.formula}</code>{result.total!==null?<div className="trace-list">{result.steps.map(step=><div key={step.label}><span>{step.label}<small>{step.expression}</small></span><b className={step.kind==='bonus'?'positive':step.kind==='deduction'?'negative':''}>{step.kind==='bonus'?'+':''}{formatScore(step.value)}</b></div>)}</div>:<p className="inline-message">필요한 자료: {result.missing.join(', ')}</p>}<ul className="detail-notes">{result.notes.map(n=><li key={n}>{n}</li>)}</ul></section>
    {s.basis==='percentile'&&<section className="detail-section solver"><h3><Target size={17}/>목표 점수 역산</h3><p>다른 과목은 현재 입력으로 고정하고, 선택한 과목에 필요한 백분위를 찾습니다.</p><div className="solver-controls"><label>바꿀 과목<select aria-label="역산할 과목" value={field} onChange={e=>{setField(e.target.value as PercentileKey);setSolution(null);}}>{percentileKeys.map(k=><option key={k} value={k}>{labels[k]}</option>)}</select></label><label>목표 환산점수<input aria-label="목표 환산점수" inputMode="decimal" value={target} onChange={e=>{setTarget(e.target.value);setSolution(null);}}/></label><button className="button secondary" onClick={()=>setSolution(solveTarget(s.id,scores,field,target))}>필요 점수 찾기</button></div>{solution&&<div className="solver-answer"><p>{solution.reason}</p>{solution.value!==null&&<button className="text-button" onClick={()=>onSolveApply(field,solution.value!)}>입력에 적용 <ArrowRight size={14}/></button>}</div>}</section>}
    <section className="detail-section"><h3>과거 입결 참고</h3><p className="historical-note">{s.historical}</p>{s.historicalSource&&<a className="source-link" href={s.historicalSource} target="_blank" rel="noreferrer">과거 공식 결과 <ArrowUpRight size={14}/></a>}</section><div className="detail-source"><BookOpen size={18}/><div><b>2027학년도 공식 모집요강</b><small>{s.page} · 확인 {AS_OF}</small></div><a className="button secondary" href={s.source} target="_blank" rel="noreferrer">원문 보기<ArrowUpRight size={15}/></a></div>
  </Modal>;
}
