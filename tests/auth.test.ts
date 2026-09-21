import { it,expect } from 'vitest';
import { signService,verifyService,createSession,readSession } from '@j/core/auth';
const secret='test-only-key-'.repeat(5);
it('binds service identity to method, path, payload and environment',async()=>{
  const token=await signService(secret,'operator-a','POST','/v1/scenarios','{"a":1}','preview');
  expect(await verifyService(secret,token,'POST','/v1/scenarios','{"a":1}','preview')).toBe('operator-a');
  await expect(verifyService(secret,token,'DELETE','/v1/scenarios','{"a":1}','preview')).rejects.toThrow();
  await expect(verifyService(secret,token,'POST','/v1/scenarios/other','{"a":1}','preview')).rejects.toThrow();
  await expect(verifyService(secret,token,'POST','/v1/scenarios','{"a":2}','preview')).rejects.toThrow();
  await expect(verifyService(secret,token,'POST','/v1/scenarios','{"a":1}','production')).rejects.toThrow();
  await expect(verifyService(secret+'different',token,'POST','/v1/scenarios','{"a":1}','preview')).rejects.toThrow();
});
it('separates service and user session token audiences',async()=>{
  const token=await createSession(secret,'operator-a','테스트');
  expect(await readSession(secret,token)).toEqual({id:'operator-a',name:'테스트'});
  await expect(verifyService(secret,token,'GET','/v1/scenarios','','local')).rejects.toThrow();
  const service=await signService(secret,'operator-a','GET','/v1/scenarios','','local');
  await expect(readSession(secret,service)).rejects.toThrow();
});
