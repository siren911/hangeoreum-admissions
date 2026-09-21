import { readFileSync } from 'node:fs';
import { describe,it,expect } from 'vitest';
import { commonTarget, RULE_VERSION } from '@j/core';
import { signService } from '@j/core/auth';

// Runs only against the local Worker and its disposable test-owner rows.
describe.runIf(process.env.RUN_STORAGE_INTEGRATION==='1')('local Worker + D1 storage',()=>{
  const address='http://127.0.0.1:8787';
  const owner=`test:${crypto.randomUUID()}`, other=`test:${crypto.randomUUID()}`;
  let savedId='';
  const payload={name:'integration fixture',scores:commonTarget,ruleVersion:RULE_VERSION,origin:'manual',idempotencyKey:crypto.randomUUID()};
  async function request(who:string,method:string,path:string,value?:unknown,environment='local') {
    const secret=readFileSync('apps/data-api/.dev.vars','utf8').match(/^SERVICE_SECRET=(.+)$/m)?.[1].trim()??'';
    const body=value===undefined?'':JSON.stringify(value);
    const token=await signService(secret,who,method,path,body,environment);
    const response=await fetch(address+path,{method,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:method==='GET'?undefined:body});
    return {status:response.status,body:await response.json()};
  }
  it('requires authenticated requests and rejects a mismatched environment',async()=>{
    expect((await fetch(address+'/v1/scenarios')).status).toBe(401);
    expect((await request(owner,'GET','/v1/scenarios',undefined,'production')).status).toBe(401);
  });
  it('saves server-calculated input and results in D1',async()=>{
    const r=await request(owner,'POST','/v1/scenarios',payload);
    expect(r.status).toBe(201);savedId=r.body.scenario.id;
    expect(r.body.scenario.results.find((x:{schoolId:string})=>x.schoolId==='DJU').total).toBe('994.8');
    expect(r.body.scenario.scores).toEqual(commonTarget);
    const reload=await request(owner,'GET',`/v1/scenarios/${savedId}`);
    expect(reload.body.scenario).toEqual(r.body.scenario);
  });
  it('deduplicates retries and detects conflicting content',async()=>{
    const retry=await request(owner,'POST','/v1/scenarios',payload);
    expect(retry.status).toBe(200);expect(retry.body.scenario.id).toBe(savedId);
    expect((await request(owner,'POST','/v1/scenarios',{...payload,name:'changed'})).status).toBe(409);
    expect((await request(owner,'GET','/v1/scenarios')).body.scenarios).toHaveLength(1);
  });
  it('isolates reads, parents and deletion by owner',async()=>{
    expect((await request(other,'GET',`/v1/scenarios/${savedId}`)).status).toBe(404);
    expect((await request(other,'DELETE',`/v1/scenarios/${savedId}`)).status).toBe(404);
    expect((await request(other,'POST','/v1/scenarios',{...payload,parentId:savedId,idempotencyKey:crypto.randomUUID()})).status).toBe(404);
    expect((await request(other,'GET','/v1/scenarios')).body.scenarios).toHaveLength(0);
  });
  it('rejects injected totals and removes only the test record from active lists',async()=>{
    expect((await request(owner,'POST','/v1/scenarios',{...payload,total:'9999'})).status).toBe(422);
    expect((await request(owner,'DELETE',`/v1/scenarios/${savedId}`)).status).toBe(200);
    expect((await request(owner,'GET',`/v1/scenarios/${savedId}`)).status).toBe(404);
    expect((await request(owner,'GET','/v1/scenarios')).body.scenarios).toHaveLength(0);
  });
});
