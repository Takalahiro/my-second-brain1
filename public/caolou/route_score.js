/* 分数只来自已打开的页面或已存记录。缺的输入是待核实，不补成数字。
   少于一半输入时，这一项是依据不足，不显示 0–10。 */
const ROUTE_DAY = "2026-11-13";
const ROUTE_LAND = ["峡谷", "瀑布", "溪流", "雨林", "湿地", "砂岩岩塔", "悬崖", "山脊", "海岸", "海湾", "高山", "野花", "森林", "日出", "日落", "星空"];

const ROUTE_PAGES = {
  karloo: {
    name: "卡卢池 · Karloo walking track",
    url: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/karloo-walking-track/visitor-info",
    overview: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/karloo-walking-track",
    distance: "10km return",
    km: 10,
    time: "3 - 5hrs",
    day: true,
    climb: null,
    grade: "Grade 3",
    gradeN: 3,
    central: "查询快照只到 Heathcote。车站走到步道口的时间，页面没写。",
    lastLeg: "页面写从 Heathcote 站沿 Wilson Parade 走到有指示的步道口。没写这段有多远。最后一段交通未落实。",
    lastOpen: true,
    taxi: "需询价。没有车站到步道口的实测公里，不算出租车。",
    taxiReturn: null,
    lastRisk: "待核实。没有另查末班。",
    closure: "页面写皇家国家公园 7am 到 8.30pm，也可能因坏天气或火险关闭。当天告示待核实。",
    summer: true,
    reach: false,
    land: ["瀑布"],
    landNote: "总览写 Uloola Falls 和 scenic waterfall。野花那句指的是 Curra Moors 和 Wises，不算这条。",
    thrill: [
      ["里程", "10km return。分 = min(10, 10 ÷ 2) = 5。往返不改成单程。", 5],
      ["总爬升", null, null],
      ["最长爬升", null, null],
      ["等级", "Grade 3。分 = 3 × 2 = 6。", 6],
      ["路面", "Formed track, some obstacles。分 = 5。", 5],
      ["陡、台阶、攀爬或涉水", "Short steep hills，Many steps。两项都写了，分 = 7。", 7],
      ["路标", "Clearly sign posted。分 = 3。", 3],
      ["返程余量", null, null]
    ],
    wild: [
      ["离道路或房屋的距离", null, null],
      ["手机信号", "limited mobile phone reception。分 = 8。", 8],
      ["设施", "Heathcote 站厕所、Uloola Falls 营地厕所、Heathcote 站停车，3 处。分 = max(0, 10 − 2×3) = 4。", 4],
      ["页面写的游客人数", null, null],
      ["步道是否有标记", "Clearly sign posted。分 = 3。", 3],
      ["是否有营地", "Uloola Falls campground，要网上预订。页面没写 remote。分 = 5。", 5],
      ["撤退和救援难度", null, null]
    ],
    risk: "安全分依据不足。页面点到的是：园内手机信号有限、呼救需要信号、雨后会泥泞。没有把哪一句排成量化的最大风险。"
  },
  blue: {
    name: "蓝山 · Grand Cliff Top Walk",
    url: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/grand-cliff-top-walk/visitor-info",
    overview: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/grand-cliff-top-walk",
    distance: "19km one-way",
    km: 19,
    time: "2 days",
    day: false,
    climb: null,
    grade: "Grade 3",
    gradeN: 3,
    central: "查询快照到 Wentworth Falls。页面另写从该站沿 Darwins walk 走 3 km 到野餐区。两段没有加成一个总时间。",
    lastLeg: "Wentworth Falls 站到 Wentworth Falls 野餐区，页面写沿 Darwins walk 3 km。这是步行，不是出租车里程。",
    lastOpen: false,
    taxi: "这条步道需询价。1.5 km 和 2 km 是页面里的步行距离，不换算成出租车。",
    taxiAside: "另一段：Leura train station 到 Mount Hay Road，页面写 600 米。按官方日间市区费率，起步 $5.17 + 0.6×$2.61 = $6.74。回程同一段也是 $6.74。往返 $13.48，出租车往返≤AUD 100。不是预订。需向司机确认是否愿接。未铺装路的后段没有算进去。最后一段交通未落实。不是可达。",
    taxiReturn: 13.48,
    lastRisk: "待核实。没有另查末班。页面点了 686 路公交这个号，没有时刻。",
    closure: "页面写 Katoomba 区域常开，维修、坏天气或火险时部分地点会关。当天告示待核实。",
    summer: false,
    reach: true,
    land: ["峡谷", "瀑布", "溪流", "雨林", "悬崖", "森林"],
    landNote: "总览写 Empress Canyon、多处 Falls、Jamison Creek 等溪、dense rainforest、cliff、eucalyptus forest。砂岩步石不写成砂岩岩塔。",
    thrill: [
      ["里程", "19km one-way。分 = min(10, 19 ÷ 2) = 9.5。", 9.5],
      ["总爬升", null, null],
      ["最长爬升", null, null],
      ["等级", "Grade 3。分 = 3 × 2 = 6。", 6],
      ["路面", "Formed track。分 = 4。", 4],
      ["陡、台阶、攀爬或涉水", "Short steep hills，Many steps。分 = 7。瀑布落差不当成爬升。", 7],
      ["路标", "Clearly sign posted。分 = 3。", 3],
      ["返程余量", null, null]
    ],
    wild: [
      ["离道路或房屋的距离", null, null],
      ["手机信号", null, null],
      ["设施", "页面点了多处厕所、咖啡馆、停车和游客中心。这只说明设施多，离房屋的公里没写。", null],
      ["页面写的游客人数", null, null],
      ["步道是否有标记", "Clearly sign posted。分 = 3。", 3],
      ["是否有营地", "过夜写的是村庄住宿，不是荒野营地。分 = 2。", 2],
      ["撤退和救援难度", null, null]
    ],
    risk: "安全分依据不足。页面写要有一定体力、建议有一点灌丛步行经验。这不是撤退难度分。"
  }
};

