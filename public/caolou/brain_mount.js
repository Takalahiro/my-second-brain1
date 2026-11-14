/**
 * Contract a parent shell can call later. This page does not register itself there.
 *
 * caolouMount({ start, date })
 *   start  departure name. Default "Sydney Central".
 *          "Sydney Central", "Sydney Central Station", "Central", and "草楼"
 *          use the surveyed public-transport conclusion. Other departures
 *          are not given an invented timetable.
 *   date   optional YYYY-MM-DD. It is not written onto the page.
 *          Clock times in the conclusion are not a timetable for that date.
 *
 * Returns { placeId, gearScheme, transport }
 *   placeId     id of the place currently open, or "" when none is open.
 *   gearScheme  chosen scheme name for that place, or "未选".
 *   transport   one conclusion for that place. No coordinates.
 */
function caolouMount(input) {
  const options = input && typeof input === "object" ? input : {};
  const start = options.start == null || String(options.start).trim() === ""
    ? "Sydney Central"
    : String(options.start).trim();
  const date = mountDate(options.date);
  const site = mountSite();
  return {
    placeId: site ? site.id : "",
    gearScheme: mountScheme(site),
    transport: mountTransport(site, start, date)
  };
}

function mountDate(value) {
  const text = String(value || "").trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) return "";
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const stamp = new Date(Date.UTC(year, month - 1, day));
  if (stamp.getUTCFullYear() !== year || stamp.getUTCMonth() !== month - 1 || stamp.getUTCDate() !== day) return "";
  return text;
}

function mountSite() {
  if (typeof SITES === "undefined") return null;
  if (typeof activeId === "string") {
    const open = SITES.find((site) => site.id === activeId);
    if (open) return open;
  }
  let saved = "";
  try { saved = localStorage.getItem("caolou-site") || ""; } catch (error) { saved = ""; }
  return SITES.find((site) => site.id === saved) || null;
}

function mountScheme(site) {
  if (!site || typeof loadJson !== "function") return "未选";
  const saved = loadJson("caolou-scheme", {});
  const row = saved && saved[site.id];
  return row && row.name ? String(row.name) : "未选";
}

function mountOrigin(start) {
  const key = String(start || "").trim().toLowerCase();
  return key === "sydney central" || key === "sydney central station" || key === "central" || key === "草楼";
}

function mountTransport(site, start, date) {
  if (!site) return "还没有打开地点。没有交通结论。";
  if (!mountOrigin(start)) return `从「${start}」出发的公共交通没有查过。不编班次。`;
  let line = typeof transitSentence === "function" ? transitSentence(site) : "公共交通：还没有查到谷歌地图的结果。";
  if (date) line += ` 所问日期 ${date}。上面的钟点不是这一天的班次。`;
  return line;
}

window.caolouMount = caolouMount;
