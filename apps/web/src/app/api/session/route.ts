import { currentUser, privateJson, cloudAvailable, localLoginAllowed, githubLoginAvailable } from '@/server/session';
export async function GET() {return privateJson({user:await currentUser(),cloudAvailable:cloudAvailable(),localLoginAvailable:localLoginAllowed(),githubLoginAvailable:githubLoginAvailable()});}
