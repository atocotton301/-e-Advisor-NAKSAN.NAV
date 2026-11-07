// 한성대 종합정보시스템 개설 강좌·수업계획서 수집 스크립트 (브라우저 콘솔용)
//
// 사용법 (README.md 참고)
//   1. 본인 계정으로 종합정보시스템에 로그인한다. 이 스크립트는 아이디·비밀번호를 다루지 않는다.
//   2. 교무 → 「시간표 및 수업계획서조회」 화면을 연다.
//   3. 개발자 도구 콘솔에 이 파일 내용을 붙여 넣고 실행한다.
//   4. 끝나면 JSON 파일 3개가 내려받아진다 → 04_개발/naksan-nav/data/raw/jongjeongsi/ 로 옮긴다.
//
// 원칙
//   - 요청은 한 번에 하나씩, 약 1초 간격 (학교 서버 부담 최소화)
//   - 수업계획서의 교수 이메일·휴대전화·면담 장소·시간은 저장하지 않고,
//     자유 서술 칸의 이메일·전화번호 형태도 지운다.
//   - 로그인이 풀리는 등 연속 8번 실패하면 멈추고, 그때까지 모은 것을 _partial 파일로 내려받는다.

(async () => {
  const SEMESTERS = ["20261", "20262"]; // 1: 1학기, 2: 2학기, 3: 여름, 4: 겨울
  const GAP_MS = 900;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
  const PHONE = /(?:\+?82[-.\s]?)?0\d{1,2}[-.\s)]?\d{3,4}[-.\s]?\d{4}/g;
  const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
  const decode = (s) =>
    s.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&(amp|lt|gt|quot|apos);/g, (_, k) => ENT[k]);
  const clean = (v) =>
    typeof v === "string"
      ? decode(v).replace(/\r\n/g, "\n").replace(EMAIL, "[이메일 생략]").replace(PHONE, "[전화번호 생략]").trim()
      : v;

  const post = async (url, body) => {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
      body: new URLSearchParams(body),
      credentials: "same-origin",
      cache: "no-store",
    });
    if (!r.ok) throw new Error(`HTTP ${r.status} ${url}`);
    const buf = await r.arrayBuffer();
    const ct = (r.headers.get("content-type") || "").toLowerCase();
    const text = new TextDecoder(/euc-kr|ks_c_5601/.test(ct) ? "euc-kr" : "utf-8").decode(buf);
    return text.includes("�") ? new TextDecoder("euc-kr").decode(buf) : text;
  };
  const xml = (text) => new DOMParser().parseFromString(text, "text/xml");
  const download = (name, obj) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(obj)], { type: "application/json" }));
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    console.log("내려받음:", name);
  };

  // 1) 학기별 전공·교양 영역 → 개설 분반
  const timetable = { source: "info.hansung.ac.kr 종합정보시스템 「시간표 및 수업계획서조회」", collectedAt: new Date().toISOString(), semesters: {} };
  for (const yh of SEMESTERS) {
    const list = xml(await post("siganpyo_aui_data.jsp?gubun=jungonglist", { syearhakgi: yh }));
    const majors = [...list.querySelectorAll("item")].map((it) => ({
      code: it.querySelector("tcd").textContent.trim(),
      name: it.querySelector("tnm").textContent.replace(/^\[[^\]]*\]\s*/, "").trim(),
    }));
    const rows = {};
    for (const m of majors) {
      await sleep(GAP_MS);
      const text = await post("siganpyo_aui_data.jsp", { gubun: "history", syearhakgi: yh, sjungong: m.code });
      if (!text.includes("<rows")) throw new Error(`예상과 다른 응답 (로그인이 풀렸나요?) ${yh}/${m.code}`);
      rows[m.code] = [...xml(text).querySelectorAll("row")].map((r) => {
        const o = {};
        // c13·suup_pyunga 는 교직원 번호가 들어 있어 저장하지 않는다 (plan 은 계획서 조회용으로만 쓴다).
        for (const c of r.children) if (!["c12", "c13", "suup_pyunga"].includes(c.tagName)) o[c.tagName] = decode(c.textContent).trim();
        return o;
      });
    }
    timetable.semesters[yh] = { majors, rows };
    console.log(yh, "분반", Object.values(rows).flat().length);
  }
  download("hsu_timetable_2026.json", timetable);

  // 2) 수업계획서: 교수·과목 조합당 하나
  const pick = (d) => {
    const weeks = [];
    for (let i = 1; i <= 15; i++) {
      weeks.push({
        topic: clean(d[`j${i}juje`] || ""),
        online: clean(d[`j${i}onjuje`] || ""),
        m: ["t", "pt", "p", "d"].filter((k) => d[`j${i}${k}`] === "Y").join(","),
        flip: d[`j${i}f`] === "Y",
      });
    }
    const outcomes = [];
    for (let i = 1; i <= 5; i++) {
      const goal = clean(d[i === 1 ? "CMIF_PURPOSE" : `CMIF_PURPOSE_${i}`] || "");
      if (goal) outcomes.push({ goal, eval: clean(d[`B010EVALBASE${i}`] || "") });
    }
    return {
      year: d.data_year, term: d.hakgi, code: d.kwamok, name: clean(d.kwamokname), sec: d.bunban, status: d.statusnm,
      credit: clean(d.hakjum), time: clean(d.timeclassroom), target: clean(d.daesang), prof: clean(d.pname), dept: clean(d.sosok),
      competency: { creative: +d.creative || 0, energetic: +d.energetic || 0, networking: +d.networking || 0, trustful: +d.trustful || 0, efficient: +d.efficient || 0, ready: +d.readyjumsu || 0 },
      methods: [d.bangbup1, d.bangbup2, d.bangbup3, d.bangbup4, d.bangbup5].filter(Boolean),
      type: { offline: d.offlineyn, online: d.onlinetype, pbl: d.pbl, english: d.englishyn, ai: d.aiuse_yn, teamTeaching: d.team_teaching, industry: d.industry_yn, capstone: d.capston_yn },
      grading: { attendance: +d.gradec || 0, midterm: +d.gradej || 0, final: +d.gradek || 0, assignment: +d.gradeg || 0, presentation: +d.gradeb || 0, attitude: +d.gradet || 0 },
      overview: clean(d.gaeyo), goals: clean(d.mokpyo), prereq: clean(d.sunsu), book: clean(d.book), subbook: clean(d.subbook), notes: clean(d.gita),
      outcomes, weeks,
    };
  };

  for (const yh of SEMESTERS) {
    const plans = new Map();
    for (const r of Object.values(timetable.semesters[yh].rows).flat()) {
      if (!r.plan || r.plan === "x") continue;
      const key = `${r.kwamokcode}|${r.prof}`;
      if (!plans.has(key)) plans.set(key, r.plan);
    }
    const items = {};
    let failures = 0;
    let done = 0;
    for (const [key, plan] of plans) {
      await sleep(GAP_MS);
      try {
        const text = await post("suupplan_main_view_data.jsp", { type: "view", yearhakgi: plan.slice(0, 5), code: plan });
        const d = JSON.parse(text.slice(text.indexOf("{"))).data?.[0];
        items[key] = d ? pick(d) : null;
        failures = 0;
      } catch (e) {
        console.warn(key, e);
        if (++failures >= 8) {
          download(`hsu_syllabi_${yh.slice(0, 4)}-${yh.slice(4)}_partial.json`, { partial: true, semester: yh, items });
          throw new Error("연속 8번 실패해서 멈춥니다. 로그인 상태를 확인하세요.");
        }
      }
      if (++done % 100 === 0) console.log(yh, `수업계획서 ${done}/${plans.size}`);
    }
    download(`hsu_syllabi_${yh.slice(0, 4)}-${yh.slice(4)}.json`, {
      source: "info.hansung.ac.kr 종합정보시스템 수업계획서 (교수 이메일·휴대전화·면담 정보 제외)",
      collectedAt: new Date().toISOString(),
      semester: yh,
      items,
    });
  }
  console.log("끝. 내려받은 파일을 data/raw/jongjeongsi/ 로 옮기고 build_demo_data.mjs 를 실행하세요.");
})();
