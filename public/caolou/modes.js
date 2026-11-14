const BUILTIN_MODES = [
  { id: "sat", name: "卫星", base: "sat", grid: false, marks: false, route: false, weather: false, safety: false, night: false },
  { id: "topo", name: "地形图", base: "topo", grid: true, marks: false, route: false, weather: false, safety: false, night: false },
  { id: "plan", name: "规划", base: "topo", grid: true, marks: true, route: true, weather: false, safety: false, night: false },
  { id: "weather", name: "天气", base: "sat", grid: false, marks: false, route: false, weather: true, safety: false, night: false },
  { id: "safe", name: "安全检测", base: "topo", grid: false, marks: false, route: false, weather: false, safety: true, night: false }
];

let stopLayer = null;
let hikeLayer = null;
let gridLayer = null;
let safeLayer = null;
let hikeArmed = false;
let hookedMap = null;
let aimLayer = null;
let hikeDragAt = 0;

function customModes() {
  const rows = loadJson("caolou-custom-modes", []);
  return Array.isArray(rows) ? rows : [];
}

function allModes() {
  return BUILTIN_MODES.concat(customModes());
}

function currentMode() {
  const id = localStorage.getItem("caolou-mode") || "sat";
  return allModes().find((mode) => mode.id === id) || BUILTIN_MODES[0];
}

function modeShows(key) {
  const mode = currentMode();
  return !!(mode && mode[key]);
}

function fmtDist(meters) {
  if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`;
  return `${Math.round(meters)} m`;
}

function bearing(a, b) {
  const toRad = Math.PI / 180;
  const y = Math.sin((b.lng - a.lng) * toRad) * Math.cos(b.lat * toRad);
  const x = Math.cos(a.lat * toRad) * Math.sin(b.lat * toRad) -
    Math.sin(a.lat * toRad) * Math.cos(b.lat * toRad) * Math.cos((b.lng - a.lng) * toRad);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

const MAG_EAST = 12.6;

function magOf(deg) {
  return (deg - MAG_EAST + 360) % 360;
}

function deg3(deg) {
  return String(Math.round(deg)).padStart(3, "0");
}

function utm56(lat, lng) {
  const a = 6378137;
  const f = 1 / 298.257223563;
  const k0 = 0.9996;
  const e2 = f * (2 - f);
  const ep2 = e2 / (1 - e2);
  const lon0 = ((56 * 6) - 183) * Math.PI / 180;
  const latr = lat * Math.PI / 180;
  const lonr = lng * Math.PI / 180;
  const sin = Math.sin(latr);
  const cos = Math.cos(latr);
  const tan = Math.tan(latr);
  const N = a / Math.sqrt(1 - e2 * sin * sin);
  const T = tan * tan;
  const C = ep2 * cos * cos;
  const A = cos * (lonr - lon0);
  const e4 = e2 * e2;
  const e6 = e4 * e2;
  const M = a * ((1 - e2 / 4 - 3 * e4 / 64 - 5 * e6 / 256) * latr
    - (3 * e2 / 8 + 3 * e4 / 32 + 45 * e6 / 1024) * Math.sin(2 * latr)
    + (15 * e4 / 256 + 45 * e6 / 1024) * Math.sin(4 * latr)
    - (35 * e6 / 3072) * Math.sin(6 * latr));
  const east = k0 * N * (A + (1 - T + C) * A ** 3 / 6
    + (5 - 18 * T + T * T + 72 * C - 58 * ep2) * A ** 5 / 120) + 500000;
  let north = k0 * (M + N * tan * (A * A / 2
    + (5 - T + 9 * C + 4 * C * C) * A ** 4 / 24
    + (61 - 58 * T + T * T + 600 * C - 330 * ep2) * A ** 6 / 720));
  if (lat < 0) north += 10000000;
  return { zone: "56H", e: Math.round(east), n: Math.round(north) };
}

function hikePace() {
  const pace = Number(localStorage.getItem("caolou-pace") || 4);
  return pace >= 1 && pace <= 8 ? pace : 4;
}

function minutesFor(meters) {
  return Math.round((meters / 1000) / hikePace() * 60);
}

function syncArmUi() {
  const label = hikeArmed ? "暂停 <kbd>N</kbd>" : "继续落点 <kbd>N</kbd>";
  const arm = document.getElementById("hikeArm");
  const mapArm = document.getElementById("mapArm");
  if (arm) arm.innerHTML = label;
  if (mapArm) mapArm.innerHTML = hikeArmed ? "暂停" : "继续落点";
  if (map) {
    map.getContainer().style.cursor = (hikeArmed || armed) ? "crosshair" : "";
    if (map.doubleClickZoom) {
      if (hikeArmed) map.doubleClickZoom.disable();
      else map.doubleClickZoom.enable();
    }
  }
  if (!hikeArmed) drawAim(null);
}

function toggleHikeArm() {
  if (!activeId || view !== "field") return;
  hikeArmed = !hikeArmed;
  armed = false;
  syncArmUi();
}

function insertHike(index, lat, lng) {
  if (!activeId || view !== "field") return;
  const points = hikePoints(activeId);
  points.splice(index, 0, { lat, lng });
  setHike(activeId, points);
  drawHike();
}

function undoHike() {
  if (!activeId || view !== "field") return;
  const points = hikePoints(activeId);
  points.pop();
  setHike(activeId, points);
  drawHike();
}

function reverseHike() {
  if (!activeId || view !== "field") return;
  setHike(activeId, hikePoints(activeId).slice().reverse());
  drawHike();
}

function closeHike() {
  if (!activeId || view !== "field") return;
  const points = hikePoints(activeId);
  if (points.length < 2) return;
  const first = points[0];
  points.push({ lat: first.lat, lng: first.lng, name: "回到起点" });
  setHike(activeId, points);
  drawHike();
}

function clearHike() {
  if (!activeId || view !== "field") return;
  setHike(activeId, []);
  drawHike();
  drawAim(null);
}

function fitHike() {
  if (!map || !activeId || view !== "field") return;
  const points = hikePoints(activeId);
  if (!points.length) return;
  if (points.length === 1) {
    map.setView([points[0].lat, points[0].lng], Math.max(map.getZoom(), 16));
    return;
  }
  map.fitBounds(points.map((point) => [point.lat, point.lng]), { padding: [48, 48] });
}

function toggleMarkArm() {
  if (view !== "field") return;
  armed = !armed;
  hikeArmed = false;
  syncArmUi();
}

function drawAim(latlng) {
  aimLayer = ensureLayer(aimLayer);
  if (!aimLayer) return;
  aimLayer.clearLayers();
  if (!hikeArmed || !activeId || view !== "field" || !latlng) return;
  const points = hikePoints(activeId);
  if (!points.length) return;
  const last = points[points.length - 1];
  const here = { lat: latlng.lat, lng: latlng.lng };
  const meters = map.distance([last.lat, last.lng], here);
  if (meters < 8) return;
  const deg = bearing(last, here);
  L.polyline([[last.lat, last.lng], [here.lat, here.lng]], {
    color: "#10120e",
    weight: 5,
    opacity: 0.55,
    dashArray: "2 8",
    interactive: false
  }).addTo(aimLayer);
  L.polyline([[last.lat, last.lng], [here.lat, here.lng]], {
    color: "#e7c56a",
    weight: 2,
    opacity: 0.95,
    dashArray: "7 7",
    interactive: false
  }).addTo(aimLayer);
  const mid = [(last.lat + here.lat) / 2, (last.lng + here.lng) / 2];
  const icon = L.divIcon({
    className: "pinwrap",
    html: `<span class="leg aim">${fmtDist(meters)} · ${deg3(deg)}°</span>`,
    iconSize: [120, 18],
    iconAnchor: [60, 9]
  });
  L.marker(mid, { icon, interactive: false, zIndexOffset: 790 }).addTo(aimLayer);
}

function hikePoints(id) {
  const all = loadJson("caolou-hike", {});
  return (all[id] || []).filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng));
}

function setHike(id, points) {
  const all = loadJson("caolou-hike", {});
  all[id] = points;
  saveJson("caolou-hike", all);
}

function safeRadius(site) {
  const km = (FIELD[site.id] && FIELD[site.id].walk && FIELD[site.id].walk.km) || 1;
  return Math.min(1800, Math.max(280, km * 160));
}

function hazardLines(site) {
  const scores = (FIELD[site.id] && FIELD[site.id].safety) || {};
  const lines = [];
  if (scores.fall <= 4) lines.push("坠落：崖边和湿岩。人留在步道内侧。");
  if (scores.sea <= 4) lines.push("海况：浪和离岸流。人留在岸上。");
  if (scores.access <= 4) lines.push("封闭：门、步枪场或落石。关着就不要进。");
  if ((scores.nav != null && scores.nav <= 4) || (scores.rescue != null && scores.rescue <= 4)) {
    lines.push("迷路和救援：没信号的灌丛不要离开步道。");
  }
  if (scores.fire <= 4) lines.push("火险：封园日不要进。");
  if (scores.snake <= 4) lines.push("蛇：被咬就停住，沿肢体做压力固定，打 000。");
  if (!lines.length) lines.push("这几项没有落到 4 分以下。仍然留在步道、观景台或下水点，不要另开一条路。");
  return lines;
}

function ensureLayer(current) {
  if (!map) return null;
  if (!current || !map.hasLayer(current)) return L.layerGroup().addTo(map);
  return current;
}

function drawStops() {
  stopLayer = ensureLayer(stopLayer);
  if (!stopLayer) return;
  stopLayer.clearLayers();
  const icon = (label) => L.divIcon({
    className: "pinwrap",
    html: `<span class="stop-pin"></span>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
  if (typeof view !== "undefined" && view === "field" && activeId) {
    const site = SITES.find((item) => item.id === activeId);
    const info = site && stopInfo(site);
    if (!info) return;
    L.marker([info.lat, info.lng], { icon: icon(info.label), zIndexOffset: 700 })
      .bindTooltip(info.label, { permanent: true, direction: "top", className: "stop-tip", offset: [0, -8] })
      .addTo(stopLayer);
    return;
  }
  const seen = new Set();
  filtered().forEach((site) => {
    const info = stopInfo(site);
    if (!info || seen.has(info.id)) return;
    seen.add(info.id);
    L.marker([info.lat, info.lng], { icon: icon(info.label), zIndexOffset: 650 })
      .bindTooltip(info.label, { permanent: true, direction: "top", className: "stop-tip", offset: [0, -8] })
      .addTo(stopLayer);
  });
}

