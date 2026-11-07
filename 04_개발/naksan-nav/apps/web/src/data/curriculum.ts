import { CUR_2026_2 } from "./cur2026_2";
import type { Activity, Catalog, Category, Course, Family, Paper, Professor, Student, TrackRef } from "../types";
import { AI_CURRICULUM, BOOK_2026_2, normName, tagsFor, type RealSection } from "./hansung";
import { JS_COURSES, JS_MAJORS, type JsCourse, type JsListing, type JsSemester } from "./jongjeongsi";

// ⚠ 데모용 샘플 데이터. 과목·교수·논문은 모두 가상이며, 실제 교육과정은 수강신청책자·교육과정표 기반 DB로 교체한다.

interface FamilySpec {
  dept: string;
  profs: [string, string, string, string];
  focus: [string, string, string, string];
  papers: [string, string, number, string][];
  /** 한 줄에 한 과목: "학년 구분 과목명 | 태그 태그" */
  courses: string;
}

const FAMILIES: Record<Family, FamilySpec> = {
  ai: {
    dept: "AI응용 계열",
    profs: ["김낙산", "이상상", "박누리", "정미래"],
    focus: ["대규모 언어모델 응용", "컴퓨터비전과 멀티모달", "교육 데이터 마이닝", "강화학습 기반 의사결정"],
    papers: [
      ["학습자 질문 로그를 활용한 한국어 RAG 학사 상담 모델", "한국정보과학회 논문지", 2025, "학생들이 실제로 묻는 질문을 모아, 학칙 문서에서 근거를 찾아 답하는 챗봇을 만들고 정확도를 쟀어요. 핵심은 '답과 함께 출처를 보여주면 신뢰도가 올라간다'는 것."],
      ["저조도 캠퍼스 영상에서의 경량 객체 인식", "IEEE Access", 2024, "밤이나 어두운 곳에서 찍힌 영상에서도 사람과 물체를 빠르게 찾는 작은 AI 모델을 만들었어요. 스마트폰에서도 돌아갈 만큼 가볍다는 게 장점."],
      ["수강 이력 그래프 임베딩을 이용한 과목 추천", "정보처리학회논문지", 2025, "선배들이 어떤 순서로 과목을 들었는지를 지도처럼 연결해서, 나와 비슷한 학생이 다음에 들은 과목을 추천하는 방법이에요."],
      ["보상 설계가 학습 안정성에 미치는 영향 분석", "NeurIPS Workshop", 2023, "AI에게 '잘했다'는 점수를 어떻게 주느냐에 따라 학습이 흔들리는 정도가 달라진다는 걸 실험으로 보였어요."],
    ],
    courses: `
1-1 기초 인공지능수학 | 인공지능 데이터분석
1-1 필수 파이썬프로그래밍 | 인공지능 웹개발 데이터분석
1-1 선택 컴퓨팅사고와문제해결 | 게임 교육
1-2 선택 선형대수 | 인공지능 금융투자
1-2 선택 데이터과학입문 | 데이터분석 인공지능
1-2 선택 AI프로그래밍실습 | 인공지능 앱개발
2-1 필수 자료구조 | 웹개발 앱개발
2-1 선택 확률과통계 | 데이터분석 금융투자
2-1 선택 데이터베이스 | 데이터분석 웹개발 클라우드
2-2 필수 머신러닝 | 인공지능 데이터분석
2-2 선택 알고리즘 | 인공지능 게임
2-2 선택 웹프로그래밍 | 웹개발 앱개발
3-1 필수 딥러닝 | 인공지능
3-1 선택 자연어처리 | 인공지능 언어 글쓰기
3-1 선택 데이터시각화 | 데이터분석 디자인
3-2 선택 컴퓨터비전 | 인공지능 로봇 영상
3-2 선택 생성형AI응용 | 인공지능 디자인 영상 창업
3-2 선택 추천시스템 | 인공지능 데이터분석 마케팅
4-1 필수 AI캡스톤디자인 | 인공지능 창업
4-1 선택 MLOps와클라우드 | 클라우드 인공지능
4-2 선택 AI윤리와사회 | 철학 법 공공정책
4-2 선택 AI서비스기획 | 창업 인공지능 마케팅`,
  },
  cs: {
    dept: "컴퓨터공학 계열",
    profs: ["최부기", "한성우", "오창의", "윤코드"],
    focus: ["모바일 플랫폼 최적화", "웹 서비스 아키텍처", "가상현실 인터랙션", "분산 시스템"],
    papers: [
      ["저사양 안드로이드 기기에서의 앱 시작 시간 단축 기법", "한국정보과학회 논문지", 2024, "오래된 휴대폰에서도 앱이 빨리 켜지도록, 처음에 꼭 필요한 코드만 먼저 불러오는 방법을 제안했어요."],
      ["마이크로서비스 전환 시 장애 전파 패턴 분석", "Journal of Systems and Software", 2025, "큰 서비스를 작은 서비스 여러 개로 쪼갰을 때, 하나가 고장 나면 어떻게 줄줄이 번지는지 분석하고 막는 법을 정리했어요."],
      ["VR 강의실에서 손 제스처 입력의 학습 효과", "한국HCI학회 논문지", 2024, "가상현실 수업에서 컨트롤러 대신 손동작으로 조작하면 학생들이 더 집중하는지 실험했어요."],
      ["엣지 노드 간 캐시 일관성 경량 프로토콜", "IEEE Transactions on Cloud Computing", 2023, "여러 지역 서버에 흩어진 데이터를 빠르면서도 서로 어긋나지 않게 맞추는 규칙을 만들었어요."],
    ],
    courses: `
1 기초 컴퓨터공학개론 | 웹개발 앱개발
1 필수 C프로그래밍 | 반도체 게임
1 선택 이산수학 | 인공지능
1 선택 웹디자인기초 | 웹개발 디자인 UXUI
2 필수 자료구조 | 웹개발 앱개발
2 필수 객체지향프로그래밍 | 앱개발 게임
2 선택 컴퓨터구조 | 반도체
2 선택 데이터베이스 | 데이터분석 웹개발
3 필수 운영체제 | 클라우드
3 선택 모바일앱프로그래밍 | 앱개발 창업
3 선택 웹프레임워크 | 웹개발 UXUI
3 선택 게임엔진프로그래밍 | 게임 메타버스
4 필수 캡스톤디자인 | 창업 웹개발 앱개발
4 필수 소프트웨어공학 | 경영전략
4 선택 클라우드컴퓨팅 | 클라우드`,
  },
  security: {
    dept: "융합보안 계열",
    profs: ["강방패", "서암호", "임포렌", "조관제"],
    focus: ["웹 애플리케이션 보안", "경량 암호", "디지털 포렌식", "보안관제 자동화"],
    papers: [
      ["대학 포털 대상 세션 탈취 취약점 실태 조사", "정보보호학회논문지", 2024, "여러 대학 포털이 로그인 정보를 얼마나 안전하게 다루는지 점검하고, 흔한 실수 5가지를 정리했어요."],
      ["IoT 기기를 위한 경량 블록암호 구현 최적화", "IEEE IoT Journal", 2025, "전력이 약한 작은 센서에서도 암호화를 빠르게 돌릴 수 있도록 계산 순서를 바꿔 속도를 높였어요."],
      ["메신저 앱 삭제 기록 복원 기법", "Digital Investigation", 2023, "지워진 채팅도 휴대폰 저장공간에 흔적이 남는다는 걸 보이고, 그걸 되살리는 절차를 만들었어요."],
      ["로그 이상탐지를 위한 대조학습 모델", "한국정보과학회 논문지", 2025, "평소 서버 기록과 다른 수상한 패턴을 AI가 스스로 골라내도록 학습시키는 방법이에요."],
    ],
    courses: `
1 기초 정보보호개론 | 보안 법
1 필수 C프로그래밍 | 보안 반도체
1 선택 네트워크기초 | 보안 클라우드
1 선택 리눅스활용 | 보안 클라우드
2 필수 암호학 | 보안 금융투자
2 필수 시스템보안 | 보안
2 선택 웹해킹과방어 | 보안 웹개발
2 선택 개인정보보호법 | 법 공공정책
3 필수 네트워크보안 | 보안 클라우드
3 선택 디지털포렌식 | 보안 법
3 선택 악성코드분석 | 보안
3 선택 AI보안 | 보안 인공지능
4 필수 보안캡스톤디자인 | 보안 창업
4 필수 보안관제실무 | 보안 데이터분석
4 선택 클라우드보안 | 클라우드 보안`,
  },
  design: {
    dept: "ICT디자인 계열",
    profs: ["문채원", "배선율", "신여백", "홍픽셀"],
    focus: ["사용자경험 리서치", "브랜드 아이덴티티", "공간·전시 디자인", "게임 그래픽"],
    papers: [
      ["고령 사용자의 모바일 뱅킹 탐색 오류 유형", "한국디자인학회 논문집", 2024, "어르신들이 은행 앱에서 어디서 막히는지 관찰해서, 버튼 크기와 문구를 바꾸면 실수가 줄어든다는 걸 보였어요."],
      ["대학 브랜드 리뉴얼에서 마스코트의 역할", "브랜드디자인학연구", 2025, "학교 로고보다 마스코트가 학생들에게 더 친근하게 기억된다는 설문 결과와 활용 전략을 담았어요."],
      ["팝업스토어 동선 설계가 체류 시간에 미치는 영향", "한국실내디자인학회", 2023, "팝업 매장에서 손님이 걷는 길을 어떻게 짜느냐에 따라 머무는 시간이 얼마나 달라지는지 측정했어요."],
      ["픽셀아트 캐릭터의 감정 표현 최소 단위", "한국게임학회 논문지", 2024, "몇 개의 점만으로도 기쁨·슬픔이 전달될 수 있는지, 표정을 이루는 최소 픽셀 수를 실험했어요."],
    ],
    courses: `
1 기초 디자인기초 | 디자인 미술
1 필수 드로잉과표현 | 미술 디자인
1 선택 색채학 | 디자인 패션
1 선택 디지털그래픽 | 디자인 브랜딩
2 필수 타이포그래피 | 디자인 브랜딩
2 필수 UX리서치 | UXUI 심리
2 선택 모션그래픽 | 영상 애니메이션
2 선택 3D모델링 | 게임 메타버스
3 필수 UI디자인스튜디오 | UXUI 앱개발
3 선택 브랜드아이덴티티 | 브랜딩 마케팅
3 선택 공간·전시디자인 | 큐레이션 디자인
3 선택 게임그래픽디자인 | 게임 애니메이션
4 필수 디자인캡스톤 | 디자인 창업
4 필수 포트폴리오디자인 | 디자인 브랜딩
4 선택 인터랙션디자인 | UXUI 메타버스`,
  },
  media: {
    dept: "영상콘텐츠 계열",
    profs: ["장컷", "유프레임", "남씬", "변자막"],
    focus: ["숏폼 콘텐츠 문법", "애니메이션 연출", "K-콘텐츠 산업", "버추얼 프로덕션"],
    papers: [
      ["숏폼 영상의 첫 3초 구성과 시청 유지율", "한국콘텐츠학회논문지", 2025, "짧은 영상이 처음 3초에 무엇을 보여줘야 사람들이 끝까지 보는지 수천 개 영상을 분석했어요."],
      ["2D 애니메이션 타이밍이 감정 전달에 미치는 영향", "애니메이션연구", 2023, "같은 장면도 프레임 간격을 조금만 바꾸면 슬픔·기쁨이 다르게 느껴진다는 걸 실험했어요."],
      ["K-드라마 해외 OTT 흥행 요인 분석", "방송통신연구", 2024, "해외에서 인기 있는 한국 드라마의 공통점을 장르·배우·공개 방식으로 나눠 살펴봤어요."],
      ["LED 월 기반 버추얼 프로덕션 제작비 비교", "영상기술연구", 2025, "대형 LED 화면 앞에서 촬영하면 해외 로케이션보다 비용과 시간이 얼마나 줄어드는지 계산했어요."],
    ],
    courses: `
1 기초 영상언어의이해 | 영상 문화콘텐츠
1 필수 촬영기초 | 영상
1 선택 시나리오작법 | 글쓰기 영상
1 선택 사진과이미지 | 영상 미술
2 필수 영상편집 | 영상
2 필수 애니메이션기초 | 애니메이션 미술
2 선택 사운드디자인 | 영상 공연예술
2 선택 엔터테인먼트산업론 | 문화콘텐츠 경영전략
3 필수 다큐멘터리제작 | 영상 공공정책
3 선택 숏폼콘텐츠기획 | 영상 마케팅
3 선택 모션캡처와VFX | 애니메이션 메타버스
3 선택 K-콘텐츠글로벌유통 | 글로벌 문화콘텐츠
4 필수 졸업작품제작 | 영상 창업
4 필수 영상포트폴리오 | 영상 브랜딩
4 선택 버추얼프로덕션 | 메타버스 영상`,
  },
  fashion: {
    dept: "패션산업 계열",
    profs: ["류실루엣", "엄원단", "황트렌드", "고런웨이"],
    focus: ["지속가능 패션", "패션 마케팅 데이터", "디지털 패션(3D)", "크리에이티브 디렉션"],
    papers: [
      ["업사이클링 의류에 대한 MZ세대 구매 의도", "한국의류학회지", 2024, "버려진 옷을 다시 만든 제품을 젊은 소비자가 왜 사고, 무엇이 망설이게 하는지 조사했어요."],
      ["SNS 착용샷 반응으로 본 트렌드 예측", "패션비즈니스학회지", 2025, "인스타그램 착용 사진의 좋아요·댓글 패턴으로 다음 시즌 유행을 미리 맞히는 방법이에요."],
      ["3D 가상 피팅의 샘플 제작 비용 절감 효과", "한국의류산업학회지", 2023, "실제 옷 샘플 대신 3D로 입혀보면 원단과 시간이 얼마나 절약되는지 브랜드 사례로 계산했어요."],
      ["캠페인 비주얼의 일관성과 브랜드 기억", "복식", 2024, "광고 사진들의 색과 분위기가 일관될수록 소비자가 브랜드를 더 오래 기억한다는 결과예요."],
    ],
    courses: `
1 기초 패션디자인기초 | 패션 디자인
1 필수 패션드로잉 | 패션 미술
1 선택 패션소재학 | 패션 환경
1 선택 패션과문화 | 패션 문화콘텐츠
2 필수 패턴메이킹 | 패션
2 필수 패션마케팅 | 마케팅 패션
2 선택 패션스타일링 | 패션 뷰티
2 선택 소비자트렌드분석 | 데이터분석 마케팅
3 필수 패션브랜드매니지먼트 | 브랜딩 경영전략
3 선택 디지털패션(3D) | 메타버스 패션
3 선택 크리에이티브디렉션 | 브랜딩 영상
3 선택 지속가능패션 | 환경 패션
4 필수 졸업컬렉션 | 패션 창업
4 필수 패션포트폴리오 | 패션 브랜딩
4 선택 글로벌패션비즈니스 | 글로벌 무역`,
  },
  beauty: {
    dept: "뷰티디자인 계열",
    profs: ["손광채", "피부결", "노컬러", "탁살롱"],
    focus: ["퍼스널컬러 진단", "피부과학", "K-뷰티 글로벌 마케팅", "살롱 경영"],
    papers: [
      ["조명 환경에 따른 퍼스널컬러 진단 오차", "한국뷰티디자인학회지", 2024, "형광등·자연광 등 조명이 바뀌면 퍼스널컬러 진단 결과가 얼마나 달라지는지 비교했어요."],
      ["20대 민감성 피부의 계절별 수분 변화", "대한피부미용학회지", 2023, "같은 사람도 계절마다 피부 수분이 어떻게 변하는지 1년 동안 측정했어요."],
      ["동남아 시장의 K-뷰티 인플루언서 효과", "한국화장품미용학회지", 2025, "동남아에서 한국 화장품이 잘 팔리는 데 인플루언서가 얼마나 기여하는지 분석했어요."],
      ["1인 살롱 창업의 생존 요인", "뷰티산업연구", 2024, "혼자 운영하는 미용실이 3년 이상 살아남는 비결을 상권·가격·예약 방식으로 나눠 봤어요."],
    ],
    courses: `
1 기초 뷰티디자인개론 | 뷰티 디자인
1 필수 피부과학 | 뷰티
1 선택 색채와퍼스널컬러 | 뷰티 패션
1 선택 뷰티드로잉 | 미술 뷰티
2 필수 메이크업디자인 | 뷰티 공연예술
2 필수 헤어디자인 | 뷰티
2 선택 네일아트 | 뷰티 미술
2 선택 화장품학 | 뷰티 환경
3 필수 뷰티트렌드분석 | 뷰티 데이터분석
3 선택 미디어메이크업 | 영상 뷰티
3 선택 뷰티마케팅 | 마케팅 브랜딩
3 선택 K-뷰티글로벌전략 | 글로벌 무역
4 필수 뷰티캡스톤 | 뷰티 창업
4 필수 뷰티포트폴리오 | 뷰티 브랜딩
4 선택 살롱경영실무 | 창업 경영전략`,
  },
  business: {
    dept: "경영·무역 계열",
    profs: ["구매출", "나전략", "도무역", "마회계"],
    focus: ["스타트업 성장 전략", "디지털 마케팅 분석", "국제통상", "ESG 회계"],
    papers: [
      ["대학 창업동아리 출신 스타트업의 초기 생존율", "벤처창업연구", 2025, "학교 창업동아리에서 시작한 회사가 3년 안에 얼마나 살아남는지, 무엇이 차이를 만드는지 분석했어요."],
      ["검색광고 키워드 입찰 최적화 모형", "마케팅연구", 2024, "같은 광고비로 더 많은 손님을 데려오려면 어떤 검색어에 얼마를 걸어야 하는지 계산하는 모델이에요."],
      ["RCEP 발효 이후 중소기업 수출 구조 변화", "국제통상연구", 2023, "아시아 자유무역협정 이후 작은 회사들의 수출 품목과 나라가 어떻게 바뀌었는지 살펴봤어요."],
      ["ESG 공시 품질과 기업가치의 관계", "회계학연구", 2025, "환경·사회 활동을 얼마나 꼼꼼히 공개하느냐가 주가에 영향을 주는지 분석했어요."],
    ],
    courses: `
1 기초 경영학원론 | 경영전략 창업
1 필수 회계원리 | 회계 금융투자
1 선택 경제학의이해 | 금융투자 공공정책
1 선택 비즈니스커뮤니케이션 | 글쓰기 글로벌
2 필수 마케팅원론 | 마케팅 브랜딩
2 필수 경영통계 | 데이터분석
2 선택 조직행동론 | 심리 경영전략
2 선택 무역실무 | 무역 글로벌
3 필수 재무관리 | 금융투자 회계
3 선택 디지털마케팅 | 마케팅 데이터분석
3 선택 비즈니스애널리틱스 | 데이터분석 인공지능
3 선택 창업과기업가정신 | 창업
4 필수 경영전략 | 경영전략
4 필수 경영캡스톤 | 창업 경영전략
4 선택 국제경영 | 글로벌 무역`,
  },
  econ: {
    dept: "경제·금융 계열",
    profs: ["백금리", "성환율", "어지수", "편효용"],
    focus: ["행동경제학", "금융시장 미시구조", "거시경제 예측", "산업 데이터 분석"],
    papers: [
      ["대학생 소비의 정신적 회계 편향", "경제학연구", 2024, "용돈·알바비처럼 돈의 출처에 따라 대학생이 다르게 쓰는 습관을 설문과 실험으로 확인했어요."],
      ["개인투자자 거래 비중과 변동성", "증권학회지", 2025, "개인투자자가 많이 사고팔수록 주가가 더 크게 출렁이는지 데이터로 살펴봤어요."],
      ["뉴스 감성지수를 활용한 소비자물가 나우캐스팅", "한국경제연구", 2023, "뉴스 기사의 긍정·부정 분위기로 이번 달 물가를 미리 짐작하는 방법이에요."],
      ["지역 상권 카드 데이터로 본 소상공인 회복력", "산업경제연구", 2024, "카드 결제 기록으로 어떤 동네 가게가 위기 뒤에 빨리 회복했는지 분석했어요."],
    ],
    courses: `
1 기초 경제학원론 | 금융투자 공공정책
1 필수 경제수학 | 데이터분석
1 선택 회계원리 | 회계
1 선택 경제와사회 | 공공정책 철학
2 필수 미시경제학 | 금융투자
2 필수 거시경제학 | 금융투자 공공정책
2 선택 경제통계 | 데이터분석
2 선택 화폐금융론 | 금융투자
3 필수 계량경제학 | 데이터분석 인공지능
3 선택 투자론 | 금융투자
3 선택 행동경제학 | 심리 마케팅
3 선택 산업조직론 | 경영전략
4 필수 경제분석캡스톤 | 데이터분석 금융투자
4 필수 금융시장론 | 금융투자 글로벌
4 선택 핀테크와디지털금융 | 금융투자 인공지능`,
  },
  public: {
    dept: "공공·정책 계열",
    profs: ["공정한", "법도윤", "도시락", "지방순"],
    focus: ["데이터 기반 행정", "규제 정책", "스마트도시 교통", "부동산 시장"],
    papers: [
      ["공공데이터 개방 수준과 지자체 행정 효율", "한국행정학보", 2024, "공공데이터를 많이 공개한 지자체일수록 민원 처리가 빨라지는지 비교했어요."],
      ["플랫폼 노동 규제의 국가별 비교", "법과정책연구", 2025, "배달·대리운전 같은 플랫폼 일자리를 나라마다 어떻게 보호하는지 정리하고 한국에 맞는 방안을 제안했어요."],
      ["공유 킥보드 정책이 대중교통 이용에 미친 영향", "대한교통학회지", 2023, "전동킥보드 규제가 바뀐 뒤 지하철·버스 이용이 어떻게 달라졌는지 데이터로 확인했어요."],
      ["청년 전세 지원과 지역 임대료", "부동산학연구", 2024, "청년 전세 지원금이 오히려 그 지역 전셋값을 올리는지 따져본 연구예요."],
    ],
    courses: `
1 기초 행정학원론 | 공공정책
1 필수 법학개론 | 법
1 선택 정치학의이해 | 공공정책 철학
1 선택 도시와공간 | 도시 부동산
2 필수 정책학원론 | 공공정책
2 필수 사회조사방법론 | 데이터분석 심리
2 선택 행정법 | 법 공공정책
2 선택 부동산학개론 | 부동산 금융투자
3 필수 재정학 | 공공정책 금융투자
3 선택 도시계획론 | 도시 환경
3 선택 교통계획 | 도시 데이터분석
3 선택 지방자치론 | 공공정책
4 필수 공공정책캡스톤 | 공공정책 데이터분석
4 필수 규제와입법 | 법 공공정책
4 선택 공공데이터분석 | 데이터분석 공공정책`,
  },
  humanities: {
    dept: "크리에이티브인문 계열",
    profs: ["하이야기", "주문헌", "채사료", "탁한글"],
    focus: ["디지털 인문학", "역사 콘텐츠 기획", "영미 문화 연구", "한국어 교육"],
    papers: [
      ["조선 왕실 기록의 텍스트 마이닝", "인문콘텐츠", 2024, "조선왕조실록 같은 옛 기록을 컴퓨터로 분석해 자주 등장하는 사건과 인물 관계를 지도로 그렸어요."],
      ["지역 박물관 전시의 스토리텔링 구조", "역사와 문화", 2025, "작은 박물관이 유물을 '이야기'로 엮어 보여줄 때 관람객 기억이 더 오래 남는다는 걸 보였어요."],
      ["넷플릭스 시대 영미 드라마의 번역 전략", "영미문화", 2023, "자막 번역가가 영어 농담과 사투리를 한국어로 어떻게 살리는지 사례별로 분석했어요."],
      ["외국인 학습자의 한국어 존댓말 오류 유형", "한국어교육", 2024, "외국인 학생이 존댓말을 쓸 때 어디서 자주 틀리는지 분류하고 가르치는 순서를 제안했어요."],
    ],
    courses: `
1 기초 인문학입문 | 철학 역사
1 필수 글쓰기와스토리텔링 | 글쓰기 문화콘텐츠
1 선택 한국사의이해 | 역사
1 선택 영어학개론 | 영어 언어
2 필수 문화콘텐츠기획 | 문화콘텐츠 마케팅
2 필수 인문학연구방법론 | 철학 데이터분석
2 선택 영미문학과문화 | 영어 문화콘텐츠
2 선택 한국어교육론 | 한국어교육 교육
3 필수 디지털인문학 | 데이터분석 인공지능 역사
3 선택 박물관과큐레이션 | 큐레이션 역사
3 선택 번역의이론과실제 | 언어 영어
3 선택 역사콘텐츠제작 | 역사 영상
4 필수 인문학캡스톤 | 문화콘텐츠 창업
4 선택 외국어로서의한국어교수법 | 한국어교육 글로벌
4 선택 문헌정보와아카이브 | 큐레이션 데이터분석`,
  },
  fineart: {
    dept: "회화 계열",
    profs: ["여먹선", "단채색", "강캔버스", "모화실"],
    focus: ["현대 수묵화", "회화 재료 연구", "공공미술", "디지털 페인팅"],
    papers: [
      ["현대 수묵화에서 여백의 재해석", "한국화연구", 2024, "옛 수묵화의 '빈 공간'을 요즘 작가들이 어떻게 새롭게 쓰는지 작품들을 비교했어요."],
      ["아크릴과 유화 혼합 기법의 내구성", "미술재료연구", 2023, "두 물감을 섞어 그리면 몇 년 뒤 갈라짐이 생기는지 직접 실험해 확인했어요."],
      ["도시 벽화 프로젝트와 주민 참여", "공공미술연구", 2025, "동네 벽화를 주민과 함께 그렸을 때 마을에 대한 애정이 어떻게 달라지는지 조사했어요."],
      ["태블릿 드로잉이 전통 소묘 교육에 주는 변화", "미술교육논총", 2024, "디지털 드로잉을 함께 배운 학생들의 소묘 실력이 어떻게 달라지는지 비교했어요."],
    ],
    courses: `
1 기초 조형기초 | 미술 디자인
1 필수 드로잉I | 미술
1 선택 동서미술사 | 미술 역사
1 선택 색채와재료 | 미술
2 필수 수묵·유화기법 | 미술
2 필수 인체드로잉 | 미술
2 선택 판화 | 미술
2 선택 디지털페인팅 | 미술 애니메이션
3 필수 창작스튜디오I | 미술
3 선택 현대미술론 | 미술 철학
3 선택 전시기획 | 큐레이션 미술
3 선택 공공미술프로젝트 | 미술 도시
4 필수 졸업작품전 | 미술
4 필수 작가론과포트폴리오 | 미술 브랜딩
4 선택 미술시장과경영 | 경영전략 미술`,
  },
  dance: {
    dept: "무용 계열",
    profs: ["춤사위", "엄발끝", "율동하", "무대빛"],
    focus: ["안무와 즉흥", "무용 동작 분석", "공연 기획", "무용 치료"],
    papers: [
      ["모션캡처로 본 한국무용 호흡과 움직임", "한국무용학회지", 2024, "한국무용의 '호흡'이 실제 몸의 움직임에서 어떻게 나타나는지 센서로 측정했어요."],
      ["발레 무용수의 부상 예방 훈련 효과", "한국체육학회지", 2023, "매일 15분 균형 훈련을 하면 발목 부상이 얼마나 줄어드는지 한 학기 동안 비교했어요."],
      ["관객 참여형 무용 공연의 몰입도", "공연문화연구", 2025, "관객이 무대 위로 함께 움직이는 공연이 일반 공연보다 몰입감이 높은지 조사했어요."],
      ["청소년 스트레스 완화를 위한 무용 프로그램", "무용예술학연구", 2024, "8주 동안 춤 수업을 받은 청소년의 스트레스 수치가 어떻게 변했는지 측정했어요."],
    ],
    courses: `
1 기초 무용기초훈련 | 공연예술 스포츠
1 필수 신체훈련과해부학 | 스포츠 공연예술
1 선택 무용사 | 공연예술 역사
1 선택 음악과리듬 | 공연예술
2 필수 즉흥과창작 | 공연예술
2 필수 안무법 | 공연예술
2 선택 무용과영상 | 영상 공연예술
2 선택 무대기술 | 공연예술 디자인
3 필수 레퍼토리 | 공연예술
3 선택 공연기획 | 공연예술 경영전략
3 선택 무용치료 | 심리 공연예술
3 선택 무용교육론 | 교육 공연예술
4 필수 졸업공연 | 공연예술
4 필수 무용포트폴리오 | 공연예술 브랜딩
4 선택 글로벌공연시장 | 글로벌 공연예술`,
  },
  engineering: {
    dept: "기계전자 계열",
    profs: ["전회로", "기어진", "반도윤", "로보람"],
    focus: ["전력전자", "정밀 기계 설계", "반도체 소자", "협동 로봇 제어"],
    papers: [
      ["전기차 충전기의 고효율 전력 변환 회로", "전력전자학회 논문지", 2024, "전기차를 더 빨리, 열을 덜 내며 충전하는 회로 구조를 제안했어요."],
      ["3D 프린팅 경량 구조물의 피로 수명 예측", "대한기계학회논문집", 2025, "3D 프린터로 만든 가벼운 부품이 반복해서 힘을 받을 때 언제 부러질지 예측하는 방법이에요."],
      ["저전력 메모리 셀의 누설전류 저감", "대한전자공학회 논문지", 2023, "휴대폰 배터리를 오래 쓰도록 메모리 칩에서 새는 전기를 줄이는 구조를 설계했어요."],
      ["사람과 함께 일하는 로봇팔의 충돌 감지", "제어로봇시스템학회 논문지", 2024, "공장에서 사람과 같이 일하는 로봇팔이 사람과 부딪히는 순간 바로 멈추게 하는 방법이에요."],
    ],
    courses: `
1 기초 공학수학 | 반도체 로봇
1 필수 공학프로그래밍 | 로봇 앱개발
1 선택 일반물리 | 반도체
1 선택 공학설계입문 | 로봇 디자인
2 필수 회로이론 | 반도체
2 필수 디지털논리회로 | 반도체
2 선택 정역학 | 로봇
2 선택 CAD와제도 | 디자인 로봇
3 필수 제어공학 | 로봇
3 선택 전자회로 | 반도체
3 선택 임베디드시스템 | 로봇 앱개발
3 선택 반도체소자 | 반도체
4 필수 공학캡스톤디자인 | 창업 로봇
4 필수 로봇공학 | 로봇 인공지능
4 선택 자율주행시스템 | 로봇 인공지능 도시`,
  },
  industrial: {
    dept: "산업시스템 계열",
    profs: ["공정율", "품질관", "물류선", "최적해"],
    focus: ["스마트 팩토리", "품질 데이터 분석", "공급망 최적화", "수리 최적화"],
    papers: [
      ["스마트 팩토리 설비 고장 예측 모델", "대한산업공학회지", 2024, "공장 기계의 진동·온도 기록으로 고장을 미리 알아채는 AI 모델을 만들었어요."],
      ["반도체 공정 불량 원인 추적", "품질경영학회지", 2025, "반도체 생산 과정에서 불량이 어느 단계에서 생기는지 데이터로 거꾸로 추적했어요."],
      ["새벽배송 물류센터 피킹 경로 최적화", "한국SCM학회지", 2023, "물류창고 직원이 주문 상품을 가장 짧은 길로 모을 수 있게 동선을 계산했어요."],
      ["대학 시간표 편성을 위한 정수계획 모형", "경영과학", 2024, "강의실·교수·학생 일정이 겹치지 않게 시간표를 자동으로 짜는 수학 모델이에요."],
    ],
    courses: `
1 기초 산업공학개론 | 경영전략 데이터분석
1 필수 공학프로그래밍 | 데이터분석
1 선택 공학수학 | 데이터분석
1 선택 경제성공학 | 금융투자 경영전략
2 필수 확률통계 | 데이터분석
2 필수 경영과학 | 경영전략 데이터분석
2 선택 생산관리 | 경영전략
2 선택 인간공학 | UXUI 심리
3 필수 품질경영 | 데이터분석
3 선택 공급망관리 | 무역 경영전략
3 선택 데이터마이닝 | 데이터분석 인공지능
3 선택 시뮬레이션 | 데이터분석 게임
4 필수 산업공학캡스톤 | 창업 데이터분석
4 필수 스마트팩토리 | 로봇 인공지능
4 선택 최적화응용 | 인공지능 데이터분석`,
  },
};

