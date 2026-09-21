import { randomBytes, createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { cookieOptions, githubLoginAvailable, origin, privateJson } from '@/server/session';
export async function GET(request:NextRequest) {
  if(!githubLoginAvailable()) return privateJson({error:'운영자 로그인이 아직 설정되지 않았습니다.'},503);
  const state=randomBytes(32).toString('base64url'), verifier=randomBytes(32).toString('base64url');
  const url=new URL('https://github.com/login/oauth/authorize');
  url.search=new URLSearchParams({client_id:process.env.GITHUB_CLIENT_ID!,redirect_uri:`${origin(request)}/api/auth/github/callback`,state,scope:'read:user',code_challenge:createHash('sha256').update(verifier).digest('base64url'),code_challenge_method:'S256',allow_signup:'false'}).toString();
  const response=NextResponse.redirect(url);
  response.cookies.set('oauth_state',state,{...cookieOptions,maxAge:600});
  response.cookies.set('oauth_verifier',verifier,{...cookieOptions,maxAge:600});
  return response;
}
