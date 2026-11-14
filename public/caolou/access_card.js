const ACCESS_CHECKED = "2026-11-13";
const ACCESS_BMT = "https://transportnsw.info/documents/timetables/93-BMT-Blue-Mountains-Line-20260419.pdf";
const ACCESS_PLAN = "https://www.environment.nsw.gov.au/sites/default/files/blue-mountains-np-kanangra-boyd-np-plan-of-management-240234.pdf";

function accessMeta(source, scope, valid, state) {
  const link = /^https?:/.test(source)
    ? `<a href="${esc(source)}" target="_blank" rel="noreferrer">${esc(source)}</a>`
    : esc(source);
  return `<p class="factmeta">${link}｜${esc(scope)}｜${esc(ACCESS_CHECKED)}｜${esc(valid)}｜${esc(state)}</p>`;
}

function accessMode(mode) {
  if (mode === "轮渡") return "渡轮";
  if (mode === "火车" || mode === "公交" || mode === "轻轨" || mode === "步行") return mode;
  return mode || "待核实";
}

function accessReturnBlock(note) {
  return `<p><strong>返程。</strong>${esc(note)}</p>
    <p>班次与运行日：待核实。最晚上车：待核实。延误余量：待核实。给司机或车站的信号：待核实。没有信号时怎么约定：待核实。错过这一班的后备：待核实。</p>
    ${accessMeta("返程没有另查", "从入口回到 Central", "未查", "待核实")}`;
}

const TAXI_TARIFF = "https://transportnsw.info/travel-info/ways-to-get-around/taxi-hire-vehicle/rank-hail-taxi-fares-charges";
const TAXI_ORDER = "https://www.transport.nsw.gov.au/operations/point-to-point-transport/taxi-information";
const MOUNT_HAY = "https://www.nationalparks.nsw.gov.au/things-to-do/cycling-trails/mount-hay-road-leura/visitor-info";

function accessPrice() {
  return `<p>票价：需询价。这次没有打开 Opal 价区或运营商票价页。</p>${accessMeta("无票价页", "去程和回程", "未查", "待核实")}`;
}

function accessTaxiUnknown() {
  return `<p>出租车：没有命名站点到命名入口的实测公里，不套官方费率。需询价。Lithgow 那种大约 5 公里、城镇到公园的笼统距离，都不拿来算。需向司机确认是否愿接。这不是预订。最后一段交通未落实。不是可达。</p>`;
}

function accessMountHayTaxi() {
  const kilometres = 0.6;
  const flagFall = 5.17;
  const perKm = 2.61;
  const sum = flagFall + kilometres * perKm;
  const fare = (Math.round(sum * 100) / 100).toFixed(2);
  return `<section class="access-card" data-access-place="blue" data-taxi="mount-hay" data-conclusion="最后一段交通未落实">
    <h3>拼程 · Leura 站到 Mount Hay Road</h3>
    <p>城镇：Leura。站点：Leura train station。入口：Mount Hay Road。三处分开写。页面写车站离 Mount Hay Road 600 米。这不是到终点停车场，也不是把整座蓝山当成一个点。</p>
    <p>Central 到 Leura 的火车：未查到。这次没有打开蓝山线时刻表，不抄车次和钟点。Leura 的地方公交：未查到。再往停车场的一段：未查到。</p>
    <p><strong>按官方费率估算 $${fare}。</strong>用的是市区日间 rank and hail 最高价，不是 22:00 到 6:00 的夜间公里价。起步 $${flagFall.toFixed(2)}，前 12 公里每公里 $${perKm.toFixed(2)}。0.6 × 2.61 = 1.566，加起步后是 6.736，计到分为 $${fare}。公里数：0.6。核实日期 2026-11-13。</p>
    <p>这张表没有预约费。预约车费不受 rank and hail 最高价约束，所以不加一笔预约费。若业者转嫁旅客服务费，页面写再加 $1.32，这一笔不在 $${fare} 里。</p>
    <p>回程按同一段 0.6 km、同一日间费率估算，也是 $${fare}。回程班次未查到，不写成返程已落实。</p>
    <p>页面另写 Mount Hay Road 是未铺装路：转入后 4 km 到公园边界，然后再 11.4 km 到终点停车场。那两段不是从车站量起的同一段路，不算进这 0.6 km。估算不能证明司机会开上未铺装路，也不能证明会开到停车场。</p>
    <p>需向司机确认是否愿接。这不是预订，也不是确认报价。最后一段交通未落实。不是可达。这一段没有两端坐标，地图不画线。站点坐标未取得。</p>
    ${accessMeta(TAXI_TARIFF, "市区日间起步 $5.17，前 12 公里 $2.61。Blue Mountains 地方政府区列在都市区。", "2026-11-13 打开的页面。日间费率。", "按官方费率估算")}
    ${accessMeta(MOUNT_HAY, "Leura train station is 600m from Mount Hay Road。", "2026-11-13", "已确认")}
    ${accessMeta(TAXI_ORDER, "预约服务的车费不受 rank and hail 最高价约束。Point to Point Transport (Fares) Order 2026 (No.2 of 2026) 自 2026-11-07 起不改变 2026-06-01 的费率结构。", "2026-11-13", "已确认")}
  </section>`;
}