const MAJOR_CATEGORY: Record<string, Category> = { 기초: "전공기초", 필수: "전공필수", 선택: "전공선택" };

function parseCourseLines(spec: FamilySpec, family: Family, slot: 1 | 2): Course[] {
  const seenPerGrade = new Map<number, number>();
  return spec.courses
    .trim()
    .split("\n")
    .map((line, i) => {
      const [head = "", tagPart = ""] = line.split("|");
      const [when = "1", kind = "선택", ...nameParts] = head.trim().split(/\s+/);
      const [gradeStr = "1", termStr] = when.split("-");
      const grade = Number(gradeStr);
      // 학기 표기("2-1")가 없는 계열은 학년 안에서 순서대로 1학기·2학기에 번갈아 연다(데모 단순화).
      const nth = seenPerGrade.get(grade) ?? 0;
      seenPerGrade.set(grade, nth + 1);
      const term = (termStr ? Number(termStr) : (nth % 2) + 1) as 1 | 2;
      return {
        id: `${family}-${slot}-${i}`,
        name: nameParts.join(" "),
        category: MAJOR_CATEGORY[kind] ?? "전공선택",
        credits: 3,
        grade,
        term,
        tags: tagPart.trim().split(/\s+/).filter(Boolean),
        professorId: `${family}-p${i % 4}`,
        trackSlot: slot,
      };
    });
}

