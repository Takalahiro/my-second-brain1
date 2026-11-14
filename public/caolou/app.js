const NOW = 11;
const state = { maxMin: 150, wild: 1, close: 1, theme: "全部", transit: "all", sort: "drive" };
let view = "atlas";
let activeId = null;
let map;
let layer;

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function km(site) {
  const R = 6371;
  const dLat = ((site.lat - HOME.lat) * Math.PI) / 180;
  const dLng = ((site.lng - HOME.lng) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos((HOME.lat * Math.PI) / 180) * Math.cos((site.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function googleMinutes(site) {
  const row = typeof TRANSIT !== "undefined" ? TRANSIT[site.id] : null;
  if (!row || !row.ok || !row.duration) return null;
  if (String(row.duration).startsWith("每") && row.depart && row.arrive) {
    const toMin = (clock) => {
      const parts = String(clock).split(":");
      return Number(parts[0]) * 60 + Number(parts[1]);
    };
    let span = toMin(row.arrive) - toMin(row.depart);
    if (span < 0) span += 24 * 60;
    return span;
  }
  const hours = /(\d+)\s*小时/.exec(row.duration);
  const minutes = /(\d+)\s*分钟/.exec(row.duration);
  if (!hours && !minutes) return null;
  return (hours ? Number(hours[1]) * 60 : 0) + (minutes ? Number(minutes[1]) : 0);
}

function canRide(site) {
  const row = typeof TRANSIT !== "undefined" ? TRANSIT[site.id] : null;
  if (row) return !!row.ok;
  return !!site.noCar;
}

function depart(site) {
  const minutes = googleMinutes(site);
  if (minutes != null) return minutes;
  const options = [site.drive[0]];
  if (site.transit[0] > 0) options.push(site.transit[0]);
  return Math.min(...options);
}

function ticks(n) {
  return `<span class="ticks">${[1, 2, 3, 4, 5].map((i) => `<i class="${i <= n ? "on" : ""}"></i>`).join("")}</span>`;
}

function filtered() {
  return SITES.filter((site) => {
    if (depart(site) > state.maxMin) return false;
    if (site.wild < state.wild) return false;
    if (site.close < state.close) return false;
    if (state.theme !== "全部" && state.theme !== "冷门" && !site.themes.includes(state.theme)) return false;
    if (state.theme === "冷门" && !site.obscure) return false;
    if (state.transit === "nocar" && !canRide(site)) return false;
    if (state.transit === "car" && canRide(site)) return false;
    return true;
  }).sort((a, b) => {
    if (state.sort === "wild") return b.wild - a.wild || depart(a) - depart(b);
    if (state.sort === "close") return b.close - a.close || depart(a) - depart(b);
    return depart(a) - depart(b);
  });
}

function timeLine(site) {
  const row = typeof TRANSIT !== "undefined" ? TRANSIT[site.id] : null;
  if (row && row.ok) {
    const ride = (row.lines || []).map((line) => line.code).filter(Boolean).join(" · ");
    return ride ? `${row.duration} · ${ride}` : row.duration;
  }
  if (row && !row.ok) return "谷歌地图没有给出公共交通";
  return `直线 ${km(site).toFixed(0)} km`;
}

function placeThumb(site) {
  const list = (typeof PLACE_PHOTOS !== "undefined" && PLACE_PHOTOS[site.id]) || [];
  const thumb = list[0] && list[0].thumb;
  return thumb ? `<img src="${esc(thumb)}" alt="">` : `<span class="nophoto"></span>`;
}

function cardHtml(site) {
  const field = FIELD[site.id];
  const row = typeof TRANSIT !== "undefined" ? TRANSIT[site.id] : null;
  const info = typeof stopInfo === "function" ? stopInfo(site) : null;
  const arrive = row && row.ok ? "不用开车" : (row && !row.ok ? "谷歌地图没有给出公共交通" : (info ? "不用开车" : "没有好用的车站"));
  const hours = field && field.walk ? `${field.walk.hours[0]}–${field.walk.hours[1]}` : "";
  const alight = row && row.ok && row.alight ? ` · 在 ${esc(row.alight)} 下车` : "";
  const timing = row && row.ok ? ` · ${esc(timeLine(site))}` : "";
  return `<button type="button" class="row" data-act="open" data-id="${site.id}">
    ${placeThumb(site)}
    <span>
      <strong>${esc(site.name)}</strong>
      <em>${esc(site.en || "")}</em>
      <small>${arrive}${alight}${timing}${hours ? ` · 现场 ${hours} 小时` : ""}</small>
      ${typeof offtrackLabelHtml === "function" ? offtrackLabelHtml(site.id) : ""}
    </span>
  </button>`;
}

function detailHtml(site) {
  const acts = site.do.map((item) => `<div class="act">
      <div><div class="when">${esc(item.when)}</div><div class="pill">${esc(item.odds)}</div></div>
      <div>
        <h3>${esc(item.t)}</h3>
        <p class="note">${esc(item.lens)}</p>
        <p>${esc(item.text)}</p>
      </div>
    </div>`).join("");
  return `<article class="detail">
    <button class="back" type="button" data-act="back">返回列表</button>
    <header><h2>${esc(site.no)} ${esc(site.name)}</h2><span class="en">${esc(site.en)}</span></header>
    <p class="note">${esc(site.park)}</p>
    <div class="meta">
      <span>${esc(timeLine(site))}</span>
      <span>${site.noCar ? "可以不开车" : "开车更合适"}</span>
      <span>${esc(site.day)}</span>
    </div>
    <div class="scores">野性 ${ticks(site.wild)} 能靠近 ${ticks(site.close)}</div>
    <p>${esc(site.summary)}</p>
    ${typeof stopBlurb === "function" ? stopBlurb(site) : ""}
    <p><strong>当天。</strong>${esc(site.access)}</p>
    <p><strong>包。</strong>${esc(site.pack)}</p>
    ${plannerDetail(site)}
    <h3>能做的事</h3>
    ${acts}
    <div class="dont"><strong>这天不要做</strong><ul>${site.dont.map((d) => `<li>${esc(d)}</li>`).join("")}</ul></div>
    <p>动物不保证出现。步道按公告开放，不要翻门，也不要在关门后留在禁区。海上接近鲸、海豚、海豹有法定距离，岸上拍摄不要改成下水追。小企鹅、考拉和限制进入的涉禽区不在这张图上教你怎么靠近。</p>
  </article>`;
}

function renderSide() {
  const side = document.getElementById("side");
  if (!side) return;
  const sites = filtered();
  const count = document.getElementById("count");
  if (count) count.textContent = `${sites.length} / ${SITES.length}`;
  const found = document.getElementById("foundLine");
  if (found) {
    const nocar = sites.filter((site) => {
      const row = typeof TRANSIT !== "undefined" && TRANSIT[site.id];
      if (row) return !!row.ok;
      return typeof stopInfo === "function" && !!stopInfo(site);
    }).length;
    found.textContent = `找到 ${sites.length} 个地点 · 其中 ${nocar} 个不用开车 · 独自过夜看地点里的有条件或否，这里不标成可以`;
  }
  side.innerHTML = sites.length
    ? sites.map(cardHtml).join("")
    : `<p class="empty">这个范围内没有地点。把时间放宽，或把野性改回不限。</p>`;
}

function pin(site, on) {
  return L.divIcon({
    className: "pinwrap",
    html: `<span class="pin ${on ? "on" : ""}"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });
}

function syncMarkers(fit) {
  if (!map || !layer || view !== "atlas") return;
  layer.clearLayers();
  const sites = filtered();
  const zoom = map.getZoom();
  const cell = zoom >= 12 ? 0 : zoom >= 10 ? 0.05 : 0.16;
  const groups = new Map();
  sites.forEach((site) => {
    const key = cell ? `${Math.round(site.lat / cell)}:${Math.round(site.lng / cell)}` : site.id;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(site);
  });
  groups.forEach((list) => {
    if (list.length === 1) {
      const site = list[0];
      const marker = L.marker([site.lat, site.lng], { icon: pin(site, false) });
      marker.bindTooltip(site.name, { direction: "top" });
      marker.on("click", () => openSite(site.id));
      layer.addLayer(marker);
      return;
    }
    const lat = list.reduce((sum, site) => sum + site.lat, 0) / list.length;
    const lng = list.reduce((sum, site) => sum + site.lng, 0) / list.length;
    const marker = L.marker([lat, lng], {
      icon: L.divIcon({
        className: "pinwrap",
        html: `<span class="pin cluster">${list.length}</span>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      })
    });
    marker.bindPopup(list.map((site) => `<button type="button" data-act="open" data-id="${site.id}">${esc(site.name)}</button>`).join("<br>"));
    layer.addLayer(marker);
  });
  if (fit) {
    const bounds = L.latLngBounds(sites.map((site) => [site.lat, site.lng]));
    if (sites.length) map.fitBounds(bounds, { padding: [24, 24], maxZoom: 10 });
  }
  if (typeof drawStops === "function") drawStops();
}

