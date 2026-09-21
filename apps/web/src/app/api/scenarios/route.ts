import { NextRequest } from 'next/server';
import { calculateAll, scenarioRequestSchema } from '@j/core';
import { currentUser, privateJson, requestJson, sameOrigin } from '@/server/session';
import { dataRequest } from '@/server/data-client';
export async function GET() {
  const user=await currentUser();if(!user) return privateJson({error:'로그인 후 불러올 수 있습니다.'},401);
  try {const r=await dataRequest(user.id,'GET','/v1/scenarios');return privateJson(await r.json(),r.status);}
  catch {return privateJson({error:'클라우드 목록을 불러오지 못했습니다. 다시 시도해 주세요.'},503);}
}
export async function POST(request:NextRequest) {
  if(!sameOrigin(request)) return privateJson({error:'요청 출처를 확인해 주세요.'},403);
  const user=await currentUser();if(!user) return privateJson({error:'로그인 후 저장할 수 있습니다.'},401);
  try {
    const p=scenarioRequestSchema.safeParse(await requestJson(request));
    if(!p.success) return privateJson({error:'이름·입력 점수·규칙 버전을 확인해 주세요.'},422);
    // Recompute here and again at the persistence boundary. Client totals are not accepted.
    const results=calculateAll(p.data.scores);
    if(results.some(r=>r.status==='invalid')) return privateJson({error:'입력한 점수를 확인해 주세요.'},422);
    const r=await dataRequest(user.id,'POST','/v1/scenarios',p.data);
    return privateJson(await r.json(),r.status);
  } catch {return privateJson({error:'저장하지 못했습니다. 입력은 유지됩니다. 연결을 확인한 뒤 다시 시도해 주세요.'},503);}
}