function familyProfessors(family: Family): Professor[] {
  const spec = FAMILIES[family];
  return spec.profs.map((name, i) => {
    const papers: Paper[] = [0, 1, 2].map((k) => {
      const [title, venue, year, plain] = spec.papers[(i + k) % spec.papers.length]!;
      return { title, venue, year, plain };
    });
    return { id: `${family}-p${i}`, name, dept: spec.dept, focus: spec.focus[i]!, papers };
  });
}

// ---------- 교양·일반선택 ----------

const LIBERAL_PROFS: Professor[] = [
  {
    id: "lib-p0",
    name: "상상희",
    dept: "상상력교양대학",
    focus: "대학 글쓰기 교육",
    papers: [
      { title: "AI 글쓰기 도구 사용이 대학생 논증 능력에 미치는 영향", venue: "작문연구", year: 2025, plain: "챗봇으로 초안을 쓴 학생과 직접 쓴 학생의 논리력을 비교했어요. 도구를 '검토용'으로 쓴 그룹이 가장 많이 늘었어요." },
      { title: "토론 수업에서 침묵하는 학생의 참여 유도", venue: "교양교육연구", year: 2024, plain: "말을 잘 안 하는 학생도 토론에 끼게 하려면 발언 순서와 메모 시간을 어떻게 주면 좋은지 실험했어요." },
      { title: "교양 글쓰기 피드백의 효과적 시점", venue: "리터러시연구", year: 2023, plain: "글을 다 쓴 뒤보다 개요 단계에서 피드백을 받을 때 결과물이 더 좋아진다는 걸 보였어요." },
    ],
  },
  {
    id: "lib-p1",
    name: "영어린",
    dept: "상상력교양대학",
    focus: "영어 의사소통 교육",
    papers: [
      { title: "AI 회화 파트너와 영어 말하기 불안", venue: "Foreign Language Education", year: 2025, plain: "AI와 영어로 대화 연습을 하면 사람 앞에서 말할 때 긴장이 줄어드는지 측정했어요." },
      { title: "학술 영어 독해에서 요약 훈련의 효과", venue: "영어교육연구", year: 2024, plain: "긴 영어 글을 한 문단으로 요약하는 연습이 독해 속도를 높인다는 결과예요." },
      { title: "온라인 영어 수업의 카메라 사용과 참여도", venue: "멀티미디어언어교육", year: 2023, plain: "화상 수업에서 카메라를 켠 학생이 실제로 더 많이 참여하는지 분석했어요." },
    ],
  },
  {
    id: "lib-p2",
    name: "코딩해",
    dept: "상상력교양대학",
    focus: "비전공자 SW 교육",
    papers: [
      { title: "비전공 대학생의 블록 코딩에서 텍스트 코딩으로의 전환", venue: "컴퓨터교육학회 논문지", year: 2024, plain: "블록 코딩을 배운 학생이 파이썬으로 넘어갈 때 어디서 가장 많이 막히는지 조사했어요." },
      { title: "생성형 AI를 활용한 교양 코딩 수업 설계", venue: "정보교육학회 논문지", year: 2025, plain: "AI가 힌트를 주는 코딩 수업을 설계하고, 스스로 문제를 푸는 힘이 유지되는지 확인했어요." },
      { title: "문제해결 중심 코딩 교육과 자기효능감", venue: "교양교육연구", year: 2023, plain: "생활 속 문제를 코딩으로 풀어보는 수업이 '나도 할 수 있다'는 자신감을 키운다는 결과예요." },
    ],
  },
];

