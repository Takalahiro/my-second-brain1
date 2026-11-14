const CAMP_CHECKED = "2026-11-13";
const CAMP_SEASON = "2026-12-01 至 2027-02-28";
const CAMP_ALERTS = "https://www.nationalparks.nsw.gov.au/alerts";
const CAMP_KOSCI = "https://www.nationalparks.nsw.gov.au/safety/alpine-safety/kosciuszko-back-country-camping";
const CAMP_PLAN = "https://www.environment.nsw.gov.au/sites/default/files/blue-mountains-np-kanangra-boyd-np-plan-of-management-240234.pdf";
const CAMP_BUDA = "https://www.environment.nsw.gov.au/sites/default/files/budawangs-wilderness-walking-guidelines.pdf";
const CAMP_BMT = "https://transportnsw.info/documents/timetables/93-BMT-Blue-Mountains-Line-20260419.pdf";
const CAMP_CENTRAL = { lat: -33.8825, lng: 151.2066, name: "Sydney Central Station" };

const CAMP_AREAS = [
  { id: "grose", name: "蓝山 Grose Wilderness", kind: "bm" },
  { id: "southbm", name: "蓝山南侧偏远区域", kind: "bm" },
  { id: "gos", name: "Gardens of Stone State Conservation Area", kind: "other" },
  { id: "wollemi", name: "Wollemi", kind: "other" },
  { id: "kanangra", name: "Kanangra-Boyd", kind: "kb" },
  { id: "mainrange", name: "Kosciuszko Main Range", kind: "main" },
  { id: "jagungal", name: "Jagungal Wilderness", kind: "kosci" },
  { id: "schlink", name: "Schlink／Valentine", kind: "kosci" },
  { id: "pilot", name: "Cascade／Pilot Wilderness", kind: "kosci" },
  { id: "budawang", name: "Morton／Budawang Wilderness", kind: "buda" },
  { id: "barrington", name: "Barrington Tops", kind: "other" },
  { id: "newengland", name: "New England National Park", kind: "other" }
];

const CAMP_CLOSURES = [
  {
    id: "lobs",
    layer: "temp",
    start: "2026-10-15",
    end: "2030-02-26",
    title: "Lobs Hole Ravine：Snowy 2.0 施工封闭",
    scope: "Kosciuszko 的 Lobs Hole Ravine Road、Wallace Creek lookout、Lobs Hole Ravine campground。不是 Main Range，也不是整座公园。",
    text: "告示写这几处因 Snowy 2.0 关闭，估计到 2030-02-26。这是临时封闭，盖过任何许可。不代表主山脊关闭。"
  },
  {
    id: "tantangara",
    layer: "temp",
    start: "2026-10-23",
    end: "2030-02-26",
    title: "Tantangara 库岸：Snowy 2.0 施工封闭",
    scope: "Kosciuszko 的 Tantangara foreshore and surrounds。不是 Main Range，也不是整座公园。",
    text: "告示写 Tantangara 坝附近施工关闭，估计到 2030-02-26。这是临时封闭。不把整座公园涂暗。"
  },
  {
    id: "kellys",
    layer: "temp",
    start: "2026-12-13",
    end: "2026-12-18",
    title: "Kellys Plains：航空喷药封闭",
    scope: "Kosciuszko 的 Kellys plains。告示写到 2026-12-19 00:00。不是 Main Range 整片。",
    text: "告示写 2026-12-13 至 2026-12-19 00:00 在 Kellys Plains 喷药，进入封闭区会受罚。只在所选日期落在 12 月 13 日至 18 日时画这块。"
  },
  {
    id: "belmore",
    layer: "entry",
    start: "2026-10-09",
    end: "",
    title: "Belmore Falls：永久禁止进入",
    scope: "Morton National Park 的 Belmore Falls 基部和顶部。不是 Budawang 荒野。",
    text: "告示写 Belmore Falls 基部和图上这块永久关闭，因为坠落风险。这是禁入，不是 Budawang 的营地边界。"
  },
  {
    id: "watergauge",
    layer: "entry",
    start: "2026-10-07",
    end: "",
    title: "Watergauge Trail：疫霉永久禁入",
    scope: "Barrington Tops National Park 的 Watergauge trail，Beean Beean 与 Black Swamp 之间。不是整片 Barrington。",
    text: "告示写疫霉隔离，访客绝对不能进这块。这是禁入多边形，不是整片台地的扎营许可。"
  },
  {
    id: "lostcity",
    layer: "temp",
    start: "2026-11-11",
    end: "2026-11-19",
    title: "Lost City 南路：道路养护封闭",
    scope: "Gardens of Stone 的 Lost City South Road 和瞭望台。告示写到 2026-11-20 04:00。在 12 月至 2 月的日期选择里画不出来。",
    text: "告示写 Lost City 路和停车场 2026-11-11 至 2026-11-20 清晨关闭，北停车场仍可上步行道。季节是 12 月至 2 月，所以这份封闭不画进夏季日期。出发前仍要再查告示。"
  }
];

let campOn = false;
let campPage = "list";
let campId = "grose";
let campFieldId = null;
let campLayers = null;
let campShow = { nocamp: true, entry: true, temp: true };

function campDate() {
  return localStorage.getItem("caolou-camp-date") || "2026-12-15";
}

function campStartName() {
  return localStorage.getItem("caolou-camp-start") || CAMP_CENTRAL.name;
}

function campParty() {
  return localStorage.getItem("caolou-camp-party") || "solo";
}

function campCar() {
  return localStorage.getItem("caolou-camp-car") || "nocar";
}

function campPlanBag() {
  return loadJson("caolou-camp-plan", {});
}

function campPlanFor(id) {
  const all = campPlanBag();
  return all[id] || { stay: "", turn: "", look: "", water: "未知", toilet: "未知", exit: "未知", shuttle: "未知", explore: false };
}

function saveCampPlan(id, row) {
  const all = campPlanBag();
  all[id] = row;
  saveJson("caolou-camp-plan", all);
}

function campFact(text, source, scope, valid, state) {
  return { text, source, scope, checked: CAMP_CHECKED, valid, state };
}

