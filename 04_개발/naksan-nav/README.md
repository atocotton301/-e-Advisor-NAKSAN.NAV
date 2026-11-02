# NAKSAN.NAV

AI 기반 전공트랙 추천 및 학기별 이수 로드맵 서비스 (웹 + 모바일 앱)

## 구조

```
naksan-nav/
├── apps/
│   ├── web/          # React + TypeScript + Tailwind (조선기)
│   └── mobile/       # React Native (Expo), 푸시 알림 (조선기)
├── packages/
│   └── shared/       # 웹·앱 공용 API 클라이언트, 타입 정의
├── backend/          # FastAPI 서버 (이학현)
│   ├── app/
│   │   ├── api/      # 라우터 (scan, match, route, check, ask, opportunities, timetable)
│   │   ├── core/     # 설정, 인증, DB 연결
│   │   ├── models/   # ORM 모델
│   │   ├── schemas/  # 요청·응답 스키마
│   │   └── services/ # 비즈니스 로직
│   ├── engines/
│   │   ├── check/    # 졸업요건 규칙 엔진 (학번별 요건 버전)
│   │   ├── route/    # 로드맵 생성 (OR-Tools CP-SAT)
│   │   └── timetable/# 교시 → 실제 시각 환산, 시간 겹침 검사
│   └── tests/
├── ai/               # (조선기)
│   ├── match/        # 트랙 적합도 점수, 임베딩
│   ├── rag/          # ASK: 학사 규정 RAG, HSU AI HUB 연동 어댑터
│   ├── ocr/          # 성적표 OCR
│   └── eval/         # 실제 학생 질문 평가 세트
├── crawler/          # (이학현)
│   ├── extracurricular/  # 교내 비교과 (비교과 네비게이터 크롤러 이식)
│   └── opportunities/    # 교내외 공모전·부트캠프·대외활동
├── db/               # (이학현)
│   ├── erd/          # ERD
│   ├── schema/       # DDL
│   ├── migrations/
│   └── seed/         # 트랙·교과·요건·비교과 초기 데이터
├── data/
│   ├── raw/          # 원본 자료 (책자 PDF 추출본 등, git 제외)
│   ├── processed/    # 정제 데이터
│   └── requirements/ # 학과·트랙별 졸업요건 (조사표 → CSV)
└── docs/             # API 명세, 설계 문서
```

## 스프린트
- S1 (11/25~12/7): DB·API, SCAN, CHECK, 학번별 요건, 시간표 환산기, 어학·자격증, 교외비교과 가이드
- S2 (12/8~12/21): MATCH, ROUTE, ASK, 비교과·기회 레이더, What-if, 모바일 앱·푸시
- S3 (12/22~1/4): OCR, UI 완성, 통합 테스트, 사용자 테스트, 결과보고서