const ROUTE_LOOKUPS = {
  karloo: [
    ["风景", "已官方确认", "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/karloo-walking-track", "leads through heathland, passing beautiful Karloo Pool；whaleback rock outcrops；rock outcrops of Uloola Turrets；delightful waterfall"],
    ["返程走法", "已官方确认", "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/karloo-walking-track", "Return the way you came or take Uloola walking track to Waterfall Station. 这句没有钟点。"],
    ["开放时间", "已官方确认", "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/karloo-walking-track", "Royal National Park is open 7am to 8.30pm but may have to close at times due to poor weather or fire danger."],
    ["手机信号", "已官方确认", "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/karloo-walking-track/visitor-info", "there is limited mobile phone reception in this park and you’ll need mobile reception to call Triple Zero (000)."],
    ["Wilson Parade 到步道口的米数", "查过仍未写明", "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/karloo-walking-track/visitor-info｜https://www.nationalparks.nsw.gov.au/camping-and-accommodation/campgrounds/uloola-falls-campground/visitor-info｜https://www.nationalparks.nsw.gov.au/-/media/npws/maps/pdfs/tdd/karloo-walking-track/karloo-walking-track-map.pdf", "官方页只写 shortly after passing the emergency services centre。地图 PDF 没有这段米数。第三方 2019 笔记写 200 m，是另一条 Heathcote 到 Waterfall 的 11.3 km 单程，过期风险，不拿来当这段距离，也不拿来算出租车。"],
    ["爬升", "查过仍未写明", "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/karloo-walking-track｜https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/karloo-walking-track/visitor-info｜https://dev.bushwalk.com/j/nzs1rg/｜https://bushwalk.com/j/fiywja/｜https://www.bushwalk.com/forum/viewtopic.php?f=47&t=13479", "官方页有 Short steep hills 和 Many steps，没有爬升米数。dev.bushwalk.com 上名为 The Karloo Track 的页这次打开返回 500，搜索摘录里的 9.6 km return、↑ 374 m 没有打开成功，不采用。Heathcote to Engadine via Audley 写的是 14.9 km one way ↑ 559 m，不是这条 10 km 往返。"],
    ["离开步道的论坛帖", "第三方参考", "https://www.bushwalk.com/forum/viewtopic.php?f=47&t=13479", "帖子写 After that it was off track but quite negotiable。这是在描述离开水道，不是许可。标签仍是资料不足。不是露营许可，也不是时刻表。"],
    ["末班与返程钟点", "查过仍未写明", "https://transportnsw.info/documents/timetables/93-SCO-South-Coast-Line-20260419.pdf", "表头 Valid from: 19 April 2026。不含假期、trackwork 和 disruption。Heathcote 出现在往 Central 和从 Central 开出的页上。抽出的文字栏位对不齐，不把某一格写成末班。过期风险：不能把这份快照当成今天的末班已确认。"],
    ["撤退难度", "查过仍未写明", "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/karloo-walking-track/visitor-info", "页面写信号有限、呼救需要信号、Some bushwalking experience recommended。没有撤退难度等级。人少不是离开步道的许可。"],
    ["游客人数", "查过仍未写明", "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/karloo-walking-track", "popular swimming and picnic spot 不是人数。"],
    ["当天告示", "查过仍未写明", "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/royal-national-park/alerts", "这个告示地址返回 404。开放时间见上面那句，当天是否关闭没有打开的告示页。"],
    ["独自", "查过仍未写明", "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/karloo-walking-track/visitor-info", "没有写可以独自，也没有写不可以。不标适合第一次独自探索。"],
    ["出租车", "查过仍未写明", "https://transportnsw.info/travel-info/ways-to-get-around/taxi-hire-vehicle/rank-hail-taxi-fares-charges", "费率页已打开。没有官方的车站到步道口公里，需询价。不把城镇到公园的笼统距离算进去。"]
  ],
  blue: [
    ["里程与等级", "已官方确认", "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/grand-cliff-top-walk", "19km one-way。Time suggested 2 days。Grade 3。"],
    ["车站到野餐区", "已官方确认", "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/grand-cliff-top-walk/visitor-info", "From Wentworth Falls station it's a 3km walk along Darwins walk to Wentworth Falls picnic area. 这是步行距离，不是出租车道路公里。"],
    ["风景", "已官方确认", "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/grand-cliff-top-walk", "Empress Canyon；Wentworth Falls、Gordon Falls、Leura Cascades；Jamison Creek；dense rainforest；cliff；thick forest of eucalyptus trees。砂岩步石不写成砂岩岩塔。"],
    ["公交号", "已官方确认", "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/grand-cliff-top-walk/visitor-info", "public bus route 686。没有时刻，不写成班次已确认。"],
    ["过夜", "已官方确认", "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/grand-cliff-top-walk", "Book to stay in local accommodation。不是荒野营地。"],
    ["爬升", "第三方参考", "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/grand-cliff-top-walk｜https://www.aussiebushwalking.com/nsw/blue-mountains-national-park/grand-cliff-top-walk｜https://www.trailhiking.com.au/hikes/grand-cliff-top-walk/｜https://bushwalk.com/forum/viewtopic.php?f=36&t=42702", "官方页没有总爬升米数。Aussie Bushwalking 写 795m Total Climb，并写 These values are provided by users。Trail Hiking 同一条 19 km 写 Total Ascent: 1908m。两个第三方数字对不上，不取其中一个。论坛帖只写 19km 和车站，没有爬升米数。Furber Steps 的 427 m 是另一条路。"],
    ["封闭", "第三方参考", "https://bushwalk.com/j/VFWRIB/", "这页写的是另一条 Narrow Neck 环线，页末告示写 Prince Henry Cliff Top Walk (part of the Grand Cliff Top Walk) is closed between Honeymoon Lookout and Carrington Park, and between Ampitheatre Track and Kiah Lookout due to recent landslides。这不是当天打开的 NPWS 告示页，不标已官方确认。"],
    ["末班", "查过仍未写明", "https://transportnsw.info/documents/timetables/93-BMT-Blue-Mountains-Line-20260419.pdf", "这次没有把 Katoomba 或 Wentworth Falls 的末班从栏位里对出来。不抄一个钟点。"],
    ["手机信号", "查过仍未写明", "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/grand-cliff-top-walk/visitor-info", "这条悬崖步道的访客页没有写手机信号。Mount Hay Road 那页的信号句子不挪到这里。"],
    ["出租车", "查过仍未写明", "https://transportnsw.info/travel-info/ways-to-get-around/taxi-hire-vehicle/rank-hail-taxi-fares-charges", "3 km、1.5 km、2 km 都是页面写的步行。这条步道需询价。Leura 站到 Mount Hay Road 的 0.6 km 是另一段。"]
  ]
};

