const BRIEF_CHECKED = "2026-11-13";

const BRIEF_PLACES = [
  {
    id: "popran",
    name: "Popran National Park",
    kind: "brief",
    brief: true,
    status: "优先核实候选",
    why: "官方计划提到离开道路的有条件灌丛扎营。完整条件、入口、现行规则和最后一段交通仍未核对。这句话不是已经核实的扎营许可。",
    source: "https://www.environment.nsw.gov.au/sites/default/files/popran-national-park-plan-of-management-000097.pdf",
    checked: BRIEF_CHECKED,
    quotes: [
      "This plan of management was adopted by the Minister for the Environment on 14th August 2000.",
      "Public access is currently available: to the Mt Olive section of the park from the end of Ironbark Road and from Berecry Road; to the Bedlam Creek section of the park from the Wisemans Ferry Road; to the Calga section of the park from the Old Pacific Highway; and to the Mt White section of the park from the end of Morgans Road.",
      "There is no public access available to the Mangrove Mountain section of the park as it is surrounded by private property.",
      "Bush camping will be permitted away from roads, provided such camping is in accordance with minimal impact camping practices (including use of fuel stoves only) and in accordance with a camping permit issued by the Service.",
      "Consequently vehicle based camping will not be provided in Popran National Park."
    ],
    enter: "Public access is currently available: to the Mt Olive section of the park from the end of Ironbark Road and from Berecry Road; to the Bedlam Creek section of the park from the Wisemans Ferry Road; to the Calga section of the park from the Old Pacific Highway; and to the Mt White section of the park from the end of Morgans Road.",
    transit: "待核实",
    camp: "Bush camping will be permitted away from roads, provided such camping is in accordance with minimal impact camping practices (including use of fuel stoves only) and in accordance with a camping permit issued by the Service."
  },
  {
    id: "nattai",
    name: "Nattai National Park",
    kind: "brief",
    brief: true,
    status: "候选",
    why: "必须排除饮用水封闭的区域。交通未核对。没有划出可以进入的范围。",
    source: "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/nattai-national-park",
    checked: BRIEF_CHECKED,
    quotes: [
      "Nattai National Park is always open but may have to close at times due to poor weather or fire danger."
    ],
    enter: "Nattai National Park is always open but may have to close at times due to poor weather or fire danger.",
    transit: "待核实",
    camp: "待核实"
  },
  {
    id: "solitary",
    name: "Mount Solitary walking track",
    kind: "brief",
    brief: true,
    status: "具体路线候选",
    why: "有陡坡路段。各段步道状态和扎营限制仍未核对。",
    source: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/mount-solitary-walking-track",
    checked: BRIEF_CHECKED,
    quotes: [
      "Starting at Katoomba Falls Kiosk, descend Furber Steps to Federal Pass and walk the track where a horse-drawn tramway once ran.",
      "After 4.5hrs you’ll be refilling your water and pitching a tent at Ruined Castle campground amid the mining ruins from 1882.",
      "Continue across the top of Mount Solitary before descending the steep eastern slope to Kedumba River campground."
    ],
    enter: "Starting at Katoomba Falls Kiosk, descend Furber Steps to Federal Pass and walk the track where a horse-drawn tramway once ran.",
    transit: "待核实",
    camp: "待核实"
  },
  {
    id: "gnw",
    name: "Great North Walk segments near Hornsby, Berowra, Cowan stations",
    kind: "brief",
    brief: true,
    status: "训练路线分类",
    why: "只记 Hornsby、Berowra、Cowan 车站附近的分段。不把整条步道标成可以免费扎营。",
    source: "无已给来源",
    checked: BRIEF_CHECKED,
    enter: "待核实",
    transit: "待核实",
    camp: "待核实"
  },
  {
    id: "marramarra",
    name: "Marramarra Ridge / Smugglers Ridge",
    kind: "brief",
    brief: true,
    status: "指定营地方案候选",
    why: "按指定营地来记，不是分散扎营。指定点的规则、入口和交通仍未核对。",
    source: "无已给来源",
    checked: BRIEF_CHECKED,
    enter: "待核实",
    transit: "待核实",
    camp: "待核实"
  },
  {
    id: "nadgee",
    name: "Nadgee Wilderness",
    kind: "brief",
    brief: true,
    status: "远途进阶候选",
    why: "过夜需要许可。现行进入方式和交通仍未核对。扎营许可这一栏仍是待核实，不把这句话涂成可以扎营。",
    source: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/nadgee-wilderness-walk/visitor-info",
    checked: BRIEF_CHECKED,
    quotes: [
      "Parking is available at Merrica River trackhead, east of the Merrica River crossing.",
      "Walkers staying overnight require a permit.",
      "Applications for permits are available by calling the Merimbula NPWS office on (02) 6495 5000.",
      "Fires are not permitted from September to March."
    ],
    enter: "Parking is available at Merrica River trackhead, east of the Merrica River crossing.",
    transit: "待核实",
    camp: "Walkers staying overnight require a permit."
  }
];

