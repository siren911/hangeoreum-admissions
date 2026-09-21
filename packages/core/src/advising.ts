import { makeTarget, type SchoolId, type Scores } from './types';

export const applicantContext = {
  published:'2026-09-08', total:551864, graduates:173706, equivalency:22767,
  nonStudents:196473, previousNonStudents:182277, increase:14196, share:35.6,
  source:'https://www.moe.go.kr/boardCnts/viewRenew.do?boardID=294&boardSeq=107152&lev=0&m=020402&opType=N&page=1&s=moe&statusYN=W',
  historicalSource:'https://www.yna.co.kr/view/AKR20260908078400530',
};

// Review order based on published selection rules. No student scores or admission probability.
export const recommendations:{id:SchoolId;rank:number;reason:string;condition:string}[] = [
  {id:'GCU',rank:1,reason:'사탐에 과탐 가산 격차가 없고 일반1 모집16명. 영어2등급의 손실도 비교적 작아 여러 점수 조합을 비교하기 좋습니다.',condition:'국어·수학·지리 두 과목을 고르게 높여야 합니다. 서울 거주 자체의 가산은 없습니다.'},
  {id:'DSU',rank:2,reason:'미적5% 가산을 받고 지리 중 높은 한 과목만 반영합니다. 재현의 선택과목을 활용하기 좋은 가군 후보입니다.',condition:'영어1·한국사1 확보가 중요합니다. 다른 지리를 포기하면 타 대학 선택지가 줄어듭니다.'},
  {id:'WSU',rank:3,reason:'미적 백분위×0.1을 더하고 사탐2과목을 허용합니다. 영어2의 손실은4점으로 나군에서 우선 계산할 만합니다.',condition:'일반6명으로 작고 수학·탐구 비중이 큽니다. 요강 게시 파일은 ‘안’ 표기로 정정 여부 확인이 필요합니다.'},
  {id:'DJU',rank:4,reason:'미적 응시에3점을 가산하고 국수 반영이27:28로 균형적입니다. 가군에서 가천·동신과 비교할 후보입니다.',condition:'일반7명이며 지역인재4명은 재현의 몫이 아닙니다. 영어2는20점 손실, 과탐2 가산3점은 받지 못합니다.'},
  {id:'DEU',rank:5,reason:'미적/기하 일반11명에 사탐으로 지원할 수 있고 한의예과에 별도 과탐 가산이 없습니다.',condition:'확통3명과 구분합니다. 2027 탐구 변환표·표준점수 확보 후 원서 우선순위를 다시 계산합니다.'},
  {id:'KHU',rank:6,reason:'인문13명은 사탐 조합에 맞고 영어1·2등급 배점이 같습니다. 국어·수학을 높게 확보할 때 적극 비교합니다.',condition:'국수 각각35%로 두 영역의 높은 성취가 필요합니다. 자연39명도 과목상 가능하지만 수학40%·과탐 가산을 따로 따져야 합니다.'},
  {id:'SMU',rank:7,reason:'일반14명이고 미적5% 가산을 활용할 수 있습니다. 나군에서 우석·동의와 함께 비교합니다.',condition:'과탐2 응시자는 탐구에도5% 가산을 받습니다. 재현의 사탐 점수로 그 격차까지 비교해야 합니다.'},
  {id:'SJUB',rank:8,reason:'다군 B형9명에 사탐으로 지원 가능. 검정고시 평균95점 이상인 재현의 출결 대체 감점은0점입니다.',condition:'수학40%·영어1→2 손실20점. 과탐 응시자도 B형에 지원할 수 있습니다. 다군의 우선 비교 후보입니다.'},
  {id:'DGU2',rank:9,reason:'다군 유형Ⅱ는 사탐2과목을 허용합니다. 상지B와 실제 환산점수로 비교할 후보입니다.',condition:'일반2명으로 변동성이 큽니다. 유형Ⅰ9명은 과탐 조건으로 제외하며 충원 예비번호를 안정성으로 해석하지 않습니다.'},
  {id:'WKU',rank:10,reason:'인문은 사탐을 허용하고 국어 표준점수를1.2배 반영합니다. 국어가 특히 강해질 때 재검토합니다.',condition:'인문2명, 과거 성적 비공개로 근거가 제한됩니다. 자연4명은 재현의 탐구 조건에 맞지 않습니다.'},
  {id:'PNU',rank:11,reason:'미적·사탐으로 학·석사통합과정 일반5명에 지원할 수 있는 별도 후보입니다.',condition:'7년 과정 선택 의사가 필요합니다. 수학·탐구 비중과 과탐2 가산5%, 공식 변환표를 함께 확인합니다.'},
];

