import { randomBytes } from 'node:crypto';
import { existsSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const web=fileURLToPath(new URL('../apps/web/.env.local',import.meta.url));
const worker=fileURLToPath(new URL('../apps/data-api/.dev.vars',import.meta.url));
if(existsSync(web)||existsSync(worker)) {
  console.log('기존 로컬 설정을 유지했습니다. 두 설정 파일의 SERVICE_SECRET이 같은지 확인하세요.');
} else {
  const service=randomBytes(48).toString('hex'),session=randomBytes(48).toString('hex');
  writeFileSync(web,`APP_ENV=local\nAPP_ORIGIN=http://127.0.0.1:3000\nDATA_API_URL=http://127.0.0.1:8787\nSERVICE_SECRET=${service}\nSESSION_SECRET=${session}\nENABLE_LOCAL_LOGIN=true\n`);
  writeFileSync(worker,`SERVICE_SECRET=${service}\n`);
  console.log('로컬 개발 설정을 생성했습니다. 비밀값은 Git에서 제외된 파일에만 저장했습니다.');
}