function briefPlace(id) {
  return BRIEF_PLACES.find((area) => area.id === id) || null;
}

function briefLabel(area) {
  return `${area.status}。${area.why} 来源：${area.source}。核实日期 ${area.checked}。入口 ${area.enter}。交通 ${area.transit}。扎营 ${area.camp}。不作为推荐路线。不涂绿。`;
}

if (typeof CAMP_AREAS !== "undefined") {
  BRIEF_PLACES.forEach((area) => {
    if (!CAMP_AREAS.some((item) => item.id === area.id)) CAMP_AREAS.push(area);
  });
}

function addBriefRow(row) {
  if (typeof PACK === "undefined" || PACK.some((item) => item.id === row.id)) return;
  PACK.push(Object.assign({
    qty: null,
    g: null,
    cost: null,
    cur: "AUD",
    owned: false,
    briefRow: true,
    fitModel: "未记录",
    packQty: null,
    includesAccessories: "未记录",
    shop: "",
    shopName: "",
    source: "没有商品页",
    updated: BRIEF_CHECKED,
    spec: "未买。价格未记录。克数未记录。没有购买链接，也没有本地照片。"
  }, row));
}

function briefGearRows() {
  const tent = { fine: "庇护", mid: "帐篷配套", group: "过夜" };
  const sleep = { fine: "睡眠", mid: "睡眠配套", group: "过夜" };
  const drink = { fine: "饮水", mid: "饮水配套", group: "补给" };
  const sos = { fine: "求救", mid: "应急配套", group: "应急" };
  const wash = { fine: "卫生", mid: "卫生配套", group: "其他" };
  const fix = { fine: "修理", mid: "维修配套", group: "其他" };
  const cook = { fine: "炊事", mid: "食物配套", group: "补给" };
  const stove = { fine: "炊事", mid: "炉具备用", group: "补给", needsStove: true };
  const power = { fine: "电力与存储", mid: "供电配套", group: "电力" };
  [
    ["fpMatch", "对应地布", "地布", tent],
    ["stakeSpare", "备用地钉", "地钉", tent],
    ["guySpare", "备用风绳", "风绳", tent],
    ["poleSleeve", "帐杆修补套管", "帐杆", tent],
    ["tentPatch", "修补贴", "修补", tent],
    ["padPump", "睡垫充气袋", "充气", sleep],
    ["padPatch", "专用补片", "补片", sleep],
    ["bagDry", "睡袋防水袋", "防水袋", sleep],
    ["bottleSpare", "独立备用水瓶", "备用水瓶", drink],
    ["filterTool", "滤水器清洁／反冲工具", "清洁工具", drink],
    ["bladderFit", "兼容水袋接头", "接头", drink],
    ["treatSpare", "备用净水处理", "备用处理", drink],
    ["bivy", "应急露宿袋", "露宿", sos],
    ["whistlePea", "无珠求救哨", "哨", sos],
    ["lampSpare", "备用小灯", "小灯", sos],
    ["contactCard", "防水紧急联系卡", "联系卡", sos],
    ["sanitiser", "免洗洗手液", "洗手", wash],
    ["wagBag", "排泄物携出袋", "携出", wash],
    ["wasteBin", "防漏二次容器", "容器", wash],
    ["ductCloth", "布基胶带", "胶带", fix],
    ["hexKey", "与脚架匹配的内六角工具", "内六角", fix],
    ["foodBag", "防漏食物袋", "食物袋", cook],
    ["foodCold", "无需加热的备用食物", "冷食", cook],
    ["stoveFuel", "兼容燃料", "燃料", stove],
    ["stoveSpark", "点火备用", "点火", stove],
    ["stovePot", "炉具用锅", "锅", stove],
    ["cableDry", "防水线袋", "线袋", power],
    ["navCell", "备用手机导航电池", "导航电池", power]
  ].forEach((row) => {
    addBriefRow(Object.assign({
      id: row[0],
      name: row[1],
      leaf: row[2]
    }, row[3]));
  });
  if (typeof PACK === "undefined") return;
  const note = (id, text) => {
    const item = PACK.find((row) => row.id === id);
    if (item && !item.weightNote) item.weightNote = text;
  };
  note("nhtent", "帐篷重量是否含地钉和外帐：未记录。不把地钉或外帐的克数再加进这条。");
  note("tent1", "帐篷重量是否含地钉和外帐：未记录。不把地钉或外帐的克数再加进这条。");
  ["field", "svhike", "svtrail", "sjbag", "sjmod"].forEach((id) => {
    note(id, "蛇伤绷带是否已含在这条重量里：未记录。不把单独绷带的克数再加进这个包。");
  });
  ["snake", "sjsnake", "tacsnake"].forEach((id) => {
    note(id, "这是单独的蛇伤绷带。是否已经算在急救包重量里：未记录。不把同一条绷带的克数加两次。");
  });
  note("trowel", "小铲只在当地规则允许掩埋时才用。当地规则未核对，不表示可以掩埋。");
  note("plbnpws", "借来并本次携带时按克数计入。克数未记录，所以已具备重量和计划总重量都不加这一行。");
}

