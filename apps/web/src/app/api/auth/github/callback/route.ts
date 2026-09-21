import { NextRequest, NextResponse } from 'next/server';
import { attachSession, cookieOptions, origin, githubLoginAvailable } from '@/server/session';
export async function GET(request:NextRequest) {
  const clear=(res:NextResponse)=>{res.cookies.set('oauth_state','',{...cookieOptions,maxAge:0});res.cookies.set('oauth_verifier','',{...cookieOptions,maxAge:0});return res;};
  const fail=()=>clear(NextResponse.redirect(new URL('/?login=failed',origin(request))));
  const state=request.nextUrl.searchParams.get('state'),code=request.nextUrl.searchParams.get('code'),verifier=request.cookies.get('oauth_verifier')?.value;
  if(!githubLoginAvailable() || !code || !state || state!==request.cookies.get('oauth_state')?.value || !verifier) return fail();
  try {
    const tokenResponse=await fetch('https://github.com/login/oauth/access_token',{method:'POST',headers:{Accept:'application/json','Content-Type':'application/json'},body:JSON.stringify({client_id:process.env.GITHUB_CLIENT_ID,client_secret:process.env.GITHUB_CLIENT_SECRET,code,code_verifier:verifier,redirect_uri:`${origin(request)}/api/auth/github/callback`}),signal:AbortSignal.timeout(10000)});
    const token=await tokenResponse.json(); if(!tokenResponse.ok || typeof token.access_token!=='string') return fail();
    const userResponse=await fetch('https://api.github.com/user',{headers:{Authorization:`Bearer ${token.access_token}`,Accept:'application/vnd.github+json','User-Agent':'hangeoreum-admissions'},signal:AbortSignal.timeout(10000),cache:'no-store'});
    const user=await userResponse.json();
    const allowed=(process.env.GITHUB_ALLOWED_IDS??'').split(',').map(x=>x.trim());
    if(!userResponse.ok || typeof user.id!=='number' || !allowed.includes(String(user.id))) return fail();
    return clear(await attachSession(NextResponse.redirect(new URL('/',origin(request))),`github:${user.id}`,String(user.name??user.login??'운영자')));
  } catch {return fail();}
}
