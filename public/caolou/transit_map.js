/* Public-transport legs whose stop coordinates were read from the stored
   directions page and trimmed to the stored alight. No walk, no car. */
let transitLayer = null;
let transitLegendCtl = null;

const TRAINLINK = new Set(["SCO", "BMT", "CCN", "SHL"]);

const NAMED_STOP = {
  "Manly Wharf": "manly",
  Heathcote: "heathcote",
  "Wentworth Falls": "wentworth",
  Oatley: "oatley",
  Otford: "otford",
  Faulconbridge: "faulcon",
  Cowan: "cowan",
  Bulli: "bulli",
  Cronulla: "cronulla",
  "Bundeena Wharf": "bundeena",
  "Dee Why B-Line, Pittwater Rd": "deewhy",
  "Narrabeen B-Line, Pittwater Rd": "narrabeen",
  "Warriewood B-Line, Pittwater Rd": "warriewood"
};

function transitFamily(mode, code) {
  if (mode === "轮渡") return "渡轮";
  if (mode === "轻轨") return "轻轨";
  if (mode === "公交") return "公交";
  if (mode === "火车" && TRAINLINK.has(code)) return "NSW TrainLink";
  if (mode === "火车") return "火车";
  return mode || "公交";
}

function transitColor(mode, code) {
  const family = transitFamily(mode, code);
  const base = {
    "火车": 208,
    "NSW TrainLink": 274,
    "渡轮": 170,
    "公交": 26,
    "轻轨": 346
  }[family] || 26;
  let hash = 0;
  const text = String(code || "");
  for (let i = 0; i < text.length; i += 1) hash = (hash * 33 + text.charCodeAt(i)) >>> 0;
  const hue = base + (hash % 9) - 4;
  const light = 34 + (hash % 4) * 7;
  return `hsl(${hue} 68% ${light}%)`;
}