function drawHike() {
  hikeLayer = ensureLayer(hikeLayer);
  if (!hikeLayer) return;
  hikeLayer.clearLayers();
  const list = document.getElementById("hikeLegs");
  if (!activeId) {
    if (list) list.innerHTML = "";
    return;
  }
  const points = hikePoints(activeId);
  const showPlan = view === "field";
  const siteForLine = SITES.find((item) => item.id === activeId);
  const painted = siteForLine && typeof timeLinePaint === "function" ? timeLinePaint(siteForLine) : null;
  if (showPlan && points.length >= 2) {
    const latlngs = points.map((point) => [point.lat, point.lng]);
    const hex = painted ? painted.hex : "#c8c2b4";
    const dark = hex === "#111111";
    L.polyline(latlngs, { color: dark ? "#f4f1ea" : "#10120e", weight: 8, opacity: 0.9, interactive: false }).addTo(hikeLayer);
    L.polyline(latlngs, { color: hex, weight: 4, opacity: 1, interactive: false }).addTo(hikeLayer);
  }
  if (showPlan) points.forEach((point, index) => {
    const name = point.name || `点 ${index + 1}`;
    const icon = L.divIcon({
      className: "pinwrap",
      html: `<span class="hike-pin">${index + 1}</span><span class="hike-name">${esc(name)}</span>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11]
    });
    const marker = L.marker([point.lat, point.lng], { icon, zIndexOffset: 800, draggable: true, autoPan: true, bubblingMouseEvents: false }).addTo(hikeLayer);
    if (marker.dragging) marker.dragging.enable();
    marker.on("dragstart", () => { hikeDragAt = Date.now(); });
    marker.on("dragend", () => {
      hikeDragAt = Date.now();
      const next = hikePoints(activeId);
      const at = marker.getLatLng();
      if (!next[index]) return;
      next[index].lat = at.lat;
      next[index].lng = at.lng;
      setHike(activeId, next);
      drawHike();
    });
    marker.on("contextmenu", (event) => {
      L.DomEvent.stop(event);
      const next = hikePoints(activeId);
      next.splice(index, 1);
      setHike(activeId, next);
      drawHike();
    });
  });
  let total = 0;
  const rows = points.map((point, index) => {
    const grid = utm56(point.lat, point.lng);
    let leg = "—";
    let tru = "—";
    let mag = "—";
    let cum = "—";
    if (index > 0) {
      const prev = points[index - 1];
      const meters = map.distance([prev.lat, prev.lng], [point.lat, point.lng]);
      const deg = bearing(prev, point);
      total += meters;
      leg = fmtDist(meters);
      tru = `${deg3(deg)}°`;
      mag = `${deg3(magOf(deg))}°`;
      cum = fmtDist(total);
      const text = `${fmtDist(meters)} · ${deg3(deg)}°`;
      const mid = [(prev.lat + point.lat) / 2, (prev.lng + point.lng) / 2];
      const icon = L.divIcon({
        className: "pinwrap",
        html: `<span class="leg">${text} · 插入</span>`,
        iconSize: [148, 18],
        iconAnchor: [74, 9]
      });
      const legMark = L.marker(mid, { icon, zIndexOffset: 780 }).addTo(hikeLayer);
      legMark.on("click", (event) => {
        L.DomEvent.stop(event);
        insertHike(index, mid[0], mid[1]);
      });
    }
    const name = point.name || `点 ${index + 1}`;
    return `<tr>
      <td><button type="button" data-act="hikego" data-i="${index}">${index + 1}</button></td>
      <td><input data-hike-name="${index}" value="${esc(name)}" maxlength="16"></td>
      <td>${grid.e}</td>
      <td>${grid.n}</td>
      <td>${leg}</td>
      <td>${tru}</td>
      <td>${mag}</td>
      <td>${cum}</td>
      <td><button type="button" data-act="hikedel" data-i="${index}">删</button></td>
    </tr>`;
  });
  const totals = document.getElementById("hikeTotals");
  if (totals) {
    const walk = FIELD[activeId] && FIELD[activeId].walk;
    const climb = walk ? `图上参考爬升 ${walk.climb} m，不是这条线算出来的。` : "";
    const lineNote = points.length >= 2 && painted
      ? `<p>这条线 <b>${esc(painted.name)}</b>。${esc(painted.note)}</p>`
      : `<p class="note">落下两点之后，这条线才上色。</p>`;
    totals.innerHTML = points.length
      ? `<p><b>${points.length}</b> 点 · <b>${fmtDist(total)}</b> · 按 ${hikePace()} km/h 约 <b>${minutesFor(total)} 分钟</b></p><p class="note">${climb}</p>${lineNote}`
      : `<p>还没有点。</p>${lineNote}`;
  }
  if (list) {
    list.innerHTML = points.length
      ? `<table class="sheet-table"><thead><tr><th>#</th><th>名称</th><th>E</th><th>N</th><th>段距</th><th>真向</th><th>磁向</th><th>累计</th><th></th></tr></thead><tbody>${rows.join("")}</tbody></table>`
      : `<p class="note">直接在地图上点。拖圆点改位置，点线段在中间插入，右键删掉一点。</p>`;
  }
  const hud = document.getElementById("planHud");
  if (hud && view === "field") {
    const summary = points.length
      ? `${points.length} 点 · ${fmtDist(total)} · ${minutesFor(total)} 分钟`
      : (hikeArmed ? "直接点地图落下第一点。" : "落点暂停了。按 N 继续。");
    const how = hikeArmed ? "拖圆点，点线段插入，右键删除。" : "按 N 或点「继续落点」。";
    hud.innerHTML = `<p class="planhud-title">规划</p><p>${summary}</p><p class="keys">${how}</p>`;
  }
  fillTimePanel();
}

function leaveClock(point) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(point.arrive || "").trim());
  const stay = Number(point.stay);
  if (!match || !Number.isFinite(stay)) return "";
  const total = Number(match[1]) * 60 + Number(match[2]) + stay;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function fillTimePanel() {
  const box = document.getElementById("timeLine");
  if (!box || !activeId || view !== "field") return;
  const site = SITES.find((item) => item.id === activeId);
  const info = site && typeof stopInfo === "function" ? stopInfo(site) : null;
  const points = hikePoints(activeId);
  const types = ["交通起点", "入口", "拍摄点", "休息点", "饮水点", "厕所", "营地", "撤退点", "返程站点"];
  const stop = info ? `记录中的车站或码头：${esc(info.label)}。时间不预填。不从草楼起算。` : "这里没有已记录的车站。不从草楼起算。";
  const nodes = points.map((point, index) => {
    const options = [`<option value="">未选</option>`].concat(types.map((type) => `<option ${point.ntype === type ? "selected" : ""}>${esc(type)}</option>`)).join("");
    return `<article class="tnode"><p><b>${index + 1}</b> ${esc(point.name || ("点 " + (index + 1)))}</p>
      <label>到达 <input data-time="arrive" data-i="${index}" value="${esc(point.arrive || "")}" placeholder="留空"></label>
      <label>停留分钟 <input data-time="stay" data-i="${index}" value="${esc(point.stay || "")}" placeholder="留空"></label>
      <p class="leave">离开 ${esc(leaveClock(point) || "留空")}</p>
      <label>类型 <select data-time="ntype" data-i="${index}">${options}</select></label>
      <label>备注 <input data-time="note" data-i="${index}" value="${esc(point.note || "")}"></label>
      <button type="button" data-act="timeup" data-i="${index}">上移</button>
      <button type="button" data-act="timedown" data-i="${index}">下移</button></article>`;
  }).join("");
  const sun = typeof loadJson === "function" ? loadJson("caolou-sun", null) : null;
  const sunLine = sun && site && sun.id === site.id && sun.sunset ? `日落 ${String(sun.sunset).slice(11, 16)}（Open-Meteo）` : "日落时间：未查到";
  const transit = site && typeof transitSentence === "function" ? esc(transitSentence(site)) : "公共交通时间：未查到。";
  const planned = site && typeof dayPlanReadout === "function" ? `<p>${esc(dayPlanReadout(site))}</p>` : "";
  box.innerHTML = `<h3>时间</h3><p class="note">${stop}</p><p>${transit} 最晚返程：未查到。${sunLine}。线的颜色不按这一班的钟点。</p>${planned}${nodes || `<p class="note">地图上的点会出现在这里。</p>`}`;
}

function drawGrid() {
  gridLayer = ensureLayer(gridLayer);
  if (!gridLayer) return;
  gridLayer.clearLayers();
  if (!modeShows("grid")) return;
  const bounds = map.getBounds();
  const zoom = map.getZoom();
  const step = zoom >= 15 ? 0.005 : zoom >= 13 ? 0.02 : zoom >= 11 ? 0.05 : 0.2;
  const south = Math.floor(bounds.getSouth() / step) * step;
  const west = Math.floor(bounds.getWest() / step) * step;
  const style = { color: "#1a1c16", weight: 1, opacity: 0.45, interactive: false };
  let rows = 0;
  for (let lat = south; lat <= bounds.getNorth() + step && rows < 16; lat += step) {
    L.polyline([[lat, bounds.getWest()], [lat, bounds.getEast()]], style).addTo(gridLayer);
    const icon = L.divIcon({
      className: "pinwrap",
      html: `<span class="gridlab">${lat.toFixed(3)}</span>`,
      iconSize: [52, 14],
      iconAnchor: [0, 7]
    });
    L.marker([lat, bounds.getWest()], { icon, interactive: false, keyboard: false }).addTo(gridLayer);
    rows += 1;
  }
  let cols = 0;
  for (let lng = west; lng <= bounds.getEast() + step && cols < 16; lng += step) {
    L.polyline([[bounds.getSouth(), lng], [bounds.getNorth(), lng]], style).addTo(gridLayer);
    const icon = L.divIcon({
      className: "pinwrap",
      html: `<span class="gridlab">${lng.toFixed(3)}</span>`,
      iconSize: [52, 14],
      iconAnchor: [26, 0]
    });
    L.marker([bounds.getSouth(), lng], { icon, interactive: false, keyboard: false }).addTo(gridLayer);
    cols += 1;
  }
}

function drawSafety() {
  safeLayer = ensureLayer(safeLayer);
  if (!safeLayer) return;
  safeLayer.clearLayers();
  const box = document.getElementById("safeText");
  if (!modeShows("safety") || !activeId) {
    if (box) box.innerHTML = activeId ? "" : "<p>先选一个地点，安全范围只画在那一块地图上。</p>";
    return;
  }
  const site = SITES.find((item) => item.id === activeId);
  const radius = safeRadius(site);
  const note = (FIELD[site.id].walk && FIELD[site.id].walk.note) || "留在步道上";
  L.circle([site.lat, site.lng], {
    radius,
    color: "#9dba8a",
    weight: 2,
    fillColor: "#9dba8a",
    fillOpacity: 0.16
  }).addTo(safeLayer);
  if (box) {
    const hazards = hazardLines(site).map((line) => `<li>${line}</li>`).join("");
    box.innerHTML = `<p>停留：${note}</p><ul>${hazards}</ul>`;
  }
}

function nightHtml(site) {
  if (!site) return "<p>先选一个地点。夜间只标这个地点黄昏和黎明能遇到的动物，头灯只照路。</p>";
  const animals = (FIELD[site.id].animals || []).map((animal) => {
    const info = SPECIES[animal.id];
    const bits = (animal.windows || []).filter((item) => /黄昏|黎明|夜|清晨|日出|日落/.test(`${item.hours} ${item.note}`));
    if (!bits.length) return "";
    return `<li><strong>${info ? info.name : animal.id}</strong> ${bits.map((item) => item.hours).join("，")}</li>`;
  }).filter(Boolean);
  const list = animals.length ? `<ul>${animals.join("")}</ul>` : "<p>这一处没有单独的黄昏或黎明窗口。头灯仍然只照路。</p>";
  return `<p>头灯只照步道，不照动物，不照水面，不找栖木和洞穴。</p>${list}`;
}

function skyName(code) {
  if (code == null || Number.isNaN(code)) return "没有读数";
  if (code === 0) return "晴";
  if (code <= 3) return "多云";
  if (code <= 48) return "雾";
  if (code <= 57) return "毛毛雨";
  if (code <= 67) return "雨";
  if (code <= 77) return "雪";
  if (code <= 82) return "阵雨";
  if (code <= 86) return "阵雪";
  return "雷雨";
}

function readModel(daily, key, model) {
  if (!daily) return null;
  const specific = daily[`${key}_${model}`];
  if (Array.isArray(specific)) return specific[0];
  if (Array.isArray(daily[key]) && !model) return daily[key][0];
  return null;
}

let lastWxHtml = "";

async function loadWeather() {
  const input = document.getElementById("wxDate");
  const out = document.getElementById("wxOut");
  if (!input || !out) return;
  const date = input.value;
  if (!date) {
    out.textContent = "先选日期。";
    return;
  }
  localStorage.setItem("caolou-weather-date", date);
  const site = activeId ? SITES.find((item) => item.id === activeId) : null;
  const lat = site ? site.lat : (map ? map.getCenter().lat : HOME.lat);
  const lng = site ? site.lng : (map ? map.getCenter().lng : HOME.lng);
  const models = [
    ["ecmwf_ifs025", "ECMWF", 4],
    ["icon_seamless", "ICON", 3],
    ["jma_seamless", "JMA", 3],
    ["gfs_seamless", "GFS", 2],
    ["bom_access_global", "BOM ACCESS", 2]
  ];
  out.textContent = "在问这几个模式…";
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max&timezone=Australia%2FSydney&start_date=${date}&end_date=${date}&models=${models.map((row) => row[0]).join(",")}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    const daily = data.daily || {};
    const read = (model) => {
      const code = readModel(daily, "weather_code", model);
      const max = readModel(daily, "temperature_2m_max", model);
      const min = readModel(daily, "temperature_2m_min", model);
      const rain = readModel(daily, "precipitation_sum", model);
      const wind = readModel(daily, "wind_speed_10m_max", model);
      return { code, max, min, rain, wind, sky: code == null ? null : skyName(code) };
    };
    const byId = Object.fromEntries(models.map(([id, label, weight]) => [id, { id, label, weight, ...read(id) }]));
    const fourth = byId.icon_seamless.code != null ? byId.icon_seamless : byId.jma_seamless;
    const shown = [byId.ecmwf_ifs025, fourth, byId.gfs_seamless, byId.bom_access_global];
    const skyWeight = {};
    let weightSum = 0;
    let tempSum = 0;
    let rainSum = 0;
    let rainWeight = 0;
    let windSum = 0;
    let windWeight = 0;
    const lines = shown.map((row) => {
      if (row.code == null) return `<li>${row.label} · 权重 ${row.weight}：没有读数</li>`;
      skyWeight[row.sky] = (skyWeight[row.sky] || 0) + row.weight;
      if (row.min != null && row.max != null) {
        tempSum += ((row.min + row.max) / 2) * row.weight;
        weightSum += row.weight;
      }
      if (row.rain != null) { rainSum += row.rain * row.weight; rainWeight += row.weight; }
      if (row.wind != null) { windSum += row.wind * row.weight; windWeight += row.weight; }
      const temp = row.min != null && row.max != null ? `${Math.round(row.min)}–${Math.round(row.max)}°C` : "";
      const wet = row.rain != null ? `雨 ${row.rain} mm` : "";
      const blow = row.wind != null ? `风 ${Math.round(row.wind)} km/h` : "";
      return `<li>${row.label} · 权重 ${row.weight}：${row.sky} ${[temp, wet, blow].filter(Boolean).join(" · ")}</li>`;
    });
    const ranked = Object.entries(skyWeight).sort((a, b) => b[1] - a[1]);
    let summary = "加权后没有单一天气。";
    if (ranked.length && (ranked.length === 1 || ranked[0][1] > ranked[1][1])) {
      const bits = [ranked[0][0]];
      if (weightSum) bits.push(`约 ${Math.round(tempSum / weightSum)}°C`);
      if (rainWeight) bits.push(`雨 ${(rainSum / rainWeight).toFixed(1)} mm`);
      if (windWeight) bits.push(`风 ${Math.round(windSum / windWeight)} km/h`);
      summary = `加权：${bits.join(" · ")}`;
    }
    const where = site ? site.name : "这个地点";
    lastWxHtml = `<p>${where} · ${date}</p><p><strong>${summary}</strong></p><ul>${lines.join("")}</ul>`;
    out.innerHTML = lastWxHtml;
    saveJson("caolou-wx-vote", { sky: ranked.length ? ranked[0][0] : "" });
    try {
      const sunUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=sunrise,sunset&timezone=Australia%2FSydney&start_date=${date}&end_date=${date}`;
      const sunRes = await fetch(sunUrl);
      const sunData = await sunRes.json();
      const sunrise = sunData.daily && sunData.daily.sunrise && sunData.daily.sunrise[0];
      const sunset = sunData.daily && sunData.daily.sunset && sunData.daily.sunset[0];
      if (sunset) saveJson("caolou-sun", { date, id: site && site.id, sunrise, sunset, at: new Date().toISOString() });
    } catch (error) { /* 日落没返回就保持未查到 */ }
    if (typeof refreshPack === "function") refreshPack();
  } catch (error) {
    out.textContent = "预报没有返回。日期还在，可以再试一次。";
  }
}

function modeBarHtml() {
  const current = currentMode();
  const buttons = allModes().map((mode) => {
    const del = BUILTIN_MODES.some((item) => item.id === mode.id)
      ? ""
      : `<button type="button" class="x" data-act="delmode" data-id="${mode.id}" title="删除">×</button>`;
    return `<span class="modechip ${mode.id === current.id ? "on" : ""}"><button type="button" data-act="mode" data-id="${mode.id}">${mode.name}</button>${del}</span>`;
  }).join("");
  return `<div class="modebar" id="modebar">
    ${buttons}
    <button type="button" data-act="addmode">增加模式</button>
    <form id="modeForm" hidden>
      <input id="modeName" placeholder="模式名称" maxlength="16">
      <select id="modeBase">
        <option value="sat">卫星</option>
        <option value="topo">地形图</option>
        <option value="street">街道</option>
      </select>
      <label><input type="checkbox" id="modeGrid"> 坐标格</label>
      <label><input type="checkbox" id="modeMarks"> 标记</label>
      <label><input type="checkbox" id="modeRoute"> 自己的步道</label>
      <label><input type="checkbox" id="modeWeather"> 天气</label>
      <label><input type="checkbox" id="modeSafety"> 安全范围</label>
      <button type="button" data-act="savemode">保存这个模式</button>
    </form>
  </div>`;
}

function dockHtml() {
  const site = activeId ? SITES.find((item) => item.id === activeId) : null;
  const date = localStorage.getItem("caolou-weather-date") || "";
  return `<p class="eyebrow">${site ? esc(site.name) : ""}</p>
    <p class="note">北朝上。比例尺在地图左下。</p>
    <p id="cursorRead">光标移到地图上，读经纬、距离和方位。</p>
    <div id="wxPanel" hidden>
      <h3>天气</h3>
      <p class="note">${date ? `准备时选的日期是 ${esc(date)}。` : "先在准备里选日期。"}</p>
      <div id="wxOut"></div>
    </div>
    <div id="safePanel" hidden>
      <h3>安全区和风险</h3>
      <p class="note">圈是要停留的范围。风险写在这里，不是一条走进去的路。</p>
      <div id="safeText"></div>
    </div>
    <p id="planHead"></p>
    <div id="hikePanel" class="sheet">
      <h3>测图</h3>
      <p class="note">WGS84 · UTM 56H · 真北朝上 · 磁偏角东 ${MAG_EAST}°。磁向已减去偏角，罗盘对磁北时用这一列。</p>
      <div id="hikeTotals"></div>
      <div class="sheet-tools">
        <button type="button" data-act="hikearm" id="hikeArm">落点 <kbd>N</kbd></button>
        <button type="button" data-act="hikeundo">撤销 <kbd>Z</kbd></button>
        <button type="button" data-act="hikereverse">倒序 <kbd>R</kbd></button>
        <button type="button" data-act="hikeclose">回到起点 <kbd>L</kbd></button>
        <button type="button" data-act="hike-fit">看全线 <kbd>F</kbd></button>
        <button type="button" data-act="hikeclear">清空 <kbd>Shift</kbd>+<kbd>X</kbd></button>
      </div>
      <label class="pace">步速 <input id="hikePace" type="number" min="1" max="8" step="0.5" value="${hikePace()}"> km/h</label>
      <div id="hikeLegs"></div>
      <div class="sheet-tools">
        <button type="button" data-act="gpx">导出 GPX</button>
        <button type="button" data-act="geojson">导出 GeoJSON</button>
      </div>
      <p class="note">GPX 给 Organic Maps、OsmAnd 或 Gaia。文件里是你的点和标记，没有动物坐标。</p>
      <div id="timeLine"></div>
      <div class="sheet-tools">
        <button type="button" data-act="routesave" data-slot="full">存成完整路线</button>
        <button type="button" data-act="routesave" data-slot="short">存成缩短路线</button>
        <button type="button" data-act="routesave" data-slot="safe">存成安全撤退路线</button>
        <button type="button" data-act="routeload" data-slot="full">用完整路线</button>
        <button type="button" data-act="routeload" data-slot="short">用缩短路线</button>
        <button type="button" data-act="routeload" data-slot="safe">用安全撤退路线</button>
      </div>
      <p id="routeMsg" class="note"></p>
      <h3>标记</h3>
      <label>标记 <select id="markKind">
        <option value="spot">机位</option>
        <option value="seen">目击</option>
        <option value="danger">危险</option>
        <option value="park">停留</option>
        <option value="water">补给</option>
      </select></label>
      <input id="markName" placeholder="名称">
      <button type="button" data-act="arm">在地图上落下</button>
      <div id="markList"></div>
    </div>`;
}

function mountChrome() {
  const bar = document.getElementById("fieldbar");
  const dock = document.getElementById("dock");
  if (!bar || !dock || document.getElementById("modebar")) return;
  bar.insertAdjacentHTML("afterbegin", modeBarHtml());
  bar.insertAdjacentHTML("beforeend", `<button type="button" data-act="leave">回到总图</button>`);
  dock.innerHTML = dockHtml();
  const head = document.getElementById("planHead");
  if (head && typeof schemeLabel === "function" && typeof packTotals === "function") {
    const totals = packTotals();
    head.textContent = `当前装备方案：${schemeLabel()}｜已具备 ${(totals.ownedKg == null ? totals.kg : totals.ownedKg).toFixed(2)} kg｜计划总重量 ${totals.kg.toFixed(2)} kg`;
  }
  const list = document.getElementById("markList");
  if (list && typeof markerListHtml === "function") list.innerHTML = markerListHtml();
  const stage = document.querySelector(".field .mapstage");
  if (stage && !document.getElementById("planHud")) {
    stage.insertAdjacentHTML("beforeend", `<div class="planbar">
        <button type="button" data-act="hikeundo">撤销</button>
        <button type="button" data-act="hikeclose">闭合</button>
        <button type="button" data-act="hikearm" id="mapArm">暂停</button>
      </div>
      <div id="planHud" class="planhud"></div>
      <button type="button" class="keytoggle" data-act="keys" title="快捷键">?</button>
      <div id="keycard" class="keycard" hidden>
        <p><kbd>N</kbd> 暂停或继续。规划模式进来就能直接点地图</p>
        <p><kbd>Z</kbd> 撤销上一点</p>
        <p><kbd>R</kbd> 倒序</p>
        <p><kbd>L</kbd> 回到起点</p>
        <p><kbd>F</kbd> 缩放到整条线</p>
        <p><kbd>Shift</kbd>+<kbd>X</kbd> 清空</p>
        <p><kbd>M</kbd> 标记落点</p>
        <p><kbd>G</kbd> 导出 GPX</p>
        <p><kbd>1</kbd> 卫星 <kbd>2</kbd> 地形图 <kbd>3</kbd> 规划 <kbd>4</kbd> 天气 <kbd>5</kbd> 安全检测</p>
        <p><kbd>Esc</kbd> 停止落点</p>
        <p class="note">正在输入名称或数字时，这些键不生效。</p>
      </div>`);
  }
}

function applyMode() {
  const mode = currentMode();
  if (map && TILES[mode.base]) setBase(mode.base);
  const wx = document.getElementById("wxPanel");
  const safe = document.getElementById("safePanel");
  if (wx) {
    wx.hidden = !mode.weather;
    const slot = document.getElementById("wxOut");
    if (slot && lastWxHtml && view === "field") slot.innerHTML = lastWxHtml;
  }
  if (safe) safe.hidden = !mode.safety;
  const bar = document.getElementById("modebar");
  if (bar) {
    const fresh = document.createElement("div");
    fresh.innerHTML = modeBarHtml();
    bar.replaceWith(fresh.firstElementChild);
  }
  if (typeof drawUserMarkers === "function" && view === "field") drawUserMarkers();
  if (view === "field") {
    if (mode.route && !armed) hikeArmed = true;
    if (!mode.route) hikeArmed = false;
    syncArmUi();
  }
  drawGrid();
  drawSafety();
  drawHike();
  drawStops();
}

function refreshMapChrome() {
  if (typeof view === "undefined" || view !== "field" || !map) return;
  hookMap();
  mountChrome();
  applyMode();
}

function resetMapHooks() {
  hookedMap = null;
  stopLayer = null;
  hikeLayer = null;
  gridLayer = null;
  safeLayer = null;
  aimLayer = null;
  hikeArmed = false;
}

function hookMap() {
  if (!map || hookedMap === map) return;
  hookedMap = map;
  map.on("click", (event) => {
    if (!hikeArmed || !activeId || view !== "field") return;
    if (Date.now() - hikeDragAt < 400) return;
    const points = hikePoints(activeId);
    const tooClose = points.some((point) => map.distance([point.lat, point.lng], event.latlng) < 12);
    if (tooClose) return;
    points.push({ lat: event.latlng.lat, lng: event.latlng.lng });
    setHike(activeId, points);
    drawHike();
  });
  map.on("mousemove", (event) => {
    const el = document.getElementById("cursorRead");
    if (!el || !activeId) return;
    const here = { lat: event.latlng.lat, lng: event.latlng.lng };
    const points = hikePoints(activeId);
    const grid = utm56(here.lat, here.lng);
    let line = "";
    if (points.length) {
      const last = points[points.length - 1];
      const deg = bearing(last, here);
      line = `<span>距上一点 ${fmtDist(map.distance([last.lat, last.lng], event.latlng))}</span><span>真 ${deg3(deg)}°</span><span>磁 ${deg3(magOf(deg))}°</span>`;
    }
    el.innerHTML = `<span>${here.lat.toFixed(5)} ${here.lng.toFixed(5)}</span><span>56H ${grid.e} E ${grid.n} N</span>${line}`;
    drawAim(event.latlng);
  });
  map.on("moveend", () => {
    if (modeShows("grid")) drawGrid();
  });
}

function downloadText(name, text, mime) {
  const blob = new Blob([text], { type: mime });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 1500);
}

function exportBundle(site) {
  const points = hikePoints(site.id);
  const info = stopInfo(site);
  const radius = safeRadius(site);
  const note = (FIELD[site.id].walk && FIELD[site.id].walk.note) || "";
  const hazards = hazardLines(site).join(" ");
  const edges = [
    { name: "停留北", lat: site.lat + radius / 111320, lng: site.lng },
    { name: "停留东", lat: site.lat, lng: site.lng + radius / (111320 * Math.cos(site.lat * Math.PI / 180)) },
    { name: "停留南", lat: site.lat - radius / 111320, lng: site.lng },
    { name: "停留西", lat: site.lat, lng: site.lng - radius / (111320 * Math.cos(site.lat * Math.PI / 180)) }
  ];
  return { points, info, radius, note, hazards, edges };
}

function xml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function exportGpx() {
  const site = SITES.find((item) => item.id === activeId);
  if (!site) return;
  const bag = exportBundle(site);
  const wpts = [
    `<wpt lat="${site.lat}" lon="${site.lng}"><name>${xml(site.name)}</name><desc>${xml(bag.note)}</desc></wpt>`,
    `<wpt lat="${site.lat}" lon="${site.lng}"><name>停留范围</name><desc>${xml(`${bag.note} 半径约 ${Math.round(bag.radius)} m。${bag.hazards}`)}</desc></wpt>`
  ];
  bag.edges.forEach((edge) => {
    wpts.push(`<wpt lat="${edge.lat}" lon="${edge.lng}"><name>${edge.name}</name><desc>停留范围的边，不是一条走进危险区的路。</desc></wpt>`);
  });
  if (bag.info) {
    wpts.push(`<wpt lat="${bag.info.lat}" lon="${bag.info.lng}"><name>${xml(bag.info.label)}</name><desc>${xml(bag.info.walk)}</desc></wpt>`);
  }
  const trk = bag.points.length >= 2
    ? `<trk><name>${xml(site.name)} 步道</name><trkseg>${bag.points.map((point) => `<trkpt lat="${point.lat}" lon="${point.lng}"></trkpt>`).join("")}</trkseg></trk>`
    : "";
  const gpx = `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="caolou-wild" xmlns="http://www.topografix.com/GPX/1/1">\n${wpts.join("\n")}\n${trk}\n</gpx>\n`;
  downloadText(`${site.id}-hike.gpx`, gpx, "application/gpx+xml");
}

function exportGeo() {
  const site = SITES.find((item) => item.id === activeId);
  if (!site) return;
  const bag = exportBundle(site);
  const features = [
    { type: "Feature", properties: { name: site.name, note: bag.note }, geometry: { type: "Point", coordinates: [site.lng, site.lat] } },
    { type: "Feature", properties: { name: "停留范围", note: `${bag.note} ${bag.hazards}`, radius_m: Math.round(bag.radius) }, geometry: { type: "Point", coordinates: [site.lng, site.lat] } }
  ];
  bag.edges.forEach((edge) => {
    features.push({ type: "Feature", properties: { name: edge.name }, geometry: { type: "Point", coordinates: [edge.lng, edge.lat] } });
  });
  if (bag.info) {
    features.push({ type: "Feature", properties: { name: bag.info.label, note: bag.info.walk }, geometry: { type: "Point", coordinates: [bag.info.lng, bag.info.lat] } });
  }
  if (bag.points.length >= 2) {
    features.push({
      type: "Feature",
      properties: { name: `${site.name} 步道` },
      geometry: { type: "LineString", coordinates: bag.points.map((point) => [point.lng, point.lat]) }
    });
  }
  downloadText(`${site.id}-hike.geojson`, JSON.stringify({ type: "FeatureCollection", features }, null, 2), "application/geo+json");
}

document.addEventListener("click", (event) => {
  const act = event.target.closest("[data-act]");
  if (!act) return;
  if (act.dataset.act === "mode") {
    localStorage.setItem("caolou-mode", act.dataset.id);
    applyMode();
  }
  if (act.dataset.act === "addmode") {
    const form = document.getElementById("modeForm");
    if (form) form.hidden = !form.hidden;
  }
  if (act.dataset.act === "savemode") {
    const name = (document.getElementById("modeName").value || "").trim();
    if (!name) return;
    const mode = {
      id: `c${Date.now()}`,
      name,
      base: document.getElementById("modeBase").value,
      grid: document.getElementById("modeGrid").checked,
      marks: document.getElementById("modeMarks").checked,
      route: document.getElementById("modeRoute").checked,
      weather: document.getElementById("modeWeather").checked,
      safety: document.getElementById("modeSafety").checked,
      night: false
    };
    const rows = customModes();
    rows.push(mode);
    saveJson("caolou-custom-modes", rows);
    localStorage.setItem("caolou-mode", mode.id);
    applyMode();
  }
  if (act.dataset.act === "delmode") {
    if (BUILTIN_MODES.some((mode) => mode.id === act.dataset.id)) return;
    saveJson("caolou-custom-modes", customModes().filter((mode) => mode.id !== act.dataset.id));
    if (localStorage.getItem("caolou-mode") === act.dataset.id) localStorage.setItem("caolou-mode", "sat");
    applyMode();
  }
  if (act.dataset.act === "safewhich") {
    localStorage.setItem("caolou-safe-which", act.dataset.which);
    drawSafety();
  }
  if (act.dataset.act === "wx") loadWeather();
  if (act.dataset.act === "arm") {
    hikeArmed = false;
    syncArmUi();
  }
  if (act.dataset.act === "hikearm") toggleHikeArm();
  if (act.dataset.act === "hikeundo") undoHike();
  if (act.dataset.act === "hikeclear") clearHike();
  if (act.dataset.act === "hikereverse") reverseHike();
  if (act.dataset.act === "hikeclose") closeHike();
  if (act.dataset.act === "hike-fit") fitHike();
  if (act.dataset.act === "keys") {
    const card = document.getElementById("keycard");
    if (card) card.hidden = !card.hidden;
  }
  if (act.dataset.act === "hikego" && map) {
    const points = hikePoints(activeId);
    const point = points[Number(act.dataset.i)];
    if (point) map.flyTo([point.lat, point.lng], Math.max(map.getZoom(), 16), { duration: 0.4 });
  }
  if (act.dataset.act === "hikedel" && activeId) {
    const points = hikePoints(activeId);
    points.splice(Number(act.dataset.i), 1);
    setHike(activeId, points);
    drawHike();
  }
  if (act.dataset.act === "timeup" || act.dataset.act === "timedown") {
    const points = hikePoints(activeId);
    const i = Number(act.dataset.i);
    const j = act.dataset.act === "timeup" ? i - 1 : i + 1;
    if (j < 0 || j >= points.length) return;
    const held = points[i];
    points[i] = points[j];
    points[j] = held;
    setHike(activeId, points);
    drawHike();
  }
  if (act.dataset.act === "routesave" || act.dataset.act === "routeload") {
    const all = loadJson("caolou-routes", {});
    const bag = all[activeId] || {};
    const slot = act.dataset.slot;
    if (act.dataset.act === "routesave") {
      let copy = hikePoints(activeId).map((point) => Object.assign({}, point));
      if (slot === "short") {
        const shots = copy.map((point, index) => point.ntype === "拍摄点" ? index : -1).filter((index) => index >= 0);
        if (shots.length) copy.splice(shots[shots.length - 1], 1);
        else if (copy.length) copy.pop();
      }
      if (slot === "safe") {
        const cut = copy.findIndex((point) => point.ntype === "撤退点");
        if (cut >= 0) copy = copy.slice(0, cut + 1);
      }
      bag[slot] = copy;
      all[activeId] = bag;
      saveJson("caolou-routes", all);
      const msg = document.getElementById("routeMsg");
      if (msg) msg.textContent = "已另存。当前地图上的点没有被删掉。";
    } else if (bag[slot]) {
      setHike(activeId, bag[slot].map((point) => Object.assign({}, point)));
      drawHike();
    }
  }
  if (act.dataset.act === "gpx") exportGpx();
  if (act.dataset.act === "geojson") exportGeo();
});

document.addEventListener("change", (event) => {
  if (event.target.id === "hikePace") {
    localStorage.setItem("caolou-pace", String(event.target.value));
    drawHike();
  }
  const timed = event.target.closest("[data-time]");
  if (timed && activeId) {
    const points = hikePoints(activeId);
    const point = points[Number(timed.dataset.i)];
    if (point) {
      point[timed.dataset.time] = timed.value;
      setHike(activeId, points);
      const card = timed.closest(".tnode");
      const leave = card && card.querySelector(".leave");
      if (leave) leave.textContent = `离开 ${leaveClock(point) || "留空"}`;
    }
  }
  const named = event.target.closest("[data-hike-name]");
  if (named && activeId) {
    const points = hikePoints(activeId);
    const point = points[Number(named.dataset.hikeName)];
    if (point) {
      point.name = named.value.trim();
      setHike(activeId, points);
    }
  }
});

document.addEventListener("keydown", (event) => {
  if (typeof view === "undefined" || view !== "field") return;
  const tag = event.target && event.target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  const code = event.code;
  if (code === "KeyN" && !event.shiftKey && !event.repeat) toggleHikeArm();
  else if (code === "KeyZ" && !event.shiftKey) undoHike();
  else if (code === "KeyR" && !event.shiftKey) reverseHike();
  else if (code === "KeyL" && !event.shiftKey) closeHike();
  else if (code === "KeyF" && !event.shiftKey) fitHike();
  else if (code === "KeyM" && !event.shiftKey && !event.repeat) toggleMarkArm();
  else if (code === "KeyG" && !event.shiftKey) exportGpx();
  else if (code === "KeyX" && event.shiftKey) clearHike();
  else if (event.key === "Escape") {
    hikeArmed = false;
    armed = false;
    syncArmUi();
    const card = document.getElementById("keycard");
    if (card) card.hidden = true;
  } else if (event.key === "?" || (code === "Slash" && event.shiftKey)) {
    const card = document.getElementById("keycard");
    if (card) card.hidden = !card.hidden;
  } else if (/^[1-5]$/.test(event.key) && !event.shiftKey) {
    const ids = ["sat", "topo", "plan", "weather", "safe"];
    localStorage.setItem("caolou-mode", ids[Number(event.key) - 1]);
    applyMode();
  } else return;
  event.preventDefault();
});

if (typeof view !== "undefined" && view === "atlas" && typeof map !== "undefined" && map) drawStops();
