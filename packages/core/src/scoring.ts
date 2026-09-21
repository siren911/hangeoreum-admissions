import Decimal from 'decimal.js';
import { schools, getSchool } from './catalog';
import { ENGINE_VERSION, RULE_VERSION, labels, scoreSchema, type Scores, type SchoolId, type Result, type Step, type PercentileKey } from './types';

// Source: each school's 2027 guide; PDF page references live in catalog.ts.
const english: Partial<Record<SchoolId, number[]>> = {
  GCU:[98,95,92,86,80,60,50,40,30], DJU:[100,90,80,70,60,45,30,15,0],
  DSU:[100,90,80,70,60,50,40,30,20], WSU:[100,95,90,85,80,75,70,65,60],
  SMU:[100,90,80,70,60,50,40,30,20], DGU2:[98,92.5,83,68.5,50,31.5,17,7.5,0],
  SJUB:[100,90,75,60,55,50,35,20,10], WKU:[100,97,93,88,83,78,73,68,63],
};
const D = (n: Decimal.Value) => new Decimal(n);
const commonNotes = ['검정고시 출신 재현의 화작·미적분·세계지리·한국지리 조합을 계산합니다.', '학교폭력 등 기타 감점은 없다는 가정입니다. 수시 합격 여부·증빙서류 등 최종 지원자격은 별도 확인이 필요합니다.'];
export function calculate(schoolId: SchoolId, input: Scores): Result {
  const school = getSchool(schoolId)!;
  const result: Result = {schoolId, status:'missing_input', total:null, rawTotal:null, steps:[], missing:[], notes:[...commonNotes],
    unit:schoolId==='GCU'?'환산지표 /100':'대학 환산점수', ruleVersion:RULE_VERSION, engineVersion:ENGINE_VERSION, eligibility:'needs_review', subjectCondition:'pass'};
  const validation = scoreSchema.safeParse(input);
  if (!validation.success) return {...result, status:'invalid', missing:validation.error.issues.map(i=>`${labels[i.path[0] as keyof Scores] ?? '입력'}: 범위를 확인해 주세요`)};
  const s = validation.data;
  if (['KHU','DEU','PNU'].includes(schoolId)) {
    const required: (keyof Scores)[] = ['koreanStandard','mathStandard','world','korea','english','history'];
    result.missing = required.filter(k=>s[k]===null).map(k=>labels[k]);
    result.missing.push('2027학년도 공식 탐구 변환표');
    return {...result, status:'waiting_table', notes:[...result.notes,'백분위에서 표준점수를 임의로 추정하지 않습니다. 목표 조합과 배점 전략은 학교 상세에서 볼 수 있습니다.']};
  }
  const required: (keyof Scores)[] = schoolId==='WKU'
    ? ['koreanStandard','mathStandard','worldStandard','koreaStandard','world','korea','english','history']
    : ['korean','math','world','korea','english',...(['GCU','SMU'].includes(schoolId)?[]:['history' as const])];
  // Both inquiry values are needed to establish which is higher; a missing value is never a zero.
  if(schoolId==='SJUB') required.push('gedPenalty');
  result.missing = required.filter(k=>s[k]===null).map(k=>labels[k]);
  if (result.missing.length) return result;
  if (s.history===null) result.notes.push('한국사 등급은 점수에 반영하지 않지만 수능 한국사 응시는 필요합니다.');
  const k = D(s.korean??0), m=D(s.math??0), t=D(s.world!).plus(s.korea!).div(2);
  const e = D(english[schoolId]![s.english!-1]);
  const h = s.history ?? 1;
  let total = D(0);
  const add = (label:string, expression:string, value:Decimal.Value, kind:Step['kind']='base') => {
    const v=D(value); total=total.plus(v); result.steps.push({label,expression,value:v.toString(),kind});
  };
  const base = (kc:number,mc:number,ec:number,tc:number,best=false) => {
    add('국어',`${s.korean} × ${kc}`,k.times(kc));
    add('수학',`${s.math} × ${mc}`,m.times(mc));
    add('영어',`${s.english}등급 → ${e} × ${ec}`,e.times(ec));
    const q=best?Decimal.max(s.world!,s.korea!):t;
    add(best?'탐구 상위 1과목':'탐구 2과목 평균',`${q} × ${tc}`,q.times(tc));
  };
  switch(schoolId) {
    case 'GCU': base(.25,.30,.20,.25); break;
    case 'DJU':
      base(2.7,2.8,2,2.5); add('미적분 가산','미적분 응시 +3',3,'bonus');
      add('한국사 가산',`${h}등급`,h<=4?5:9-h,'bonus');
      if(total.gt(1000)) add('총점 상한','1,000점 초과분 조정',D(1000).minus(total),'deduction');
      break;
    case 'DSU':
      base(2.5,2.5,2,2,true); add('미적분 가산',`${s.math} × 5% × 2.5`,m.times('.125'),'bonus');
      add('한국사',`${h}등급 → ${110-10*h}`,110-10*h);
      result.notes.push('최종 표시 자리수 확인 전 산식 원값입니다. 다른 대학의 1,000점 상한을 적용하지 않습니다.'); break;
    case 'WSU':
      base(.8,1.2,.8,1.2); add('미적분 가산',`${s.math} × 0.1`,m.times('.1'),'bonus');
      add('한국사 가산',`${h}등급`,h<=5?5:10-h,'bonus'); break;
    case 'SMU': base(3,3,1,3); add('미적분 가산',`${s.math} × 5% × 3`,m.times('.15'),'bonus'); break;
    case 'DGU2': base(2.5,3.5,2,2); add('한국사 가산',`${h}등급`,h<=3?10:9,'bonus'); break;
    case 'SJUB': {
      base(2,4,2,2); add('한국사 가산',`${h}등급`,Math.max(0,4-h),'bonus');
      const band=s.gedPenalty===0?'95점 이상':s.gedPenalty===5?'85점 이상~95점 미만':s.gedPenalty===10?'70점 이상~85점 미만':'60점 이상~70점 미만';
      add('검정고시 대체 감점',`성적증명서 평균 ${band}`,-s.gedPenalty!,'deduction');
      result.notes.push('상지 요강 PDF33쪽: 검정고시 평균 구간으로 출결 대체 감점. 재현의 확인된 구간은95점 이상(0점)입니다. 다른 구간 선택은 가상 비교이며 한의예과에는 검정고시 교과20%를 합산하지 않습니다.'); break;
    }
    case 'WKU':
      add('국어',`표준 ${s.koreanStandard} × 1.2`,D(s.koreanStandard!).times('1.2'));
      add('수학',`표준 ${s.mathStandard}`,s.mathStandard!);
      add('세계지리',`(표준 ${s.worldStandard} + 백분위 ${s.world}) ÷ 2`,D(s.worldStandard!).plus(s.world!).div(2));
      add('한국지리',`(표준 ${s.koreaStandard} + 백분위 ${s.korea}) ÷ 2`,D(s.koreaStandard!).plus(s.korea!).div(2));
      add('영어',`${s.english}등급`,e); add('한국사 가산',`${h}등급`,h<=5?5:10-h,'bonus');
      result.notes.push('동일 시험의 표준점수와 백분위 조합인지 확인해 주세요. 가상 지표는 실제 점수 분포를 보장하지 않습니다.'); break;
  }
  result.rawTotal=total.toString();
  if(schoolId==='SMU') {
    const rounded=total.toDecimalPlaces(1,Decimal.ROUND_HALF_UP);
    add('최종 반올림','소수 둘째 자리에서 반올림',rounded.minus(total),'rounding');
  }
  // J's integer percentiles make DGU's three-decimal rule and SJU's two-decimal stages exact.
  if(schoolId==='DGU2') total=total.toDecimalPlaces(3,Decimal.ROUND_HALF_UP);
  result.total=total.toString();
  result.status=schoolId==='DSU'?'provisional':'calculated';
  return result;
}
export const calculateAll = (scores: Scores) => schools.map(s=>calculate(s.id,scores));
export function difference(a: Result, b: Result): string | null {
  if(a.schoolId!==b.schoolId || a.ruleVersion!==b.ruleVersion || a.engineVersion!==b.engineVersion || a.total===null || b.total===null) return null;
  return D(a.total).minus(b.total).toString();
}
export function solveTarget(id:SchoolId, scores:Scores, field:PercentileKey, target:string): {value:number|null;reason:string} {
  if(!/^\d+(\.\d+)?$/.test(target) || D(target).gt(2000)) return {value:null,reason:'목표 총점을 확인해 주세요.'};
  if(getSchool(id)?.basis!=='percentile') return {value:null,reason:'이 학교는 표준점수·변환표 기준으로 별도 설계합니다.'};
  const baseline=calculate(id,{...scores,[field]:100});
  if(baseline.total===null) return {value:null,reason:`먼저 입력: ${baseline.missing.join(', ')}`};
  for(let n=0;n<=100;n++) {
    const r=calculate(id,{...scores,[field]:n});
    if(r.total!==null && D(r.total).gte(target)) return {value:n,reason:`다른 입력을 유지하면 ${labels[field]} 백분위 ${n} 이상이 필요합니다.`};
  }
  return {value:null,reason:'이 조건에서는 해당 과목만으로 목표에 도달할 수 없습니다.'};
}
export const formatScore=(value:string|null)=>value===null?'—':D(value).toFixed(Math.min(3,D(value).decimalPlaces()));