function destroyMap() {
  if (typeof stopFollow === "function") stopFollow();
  if (typeof resetMapHooks === "function") resetMapHooks();
  map = null;
  layer = null;
  tileLayer = null;
  routeLine = null;
  markerLayer = null;
  userDot = null;
}

function markSteps() {
  document.querySelectorAll(".steps button").forEach((button) => {
    const on = button.dataset.view === view;
    button.classList.toggle("on", on);
  });
  const prep = document.getElementById("stepPrep");
  if (prep) prep.disabled = !activeId;
  const field = document.getElementById("stepField");
  if (field) field.classList.toggle("on", view === "field");
  const cal = document.querySelector(".quiet");
  if (cal) cal.classList.toggle("on", view === "calendar");
}

function parkFilters() {
  const filters = document.getElementById("filters");
  const host = document.getElementById("view");
  if (!filters || !host || !host.contains(filters)) return;
  host.parentNode.insertBefore(filters, host);
}

function renderAtlas() {
  showFilters(true);
  parkFilters();
  const host = document.getElementById("view");
  host.innerHTML = `<div class="atlas"><div class="mapstage"><div id="map"></div></div><div class="rail"><div class="side" id="side"></div></div></div>`;
  const rail = host.querySelector(".rail");
  const filters = document.getElementById("filters");
  if (rail && filters) rail.insertBefore(filters, rail.firstChild);
  map = L.map("map", { scrollWheelZoom: true }).setView([HOME.lat, HOME.lng], 10);
  layer = L.layerGroup().addTo(map);
  setBase("sat");
  renderSide();
  syncMarkers(true);
  map.on("zoomend", () => syncMarkers(false));
  markSteps();
  setTimeout(() => map.invalidateSize(), 60);
}