function transitEsc(text) {
  return String(text || "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[ch]));
}

const TRANSIT_HOME = { lat: -33.88633, lng: 151.19982 };
const TRANSIT_ESTIMATE = new Set(["crosslands"]);

function transitLegs(id) {
  if (typeof TRANSIT_GEOM === "undefined" || !TRANSIT_GEOM || !TRANSIT_GEOM[id]) return [];
  const legs = TRANSIT_GEOM[id].legs;
  return Array.isArray(legs) ? legs : [];
}

function transitEntry(id) {
  if (typeof TRANSIT_GEOM === "undefined" || !TRANSIT_GEOM) return null;
  return TRANSIT_GEOM[id] || null;
}

function transitKm(a, b) {
  const radius = 6371;
  const p1 = a.lat * Math.PI / 180;
  const p2 = b.lat * Math.PI / 180;
  const dphi = (b.lat - a.lat) * Math.PI / 180;
  const dlng = (b.lng - a.lng) * Math.PI / 180;
  const h = Math.sin(dphi / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dlng / 2) ** 2;
  return 2 * radius * Math.asin(Math.min(1, Math.sqrt(h)));
}

function transitNearHome(stop) {
  return !!stop && transitKm(stop, TRANSIT_HOME) < 2.5;
}

function transitRealStops(leg) {
  return (leg.stops || []).filter((stop) => Number.isFinite(stop.lat) && Number.isFinite(stop.lng));
}

function transitMarker(stop, color, family, code) {
  L.circleMarker([stop.lat, stop.lng], {
    radius: 6,
    color: "#1a140c",
    weight: 1,
    fillColor: color,
    fillOpacity: 1
  }).bindTooltip(`${stop.name} · ${family} ${code}`, {
    permanent: true,
    direction: "right",
    className: "transit-tip",
    offset: [8, 0]
  }).addTo(transitLayer);
}

function transitEntrance(id) {
  if (!id || TRANSIT_ESTIMATE.has(id) || typeof SITES === "undefined") return null;
  const site = SITES.find((item) => item.id === id);
  if (!site || !Number.isFinite(site.lat) || !Number.isFinite(site.lng)) return null;
  return { name: site.name, lat: site.lat, lng: site.lng };
}

function transitNamedAlight(record) {
  if (!record || !record.alight || !NAMED_STOP[record.alight] || typeof STOPS === "undefined") return null;
  const known = STOPS[NAMED_STOP[record.alight]];
  if (!known || !Number.isFinite(known.lat) || !Number.isFinite(known.lng)) return null;
  return { name: record.alight, lat: known.lat, lng: known.lng };
}

function transitRemainder(id, record, legs) {
  const entry = transitEntry(id);
  if (!entry || !entry.short) return null;
  const entrance = transitEntrance(id);
  if (!entrance) return null;
  const points = [];
  legs.forEach((leg) => transitRealStops(leg).forEach((stop) => points.push(stop)));
  const named = transitNamedAlight(record);
  if (named && !points.some((stop) => stop.name === named.name)) points.push(named);
  const stored = entry.alightStop;
  if (stored && Number.isFinite(stored.lat) && Number.isFinite(stored.lng)) {
    if (!points.some((stop) => stop.name === stored.name)) points.push(stored);
  }
  let from = null;
  let best = Infinity;
  points.forEach((stop) => {
    if (transitNearHome(stop)) return;
    const distance = transitKm(stop, entrance);
    if (distance < best) {
      best = distance;
      from = stop;
    }
  });
  if (!from || transitNearHome(from)) return null;
  return {
    from,
    entrance,
    km: transitKm(from, entrance),
    lines: ["剩下：徒步或打车", "最后一段交通未落实"]
  };
}

function drawTransit() {
  if (typeof map === "undefined" || !map || typeof L === "undefined") return;
  if (typeof view !== "undefined" && view !== "atlas") return;
  if (!map.getContainer || !document.body.contains(map.getContainer())) return;
  if (!transitLayer || transitLayer._map !== map) transitLayer = L.layerGroup().addTo(map);
  if (transitLegendCtl && transitLegendCtl._map !== map) {
    transitLegendCtl = null;
    const stale = document.getElementById("transitLegend");
    if (stale) stale.remove();
  }
  transitLayer.clearLayers();
  const id = typeof flowPlace === "string" ? flowPlace : "";
  const record = id && typeof TRANSIT !== "undefined" ? TRANSIT[id] : null;
  const lines = record && record.ok && Array.isArray(record.lines) ? record.lines : [];
  const legs = id ? transitLegs(id) : [];
  legs.forEach((leg) => {
    const stops = transitRealStops(leg);
    const color = transitColor(leg.mode, leg.code);
    const family = transitFamily(leg.mode, leg.code);
    if (stops.length >= 2) {
      L.polyline(stops.map((stop) => [stop.lat, stop.lng]), {
        color,
        weight: 5,
        opacity: 0.92,
        lineCap: "round"
      }).bindTooltip(`${family} ${leg.code}`, { sticky: true }).addTo(transitLayer);
    }
    stops.forEach((stop) => transitMarker(stop, color, family, leg.code));
  });
  const drawnNames = new Set();
  legs.forEach((leg) => (leg.stops || []).forEach((stop) => drawnNames.add(stop.name)));
  if (record && record.alight && NAMED_STOP[record.alight] && typeof STOPS !== "undefined") {
    const known = STOPS[NAMED_STOP[record.alight]];
    const already = legs.some((leg) => (leg.stops || []).some((stop) => stop.name === record.alight || drawnNames.has(record.alight)));
    if (known && !already) {
      const last = lines[lines.length - 1] || { mode: "公交", code: "" };
      const color = transitColor(last.mode, last.code);
      const family = transitFamily(last.mode, last.code);
      L.circleMarker([known.lat, known.lng], {
        radius: 6,
        color: "#1a140c",
        weight: 1,
        fillColor: color,
        fillOpacity: 1
      }).bindTooltip(`${record.alight} · ${family} ${last.code}`, {
        permanent: true,
        direction: "right",
        className: "transit-tip",
        offset: [8, 0]
      }).addTo(transitLayer);
    }
  }
  const remainder = transitRemainder(id, record, legs);
  if (remainder && remainder.km >= 0.08) {
    L.polyline([[remainder.from.lat, remainder.from.lng], [remainder.entrance.lat, remainder.entrance.lng]], {
      color: "#e4c07a",
      weight: 3,
      opacity: 0.95,
      dashArray: "7 8"
    }).bindTooltip(`${remainder.from.name} → ${remainder.entrance.name} · ${remainder.lines.join("。")}。直线距离 ${remainder.km.toFixed(1)} km，不是路，不是票价。`, {
      sticky: true
    }).addTo(transitLayer);
  }
  transitLegend(id, record, lines, legs, remainder);
}

function transitLegend(id, record, lines, legs, remainder) {
  if (!transitLegendCtl) {
    transitLegendCtl = L.control({ position: "bottomleft" });
    transitLegendCtl.onAdd = () => {
      const box = L.DomUtil.create("div", "transit-legend");
      box.id = "transitLegend";
      L.DomEvent.disableClickPropagation(box);
      L.DomEvent.disableScrollPropagation(box);
      return box;
    };
    transitLegendCtl.addTo(map);
  }
  const box = document.getElementById("transitLegend");
  if (!box) return;
  if (!id) {
    box.innerHTML = `<p class="tl-title">公共交通</p><p>选一个地点后，画出它已保存的火车、轻轨、渡轮、公交。不画步行，也不画开车。</p>`;
    return;
  }
  if (!record || !record.ok || !lines.length) {
    box.innerHTML = `<p class="tl-title">公共交通</p><p>这条记录里没有可画的线路。</p>`;
    return;
  }
  const groups = new Map();
  lines.forEach((line, index) => {
    const family = transitFamily(line.mode, line.code);
    const leg = legs.find((item) => item && item.code === line.code && item.mode === line.mode) || null;
    if (!groups.has(family)) groups.set(family, []);
    groups.get(family).push({ line, leg });
  });
  const alight = record.alight || "";
  const order = ["火车", "轻轨", "渡轮", "公交", "NSW TrainLink"];
  const html = order.filter((family) => groups.has(family)).map((family) => {
    const rows = groups.get(family).map(({ line, leg }) => {
      const color = transitColor(line.mode, line.code);
      const stops = leg && Array.isArray(leg.stops) ? leg.stops : [];
      const last = lines[lines.length - 1] === line;
      const known = last && alight && NAMED_STOP[alight] && typeof STOPS !== "undefined" && STOPS[NAMED_STOP[alight]];
      let stopHtml = "";
      const namedHit = stops.some((stop) => stop.name === alight);
      if (stops.length >= 2) {
        stopHtml = `<ul>${stops.map((stop) => `<li>${transitEsc(stop.name)}</li>`).join("")}</ul>`;
        if (last && alight && !namedHit && !known) {
          stopHtml += `<p class="tl-miss">${transitEsc(alight)} · 站点坐标未取得</p>`;
        }
      } else if (stops.length === 1) {
        stopHtml = `<ul><li>${transitEsc(stops[0].name)}</li></ul><p class="tl-miss">只有一站坐标，不把缺站连成直线。</p>`;
      } else if (known) {
        stopHtml = `<ul><li>${transitEsc(alight)}</li></ul><p class="tl-miss">只有下车点坐标，不把缺站连成直线。</p>`;
      } else if (last && alight) {
        stopHtml = `<p class="tl-miss">${transitEsc(alight)} · 站点坐标未取得</p>`;
      } else {
        stopHtml = `<p class="tl-miss">${transitEsc(line.code)} 这一段没有车站坐标，不画线。</p>`;
      }
      return `<p class="tl-line"><i style="background:${color}"></i>${transitEsc(family)} ${transitEsc(line.code)}</p>${stopHtml}`;
    }).join("");
    return rows;
  }).join("");
  let rest = "";
  if (remainder) {
    const km = remainder.km >= 0.08 ? `<p class="tl-miss">直线距离 ${remainder.km.toFixed(1)} km，不是路，不是票价。</p>` : "";
    const rows = remainder.lines.map((line) => `<p class="tl-miss">${transitEsc(line)}</p>`).join("");
    rest = `<p class="tl-miss">最近已知站点：${transitEsc(remainder.from.name)}。</p>${rows}${km}`;
  }
  box.innerHTML = `<p class="tl-title">公共交通</p>${html}${rest}<p class="tl-note">不画步行，也不画开车。查询当时的下一班，不是末班。</p>`;
}

function transitStyle() {
  if (document.getElementById("transitStyle")) return;
  const style = document.createElement("style");
  style.id = "transitStyle";
  style.textContent = `
    .transit-legend { width: 232px; max-height: 46vh; overflow: auto; padding: 8px 10px; background: rgba(16, 18, 20, .9); color: #f3efe6; font: 12px/1.4 "Segoe UI", sans-serif; border-radius: 8px; }
    .transit-legend .tl-title { margin: 0 0 6px; font-weight: 700; }
    .transit-legend p { margin: 0 0 4px; }
    .transit-legend .tl-line { display: flex; align-items: center; gap: 6px; margin-top: 6px; }
    .transit-legend i { width: 14px; height: 8px; border-radius: 2px; display: inline-block; flex: 0 0 auto; }
    .transit-legend ul { margin: 0 0 4px 18px; padding: 0; }
    .transit-legend .tl-miss { color: #e4c07a; }
    .transit-legend .tl-note { color: #b7b1a6; margin-top: 6px; }
    .transit-tip { background: rgba(16, 18, 20, .88); color: #f3efe6; border: 0; box-shadow: none; font-size: 11px; }
    .transit-tip::before { display: none; }
  `;
  document.head.appendChild(style);
}

transitStyle();
if (typeof syncMarkers === "function") {
  const transitAfterMarkers = syncMarkers;
  syncMarkers = function transitSyncMarkers(fit) {
    const result = transitAfterMarkers(fit);
    drawTransit();
    return result;
  };
}
if (typeof openSite === "function") {
  const transitOpenSite = openSite;
  openSite = function transitOpenSiteWrapped(id) {
    const result = transitOpenSite.apply(this, arguments);
    drawTransit();
    return result;
  };
}
if (typeof map !== "undefined" && map && typeof view !== "undefined" && view === "atlas") drawTransit();