function campFactHtml(row) {
  const source = /^https?:/.test(row.source)
    ? `<a href="${esc(row.source)}" target="_blank" rel="noreferrer">${esc(row.source)}</a>`
    : esc(row.source);
  return `<div class="fact"><p>${esc(row.text)}</p><p class="factmeta">${source}｜${esc(row.scope)}｜${esc(row.checked)}｜${esc(row.valid)}｜${esc(row.state)}</p></div>`;
}

function campSchemeLine() {
  const saved = loadJson("caolou-scheme", {});
  const siteId = localStorage.getItem("caolou-site") || "";
  const row = saved[siteId];
  const site = typeof SITES !== "undefined" && SITES.find((item) => item.id === siteId);
  if (!row || !row.name) return "准备页方案：未选。这一页没有装备勾选。";
  return `准备页方案：${row.name}${site ? `（${site.name}）` : ""}。这一页没有装备勾选。`;
}

function campArea(id) {
  return CAMP_AREAS.find((item) => item.id === id) || CAMP_AREAS[0];
}

function campClosureOn(row, day) {
  if (!day || day < row.start) return false;
  if (row.end && day > row.end) return false;
  return true;
}

function campActiveClosures() {
  const day = campDate();
  return CAMP_CLOSURES.filter((row) => campClosureOn(row, day) && CAMP_RINGS[row.id]);
}

function campPane() {
  if (!map.getPane("campwild")) {
    const pane = map.createPane("campwild");
    pane.style.zIndex = "360";
    pane.style.pointerEvents = "none";
  }
  return "campwild";
}

function campStyle(kind) {
  if (kind === "temp" || kind === "entry") {
    return { pane: campPane(), interactive: false, bubblingMouseEvents: false, color: "#2a060a", weight: 1, fillColor: "#5c1018", fillOpacity: 0.72 };
  }
  return { pane: campPane(), interactive: false, bubblingMouseEvents: false, color: "#c8c2b4", weight: 1, fillColor: "#9a968c", fillOpacity: 0.2 };
}

function campAddRings(group, polys, style) {
  (polys || []).forEach((poly) => {
    if (!poly || !poly.length || !poly[0] || poly[0].length < 3) return;
    const latlngs = poly.length > 1 ? poly : poly[0];
    L.polygon(latlngs, style).addTo(group);
  });
}

function campDrawOn(group, which) {
  if (!group) return;
  group.clearLayers();
  if (which === "nocamp") return;
  campActiveClosures().filter((row) => row.layer === which).forEach((row) => {
    campAddRings(group, CAMP_RINGS[row.id], campStyle(row.layer));
  });
}

function campEnsureGroups() {
  if (!map) return null;
  if (!campLayers || campLayers.map !== map) {
    campLayers = {
      map,
      nocamp: L.layerGroup(),
      entry: L.layerGroup(),
      temp: L.layerGroup(),
      explore: L.layerGroup()
    };
  }
  ["nocamp", "entry", "temp"].forEach((name) => {
    campDrawOn(campLayers[name], name);
    if (campShow[name]) {
      if (!map.hasLayer(campLayers[name])) campLayers[name].addTo(map);
    } else if (map.hasLayer(campLayers[name])) {
      map.removeLayer(campLayers[name]);
    }
  });
  return campLayers;
}

function campDrawExplore() {
  const layers = campEnsureGroups();
  if (!layers) return;
  layers.explore.clearLayers();
  if (!campFieldId || view !== "field") return;
  const plan = campPlanFor(campFieldId);
  const points = hikePoints("cw-" + campFieldId);
  if (!plan.explore || points.length < 3) return;
  const ring = points.map((point) => [point.lat, point.lng]);
  L.polygon(ring, campStyle("grey")).addTo(layers.explore);
  if (!map.hasLayer(layers.explore)) layers.explore.addTo(map);
}

function campLegendHtml() {
  const day = campDate();
  const drawn = campActiveClosures();
  const entryN = drawn.filter((row) => row.layer === "entry").length;
  const tempN = drawn.filter((row) => row.layer === "temp").length;
  return `<div class="legend">
    <span><i class="swatch green"></i>可扎营要同时有官方规则和核实过的边界。这一层是空的，没有整片涂绿。</span>
    <span><i class="swatch red"></i>禁营。没有核实过的边界，所以不画。白天能不能过，不从禁营推出来。</span>
    <span><i class="swatch closed"></i>禁入 ${entryN} 块，临时封闭 ${tempN} 块。只画 ${esc(day)} 仍有效、而且抓到了多边形的告示。</span>
    <span><i class="swatch tent"></i>蓝帐篷只给官方坐标。现在没有，不放点。</span>
    <span><i class="swatch grey"></i>规则或边界未核实。候选区没有多边形，状态是灰色，写边界待核实。</span>
  </div>`;
}

function campLayerToggles() {
  return `<p>
    <label><input type="checkbox" data-camp-layer="nocamp" ${campShow.nocamp ? "checked" : ""}> 禁营</label>
    <label><input type="checkbox" data-camp-layer="entry" ${campShow.entry ? "checked" : ""}> 禁入</label>
    <label><input type="checkbox" data-camp-layer="temp" ${campShow.temp ? "checked" : ""}> 临时封闭</label>
  </p>
  <p class="note">禁营这层是空的。没有把 200 米画成范围，也没有用公园边界代替许可。</p>`;
}

