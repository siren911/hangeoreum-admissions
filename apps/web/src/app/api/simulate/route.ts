import { NextRequest } from 'next/server';
import { calculateAll, scoreSchema } from '@j/core';
import { privateJson, requestJson, sameOrigin } from '@/server/session';
export async function POST(request:NextRequest) {
  if(!sameOrigin(request)) return privateJson({error:'요청 출처를 확인해 주세요.'},403);
  try {const parsed=scoreSchema.safeParse(await requestJson(request));if(!parsed.success) return privateJson({error:'입력한 점수를 확인해 주세요.'},422);return privateJson({results:calculateAll(parsed.data)});}
  catch {return privateJson({error:'입력 형식을 확인해 주세요.'},400);}
}