const LIBERAL_COURSES_19_23: Course[] = [
  { id: "lib-th1", name: "사고와표현(읽기와 쓰기)", category: "필수교양", credits: 2, grade: 1, term: 1, tags: ["글쓰기", "철학"], professorId: "lib-p0", group: "사고와표현" },
  { id: "lib-th2", name: "사고와표현(발표와 토론)", category: "필수교양", credits: 2, grade: 1, term: 2, tags: ["글쓰기", "공공정책"], professorId: "lib-p0", group: "사고와표현" },
  { id: "lib-cd1", name: "문제해결을 위한 코딩 첫걸음", category: "필수교양", credits: 2, grade: 1, term: 1, tags: ["웹개발", "인공지능"], professorId: "lib-p2", group: "코딩" },
  { id: "lib-cd2", name: "AI와 SW기초", category: "필수교양", credits: 2, grade: 1, term: 2, tags: ["인공지능"], professorId: "lib-p2", group: "코딩" },
  { id: "lib-en1", name: "영어커뮤니케이션 독해/작문", category: "필수교양", credits: 2, grade: 1, term: 1, tags: ["영어", "글쓰기"], professorId: "lib-p1", group: "영어독해작문" },
  { id: "lib-en2", name: "영어커뮤니케이션 청취/회화", category: "필수교양", credits: 2, grade: 1, term: 2, tags: ["영어", "글로벌"], professorId: "lib-p1", group: "영어청취회화" },
  { id: "lib-ar1", name: "음악과 삶", category: "선택필수교양", credits: 2, grade: 0, tags: ["공연예술"], professorId: "lib-p0", group: "예술과 스포츠" },
  { id: "lib-ar2", name: "생활체육과 건강", category: "선택필수교양", credits: 2, grade: 0, tags: ["스포츠"], professorId: "lib-p1", group: "예술과 스포츠" },
  { id: "lib-hu1", name: "철학적 사유와 질문", category: "선택필수교양", credits: 2, grade: 0, tags: ["철학"], professorId: "lib-p0", group: "인문학적 상상력" },
  { id: "lib-hu2", name: "역사 속의 상상력", category: "선택필수교양", credits: 3, grade: 0, tags: ["역사", "문화콘텐츠"], professorId: "lib-p0", group: "인문학적 상상력" },
  { id: "lib-so1", name: "심리학의 이해", category: "선택필수교양", credits: 3, grade: 0, tags: ["심리"], professorId: "lib-p1", group: "사회과학적 상상력" },
  { id: "lib-so2", name: "경제생활과 금융", category: "선택필수교양", credits: 2, grade: 0, tags: ["금융투자", "회계"], professorId: "lib-p1", group: "사회과학적 상상력" },
  { id: "lib-sc1", name: "생활 속의 과학", category: "선택필수교양", credits: 2, grade: 0, tags: ["환경"], professorId: "lib-p2", group: "과학기술 상상력" },
  { id: "lib-sc2", name: "데이터와 통계적 사고", category: "선택필수교양", credits: 3, grade: 0, tags: ["데이터분석"], professorId: "lib-p2", group: "과학기술 상상력" },
  { id: "lib-cv1", name: "창의적 문제해결", category: "선택필수교양", credits: 2, grade: 0, tags: ["창업", "디자인"], professorId: "lib-p2", group: "융합적 상상력" },
  { id: "lib-cv2", name: "지속가능한 미래", category: "선택필수교양", credits: 2, grade: 0, tags: ["환경", "공공정책"], professorId: "lib-p0", group: "융합적 상상력" },
  { id: "gen-1", name: "진로설계와 취업전략", category: "일반선택", credits: 2, grade: 0, tags: ["교육", "경영전략"], professorId: "lib-p1" },
  { id: "gen-2", name: "창업의 이해", category: "일반선택", credits: 2, grade: 0, tags: ["창업"], professorId: "lib-p2" },
  { id: "gen-3", name: "글로벌 시민교육", category: "일반선택", credits: 2, grade: 0, tags: ["글로벌", "봉사"], professorId: "lib-p1" },
  { id: "gen-4", name: "데이터 리터러시", category: "일반선택", credits: 3, grade: 0, tags: ["데이터분석", "인공지능"], professorId: "lib-p2" },
  { id: "gen-5", name: "여행과 세계문화", category: "일반선택", credits: 2, grade: 0, tags: ["여행", "글로벌"], professorId: "lib-p0" },
  { id: "gen-6", name: "음식과 문화", category: "일반선택", credits: 2, grade: 0, tags: ["음식", "문화콘텐츠"], professorId: "lib-p0" },
  { id: "gen-7", name: "마음건강과 회복탄력성", category: "일반선택", credits: 2, grade: 0, tags: ["심리"], professorId: "lib-p1" },
  { id: "gen-8", name: "브랜드와 스토리텔링", category: "일반선택", credits: 3, grade: 0, tags: ["브랜딩", "마케팅", "글쓰기"], professorId: "lib-p0" },
  { id: "gen-9", name: "생활 속 법률", category: "일반선택", credits: 2, grade: 0, tags: ["법"], professorId: "lib-p1" },
  { id: "gen-10", name: "메타버스와 미래사회", category: "일반선택", credits: 3, grade: 0, tags: ["메타버스", "게임"], professorId: "lib-p2" },
];