briefGearRows();

function briefPoints() {
  if (typeof hikePoints !== "function" || typeof activeId !== "string" || !activeId) return [];
  return hikePoints(activeId);
}

function briefDistance(points) {
  if (!points || points.length < 2 || typeof map === "undefined" || !map || typeof map.distance !== "function") return null;
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    total += map.distance([points[i - 1].lat, points[i - 1].lng], [points[i].lat, points[i].lng]);
  }
  return total;
}

function briefElevation(points) {
  const measured = points.length > 0 && points.every((point) => Number.isFinite(Number(point.ele)));
  if (!measured) return { total: "未测", longest: "未测", steep: "未测", exit: "未测" };
  const ele = points.map((point) => Number(point.ele));
  let gain = 0;
  let longest = 0;
  let run = 0;
  let steep = 0;
  for (let i = 1; i < ele.length; i += 1) {
    const delta = ele[i] - ele[i - 1];
    if (delta > 0) {
      gain += delta;
      run += delta;
      if (run > longest) longest = run;
    } else {
      run = 0;
      if (-delta > steep) steep = -delta;
    }
  }
  return {
    total: `${Math.round(gain)} m`,
    longest: `${Math.round(longest)} m`,
    steep: `${Math.round(steep)} m`,
    exit: `${Math.round(ele[ele.length - 1])} m`
  };
}

function briefPace() {
  if (typeof loadJson !== "function") return null;
  const row = loadJson("caolou-pace-test", null);
  const meters = row && Number(row.meters);
  const minutes = row && Number(row.minutes);
  if (!Number.isFinite(meters) || !Number.isFinite(minutes) || meters <= 0 || minutes <= 0) return null;
  return { meters, minutes, kmh: (meters / 1000) / (minutes / 60) };
}

function briefRest(points) {
  const stays = points.map((point) => Number(point.stay)).filter((n) => Number.isFinite(n) && n > 0);
  if (!stays.length) return "未测";
  return `${stays.reduce((sum, n) => sum + n, 0)} 分钟，只加你填过的停留`;
}

function briefSunset() {
  if (typeof loadJson !== "function" || typeof activeId !== "string") return "未查到";
  const sun = loadJson("caolou-sun", null);
  const date = localStorage.getItem("caolou-weather-date") || "";
  if (!sun || !sun.sunset || sun.id !== activeId || sun.date !== date) return "未查到";
  return `${String(sun.sunset).slice(11, 16)}，Open-Meteo`;
}

