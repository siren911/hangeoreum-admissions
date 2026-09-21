import Decimal from 'decimal.js';
import { generalHistoricalResults, type GeneralHistoricalResult } from './general-results';
import { schools } from './catalog';
import type { Scores } from './types';

export type GeneralTrack = 'humanities' | 'science';
type Metric = 'khu-social' | 'khu-natural' | 'ssu' | 'gcu';
export type GeneralOption = {
  id: string; university: string; program: string; track: GeneralTrack; location: '서울' | '경기';
  gun: '가' | '나' | '다' | null; seats: number | null; benefit: string; caution: string;
  source: string; sourcePage: string; historicalSource?: string; historicalPage?: string;
  historicalResult?: GeneralHistoricalResult;
  metric?: Metric; cut70?: number; comparisonNote?: string; formulaNote?: string; eligibility: 'allowed' | 'bonus-gap';
};
export const OPTIONS_AS_OF = '2026-09-19';
const khu = schools.find(s => s.id === 'KHU')!;
const gcu = schools.find(s => s.id === 'GCU')!;
const ssuSource = 'https://admission.ssu.ac.kr/upload/SSU(1)_26090185116.pdf';
const ssuHistory = 'https://iphak.ssu.ac.kr/upload/SSU(1)_26051116627.pdf';
const khuBase = { university: '경희대학교', source: khu.source, sourcePage: 'PDF 16~17·43~44쪽', historicalSource: khu.historicalSource, gun: '가' as const };
const ssuBase = { university: '숭실대학교', location: '서울' as const, source: ssuSource, sourcePage: 'PDF 16~18쪽', historicalSource: ssuHistory, metric: 'ssu' as const };
const gcuBase = { university: '가천대학교', location: '경기' as const, source: gcu.source, sourcePage: 'PDF 12~13·34쪽', historicalSource: 'https://admission.gachon.ac.kr/upload/BBS0011/20260831142251435LPT.XLS', historicalPage: '2026 정시 입시결과 · 일반', gun: '가' as const, metric: 'gcu' as const, eligibility: 'allowed' as const, benefit: '국어·수학 중 높은 영역에 40%, 낮은 영역에 30%. 영어와 높은 지리 1과목은 우수한 순서로 20%·10%를 반영합니다.', caution: '2027 일반1은 반영비율이 바뀌었습니다. 작년 컷에는 2026 방식으로 계산한 값을 비교하고, 올해 방식 점수는 별도 표시합니다. 일반2는 제외합니다.' };

const yonseiBase = { university: '연세대학교', location: '서울' as const, gun: '가' as const, source: 'https://admission.yonsei.ac.kr/seoul/upload/guide/20260901184445WSGU8N.PDF', sourcePage: 'PDF 12·23~24·46~47쪽', comparisonNote: '국어·수학 표준점수, 올해 탐구 변환점수와 검정고시 비교내신이 필요합니다. 2026 공식 공개 성적은 아래에서 참고 비교하고, 올해 대학 환산총점은 별도로 확인합니다.' };
const koreaBase = { university: '고려대학교', location: '서울' as const, gun: '가' as const, source: 'https://oku.korea.ac.kr/attach/202608/1788141609392_0.pdf', sourcePage: 'PDF 3~5·11~12·17~18쪽', comparisonNote: '국어·수학 표준점수와 올해 탐구 변환점수가 필요합니다. 2026 공식 공개 성적과의 참고 비교를 제공하며, 올해 대학 환산총점은 별도로 확인합니다.' };
const sogangBase = { university: '서강대학교', location: '서울' as const, source: 'https://admission3.sogang.ac.kr/upload/GUIDES/20260901173417S24UKF.pdf', sourcePage: 'PDF 5~8·11·34~35쪽', eligibility: 'allowed' as const, comparisonNote: '국어·수학 표준점수와 올해 탐구 변환표로 A/B형을 모두 계산해야 합니다. 2026 공식 공개 성적과의 참고 비교를 제공하며, 올해 대학 환산총점은 별도로 확인합니다.', formulaNote: 'A = 국어 표준점수×1.1 + 수학 표준점수×1.3 + 탐구 변환점수 합×0.6 + 영어·한국사 가산점. B는 국어×1.3, 수학×1.1로 바꾸고 높은 총점을 반영합니다. 영어 1/2등급은 100/99.5점, 한국사 1~4등급은 10점입니다.' };

