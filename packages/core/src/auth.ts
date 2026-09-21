import { SignJWT, jwtVerify } from 'jose';
const encoder = new TextEncoder();
const key = (secret: string) => {
  if(secret.length < 32) throw new Error('A secret of at least 32 characters is required');
  return encoder.encode(secret);
};
export async function digest(value: string) {
  const bytes=await crypto.subtle.digest('SHA-256',encoder.encode(value));
  return Array.from(new Uint8Array(bytes),v=>v.toString(16).padStart(2,'0')).join('');
}
export async function signService(secret:string, owner:string, method:string, path:string, body:string, environment:string) {
  return new SignJWT({method,path,bodyHash:await digest(body),environment})
    .setProtectedHeader({alg:'HS256'}).setSubject(owner).setIssuer('hangeoreum-web').setAudience('hangeoreum-data')
    .setIssuedAt().setExpirationTime('60s').setJti(crypto.randomUUID()).sign(key(secret));
}
export async function verifyService(secret:string, token:string, method:string, path:string, body:string, environment:string) {
  const {payload}=await jwtVerify(token,key(secret),{algorithms:['HS256'],issuer:'hangeoreum-web',audience:'hangeoreum-data',maxTokenAge:'60s'});
  if(!payload.sub || payload.sub.length>100 || payload.method!==method || payload.path!==path || payload.bodyHash!==await digest(body) || payload.environment!==environment) throw new Error('Request identity mismatch');
  return payload.sub;
}
export async function createSession(secret:string, id:string, name:string) {
  return new SignJWT({name:name.slice(0,80)}).setProtectedHeader({alg:'HS256'}).setSubject(id)
    .setIssuer('hangeoreum').setAudience('web-session').setIssuedAt().setExpirationTime('12h').sign(key(secret));
}
export async function readSession(secret:string, token:string) {
  const {payload}=await jwtVerify(token,key(secret),{algorithms:['HS256'],issuer:'hangeoreum',audience:'web-session',maxTokenAge:'12h'});
  if(!payload.sub || typeof payload.name!=='string') throw new Error('Invalid session');
  return {id:payload.sub,name:payload.name};
}