function accessNotCamp() {
  return "<p>这张卡只写怎么往返。交通写清了，也不等于可以扎营。</p>";
}

function accessOrderNote() {
  return "<p>核对顺序：火车＋步行，火车＋普通公交＋步行，火车＋NSW TrainLink，公共交通＋商业徒步接送，公共交通＋预约出租车或私人接送。不把最近的车站当成入口。</p>";
}

function accessBlackheathCard() {
  return `<section class="access-card" data-access-place="blackheath-station" data-conclusion="去程可达，返程未落实">
    <h3>前往卡 · Blackheath Station</h3>
    <p><strong>结论：去程可达，返程未落实。</strong>不写成公共交通＋步行可达。车站不是 Grose 的步道口。</p>
    ${accessOrderNote()}
    <p>入口名称：Blackheath Station｜坐标：待核实｜连接的徒步路线：待核实｜官方来源：Blue Mountains Line 时刻表。</p>
    ${accessMeta(ACCESS_BMT, "Central 与 Blackheath 站之间的城际火车。不是步道口。", "表头写 2026-04-19 起。页内写明不含假期改点。", "已确认")}
    <p>火车＋步行：火车到站已印在表上。出站以后走到哪一个步道口，没有核实，最后一段交通未落实。</p>
    <p>火车＋普通公交＋步行：没有另打开夏季公交时刻表。</p>
    <p>火车＋NSW TrainLink：这份 BMT 城际表就是这一档的来源。夏季假期的钟点不抄，也不写车次号。</p>
    <p>公共交通＋商业徒步接送：未查到已公布班次，待发布。</p>
    ${accessTaxiUnknown()}
    ${accessReturnBlock("同一份表有 Blackheath 往 Central 的页。假期改点被排除，所以最晚一班不能当成已经核对。")}
    ${accessPrice()}
    <p>第二条独立走法：未落实。</p>
    ${accessNotCamp()}
  </section>`;
}

function accessLithgowCard() {
  return `<section class="access-card" data-access-place="lithgow-station" data-conclusion="尚未查到可行方式">
    <h3>前往卡 · Lithgow Station 到步道口</h3>
    <p><strong>结论：尚未查到可行方式。</strong>Lithgow 站印在同一份 BMT 表上，那只说明火车到站。不把大约 5 公里写成 Gardens of Stone 或 Newnes 的步道口距离。</p>
    ${accessOrderNote()}
    <p>入口名称：Lithgow Station｜坐标：待核实｜连接的徒步路线：待核实｜官方来源：Blue Mountains Line 时刻表。</p>
    ${accessMeta(ACCESS_BMT, "Central 与 Lithgow 站。不是 Gardens of Stone 的入口，也不是萤火虫隧道的入口。", "2026-04-19 起的快照，不含假期改点。", "已确认")}
    <p>火车＋步行：到站之后的步行没有官方步道口距离。最后一段交通未落实。</p>
    <p>火车＋普通公交＋步行：未查到已公布的夏季公交。</p>
    <p>火车＋NSW TrainLink：城际火车到 Lithgow 站。不延伸成步道口。</p>
    <p>公共交通＋商业徒步接送：未查到已公布班次，待发布。</p>
    ${accessTaxiUnknown()}
    ${accessReturnBlock("站到站的回程页存在，但从步道口回到车站的时间没有，所以入口的返程未落实。")}
    ${accessPrice()}
    <p>第二条独立走法：未落实。</p>
    ${accessNotCamp()}
  </section>`;
}

