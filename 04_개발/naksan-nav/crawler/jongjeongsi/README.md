# jongjeongsi

한성대 종합정보시스템의 **개설 강좌(과목·분반·교수·요일·교시·강의실)** 와 **수업계획서**를 모아 웹 데모 데이터로 만든다.
학교 허락을 받고 데모용으로 수집한다. 담당: 이학현

## 데이터 출처

교무 → 「시간표 및 수업계획서조회」 화면이 내부적으로 부르는 주소를 그대로 쓴다. 로그인한 본인 세션에서만 동작한다.

| 용도 | 요청 |
| --- | --- |
| 학기별 전공·교양 영역 목록 | `POST siganpyo_aui_data.jsp?gubun=jungonglist` · `syearhakgi=20262` |
| 영역별 개설 분반 (XML, EUC-KR) | `POST siganpyo_aui_data.jsp` · `gubun=history&syearhakgi=20262&sjungong=<영역코드>` |
| 수업계획서 (JSON) | `POST suupplan_main_view_data.jsp` · `type=view&yearhakgi=20262&code=<분반의 plan 값>` |

학기 코드: 1 = 1학기, 2 = 2학기, 3 = 여름, 4 = 겨울.

## 수집 (브라우저)

1. 본인 계정으로 종합정보시스템에 로그인하고 「시간표 및 수업계획서조회」를 연다.
2. 개발자 도구 콘솔에 [`collect_in_browser.js`](collect_in_browser.js) 내용을 붙여 넣고 실행한다.
   요청은 약 1초에 하나씩 보낸다. 2026-1·2 기준 시간표 약 4분, 수업계획서 약 1,940개 약 35분.
3. 내려받은 `hsu_timetable_2026.json`, `hsu_syllabi_2026-1.json`, `hsu_syllabi_2026-2.json` 을
   `04_개발/naksan-nav/data/raw/jongjeongsi/` 로 옮긴다. `data/raw/` 는 `.gitignore` 로 공개 저장소에 올라가지 않는다.

## 변환

```bash
cd 04_개발/naksan-nav
node crawler/jongjeongsi/build_demo_data.mjs
```

| 출력 | 내용 |
| --- | --- |
| `apps/web/src/data/jongjeongsi.ts` | 학기별 과목·분반(`JS_COURSES`), 전공·교양 영역별 개설 과목(`JS_MAJORS`) |
| `apps/web/public/data/syllabi/<학기>/<NN>.json` | 과목 해설과 수업계획서. 과목코드로 32조각에 나눠 두고 계획서를 열 때 해당 조각만 불러온다 |

## 개인정보

- 수업계획서의 교수 이메일·휴대전화·면담 장소·시간은 수집 단계에서 저장하지 않는다.
- 자유 서술 칸(기타 안내사항 등)의 이메일·전화번호 형태는 `[이메일 생략]` · `[전화번호 생략]` 으로 바꾼다.
- 시간표의 교직원 번호(`c13`)는 저장하지 않는다.
- 변환 스크립트는 공개 데이터에 이메일·전화번호 형태가 남아 있으면 멈춘다.
- 로그인한 학생 본인의 학적·성적 정보는 이 수집 대상이 아니다.
