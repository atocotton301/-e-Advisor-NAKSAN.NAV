# web

React 18 + TypeScript + Vite 웹앱. 담당: 조선기

## 실행

```bash
npm install
npm run dev        # http://localhost:5173
npx tsc -b --noEmit
npx vite build
```

## 웹 데모 v2 (2026-11-04, 초안)

흐름: 로그인(유형 선택: 재학생·일반편입·학사편입·미래플러스·대학원·평생교육) → 학과·트랙 → 관심사 → 학기별 로드맵 → 4년 설계 점검 → AI 취업 준비 분석

| 기능 | 파일 |
| --- | --- |
| 학번별 졸업요건 · 편입생 요건 | `src/lib/requirements.ts` |
| 학기별 수강 가능 학점 (18/21, 학점이월, 성적우수, 학사경고) | `src/lib/creditLimit.ts` |
| 비교과 200pt 인정·이월·소멸 | `src/lib/extracurricular.ts` |
| 2026-2 공식 교육과정 (115개 학과·트랙) | `src/data/cur2026_2.ts` |
| 2026-2 수강신청책자 분반·교수·시간 | `src/data/hansung.ts` |
| 트랙(학과)별 졸업요건 38곳 | `src/data/trackGrad.ts` |
| 전화번호·위치 (부서·학과·교수 연구실) | `src/data/directory.ts`, `organization.ts`, `professors.ts`, `profRooms.ts` |
| 휴학·졸업 시기·증명서 기준 | `src/lib/leave.ts`, `src/components/GraduationPlan.tsx` |
| 학업 분석 (성적·관심·진행도 트랙 적합도) | `src/lib/analysis.ts` |
| AI 취업 준비 분석 (규칙 기반, 직무 19종) | `src/lib/career.ts`, `src/components/CareerReport.tsx` |
| 로드맵 버전 저장·비교 | `src/components/RoadmapVersions.tsx` |
| 내 페이지 대시보드 | `src/components/MyPage.tsx` |
| 시간표 교시→시각 환산 | `src/lib/timetable.ts` |
| 상상부기 캐릭터 (ⓒ 한성대학교, 사용 허락) | `src/components/Boogi.tsx`, `src/assets/boogi/` |

### 아직 샘플·예정인 부분
- 1학기 교육과정·분반: 2026-1 교육과정조회·수강신청책자 받으면 교체
- 성적표 캡처 OCR: 데모는 예시 결과. 실제는 팀 서버 OCR → 이후 종합정보시스템 연동(학교 협의)
- AI 취업 분석: 지금은 규칙 기반. 실제는 서버에서 채용공고·NCS와 비교 (API 키는 서버에만)
- 대학원·평생교육 로드맵, 동일교과목 조회

## 안드로이드 앱 (APK)

main에 웹앱 변경이 올라가면 GitHub Actions가 Capacitor로 APK를 자동 빌드합니다.

- 받는 곳: 저장소 Releases의 `android-latest` → `NAKSAN-NAV.apk`
- 설치: 갤럭시폰·갤럭시탭에서 파일을 열고 "출처를 알 수 없는 앱 설치"를 허용
- `mobile/test.keystore`는 테스트용 공개 서명 키입니다(비밀번호 android). 스토어 배포에는 쓰지 않습니다.
- 로컬 빌드: `npm run build:app && npx cap add android && npx cap sync android` 후 Android Studio로 열기