function routeRound(n) {
  return Math.round(n * 10) / 10;
}

function routePart(rows) {
  const have = rows.filter((row) => row[2] != null);
  const missing = rows.filter((row) => row[2] == null).map((row) => row[0]);
  if (have.length * 2 < rows.length) {
    return { state: "依据不足", have: have.length, total: rows.length, missing, rows };
  }
  const score = routeRound(have.reduce((sum, row) => sum + row[2], 0) / have.length);
  return { state: "scored", score, have: have.length, total: rows.length, missing, rows };
}

function routeAnimals(id) {
  if (typeof SIGHTINGS === "undefined") return [];
  const prefix = `${id}|`;
  return Object.keys(SIGHTINGS).filter((key) => key.startsWith(prefix)).map((key) => {
    const animal = key.slice(prefix.length);
    const rows = (SIGHTINGS[key] || []).filter((row) => row.date && row.km != null);
    const info = typeof SPECIES !== "undefined" ? SPECIES[animal] : null;
    return {
      animal,
      name: info && info.name ? info.name : animal,
      realm: info && info.realm ? info.realm : "待核实",
      rows
    };
  }).filter((item) => item.rows.length);
}

function routeAnimalPart(id) {
  const list = routeAnimals(id);
  const inputs = [
    ["有日期的公开记录", list.length ? `${list.length} 个物种` : null],
    ["粗略公里", list.length && list.every((item) => item.rows.every((row) => row.km != null)) ? "记录里有 km" : null],
    ["来源名称", list.length ? "iNaturalist Australia" : null],
    ["官方页点名的动物", null]
  ];
  const have = inputs.filter((row) => row[1]);
  const missing = inputs.filter((row) => !row[1]).map((row) => row[0]);
  if (!list.length || have.length * 2 < inputs.length) {
    return { state: "依据不足", have: have.length, total: inputs.length, missing, list, score: null };
  }
  return {
    state: "scored",
    score: Math.min(10, list.length),
    have: have.length,
    total: inputs.length,
    missing,
    list
  };
}