function campBmRules() {
  return [
    campFact("2024 年计划：Schedule 1 一般不准进入。表里扎营一列在 Schedule 1 是不允许。文件写了 McMahons Point 车行、Mount Mouin–Mount Cookem 步行走廊，以及 Woodford 的一部分可以作休闲。走廊没有写成营地。", CAMP_PLAN, "蓝山和 Kanangra-Boyd 两个国家公园的 Schedule 1。没有多边形。", "计划未写废止日", "已确认"),
    campFact("Schedule 2 是紧挨 Schedule 1 的限制进入带，不是 Schedule 1。计划写步行、扎营和非动力船一般可以，车辆、机动船、自行车和马受限。", CAMP_PLAN, "Warragamba Schedule 2，分属两个公园。没有多边形。", "计划未写废止日", "已确认"),
    campFact("荒野里的 bush camping（指定营地以外）一般可以，但 Schedule 1 除外。另有条件：公路、建成步道、指定营地、野餐地、正式瞭望台或其他访客设施 200 米内；石灰岩；窄缝峡谷；以及告示禁止的地方。过夜不准在窄缝峡谷里。这些都没有边界，只作文字，不画 200 米缓冲。", CAMP_PLAN, "蓝山和 Kanangra-Boyd 的荒野、Schedule 2、访客区和一般管理区。不自动用到 Wollemi 国家公园或 Gardens of Stone。", "计划未写废止日", "已确认"),
    campFact("荒野里步行一般可以，除非告示关闭。计划没有另写一句“可以离开所有步道”。允许离开步道不从允许步行或允许扎营推出来。", CAMP_PLAN, "表 6 的荒野列。", "计划未写废止日", "待核实")
  ];
}

function campKosciRules(main) {
  const rows = [
    campFact("页面列出不准扎营的集水区：Lake Albina、Blue Lake、Club Lake、Lake Cootapatamba、Hedley Tarn，以及 Rock Creek、Pipers Creek、Stilwell Creek、Blue Cow Creek 的饮用水集水区。另有河、溪、湖 30 米。200 米只写在列出的入口、道路、山顶步道和地标：Charlotte Pass、Crackenback Chairlift、Guthega Village、Guthega Power Station 的步道口，Crackenback Chairlift 到 Mount Kosciuszko 的步道，Mount Kosciuszko 山顶和 Rawson Pass，Foremans Crossing，以及对公众开放的车行道（指定步行营地除外）。没有这些地方的边界，不画多边形。", CAMP_KOSCI, main ? "页面写的是 Main Range 的高山越野扎营，不是整座公园。" : "这页的限制名单不自动套到这块。主山脊规则不覆盖整座公园。", "页面未写失效日", main ? "已确认" : "待核实")
  ];
  if (main) {
    rows.push(campFact("页面写主山脊可以离开步道：有硬化路面就走路面，不要堆石堆，没路时散开走。这只是离开步道，不是扎营许可。", CAMP_KOSCI, "Kosciuszko Main Range。没有多边形。", "页面未写失效日", "已确认"));
  } else {
    rows.push(campFact("主山脊那句“可以离开步道”不套到这块。允许离开步道待核实。", CAMP_KOSCI, "不是 Main Range 的科西阿斯科候选区。", "未核实", "待核实"));
  }
  return rows;
}

function campBudaRules() {
  return [
    campFact("2007-09-01 起的指南：不准在 Monolith Valley、Castle Saddle、Hidden Valley、The Vines 雨林，以及荒野里 Little Forest Walk 停车场以南的 Two Rivers Track 扎营。旧炮击区除 Sassafras 和 Link Road 已划出的空地外不准扎营，人要留在车道和 Folly Point 步道上。洞穴和岩棚只有名单里的可以过夜，其余只有紧急情况。指南旧，不是这次抓到的现行封闭。", CAMP_BUDA, "Morton 的 Budawang 荒野指南点名的地点。没有多边形。", "2007 年起，现在是否仍有效待核实", "已确认"),
    campFact("指南要求复活节和十月长周末在 Cooyoyo Creek 要许可，并留下 Ulladulla 4454 9500、Nowra 4423 2170。12 月至 2 月要不要许可，指南没写。没有替你订。", CAMP_BUDA, "Cooyoyo Creek 的假期许可。", "夏季是否仍要许可待核实", "待核实")
  ];
}

function campPermissions(area) {
  const unknown = campFact("入口、路线和营地都没有核实。未知不能当成允许。允许进入、允许离开步道、允许扎营分成三句，互不推断。不作为推荐路线。", "无已核实边界", area.name, "未核实", "待核实");
  if (area.kind === "main") {
    return {
      enter: campFact("没有抓到主山脊整片禁入。Lobs Hole、Tantangara 和 Kellys Plains 的封闭是别的地方。这不等于每条路都能进。入口待核实。", CAMP_ALERTS, "Main Range 候选区。封闭多边形各有各的范围。", "见各条告示", "待核实"),
      off: campKosciRules(true)[1],
      camp: campFact("页面在管主山脊越野扎营，并写了不准扎营的名单。没有可扎营边界，所以允许扎营待核实，不涂绿。", CAMP_KOSCI, "Main Range 的文字限制。", "页面未写失效日", "待核实")
    };
  }
  if (area.kind === "kosci") {
    return {
      enter: campFact("允许进入待核实。不从主山脊没有整片禁入，推出这块可以进。", CAMP_KOSCI, area.name, "未核实", "待核实"),
      off: campKosciRules(false)[1],
      camp: campFact("允许扎营待核实。主山脊的禁营名单不覆盖整座公园，也不证明这块可以扎营。", CAMP_KOSCI, area.name, "未核实", "待核实")
    };
  }
  if (area.kind === "bm" || area.kind === "kb") {
    return {
      enter: campFact("计划写荒野里可以步行，除非告示关闭。没有这块的入口坐标，允许进入待核实。Schedule 1 一般禁入，但没有边界证明这块就是 Schedule 1。", CAMP_PLAN, area.name, "计划未写废止日；入口未核实", "待核实"),
      off: campBmRules()[3],
      camp: campFact("计划写荒野里分散扎营是有条件的。没有核实过的许可边界，允许扎营待核实。不把整个公园或整片荒野涂绿。", CAMP_PLAN, area.name, "边界未核实", "待核实")
    };
  }
  if (area.kind === "buda") {
    return {
      enter: campFact("指南写旧炮击区要留在车道和 Folly Point 步道上。这不是抓到的现行封闭。这块的入口待核实，允许进入待核实。", CAMP_BUDA, "Budawang 指南点名的旧炮击区，不是整片 Morton。", "指南是否仍有效待核实", "待核实"),
      off: campFact("指南没有写整片荒野都可以离开步道。允许离开步道待核实。", CAMP_BUDA, area.name, "未核实", "待核实"),
      camp: campFact("指南禁止若干地点扎营，但没有给出可以扎营的边界。允许扎营待核实。不作为推荐路线。", CAMP_BUDA, area.name, "边界未核实", "待核实")
    };
  }
  return {
    enter: unknown,
    off: campFact("允许离开步道待核实。不从其他公园的句子搬过来。", "无已核实来源", area.name, "未核实", "待核实"),
    camp: campFact("允许扎营待核实。没有官方规则配上边界，不涂绿。", "无已核实来源", area.name, "未核实", "待核实")
  };
}

