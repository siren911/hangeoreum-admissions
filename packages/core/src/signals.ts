import Decimal from 'decimal.js';
import { ENGINE_VERSION, RULE_VERSION, type Result, type SchoolId } from './types';

// A manually proposed study-planning scenario, separate from the official scoring engine.
// These thresholds have not been calibrated as admissions probabilities.
export const SIGNAL_VERSION = '2027-J-PLAN-20260918-v1';
export const SIGNAL_AS_OF = '2026-09-18';
export type SignalLevel = 'red' | 'yellow' | 'green' | 'gray';
export const signalLabels: Record<SignalLevel, string> = {
  red: '위험', yellow: '중간', green: '안정 목표', gray: '판정 보류',
};
export type SignalRule = {
  yellowAt: string; greenAt: string; unit: string;
  outlook: string; outlookUnit: string; reference: string;
  assumption: string; buffer: string; limitation: string;
};
export const signalRules: Partial<Record<SchoolId, SignalRule>> = {
  GCU: {
    yellowAt: '98', greenAt: '98.5', unit: '/100 지표',
    outlook: '97.0–98.0', outlookUnit: '/100 지표', reference: '2026 최종등록자 70% 지표 97.5',
    assumption: '97.5에 ±0.5를 가정한 계획 범위입니다. 상단 98.0을 중간 기준으로 잡았습니다.',
    buffer: '상단 98.0 + 여유 0.5 = 98.5',
    limitation: '한 해의 결과에 둔 수동 가정입니다. 70% 지표는 마지막 합격자의 점수가 아닙니다.',
  },
  DJU: {
    yellowAt: '990', greenAt: '995', unit: '점',
    outlook: '981–990', outlookUnit: '점', reference: '2024·2025·2026 80% 환산점수 989.3 / 981.5 / 985.3',
    assumption: '과거 3년 최저·최고를 바깥 정수로 확장했습니다. 상단 990을 중간 기준으로 잡았습니다.',
    buffer: '상단 990 + 여유 5 = 995',
    limitation: '연도별 산식·등록자 집단 차이가 남아 있습니다. 올해 산식의 총점 상한은 1,000점입니다.',
  },
  DSU: {
    yellowAt: '1000', greenAt: '1005', unit: '점',
    outlook: '990–1,000', outlookUnit: '점', reference: '2026 등록자 환산 70% 995.00',
    assumption: '995에 ±5를 가정했습니다. 상단 1,000을 중간 기준으로 잡았습니다.',
    buffer: '상단 1,000 + 여유 5 = 1,005',
    limitation: '최종 표시 자리 처리 전 원값으로 비교합니다. 미적 가산으로 1,000점을 넘을 수 있습니다.',
  },
  DGU2: {
    yellowAt: '996.5', greenAt: '1000', unit: '점',
    outlook: '976.5–996.5', outlookUnit: '점', reference: '2026 최종등록자 환산 80% 986.5',
    assumption: '986.5에 ±10을 가정했습니다. 상단 996.5를 중간 기준으로 잡았습니다.',
    buffer: '상단 996.5 + 여유 3.5 = 1,000',
    limitation: '2027 기본 2명 모집으로 변동성이 큽니다. 초록이어도 안정 지원을 뜻하지 않습니다.',
  },
  SJUB: {
    yellowAt: '986', greenAt: '991', unit: '점',
    outlook: '97.0–98.3', outlookUnit: '대학 산출 수능백분위', reference: '2025·2026 최종등록자 70% 수능백분위 97.1 / 97.8',
    assumption: '과거 최저를 내린 97.0부터 최근 97.8+0.5까지를 가정했습니다. 이 지표를 올해 총점으로 직접 비교하지 않습니다. 학습 목표에 한해 상단 98.3×10 + 한국사 1등급 3점 − 검정고시 감점 0 = 986점으로 옮겼습니다.',
    buffer: '학습용 총점 기준 986 + 여유 5 = 991',
    limitation: '지표를 옮기는 가정이 포함된 목표입니다. 과거 합격자의 총점을 재산출한 값이 아닙니다. 입력의 한국사·검정고시 감점은 실제 산식에 반영되어 신호등도 달라집니다.',
  },
};
export const signalHolds: Partial<Record<SchoolId, string>> = {
  WSU: '공개된 404.26점은 2026 최종등록자 평균입니다. 평균만으로 컷을 만들 수 없어 신호등을 보류합니다.',
  SMU: '공개된 99.30은 2026 전체 합격자 70%의 100점 지표입니다. 최종등록자 총점과 직접 비교하지 않습니다.',
  KHU: '2027 탐구 변환표가 필요합니다. 과거 평균백분위 98.05를 올해 600점 총점으로 바꾸지 않습니다.',
  DEU: '2027 탐구 변환표가 필요하고, 공개 540.56점은 평균입니다. 합격 컷으로 사용하지 않습니다.',
  WKU: '인문 소수 모집으로 과거 성적이 비공개입니다. 표준점수를 넣어 환산해도 신호등은 보류합니다.',
  PNU: '2027 변환표와 비교 가능한 과거 컷 자료를 확보한 뒤 판단합니다.',
};
export type Signal = {
  level: SignalLevel; label: string; reason: string;
  toYellow: string | null; toGreen: string | null;
  rule: SignalRule | null; version: string;
};
export function evaluateSignal(result: Result): Signal {
  const rule = signalRules[result.schoolId] ?? null;
  const hold = (reason: string): Signal => ({ level: 'gray', label: signalLabels.gray, reason, toYellow: null, toGreen: null, rule, version: SIGNAL_VERSION });
  if (result.ruleVersion !== RULE_VERSION || result.engineVersion !== ENGINE_VERSION) return hold('이전 산식의 점수입니다. 현재 산식으로 다시 계산해 주세요.');
  if (result.status === 'invalid') return hold('입력 범위를 확인해 주세요. 잘못된 점수로 신호등을 정하지 않습니다.');
  if (!rule) return hold(signalHolds[result.schoolId] ?? '비교할 자료가 필요합니다.');
  if (result.total === null || !['calculated', 'provisional'].includes(result.status)) return hold('신호등에 필요한 성적을 모두 입력해 주세요.');
  if (!/^\d+(\.\d+)?$/.test(result.total)) return hold('유효한 환산점수가 필요합니다.');
  const score = new Decimal(result.total);
  const level: SignalLevel = score.gte(rule.greenAt) ? 'green' : score.gte(rule.yellowAt) ? 'yellow' : 'red';
  const reason = level === 'green' ? '제안한 여유 목표에 도달했습니다. 합격 보장은 아닙니다.' : level === 'yellow' ? '계획 기준선 상단에 도달했습니다. 여유 점수를 더 확보하세요.' : '계획 기준선 상단보다 낮습니다. 점수 보완이 필요합니다.';
  return { level, label: signalLabels[level], reason, rule, version: SIGNAL_VERSION,
    toYellow: Decimal.max(0, new Decimal(rule.yellowAt).minus(score)).toString(),
    toGreen: Decimal.max(0, new Decimal(rule.greenAt).minus(score)).toString() };
}
