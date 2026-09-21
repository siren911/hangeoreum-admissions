import { NextRequest } from 'next/server';
import { privateJson, sameOrigin, SESSION_COOKIE, cookieOptions } from '@/server/session';
export async function POST(request:NextRequest) {
  if(!sameOrigin(request)) return privateJson({error:'요청 출처를 확인해 주세요.'},403);
  const res=privateJson({ok:true}); res.cookies.set(SESSION_COOKIE,'',{...cookieOptions,maxAge:0}); return res;
}
