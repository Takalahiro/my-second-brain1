/* 只收录这次打开成功、并且页面写明属于蓝山的 NPWS 步道。没写的距离、时间、等级保持查过仍未写明。 */
const BM_TRACKS = [
  { name: "Grand Canyon track", url: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/grand-canyon-track", distance: "6.3km loop", time: "3 - 4hrs", grade: "Grade 3" },
  { name: "Mount Banks Summit walk", url: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/mount-banks-summit-walk", distance: "2.4km return", time: "2 - 3hrs", grade: "Grade 3" },
  { name: "Three Sisters walk", url: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/three-sisters-walk", distance: "0.8km return", time: "25 - 45min", grade: "Grade 1" },
  { name: "Fairfax Heritage walking track", url: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/fairfax-heritage-walking-track", distance: "1.8km one-way", time: "30 - 45min", grade: "Grade 1" },
  { name: "Govetts Leap descent", url: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/govetts-leap-descent", distance: "1.8km return", time: "1 - 2hrs", grade: "Grade 4" },
  { name: "Cliff Top walking track", url: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/cliff-top-walking-track", distance: "6km return", time: "3hrs - 3hrs 30min", grade: "Grade 3" },
  { name: "Mount Hay summit walking track", url: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/mount-hay-summit-walking-track", distance: "4.5km return", time: "2 - 3hrs", grade: "Grade 5" },
  { name: "Victoria Falls walking track", url: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/victoria-falls-walking-track", distance: "4km return", time: "2hrs - 2hrs 30min", grade: "Grade 4" },
  { name: "Lockley Pylon walking track", url: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/lockley-pylon-walking-track", distance: "7km return", time: "2 - 3hrs", grade: "Grade 3" },
  { name: "Princes Rock walking track", url: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/princes-rock-walking-track", distance: "1.8km return", time: "30min - 1hr", grade: "Grade 3" },
  { name: "Ruined Castle walking track", url: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/ruined-castle-walking-track", distance: "6.6km return", time: "4 - 5hrs", grade: "Grade 4" },
  { name: "Mount Solitary walking track", url: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/mount-solitary-walking-track", distance: "34km loop", time: "3 days", grade: "Grade 5" },
  { name: "Darwins walk", url: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/darwins-walk", distance: "2.4km one-way", time: "45min - 1hr 15min", grade: "Grade 3" },
  { name: "Prince Henry Cliff walk", url: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/prince-henry-cliff-walk", distance: "7km one-way", time: "3 - 4hrs", grade: "Grade 3" },
  { name: "Lyrebird Dell walking track", url: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/lyrebird-dell-walking-track", distance: "1.7km loop", time: "45min - 1hr 30min", grade: "Grade 3" },
  { name: "Glenbrook Gorge track", url: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/glenbrook-gorge-track", distance: "3km return", time: "1hr 30min - 2hrs 30min", grade: "Grade 4" },
  { name: "Nepean River walking track", url: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/nepean-river-walking-track", distance: "1.8km loop", time: "30 - 45min", grade: "Grade 3" },
  { name: "Wentworth Falls track", url: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/wentworth-falls-track", distance: "1.4km return", time: "45min - 1hr", grade: "Grade 3" },
  { name: "Giant Stairway", url: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/giant-stairway", distance: "", time: "", grade: "" },
  { name: "National Pass", url: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/national-pass", distance: "4.5km loop", time: "2hrs 30min - 3hrs 30min", grade: "Grade 4" },
  { name: "Grand Cliff Top Walk", url: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/grand-cliff-top-walk", distance: "19km one-way", time: "2 days", grade: "Grade 3" },
  { name: "Jack Evans walking track", url: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/jack-evans-walking-track", distance: "2.6km return", time: "30min - 1hr", grade: "Grade 3" },
  { name: "Den Fenella walking track", url: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/den-fenella-walking-track", distance: "1km return", time: "45min - 1hr", grade: "Grade 3" },
  { name: "Jellybean track", url: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/jellybean-track", distance: "1km return", time: "30min - 1hr", grade: "Grade 3" },
  { name: "Federal Pass", url: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/federal-pass", distance: "13km one-way", time: "6hrs 30min", grade: "Hard" }
];

const PARK_TRACKS = {
  blue: { title: "蓝山的官方步道", rows: BM_TRACKS },
  royal: {
    title: "皇家国家公园的官方步道",
    rows: [
      { name: "Bundeena Drive to Marley walk", url: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/bundeena-drive-to-marley-walk", distance: "7.8km return", time: "3 - 4hrs", grade: "Grade 3" },
      { name: "Bungoona lookout and path", url: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/bungoona-lookout-and-path", distance: "0.92km return", time: "30min", grade: "Grade 1" },
      { name: "Couranga walking track", url: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/couranga-walking-track", distance: "5.1km one-way", time: "1hr 30min - 2hrs 30min", grade: "Grade 3" },
      { name: "Curra Moors loop track", url: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/curra-moors-loop-track", distance: "10km loop", time: "4 - 5hrs", grade: "Grade 4" },
      { name: "Forest path", url: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/forest-path", distance: "4.4km loop", time: "1hr - 1hr 30min", grade: "Grade 3" },
      { name: "Karloo walking track", url: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/karloo-walking-track", distance: "10km return", time: "3 - 5hrs", grade: "Grade 3" },
      { name: "Palm Jungle loop track", url: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/palm-jungle-loop-track", distance: "10km loop", time: "4 - 6hrs", grade: "Grade 4" },
      { name: "The Coast Track", url: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/the-coast-track", distance: "27km one-way", time: "2 days", grade: "Grade 4" },
      { name: "Uloola walking track", url: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/uloola-walking-track", distance: "11km one-way", time: "4 - 6hrs", grade: "Grade 3" },
      { name: "Werrong Beach track", url: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/werrong-beach-track", distance: "4km return", time: "1hr 30min - 2hrs 30min", grade: "Grade 5" }
    ]
  },
  heathcote: {
    title: "希思科特的官方步道",
    rows: [
      { name: "Bullawarring walking track", url: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/bullawarring-walking-track", distance: "5.5km one-way", time: "3 - 4hrs", grade: "Grade 4" },
      { name: "Lake Toolooma trail", url: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/lake-toolooma-trail", distance: "5km return", time: "2 - 3hrs", grade: "Grade 4" },
      { name: "Mooray walking track", url: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/mooray-walking-track", distance: "5km return", time: "3 - 4hrs", grade: "Grade 4" }
    ]
  },
  kuringgai: {
    title: "库灵盖的官方步道",
    rows: [
      { name: "Aboriginal Heritage walk", url: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/aboriginal-heritage-walk", distance: "4.4km loop", time: "2hrs 30min - 3hrs 30min", grade: "Grade 4" },
      { name: "America Bay walking track", url: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/america-bay-walking-track", distance: "1.8km return", time: "1 - 2hrs", grade: "Grade 3" },
      { name: "Bairne walking track", url: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/bairne-walking-track", distance: "9.6km return", time: "3hrs - 3hrs 30min", grade: "Grade 3" },
      { name: "Berowra track to Apple Tree Bay", url: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/berowra-track-to-apple-tree-bay", distance: "", time: "", grade: "" },
      { name: "Birrawanna walking track", url: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/birrawanna-walking-track", distance: "4km return", time: "1hr 30min - 2hrs 30min", grade: "Grade 3" },
      { name: "Elvina trail", url: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/elvina-trail", distance: "6km return", time: "1 - 2hrs", grade: "Grade 3" },
      { name: "Flint and Steel track", url: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/flint-and-steel-track", distance: "2km return", time: "45min - 1hr 15min", grade: "Grade 3" },
      { name: "Gibberagong walking track", url: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/gibberagong-walking-track", distance: "8.3km return", time: "3hrs 30min - 4hrs 30min", grade: "Grade 3" },
      { name: "Great North walk – Ku-ring-gai Chase National Park", url: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/great-north-walk-in-kuringgai-chase-national-park", distance: "11km one-way", time: "4hrs 30min - 5hrs 30min", grade: "Grade 4" },
      { name: "Kalkari discovery trail", url: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/kalkari-discovery-trail", distance: "1km loop", time: "30 - 45min", grade: "Grade 2" },
      { name: "Mount Ku-ring-gai track to Berowra Station", url: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/mount-kuringgai-track-to-berowra-station", distance: "10km one-way", time: "3hrs 30min - 4hrs 30min", grade: "Grade 3" },
      { name: "Red Hands Cave walking track - Ku-ring-gai Chase National Park", url: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/red-hands-cave-walking-track-kuringgai-chase-national-park", distance: "0.6km return", time: "30 - 45min", grade: "Grade 4" },
      { name: "Salvation loop trail", url: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/salvation-loop-trail", distance: "4km loop", time: "1 - 2hrs", grade: "Grade 3" },
      { name: "Sphinx Memorial to Bobbin Head loop track", url: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/sphinx-memorial-to-bobbin-head-loop-track", distance: "10km loop", time: "3hrs 30min - 4hrs 30min", grade: "Grade 4" },
      { name: "The Basin track and Mackerel track", url: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/the-basin-track-and-mackerel-track", distance: "9.6km return", time: "2 - 3hrs", grade: "Grade 3" },
      { name: "Topham walking track", url: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/topham-walking-track", distance: "3.7km return", time: "1 - 2hrs", grade: "Grade 4" },
      { name: "Wallaroo walking track", url: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/wallaroo-walking-track", distance: "9km return", time: "2hrs 30min - 3hrs 30min", grade: "Grade 4" },
      { name: "Waratah walking track", url: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/waratah-walking-track", distance: "10km return", time: "2hrs 30min - 3hrs 30min", grade: "Grade 4" },
      { name: "West Head army track", url: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/west-head-army-track", distance: "0.45km one-way", time: "1hr - 1hr 30min", grade: "Grade 4" },
      { name: "Willunga Trig walking track", url: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/willunga-trig-walking-track", distance: "1.5km return", time: "30min - 1hr 30min", grade: "Grade 4" }
    ]
  },
  bouddi: {
    title: "布迪的官方步道",
    rows: [
      { name: "Bouddi coastal walk", url: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/bouddi-coastal-walk", distance: "8.5km one-way", time: "3hrs 30min - 4hrs 30min", grade: "Grade 3" },
      { name: "Box Head track", url: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/box-head-track", distance: "3.1km return", time: "45min - 1hr 15min", grade: "Grade 3" },
      { name: "Bullimah Spur track", url: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/bullimah-spur-track", distance: "2.4km return", time: "40 - 45min", grade: "Grade 3" },
      { name: "Daleys Point walking track", url: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/daleys-point-walking-track", distance: "3.2km return", time: "1hr 15min - 1hr 45min", grade: "Grade 3" },
      { name: "Flannel Flower walking track", url: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/flannel-flower-walking-track", distance: "2.9km return", time: "45min - 1hr 15min", grade: "Grade 3" },
      { name: "Maitland Bay track", url: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/maitland-bay-track", distance: "2km return", time: "15 - 45min", grade: "Grade 3" },
      { name: "Mount Bouddi walking track", url: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/mount-bouddi-walking-track", distance: "2.4km return", time: "30min - 1hr 30min", grade: "Grade 3" }
    ]
  }
};

function trackEsc(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[ch]));
}

function trackFact(label, value) {
  return value ? `${label} ${value}` : `${label} 查过仍未写明`;
}

const TRACK_BAR_REASONS = [
  ["开发度", "这次打开的页只记下距离、时间和等级，没有写成形步道、路标、厕所或售卖点。"],
  ["人流量", "没有游客人数，也没有 popular 这类用词。火车站不算人流量。"],
  ["风景", "这次记下的字段里没有点名地貌。"],
  ["动物", "没有这条步道自己的、带日期和粗略公里的记录。历史记录，不代表当天一定出现。"],
  ["荒野度", "页面没有写离道路或房屋的距离。"],
  ["危险度", "等级不是危险度。没有另写的危险句子，不换成 0–10。"],
  ["爬升度", "没有爬升米数。等级不是米数。"],
  ["野度", "页面没有 unmarked 或 remote。这不是离开步道的许可。"],
  ["交通", "没有这条步道自己的最后一段。不把车站写成高交通分。"],
  ["撤退", "没有写明的撤退办法或呼救信号。"]
];

function trackBarsHtml(track) {
  const stored = track.url.indexOf("/karloo-walking-track") >= 0 ? "karloo" : (track.url.indexOf("/grand-cliff-top-walk") >= 0 ? "blue" : "");
  if (stored && typeof routeTen === "function" && typeof routePack === "function") {
    return routeTen(stored, routePack(stored)).map((row) => routeBarHtml(row[0], row[1])).join("");
  }
  return TRACK_BAR_REASONS.map(([label, reason]) => routeBarHtml(label, { state: "依据不足", reason })).join("");
}

function trackListHtml(id) {
  const pack = PARK_TRACKS[id];
  const rows = pack.rows.map((track) => `<article class="track-row" data-track="${trackEsc(track.url)}">
      <strong>${trackEsc(track.name)}</strong>
      <small>已官方确认</small>
      <a href="${trackEsc(track.url)}" target="_blank" rel="noreferrer">${trackEsc(track.url)}</a>
      <small>${trackEsc(trackFact("距离", track.distance))}。${trackEsc(trackFact("时间", track.time))}。${trackEsc(trackFact("等级", track.grade))}。</small>
      <section class="ten-bars">${trackBarsHtml(track)}</section>
    </article>`).join("");
  return `<div id="parkTracks" data-park="${trackEsc(id)}"><h3>${trackEsc(pack.title)}</h3><p class="note">下面每条都是这次打开的 NPWS 页面。距离、时间和等级只写页面上的原句。等级不是爬升米数。这不是离开步道的许可。</p>${rows}</div>`;
}

function trackShowBlue() {
  const side = document.getElementById("side");
  if (!side) return;
  const open = (typeof flowPlace === "string" && flowPlace) || (typeof activeId === "string" && activeId) || "";
  const old = document.getElementById("parkTracks") || document.getElementById("blueTracks");
  if (!PARK_TRACKS[open]) {
    if (old) old.remove();
    return;
  }
  if (typeof routeDecorate === "function") routeDecorate();
  const current = document.getElementById("parkTracks");
  if (current && current.dataset.park === open) return;
  if (current) current.remove();
  const leftover = document.getElementById("blueTracks");
  if (leftover) leftover.remove();
  const row = side.querySelector(`.row[data-id="${open}"]`);
  if (!row) return;
  const card = row.nextElementSibling && row.nextElementSibling.classList.contains("route-card") ? row.nextElementSibling : row;
  card.insertAdjacentHTML("afterend", trackListHtml(open));
}

if (typeof renderSide === "function") {
  const trackRenderSide = renderSide;
  renderSide = function trackRenderSideWrapped() {
    const result = trackRenderSide.apply(this, arguments);
    trackShowBlue();
    return result;
  };
}

if (typeof openSite === "function") {
  const trackOpenSite = openSite;
  openSite = function trackOpenSiteWrapped(id) {
    const result = trackOpenSite.apply(this, arguments);
    trackShowBlue();
    return result;
  };
}