export const seats:Record<SchoolId,{generalTotal:number;focus:number;split:string;page:string}> = {
  GCU:{generalTotal:16,focus:16,split:'일반전형1 16명',page:'PDF7·12쪽'},
  DSU:{generalTotal:8,focus:8,split:'가군 일반8명',page:'PDF3쪽'},
  WSU:{generalTotal:6,focus:6,split:'나군 일반6명 · 지역인재 등은 수시 이월 별도',page:'PDF7쪽 · 게시안'},
  DJU:{generalTotal:7,focus:7,split:'일반7명 · 별도 지역인재4명 제외',page:'PDF6쪽'},
  DEU:{generalTotal:14,focus:11,split:'미적/기하11명 · 확통3명 제외',page:'PDF8·16쪽'},
  KHU:{generalTotal:52,focus:13,split:'인문13명 우선 · 자연39명도 과목상 가능, 별도 비교',page:'PDF16~17·30쪽'},
  SMU:{generalTotal:14,focus:14,split:'나군 일반14명',page:'PDF9쪽'},
  SJUB:{generalTotal:24,focus:9,split:'B형9명 · 과탐 지정 A형15명 제외',page:'PDF6~7쪽'},
  DGU2:{generalTotal:11,focus:2,split:'유형Ⅱ2명 · 과탐 지정 유형Ⅰ9명 제외',page:'PDF4쪽'},
  WKU:{generalTotal:6,focus:2,split:'인문2명 · 과탐 지정 자연4명 제외',page:'PDF11쪽'},
  PNU:{generalTotal:5,focus:5,split:'학·석사통합과정 일반5명',page:'PDF12쪽'},
};

export type PlanningSample={id:string;title:string;subtitle:string;scores:Scores;explanation:string};
export const planningSamples:PlanningSample[] = [
  {id:'base',title:'기본 학습 목표',subtitle:'국98 · 수99 · 세지98 · 한지98',scores:makeTarget(98,99,98,98,1,1),explanation:'학교별 공개 결과와 반영구조를 참고한 공동 준비 목표입니다. 최소 합격선이 아닙니다.'},
  {id:'buffer',title:'경쟁 심화 대비 목표',subtitle:'국99 · 수99 · 세지99 · 한지99',scores:makeTarget(99,99,99,99,1,1),explanation:'기본 목표보다 국어·두 지리를 백분위1씩 높인 보수적 준비안입니다. N수생 증가율을 컷 상승률로 환산한 예측이 아닙니다.'},
  {id:'english2',title:'영어가 2등급이라면',subtitle:'국98 · 수99 · 세지98 · 한지98',scores:makeTarget(98,99,98,98,2,1),explanation:'기본 목표에서 영어만2등급으로 바꾼 비교입니다. 대학별 영어 손실을 확인하고 보완할 과목을 정합니다.'},
  {id:'dongshin',title:'동신대 집중 조합',subtitle:'국98 · 수98 · 세지99 · 한지95',scores:makeTarget(98,98,99,95,1,1),explanation:'높은 지리 한 과목을 활용한 예시입니다. 한지95는 최저 조건이 아니며 다른 대학을 함께 준비한다면 두 지리를 모두 높입니다.'},
  {id:'challenge',title:'점수 보완 예시',subtitle:'국96 · 수97 · 세지96 · 한지96',scores:makeTarget(96,97,96,96,2,2),explanation:'영어·한국사 2등급, 국수탐 백분위 96~97을 넣은 가상 예시입니다. 재현의 실제 성적을 반영하지 않았습니다.'},
];
export const preparationActions = [
  {title:'영어1등급을 꾸준히 확보',detail:'수능 영어 원점수90점 이상이1등급입니다. 준비 목표는 실전 연습에서93~95점을 반복해 얻는 것으로 잡아 실수 여유를 둡니다. 93~95는 학습 제안입니다.'},
  {title:'미적분은 백분위98~99 목표',detail:'학교별로98도 비교할 수 있지만 여러 대학을 함께 준비하려면99를 목표로 삼습니다. 원점수 목표는 시험 난도와 표준점수 분포가 나온 뒤 정합니다.'},
  {title:'두 지리는 각각98, 높은 목표는99',detail:'동신은 높은 한 과목만 보지만 대부분은 두 과목 평균을 봅니다. 만점을 받아도 난도·동점자 분포에 따라 백분위99가 보장되지는 않습니다.'},
  {title:'국어98~99 · 한국사1등급 목표',detail:'화작 선택 자체를 바꾸기보다 국어 백분위를 높입니다. 한국사는 동신의1→2등급 손실10점을 피하도록1등급을 공동 목표로 둡니다.'},
];