/** 필수교양 권장 학기(1-1 / 1-2)는 기본값이다. 실제로는 학과마다 1·2학기 배정이 달라 학업이수가이드로 맞춘다. */
/** 24학번 이후 교양필수: 사고와 표현 3, 영어 2+2, AI와 SW기초 3, 한성 이마기난스 3 (2026 학업이수가이드) */
const LIBERAL_COURSES_24: Course[] = [
  { id: "lib24-th", name: "사고와 표현", category: "필수교양", credits: 3, grade: 1, term: 1, tags: ["글쓰기", "철학"], professorId: "lib-p0", group: "사고와표현" },
  { id: "lib24-ai", name: "AI와 SW기초", category: "필수교양", credits: 3, grade: 1, term: 1, tags: ["인공지능", "웹개발"], professorId: "lib-p2", group: "코딩" },
  { id: "lib24-im", name: "한성 이마기난스", category: "필수교양", credits: 3, grade: 1, term: 2, tags: ["창업", "교육"], professorId: "lib-p1", group: "이마기난스" },
  ...LIBERAL_COURSES_19_23.filter((c) => c.category !== "필수교양" || c.group === "영어독해작문" || c.group === "영어청취회화"),
];

/** 매 학기 신청 가능한 비교과 (가상) */
export const ACTIVITIES: Activity[] = [
  { id: "ex-1", name: "상상력 진로캠프", host: "학생성공·전공설계센터", points: 40, tags: ["교육", "심리"] },
  { id: "ex-2", name: "트랙 선배 멘토링", host: "학생성공·전공설계센터", points: 60, tags: ["교육"] },
  { id: "ex-3", name: "SW 해커톤", host: "SW중심대학사업단", points: 100, tags: ["웹개발", "앱개발", "인공지능"] },
  { id: "ex-4", name: "학습공동체(스터디)", host: "교수학습지원센터", points: 50, tags: ["교육"] },
  { id: "ex-5", name: "외국어 튜터링", host: "국제교류원", points: 30, tags: ["영어", "글로벌"] },
  { id: "ex-6", name: "창업 아이디어 경진대회", host: "창업지원단", points: 80, tags: ["창업", "마케팅"] },
  { id: "ex-7", name: "글쓰기 클리닉", host: "교수학습지원센터", points: 20, tags: ["글쓰기"] },
  { id: "ex-8", name: "지역사회 봉사단", host: "사회봉사센터", points: 50, tags: ["봉사", "공공정책"] },
  { id: "ex-9", name: "디자인 포트폴리오 특강", host: "디자인대학", points: 40, tags: ["디자인", "UXUI", "브랜딩"] },
  { id: "ex-10", name: "데이터 분석 부트캠프", host: "SW중심대학사업단", points: 90, tags: ["데이터분석", "인공지능"] },
  { id: "ex-11", name: "글로벌 문화 탐방", host: "국제교류원", points: 70, tags: ["여행", "글로벌"] },
  { id: "ex-12", name: "공연·전시 기획단", host: "학생처", points: 60, tags: ["공연예술", "큐레이션", "미술"] },
  { id: "ex-13", name: "정보보안 CTF 대회", host: "융합보안학과", points: 80, tags: ["보안"] },
  { id: "ex-14", name: "취업 역량 진단 & 모의면접", host: "대학일자리플러스센터", points: 30, tags: ["경영전략"] },
];