function accessWildEntrances(id) {
  if (id === "grose") {
    return `<p>大范围入口，只列有官方名字的。不放公园中心点。</p>
      <p>1. Blackheath Station｜坐标待核实｜出站后的步道待核实｜${esc(ACCESS_BMT)}</p>
      <p>2. Govetts Leap Lookout｜坐标待核实｜计划里的 Blackheath 访客点，没有从车站量到这里的步道｜${esc(ACCESS_PLAN)}</p>
      <p>3. Perrys Lookdown｜坐标待核实｜计划写这里的营地将关闭、只留白天。不是核实过的过夜入口｜${esc(ACCESS_PLAN)}</p>
      <p><strong>结论：尚未查到可行方式。</strong>火车只到 Blackheath 站。步道口那一段未落实，所以这块荒野不记成去程可达。</p>`;
  }
  if (id === "gos") {
    return `<p>大范围入口。</p>
      <p>1. Lithgow Station｜坐标待核实｜不采用大约 5 公里作为到保护地步道口的距离｜${esc(ACCESS_BMT)}</p>
      <p>2. Lost City 北停车场｜坐标待核实｜只出现在 2026 年 11 月道路养护告示里，而且那次封闭在季前结束｜https://www.nationalparks.nsw.gov.au/alerts</p>
      <p><strong>结论：尚未查到可行方式。</strong></p>`;
  }
  if (id === "kanangra") {
    return `<p>大范围入口。</p>
      <p>1. Kanangra Walls Road｜坐标待核实｜计划写这是主要车行入口，不是公共交通入口｜${esc(ACCESS_PLAN)}</p>
      <p>第二条入口：未落实。不另造一个名字。</p>
      <p><strong>结论：尚未查到可行方式。</strong></p>`;
  }
  if (id === "mainrange" || id === "jagungal" || id === "schlink" || id === "pilot") {
    return `<p>页面点过的地名：Charlotte Pass、Guthega、Rawson Pass。这些是禁营参照，不是夏季交通入口。不引用滑雪巴士时刻。</p>
      <p><strong>结论：尚未查到可行方式。</strong></p>`;
  }
  return `<p>没有核实到 2 个以上的官方入口。不造入口。</p><p><strong>结论：尚未查到可行方式。</strong></p>`;
}

function accessWildCard(id) {
  const area = typeof campArea === "function" ? campArea(id) : { name: id };
  const lead = id === "grose" ? accessBlackheathCard() : (id === "gos" ? accessLithgowCard() : "");
  return `${lead}<section class="access-card" data-access-place="${esc(id)}" data-conclusion="尚未查到可行方式">
    <h3>前往卡 · ${esc(area.name)}</h3>
    ${accessOrderNote()}
    ${accessWildEntrances(id)}
    <p>出发默认 Sydney Central Station。回程文字要有，但步道口的回程没有落实。</p>
    ${accessReturnBlock("没有核实的步道口，就没有最晚离开步道口的时间。")}
    ${accessPrice()}
    <p>第二条独立走法：未落实。</p>
    <p>商业徒步接送：待发布。预约接送：需询价，没有预订。</p>
    ${accessNotCamp()}
  </section>`;
}

