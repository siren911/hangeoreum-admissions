/** Official 2026 results, checked 2026-09-19. Percentile profiles are reference examples, not percentile-distribution cutoffs. */
export type GeneralHistoricalResult = {
  year: 2026; program: string; selection: string; convertedCut70: number;
  profile: { korean: number; math: number; inquiry1: number; inquiry2: number; english: number; history: number };
  source: string; page: string; relationship: 'same-program' | 'predecessor'; note: string;
};
export const generalHistoricalResults: Record<string, GeneralHistoricalResult> = {
  "yonsei-business": {
    "year": 2026,
    "program": "경영학과",
    "selection": "일반전형[일반계열]",
    "convertedCut70": 670.66,
    "profile": {
      "korean": 98,
      "math": 84,
      "inquiry1": 95,
      "inquiry2": 92,
      "english": 2,
      "history": 2
    },
    "source": "https://www.adiga.kr/ucp/uvt/uni/univDetailSelection.do?menuId=PCUVTINF2000&searchSyr=2027&unvCd=0000149",
    "page": "수능위주전형 → 2026 결과 → 일반전형[일반계열]",
    "relationship": "same-program",
    "note": "공개 탐구 성적은 사탐 2과목입니다. 평균 95점 이상 검정고시 성적만으로 비교내신을 확정할 수 없습니다."
  },
  "yonsei-economics": {
    "year": 2026,
    "program": "경제학부",
    "selection": "일반전형[일반계열]",
    "convertedCut70": 671.83,
    "profile": {
      "korean": 97,
      "math": 91,
      "inquiry1": 92,
      "inquiry2": 92,
      "english": 2,
      "history": 2
    },
    "source": "https://www.adiga.kr/ucp/uvt/uni/univDetailSelection.do?menuId=PCUVTINF2000&searchSyr=2027&unvCd=0000149",
    "page": "수능위주전형 → 2026 결과 → 일반전형[일반계열]",
    "relationship": "same-program",
    "note": "2027에는 유형Ⅰ에서 유형Ⅲ로 반영 방식이 바뀝니다. 아래 색은 국수탐 단순평균 비교이며 올해 환산점수 예측이 아닙니다."
  },
  "yonsei-computer": {
    "year": 2026,
    "program": "첨단컴퓨팅학부",
    "selection": "일반전형[일반계열]",
    "convertedCut70": 663.68,
    "profile": {
      "korean": 92,
      "math": 97,
      "inquiry1": 93,
      "inquiry2": 92,
      "english": 2,
      "history": 2
    },
    "source": "https://www.adiga.kr/ucp/uvt/uni/univDetailSelection.do?menuId=PCUVTINF2000&searchSyr=2027&unvCd=0000149",
    "page": "수능위주전형 → 2026 결과 → 일반전형[일반계열]",
    "relationship": "predecessor",
    "note": "2027 컴퓨터과학과로 분리 선발합니다. 과탐 2과목 응시자의 기존 학부 결과이며 올해 학과의 합격선이 아닙니다."
  },
  "korea-business": {
    "year": 2026,
    "program": "경영대학",
    "selection": "일반전형",
    "convertedCut70": 659.91,
    "profile": {
      "korean": 97,
      "math": 92,
      "inquiry1": 95,
      "inquiry2": 95,
      "english": 3,
      "history": 2
    },
    "source": "https://www.adiga.kr/ucp/uvt/uni/univDetailSelection.do?menuId=PCUVTINF2000&searchSyr=2027&unvCd=0000069",
    "page": "수능위주전형 → 2026 결과 → 일반전형",
    "relationship": "same-program",
    "note": "일반전형 결과입니다. 검정고시생에게 적용되지 않는 교과우수전형 결과는 제외했습니다."
  },
  "korea-computer": {
    "year": 2026,
    "program": "컴퓨터학과",
    "selection": "일반전형",
    "convertedCut70": 659.82,
    "profile": {
      "korean": 95,
      "math": 97,
      "inquiry1": 92,
      "inquiry2": 98,
      "english": 3,
      "history": 2
    },
    "source": "https://www.adiga.kr/ucp/uvt/uni/univDetailSelection.do?menuId=PCUVTINF2000&searchSyr=2027&unvCd=0000069",
    "page": "수능위주전형 → 2026 결과 → 일반전형",
    "relationship": "same-program",
    "note": "공개 탐구 성적은 사탐 2과목입니다. 2027 과탐 가산 격차는 단순평균 신호등에 포함하지 않습니다."
  },
  "sogang-business": {
    "year": 2026,
    "program": "경영학부",
    "selection": "수능(일반)",
    "convertedCut70": 504.06,
    "profile": {
      "korean": 98,
      "math": 88,
      "inquiry1": 86,
      "inquiry2": 92,
      "english": 2,
      "history": 4
    },
    "source": "https://admission3.sogang.ac.kr/upload/GUIDES/20260602150120JNQJPH.pdf",
    "page": "PDF 4쪽 · 3-1 수능(일반) 나군",
    "relationship": "same-program",
    "note": ""
  },
  "sogang-economics": {
    "year": 2026,
    "program": "경제학과",
    "selection": "수능(일반)",
    "convertedCut70": 505.05,
    "profile": {
      "korean": 99,
      "math": 88,
      "inquiry1": 77,
      "inquiry2": 75,
      "english": 2,
      "history": 2
    },
    "source": "https://admission3.sogang.ac.kr/upload/GUIDES/20260602150120JNQJPH.pdf",
    "page": "PDF 4쪽 · 3-1 수능(일반) 나군",
    "relationship": "same-program",
    "note": ""
  },
  "sogang-computer": {
    "year": 2026,
    "program": "컴퓨터공학과",
    "selection": "수능(일반)",
    "convertedCut70": 506.72,
    "profile": {
      "korean": 97,
      "math": 94,
      "inquiry1": 93,
      "inquiry2": 95,
      "english": 2,
      "history": 1
    },
    "source": "https://admission3.sogang.ac.kr/upload/GUIDES/20260602150120JNQJPH.pdf",
    "page": "PDF 4쪽 · 3-1 수능(일반) 나군",
    "relationship": "same-program",
    "note": ""
  },
  "sogang-ai-open": {
    "year": 2026,
    "program": "AI기반자유전공학부",
    "selection": "수능(일반)",
    "convertedCut70": 508.29,
    "profile": {
      "korean": 99,
      "math": 94,
      "inquiry1": 77,
      "inquiry2": 75,
      "english": 2,
      "history": 1
    },
    "source": "https://admission3.sogang.ac.kr/upload/GUIDES/20260602150120JNQJPH.pdf",
    "page": "PDF 4쪽 · 3-2 수능(일반) 다군",
    "relationship": "same-program",
    "note": ""
  },
  "konkuk-business": {
    "year": 2026,
    "program": "경영학과",
    "selection": "수능(KU일반학생)",
    "convertedCut70": 667.07,
    "profile": {
      "korean": 98,
      "math": 81,
      "inquiry1": 85,
      "inquiry2": 72,
      "english": 2,
      "history": 1
    },
    "source": "https://admission.konkuk.ac.kr/bbs/admission/6290/1216634/download.do",
    "page": "PDF 10쪽 · KU일반학생 나군",
    "relationship": "same-program",
    "note": "공개 학생의 탐구는 사탐 85·과탐 72 조합입니다. 재현의 두 지리 성적이나 과목별 최저 요구점수가 아닙니다."
  },
  "konkuk-economics": {
    "year": 2026,
    "program": "경제학과",
    "selection": "수능(KU일반학생)",
    "convertedCut70": 667.49,
    "profile": {
      "korean": 90,
      "math": 88,
      "inquiry1": 91,
      "inquiry2": 95,
      "english": 2,
      "history": 2
    },
    "source": "https://admission.konkuk.ac.kr/bbs/admission/6290/1216634/download.do",
    "page": "PDF 10쪽 · KU일반학생 나군",
    "relationship": "same-program",
    "note": "공개 학생의 탐구는 과탐 2과목입니다. 표준점수·변환표를 적용한 대학 환산 순위는 단순평균 순위와 다를 수 있습니다."
  },
  "konkuk-computer": {
    "year": 2026,
    "program": "컴퓨터공학부",
    "selection": "수능(KU일반학생)",
    "convertedCut70": 669.97,
    "profile": {
      "korean": 93,
      "math": 94,
      "inquiry1": 77,
      "inquiry2": 88,
      "english": 2,
      "history": 1
    },
    "source": "https://admission.konkuk.ac.kr/bbs/admission/6290/1216634/download.do",
    "page": "PDF 11쪽 · KU일반학생 다군",
    "relationship": "predecessor",
    "note": "2026 다군 컴퓨터공학부 결과입니다. 2027 가군 컴퓨터공학과·인공지능학과로 개편되어 올해 학과와 직접 비교하지 않습니다."
  }
};