/** 학교 DB 조회를 흉내 낸다. 실제 구현은 backend /api/catalog 로 교체. */
export function loadCatalog(student: Pick<Student, "track1" | "track2" | "entryYear">): Promise<Catalog> {
  return new Promise((resolve) => setTimeout(() => resolve(buildCatalog(student)), 2600));
}

const realProfId = (sections?: RealSection[]) => {
  const name = sections?.[0]?.prof.split(/\s+/)[0] ?? "";
  return name && name !== "강사" && name !== "미정" ? `real:${name}` : "";
};

// ---------- 종합정보시스템 개설 과목 (2026-1·2, crawler/jongjeongsi 로 수집) ----------

type JsTermSection = RealSection & { term: 1 | 2 };

interface Offer {
  code: string;
  course: JsCourse;
  category: Category;
  grade: number;
  area?: string;
  sections: JsTermSection[];
}

const JS_TERMS: [JsSemester, 1 | 2][] = [
  ["2026-1", 1],
  ["2026-2", 2],
];

/** majors.ts 와 종합정보시스템의 영역 이름을 맞춘다 (계약학과 표기 등). */
const jsKey = (name: string) => normName(name.replace(/\(계약학과\)$/, ""));

const JS_INDEX = JS_TERMS.map(([sem, term]) => ({
  sem,
  term,
  majors: new Map(Object.entries(JS_MAJORS[sem]).map(([n, list]) => [jsKey(n), list])),
}));