function accessSiteCard(site) {
  const row = typeof TRANSIT !== "undefined" ? TRANSIT[site.id] : null;
  if (!row || !row.ok) {
    return `<section class="access-card" data-access-place="${esc(site.id)}" data-conclusion="尚未查到可行方式">
      <h3>前往卡 · ${esc(site.name)}</h3>
      <p><strong>结论：尚未查到可行方式。</strong>不要求每个地点都有公共交通，也不另编一条路来填这张卡。</p>
      ${accessOrderNote()}
      <p>入口名称：${esc(site.name)}｜坐标：记录里的点，不是另造的公园中心｜连接的徒步路线：待核实｜官方来源：2026-11-13 的谷歌公共交通查询没有给出行程。</p>
      ${accessMeta(row && row.url ? row.url : "无行程", site.name, "2026-11-13 的下一班查询，不是末班", "已确认")}
      <p>火车＋步行：这次查询没有给出。火车＋普通公交＋步行：没有给出。火车＋NSW TrainLink：没有给出。</p>
      <p>公共交通＋商业徒步接送：未查到已公布班次，待发布。预约出租车或私人接送：需询价，没有预订。</p>
      <p>最后一段交通未落实。</p>
      ${accessReturnBlock("去程都没有行程，返程也没有另查。")}
      ${accessPrice()}
      <p>第二条独立走法：未落实。</p>
      ${accessNotCamp()}
    </section>`;
  }
  const lines = (row.lines || []).map((line) => `${accessMode(line.mode)} ${line.code || ""}`.trim()).join("，");
  const hasTrain = (row.lines || []).some((line) => line.mode === "火车");
  const hasBus = (row.lines || []).some((line) => line.mode === "公交");
  const hasFerry = (row.lines || []).some((line) => line.mode === "轮渡");
  const trainWalk = hasTrain && !hasBus && !hasFerry;
  const trainBus = hasTrain && hasBus;
  return `<section class="access-card" data-access-place="${esc(site.id)}" data-conclusion="去程可达，返程未落实">
    <h3>前往卡 · ${esc(site.name)}</h3>
    <p><strong>结论：去程可达，返程未落实。</strong>返程没有另查，所以不记成公共交通＋步行可达。</p>
    ${accessOrderNote()}
    <p>入口名称：${esc(site.name)}｜坐标：记录里的点 ${site.lat}，${site.lng}，不是公园中心针｜下车点：${esc(row.alight || "查询未写")}｜连接的徒步路线：待核实｜来源：谷歌公共交通，${esc(row.at || ACCESS_CHECKED)}。</p>
    ${accessMeta(row.url || "谷歌公共交通", `${site.name}。查询给出的是下一班，不是末班。`, "仅 2026-11-13 这一次查询", "已确认")}
    <p>火车＋步行：${trainWalk ? `查询是这条。${esc(lines)}。地图步行约 ${row.walkM || "未写"} 米，不能证明负重走得动。` : "不是这次查询给出的走法。"}</p>
    <p>火车＋普通公交＋步行：${trainBus ? `查询是这条。${esc(lines)}。下车 ${esc(row.alight || "")}。地图步行约 ${row.walkM || "未写"} 米，不能证明负重走得动。公交号来自这次查询，不是另打开的官方时刻表。` : "不是这次查询给出的走法。"}</p>
    <p>火车＋NSW TrainLink：${hasTrain && /BMT|SCO|CCN/.test(lines) ? "查询里有城际线路代号。官方城际时刻表除下面的 Blackheath 卡以外，这次没有为这个地点另打开。" : "这次查询没有单独标成 TrainLink。"}</p>
    <p>${hasFerry ? `查询里有渡轮，它是这一条行程的一段，不是第二条独立路线。${esc(lines)}。` : "渡轮：这次查询没有给出。"}</p>
    <p>公共交通＋商业徒步接送：未查到已公布班次，待发布。</p>
    ${site.id === "blue" ? accessMountHayTaxi() : accessTaxiUnknown()}
    <p>查询写的全程约 ${esc(row.duration || "未写")}，出发 ${esc(row.depart || "未写")}，到达 ${esc(row.arrive || "未写")}。这是下一班，不是末班。最后一段若只是地图步行，不把下车点写成已经落实的步道口。出租车估算不把行程改成可达。</p>
    ${accessReturnBlock("没有做返程查询。")}
    ${accessPrice()}
    <p>第二条独立走法：未落实。查询里的换乘仍是同一条去程。</p>
    ${accessNotCamp()}
  </section>`;
}

function accessMountPrep() {
  const root = document.querySelector("#view .prep");
  if (!root || !activeId || root.querySelector(".access-card")) return;
  const site = typeof SITES !== "undefined" && SITES.find((item) => item.id === activeId);
  if (!site) return;
  root.insertAdjacentHTML("beforeend", accessSiteCard(site));
}

const accessRenderPrep = renderPrep;
renderPrep = function accessRenderPrepWrapped() {
  const result = accessRenderPrep.apply(this, arguments);
  accessMountPrep();
  return result;
};

const accessDetail = detailHtml;
detailHtml = function accessDetailWrapped(site) {
  return accessDetail(site) + accessSiteCard(site);
};

const accessCampRoute = campRouteHtml;
campRouteHtml = function accessCampRouteWrapped(id) {
  return accessCampRoute(id) + accessWildCard(id);
};

const accessCampList = campListHtml;
campListHtml = function accessCampListWrapped() {
  return accessCampList().replace('<div class="camp-detail">', `<div class="camp-detail">${accessBlackheathCard()}${accessLithgowCard()}`);
};