function routeCombine(parts) {
  const weights = { scene: 30, wild: 20, animal: 15, thrill: 15, transit: 10, safety: 10 };
  const names = { scene: "风景", wild: "原始感", animal: "动物观察", thrill: "路线刺激", transit: "交通方便", safety: "安全和撤退" };
  const used = Object.keys(parts).filter((key) => parts[key] && parts[key].state === "scored");
  const dropped = Object.keys(weights).filter((key) => !used.includes(key)).map((key) => names[key]);
  if (!used.length) return { state: "依据不足", dropped, text: "综合爽感：依据不足" };
  const weight = used.reduce((sum, key) => sum + weights[key], 0);
  const raw = used.reduce((sum, key) => sum + parts[key].score * weights[key], 0) / weight;
  const high = (parts.thrill && parts.thrill.score >= 7) || (parts.safety && parts.safety.score >= 7);
  return {
    state: "scored",
    score: routeRound(raw),
    dropped,
    used: used.map((key) => `${names[key]} ${parts[key].score}`),
    warn: high
  };
}

function routePack(id) {
  const page = ROUTE_PAGES[id] || null;
  const animals = routeAnimalPart(id);
  const thrill = page ? routePart(page.thrill) : { state: "依据不足", have: 0, total: 8, missing: ["里程", "爬升", "等级"], rows: [] };
  const wild = page ? routePart(page.wild) : { state: "依据不足", have: 0, total: 7, missing: ["离道路或房屋的距离", "手机信号"], rows: [] };
  const named = page ? page.land : [];
  const scene = {
    state: named.length * 2 < ROUTE_LAND.length ? "依据不足" : "scored",
    score: named.length * 2 < ROUTE_LAND.length ? null : Math.min(10, named.length * 2),
    have: named.length,
    total: ROUTE_LAND.length,
    missing: ROUTE_LAND.filter((name) => !named.includes(name)),
    named
  };
  const transit = { state: "依据不足", have: page ? 2 : 0, total: 7, missing: ["返程时刻", "末班", "出租车道路公里"] };
  const safety = { state: "依据不足", have: 0, total: 6, missing: ["分项安全"], score: null };
  const fun = routeCombine({ scene, wild, animal: animals, thrill, transit, safety });
  const birds = animals.list ? animals.list.filter((item) => item.realm === "飞禽") : [];
  const off = typeof offtrackOf === "function" ? offtrackOf(id) : null;
  const tags = [];
  if (page && page.reach && !page.lastOpen) tags.push("公共交通可达");
  if (page && page.lastOpen) tags.push("最后一段未落实");
  if (page && page.day) tags.push("单日往返");
  if (page && page.summer) tags.push("最适合夏季");
  if (birds.length >= 3) tags.push("鸟类丰富");
  if (animals.list && animals.list.length >= 3) tags.push("动物丰富");
  if (animals.list && animals.list.length) tags.push("不保证出现");
  named.forEach((name) => tags.push(name));
  if (page && page.taxiReturn != null && page.taxiReturn <= 100) tags.push("出租车往返≤AUD 100");
  const filters = {
    wild: wild.state === "scored" && wild.score >= 7,
    reach: tags.includes("公共交通可达"),
    day: !!(page && page.day),
    animals: tags.includes("动物丰富"),
    birds: tags.includes("鸟类丰富"),
    summer: !!(page && page.summer),
    taxi: page && page.taxiReturn != null && page.taxiReturn <= 100,
    waterfall: named.includes("瀑布"),
    openleg: !tags.includes("最后一段未落实") && tags.includes("公共交通可达")
  };
  return {
    page, animals, thrill, wild, scene, transit, safety, fun, tags, filters, off,
    sort: {
      wild: wild.state === "scored" ? wild.score : null,
      people: null,
      length: page ? page.km : null,
      effort: page ? page.gradeN : null,
      climb: null,
      thrill: thrill.state === "scored" ? thrill.score : null,
      scene: scene.state === "scored" ? scene.score : null,
      animals: animals.state === "scored" ? animals.score : null,
      photo: null,
      solo: null,
      transit: null,
      taxi: page && page.taxiReturn != null ? page.taxiReturn : null,
      day: page && page.day ? 1 : null,
      summer: page && page.summer ? 1 : null,
      offline: page && page.wild.find((row) => row[0] === "手机信号" && row[2] != null) ? page.wild.find((row) => row[0] === "手机信号")[2] : null,
      fun: fun.state === "scored" ? fun.score : null,
      safety: null
    }
  };
}