/** 영역(트랙·학과·교양 영역)들의 1·2학기 개설 과목을 과목코드 하나로 모은다. */
function jsOffers(areaNames: string[], keep: (listing: JsListing) => boolean = () => true): Offer[] {
  const byCode = new Map<string, Offer>();
  for (const { sem, term, majors } of JS_INDEX) {
    for (const areaName of areaNames) {
      for (const listing of majors.get(jsKey(areaName)) ?? []) {
        if (!keep(listing)) continue;
        const [code, category, grade, area] = listing;
        const course = JS_COURSES[sem][code];
        if (!course) continue;
        let offer = byCode.get(code);
        if (!offer) byCode.set(code, (offer = { code, course, category, grade, area, sections: [] }));
        if (offer.sections.some((s) => s.term === term)) continue;
        offer.sections.push(...course.sections.map(({ sec, prof, time, room }) => ({ sec, prof, time, room, term })));
      }
    }
  }
  return [...byCode.values()];
}

const termsOf = (sections: JsTermSection[]) => [...new Set(sections.map((s) => s.term))];

/** 학기를 고르면 그 학기 분반만, 두 학기에 걸쳐 있으면 분반 이름 앞에 학기를 붙인다. */
function sectionsFor(offer: Offer, term?: 1 | 2): JsTermSection[] {
  const picked = term ? offer.sections.filter((s) => s.term === term) : [];
  const list = picked.length ? picked : offer.sections;
  return termsOf(list).length > 1 ? list.map((s) => ({ ...s, sec: `${s.term}학기 ${s.sec}` })) : list;
}

function jsCourse(offer: Offer, id: string, extra: Partial<Course>): Course {
  const terms = termsOf(offer.sections);
  const sections = sectionsFor(offer);
  return {
    id,
    name: offer.course.name,
    category: offer.category,
    credits: offer.course.credits,
    grade: offer.grade,
    term: terms.length === 1 ? terms[0] : undefined,
    tags: tagsFor(offer.course.name),
    professorId: realProfId(sections),
    source: "official",
    code: offer.code,
    sections,
    ...extra,
  };
}

/** 이 트랙(학과)의 실제 개설 전공 과목. 학년 구분 없는 과목(0)은 3학년 선택으로 둔다. */
function jsMajorCourses(name: string, slot: 1 | 2): Course[] {
  return jsOffers([name], ([, category]) => category.startsWith("전공")).map((o) =>
    jsCourse(o, `js-${slot}-${o.code}`, { grade: o.grade || 3, trackSlot: slot }),
  );
}

/** 종합정보시스템 교양 과목군 → 졸업요건의 선택필수교양 분야 */
const AREA_OF: Record<string, string> = {
  "예술과 체육": "예술과 스포츠",
  인문학: "인문학적 상상력",
  사회과학: "사회과학적 상상력",
  "자연과학 및 정보기술": "과학기술 상상력",
  융합교양: "융합적 상상력",
};

let jsElectivesCache: Course[] | null = null;