function renderPrep() {
  if (!activeId) { setView("atlas"); return; }
  showFilters(false);
  const site = SITES.find((item) => item.id === activeId);
  const date = localStorage.getItem("caolou-weather-date") || new Date().toISOString().slice(0, 10);
  const acts = site.do.map((item) => `<div class="act">
      <div><div class="when">${esc(item.when)}</div><div class="pill">${esc(item.odds)}</div></div>
      <div><h3>${esc(item.t)}</h3><p class="note">${esc(item.lens)}</p><p>${esc(item.text)}</p></div>
    </div>`).join("");
  const walk = (typeof FIELD !== "undefined" && FIELD[site.id] && FIELD[site.id].walk) || {};
  const themes = (site.themes || []).join("、");
  const land = walk.note || "记录里没有另写地貌。";
  document.getElementById("view").innerHTML = `<article class="prep">
    <button class="back" type="button" data-act="back">回到总图</button>
    <header>
      <p class="eyebrow">${esc(site.no)} · ${esc(site.en)}</p>
      <h2>${esc(site.name)}</h2>
    </header>
    <section class="block" id="seeLand">
      <h3>风光</h3>
      <p>区域：${esc(site.park || "记录里没有另写区域。")}</p>
      <p>地貌：${esc(land)}</p>
      ${themes ? `<p>记录里已写的主题：${esc(themes)}</p>` : ""}
      <p>${esc(site.summary)}</p>
      ${galleryHtml(site)}
      ${typeof stopBlurb === "function" ? stopBlurb(site) : ""}
      <p>${esc(site.access)}</p>
    </section>
    ${animalHtml(site)}
    <section class="block">
      <h3>能做的事</h3>
      ${acts}
    </section>
    ${dayPlanHtml(site)}
    ${routeModesHtml(site)}
    ${packPanelHtml(site)}
    <section class="block">
      <h3>日期和天气</h3>
      <p class="note">先选日期。ECMWF 权重 4，ICON 有读数就用它、否则用 JMA，权重 3。GFS 和 BOM ACCESS 各是 2。</p>
      <label>日期 <input id="wxDate" type="date" value="${esc(date)}"></label>
      <button type="button" data-act="wx">看这天</button>
      <div id="wxOut"></div>
    </section>
    ${safetyHtml(site)}
    <button class="enter" type="button" data-act="enter">进入地界 · ${esc(site.name)}</button>
    <p class="note">这块地的地图现在还不在。点下去之后才能落步道。</p>
    <div class="dont"><strong>这天不要做</strong><ul>${site.dont.map((d) => `<li>${esc(d)}</li>`).join("")}</ul></div>
  </article>`;
  markSteps();
}

