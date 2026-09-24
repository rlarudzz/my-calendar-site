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
      memo: ''
    },
    {
      id: 'posco_2026_apply_deadline',
      date: '2026-09-16',
      title: '포스코 지원서 접수 마감',
      time: '',
      category: 'important',
      memo: ''
    },
    {
      id: 'posco_2026_pat',
      date: '2026-10-10',
      title: '포스코 인적성 검사 (PAT)',
      time: '',
      category: 'exam',
      memo: ''
    },

    {
      id: 'kospo_2026_notice_start',
      date: '2026-09-11',
      title: '남부발전 채용공고 시작',
      time: '',
      category: 'job',
      memo: ''
    },
    {
      id: 'kospo_2026_apply_start',
      date: '2026-09-18',
      title: '남부발전 지원서 접수 시작',
      time: '10:00',
      category: 'job',
      memo: ''
    },
    {
      id: 'kospo_2026_notice_apply_deadline',
      date: '2026-09-28',
      title: '남부발전 채용공고·지원서 접수 마감',
      time: '12:00',
      category: 'important',
      memo: ''
    },
    {
      id: 'kospo_2026_written_target',
      date: '2026-10-07',
      title: '남부발전 필기 대상자 발표',
      time: '',
      category: 'job',
      memo: ''
    },
    {
      id: 'kospo_2026_written',
      date: '2026-10-18',
      title: '남부발전 필기전형',
      time: '',
      category: 'exam',
      memo: ''
    },
    {
      id: 'kospo_2026_interview_target',
      date: '2026-10-23',
      title: '남부발전 면접 대상자 발표',
      time: '',
      category: 'job',
      memo: ''
    },
    {
      id: 'kospo_2026_essay_start',
      date: '2026-10-23',
      title: '남부발전 자기소개서 제출 시작',
      time: '',
      category: 'job',
      memo: ''
    },
    {
      id: 'kospo_2026_essay_deadline',
      date: '2026-10-26',
      title: '남부발전 자기소개서 제출 마감',
      time: '15:00',
      category: 'important',
      memo: ''
    },
    {
      id: 'kospo_2026_interview_start',
      date: '2026-11-02',
      title: '남부발전 면접전형 시작',
      time: '',
      category: 'job',
      memo: ''
    },
    {
      id: 'kospo_2026_interview_end',
      date: '2026-11-04',
      title: '남부발전 면접전형 종료',
      time: '',
      category: 'job',
      memo: ''
    },
    {
      id: 'kospo_2026_final',
      date: '2026-12-11',
      title: '남부발전 최종합격자 발표',
      time: '',
      category: 'important',
      memo: ''
    },
    {
      id: 'kospo_2026_join',
      date: '2026-12-21',
      title: '남부발전 입사',
      time: '',
      category: 'job',
      memo: ''
    },

    {
      id: 'ewp_2026_apply_start',
      date: '2026-09-02',
      title: '동서발전 지원서 접수 시작',
      time: '',
      category: 'job',
      memo: ''
    },
    {
      id: 'ewp_2026_apply_deadline',
      date: '2026-09-09',
      title: '동서발전 지원서 접수 마감',
      time: '',
      category: 'important',
      memo: ''
    },
    {
      id: 'ewp_2026_document_result',
      date: '2026-09-14',
      title: '동서발전 서류합격자 발표',
      time: '',
      category: 'job',
      memo: ''
    },
    {
      id: 'ewp_2026_written',
      date: '2026-09-19',
      title: '동서발전 필기전형',
      time: '',
      category: 'exam',
      memo: ''
    },
    {
      id: 'ewp_2026_written_result',
      date: '2026-09-28',
      title: '동서발전 필기합격자 발표',
      time: '',
      category: 'job',
      memo: ''
    },
    {
      id: 'ewp_2026_essay_start',
      date: '2026-09-28',
      title: '동서발전 자기소개서 제출 시작',
      time: '',
      category: 'job',
      memo: ''
    },
    {
      id: 'ewp_2026_essay_deadline',
      date: '2026-09-29',
      title: '동서발전 자기소개서 제출 마감',
      time: '',
      category: 'important',
      memo: ''
    },
    {
      id: 'ewp_2026_interview_target',
      date: '2026-10-07',
      title: '동서발전 면접대상자 발표',
      time: '',
      category: 'job',
      memo: ''
    },
    {
      id: 'ewp_2026_interview_start',
      date: '2026-10-19',
      title: '동서발전 면접전형 시작',
      time: '',
      category: 'job',
      memo: ''
    },
    {
      id: 'ewp_2026_interview_end',
      date: '2026-10-23',
      title: '동서발전 면접전형 종료',
      time: '',
      category: 'job',
      memo: ''
    },
    {
      id: 'ewp_2026_interview_result',
      date: '2026-11-03',
      title: '동서발전 면접 합격자 발표',
      time: '',
      category: 'job',
      memo: ''
    },
    {
      id: 'ewp_2026_medical_start',
      date: '2026-11-03',
      title: '동서발전 신체검사·신원조회 시작',
      time: '',
      category: 'job',
      memo: ''
    },
    {
      id: 'ewp_2026_medical_end',
      date: '2026-11-17',
      title: '동서발전 신체검사·신원조회 종료',
      time: '',
      category: 'job',
      memo: ''
    },
    {
      id: 'ewp_2026_final',
      date: '2026-11-24',
      title: '동서발전 최종합격자 발표',
      time: '',
      category: 'important',
      memo: ''
    },
    {
      id: 'ewp_2026_join',
      date: '2026-11-30',
      title: '동서발전 입사',
      time: '',
      category: 'job',
      memo: ''
    }
  ]
};