const konkukBase = { university: '건국대학교', location: '서울' as const, source: 'https://admission.konkuk.ac.kr/bbs/admission/6282/1224860/download.do', sourcePage: 'PDF 12~13·15·22쪽 (책자 23~24·28·42~43쪽)', eligibility: 'allowed' as const, comparisonNote: '국어·수학 표준점수와 올해 탐구 변환표가 필요합니다. 2026 공식 공개 성적과의 참고 비교를 제공하며, 올해 대학 환산총점은 별도로 확인합니다.', formulaNote: '수리중심(B): 국어 30% + 수학 40% + 탐구 20% + 영어 10%. 국수 표준점수·탐구 변환표준점수·영어 환산점수를 사용해 요강 산식으로 환산하며 한국사 감점을 적용합니다. 백분위 가중평균과는 다릅니다.' };

/** Curated, verified examples only. No regional quotas, medical or military-contract tracks. */
const curatedOptions: GeneralOption[] = [
  { ...yonseiBase, id: 'yonsei-business', program: '경영학과 · 일반전형', track: 'humanities', seats: 113, eligibility: 'allowed', benefit: '인문 유형Ⅰ. 두 사탐 과목의 변환점수에 각각 3% 가산을 받을 수 있습니다.', caution: '수능 950점 + 학생부 50점. 검정고시생은 수능에 따른 비교내신을 적용하며, GED 평균 95점 이상만으로 50점 만점이 되지 않습니다.', formulaNote: '국어 표준점수×1.5 + 수학 표준점수 + 영어 등급점수 + 탐구 변환점수 합(사탐 과목별 3% 가산)을 950/800배 반영합니다. 한국사 감점과 학생부 비교내신을 함께 적용합니다.' },
  { ...yonseiBase, id: 'yonsei-economics', program: '경제학부 · 일반전형', track: 'humanities', seats: 41, eligibility: 'allowed', benefit: '2027 상경대학은 통합 유형Ⅲ로 변경. 사탐·과탐 가산 없이 국어와 수학을 같은 배점으로 반영합니다.', caution: '같은 연세대라도 경영학과의 사탐 3% 가산을 적용하지 않습니다. 수능 950점 + 학생부 비교내신 50점으로 비교해야 합니다.', formulaNote: '국어 표준점수 + 수학 표준점수 + 영어 등급점수 + 탐구 변환점수 합×0.5를 950/600배 반영합니다. 한국사 감점과 학생부 비교내신을 함께 적용합니다.' },
  { ...yonseiBase, id: 'yonsei-computer', program: '컴퓨터과학과 · 일반전형', track: 'science', seats: 20, eligibility: 'bonus-gap', benefit: '자연 유형Ⅱ. 미적분·사탐 2과목으로 지원할 수 있습니다. 2027에는 첨단컴퓨팅학부에서 분리 선발합니다.', caution: '과탐 과목별 변환점수 3% 가산을 재현은 받지 못합니다. 전년도 첨단컴퓨팅학부 결과를 이 학과의 확정 컷으로 옮기면 안 됩니다. 학생부 비교내신도 필요합니다.', formulaNote: '국어 표준점수 + 수학 표준점수×1.5 + 영어 등급점수 + 탐구 변환점수 합×1.5를 950/900배 반영합니다. 과탐 응시자에게만 과목별 변환점수 3% 가산. 한국사 감점·학생부 비교내신 별도.' },
  { ...koreaBase, id: 'korea-business', program: '경영학과 · 일반전형', track: 'humanities', seats: 73, eligibility: 'allowed', benefit: '검정고시생이 지원 가능한 수능 100% 일반전형입니다. 화작·미적분·두 지리 과목 조합을 허용합니다.', caution: '교과우수전형 46명은 재현의 지원 인원에 포함하지 않습니다. 동점자 처리의 학생부 단계에서 9등급 체계가 없는 지원자는 후순위입니다.', formulaNote: '(국어 표준점수 + 수학 표준점수 + 탐구 변환점수 합×0.8)÷560×1,000 − 영어·한국사 감점. 영어 2등급은 3점 감점, 한국사 1~4등급은 감점 없음.' },
  { ...koreaBase, id: 'korea-computer', program: '컴퓨터학과 · 일반전형', track: 'science', seats: 24, eligibility: 'bonus-gap', benefit: '수능 100% 일반전형. 미적분·사탐으로 지원 가능하며 수학 표준점수에 1.2의 가중치를 적용합니다.', caution: '과탐 변환점수 과목별 3% 가산은 받지 못합니다. 교과우수전형 16명은 제외했습니다. 동점자 학생부 기준도 확인하세요.', formulaNote: '(국어 표준점수 + 수학 표준점수×1.2 + 탐구 변환점수 합)÷640×1,000 − 영어·한국사 감점. 과탐 응시자에게만 과목별 변환점수 3% 가산.' },
  { ...sogangBase, id: 'sogang-business', program: '경영학부 · 수능(일반)', track: 'humanities', gun: '나', seats: 90, benefit: '수능 100%. 사탐 2과목을 허용하며 국어·수학 중 유리한 A/B형 총점을 자동 적용합니다.', caution: '탐구 가중치는 20%. 별도 미적분·과탐 가산이 없고, 영어 1→2등급 차이는 0.5점입니다. 나군 한의대와 원서 한 장을 두고 비교하세요.' },
  { ...sogangBase, id: 'sogang-economics', program: '경제학과 · 수능(일반)', track: 'humanities', gun: '나', seats: 57, benefit: '검정고시생 지원 가능. 수학 표준점수가 높으면 수학 가중치 1.3인 A형이 유리해집니다.', caution: '수학 백분위가 높다는 이유만으로 A형을 확정하지 않습니다. 국어·수학 표준점수로 두 유형을 계산합니다.' },
  { ...sogangBase, id: 'sogang-computer', program: '컴퓨터공학과 · 수능(일반)', track: 'science', gun: '나', seats: 32, benefit: '문·이과에 같은 산식을 적용합니다. 사탐 지원을 허용하고 별도 과탐 가산이 없어 재현이 비교할 만한 공학 선택지입니다.', caution: '과목 조건이 맞는다는 뜻이며 합격이 쉽다는 뜻은 아닙니다. 올해 변환표와 국수 표준점수로 최종 환산해야 합니다.' },
  { ...sogangBase, id: 'sogang-ai-open', program: 'AI기반자유전공학부 · 수능(일반)', track: 'science', gun: '다', seats: 36, benefit: '다군에서 검토할 수 있는 전공 탐색 선택지. 미적분·사탐 지원이 가능하며 수능 100%로 선발합니다.', caution: '인공지능학과 직접 선발과 다릅니다. 자유전공에서 인공지능학과·반도체공학과 등 일부 학과는 선택할 수 없습니다. 전공 선택 제외 목록은 요강 8쪽을 확인하세요.' },
  { ...konkukBase, id: 'konkuk-business', program: '경영학과 · 수능(KU일반학생)', track: 'humanities', gun: '나', seats: 65, benefit: '수능 100%. 미적분·사탐 조합으로 지원 가능하며 인문계열 경영도 수리중심(B) 반영비율을 사용합니다.', caution: '수학 40% 비중을 확인하세요. 영어 1→2등급 환산배점은 200→197점이며 총점 손실은 반영비율을 적용해 계산합니다.' },
  { ...konkukBase, id: 'konkuk-economics', program: '경제학과 · 수능(KU일반학생)', track: 'humanities', gun: '나', seats: 32, benefit: '검정고시생 지원 가능. 국어 30%·수학 40%·탐구 20%·영어 10%로 경영학과와 같은 반영비율입니다.', caution: '지리를 선택했다고 지리학과의 정시 모집이 보장되지는 않습니다. 건국대 지리학과 일반전형은 수시 미충원 이월이 생길 때만 나군에서 선발합니다.' },
  { ...konkukBase, id: 'konkuk-computer', program: '컴퓨터공학과 · 수능(KU일반학생)', track: 'science', gun: '가', seats: 32, benefit: '사탐으로 지원 가능한 수능 100% 공학 선택지입니다. 수리중심(B)을 적용하며 요강에 별도 과탐 가산을 두지 않았습니다.', caution: '2027에는 컴퓨터공학부가 인공지능학과·컴퓨터공학과로 개편됩니다. 작년 학부 결과를 올해 컴퓨터공학과의 확정 컷으로 사용하지 않습니다.' },
  { ...khuBase, id: 'khu-business', program: '경영회계계열', track: 'humanities', location: '서울', seats: 122, metric: 'khu-social', cut70: 88.95, historicalPage: 'PDF 26쪽', eligibility: 'allowed', benefit: '국어·수학 각 35%, 탐구 30%. 미적분·사탐 조합을 허용하고 영어 1·2등급 감점이 같습니다.', caution: '표준점수·탐구 변환표로 최종 환산합니다. 아래 백분위 지표는 성적 분포 비교용입니다.' },
  { ...khuBase, id: 'khu-geography', program: '지리학과(인문)', track: 'humanities', location: '서울', seats: 13, metric: 'khu-social', cut70: 90.30, historicalPage: 'PDF 27쪽', eligibility: 'allowed', benefit: '사탐 2과목으로 지원 가능. 지리에 관심이 있다면 전공 교육과정도 함께 살펴볼 후보입니다.', caution: '지리 선택 자체에 별도 가산점은 없습니다. 수능 지리 성적만으로 전공 적합성을 단정하지 않습니다.' },
  { ...khuBase, id: 'khu-computer', program: '컴퓨터공학부 컴퓨터공학과', track: 'science', location: '경기', seats: 46, metric: 'khu-natural', cut70: 90.30, historicalPage: 'PDF 27쪽', eligibility: 'bonus-gap', benefit: '국제캠퍼스(용인). 미적분·사탐으로 지원 가능하며 수학 반영비율은 40%입니다.', caution: '과탐은 과목별 변환표준점수에 4점 가산. 재현은 받지 못하므로 백분위가 높아도 최종 환산 비교가 필요합니다.' },
  { ...khuBase, id: 'khu-open', program: '자유전공학부', track: 'science', location: '경기', seats: 71, metric: 'khu-natural', cut70: 92.15, historicalPage: 'PDF 26쪽', eligibility: 'allowed', benefit: '국제캠퍼스(용인)의 전공 탐색 선택지. 과탐 가산을 적용하지 않아 재현의 사탐 조합을 비교하기 좋습니다.', caution: '자연 반영비율을 쓰지만 계열에 관계없이 국제캠퍼스 전공 선택 가능. 서울캠퍼스 자율전공학부와 다릅니다. 전공 선택 제외 학과는 요강 확인.' },
  { ...ssuBase, id: 'ssu-business', program: '경영학부', track: 'humanities', gun: '가', seats: 42, cut70: 86.50, historicalPage: 'PDF 29쪽', eligibility: 'allowed', benefit: '사탐 1과목당 백분위의 3%를 총점에 가산합니다. 수학 35%, 영어 1·2등급 동일 배점입니다.', caution: '아래 단순 백분위 평균에는 영역 가중치와 사탐 가산점이 들어가지 않습니다.' },
  { ...ssuBase, id: 'ssu-law', program: '법학과', track: 'humanities', gun: '가', seats: 21, cut70: 82.33, historicalPage: 'PDF 29쪽', eligibility: 'allowed', benefit: '사탐 과목당 백분위의 3% 가산. 국어 35%·수학 20%로 국어 강점이 있을 때 비교할 후보입니다.', caution: '영어 비중 20%. 단순 평균이 같아도 국어·수학 점수 배치에 따라 실제 환산 순위가 달라집니다.' },
  { ...ssuBase, id: 'ssu-computer', program: '컴퓨터학부', track: 'science', gun: '다', seats: 20, cut70: 86.67, historicalPage: 'PDF 31쪽', eligibility: 'bonus-gap', benefit: '자연계열2. 미적분 표준점수의 5%를 총점에 가산하며 사탐으로도 지원할 수 있습니다.', caution: '과탐 과목당 백분위의 3% 가산은 재현에게 없습니다. 상지·동국 WISE 한의예과와 같은 다군입니다.' },
  { ...ssuBase, id: 'ssu-ai', program: 'AI소프트웨어학부', track: 'science', gun: '가', seats: 78, cut70: 86.00, historicalPage: 'PDF 31쪽', eligibility: 'bonus-gap', benefit: '자연계열2로 미적분 표준점수 5% 가산. 사탐 2과목 지원을 허용합니다.', caution: '과탐 백분위 가산은 받지 못합니다. 변환표 공개 후 1,000점 환산총점으로 다시 비교해야 합니다.' },
  { ...gcuBase, id: 'gcu-economics', program: '경제학과 · 일반전형1', track: 'humanities', seats: 16, cut70: 86.50 },
  { ...gcuBase, id: 'gcu-tourism', program: '관광경영학과 · 일반전형1', track: 'humanities', seats: 15, cut70: 85.70 },
  { ...gcuBase, id: 'gcu-finance', program: '금융·빅데이터학부 · 일반전형1', track: 'science', seats: 35, cut70: 86.30 },
  { ...gcuBase, id: 'gcu-urban', program: '도시계획·조경학부 · 일반전형1', track: 'science', seats: 25, cut70: 85.60 },
  { id: 'cau-human', university: '중앙대학교', program: '인문대학 일반전형 · 학과별 검토', track: 'humanities', location: '서울', gun: null, seats: null, eligibility: 'allowed', source: 'https://admission.cau.ac.kr/submenu.do?categoryid=24&menuurl=A3KncqzZhX%2BrR7JZXR/tUQ%3D%3D', sourcePage: '2027 요강 PDF 20·57쪽', benefit: '인문대학은 사탐 과목별 변환표준점수 5% 가산. 재현의 두 지리 과목을 활용할 수 있습니다.', caution: '수능 90%·출결 10%. 검정고시생의 출결 비교내신은 수능 성적으로 산출하며 추후 공지됩니다. GED 95점 이상을 자동 만점으로 처리하지 않습니다.' },
  { id: 'cau-science', university: '중앙대학교', program: '서울캠퍼스 공학계열 · 학과별 검토', track: 'science', location: '서울', gun: null, seats: null, eligibility: 'bonus-gap', source: 'https://admission.cau.ac.kr/submenu.do?categoryid=24&menuurl=A3KncqzZhX%2BrR7JZXR/tUQ%3D%3D', sourcePage: '2027 요강 PDF 20·57쪽', benefit: '사탐 2과목으로 지원 가능. 국어 30%·수학 35%·탐구 35%를 반영합니다.', caution: '과탐 변환표준점수 5% 가산을 받지 못합니다. 검정고시 비교내신 공지·학과별 모집군을 함께 확인해야 합니다.' },
  { id: 'sejong-human', university: '세종대학교', program: '인문계열 일반학생 · 학과별 검토', track: 'humanities', location: '서울', gun: null, seats: null, eligibility: 'allowed', source: 'https://ipsi.sejong.ac.kr/ipsi/regular/recruitment-guidelines.do', sourcePage: '2027 요강 PDF 47쪽', benefit: '미적분·사탐 2과목 지원 가능. 국어 30%·수학 30%·영어 20%·탐구 20%를 반영합니다.', caution: '국수 표준점수와 탐구 변환표가 필요합니다. 영어 1→2등급은 영어 환산배점 200→195점입니다.' },
  { id: 'sejong-science', university: '세종대학교', program: 'IT·공과계열 일반학생 · 학과별 검토', track: 'science', location: '서울', gun: null, seats: null, eligibility: 'bonus-gap', source: 'https://ipsi.sejong.ac.kr/ipsi/regular/recruitment-guidelines.do', sourcePage: '2027 요강 PDF 47쪽', benefit: '사탐 지원 가능. 해당 계열은 미적분 수학 반영점수의 3% 가산을 받을 수 있습니다.', caution: '과탐 과목별 탐구 반영점수의 3% 가산은 받지 못합니다. 자연생명계열은 5%로 다르며 군 계약학과는 이 카드에 포함하지 않습니다.' },
];

