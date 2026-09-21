import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { createSession, readSession } from '@j/core/auth';

export const SESSION_COOKIE='hangeoreum_session';
export const cookieOptions={httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax' as const,path:'/'};
export const appEnvironment=()=>process.env.VERCEL_ENV??process.env.APP_ENV??'local';
export const origin=(request:Request)=>new URL(process.env.APP_ORIGIN??request.url).origin;
export const sameOrigin=(request:Request)=>request.headers.get('origin')===origin(request);
export const localLoginAllowed=()=>process.env.NODE_ENV==='development' && appEnvironment()==='local' && process.env.ENABLE_LOCAL_LOGIN==='true';
export const githubLoginAvailable=()=>Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET && process.env.GITHUB_ALLOWED_IDS && process.env.SESSION_SECRET);
export const cloudAvailable=()=>Boolean(process.env.DATA_API_URL && process.env.SERVICE_SECRET && process.env.SESSION_SECRET);
export async function currentUser() {
  try {
    const token=(await cookies()).get(SESSION_COOKIE)?.value;
    if(!token || !process.env.SESSION_SECRET) return null;
    return await readSession(process.env.SESSION_SECRET,token);
  } catch {return null;}
}
export async function attachSession(response:NextResponse,id:string,name:string) {
  const token=await createSession(process.env.SESSION_SECRET??'',id,name);
  response.cookies.set(SESSION_COOKIE,token,{...cookieOptions,maxAge:43200});
  return response;
}
export const privateJson=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function requestJson(request:NextRequest) {
  if(Number(request.headers.get('content-length')??0)>32768) throw new Error('입력 크기가 너무 큽니다.');
  const text=await request.text();
  if(new TextEncoder().encode(text).length>32768) throw new Error('입력 크기가 너무 큽니다.');
  return JSON.parse(text) as unknown;
}