function renderField() {
  if (!activeId) { setView("atlas"); return; }
  localStorage.setItem("caolou-mode", "plan");
  showFilters(false);
  const site = SITES.find((item) => item.id === activeId);
  document.getElementById("view").innerHTML = `<div class="field">
    <div class="fieldbar" id="fieldbar"></div>
    <div class="fieldbody">
      <div class="mapstage"><div id="map"></div><div class="rose" aria-hidden="true"><b>N</b></div></div>
      <aside class="dock" id="dock"></aside>
    </div>
  </div>`;
  map = L.map("map", { scrollWheelZoom: true }).setView([site.lat, site.lng], 15);
  layer = L.layerGroup().addTo(map);
  L.control.scale({ imperial: false, metric: true, position: "bottomleft" }).addTo(map);
  L.marker([site.lat, site.lng], { icon: pin(site, true), zIndexOffset: 300 })
    .bindTooltip(`${site.no} ${site.name}`, { direction: "top" })
    .addTo(layer);
  initFieldMap();
  if (typeof refreshMapChrome === "function") refreshMapChrome();
  markSteps();
  setTimeout(() => map.invalidateSize(), 60);
}

function renderCalendar() {
  document.getElementById("count").textContent = "";
  const months = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
  const head = `<tr><th class="name">现象</th>${months.map((m) => `<th class="${Number(m) === NOW ? "now" : ""}">${m}月</th>`).join("")}</tr>`;
  const rows = PHENOLOGY.map((row) => {
    const cells = months.map((m) => {
      const n = Number(m);
      const peak = row.peak.includes(n);
      const on = row.months.includes(n);
      const now = n === NOW ? " now" : "";
      return `<td class="${peak ? "peak" : on ? "on" : ""}${now}"></td>`;
    }).join("");
    return `<tr><td class="name">${esc(row.name)}<span class="where">${esc(row.where)}</span></td>${cells}</tr>`;
  }).join("");
  document.getElementById("view").innerHTML = `<div class="page">
    <h2>一年里什么时候去</h2>
    <p class="note">深色是高峰，浅色是能碰到。红框是十一月，也就是现在。穆加马拉 2026 年的开放周已经结束，明年八月再看 NPWS 的票。</p>
    <table class="cal">${head}${rows}</table>
  </div>`;
}

function stored() {
  try { return JSON.parse(localStorage.getItem("caolou-gear") || "{}"); }
  catch { return {}; }
}

