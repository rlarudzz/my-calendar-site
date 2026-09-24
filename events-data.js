// 이 파일만 수정하면 기본 일정 데이터를 한 번에 바꿀 수 있습니다.
// 이후 ChatGPT에게 일정표를 보내주면 이 구조로 정리해서 반영할 수 있습니다.
window.DEFAULT_CALENDAR_DATA = {
  version: 1,
  categories: [
    { id: 'job', name: '취업 / 면접', color: '#91b7ef', bg: '#dceafe' },
    { id: 'exam', name: '시험 / 공부', color: '#e3b957', bg: '#fff1c8' },
    { id: 'game', name: '게임 일정', color: '#8b74eb', bg: '#ebe5ff' },
    { id: 'music', name: '공연 / 음악', color: '#e18db8', bg: '#ffe2f0' },
    { id: 'personal', name: '약속 / 개인', color: '#67c5b3', bg: '#dcf7ef' },
    { id: 'important', name: '중요', color: '#ef6b75', bg: '#ffe0e4' },
    { id: 'etc', name: '기타', color: '#95a8bc', bg: '#e9eef4' }
  ],
  events: [
    {
      id: 'posco_2026_apply_start',
      date: '2026-09-01',
      title: '포스코 지원서 접수 시작',
      time: '',
      category: 'job',
      memo: '포스코 채용 지원서 접수 기간: 9/1(화) ~ 9/16(수)'
    },
    {
      id: 'posco_2026_apply_deadline',
      date: '2026-09-16',
      title: '포스코 지원서 접수 마감',
      time: '',
      category: 'important',
      memo: '포스코 채용 지원서 접수 마감일'
    },
    {
      id: 'posco_2026_pat',
      date: '2026-10-10',
      title: '포스코 인적성 검사 (PAT)',
      time: '',
      category: 'exam',
      memo: '온라인 진행. 이후 전형: 1차 면접(직무역량평가) → 2차 면접(가치적합성평가) → 최종 합격자 발표. 이후 일정은 이미지에 날짜 미표기.'
    }
  ]
};
