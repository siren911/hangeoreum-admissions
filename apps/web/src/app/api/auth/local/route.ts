import { NextRequest } from 'next/server';
import { attachSession, privateJson, localLoginAllowed, sameOrigin } from '@/server/session';
export async function POST(request:NextRequest) {
  if(!localLoginAllowed() || !['127.0.0.1','localhost','[::1]'].includes(new URL(request.url).hostname)) return privateJson({error:'개발 환경에서만 사용할 수 있습니다.'},403);
  if(!sameOrigin(request)) return privateJson({error:'요청 출처를 확인해 주세요.'},403);
  return attachSession(privateJson({ok:true}),'local:operator','로컬 개발');
}
