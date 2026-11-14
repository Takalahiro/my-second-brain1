/* 五页流程。过夜三项只读 OVERNIGHT_FACTS，不把待核实改成已确认，不涂绿。
   折叠标题只给这一块一个等级，不给整座地点一个总分。 */
const FLOW_STEPS = [
  ["place", "1 选地点"],
  ["permit", "2 交通与许可"],
  ["gear", "3 准备装备"],
  ["route", "4 路线规划／进入地界"],
  ["review", "5 复盘记录"]
];

const FLOW_MODES = ["火车", "普通公交", "NSW TrainLink 长途客车", "渡轮", "步行", "船", "潜水船", "商业徒步接送", "预约出租车／私人接送", "开车"];

const FLOW_THIN = new Set(["wollemi", "kanangra", "budawang", "brogo", "barrington", "newengland", "jagungal", "pilot", "schlink", "gos", "nattai", "popran", "grose", "southbm"]);
const FLOW_ALPINE = new Set(["mainrange", "jagungal", "pilot", "schlink"]);
const FLOW_COAST = new Set(["northhead", "malabar", "solander", "royal", "bouddi", "shelly", "nadgee", "bare", "clovelly"]);

let flowPage = "place";
let flowPlace = "";
let flowGear = false;
let flowOpenRisk = "";

function flowEsc(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[ch]));
}

function flowPlaces() {
  const map = new Map();
  if (typeof OVERNIGHT_FACTS !== "undefined") {
    OVERNIGHT_FACTS.forEach((row) => {
      if (!map.has(row.id)) map.set(row.id, { id: row.id, name: row.place, rows: [] });
      map.get(row.id).rows.push(row);
    });
  }
  if (typeof SITES !== "undefined") {
    SITES.forEach((site) => {
      if (!map.has(site.id)) map.set(site.id, { id: site.id, name: site.name, rows: [] });
    });
  }
  return Array.from(map.values());
}

function flowCurrent() {
  return flowPlaces().find((place) => place.id === flowPlace) || null;
}

function flowSite(id) {
  if (typeof SITES === "undefined") return null;
  return SITES.find((site) => site.id === id) || null;
}

function flowDive(id) {
  if (id === "solander") return true;
  const site = flowSite(id);
  const text = site ? `${site.summary || ""} ${(site.do || []).map((item) => item.text).join(" ")} ${(site.dont || []).join(" ")}` : "";
  return /下水|浮潜|潜水/.test(text);
}

function flowFactState(row) {
  if (row.fact === "可以独自徒步") return "待核实";
  return row.state || "待核实";
}

