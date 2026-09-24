[내 일정 캘린더 사용법]

1) 바로 실행하는 법
- 압축을 푼 뒤, index.html 파일을 더블클릭하면 바로 실행됩니다.
- 인터넷 없이도 기본 기능은 작동합니다.
- 일정 / 메모 / 꾸미기 설정은 브라우저에 자동 저장됩니다.

2) 기본 기능
- 날짜 클릭: 일정 추가
- 일정 클릭: 일정 수정 / 삭제
- 오른쪽: 카테고리, 이번 달 노트, 테마 프리셋, GIF/이미지 URL 꾸미기
- 왼쪽: 다가오는 일정, 빠른 메모
- 하단/우측: 월 이동
- JSON 내보내기/불러오기: 데이터 백업 가능

3) ChatGPT에게 일정 입력 맡기는 법
- 그냥 채팅에 일정표를 보내고
  "이 일정들 캘린더에 넣어줘" 라고 하면 됩니다.
- 그러면 ChatGPT가 events-data.js 또는 백업 JSON 기준으로 수정된 버전을 다시 만들어줄 수 있습니다.

4) GitHub Pages로 무료 배포하는 법 (아주 쉽게)
- GitHub 계정 만들기 / 로그인
- 오른쪽 위 + 버튼 → New repository 클릭
- Repository name: 아무거나 (예: my-calendar-site)
- Public 선택
- Create repository 클릭
- 그 다음 Uploading an existing file 또는 Add file > Upload files 클릭
- 압축 푼 폴더 안의 파일 전체(index.html, style.css, app.js, events-data.js, README.txt)를 드래그해서 올리기
- Commit changes 클릭
- 상단 Settings 클릭
- 왼쪽 메뉴 Pages 클릭
- Build and deployment > Source 를 Deploy from a branch 로 설정
- Branch 는 main / /(root) 선택 후 Save 클릭
- 1~3분 정도 기다리면 사이트 주소가 생성됩니다.
  예시: https://네아이디.github.io/my-calendar-site/

5) GitHub에서 나중에 수정 파일 올리는 법
- 저장소 들어가기
- Add file > Upload files
- 기존 파일을 새 파일로 덮어 올리기
- Commit changes 클릭
- 잠시 기다리면 사이트가 자동 업데이트됨

6) 꾸미기 팁
- 프로필 이미지/GIF URL: 왼쪽 캐릭터 영역 꾸미기
- 배경 이미지/GIF URL: 전체 배경 꾸미기
- 공식 이미지 대신, 직접 구한 이미지 URL이나 GIF URL을 넣으면 됩니다.