function campTransit(area) {
  const common = campFact(`出发默认是 ${campStartName()}，可以改。默认${campCar() === "nocar" ? "不开车" : "开车"}、${campParty() === "solo" ? "独自" : "结伴"}。日期 ${campDate()}，季节是 12 月至 2 月。改出发地不会在步道图上画线。`, "用户设定", "这次行程的默认值", CAMP_SEASON, "已确认");
  if (area.id === "grose") {
    return [
      common,
      campFact("去程铁路：Blue Mountains Line（BMT）。时刻表把 Central 和 Blackheath 站印在去程和回程里，表头 Valid from 19 April 2026。同一页写明不含假期改点、轨道施工和临时候车。12 月至 2 月含圣诞假期，所以不抄钟点，也不写车次号。乘车时间、等候、到步道口的总时间都待核实。", CAMP_BMT, "Central 到 Blackheath 站。不是步道口，也不是 Grose 的入口。", "2026-04-19 起的快照；夏季假期时刻待核实", "已确认"),
      campFact("Blackheath 站之后的巴士或预订接驳没有核实。最后一段交通未落实。接驳要不要订待核实。没有已安排的预订。", "无已核实班次", "Blackheath 站到步道口", "未落实", "待核实"),
      campFact("回程页上有 Blackheath 往 Central。夏季钟点不抄。最晚离开步道口待核实，因为步道口到车站要走多久没有核实。", CAMP_BMT, "回程只核实到站名出现在表上。", "假期时刻待核实", "待核实"),
      campFact("步行距离、爬升、走路时间待核实。计划只写 Blackheath 是访客点，含 Govetts Leap、Anvil Rock、Perrys Lookdown，并写有些地点能从火车站和城镇走到。没有一条核对过的步道路线。", CAMP_PLAN, "蓝山国家公园的 Blackheath 访客点。", "路线未核实", "待核实")
    ];
  }
  return [
    common,
    campFact("Central 之后的铁路终点、班次、运行日期、乘车时间、等候和接驳都没有核实。最后一段交通未落实。不编巴士号，也不编钟点。不使用冬季滑雪巴士的时刻。接驳没有预订。", "无已核实班次", area.name, "未落实", "待核实"),
    campFact("回程班次和最晚离开步道口待核实。步行距离、爬升、走路时间待核实。", "无已核实路书", area.name, "未核实", "待核实")
  ];
}

function campEnvironment(area) {
  const map = {
    grose: "计划写 Grose Wilderness 约 47,900 公顷，在蓝山国家公园的上格罗斯河谷。Blackheath 是旁边的访客点。这不是入口坐标。",
    southbm: "计划写到南蓝山的 Yerranderie、Kedumba、Mount Werong 一带有访客点。没有把“南侧偏远区域”画成一块已核实的路线。",
    gos: "Gardens of Stone 是国家公园系统里的州立保护地。2024 年蓝山计划的扎营表没有把它列进去。",
    wollemi: "2024 年计划只写蓝山国家公园里有 25,844 公顷 Wollemi Wilderness，并延伸进 Wollemi 国家公园。扎营表没有写成适用于整座 Wollemi。",
    kanangra: "计划写 Kanangra-Boyd 荒野约 125,000 公顷，跨两个公园。进 Kanangra-Boyd 国家公园主要靠 Kanangra Walls Road。这不是无车步道口。",
    mainrange: "越野扎营页写的是 Kosciuszko 主山脊的高山环境。规则不覆盖整座公园。",
    jagungal: "Jagungal Wilderness 在科西阿斯科北部高地。主山脊那一页没有把它写成同一块已核实营地。",
    schlink: "Schlink／Valentine 是主山脊以北的亚高山地名。主山脊规则不自动适用。",
    pilot: "Cascade／Pilot Wilderness 在科西阿斯科南侧。主山脊规则不覆盖整座公园。",
    budawang: "指南写 Budawang 是 Morton 里的偏远荒野，步道少、要自己导航。文件从 2007-09-01 起，现在是否仍是这套规矩要再查告示。",
    barrington: "Barrington Tops 是台地。这次读的两份 PDF 没有写这块的扎营规则。抓到的禁入只是 Watergauge 那一条路的疫霉隔离。",
    newengland: "New England National Park 的偏远区没有出现在这次读的扎营文件里。"
  };
  const source = area.kind === "buda" ? CAMP_BUDA : (area.kind === "main" || area.kind === "kosci" ? CAMP_KOSCI : (area.kind === "other" && area.id !== "gos" && area.id !== "wollemi" ? "无已核实来源" : CAMP_PLAN));
  return campFact(map[area.id], source, area.name, "地貌句子不是路线", area.kind === "other" && area.id === "newengland" ? "待核实" : "已确认");
}