function flowUrls(source) {
  return String(source || "").split(/[；;]/).map((part) => part.trim()).filter((part) => /^https?:\/\//.test(part));
}

function flowOvernightHtml(place) {
  const rows = place && place.rows ? place.rows : [];
  if (!rows.length) {
    return `<section class="overnight"><h3>过夜三项</h3><p>这一处不在 overnight_facts.js 的 103 处里。不另写许可。</p></section>`;
  }
  const lines = rows.map((row) => {
    const state = flowFactState(row);
    const urls = flowUrls(row.source).map((url) => `<a href="${flowEsc(url)}" target="_blank" rel="noreferrer">${flowEsc(url)}</a>`).join("<br>");
    const quote = row.quote
      ? `<blockquote>${flowEsc(row.quote)}</blockquote>`
      : `<p class="note">这一项没有摘录原文。</p>`;
    return `<article class="fact overnight-row" data-overnight-state="${flowEsc(state)}">
      <p><strong>${flowEsc(row.fact)}。</strong> ${flowEsc(state)}。核实日期 ${flowEsc(row.checked || "")}。已确认只表示记录里有这句原文，不涂绿，也不是已经允许过夜。</p>
      ${quote}
      <p class="factmeta">${urls || flowEsc(row.source || "无链接")}</p>
    </article>`;
  }).join("");
  return `<section class="overnight"><h3>过夜三项</h3><p class="note">原文照 overnight_facts.js。可以独自徒步保持待核实。营地句子不是过夜许可。不涂绿。</p>${lines}</section>`;
}

function flowModeHtml(place) {
  const row = typeof TRANSIT !== "undefined" ? TRANSIT[place.id] : null;
  const lines = FLOW_MODES.map((label) => {
    let text = "未查到可行班次。最后一段交通未落实。不是可达。";
    if (label === "船" || label === "潜水船") {
      text = flowDive(place.id) || FLOW_COAST.has(place.id)
        ? "未查到可行班次。需询价。不是可达。"
        : "此地区无水面出入口";
    }
    if (label === "开车") text = "页面没有把开车写成已经核实的入口路线。费用需询价。不是公共交通可达。";
    if (label === "步行") text = "没有核实负重步行是否合适。地图上的线不能当证明。最后一段交通未落实。";
    if (label === "预约出租车／私人接送") text = "未查到可行班次。费用需询价。";
    if (row && row.ok && (label === "普通公交" || label === "火车" || label === "渡轮")) {
      const kinds = (row.lines || []).map((line) => line.mode);
      const hit = (label === "普通公交" && kinds.includes("公交"))
        || (label === "火车" && kinds.includes("火车"))
        || (label === "渡轮" && kinds.includes("轮渡"));
      if (hit) {
        const codes = (row.lines || []).filter((line) => (
          (label === "普通公交" && line.mode === "公交")
          || (label === "火车" && line.mode === "火车")
          || (label === "渡轮" && line.mode === "轮渡")
        )).map((line) => line.code).filter(Boolean).join("、");
        text = `已有查询快照写到 ${flowEsc(row.alight || "下车点")}，班次代号 ${flowEsc(codes || "未写代号")}。这是去程快照，不是末班，也不是步道口。返程未落实。最后一段交通未落实。不是可达。来源 ${flowEsc(row.url || "无链接")}｜${flowEsc(row.at || "")}`;
      }
    }
    return `<p><strong>${flowEsc(label)}。</strong> ${text}</p>`;
  }).join("");
  return `<section class="modes"><h3>可能通行方式</h3>${lines}</section>`;
}

function flowLevel(text) {
  if (text === "低" || text === "中" || text === "高" || text === "未知") return text;
  return "未知";
}

function flowScore(lines) {
  const levels = lines.map((line) => line.level);
  const unknown = levels.some((level) => level === "未知");
  let score = "未知";
  if (levels.some((level) => level === "高")) score = "高";
  else if (levels.some((level) => level === "中")) score = "中";
  else if (levels.length && levels.every((level) => level === "低")) score = "低";
  return unknown ? `${score} · 含未查项` : score;
}

const FLOW_URBAN = new Set(["wolli", "lights", "oatley", "saltpan", "clifton", "gordons", "northhead", "shelly", "bare", "longreef", "deewhy", "narrabeen", "manlydam", "malabar", "solander"]);
const FLOW_COND = new Set(["blue", "grose", "heathcote", "royal", "crosslands", "gos", "kuringgai"]);
const FLOW_REMOTE = new Set(["mainrange", "jagungal", "schlink", "pilot", "wollemi", "kanangra", "nattai", "budawang", "barrington", "newengland", "nadgee"]);
const FLOW_SOLANDER = "已查来源 https://www.divesites.com.au/dive-site/whale-watching-rockfall-cape-solander";

function flowLine(name, value, note, level) {
  return { name, value, note, level: level || "未知" };
}

function flowHumanLines(place) {
  const id = place.id;
  const urban = FLOW_URBAN.has(id);
  const conditional = FLOW_COND.has(id);
  const remote = FLOW_REMOTE.has(id);
  const thinSpeak = FLOW_THIN.has(id) && !conditional;
  const user = "用户归纳 2026-11-13";
  const lines = [
    "人流", "是否有工作人员", "是否有固定巡逻", "手机信号", "是否有照明",
    "最近有人居住点", "最近警察或医疗点", "夜间是否容易撤离",
    "是否常见车辆、猎人或伐木活动", "营地是否有其他露营者", "是否适合独自白天",
    "是否适合独自过夜", "是否需要让他人知道具体路线", "是否建议使用卫星通信器",
    "人际风险", "孤立风险", "撤离难度", "财物风险", "夜间风险"
  ].map((name) => flowLine(name, "未知", name === "手机信号" ? "未知。没有信号分数。" : "未知", "未知"));
  const set = (name, value, note, level) => {
    const row = lines.find((line) => line.name === name);
    if (!row) return;
    row.value = value;
    row.note = note;
    row.level = level || "未知";
  };
  if (urban) {
    set("是否适合独自过夜", "否", `${user}。不是自由扎营。`, "未知");
    set("财物风险", "车站、停车场和营地有盗窃", user, "未知");
    set("夜间风险", "天黑以后人变少，照明差", user, "未知");
    set("人际风险", "偶尔有醉酒或骚扰", user, "未知");
    set("孤立风险", "崖边和安静小径没有旁人", user, "未知");
  }
  if (conditional) {
    set("是否适合独自过夜", "有条件", `${user}。选已预订的官方营地，白天到达，待在清楚的步道附近。不是一律可以。`, "未知");
  }
  if (remote) {
    set("孤立风险", "高", `${user}。人少不等于更安全。没有打开的页面把这一项写成更低。`, "高");
    set("撤离难度", "高", `${user}。没有打开的页面把这一项写成更低。`, "高");
    if (!conditional) {
      set("是否适合独自过夜", thinSpeak ? "否" : "有条件", thinSpeak ? `${user}。人为安全：资料不足／不建议独自过夜。` : `${user}。不是一律可以。`, "未知");
    }
  }
  if (thinSpeak) {
    lines.unshift(flowLine("人为安全", "人为安全：资料不足／不建议独自过夜", user, "未知"));
    if (!remote) set("是否适合独自过夜", "否", `${user}。人为安全：资料不足／不建议独自过夜。`, "未知");
  }
  if (id === "wolli") {
    lines.push(flowLine(
      "刑事案件",
      "未查到公开刑事案件",
      "检索：Wolli Creek Regional Park theft OR assault OR illegal camping NSW police。2026-11-13。打开的结果没有点名沃利溪。这不是没有发生过。",
      "未知"
    ));
  } else {
    lines.push(flowLine("刑事案件", "未知", "这一处的刑事案件还没有检索。不写成没有发生过。", "未知"));
  }
  return lines;
}

function flowRiskLines(place) {
  const alpine = FLOW_ALPINE.has(place.id);
  const coast = FLOW_COAST.has(place.id) || flowDive(place.id);
  const human = flowHumanLines(place);
  const terrain = ["悬崖", "落石", "陡坡", "废矿井或旧工程", "迷路", "离步道"].map((name) => flowLine(name, "未知", "未知", "未知"));
  const weather = [
    ["高温", "未知"],
    ["暴雨", "未知"],
    ["洪水或涨水", "未知"],
    ["火险或全面禁火", "未知"],
    ["大风", "未知"],
    ["冬季冰雪", alpine ? "未知" : "此季不作此项"]
  ].map(([name, value]) => flowLine(name, value, value === "此季不作此项" ? "此季不作此项" : "未查到", value === "此季不作此项" ? "跳过" : "未知"));
  const water = [
    flowLine("饮用水", "未知", "未知。未知的水不能当饮用水。溪不是饮用水。", "未知"),
    flowLine("需处理的天然水", "未知", "未知", "未知"),
    flowLine("污染或集水区", "未知", "未知", "未知"),
    flowLine("离岸流或沙洲", coast ? "未知" : "无此水面", coast ? "未知" : "无此水面", coast ? "未知" : "跳过"),
    flowLine("船击", coast ? "未知" : "无此水面", coast ? "未知" : "无此水面", coast ? "未知" : "跳过")
  ];
  const animal = [
    flowLine("蛇", "未知", "未写明", "未知"),
    flowLine("海洋刺胞或鲨鱼", "未写明", "页面没有在这一处把某一种写成危险。不写接近方法。", "未知"),
    flowLine("其他危险动物", "未写明", "页面没有在这一处点名。", "未知")
  ];
  const traffic = [
    flowLine("最后一段是否落实", "最后一段交通未落实", "不是可达。", "未知"),
    flowLine("错过末班后能否离开", "未知", "未知", "未知"),
    flowLine("夜间步行是否沿机动车道", "未知", "未知", "未知"),
    flowLine("是否需要船或潜水船", flowDive(place.id) ? "未知" : (coast ? "未知" : "未查到需要潜水船"), "未知", "未知")
  ];
  if (place.id === "solander") {
    const cliff = terrain.find((line) => line.name === "悬崖");
    const rock = terrain.find((line) => line.name === "落石");
    const wind = weather.find((line) => line.name === "大风");
    const boat = water.find((line) => line.name === "船击");
    const needBoat = traffic.find((line) => line.name === "是否需要船或潜水船");
    if (cliff) {
      cliff.value = "页面写 Kurnell 崖壁很陡，潜点在明显岩崩下方";
      cliff.note = FLOW_SOLANDER;
      cliff.level = "高";
    }
    if (rock) {
      rock.value = "页面用岩崩称呼这一处水下参照";
      rock.note = FLOW_SOLANDER;
      rock.level = "高";
    }
    if (wind) {
      wind.value = "页面写要避开强南风、东南涌和午后东北风";
      wind.note = FLOW_SOLANDER;
      wind.level = "高";
    }
    if (boat) {
      boat.value = "页面把沿崖的船只和渔船写成危险";
      boat.note = FLOW_SOLANDER;
      boat.level = "高";
    }
    if (needBoat) {
      needBoat.value = "页面写 Whale Watching Rockfall 只能船进";
      needBoat.note = `${FLOW_SOLANDER}。观鲸台的最后一段仍是最后一段交通未落实。不是可达。`;
      needBoat.level = "高";
    }
  }
  return { human, terrain, weather, water, animal, traffic };
}

function flowDiveLines(id) {
  if (id === "solander") {
    return [
      flowLine("岸上财物", "未知", "打开的潜点页没有写岸上盗窃。", "未知"),
      flowLine("船潜是否依赖潜店和船长", "页面写没有常规包船，是私人船或俱乐部", FLOW_SOLANDER, "高"),
      flowLine("是否允许单人", "未知", "Tec 45 不是独自许可。页面没有写可以单人技术潜。", "未知"),
      flowLine("洞穴或沉船穿透", "不允许", `${FLOW_SOLANDER}。页面写有可以游穿的洞穴和头顶环境。不把这句话写成允许穿透，也不写进入步骤。`, "高"),
      flowLine("气体与撤离计划", "页面写超过 25 米算深潜，要看免减压时间和气体", FLOW_SOLANDER, "高")
    ];
  }
  return [
    flowLine("岸上财物", "未知", "未知", "未知"),
    flowLine("船潜是否依赖潜店和船长", "未知", "未知", "未知"),
    flowLine("是否允许单人", "未知", "Tec 45 不是独自许可。", "未知"),
    flowLine("洞穴或沉船穿透", "不允许", "没有打开写明限制的页面，不标成允许。", "未知"),
    flowLine("气体与撤离计划", "未知", "未知", "未知")
  ];
}

function flowRiskHtml(place) {
  const blocks = flowRiskLines(place);
  const pack = [
    ["人为", blocks.human],
    ["地形", blocks.terrain],
    ["天气与火", blocks.weather],
    ["水", blocks.water],
    ["动物", blocks.animal],
    ["交通", blocks.traffic]
  ];
  const details = pack.map(([title, lines]) => {
    const open = flowOpenRisk === `${place.id}:${title}` ? " open" : "";
    const body = lines.map((line) => {
      const grade = line.level === "跳过" ? "" : `等级 ${flowEsc(line.level)}。`;
      return `<p><strong>${flowEsc(line.name)}。</strong> ${flowEsc(line.value)}。${grade} ${flowEsc(line.note)}</p>`;
    }).join("");
    return `<details class="risk-block" data-risk="${flowEsc(title)}"${open}><summary>${flowEsc(title)} · ${flowEsc(flowScore(lines.filter((line) => line.level !== "跳过")))}</summary>${body}</details>`;
  }).join("");
  const diveLines = flowDiveLines(place.id);
  const dive = flowDive(place.id)
    ? `<details class="risk-block" data-risk="潜水"${flowOpenRisk === `${place.id}:潜水` ? " open" : ""}><summary>潜水 · ${flowEsc(flowScore(diveLines))}</summary>
      ${diveLines.map((line) => `<p><strong>${flowEsc(line.name)}。</strong> ${flowEsc(line.value)}。等级 ${flowEsc(line.level)}。 ${flowEsc(line.note)}</p>`).join("")}
      <p>课程证书不自动等于任何潜点的准入资格。实际深度、气体、穿透、船潜、洞穴和沉船限制，还要看训练机构、潜水运营商、当地规则和个人近期经验。</p>
    </details>`
    : `<p class="nondive" data-risk="非潜水地点">潜水：非潜水地点</p>`;
  return `<section class="risks" data-place="${flowEsc(place.id)}"><h3>风险</h3><p class="note">折叠时每块一个等级。没有整座地点的总分。未知不是安全，也不是禁止。</p>${details}${dive}</section>`;
}

function flowGate(reason) {
  return `<p class="gate" data-gate="${flowEsc(reason)}">还不能继续。${flowEsc(reason)}</p>`;
}

function flowListHtml() {
  const places = flowPlaces();
  const rows = places.map((place) => {
    const thin = FLOW_THIN.has(place.id) ? "公开资料不足／未充分调查" : "";
    return `<button type="button" class="row flow-place ${thin ? "thin" : ""}" data-flow-place="${flowEsc(place.id)}">
      <span><strong>${flowEsc(place.name)}</strong><em>${flowEsc(place.id)}</em><small>${flowEsc(thin || "过夜三项在交通与许可里")}</small></span>
    </button>`;
  }).join("");
  const current = flowCurrent();
  return `<div class="page flow-page"><h2>选地点</h2><p class="count">${places.length} 处。待核实保持灰色，不涂绿。</p>
    <div class="flow-split"><div class="flow-list">${rows}</div><div class="flow-side">${current ? `<h3>${flowEsc(current.name)}</h3>${flowRiskHtml(current)}` : `<p>先选一处。没有选中地点时，交通与许可打不开。</p>`}</div></div></div>`;
}

function flowPermitHtml() {
  const place = flowCurrent();
  if (!place) return `<div class="page flow-page"><h2>交通与许可</h2>${flowGate("没有选中地点，不能打开交通与许可。")}</div>`;
  return `<div class="page flow-page"><h2>交通与许可 · ${flowEsc(place.name)}</h2>
    <p class="note">最后一段交通未落实不是可达。不从 Central 或 Chippendale 画线。</p>
    ${flowModeHtml(place)}
    ${flowAccessHtml(place)}
    ${flowOvernightHtml(place)}
    ${flowRiskHtml(place)}
    ${flowFaunaHtml(place)}
    <p>可执行路线：交通和许可没有核实完，不能标成可执行路线。</p></div>`;
}

function flowGearHtml() {
  const place = flowCurrent();
  const layers = typeof gearLayersHtml === "function" ? gearLayersHtml() : "";
  const dive = typeof diveKitHtml === "function" ? diveKitHtml() : "";
  const lead = `<p class="gear-lead">所有装备都是可选项。你自己勾这次带着，也可以一件都不带。</p>`;
  const ready = `<label><input id="flowGear" type="checkbox" ${flowGear ? "checked" : ""}> 我选完了，按当前勾选进入路线规划</label>
    <p class="note">${flowGear ? "装备已准备。路线规划可以打开。" : "装备未准备，不能打开路线规划。"}</p>`;
  if (!place) return `<div class="page flow-page"><h2>准备装备</h2>${lead}${flowGate("没有选中地点。")}${layers}${dive}</div>`;
  return `<div class="page flow-page"><h2>准备装备 · ${flowEsc(place.name)}</h2>
    ${lead}
    ${ready}
    ${layers}
    ${dive}
  </div>`;
}

function flowRouteHtml() {
  const place = flowCurrent();
  if (!place) return `<div class="page flow-page"><h2>路线规划／进入地界</h2>${flowGate("没有选中地点。")}</div>`;
  if (!flowGear) return `<div class="page flow-page"><h2>路线规划／进入地界</h2>${flowGate("装备未准备，不能打开路线规划。")}</div>`;
  const site = flowSite(place.id);
  if (!site) {
    return `<div class="page flow-page"><h2>路线规划／进入地界 · ${flowEsc(place.name)}</h2>
      <p>没有核实过的入口坐标。不放公园中心图钉，不画线，不从 Central 或 Chippendale 出发。</p>
      <p>总距离、爬升、徒步时间、水量都未测。没有撤退点和返回点，不能标成已准备。</p></div>`;
  }
  return `<div class="page flow-page"><h2>路线规划／进入地界 · ${flowEsc(place.name)}</h2>
    <p>打开原来的路线页。落点、拖动、插入、删除和快捷键仍在那一页。不从 Central 或 Chippendale 画线。</p>
    <button type="button" data-flow-enter="${flowEsc(place.id)}">进入这一处的路线图</button>
    <p>总距离、爬升、徒步时间、水量都未测。没有撤退点和返回点，不能标成已准备。</p></div>`;
}

function flowReviewHtml() {
  let text = "";
  try { text = localStorage.getItem("caolou-review") || ""; } catch (error) { text = ""; }
  return `<div class="page flow-page"><h2>复盘记录</h2>
    <p class="note">这里只记这次走完以后你自己写的内容。不预填任何旧行程。</p>
    <textarea id="flowReview" rows="8">${flowEsc(text)}</textarea></div>`;
}

function flowMenu() {
  document.querySelectorAll(".steps button").forEach((button) => {
    button.classList.toggle("on", button.dataset.flow === flowPage);
    if (button.dataset.flow === "permit") button.disabled = !flowPlace;
    if (button.dataset.flow === "route") button.disabled = !flowPlace || !flowGear;
  });
}

function flowBlob(id) {
  const bits = [];
  const site = flowSite(id);
  if (site) bits.push(site.name, site.en, site.park, site.summary, site.access, ...(site.dont || []), ...(site.do || []).map((item) => `${item.t} ${item.text}`));
  if (typeof BRIEF_PLACES !== "undefined") {
    const area = BRIEF_PLACES.find((item) => item.id === id);
    if (area) bits.push(area.name, area.why, area.enter);
  }
  if (typeof CAMP_AREAS !== "undefined") {
    const area = CAMP_AREAS.find((item) => item.id === id);
    if (area) bits.push(area.name);
  }
  return bits.filter(Boolean).join(" ");
}

function flowTags(id) {
  const tags = new Set();
  const blob = flowBlob(id);
  if (FLOW_THIN.has(id)) tags.add("thin");
  if (FLOW_ALPINE.has(id) || id === "solitary") tags.add("alpine");
  if (FLOW_COND.has(id) || FLOW_REMOTE.has(id) || id === "euroka" || id === "solitary" || id === "southbm" || (typeof CAMP_AREAS !== "undefined" && CAMP_AREAS.some((area) => area.id === id))) tags.add("night");
  if (flowDive(id)) tags.add("scuba");
  if (id === "solander") tags.add("tec");
  if (/崖|峡谷|岩壁|岩台|落石|岩崩/.test(blob) || ["kanangra", "grose", "bangalley", "gordons", "solander", "capebanks"].includes(id)) tags.add("rock");
  const site = flowSite(id);
  if (site) {
    tags.add("hike");
    tags.add("photo");
    const themes = site.themes || [];
    const animals = (typeof FIELD !== "undefined" && FIELD[id] && FIELD[id].animals) || [];
    if (animals.length || themes.some((theme) => ["鸟", "鲸", "有袋类", "湿地", "海洋"].includes(theme))) tags.add("watch");
  } else if (/步道|徒步|walking|track|国家公园|Wilderness|campground/i.test(blob)) {
    tags.add("hike");
  }
  const fauna = typeof PLACE_FAUNA !== "undefined" ? PLACE_FAUNA[id] : null;
  if (fauna && fauna.animals && fauna.animals.length) tags.add("watch");
  return tags;
}

function flowCatalog() {
  const map = new Map();
  const put = (id, name) => {
    if (id && !map.has(id)) map.set(id, name || id);
  };
  if (typeof SITES !== "undefined") SITES.forEach((site) => put(site.id, site.name));
  if (typeof OVERNIGHT_FACTS !== "undefined") OVERNIGHT_FACTS.forEach((row) => put(row.id, row.place));
  if (typeof BRIEF_PLACES !== "undefined") BRIEF_PLACES.forEach((area) => put(area.id, area.name));
  if (typeof CAMP_AREAS !== "undefined") CAMP_AREAS.forEach((area) => put(area.id, area.name));
  return Array.from(map, ([id, name]) => ({ id, name, tags: flowTags(id) }));
}

function flowFaunaHtml(place) {
  const site = flowSite(place.id);
  if (site && typeof animalHtml === "function") return animalHtml(site);
  const row = typeof PLACE_FAUNA !== "undefined" ? PLACE_FAUNA[place.id] : null;
  if (!row || row.empty || !row.animals || !row.animals.length) {
    const empty = row && row.empty ? row.empty : "这一处没有已保存的动物记录。";
    return `<section id="seeLife"><h3>能看到什么</h3><p>${flowEsc(empty)}</p></section>`;
  }
  const realms = ["水中", "地面", "飞禽"];
  const body = `<h4>未分级</h4>${realms.map((realm) => {
    const list = row.animals.filter((animal) => (typeof animalRealm === "function" ? animalRealm(animal.id) : "地面") === realm);
    if (!list.length) return "";
    const cards = list.map((animal) => {
      const info = typeof SPECIES !== "undefined" ? SPECIES[animal.id] : null;
      const name = info && info.name ? info.name : animal.id;
      return `<article class="animal"><div><h3>${flowEsc(name)}</h3><p>${flowEsc(animal.note || "")}</p><p class="note">${flowEsc(realm)} · 未分级。不记坐标。</p></div></article>`;
    }).join("");
    return `<h5>${realm}</h5>${cards}`;
  }).join("")}`;
  const source = row.source ? `<p class="factmeta">已查来源 ${flowEsc(row.source)}</p>` : "";
  return `<section id="seeLife"><h3>能看到什么</h3><p class="note">分档只用记录里的原词。对不上四档的放在未分级。每一档下面再按水中、地面、飞禽。</p>${source}${body}</section>`;
}

function flowAccessHtml(place) {
  const site = flowSite(place.id);
  if (site && typeof accessSiteCard === "function") return accessSiteCard(site);
  if (typeof accessWildCard === "function" && typeof CAMP_AREAS !== "undefined" && CAMP_AREAS.some((area) => area.id === place.id)) return accessWildCard(place.id);
  if (typeof accessBlackheathCard === "function" && place.id === "blackheath-station") return accessBlackheathCard();
  if (typeof accessLithgowCard === "function" && place.id === "lithgow-station") return accessLithgowCard();
  return `<section class="access-card" data-access-place="${flowEsc(place.id)}"><h3>前往卡</h3><p>这一处没有已写好的前往卡。最后一段交通未落实。不是可达。</p></section>`;
}

function flowRecordHtml(place) {
  const bits = [];
  if (typeof offtrackFactHtml === "function") bits.push(offtrackFactHtml(place.id));
  bits.push(flowRiskHtml(place), flowFaunaHtml(place));
  if (typeof CAMP_AREAS !== "undefined" && CAMP_AREAS.some((area) => area.id === place.id) && typeof campRouteHtml === "function") {
    bits.push(`<div class="camp-inline">${campRouteHtml(place.id)}</div>`);
  } else if (typeof briefPlace === "function" && briefPlace(place.id)) {
    const area = briefPlace(place.id);
    const source = /^https?:/.test(area.source || "")
      ? `<a href="${flowEsc(area.source)}" target="_blank" rel="noreferrer">${flowEsc(area.source)}</a>`
      : flowEsc(area.source || "无链接");
    const quotes = (area.quotes || []).map((line) => `<blockquote>${flowEsc(line)}</blockquote>`).join("");
    bits.push(`<section class="overnight"><h3>已保存的候选记录</h3><p><strong>${flowEsc(area.status || "")}</strong> ${flowEsc(area.why || "")}</p>${quotes}<p class="factmeta">来源 ${source}｜核实日期 ${flowEsc(area.checked || "")}｜入口 ${flowEsc(area.enter || "待核实")}｜交通 ${flowEsc(area.transit || "待核实")}｜扎营 ${flowEsc(area.camp || "待核实")}</p></section>`);
  }
  return bits.join("");
}

function flowCatsOn() {
  return Array.from(document.querySelectorAll("[data-flow-cat]:checked")).map((box) => box.dataset.flowCat);
}

function flowApplyCats() {
  const side = document.getElementById("side");
  if (!side) return;
  const previous = document.getElementById("flowExtras");
  if (previous) previous.remove();
  const chosen = flowCatsOn();
  side.querySelectorAll("button[data-id]").forEach((button) => {
    if (button.closest("#placeDock")) return;
    const tags = flowTags(button.dataset.id);
    const show = !chosen.length || chosen.some((tag) => tags.has(tag));
    button.hidden = !show;
  });
  const brief = document.getElementById("briefPlaces");
  if (brief) {
    const visible = brief.querySelectorAll("button[data-id]:not([hidden])").length;
    brief.hidden = chosen.length > 0 && visible === 0;
  }
  if (!chosen.length) return;
  const present = new Set(Array.from(side.querySelectorAll("button[data-id]")).map((button) => button.dataset.id));
  const extras = flowCatalog().filter((item) => !present.has(item.id) && chosen.some((tag) => item.tags.has(tag)));
  const html = extras.length
    ? `<div id="flowExtras">${extras.map((item) => `<button type="button" class="row" data-act="open" data-id="${flowEsc(item.id)}"><span><strong>${flowEsc(item.name)}</strong><small>类别里的已有地点</small></span></button>`).join("")}</div>`
    : "";
  const matched = side.querySelectorAll("button[data-id]:not([hidden])").length + extras.length;
  const empty = side.querySelector(".empty");
  if (empty && matched) empty.remove();
  if (!html) return;
  const dock = document.getElementById("placeDock");
  if (dock) dock.insertAdjacentHTML("afterend", html);
  else side.insertAdjacentHTML("afterbegin", html);
}

function flowPinNote() {
  if (flowPage !== "place") return;
  const side = document.getElementById("side");
  if (!side) return;
  const oldDock = document.getElementById("placeDock");
  if (oldDock) oldDock.remove();
  let note = document.getElementById("flowPickNote");
  if (!note) {
    side.insertAdjacentHTML("afterbegin", `<p id="flowPickNote" class="gate"></p>`);
    note = document.getElementById("flowPickNote");
  }
  note.textContent = flowPlace
    ? "已选地点。交通与许可可以打开。步行不从 Chippendale 或 Central 画。公共交通只画查到坐标的站。"
    : "先选一处。没有选中地点时，交通与许可打不开。";
  const place = flowCurrent();
  if (place) note.insertAdjacentHTML("afterend", `<section id="placeDock"><h3>${flowEsc(place.name)}</h3>${flowRecordHtml(place)}</section>`);
  side.querySelectorAll(".row[data-id]").forEach((button) => {
    button.classList.toggle("on", button.dataset.id === flowPlace);
    if (FLOW_THIN.has(button.dataset.id)) button.classList.add("thin");
  });
  flowApplyCats();
  flowOfftrackRest();
}

function flowOfftrackRest() {
  if (typeof OFFTRACK === "undefined" || typeof campOn !== "undefined" && campOn) return;
  const side = document.getElementById("side");
  if (!side) return;
  const old = document.getElementById("offtrackRest");
  if (old) old.remove();
  const present = new Set(Array.from(side.querySelectorAll("[data-id]")).map((node) => node.dataset.id));
  const missing = OFFTRACK.filter((row) => !present.has(row.id));
  if (!missing.length) return;
  const html = missing.map((row) => `<button type="button" class="row" data-act="open" data-id="${flowEsc(row.id)}">
      <span><strong>${flowEsc(row.name)}</strong>${typeof offtrackLabelHtml === "function" ? offtrackLabelHtml(row.id) : ""}</span>
    </button>`).join("");
  side.insertAdjacentHTML("beforeend", `<div id="offtrackRest"><h3>没有地图图钉的地点</h3><p class="note">离开步道只按打开过的页面。未知不是允许。</p>${html}</div>`);
}

function flowPickPlace(id) {
  flowPlace = id;
  flowPage = "place";
  if (typeof campOn !== "undefined") campOn = false;
  try { localStorage.setItem("caolou-site", id); } catch (error) { /* 选中仍留在这一页 */ }
  if (typeof activeId !== "undefined") activeId = id;
  flowMenu();
  if (typeof view !== "undefined" && view === "atlas" && typeof renderSide === "function") {
    renderSide();
    if (typeof syncMarkers === "function") syncMarkers(false);
  } else {
    flowPinNote();
  }
}

function flowBasemap() {
  if (typeof map === "undefined" || !map || typeof L === "undefined" || document.getElementById("flowBase")) return;
  const box = L.DomUtil.create("div", "flowbase");
  box.id = "flowBase";
  box.innerHTML = `<button type="button" data-act="layer" data-layer="street">街道</button><button type="button" data-act="layer" data-layer="sat">卫星</button><button type="button" data-act="layer" data-layer="topo">地形</button>`;
  L.DomEvent.disableClickPropagation(box);
  const control = L.control({ position: "topleft" });
  control.onAdd = () => box;
  control.addTo(map);
  const saved = localStorage.getItem("caolou-layer");
  const name = saved === "street" || saved === "sat" || saved === "topo" ? saved : "sat";
  if (typeof setBase === "function") setBase(name);
}

function flowFitMap() {
  if (typeof map === "undefined" || !map) return;
  map.invalidateSize(true);
}

function flowShowAtlas() {
  const filters = document.getElementById("filters");
  if (filters) filters.hidden = false;
  const host = document.getElementById("view");
  const node = host && host.querySelector("#map");
  const live = node && typeof map !== "undefined" && map && map.getContainer && map.getContainer() === node;
  if (!live) {
    if (typeof map !== "undefined" && map) {
      try { map.remove(); } catch (error) { /* 旧节点已经拆掉 */ }
    }
    if (typeof destroyMap === "function") destroyMap();
    if (typeof setView === "function") setView("atlas");
  }
  flowBasemap();
  flowPinNote();
  flowMenu();
  requestAnimationFrame(flowFitMap);
  setTimeout(flowFitMap, 60);
  setTimeout(flowFitMap, 300);
}

function flowDropMap() {
  if (typeof map !== "undefined" && map) {
    try { map.remove(); } catch (error) { /* 地图节点已经不在 */ }
  }
  if (typeof destroyMap === "function") destroyMap();
}

function flowRender() {
  const host = document.getElementById("view");
  if (!host) return;
  if (flowPage === "place") {
    flowShowAtlas();
    return;
  }
  if (typeof parkFilters === "function") parkFilters();
  const filters = document.getElementById("filters");
  if (filters) filters.hidden = true;
  flowDropMap();
  if (flowPage === "permit") host.innerHTML = flowPermitHtml();
  else if (flowPage === "gear") host.innerHTML = flowGearHtml();
  else if (flowPage === "route") host.innerHTML = flowRouteHtml();
  else host.innerHTML = flowReviewHtml();
  flowMenu();
}

function flowMount() {
  const list = document.querySelector(".steps");
  if (!list || document.getElementById("flowReady")) return;
  list.innerHTML = FLOW_STEPS.map(([id, label]) => `<li><button type="button" data-flow="${id}" id="${id === "permit" ? "stepPermit" : id === "route" ? "stepRoute" : ""}">${label}</button></li>`).join("");
  list.id = "flowReady";
  const style = document.createElement("style");
  style.textContent = `.flow-page{padding:16px 20px 40px}.flow-split{display:grid;grid-template-columns:minmax(240px,340px) minmax(0,1fr);gap:16px}.flow-list{max-height:70vh;overflow:auto}.flow-place.thin,.row.thin{background:#2a2a28;color:#c8c2b4}.row.on{box-shadow:inset 3px 0 0 #c8c2b4}.atlas{height:100%;min-height:0}.atlas .mapstage{height:100%;min-height:0}.flowbase{display:flex;gap:4px}.flowbase button{background:#10120e;color:#f3f0e6;border:1px solid #f3f0e6;padding:4px 8px}.flowbase button.on{background:#f3f0e6;color:#10120e}.overnight-row{border-left:3px solid var(--muted);padding-left:10px;margin:0 0 12px}.overnight-row blockquote{margin:6px 0;color:var(--muted)}.risk-block{border:1px solid var(--line);margin:0 0 8px;background:var(--bg-2)}.risk-block summary{cursor:pointer;padding:8px 10px}.risk-block p{margin:0;padding:8px 10px;border-top:1px solid var(--line)}.gate{border:1px solid var(--warn);padding:10px}.nondive{border:1px solid var(--line);padding:8px 10px}#flowPickNote{margin:0;border-width:0 0 1px}#flowCats{border:1px solid var(--line);margin:0;padding:8px;display:flex;flex-wrap:wrap;gap:6px 12px}#flowCats legend{padding:0 4px}#flowCats label{flex-direction:row;align-items:center}#placeDock{max-height:48vh;overflow:auto;border-bottom:1px solid var(--line);padding:8px 10px;margin:0 0 8px}#placeDock .camp-inline{margin-top:8px}`;
  document.head.appendChild(style);
  document.body.addEventListener("click", (event) => {
    const step = event.target.closest("[data-flow]");
    if (step) {
      const next = step.dataset.flow;
      if (next === "permit" && !flowPlace) return;
      if (next === "route" && (!flowPlace || !flowGear)) return;
      flowPage = next;
      flowRender();
      return;
    }
    const pick = event.target.closest("[data-flow-place]");
    if (pick) {
      flowPlace = pick.dataset.flowPlace;
      flowPage = "place";
      flowRender();
      return;
    }
    const enter = event.target.closest("[data-flow-enter]");
    if (enter && typeof openSite === "function" && typeof enterGround === "function") {
      openSite(enter.dataset.flowEnter);
      enterGround();
    }
  });
  document.body.addEventListener("toggle", (event) => {
    const block = event.target.closest(".risk-block");
    if (!block || !flowPlace) return;
    flowOpenRisk = block.open ? `${flowPlace}:${block.dataset.risk}` : "";
  }, true);
  document.body.addEventListener("change", (event) => {
    if (event.target.id === "flowGear") {
      flowGear = event.target.checked;
      flowRender();
    }
  });
  document.body.addEventListener("input", (event) => {
    if (event.target.id === "flowReview") {
      try { localStorage.setItem("caolou-review", event.target.value); } catch (error) { /* 记不住就留在框里 */ }
    }
  });
  flowRender();
}

if (typeof renderSide === "function") {
  const flowRenderSide = renderSide;
  renderSide = function flowRenderSideWrapped() {
    const result = flowRenderSide.apply(this, arguments);
    flowPinNote();
    return result;
  };
}

if (typeof openSite === "function") {
  const flowOpenSite = openSite;
  openSite = function flowOpenSiteWrapped(id) {
    if (flowPage === "place") {
      flowPlace = id;
      try { localStorage.setItem("caolou-site", id); } catch (error) { /* 选中仍留在这一页 */ }
      flowMenu();
      flowPinNote();
      const site = typeof SITES !== "undefined" && SITES.find((item) => item.id === id);
      if (site && typeof map !== "undefined" && map) map.panTo([site.lat, site.lng]);
      const row = document.querySelector(`#side .row[data-id="${id}"]`);
      if (row) row.scrollIntoView({ block: "nearest" });
      return;
    }
    return flowOpenSite.apply(this, arguments);
  };
}

if (typeof filtered === "function") {
  const flowFiltered = filtered;
  filtered = function flowFilteredWrapped() {
    const rows = flowFiltered.apply(this, arguments);
    const chosen = flowCatsOn();
    if (!chosen.length) return rows;
    return rows.filter((site) => chosen.some((tag) => flowTags(site.id).has(tag)));
  };
}

document.body.addEventListener("change", (event) => {
  if (!event.target.matches("[data-flow-cat]")) return;
  if (typeof campOn !== "undefined") campOn = false;
  if (typeof view !== "undefined" && view === "atlas") {
    if (typeof renderSide === "function") renderSide();
    if (typeof syncMarkers === "function") syncMarkers(false);
  }
});

flowMount();

if (typeof leaveGround === "function") {
  const flowLeave = leaveGround;
  leaveGround = function flowLeaveWrapped() {
    const result = flowLeave.apply(this, arguments);
    flowPage = "route";
    flowRender();
    return result;
  };
}
