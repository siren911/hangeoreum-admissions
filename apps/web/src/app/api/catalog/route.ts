import { schools, RULE_VERSION, ENGINE_VERSION, AS_OF } from '@j/core';
export function GET() {return Response.json({schools,ruleVersion:RULE_VERSION,engineVersion:ENGINE_VERSION,asOf:AS_OF},{headers:{'Cache-Control':'public, max-age=300'}});}