/** 실제 선택필수교양(분야별)·일반교양·일반선택 과목. 유학생용 한국어 집중 과목군은 뺀다. */
function jsLiberalElectives(): Course[] {
  if (jsElectivesCache) return jsElectivesCache;
  const areaCourses = jsOffers(["선택필수교양"])
    .filter((o) => AREA_OF[o.area ?? ""])
    .map((o) => jsCourse(o, `js-lib-${o.code}`, { category: "선택필수교양", grade: 0, group: AREA_OF[o.area!] }));
  const inArea = new Set(areaCourses.map((c) => c.code));
  const general = jsOffers(["일반교양", "일반선택"])
    .filter((o) => !inArea.has(o.code))
    .map((o) => jsCourse(o, `js-gen-${o.code}`, { category: "일반선택", grade: 0 }));
  return (jsElectivesCache = [...areaCourses, ...general]);
}

let jsRequiredCache: Offer[] | null = null;
const ROMAN_LEVEL = /\s*[ⅠⅡⅢⅣ]+$/;

/**
 * 필수교양은 학번별 요건 그룹이 붙은 목록을 그대로 쓰고 실제 분반만 붙인다.
 * 영어처럼 Ⅰ~Ⅲ 단계로 나뉜 과목은 단계를 분반 이름 앞에 적는다.
 */
function withRealSections(c: Course): Course {
  if (c.category !== "필수교양") return c;
  const key = normName(c.name);
  const matches = (jsRequiredCache ??= jsOffers(["교양필수"])).filter(
    (o) => normName(o.course.name.replace(ROMAN_LEVEL, "")) === key,
  );
  if (!matches.length) return c;
  const sections = matches.flatMap((o) => {
    const level = o.course.name.match(ROMAN_LEVEL)?.[0].trim();
    return sectionsFor(o, c.term).map((s) => (level ? { ...s, sec: `${level} ${s.sec}` } : s));
  });
  return { ...c, source: "official", code: matches[0]!.code, sections, professorId: realProfId(sections) || c.professorId };
}

/**
 * 트랙 전공 과목. 종합정보시스템에 이 트랙의 2026-1·2 개설 과목이 있으면 그걸 쓰고,
 * 없으면 2026-2 교육과정조회·책자, 그것도 없으면 샘플을 쓴다. AI응용학과는 학과 공식 교육과정에 실제 분반을 붙인다.
 */
export function majorCourses(ref: TrackRef, slot: 1 | 2): Course[] {
  const name = ref.track.name;
  const fam = ref.track.family;
  const sample = parseCourseLines(FAMILIES[fam], fam, slot).map((c) => ({ ...c, source: "sample" as const }));
  const book = BOOK_2026_2[name] ?? [];
  const bookByName = new Map(book.map((b) => [normName(b.name), b]));

  if (name === "AI응용학과") {
    const real = new Map(jsOffers([name]).map((o) => [normName(o.course.name), o]));
    return AI_CURRICULUM.map((r, i) => {
      const term = r.term === 0 ? undefined : r.term;
      const offer = real.get(normName(r.name));
      const b = !offer && r.term !== 1 ? bookByName.get(normName(r.name)) : undefined;
      const sections = offer ? sectionsFor(offer, term) : b?.sections;
      return {
        id: `ai-${slot}-${i}`,
        name: r.name,
        category: r.category,
        credits: offer?.course.credits ?? b?.credits ?? 3,
        grade: r.grade,
        term,
        tags: tagsFor(r.name),
        professorId: realProfId(sections),
        trackSlot: slot,
        source: "official" as const,
        code: offer?.code ?? b?.code,
        sections,
      };
    });
  }

  const js = jsMajorCourses(name, slot);
  if (js.length) {
    // 한 학기에만 자료가 있으면 나머지 학기는 샘플로 채운다.
    const covered = new Set(js.flatMap((c) => (c.term ? [c.term] : [1, 2])));
    return [...sample.filter((c) => !covered.has(c.term ?? 1)), ...js];
  }
  // 2026-2 교육과정조회(공식) — 2학기 전공은 이걸 기준으로, 분반·시간은 책자에서 붙인다.
  const cur = CUR_2026_2[name];
  if (cur?.length) {
    const official: Course[] = cur.map(([code, cname, g, category, credits], i) => {
      const b = bookByName.get(normName(cname));
      return {
        id: `cur-${slot}-${normName(name)}-${i}`,
        name: cname,
        category,
        credits,
        // 학년 구분 없는 과목(0)은 3학년 선택으로 둔다
        grade: g || 3,
        term: 2,
        tags: tagsFor(cname),
        professorId: realProfId(b?.sections),
        trackSlot: slot,
        source: "official" as const,
        code,
        sections: b?.sections,
      };
    });
    return [...sample.filter((c) => c.term === 1), ...official];
  }
  if (!book.length) return sample;
  const real: Course[] = book.map((b, i) => ({
    id: `book-${slot}-${normName(name)}-${i}`,
    name: b.name,
    category: b.category,
    credits: b.credits,
    grade: b.grade,
    term: 2,
    tags: tagsFor(b.name),
    professorId: realProfId(b.sections),
    trackSlot: slot,
    source: "book",
    code: b.code,
    sections: b.sections,
  }));
  return [...sample.filter((c) => c.term === 1), ...real];
}

export const profIdOf = (prof: string) => {
  const n = prof.split(/\s+/)[0] ?? "";
  return n && n !== "강사" && n !== "미정" ? `real:${n}` : "";
};

function realProfessors(courses: Course[], dept: (c: Course) => string): Professor[] {
  const out = new Map<string, Professor>();
  // 분반이 여러 개면 분반마다 다른 교수를 모두 등록한다.
  for (const c of courses) {
    const names = new Set<string>();
    if (c.professorId.startsWith("real:")) names.add(c.professorId.slice(5));
    for (const sec of c.sections ?? []) {
      const n = sec.prof.split(/\s+/)[0] ?? "";
      if (n && n !== "강사" && n !== "미정") names.add(n);
    }
    for (const n of names) {
      const id = `real:${n}`;
      if (!out.has(id)) out.set(id, { id, name: n, dept: dept(c), focus: "", papers: [], real: true });
    }
  }
  return [...out.values()];
}

export function buildCatalog(student: Pick<Student, "track1" | "track2" | "entryYear">): Catalog {
  const fam1 = student.track1.track.family;
  const courses: Course[] = [...majorCourses(student.track1, 1)];
  const families = new Set<Family>([fam1]);

  if (student.track2) {
    const fam2 = student.track2.track.family;
    const taken = new Set(courses.map((c) => normName(c.name)));
    // 같은 과목명은 제1트랙 쪽으로만 인정한다(데모 단순화).
    courses.push(...majorCourses(student.track2, 2).filter((c) => !taken.has(normName(c.name))));
    families.add(fam2);
  }
  // 필수교양은 학번별 요건 그룹이 붙은 목록에 실제 분반만 붙이고, 선택필수교양·일반선택은 실제 개설 과목으로 바꾼다.
  const liberal = student.entryYear % 100 >= 24 ? LIBERAL_COURSES_24 : LIBERAL_COURSES_19_23;
  const electives = jsLiberalElectives();
  courses.push(...liberal.filter((c) => c.category === "필수교양" || !electives.length).map(withRealSections), ...electives);

  const professors: Record<string, Professor> = {};
  for (const p of [...[...families].flatMap(familyProfessors), ...LIBERAL_PROFS]) professors[p.id] = p;
  const deptOf = (c: Course) =>
    (c.trackSlot === 2 ? student.track2?.track.name : c.trackSlot === 1 ? student.track1.track.name : "교양") ?? "";
  for (const p of realProfessors(courses, deptOf)) professors[p.id] = p;

  return { courses, activities: ACTIVITIES, professors };
}
