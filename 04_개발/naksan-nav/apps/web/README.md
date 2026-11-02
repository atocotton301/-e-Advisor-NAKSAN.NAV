# web

React + TypeScript 웹앱. 로드맵 드래그 편집, What-if 비교 화면 중심. 담당: 조선기

## 실행

```bash
npm install
npm run dev        # http://localhost:5173
npm run typecheck
npm run build
```

## 프론트엔드 데모 (2026-11-02)

흐름: 로그인(학번·비밀번호) → 학과·트랙 선택 → 관심사 해시태그 → 로딩("상상력 넘치는 미래를 준비하는 중") → 학기별 로드맵

| 화면/기능 | 파일 |
| --- | --- |
| 단계 전환 | `src/App.tsx` |
| 학과·트랙 목록 (홈페이지 기준) | `src/data/majors.ts` |
| 샘플 교육과정·교수·비교과 (**가상 데이터**) | `src/data/curriculum.ts` |
| 졸업요건 계산 (19~23학번 이수현황 화면 기준) | `src/lib/requirements.ts` |
| 관심사 기반 추천 순위 · 상위 3개 금테두리 | `src/lib/recommend.ts` |
| 수업계획서 (형식만 채운 예시) | `src/lib/syllabus.ts`, `src/components/SyllabusView.tsx` |
| 교수 논문 AI 요약 (목업, 백엔드 연동 자리) | `src/lib/ai.ts`, `src/components/ProfessorView.tsx` |
| 지니 효과 패널 | `src/components/Genie.tsx` |
| 한성부기 픽셀아트 (mood: happy/normal/sad) | `src/components/Boogi.tsx` |
| 타임라인·학기 확정 애니메이션 | `src/components/Roadmap.tsx` |

### 실제 데이터로 바꿀 곳
- `loadCatalog()` → backend `/api/catalog` (수강신청책자·교육과정표 기반 DB)
- `briefProfessor()` → backend 가 KCI·RISS 논문 메타데이터 + LLM 요약. API 키는 서버에만 둔다.
- `requirementVersion()` → backend CHECK 엔진의 학번별 요건 버전
- 부기 표정은 지금 졸업요건 충족 개수로 정한다. 성적(GPA) 연동 시 `Boogi` 의 `mood` 만 바꾸면 된다.
