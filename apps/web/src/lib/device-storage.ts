import { scoreSchema, calculateAll, ENGINE_VERSION, RULE_VERSION, type SavedScenario } from '@j/core';
const KEY='hangeoreum.scenarios.v1';
export function readDevice():SavedScenario[] {
  const raw=localStorage.getItem(KEY); if(!raw) return [];
  const rows:unknown=JSON.parse(raw); if(!Array.isArray(rows) || rows.length>100) throw new Error('저장 목록의 형식을 확인할 수 없습니다.');
  return rows.map(value=>{
    if(!value || typeof value!=='object') throw new Error('저장 목록의 형식을 확인할 수 없습니다.');
    const r=value as SavedScenario;
    if(typeof r.id!=='string' || typeof r.name!=='string' || r.name.length>60 || !Number.isFinite(Date.parse(r.createdAt)) || !scoreSchema.safeParse(r.scores).success || !Array.isArray(r.results)) throw new Error('저장 목록의 형식을 확인할 수 없습니다.');
    // Current rules are recomputed so editing localStorage cannot invent a trusted current total.
    return {...r,location:'device' as const,results:r.ruleVersion===RULE_VERSION && r.engineVersion===ENGINE_VERSION?calculateAll(r.scores):[]};
  });
}
export function saveDevice(record:SavedScenario) {
  const records=readDevice(); if(records.length>=50) throw new Error('기기 저장은 50개까지입니다. 사용하지 않는 시나리오를 정리해 주세요.');
  localStorage.setItem(KEY,JSON.stringify([record,...records]));
}
export function removeDevice(id:string) {localStorage.setItem(KEY,JSON.stringify(readDevice().filter(r=>r.id!==id)));}
