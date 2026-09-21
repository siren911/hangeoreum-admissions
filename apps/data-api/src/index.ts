import { calculateAll, scenarioRequestSchema, schools, RULE_VERSION, ENGINE_VERSION, type SavedScenario } from '@j/core';
import { digest, verifyService } from '@j/core/auth';

export interface Env {DB:D1Database; SERVICE_SECRET:string; APP_ENV:string}
type Row = {id:string; owner_id:string; name:string; origin:SavedScenario['origin']; parent_id:string|null; rule_version:string; engine_version:string; scores_json:string; results_json:string; content_hash:string; created_at:string; deleted_at:string|null};
const reply = (data:unknown,status=200) => Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const serialize=(r:Row):SavedScenario=>({id:r.id,name:r.name,scores:JSON.parse(r.scores_json),results:JSON.parse(r.results_json),createdAt:r.created_at,ruleVersion:r.rule_version,engineVersion:r.engine_version,origin:r.origin,parentId:r.parent_id,location:'cloud'});

export default {
  async fetch(request:Request,env:Env):Promise<Response> {
    const url=new URL(request.url);
    if(url.pathname==='/health' && request.method==='GET') return reply({ok:true,service:'hangeoreum-data'});
    if(Number(request.headers.get('content-length')??0)>32768) return reply({error:'입력 크기가 너무 큽니다.'},413);
    let body='';
    if(!['GET','HEAD'].includes(request.method)) body=await request.text();
    if(new TextEncoder().encode(body).length>32768) return reply({error:'입력 크기가 너무 큽니다.'},413);
    let owner:string;
    try {owner=await verifyService(env.SERVICE_SECRET,request.headers.get('authorization')?.replace(/^Bearer /,'')??'',request.method,url.pathname+url.search,body,env.APP_ENV);}
    catch {return reply({error:'인증이 필요합니다.'},401);}
    try {
      if(url.pathname==='/v1/scenarios' && request.method==='GET') {
        const result=await env.DB.prepare('SELECT * FROM scenarios WHERE owner_id = ? AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 50').bind(owner).all<Row>();
        return reply({scenarios:result.results.map(serialize)});
      }
      if(url.pathname==='/v1/scenarios' && request.method==='POST') {
        let json:unknown; try {json=JSON.parse(body);} catch {return reply({error:'올바른 JSON이 필요합니다.'},400);}
        const parsed=scenarioRequestSchema.safeParse(json);
        if(!parsed.success) return reply({error:'이름·점수·규칙 버전을 확인해 주세요.'},422);
        const p=parsed.data;
        if(p.parentId) {
          const parent=await env.DB.prepare('SELECT id FROM scenarios WHERE id = ? AND owner_id = ? AND deleted_at IS NULL').bind(p.parentId,owner).first();
          if(!parent) return reply({error:'원본 시나리오를 찾을 수 없습니다.'},404);
        }
        const hash=await digest(JSON.stringify({name:p.name,scores:p.scores,origin:p.origin,parentId:p.parentId,ruleVersion:p.ruleVersion}));
        const id=crypto.randomUUID(), now=new Date().toISOString();
        const results=calculateAll(p.scores);
        await env.DB.batch([
          env.DB.prepare('INSERT OR IGNORE INTO rule_packs (rule_version, engine_version, catalog_json, created_at) VALUES (?, ?, ?, ?)').bind(RULE_VERSION,ENGINE_VERSION,JSON.stringify(schools),now),
          env.DB.prepare('INSERT INTO scenarios (id, owner_id, name, origin, parent_id, rule_version, engine_version, scores_json, results_json, content_hash, idempotency_key, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(owner_id, idempotency_key) DO NOTHING')
            .bind(id,owner,p.name,p.origin,p.parentId,RULE_VERSION,ENGINE_VERSION,JSON.stringify(p.scores),JSON.stringify(results),hash,p.idempotencyKey,now),
        ]);
        const row=await env.DB.prepare('SELECT * FROM scenarios WHERE owner_id = ? AND idempotency_key = ?').bind(owner,p.idempotencyKey).first<Row>();
        if(!row || row.content_hash!==hash || row.deleted_at) return reply({error:'저장 요청이 충돌했습니다. 새로운 시나리오로 저장해 주세요.'},409);
        return reply({scenario:serialize(row)},row.id===id?201:200);
      }
      const match=url.pathname.match(/^\/v1\/scenarios\/([0-9a-f-]{36})$/i);
      if(match && ['GET','DELETE'].includes(request.method)) {
        const row=await env.DB.prepare('SELECT * FROM scenarios WHERE id = ? AND owner_id = ? AND deleted_at IS NULL').bind(match[1],owner).first<Row>();
        if(!row) return reply({error:'시나리오를 찾을 수 없습니다.'},404);
        if(request.method==='GET') return reply({scenario:serialize(row)});
        await env.DB.prepare('UPDATE scenarios SET deleted_at = ? WHERE id = ? AND owner_id = ?').bind(new Date().toISOString(),match[1],owner).run();
        return reply({ok:true});
      }
      return reply({error:'지원하지 않는 요청입니다.'},404);
    } catch {
      return reply({error:'저장소에 연결하지 못했습니다. 입력을 유지한 채 다시 시도해 주세요.'},503);
    }
  },
};