function renderKit() {
  document.getElementById("count").textContent = "";
  const got = stored();
  const have = GEAR.have.map((item) => `<li><strong>${esc(item.name)}</strong><br>${esc(item.note)}</li>`).join("");
  const buy = GEAR.buy.map((item) => `<li class="check"><input type="checkbox" data-gear="${item.id}" ${got[item.id] ? "checked" : ""}><span><strong>${esc(item.name)}</strong><br>${esc(item.why)}</span></li>`).join("");
  const later = GEAR.later.map((item) => `<li><strong>${esc(item.name)}</strong><br>${esc(item.why)}</li>`).join("");
  const skip = GEAR.skip.map((item) => `<li><strong>${esc(item.name)}</strong><br>${esc(item.why)}</li>`).join("");
  const recipes = RECIPES.map((item) => `<div class="recipe"><strong>${esc(item.name)}</strong><span>${esc(item.lens)}。${esc(item.set)}</span></div>`).join("");
  document.getElementById("view").innerHTML = `<div class="page">
    <h2>重量、花费，和还要买什么</h2>
    ${packPanelHtml(null)}
    <div class="panel warn"><p>${esc(GEAR.assumption)}</p></div>
    <div class="cols">
      <section class="panel"><h3>已经够用</h3><ul>${have}</ul></section>
      <section class="panel"><h3>现在去买</h3><ul>${buy}</ul></section>
    </div>
    <div class="cols">
      <section class="panel"><h3>以后再说</h3><ul>${later}</ul></section>
      <section class="panel"><h3>先别买</h3><ul>${skip}</ul></section>
    </div>
    <section class="panel"><h3>Z8 在这几个场面怎么设</h3>${recipes}</section>
  </div>`;
}

function renderRoutes() {
  document.getElementById("count").textContent = "";
  const routes = ROUTES.map((route) => `<article class="route">
      <p class="no">${esc(route.time)}</p>
      <h3>${esc(route.name)}</h3>
      <p>${esc(route.text)}</p>
      ${route.sites.map((id) => {
        const site = SITES.find((s) => s.id === id);
        return `<button class="go" type="button" data-act="open" data-id="${id}">${esc(site.name)}</button>`;
      }).join("")}
    </article>`).join("");
  const excluded = EXCLUSIONS.map((item) => `<article class="exclude"><strong>${esc(item.name)}</strong><p>${esc(item.why)}</p></article>`).join("");
  document.getElementById("view").innerHTML = `<div class="page">
    <h2>从草楼怎么排</h2>
    ${routes}
    <h2>故意没放进来的</h2>
    ${excluded}
  </div>`;
}

function showFilters(on) {
  document.getElementById("filters").hidden = !on;
}

function setView(next) {
  if (next === "field") return;
  if (next === "prep" && !activeId) next = "atlas";
  if (next === view && next === "atlas" && map) return;
  parkFilters();
  view = next;
  destroyMap();
  if (next === "atlas") renderAtlas();
  else if (next === "prep") renderPrep();
  else if (next === "calendar") {
    showFilters(false);
    renderCalendar();
    markSteps();
  }
}

function openSite(id) {
  activeId = id;
  localStorage.setItem("caolou-site", id);
  view = "prep";
  destroyMap();
  renderPrep();
}

function enterGround() {
  if (!activeId || view === "field") return;
  view = "field";
  destroyMap();
  renderField();
}

function leaveGround() {
  view = "atlas";
  destroyMap();
  renderAtlas();
}

function bind() {
  document.body.addEventListener("click", (event) => {
    const viewBtn = event.target.closest("[data-view]");
    if (viewBtn) { setView(viewBtn.dataset.view); return; }
    const act = event.target.closest("[data-act]");
    if (!act) return;
    if (act.dataset.act === "open") openSite(act.dataset.id);
    if (act.dataset.act === "back" || act.dataset.act === "leave") leaveGround();
    if (act.dataset.act === "enter") enterGround();
  });
  document.body.addEventListener("change", (event) => {
    if (event.target.matches("[data-gear]")) {
      const data = stored();
      data[event.target.dataset.gear] = event.target.checked;
      localStorage.setItem("caolou-gear", JSON.stringify(data));
    }
  });
  const max = document.getElementById("maxMin");
  const label = document.getElementById("maxLabel");
  max.addEventListener("input", () => {
    state.maxMin = Number(max.value);
    label.textContent = `${state.maxMin} 分钟内`;
    if (view === "atlas") { renderSide(); syncMarkers(false); }
  });
  ["wild", "close", "theme", "transit", "sort"].forEach((id) => {
    document.getElementById(id).addEventListener("change", (event) => {
      const value = event.target.value;
      state[id] = id === "wild" || id === "close" ? Number(value) : value;
      if (view === "atlas") { renderSide(); syncMarkers(false); }
    });
  });
}

bind();
setView("atlas");