function briefTurnText(points) {
  const pace = briefPace();
  const dist = briefDistance(points);
  const elev = briefElevation(points);
  const distLine = dist == null ? "未测" : (typeof fmtDist === "function" ? fmtDist(dist) : `${Math.round(dist)} m`);
  let when = "未测";
  if (!pace) when = "步速未测";
  else if (elev.total === "未测") when = "未测。爬升未测，不用平路步速代替。";
  else if (dist == null) when = "未测。还没有可量的剩余距离。";
  else if (briefSunset() === "未查到") when = "未测。日落未查到，不推钟点。";
  else when = "未测。爬升还没有换成你自己的爬升用时。";
  return `剩余距离：${distLine}。爬升：${elev.total}。休息：${briefRest(points)}。日落：${briefSunset()}。最晚折返：${when}。过了这一刻之后路线必须改走缩短的一版。时刻未测，所以不自动删点，也不改线。`;
}

function briefWaterText(points) {
  const marked = points.filter((point) => point.role === "water" || point.ntype === "饮水点");
  const extra = marked.length ? `你标过 ${marked.length} 个点，类别仍是未核实。` : "没有已核实的水点。";
  return `水龙头：未记录。需处理的自然水：未记录。季节性：未记录。未核实：${extra} 带到下一次可靠补水点：下一次可靠补水点未核实，携带量不估算。地图上的溪线不是水。`;
}

function briefCampText() {
  return "许可：待核实。坡度：现场确认。枯枝倒木：现场确认。洪水位：现场确认。风口：现场确认。敏感植被：现场确认。地图判断不了的写现场确认。没有从计划文字画营地范围。";
}

function briefCheckText() {
  const vote = typeof loadJson === "function" ? loadJson("caolou-wx-vote", {}) : {};
  const weather = vote && vote.sky
    ? `天气：存过一次预报投票（${vote.sky}）。这不是火险，也不是出发当时的保证。`
    : "天气：未查。没有这次出发的预报读数。";
  const contact = localStorage.getItem("caolou-checkin")
    ? "紧急联系：已填写约定报平安时间。填写不会启动救援。"
    : "紧急联系：未填写约定报平安时间。";
  return [
    "接驳：需询价。没有已落实的班次，也没有预订。",
    "PLB：NSW NPWS 免费出借。出借柜台未到达。没有一条已核实的交通走到出借柜台，所以这次不算能借到，也不算能归还。",
    weather,
    "火险：未查。",
    "步道开放：待核实。没有对上当天告示。",
    "离线地图：未下载。这一页没有把底图存进手机。",
    contact
  ].join(" ");
}

function briefCostText() {
  const site = typeof SITES !== "undefined" && typeof activeId === "string"
    ? SITES.find((item) => item.id === activeId)
    : null;
  let fare = "已确认的公共交通票价：没有。距离档未知，不写 Opal 金额。";
  if (site && typeof transitRow === "function" && typeof fareSentence === "function") {
    const row = transitRow(site);
    if (row && row.ok && row.lines && row.lines.length) {
      const bits = row.lines.map((line) => fareSentence(line.mode || "", line.code || ""));
      fare = `已确认的公共交通票价：没有写死的金额。${bits.join(" ")}`;
    }
  }
  return `${fare} 接驳：需询价。附近住宿：需询价。出租车费用不写。`;
}

function briefPowerText() {
  if (typeof PACK === "undefined" || typeof packFlags !== "function") return "分设备用电量未测。不估算 mAh。";
  const flags = packFlags();
  const rows = PACK.filter((item) => flags[item.id] && item.fine === "电力与存储" && item.packable !== false && !(typeof personalOnly === "function" && personalOnly(item)));
  if (!rows.length) return "方案里没有勾上的供电设备。分设备用电量未测。不估算 mAh。";
  return `${rows.map((item) => `${item.name}：用电量未测`).join("。")}。不估算 mAh。`;
}

function briefWeightText() {
  if (typeof packTotals !== "function" || typeof packFlags !== "function") return "";
  const totals = packTotals();
  const flags = packFlags();
  const tele = flags.tele600 && flags.tele200
    ? "Z 70-200 和 Z 180-600 不能同时装上。两只都还在选择里，没有被清掉。带不带两只由你决定。"
    : "没有同时勾上 Z 70-200 和 Z 180-600。";
  const owned = Number.isFinite(totals.ownedKg) ? totals.ownedKg : totals.kg;
  const plan = Number.isFinite(totals.kg) ? totals.kg : 0;
  return `${tele} 已具备重量 ${owned.toFixed(2)} kg。计划总重量 ${plan.toFixed(2)} kg。未买但在方案里的，克数仍算进计划总重量，并写尚未具备。克数空着的不加。衣服、靴子、墨镜、背包和帽子不计入。`;
}