function routeEsc(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[ch]));
}

function routeScoreLine(label, part) {
  if (!part || part.state !== "scored") {
    const miss = part && part.missing ? part.missing.slice(0, 6).join("、") : "没有已打开的页面";
    return `<p><strong>${routeEsc(label)}。</strong> 输入不够一半，不显示数字。已有 ${part ? part.have : 0}/${part ? part.total : "?"}。缺：${routeEsc(miss)}。打开过的页写在下面，不留空的待核实。</p>`;
  }
  const miss = part.missing && part.missing.length ? `没放进分数的：${part.missing.join("、")}。` : "";
  return `<p><strong>${routeEsc(label)}：${part.score}/10。</strong> ${routeEsc(miss)}缺的输入只降低把握，不把这项分数拉低。</p>`;
}

function routeBarHtml(label, part) {
  if (!part || part.state !== "scored" || part.score == null) {
    return `<div class="ten-bar" data-ten="${routeEsc(label)}" data-ten-state="依据不足">
      <div class="ten-label"><span>${routeEsc(label)}</span><span>依据不足</span></div>
      <p>${routeEsc(part && part.reason ? part.reason : "没有已打开的页面或已存记录。不画成 0。")}</p>
    </div>`;
  }
  const width = Math.max(0, Math.min(100, part.score * 10));
  return `<div class="ten-bar" data-ten="${routeEsc(label)}" data-ten-state="scored">
    <div class="ten-label"><span>${routeEsc(label)}</span><span>${part.score}/10</span></div>
    <div class="ten-track"><div class="ten-fill" style="width:${width}%"></div></div>
    <p>${routeEsc(part.reason || "")}</p>
  </div>`;
}

function routeTen(id, pack) {
  const page = pack.page;
  const miss = (reason) => ({ state: "依据不足", score: null, reason });
  const facilities = () => {
    if (!page) return miss("没有已打开的步道页，不从火车站推断设施。");
    const bits = [];
    const surface = page.thrill.find((row) => row[0] === "路面" && row[1]);
    const signs = page.thrill.find((row) => row[0] === "路标" && row[1]);
    const gear = page.wild.find((row) => row[0] === "设施" && row[1]);
    if (surface) bits.push(`成形步道：${surface[1]}`);
    if (signs) bits.push(`路标：${signs[1]}`);
    if (gear && /厕所/.test(gear[1])) bits.push(`厕所：${gear[1]}`);
    if (gear && /咖啡|售卖|小卖/.test(gear[1])) bits.push(`售卖：${gear[1]}`);
    if (!bits.length) return miss("已打开的记录里没有成形步道、路标、厕所或售卖点。");
    const score = routeRound(bits.length * 2.5);
    return { state: "scored", score, reason: `写明 ${bits.length} 项，每项 2.5，合计 ${score}/10。${bits.join(" ")} 没写的不加。设施越多，开发度越高。` };
  };
  const people = () => {
    const note = (ROUTE_LOOKUPS[id] || []).find((row) => row[0] === "游客人数");
    if (note) return miss(`${note[3]} 没有游客人数，不把 popular 换成 0–10。`);
    return miss("已打开的记录里没有游客人数，也没有记下 popular 这类用词。不从火车站推断人流。");
  };
  const scene = () => {
    if (!page || !page.land.length) return miss("官方页没有点名地貌，不画成 0。");
    const score = routeRound(page.land.length / ROUTE_LAND.length * 10);
    return { state: "scored", score, reason: `官方页点名 ${page.land.join("、")}，${page.land.length}/16×10 = ${score}。${page.landNote || ""}` };
  };
  const animals = () => {
    if (!pack.animals || pack.animals.state !== "scored") {
      return miss("存储记录里没有同时带日期和粗略公里的物种。历史记录，不代表当天一定出现。");
    }
    const names = pack.animals.list.map((item) => item.name).join("、");
    return { state: "scored", score: pack.animals.score, reason: `${pack.animals.list.length} 个有日期和粗略公里的物种：${names}。分数是物种数，封顶 10。历史记录，不代表当天一定出现。` };
  };
  const wildness = () => miss("页面没有写离道路或房屋的距离。设施多少不能代替这段距离。");
  const danger = () => miss("页面没有给出危险度。陡坡、台阶或信号句子留在查过的记录里，不换成 0–10。高爽感分不是这一条。");
  const climb = () => {
    if (page && page.climb != null) {
      const score = routeRound(Math.min(10, page.climb / 200));
      return { state: "scored", score, reason: `页面写了爬升 ${page.climb} m。等级不是米数。` };
    }
    return miss("页面没有爬升米数。等级不是米数。对不上的第三方米数不采用。");
  };
  const remote = () => miss("这条自己的页面没有 unmarked 或 remote。人少和野度不是离开步道的许可。");
  const transit = () => {
    if (page && page.lastOpen) return miss(`${page.lastLeg} 最后一段交通未落实，不标成高交通分，也不换成 0–10。`);
    return miss("存储的公共交通没有被页面写成 0–10。最后一段未落实的不标成高分。");
  };
  const retreat = () => miss("没有写明的撤退等级，或没有把手机信号写成呼救条件的量化分。缺了就是依据不足，不画成 0。");
  return [
    ["开发度", facilities()],
    ["人流量", people()],
    ["风景", scene()],
    ["动物", animals()],
    ["荒野度", wildness()],
    ["危险度", danger()],
    ["爬升度", climb()],
    ["野度", remote()],
    ["交通", transit()],
    ["撤退", retreat()]
  ];
}