function campCamps(area) {
  if (area.id === "grose") {
    return campFact("计划点名 Acacia Flat（Blue Gum Forest）和荒野里的 Burra Korain 为步行营地，并写 Perrys Lookdown 的营地将关闭、只留白天。没有坐标。规则允许待核实。实际适合搭帐篷：未知。不放图钉。", CAMP_PLAN, "Grose Valley 的地名，不是核实过的营地范围。", "坐标未核实", "待核实");
  }
  if (area.id === "kanangra") {
    return campFact("计划点名荒野里的 Dex Creek、Mobbs Swamp 为步行营地。没有坐标。规则允许待核实。实际适合搭帐篷：未知。不放图钉。", CAMP_PLAN, "Kanangra-Boyd 荒野里的地名。", "坐标未核实", "待核实");
  }
  if (area.id === "budawang") {
    return campFact("指南点名 Cooyoyo Creek、Burrumbeet Brook 等营地和帐篷数上限，以及允许过夜的洞穴名单。没有坐标。规则允许待核实。实际适合搭帐篷：未知。不放图钉。", CAMP_BUDA, "2007 指南里的地名。", "坐标和现行规则待核实", "待核实");
  }
  if (area.kind === "main") {
    return campFact("越野扎营页没有给出指定营地的坐标。行程意向表被强烈建议，页面写明那不是营地预订。规则允许待核实。实际适合搭帐篷：未知。候选营地和备用营地都不放点。", CAMP_KOSCI, "Main Range 文字。", "无坐标", "待核实");
  }
  return campFact("没有核实的候选营地。规则允许待核实。实际适合搭帐篷：未知。不在公园中心放点。", "无已核实来源", area.name, "未核实", "待核实");
}

function campSafety(area) {
  return [
    campFact("不给整座公园一个安全分。导航难度待核实。有没有步道待核实。", "无已核实路书", area.name, "未核实", "待核实"),
    campFact("地形只采用上面的环境句。爬升待核实。有没有攀爬或过溪待核实。", "无已核实路书", area.name, "未核实", "待核实"),
    campFact("炎热、水、用火、风暴、高山寒冷都要出发前再查。水的来源：未知。负重走路时间不确定。", area.kind === "main" ? CAMP_KOSCI : "出发前再查", area.name, "不是预报", "待核实"),
    campFact("撤退距离和备用出口未查到。不适合写成第一次独自过夜的路线。法规上允许也不等于安全。技术路段、未知的离线、用绳，都不放进这套独自计划。", "无已核实路书", area.name, "未核实", "待核实")
  ];
}

function campExtraNotes(area) {
  const rows = [];
  if (area.kind === "main" || area.kind === "kosci") rows.push(...campKosciRules(area.kind === "main"));
  if (area.kind === "bm" || area.kind === "kb") rows.push(...campBmRules());
  if (area.kind === "buda") rows.push(...campBudaRules());
  if (area.id === "wollemi") {
    rows.push(campFact("抓到 Wambo Ridge 火情提示，几何只有一个点，从 2026-11-13 起、结束日未知。不把点画成禁入面。", CAMP_ALERTS, "Wollemi National Park 的一个点。", "结束日未知", "已确认"));
  }
  if (area.id === "gos") {
    rows.push(campFact("Lost City 南路的封闭在 11 月 20 日清晨结束，不画进 12 月至 2 月。扎营规则不在蓝山计划的表里。", CAMP_ALERTS, "Gardens of Stone 的一条路。", "2026-11-11 至 2026-11-20 04:00", "已确认"));
  }
  rows.push(campFact("水：未知。手机信号：未知。地面适不适合搭帐篷：未知。人多不多随路线、是不是工作日，以及圣诞和暑假变化，不打公园固定分。", "未实测", area.name, "出发前再查", "待核实"));
  return rows;
}

function campClosureNotes(area) {
  return CAMP_CLOSURES.filter((row) => {
    if (area.kind === "main" || area.kind === "kosci") return ["lobs", "tantangara", "kellys"].includes(row.id);
    if (area.id === "budawang") return row.id === "belmore";
    if (area.id === "barrington") return row.id === "watergauge";
    if (area.id === "gos") return row.id === "lostcity";
    return false;
  }).map((row) => campFact(`${row.title}。${row.text} 所选日期 ${campDate()} ${campClosureOn(row, campDate()) ? "会画在禁入或临时封闭层。" : "不在有效期内，不画。"}`, CAMP_ALERTS, row.scope, `${row.start} 至 ${row.end || "告示未写结束日"}`, "已确认"));
}

function campChecklist() {
  return `<h3>离线</h3>
    <ul>
      <li>纸质地图，或你自己另外存好的图。这一页没有替手机下载离线地图。</li>
      <li>出发前打开飞机模式，看你要带的地图和时刻表在没网时打不打得开。打不开就还没准备好。</li>
      <li>告示、火险、天气、去程和回程，出发前再查一遍。</li>
      <li>PLB 仍是 NPWS 免费出借。没有一条交通落实到出借柜台，所以这里不提示你去借。</li>
    </ul>`;
}

function campListHtml() {
  const rows = CAMP_AREAS.map((area) => `<button type="button" class="camp-row" data-act="camp-open" data-id="${area.id}">
      <i class="swatch grey"></i>
      <span><strong>${esc(area.name)}</strong><small>候选区域。入口待核实。边界待核实。最后一段交通未落实。不作为推荐路线。</small>${typeof offtrackLabelHtml === "function" ? offtrackLabelHtml(area.id) : ""}</span>
    </button>`).join("");
  return `<div class="camp-detail">
    <h2>夏季荒野徒步与分散式扎营</h2>
    <p class="recheck">出发前再查 NPWS 告示、火险、天气和交通。未知不能当成允许。</p>
    <div class="camp-form">
      <label>日期（12 月至 2 月）<input id="campDate" type="date" min="2026-12-01" max="2027-02-28" value="${esc(campDate())}"></label>
      <label>出发<input id="campStart" value="${esc(campStartName())}"></label>
      <label>车<select id="campCar"><option value="nocar" ${campCar() === "nocar" ? "selected" : ""}>不开车</option><option value="car" ${campCar() === "car" ? "selected" : ""}>开车</option></select></label>
      <label>人<select id="campParty"><option value="solo" ${campParty() === "solo" ? "selected" : ""}>独自</option><option value="group" ${campParty() === "group" ? "selected" : ""}>结伴</option></select></label>
    </div>
    <p>${esc(campSchemeLine())}</p>
    ${campLegendHtml()}
    ${campLayerToggles()}
    <p class="note">12 个都是候选区域，不是整片已核实可扎营，也不代表 12 月至 2 月始终开放。地图上不从 Central 画线。</p>
    ${rows}
  </div>`;
}

