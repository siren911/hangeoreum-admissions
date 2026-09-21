import { describe,it,expect } from 'vitest';
import { calculate, calculateAll, commonTarget, emptyScores, makeTarget, schools, difference, solveTarget, scoreSchema, scenarioRequestSchema, RULE_VERSION, planningSamples, recommendations, seats } from '@j/core';
import type { SchoolId } from '@j/core';

describe('2027 J independent target fixtures',()=>{
  const examples:[SchoolId,string,string][]=[['GCU','98.3','97.7'],['DJU','992','972'],['DSU','1000.25','980.25'],['WSU','408.9','404.9'],['SMU','999.9','989.9'],['DGU2','993.5','982.5'],['SJUB','991','971']];
  it.each(examples)('%s matches the independently calculated school target',(id,e1,e2)=>{
    const input=schools.find(s=>s.id===id)!.target;
    expect(calculate(id,input).total).toBe(e1);
    expect(calculate(id,{...input,english:2}).total).toBe(e2);
  });
  it('uses Dongshin’s published worked example',()=>{
    expect(calculate('DSU',makeTarget(70,90,80,70,2,2)).total).toBe('841.25');
    expect(calculate('DSU',commonTarget).status).toBe('provisional');
  });
  it('preserves a zero rather than treating it as missing',()=>{
    expect(calculate('GCU',makeTarget(0,0,0,0)).total).toBe('19.6');
    expect(calculate('GCU',{...commonTarget,korean:null}).total).toBeNull();
  });
  it('does not fill missing inquiry with zero, including the max-one school',()=>{
    for(const id of ['GCU','DJU','DSU','WSU','SMU','DGU2','SJUB'] as SchoolId[])expect(calculate(id,{...commonTarget,korea:null}).status).toBe('missing_input');
  });
  it('changes only the reflected inquiry value',()=>{
    const a=makeTarget(98,98,99,95),b={...a,korea:96};
    expect(difference(calculate('DSU',b),calculate('DSU',a))).toBe('0');
    expect(difference(calculate('DJU',b),calculate('DJU',a))).toBe('1.25');
    expect(difference(calculate('DSU',{...a,korea:100}),calculate('DSU',a))).toBe('2');
  });
  it('uses the Daejeon lower English grades from PDF32, not a linear 10-point step',()=>{
    const expected=[992,972,952,932,912,882,852,822,792];
    expected.forEach((total,i)=>expect(calculate('DJU',makeTarget(98,98,98,98,i+1,4)).total).toBe(String(total)));
  });
  it('applies university-specific caps',()=>{
    const s=makeTarget(100,100,100,100);
    expect(calculate('DJU',s).total).toBe('1000');
    expect(calculate('DSU',s).total).toBe('1012.5');
    expect(calculate('SMU',s).total).toBe('1015');
    expect(calculate('DGU2',s).total).toBe('1006');
    expect(calculate('SJUB',s).total).toBe('1003');
  });
  it('rounds Semyung only at the end using decimal arithmetic',()=>{
    const r=calculate('SMU',makeTarget(97,97,97,97));
    expect(r.rawTotal).toBe('987.55');expect(r.total).toBe('987.6');
  });
  it('does not multiply Woosuk’s weighted math score by 1.1',()=>{
    expect(calculate('WSU',makeTarget(97,97,97,97)).total).toBe('405.1');
  });
  it('handles all Korean history thresholds',()=>{
    const dju=[5,5,5,5,4,3,2,1,0],wsu=[5,5,5,5,5,4,3,2,1],dgu=[10,10,10,9,9,9,9,9,9];
    for(const [id,expected] of [['DJU',dju],['WSU',wsu],['DGU2',dgu]] as [SchoolId,number[]][]){
      expected.forEach((bonus,i)=>expect(calculate(id,{...commonTarget,history:i+1}).steps.find(x=>x.label==='한국사 가산')?.value).toBe(String(bonus)));
    }
  });
  it('uses the GED band and never substitutes high-school absence days',()=>{
    for(const penalty of [0,5,10,15] as const) {
      expect(calculate('SJUB',{...commonTarget,gedPenalty:penalty}).total).toBe(String(991-penalty));
    }
    expect(calculate('SJUB',{...commonTarget,gedPenalty:0,absenceDays:99}).total).toBe('991');
    expect(calculate('SJUB',{...commonTarget,gedPenalty:null}).status).toBe('missing_input');
    expect(scoreSchema.safeParse({...commonTarget,gedPenalty:1}).success).toBe(false);
  });
  it('keeps samples hypothetical and reproduces the competition buffer',()=>{
    const base=planningSamples.find(x=>x.id==='base')!,buffer=planningSamples.find(x=>x.id==='buffer')!,e2=planningSamples.find(x=>x.id==='english2')!;
    expect(calculate('DJU',base.scores).total).toBe('994.8');
    expect(calculate('DJU',buffer.scores).total).toBe('1000');
    expect(calculate('GCU',buffer.scores).total).toBe('98.8');
    expect(difference(calculate('DJU',e2.scores),calculate('DJU',base.scores))).toBe('-20');
    expect(planningSamples.every(x=>x.scores.gedPenalty===0)).toBe(true);
  });
  it('distinguishes reviewed tracks from the full general-admission count',()=>{
    expect(recommendations.map(x=>x.rank)).toEqual([1,2,3,4,5,6,7,8,9,10,11]);
    expect(new Set(recommendations.map(x=>x.id)).size).toBe(11);
    expect(seats.KHU).toMatchObject({generalTotal:52,focus:13});
    expect(seats.DJU).toMatchObject({generalTotal:7,focus:7});
    expect(seats.SJUB).toMatchObject({generalTotal:24,focus:9});
  });
  it('requires standard scores rather than fabricating them',()=>{
    for(const id of ['KHU','DEU','PNU'] as SchoolId[])expect(calculate(id,commonTarget).status).toBe('waiting_table');
    expect(calculate('WKU',commonTarget).status).toBe('missing_input');
    const s={...commonTarget,koreanStandard:140,mathStandard:140,worldStandard:65,koreaStandard:65};
    expect(calculate('WKU',s).total).toBe('576');
  });
  it('reverse solves and reports impossible goals',()=>{
    expect(solveTarget('DJU',makeTarget(98,90,98,98,1,4),'math','990').value).toBe(98);
    expect(solveTarget('SJUB',commonTarget,'math','990').value).toBe(99);
    expect(solveTarget('SJUB',{...commonTarget,english:2},'math','990').value).toBeNull();
    expect(solveTarget('GCU',emptyScores(),'math','98').value).toBeNull();
  });
  it('never compares different universities or rules',()=>{
    const a=calculate('DJU',commonTarget),b=calculate('SMU',commonTarget);
    expect(difference(a,b)).toBeNull();expect(difference(a,{...a,ruleVersion:'old'})).toBeNull();
  });
  it('validates inputs without coercing blanks, fractions, or excess scores',()=>{
    for(const value of [101,-1,98.1,NaN,Infinity,'98',''])expect(scoreSchema.safeParse({...commonTarget,korean:value}).success).toBe(false);
    expect(scoreSchema.safeParse(emptyScores()).success).toBe(true);
    expect(calculateAll({...commonTarget,english:10}).every(r=>r.status==='invalid')).toBe(true);
  });
  it('rejects a client-provided total or owner',()=>{
    const request={name:'test',scores:commonTarget,ruleVersion:RULE_VERSION,origin:'manual',idempotencyKey:crypto.randomUUID()};
    expect(scenarioRequestSchema.safeParse(request).success).toBe(true);
    expect(scenarioRequestSchema.safeParse({...request,total:'9999'}).success).toBe(false);
    expect(scenarioRequestSchema.safeParse({...request,ownerId:'someone-else'}).success).toBe(false);
  });
});