export const generalOptions: GeneralOption[] = curatedOptions.map(option => ({ ...option, historicalResult: generalHistoricalResults[option.id] }));

/** Use exact Decimal arithmetic: do not round a reference before assigning a signal. */
export function generalReference(option: GeneralOption): Decimal | null {
  const historical = option.historicalResult;
  if (historical) {
    if (historical.relationship === 'predecessor') return null;
    const p = historical.profile;
    return new Decimal(p.korean).plus(p.math).plus(new Decimal(p.inquiry1).plus(p.inquiry2).div(2)).div(3);
  }
  return option.metric && option.cut70 !== undefined ? new Decimal(option.cut70) : null;
}

export const metricDescriptions: Record<Metric, string> = {
  'khu-social': '국어×0.35 + 수학×0.35 + 두 탐구 평균×0.30 (백분위 비교지표)',
  'khu-natural': '국어×0.25 + 수학×0.40 + 두 탐구 평균×0.35 (백분위 비교지표)',
  ssu: '(국어 + 수학 + 두 탐구 평균) ÷ 3 (백분위 단순평균)',
  gcu: '2026 방식: 국어·수학·영어환산 중 높은 순서로 35%·25%·20% + 높은 탐구 1과목 20%. 2027 방식은 국수 높은 순 40%·30% + 영어환산·탐구최고 높은 순 20%·10%로 별도 표시.',
};
export function compareGeneralOption(option: GeneralOption, scores: Scores) {
  const keys = ['korean', 'math', 'world', 'korea', 'english', 'history'] as const;
  if (keys.some(k => scores[k] === null || !Number.isInteger(scores[k]) || scores[k]! < (k === 'english' || k === 'history' ? 1 : 0) || scores[k]! > (k === 'english' || k === 'history' ? 9 : 100))) return { status: 'missing' as const, value: null, current: null, gap: null, reference: null, label: '성적 6개 입력 필요' };
  const reference = generalReference(option);
  if (!reference) return { status: 'unverified' as const, value: null, current: null, gap: null, reference: null, label: option.historicalResult?.relationship === 'predecessor' ? '모집단위 개편 · 전년도 학부 참고' : '점수 비교 보류' };
  const k = new Decimal(scores.korean!), m = new Decimal(scores.math!), t = new Decimal(scores.world!).plus(scores.korea!).div(2);
  let value: Decimal;
  let current: string | null = null;
  if (option.historicalResult || option.metric === 'ssu') value = k.plus(m).plus(t).div(3);
  else if (option.metric === 'gcu') {
    const eng = [98, 95, 92, 86, 80, 60, 50, 40, 30][scores.english! - 1];
    const inquiry = Math.max(scores.world!, scores.korea!);
    current = Decimal.max(k, m).mul(.4).plus(Decimal.min(k, m).mul(.3)).plus(Decimal.max(eng, inquiry).mul(.2)).plus(Decimal.min(eng, inquiry).mul(.1)).toFixed(2);
    const ranked = [scores.korean!, scores.math!, eng].sort((a, b) => b - a);
    value = new Decimal(ranked[0]).mul(.35).plus(new Decimal(ranked[1]).mul(.25)).plus(new Decimal(ranked[2]).mul(.2)).plus(new Decimal(inquiry).mul(.2));
  } else value = k.mul(option.metric === 'khu-social' ? .35 : .25).plus(m.mul(option.metric === 'khu-social' ? .35 : .4)).plus(t.mul(option.metric === 'khu-social' ? .3 : .35));
  const gap = value.minus(reference);
  // ±2 is a transparent browsing band, not an estimated 2027 cutoff or safety margin.
  const status = gap.gte(2) ? 'above' : gap.lt(-2) ? 'below' : 'near';
  return { status, value: value.toFixed(2), current, gap: gap.toFixed(2), reference: reference.toFixed(2), label: option.historicalResult ? (status === 'above' ? '공개 성적 예시 상회' : status === 'below' ? '공개 성적 예시 미달' : '공개 성적 예시 근접') : status === 'above' ? '과거 참고선 상회' : status === 'below' ? '과거 참고선 미달' : '과거 참고선 근접' };
}