function campRouteHtml(id) {
  const area = campArea(id);
  const perm = campPermissions(area);
  const facts = []
    .concat(campExtraNotes(area))
    .concat(campClosureNotes(area))
    .concat(campSafety(area));
  return `<div class="camp-detail">
    <button type="button" class="back" data-act="camp-back">返回候选列表</button>
    <h2>${esc(area.name)}</h2>
    <p>候选区域。入口待核实。步行路线待核实。营地范围待核实。边界待核实。不作为推荐路线。</p>
    ${campFactHtml(campEnvironment(area))}
    <p class="recheck">出发前再查 NPWS 告示、火险、天气和交通。这一页没有下载离线地图。</p>
    <p>${esc(campSchemeLine())}</p>
    <div class="perm"><h3>允许进入</h3>${campFactHtml(perm.enter)}</div>
    <div class="perm"><h3>允许离开步道</h3>${typeof offtrackFactHtml === "function" ? offtrackFactHtml(area.id) : campFactHtml(perm.off)}</div>
    <div class="perm"><h3>允许扎营</h3>${campFactHtml(perm.camp)}</div>
    <h3>规则允许 / 实际适合搭帐篷</h3>
    ${campFactHtml(campCamps(area))}
    <h3>交通</h3>
    <p class="note">Central → 铁路终点 → 巴士或预订接驳 → 步道口 → 步行。最后一段交通未落实就不写成到达。</p>
    ${campTransit(area).map(campFactHtml).join("")}
    <h3>记录</h3>
    ${facts.map(campFactHtml).join("")}
    ${campChecklist()}
    <button type="button" class="enter" data-act="camp-enter" data-id="${area.id}">进入地界</button>
    <p class="note">地界图只规划你自己的点和时间。不从 Central 画交通线。</p>
  </div>`;
}

function campRenderSide() {
  const side = document.getElementById("side");
  const atlas = document.querySelector(".atlas");
  if (atlas) atlas.classList.add("camp-on");
  if (!side) return;
  side.innerHTML = campPage === "route" ? campRouteHtml(campId) : campListHtml();
  const count = document.getElementById("count");
  if (count) count.textContent = "12 个候选区域";
  const found = document.getElementById("foundLine");
  if (found) found.textContent = "入口都待核实。最后一段交通都未落实。";
}

function campSyncAtlas() {
  if (!map || !layer) return;
  layer.clearLayers();
  if (typeof stopLayer !== "undefined" && stopLayer) stopLayer.clearLayers();
  campEnsureGroups();
  const stage = document.querySelector(".atlas");
  if (stage && !document.getElementById("campMapNote")) {
    stage.querySelector(".mapstage").insertAdjacentHTML("beforeend", `<p id="campMapNote" class="planhud">候选区没有边界，不涂绿，也不从 Central 画线。暗红色只是所选日期里抓到的封闭。</p>`);
  }
}

function campFieldHtml() {
  const id = campFieldId;
  const plan = id ? campPlanFor(id) : null;
  const area = id ? campArea(id) : null;
  const planBlock = id ? `<h3>${esc(area.name)}</h3>
    <p>入口待核实。这张图不开成推荐路线。地图中心在 Central 附近，只因为默认从那里出发。没有交通线。</p>
    <p>${esc(campSchemeLine())}</p>
    <label>停留时间（小时）<input id="campStay" type="number" min="0" step="0.5" value="${esc(plan.stay)}"></label>
    <label>最晚折返<input id="campTurn" type="time" value="${esc(plan.turn)}"></label>
    <label>最晚开始找营地<input id="campLook" type="time" value="${esc(plan.look)}"></label>
    <p id="campTimeNote" class="note"></p>
    <h3>主选营地和备用营地</h3>
    <p>规则允许：待核实。实际适合搭帐篷：未知。下面只是你自己标的点，不是官方蓝帐篷。</p>
    <div id="campRoles"></div>
    <label><input id="campExplore" type="checkbox" ${plan.explore ? "checked" : ""}> 用当前的点围出探索范围。这不是许可边界。</label>
    <p id="campExploreNote" class="note"></p>
    <h3>沿途</h3>
    <label>水<input id="campWater" value="${esc(plan.water)}"></label>
    <label>厕所<input id="campToilet" value="${esc(plan.toilet)}"></label>
    <label>已知出口<input id="campExit" value="${esc(plan.exit)}"></label>
    <label>接驳点<input id="campShuttle" value="${esc(plan.shuttle)}"></label>
    <p class="note">水、信号和地面在核实前保持未知。接驳未落实，也没有预订。</p>
    <div class="sheet-tools">
      <button type="button" data-act="routesave" data-slot="full">完整</button>
      <button type="button" data-act="routesave" data-slot="short">缩短</button>
      <button type="button" data-act="routesave" data-slot="safe">撤退</button>
      <button type="button" data-act="routeload" data-slot="full">用完整</button>
      <button type="button" data-act="routeload" data-slot="short">用缩短</button>
      <button type="button" data-act="routeload" data-slot="safe">用撤退</button>
    </div>` : `<p class="note">三个状态和观景点的步道分开。候选区的规划从夏季列表进。</p>`;
  return `<div id="campFieldBox">
    <h3>扎营图层</h3>
    ${campLayerToggles()}
    ${campLegendHtml()}
    ${planBlock}
  </div>`;
}

