import { NextRequest } from 'next/server';
import { currentUser, privateJson, sameOrigin } from '@/server/session';
import { dataRequest } from '@/server/data-client';
type Context={params:Promise<{id:string}>};
async function forward(request:NextRequest,context:Context) {
  if(request.method==='DELETE' && !sameOrigin(request)) return privateJson({error:'요청 출처를 확인해 주세요.'},403);
  const user=await currentUser(); if(!user) return privateJson({error:'로그인이 필요합니다.'},401);
  const {id}=await context.params;
  if(!/^[0-9a-f-]{36}$/i.test(id)) return privateJson({error:'잘못된 시나리오 주소입니다.'},400);
  try {const r=await dataRequest(user.id,request.method,`/v1/scenarios/${id}`);return privateJson(await r.json(),r.status);}
  catch {return privateJson({error:'요청을 처리하지 못했습니다. 다시 시도해 주세요.'},503);}
}
export const GET=forward;
export const DELETE=forward;