function routeCard(id) {
  const pack = routePack(id);
  const page = pack.page;
  const site = typeof SITES !== "undefined" ? SITES.find((item) => item.id === id) : null;
  const title = page ? page.name : (site ? site.name : id);
  const animalBits = pack.animals.list && pack.animals.list.length
    ? pack.animals.list.map((item) => {
      const sample = item.rows[0];
      return `${item.name} ${sample.date} 约 ${sample.km} km ${sample.source || ""}`;
    }).join("；")
    : "查过仍未写明。存储的公开记录里没有带来源、日期和粗略公里的物种。";
  const funLine = pack.fun.state === "scored"
    ? `综合爽感：${pack.fun.score}/10。计入 ${pack.fun.used.join("、")}。没有放进这个数的：${pack.fun.dropped.join("、")}。缺的输入和打开过的页写在每条查过的记录里。`
    : "综合爽感不显示数字。没有任何一项够一半输入。";
  const warn = pack.fun.warn ? "爽感高，但导航和撤退难度也高。高分不是安全许可。" : "高分不是安全许可。";
  const off = pack.off ? `${pack.off.label}｜${pack.off.url || "无链接"}｜${pack.off.quote || ""}｜${pack.off.checked || ROUTE_DAY}` : "查过仍未写明。这一处还没有打开过的离开步道页面。";
  const bars = routeTen(id, pack).map((row) => routeBarHtml(row[0], row[1])).join("");
  return `<article class="route-card" data-route-card="${routeEsc(id)}">
    <h3>${routeEsc(title)}</h3>
    <section class="ten-bars">${bars}<p>这十条只描述已打开的页面或已存记录。不是出发许可。人少和野度不是离开步道的许可。</p></section>
    <p class="route-tags">${pack.tags.length ? pack.tags.map((tag) => `<span>${routeEsc(tag)}</span>`).join("") : "<span>没有足够依据的标签</span>"}</p>
    <p>里程 ${routeEsc(page ? page.distance : "查过仍未写明")}。时间 ${routeEsc(page ? page.time : "查过仍未写明")}。爬升见下面的查过记录。等级 ${routeEsc(page ? page.grade : "查过仍未写明")}。</p>
    <p>Central 到入口的时间：${routeEsc(page ? page.central : "查过仍未写明")}</p>
    <p>最后一段：${routeEsc(page ? page.lastLeg : "查过仍未写明。最后一段交通未落实。")}</p>
    <p>出租车：${routeEsc(page ? page.taxi : "需询价")}</p>
    ${page && page.taxiAside ? `<p>${routeEsc(page.taxiAside)} 来源 https://transportnsw.info/travel-info/ways-to-get-around/taxi-hire-vehicle/rank-hail-taxi-fares-charges ｜ https://www.nationalparks.nsw.gov.au/things-to-do/cycling-trails/mount-hay-road-leura/visitor-info ｜ ${ROUTE_DAY}。按官方费率估算。</p>` : ""}
    <p>末班风险见下面的查过记录。不把对不齐的栏位写成末班。</p>
    ${routeScoreLine("野性／原始感", pack.wild)}
    ${page ? page.wild.filter((row) => row[2] != null).map((row) => `<p>原始感输入 · ${routeEsc(row[0])}：${routeEsc(row[1])} 已官方确认。</p>`).join("") : ""}
    ${routeScoreLine("刺激", pack.thrill)}
    ${page ? page.thrill.filter((row) => row[2] != null).map((row) => `<p>刺激输入 · ${routeEsc(row[0])}：${routeEsc(row[1])} 已官方确认。</p>`).join("") : ""}
    ${routeScoreLine("风景", pack.scene)}
    <p>页面点名的地貌：${pack.scene.named.length ? routeEsc(pack.scene.named.join("、")) : "没有"}。${routeEsc(page ? page.landNote : "")} 已官方确认。没点名的不加。</p>
    ${routeScoreLine("动物", pack.animals)}
    <p>动物：${routeEsc(animalBits)}。历史记录，不代表当天一定出现。不保证出现。不写巢穴或栖息坐标。来源等级：第三方参考。</p>
    ${routeScoreLine("交通方便", pack.transit)}
    ${routeScoreLine("安全和撤退", pack.safety)}
    <p><strong>${routeEsc(funLine)}</strong> ${routeEsc(warn)} ${pack.fun.state === "scored" ? `主要原因来自上面计入的项，不是凭感觉。` : ""}</p>
    <p>离开步道：${routeEsc(off)}。人少或荒野感不是离开步道的许可。</p>
    <p>独自见下面的查过记录。没有来源写「是」或「有条件」，所以不标适合第一次独自探索。刺激分和撤退分都没有到 7，不写「爽感高，但导航和撤退难度也高」。</p>
    <p>封闭见下面的查过记录。离开步道和最后一段仍分开写。人少不是离开步道的许可。高分不是安全许可。</p>
    <details class="atlas-fold"><summary>查过的来源</summary>${(ROUTE_LOOKUPS[id] || []).map((row) => `<p class="factmeta">${routeEsc(row[0])}｜<a href="${routeEsc(String(row[2]).split("｜")[0])}" target="_blank" rel="noreferrer">${routeEsc(row[2])}</a>｜${routeEsc(row[3])}｜${ROUTE_DAY}｜${routeEsc(row[1])}</p>`).join("")}</details>
    <p>更新：${ROUTE_DAY}。${page ? `<a href="${routeEsc(page.url)}" target="_blank" rel="noreferrer">${routeEsc(page.url)}</a>` : "这一处还没有另打开的路线页。"}</p>
  </article>`;
}

function routeFiltersOn() {
  return Array.from(document.querySelectorAll("[data-route-filter]:checked")).map((box) => box.dataset.routeFilter);
}

function routeMatch(id) {
  const on = routeFiltersOn();
  if (!on.length) return true;
  const pack = routePack(id);
  return on.every((key) => pack.filters[key]);
}

function routeSortKey() {
  const node = document.getElementById("routeSort");
  if (!node || !node.value) return "";
  if (node.value === "wild2") return "wild";
  return node.value;
}

function routeOrdered(rows) {
  const key = routeSortKey();
  if (!key) return rows;
  const cheap = key === "taxi";
  return rows.slice().sort((a, b) => {
    const av = routePack(a.id).sort[key];
    const bv = routePack(b.id).sort[key];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    return cheap ? av - bv : bv - av;
  });
}

function routeMount() {
  const filters = document.getElementById("filters");
  if (!filters || document.getElementById("routeTools")) return;
  const box = document.createElement("fieldset");
  box.id = "routeTools";
  const sorts = [
    ["", "路线排序：不另排"],
    ["wild", "最野"],
    ["wild2", "原始感最高"],
    ["people", "人最少"],
    ["length", "最长"],
    ["effort", "最累"],
    ["climb", "爬升最多"],
    ["thrill", "最刺激"],
    ["scene", "风景最好"],
    ["animals", "动物最多"],
    ["photo", "最适合摄影"],
    ["solo", "最适合第一次独行"],
    ["transit", "最容易公共交通到达"],
    ["taxi", "出租车最便宜"],
    ["day", "最容易当天往返"],
    ["summer", "最适合夏季"],
    ["offline", "离线感最强"],
    ["fun", "综合最爽"],
    ["safety", "安全和撤退最优先"]
  ];
  const checks = [
    ["wild", "最野"],
    ["reach", "公共交通可达"],
    ["day", "单日往返"],
    ["animals", "动物丰富"],
    ["birds", "鸟类丰富"],
    ["summer", "最适合夏季"],
    ["taxi", "出租车往返≤AUD 100"],
    ["waterfall", "瀑布"]
  ];
  box.innerHTML = `<legend>路线分数</legend>
    <label>排序 <select id="routeSort">${sorts.map(([value, label], index) => `<option value="${value}"${index === 0 ? "" : ` data-label="${routeEsc(label)}"`}>${routeEsc(label)}</option>`).join("")}</select></label>
    <p class="note">依据不足的排在有分数的后面。公共交通可达不含最后一段未落实。没有实测公里就不标出租车价格，费用保持需询价。</p>
    ${checks.map(([value, label]) => `<label class="flow-cat"><input type="checkbox" data-route-filter="${value}"> ${routeEsc(label)}</label>`).join("")}
    <div id="routePick"><p>挑三条。勾上面的条件后再看。</p>
      <button type="button" id="routePickGo">看符合条件的前三条</button>
      <div id="routePickOut"></div>
    </div>`;
  filters.appendChild(box);
  const style = document.createElement("style");
  style.textContent = ".route-card{border:1px solid var(--line);margin:0 0 12px;padding:8px 10px;background:var(--bg-2)}.route-card h3{margin:0 0 6px;font-size:16px}.route-card p{margin:0 0 6px}.route-tags span{display:inline-block;margin:0 6px 6px 0;padding:1px 6px;border:1px solid var(--line)}#routeTools{margin:8px 0}.ten-bar{margin:0 0 8px}.ten-label{display:flex;justify-content:space-between;gap:8px}.ten-track{height:8px;background:#232820;margin:3px 0}.ten-fill{height:8px;background:#f3f0e6}.ten-bar[data-ten-state='依据不足'] .ten-track{display:none}";
  document.head.appendChild(style);
  const routeRefresh = () => {
    if (typeof renderSide === "function" && (typeof view === "undefined" || view === "atlas")) {
      renderSide();
      if (typeof syncMarkers === "function") syncMarkers(false);
    }
  };
  box.addEventListener("change", routeRefresh);
  box.addEventListener("click", (event) => {
    if (event.target.matches("input, select, option, label")) setTimeout(routeRefresh, 0);
  });
  document.getElementById("routePickGo").addEventListener("click", routeRecommend);
}

function routeRecommend() {
  const out = document.getElementById("routePickOut");
  if (!out || typeof SITES === "undefined") return;
  const on = routeFiltersOn();
  if (!on.length) {
    out.innerHTML = "<p>先勾条件。没有条件时不挑。</p>";
    return;
  }
  const rows = SITES.filter((site) => {
    const pack = routePack(site.id);
    if (pack.off && pack.off.label === "越野禁止") return false;
    return routeMatch(site.id);
  });
  const ranked = routeOrdered(rows).slice(0, 3);
  if (!ranked.length) {
    out.innerHTML = "<p>这组条件下面没有地点。最后一段未落实的不算公共交通可达。越野禁止不会被推荐去越野。</p>";
    return;
  }
  out.innerHTML = ranked.map((site) => {
    const pack = routePack(site.id);
    const why = pack.fun.state === "scored"
      ? `它进前三是因为勾中的条件都符合，综合 ${pack.fun.score}/10，只计入 ${pack.fun.used.join("、")}。`
      : "它符合勾中的条件，但综合分依据不足，所以排在有分数的后面。";
    const risk = pack.page ? pack.page.risk : "安全和撤退依据不足。没有已打开的页面把一项写成最大风险。";
    return `<article class="route-card" data-route-pick="${routeEsc(site.id)}">
      <h3>${routeEsc(site.name)}</h3>
      <p>为什么挑它：${routeEsc(why)}</p>
      <p>最大风险：${routeEsc(risk)}</p>
      <p>折返：${routeEsc(pack.page ? `官方建议时间 ${pack.page.time}。` : "")}步速未测。</p>
      <p>装备：日间徒步层。这是普通步行，不加入攀岩装备。</p>
      <p>备选：返程班次或当天天气告示还有未查项，不另给一条已经落实的备选。</p>
    </article>`;
  }).join("");
}

function routeDecorate() {
  const side = document.getElementById("side");
  if (!side) return;
  side.querySelectorAll(".route-card").forEach((node) => node.remove());
  side.querySelectorAll(".row[data-id]").forEach((button) => {
    const id = button.dataset.id;
    if (!id || button.closest("#placeDock")) return;
    const pack = routePack(id);
    if (pack.page) button.insertAdjacentHTML("afterend", routeCard(id));
  });
  const brief = document.getElementById("briefPlaces");
  if (brief) brief.hidden = routeFiltersOn().length > 0;
}

routeMount();

if (typeof filtered === "function") {
  const routeFiltered = filtered;
  filtered = function routeFilteredWrapped() {
    const rows = routeFiltered.apply(this, arguments).filter((site) => routeMatch(site.id));
    return routeOrdered(rows);
  };
}

if (typeof flowOfftrackRest === "function") {
  const routeOfftrackRest = flowOfftrackRest;
  flowOfftrackRest = function routeOfftrackRestWrapped() {
    const result = routeOfftrackRest.apply(this, arguments);
    const side = document.getElementById("side");
    if (!side || !routeFiltersOn().length) return result;
    side.querySelectorAll("#offtrackRest .row[data-id]").forEach((button) => {
      if (!routeMatch(button.dataset.id)) button.remove();
    });
    const rest = document.getElementById("offtrackRest");
    if (rest && !rest.querySelector(".row")) rest.remove();
    return result;
  };
}
if (typeof renderSide === "function") {
  const routeRenderSide = renderSide;
  renderSide = function routeRenderSideWrapped() {
    const result = routeRenderSide.apply(this, arguments);
    routeDecorate();
    return result;
  };
  if (typeof view === "undefined" || view === "atlas") renderSide();
}