function campRefreshRoles() {
  const box = document.getElementById("campRoles");
  if (!box || !campFieldId) return;
  const points = hikePoints("cw-" + campFieldId);
  box.innerHTML = points.length ? points.map((point, index) => `<label>点 ${index + 1}
      <select data-camp-role="${index}">
        <option value="" ${!point.role ? "selected" : ""}>普通点</option>
        <option value="start" ${point.role === "start" ? "selected" : ""}>起点</option>
        <option value="via" ${point.role === "via" ? "selected" : ""}>经由</option>
        <option value="end" ${point.role === "end" ? "selected" : ""}>终点</option>
        <option value="camp" ${point.role === "camp" ? "selected" : ""}>主选营地</option>
        <option value="backup" ${point.role === "backup" ? "selected" : ""}>备用营地</option>
        <option value="water" ${point.role === "water" ? "selected" : ""}>水</option>
        <option value="toilet" ${point.role === "toilet" ? "selected" : ""}>厕所</option>
        <option value="exit" ${point.role === "exit" ? "selected" : ""}>出口</option>
        <option value="shuttle" ${point.role === "shuttle" ? "selected" : ""}>接驳点</option>
      </select>
    </label>`).join("") : `<p class="note">直接在地图上点。拖圆点、点线段插入、右键删除都还在。</p>`;
  const note = document.getElementById("campTimeNote");
  if (note && map && points.length >= 2) {
    let total = 0;
    for (let i = 1; i < points.length; i += 1) {
      total += map.distance([points[i - 1].lat, points[i - 1].lng], [points[i].lat, points[i].lng]);
    }
    note.textContent = `按你的点、步速约 ${minutesFor(total)} 分钟，${fmtDist(total)}。负重时间不确定。这不是路书。`;
  } else if (note) {
    note.textContent = "走路时间待核实。点不够两条以上，就不估算。";
  }
  const explore = document.getElementById("campExploreNote");
  if (explore) {
    const plan = campPlanFor(campFieldId);
    explore.textContent = plan.explore && points.length >= 3
      ? "灰色斜线是你自己的点围出来的，不是官方许可。"
      : "探索范围未核实。点少于三个时不围。";
  }
}

function campReadPlanInputs() {
  if (!campFieldId) return;
  const plan = campPlanFor(campFieldId);
  const stay = document.getElementById("campStay");
  const turn = document.getElementById("campTurn");
  const look = document.getElementById("campLook");
  const water = document.getElementById("campWater");
  const toilet = document.getElementById("campToilet");
  const exit = document.getElementById("campExit");
  const shuttle = document.getElementById("campShuttle");
  const explore = document.getElementById("campExplore");
  if (stay) plan.stay = stay.value;
  if (turn) plan.turn = turn.value;
  if (look) plan.look = look.value;
  if (water) plan.water = water.value || "未知";
  if (toilet) plan.toilet = toilet.value || "未知";
  if (exit) plan.exit = exit.value || "未知";
  if (shuttle) plan.shuttle = shuttle.value || "未知";
  if (explore) plan.explore = explore.checked;
  saveCampPlan(campFieldId, plan);
  campDrawExplore();
  campRefreshRoles();
}

function campMountField() {
  if (typeof view === "undefined" || view !== "field" || !map) return;
  campEnsureGroups();
  campDrawExplore();
  const dock = document.getElementById("dock");
  if (dock && !document.getElementById("campFieldBox")) dock.insertAdjacentHTML("afterbegin", campFieldHtml());
  const gpx = document.querySelector("[data-act='gpx']");
  if (gpx && !document.getElementById("gpxImport")) {
    gpx.insertAdjacentHTML("afterend", `<label class="gpxin">导入 GPX<input id="gpxImport" type="file" accept=".gpx,application/gpx+xml,.xml" hidden></label>`);
  }
  const head = document.getElementById("planHead");
  if (head && campFieldId) head.textContent = campSchemeLine();
  campRefreshRoles();
}

function campEnter(id) {
  campFieldId = id;
  campId = id;
  activeId = "cw-" + id;
  localStorage.setItem("caolou-mode", "plan");
  view = "field";
  destroyMap();
  showFilters(false);
  document.getElementById("view").innerHTML = `<div class="field">
    <div class="fieldbar" id="fieldbar"></div>
    <div class="fieldbody">
      <div class="mapstage"><div id="map"></div><div class="rose" aria-hidden="true"><b>N</b></div></div>
      <aside class="dock" id="dock"></aside>
    </div>
  </div>`;
  map = L.map("map", { scrollWheelZoom: true }).setView([CAMP_CENTRAL.lat, CAMP_CENTRAL.lng], 12);
  layer = L.layerGroup().addTo(map);
  L.control.scale({ imperial: false, metric: true, position: "bottomleft" }).addTo(map);
  initFieldMap();
  refreshMapChrome();
  markSteps();
  setTimeout(() => map.invalidateSize(), 60);
}

function campExportGpx() {
  if (!activeId) return;
  const points = hikePoints(activeId);
  const trk = points.length
    ? `<trk><name>用户的点</name><trkseg>${points.map((point) => `<trkpt lat="${point.lat}" lon="${point.lng}"><name>${xml(point.name || "")}</name></trkpt>`).join("")}</trkseg></trk>`
    : "";
  const gpx = `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="caolou-wild" xmlns="http://www.topografix.com/GPX/1/1">\n${trk}\n</gpx>\n`;
  downloadText(`${activeId}-hike.gpx`, gpx, "application/gpx+xml");
}

function campExportGeo() {
  if (!activeId) return;
  const points = hikePoints(activeId);
  const features = points.map((point, index) => ({
    type: "Feature",
    properties: { name: point.name || `点 ${index + 1}`, role: point.role || "" },
    geometry: { type: "Point", coordinates: [point.lng, point.lat] }
  }));
  if (points.length >= 2) {
    features.push({
      type: "Feature",
      properties: { name: "用户的线" },
      geometry: { type: "LineString", coordinates: points.map((point) => [point.lng, point.lat]) }
    });
  }
  downloadText(`${activeId}-hike.geojson`, JSON.stringify({ type: "FeatureCollection", features }, null, 2), "application/geo+json");
}

function campImportGpx(file) {
  if (!file || !activeId) return;
  const reader = new FileReader();
  reader.onload = () => {
    const doc = new DOMParser().parseFromString(String(reader.result || ""), "application/xml");
    const tracks = Array.from(doc.getElementsByTagName("trkpt"));
    const nodes = tracks.length ? tracks : Array.from(doc.getElementsByTagName("wpt"));
    const points = nodes.map((node) => {
      const nameNode = node.getElementsByTagName("name")[0];
      return {
        lat: Number(node.getAttribute("lat")),
        lng: Number(node.getAttribute("lon")),
        name: nameNode ? nameNode.textContent.trim() : ""
      };
    }).filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng));
    if (!points.length) return;
    setHike(activeId, points);
    drawHike();
  };
  reader.readAsText(file);
}