function briefExitText() {
  if (typeof campFieldId !== "undefined" && campFieldId && typeof campPlanFor === "function") {
    const plan = campPlanFor(campFieldId);
    if (plan && plan.exit && plan.exit !== "未知") return `用户所填：${plan.exit}。未经核实。`;
  }
  return "待核实";
}

function briefNotesText(points) {
  const notes = points.map((point) => point.note).filter((note) => note && String(note).trim());
  return notes.length ? notes.join("；") : "未记录";
}

function briefPackGpx() {
  const points = briefPoints();
  const trk = points.length
    ? `<trk><name>用户的点</name><trkseg>${points.map((point) => `<trkpt lat="${point.lat}" lon="${point.lng}"><name>${typeof xml === "function" ? xml(point.name || "") : ""}</name></trkpt>`).join("")}</trkseg></trk>`
    : "";
  const desc = [
    "离线行程包。没有下载离线底图。",
    "瓦片许可：未知。能否下载：未知。",
    `路线备注：${briefNotesText(points)}`,
    `备用出口：${briefExitText()}`,
    "接人点：需询价",
    "官方电话：待核实",
    "许可原文：待核实"
  ].join(" ");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="caolou-wild" xmlns="http://www.topografix.com/GPX/1/1">\n<metadata><desc>${typeof xml === "function" ? xml(desc) : desc}</desc></metadata>\n${trk}\n</gpx>\n`;
}

function briefSheetText() {
  const points = briefPoints();
  const route = points.length ? points.map((point, index) => point.name || `点 ${index + 1}`).join(" → ") : "未记录";
  const when = localStorage.getItem("caolou-checkin") || "未填写";
  const place = typeof activeId === "string" ? activeId : "";
  return `紧急联系单\n填写这张表不会启动救援。\n地点：${place || "未打开"}\n路线：${route}\n约定报平安时间：${when}\n`;
}

function briefToolsHtml() {
  const pace = typeof loadJson === "function" ? (loadJson("caolou-pace-test", null) || {}) : {};
  const meters = pace.meters ? String(pace.meters) : "";
  const minutes = pace.minutes ? String(pace.minutes) : "";
  const check = localStorage.getItem("caolou-checkin") || "";
  return `<section class="block" id="briefTools">
    <h3>行程核对</h3>
    <p class="note">交通、步道进入、扎营许可分三层。查过一页不等于可以扎营。默认未核实。不把整座公园涂绿。不把 200 米画成范围。</p>
    <p data-brief="weight"></p>
    <h3>爬升</h3>
    <p data-brief="elev"></p>
    <h3>最晚折返</h3>
    <label>实测距离（米）<input id="paceMeters" inputmode="decimal" value="${esc(meters)}" placeholder="空着就是未测"></label>
    <label>实测用时（分钟）<input id="paceMinutes" inputmode="decimal" value="${esc(minutes)}" placeholder="空着就是未测"></label>
    <p data-brief="turn"></p>
    <h3>水</h3>
    <p data-brief="water"></p>
    <h3>营地检查</h3>
    <p data-brief="camp"></p>
    <h3>出发核对</h3>
    <p data-brief="check"></p>
    <h3>离线行程包</h3>
    <p data-brief="pack"></p>
    <button type="button" data-act="brief-pack">导出 GPX 行程包</button>
    <h3>紧急联系单</h3>
    <label>约定报平安时间 <input id="checkIn" value="${esc(check)}" placeholder="未填写"></label>
    <p data-brief="sheet"></p>
    <button type="button" data-act="brief-sheet">导出紧急联系单</button>
    <h3>费用</h3>
    <p data-brief="cost"></p>
    <h3>供电</h3>
    <p data-brief="power"></p>
  </section>`;
}

function briefFill() {
  const root = document.getElementById("briefTools");
  if (!root) return;
  const points = briefPoints();
  const elev = briefElevation(points);
  const set = (key, text) => {
    const node = root.querySelector(`[data-brief="${key}"]`);
    if (node) node.textContent = text;
  };
  set("weight", briefWeightText());
  set("elev", `累计爬升：${elev.total}。最长连续爬升：${elev.longest}。陡下坡：${elev.steep}。出口高度：${elev.exit}。没有实测高程就不估算。`);
  set("turn", briefTurnText(points));
  set("water", briefWaterText(points));
  set("camp", briefCampText());
  set("check", briefCheckText());
  set("pack", "导出的是你的点、路线备注、备用出口、接人点、官方电话和许可原文。没有下载离线底图。瓦片许可：未知。能否下载：未知。");
  set("sheet", "这张单可以交给别人。上面有路线和约定报平安时间。填写这张表不会启动救援。");
  set("cost", briefCostText());
  set("power", briefPowerText());
}

function briefMountPrep() {
  const prep = document.querySelector("#view .prep");
  if (!prep || prep.querySelector("#briefTools")) return;
  const header = prep.querySelector("header");
  const html = briefToolsHtml();
  if (header) header.insertAdjacentHTML("afterend", html);
  else prep.insertAdjacentHTML("afterbegin", html);
  briefFill();
}

function briefMountField() {
  const dock = document.getElementById("dock");
  if (!dock || dock.querySelector("#briefTools")) return;
  dock.insertAdjacentHTML("beforeend", briefToolsHtml());
  briefFill();
}

function briefPlaceHtml() {
  const rows = BRIEF_PLACES.map((area) => `<button type="button" class="camp-row" data-act="brief-open" data-id="${esc(area.id)}">
      <i class="swatch grey"></i>
      <span><strong>${esc(area.name)}</strong><small>${esc(briefLabel(area))}</small>${typeof offtrackLabelHtml === "function" ? offtrackLabelHtml(area.id) : ""}</span>
    </button>`).join("");
  return `<section id="briefPlaces" class="camp-detail">
    <h3>候选，不是推荐路线</h3>
    <p class="note">灰色。不涂绿。不放公园中心当入口。不画营地范围。不从 Chippendale 或 Central 画线。</p>
    ${rows}
  </section>`;
}

function briefPaintList() {
  document.querySelectorAll("[data-act='camp-open']").forEach((btn) => {
    const area = briefPlace(btn.dataset.id);
    const small = area && btn.querySelector("small");
    if (small) small.textContent = briefLabel(area);
  });
  const count = document.getElementById("count");
  if (count && typeof CAMP_AREAS !== "undefined" && typeof campOn !== "undefined" && campOn) {
    count.textContent = `${CAMP_AREAS.length} 个候选区域`;
  }
  document.querySelectorAll("#side .note").forEach((node) => {
    if (node.textContent.indexOf("12 个都是候选") === 0 && typeof CAMP_AREAS !== "undefined") {
      node.textContent = `${CAMP_AREAS.length} 个都是候选区域，不是整片已核实可扎营。新增地点不涂绿，不作为推荐路线。地图上不从 Central 画线。`;
    }
  });
}

if (typeof campEnvironment === "function") {
  const briefEnv = campEnvironment;
  campEnvironment = function briefEnvWrapped(area) {
    if (area && area.brief) {
      return campFact(area.why, area.source, area.name, `核实日期 ${area.checked}。入口、交通、扎营没有另核。`, area.status);
    }
    return briefEnv(area);
  };
}

if (typeof campTransit === "function") {
  const briefTransit = campTransit;
  campTransit = function briefTransitWrapped(area) {
    if (area && area.brief) {
      return [
        campFact(area.enter === "待核实" ? "入口待核实。不用公园中心当作入口。没有入口坐标。" : area.enter, area.source, area.name, "没有坐标", area.enter === "待核实" ? "待核实" : "已确认"),
        campFact(area.transit === "待核实" ? "最后一段交通待核实。没有班次、钟点或票价。不从 Central 或 Chippendale 画线。" : area.transit, "无已核实班次", area.name, "未落实", "待核实"),
        campFact(area.camp === "待核实" ? "扎营待核实。写下来源也不等于可以扎营。不画营地多边形，不把整座公园涂绿。" : `${area.camp} 不把这句话涂成整座公园可以免费扎营。不画多边形。`, area.source, area.name, "见原文", area.camp === "待核实" ? "待核实" : "已确认")
      ];
    }
    return briefTransit(area);
  };
}

if (typeof campCamps === "function") {
  const briefCamps = campCamps;
  campCamps = function briefCampsWrapped(area) {
    if (area && area.brief) {
      return campFact("允许扎营待核实。实际适合搭帐篷：未知。不放图钉。不从计划文字画营地范围。", area.source, area.name, "未核实", "待核实");
    }
    return briefCamps(area);
  };
}

if (typeof campRouteHtml === "function") {
  const briefRoute = campRouteHtml;
  campRouteHtml = function briefRouteWrapped(id) {
    const html = briefRoute(id);
    const area = briefPlace(id);
    if (!area) return html;
    const source = /^https?:/.test(area.source)
      ? `<a href="${esc(area.source)}" target="_blank" rel="noreferrer">${esc(area.source)}</a>`
      : esc(area.source);
    const quotes = (area.quotes || []).map((line) => `<p>原文：${esc(line)}</p>`).join("");
    const block = `<p><strong>${esc(area.status)}</strong></p><p>${esc(area.why)}</p>${quotes}<p class="factmeta">来源 ${source}｜核实日期 ${esc(area.checked)}｜入口 ${esc(area.enter)}｜交通 ${esc(area.transit)}｜扎营 ${esc(area.camp)}</p>`;
    return html.replace("</h2>", `</h2>${block}`);
  };
}

if (typeof campRenderSide === "function") {
  const briefSide = campRenderSide;
  campRenderSide = function briefSideWrapped() {
    const result = briefSide.apply(this, arguments);
    briefPaintList();
    return result;
  };
}

if (typeof renderSide === "function") {
  const briefRenderSide = renderSide;
  renderSide = function briefRenderSideWrapped() {
    const result = briefRenderSide.apply(this, arguments);
    if (typeof campOn === "undefined" || !campOn) {
      const side = document.getElementById("side");
      if (side && !document.getElementById("briefPlaces")) side.insertAdjacentHTML("beforeend", briefPlaceHtml());
    }
    return result;
  };
}

if (typeof renderPrep === "function") {
  const briefPrep = renderPrep;
  renderPrep = function briefPrepWrapped() {
    const result = briefPrep.apply(this, arguments);
    briefMountPrep();
    return result;
  };
}

if (typeof refreshMapChrome === "function") {
  const briefChrome = refreshMapChrome;
  refreshMapChrome = function briefChromeWrapped() {
    const result = briefChrome.apply(this, arguments);
    briefMountField();
    briefFill();
    return result;
  };
}

if (typeof drawHike === "function") {
  const briefDraw = drawHike;
  drawHike = function briefDrawWrapped() {
    const result = briefDraw.apply(this, arguments);
    briefFill();
    return result;
  };
}

document.addEventListener("input", (event) => {
  if (event.target.id !== "paceMeters" && event.target.id !== "paceMinutes" && event.target.id !== "checkIn") return;
  if (event.target.id === "checkIn") localStorage.setItem("caolou-checkin", event.target.value.trim());
  if (event.target.id === "paceMeters" || event.target.id === "paceMinutes") {
    const meters = document.getElementById("paceMeters");
    const minutes = document.getElementById("paceMinutes");
    const m = meters ? Number(meters.value) : NaN;
    const n = minutes ? Number(minutes.value) : NaN;
    if (meters && minutes && meters.value.trim() && minutes.value.trim() && m > 0 && n > 0 && typeof saveJson === "function") {
      saveJson("caolou-pace-test", { meters: m, minutes: n });
    } else {
      localStorage.removeItem("caolou-pace-test");
    }
  }
  briefFill();
});

document.addEventListener("click", (event) => {
  const act = event.target.closest("[data-act]");
  if (!act) return;
  if (act.dataset.act === "brief-pack" && typeof downloadText === "function") {
    downloadText("trip-pack.gpx", briefPackGpx(), "application/gpx+xml");
  }
  if (act.dataset.act === "brief-sheet" && typeof downloadText === "function") {
    downloadText("emergency-contact.txt", briefSheetText(), "text/plain");
  }
  if (act.dataset.act === "brief-open") {
    if (typeof flowPickPlace === "function") {
      flowPickPlace(act.dataset.id);
      return;
    }
    if (typeof campRenderSide !== "function") return;
    campOn = true;
    campId = act.dataset.id;
    campPage = "route";
    const sel = document.getElementById("campWildCat");
    if (sel) sel.value = "summer";
    if (typeof view !== "undefined" && view === "atlas") {
      renderSide();
      if (typeof syncMarkers === "function") syncMarkers(false);
    }
  }
});

if (typeof view !== "undefined" && view === "atlas" && typeof renderSide === "function") renderSide();
