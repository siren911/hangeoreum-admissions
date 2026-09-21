import { signService } from '@j/core/auth';
import { appEnvironment } from './session';
export async function dataRequest(owner:string,method:string,path:string,payload?:unknown) {
  if(!process.env.DATA_API_URL || !process.env.SERVICE_SECRET) throw new Error('클라우드 저장소가 아직 연결되지 않았습니다. 기기에 저장할 수 있습니다.');
  const url=new URL(path,process.env.DATA_API_URL);
  if(appEnvironment()!=='local' && url.protocol!=='https:') throw new Error('저장소 연결 설정을 확인해 주세요.');
  const body=payload===undefined?'':JSON.stringify(payload);
  const token=await signService(process.env.SERVICE_SECRET,owner,method,url.pathname+url.search,body,appEnvironment());
  return fetch(url,{method,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:['GET','HEAD'].includes(method)?undefined:body,cache:'no-store',signal:AbortSignal.timeout(12000)});
}