function campInject() {
  const filters = document.getElementById("filters");
  if (!filters || document.getElementById("flowCats")) return;
  const box = document.createElement("fieldset");
  box.id = "flowCats";
  const cats = [
    ["hike", "陆地徒步"],
    ["night", "荒野过夜"],
    ["alpine", "高山登顶"],
    ["rock", "岩壁／峡谷"],
    ["scuba", "水肺潜水"],
    ["tec", "技术潜水"],
    ["watch", "动物观察"],
    ["photo", "摄影目标"],
    ["thin", "公开资料不足区域"]
  ];
  box.innerHTML = `<legend>类别</legend>${cats.map(([id, name]) => `<label class="flow-cat"><input type="checkbox" data-flow-cat="${id}"> ${name}</label>`).join("")}`;
  filters.insertBefore(box, filters.firstChild);
}

const campRenderSideOriginal = renderSide;
renderSide = function campRenderSideWrapped() {
  if (campOn && view === "atlas") {
    campRenderSide();
    return;
  }
  const atlas = document.querySelector(".atlas");
  if (atlas) atlas.classList.remove("camp-on");
  return campRenderSideOriginal.apply(this, arguments);
};

const campSyncOriginal = syncMarkers;
syncMarkers = function campSyncWrapped(fit) {
  if (campOn && view === "atlas") {
    campSyncAtlas();
    return;
  }
  if (campLayers && map) {
    ["nocamp", "entry", "temp", "explore"].forEach((name) => {
      if (campLayers[name] && map.hasLayer(campLayers[name])) map.removeLayer(campLayers[name]);
    });
  }
  const note = document.getElementById("campMapNote");
  if (note) note.remove();
  return campSyncOriginal.apply(this, arguments);
};

const campRefreshOriginal = refreshMapChrome;
refreshMapChrome = function campRefreshWrapped() {
  const result = campRefreshOriginal.apply(this, arguments);
  campMountField();
  return result;
};

const campDrawOriginal = drawHike;
drawHike = function campDrawWrapped() {
  const result = campDrawOriginal.apply(this, arguments);
  if (view === "field") {
    campDrawExplore();
    campRefreshRoles();
  }
  return result;
};

const campEnterOriginal = enterGround;
enterGround = function campEnterWrapped() {
  const site = typeof SITES !== "undefined" && SITES.find((item) => item.id === activeId);
  if (site) campFieldId = null;
  return campEnterOriginal.apply(this, arguments);
};

const campSetViewOriginal = setView;
setView = function campSetViewWrapped(next) {
  if (next === "prep" && activeId && !(typeof SITES !== "undefined" && SITES.some((item) => item.id === activeId))) {
    next = "atlas";
    campPage = "route";
  }
  return campSetViewOriginal.apply(this, arguments);
};

const campExportGpxOriginal = exportGpx;
exportGpx = function campExportGpxWrapped() {
  if (activeId && typeof SITES !== "undefined" && SITES.some((item) => item.id === activeId)) {
    return campExportGpxOriginal.apply(this, arguments);
  }
  campExportGpx();
};

const campExportGeoOriginal = exportGeo;
exportGeo = function campExportGeoWrapped() {
  if (activeId && typeof SITES !== "undefined" && SITES.some((item) => item.id === activeId)) {
    return campExportGeoOriginal.apply(this, arguments);
  }
  campExportGeo();
};

document.addEventListener("change", (event) => {
  if (event.target.id === "campWildCat") {
    campOn = event.target.value === "summer";
    campPage = "list";
    if (view === "atlas") {
      renderSide();
      syncMarkers(false);
    }
  }
  if (event.target.id === "campDate") {
    const day = event.target.value;
    if (day < "2026-12-01" || day > "2027-02-28") return;
    localStorage.setItem("caolou-camp-date", day);
    if (campOn && view === "atlas") {
      renderSide();
      syncMarkers(false);
    }
  }
  if (event.target.id === "campStart") localStorage.setItem("caolou-camp-start", event.target.value.trim() || CAMP_CENTRAL.name);
  if (event.target.id === "campCar") {
    localStorage.setItem("caolou-camp-car", event.target.value);
    if (campOn && view === "atlas") renderSide();
  }
  if (event.target.id === "campParty") {
    localStorage.setItem("caolou-camp-party", event.target.value);
    if (campOn && view === "atlas") renderSide();
  }
  if (event.target.matches("[data-camp-layer]")) {
    campShow[event.target.dataset.campLayer] = event.target.checked;
    campEnsureGroups();
  }
  if (event.target.id === "gpxImport" && event.target.files && event.target.files[0]) {
    campImportGpx(event.target.files[0]);
    event.target.value = "";
  }
  if (event.target.matches("[data-camp-role]") && campFieldId) {
    const points = hikePoints("cw-" + campFieldId);
    const index = Number(event.target.dataset.campRole);
    if (points[index]) {
      points[index].role = event.target.value;
      if (event.target.value === "camp") points[index].name = points[index].name || "主选营地";
      if (event.target.value === "backup") points[index].name = points[index].name || "备用营地";
      setHike("cw-" + campFieldId, points);
      drawHike();
    }
  }
  if (["campStay", "campTurn", "campLook", "campWater", "campToilet", "campExit", "campShuttle", "campExplore"].includes(event.target.id)) {
    campReadPlanInputs();
  }
});

document.addEventListener("click", (event) => {
  const act = event.target.closest("[data-act]");
  if (!act) return;
  if (act.dataset.act === "camp-open") {
    campId = act.dataset.id;
    campPage = "route";
    campRenderSide();
  }
  if (act.dataset.act === "camp-back") {
    campPage = "list";
    campRenderSide();
  }
  if (act.dataset.act === "camp-enter") campEnter(act.dataset.id);
});

campInject();
