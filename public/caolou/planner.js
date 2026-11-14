let tileLayer = null;
let routeLine = null;
let userDot = null;
let markerLayer = null;
let followId = null;
let armed = false;

const TILES = {
  street: {
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attr: "&copy; OpenStreetMap",
    max: 19
  },
  sat: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attr: "&copy; Esri",
    max: 19
  },
  topo: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
    attr: "&copy; Esri",
    max: 19
  }
};

const MARK_LABEL = { spot: "机位", seen: "目击", danger: "危险", park: "停车", water: "补给" };

function loadJson(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value == null ? fallback : value;
  } catch {
    return fallback;
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

const BODY_KG = 100;
const BAR_NAMES = ["靠近", "光线", "风稳", "人少", "当季", "支撑", "撤离", "负荷"];
const ROUTE_COLORS = {
  green: { name: "绿 · 轻松", hex: "#7dce8a" },
  yellow: { name: "黄 · 消耗", hex: "#e0c04a" },
  orange: { name: "橙黄 · 大量消耗", hex: "#e09a3a" },
  red: { name: "红 · 艰难", hex: "#e05a45" },
  black: { name: "黑 · 极限", hex: "#111111" }
};
const BAR_DELTAS = {
  tele600: { need: ["z8"], 靠近: 2, 光线: -1, 风稳: -1, 支撑: 2, 负荷: -3 },
  tele200: { need: ["z8"], 靠近: 1, 光线: 2, 支撑: 1, 负荷: -2 },
  std: { need: ["z8"], 光线: 1 },
  cpl: { need: ["std"], 光线: 1 },
  nd8: { need: ["std"], onlyNd: true, 光线: 1 },
  nd64: { need: ["std"], onlyNd: true, 光线: 1 },
  nd1000: { need: ["std"], onlyNd: true, 光线: 1 },
  j8a4d: { 风稳: 1 },
  monopod: { 风稳: 1, 支撑: 2, 负荷: -1 },
  plb: { 撤离: 2 },
  plbnpws: { 撤离: 2 },
  bins: { 靠近: 1 },
  rain: { 风稳: 1, 负荷: -1 },
  lamp: { 光线: 1 },
  pack65: { 负荷: -1 },
  water: { 负荷: -1 }
};
const KIT_SUGGEST = {
  whale: ["z8", "tele600", "pack65", "insert", "boots", "b8fjq", "s8bwc", "water", "batts", "p20a", "airtag"],
  forest: ["z8", "tele200", "pack65", "insert", "boots", "b8fjq", "v8cm4", "water", "batts", "p20a", "airtag"],
  blue: ["z8", "tele200", "pack65", "insert", "boots", "b8fjq", "f8h1u", "j89zm", "water", "batts", "p20a", "airtag"],
  wide: ["z8", "std", "daynf", "boots", "b8fjq", "s8ezy", "cpl", "water", "batts", "p5", "airtag"],
  film: ["f3", "ais3570", "film", "sling", "boots", "b8fjq", "j8en9", "water", "airtag"],
  oldz: ["z8", "ftz", "ais3570", "sling", "boots", "b8fjq", "j8en9", "water", "batts", "p5", "airtag"],
  snorkel: ["action4", "sling", "s8bwc"],
  medium: ["rb67", "rb137", "pack65", "insert", "boots", "b8fjq", "water"]
};
const KIT_NOTE = {
  whale: "崖上鲸的起点：Z8 + 180-600，65L 和阿尔菲斯 L。8FJQ，热天再加 8BWC。风大你自己改勾 8EN9，下雨再改 8A4D。不带滤镜。",
  forest: "林中黄昏的起点：Z8 + 70-200，65L 和内胆。8FJQ + 8CM4。湿了再加 8A4D，冷晨再加 8H1U。不开闪光。",
  blue: "人已经在蓝山。镜头和包不改，仍是 Z8 + 70-200 和 65L。衣服换成 8FJQ + 8H1U + 89ZM。",
  wide: "环境宽景的起点：Z8 + 24-70，书包 NF0A8BK4，不放内胆。8FJQ + 8EZY。水面再加一片 ND。下雨你自己改勾 831M，需要再加雨裤。",
  film: "胶片慢日不是灌丛的默认套。F3 加 35–70，挎包。干、少盐。近处改 55，暗处改 50/1.4。",
  oldz: "老镜头上 Z8 不是灌丛的默认套。FTZ 加 35–70，短焦用挎包。",
  snorkel: "下水只带 Action 4。上岸用挎包装衣服，穿 8BWC。靴子和 Z8 留在岸上。18 米是相机标称，只浮潜。",
  medium: "中画幅不是灌丛的默认套。RB67 用你写的 C 口 137 mm，不改成 127。克数空着，这天包重会少算镜头。"
};
const SALT_IDS = new Set(["solander", "malabar", "northhead", "shelly", "clifton", "gordons", "boatharbour", "capebanks", "bare", "longreef", "turimetta", "bangalley", "deewhy", "narrabeen"]);
const NPWS_PLB = {
  blue: "Blue Mountains Heritage Centre",
  sassafras: "Blue Mountains Heritage Centre",
  victory: "Blue Mountains Heritage Centre",
  walls: "Blue Mountains Heritage Centre"
};
const GROUP_ORDER = ["机身", "镜头", "转接", "滤镜", "胶片", "中画幅", "水下", "包", "衣服", "鞋", "电力", "住处", "专业", "应急", "补给", "其他"];

function bodyKg() {
  return BODY_KG;
}

function suggestKind(site) {
  if (!site) return "wide";
  if (site.id === "blue") return "blue";
  const animals = ((FIELD[site.id] && FIELD[site.id].animals) || []).map((row) => row.id);
  const themes = site.themes || [];
  if (site.id === "shelly" || site.id === "clifton") return "snorkel";
  if (animals.some((id) => ["seadragon", "groper", "cuttlefish", "octopus"].includes(id)) && !animals.includes("whale")) return "snorkel";
  if (["solander", "malabar", "northhead", "barren", "bangalley", "longreef"].includes(site.id)) return "whale";
  if (themes[0] === "鲸") return "whale";
  if (animals.includes("lyrebird") || animals.includes("bandicoot") || themes.includes("雨林")) return "forest";
  if (themes.includes("湿地")) return "wide";
  if (animals.includes("whale")) return "whale";
  return "wide";
}

function suggestIds(siteId) {
  const site = SITES.find((item) => item.id === siteId);
  return (KIT_SUGGEST[suggestKind(site)] || KIT_SUGGEST.wide).slice();
}

function packFlags() {
  const all = loadJson("caolou-kits", {});
  const saved = activeId && all[activeId] ? all[activeId] : (!activeId ? loadJson("caolou-pack", null) : null);
  const flags = {};
  PACK.forEach((item) => { flags[item.id] = false; });
  if (saved) PACK.forEach((item) => { if (saved[item.id]) flags[item.id] = true; });
  else if (activeId) suggestIds(activeId).forEach((id) => {
    const item = PACK.find((row) => row.id === id);
    if (item && !personalOnly(item)) flags[id] = true;
  });
  if (!flags.pack65) flags.insert = false;
  return flags;
}

function saveFlags(flags) {
  if (!flags.pack65) flags.insert = false;
  if (activeId) {
    const all = loadJson("caolou-kits", {});
    all[activeId] = flags;
    saveJson("caolou-kits", all);
  } else saveJson("caolou-pack", flags);
}

function boughtMap() {
  const saved = loadJson("caolou-bought", {});
  return saved && typeof saved === "object" ? saved : {};
}

function isOwned(item) {
  return !!(item.owned || boughtMap()[item.id]);
}

function itemSpec(item) {
  const edit = loadJson("caolou-pack-edit", {});
  const over = edit[item.id] || {};
  const baseG = Number.isFinite(item.g) ? item.g : null;
  const baseC = Number.isFinite(item.cost) ? item.cost : null;
  return {
    g: Number.isFinite(over.g) ? over.g : baseG,
    cost: Number.isFinite(over.cost) ? over.cost : baseC
  };
}

function personalOnly(item) {
  if (!item) return false;
  if (item.group === "衣服" || item.group === "鞋") return true;
  return ["pack65", "daynf", "sling"].includes(item.id);
}

function stoveInPlan(flags) {
  return !!flags.stove;
}

function showGear(item, flags) {
  return !(item.needsStove && !stoveInPlan(flags));
}

function weightCounts(item, flags) {
  if (!flags[item.id] || item.packable === false || personalOnly(item) || item.tech) return false;
  if (item.needsStove && !stoveInPlan(flags)) return false;
  if (item.id === "insert" && !flags.pack65) return false;
  if (item.id === "cpl77" && !flags.tele200) return false;
  if (["nd8", "nd64", "nd1000", "cpl", "gnd72"].includes(item.id) && !flags.std) return false;
  return true;
}

function ownedWeightCounts(item, flags) {
  return weightCounts(item, flags) && isOwned(item);
}

function pointCounts(item, flags) {
  const rule = BAR_DELTAS[item.id];
  if (!rule || !ownedWeightCounts(item, flags)) return false;
  if (rule.need && rule.need.some((id) => !flags[id])) return false;
  if (item.id === "tele200" && flags.tele600) return false;
  if (item.id === "plb" && flags.plbnpws) return false;
  if (rule.onlyNd) {
    const first = ["nd8", "nd64", "nd1000"].find((id) => flags[id] && isOwned(PACK.find((row) => row.id === id)));
    if (first !== item.id) return false;
  }
  return true;
}

function packLoadAdjust(kg) {
  if (kg > 15) return -6;
  if (kg > 10) return -3;
  return 0;
}

function packTotals() {
  const flags = packFlags();
  let ownedGrams = 0;
  let planGrams = 0;
  let spend = 0;
  let value = 0;
  PACK.forEach((item) => {
    const spec = itemSpec(item);
    if (flags[item.id] && isOwned(item) && spec.cost != null && item.packable !== false) value += spec.cost;
    if (flags[item.id] && !isOwned(item) && spec.cost != null) spend += spec.cost;
    if (!weightCounts(item, flags) || spec.g == null) return;
    planGrams += spec.g;
    if (isOwned(item)) ownedGrams += spec.g;
  });
  return {
    grams: planGrams,
    ownedGrams,
    planGrams,
    spend,
    value,
    kg: planGrams / 1000,
    ownedKg: ownedGrams / 1000
  };
}

function moneyText(item) {
  const spec = itemSpec(item);
  if (spec.cost == null) return "价值未填";
  const cur = item.cur || "AUD";
  if (cur === "CNY") return `${spec.cost} 元`;
  if (cur === "JPY") return `${spec.cost} 日元`;
  if (cur === "USD") return `US$${spec.cost}`;
  return `A$${spec.cost}`;
}

function totalsHtml() {
  const t = packTotals();
  const heavy = t.ownedGrams > 8000 ? "已具备重量超过 8 公斤。颜色也会离开「轻松」。" : "已具备重量在 8 公斤以内。";
  const pct = (t.ownedKg / BODY_KG * 100).toFixed(1);
  return `<p><strong>${t.ownedKg.toFixed(2)} kg</strong> 已具备重量。已经在手里、并且这次携带、克数有记录的才加。</p>
    <p><strong>${t.kg.toFixed(2)} kg</strong> 计划总重量。未买但在方案里的也加，行上写尚未具备。克数空着的不加。衣服、靴子、墨镜、背包和帽子不计入。</p>
    <p>已具备重量是 100 kg 的 <strong>${pct}%</strong>。下坡按这个体重另记膝盖，不重复加进热量。</p>
    <p>未买的大约还要 <strong>A$${t.spend}</strong>。已有的价钱写在每一行，不把元、日元和澳元加成一个数。</p>
    <p class="note">${heavy} 滤镜没配 24-70 的、内胆没配 65L 的，不计。克数空着的行，勾上也不加重量。</p>`;
}

const SPECS = {
  z8: "910 g · CFexpress Type B / SD · USB-C PD",
  tele600: "1955 g · 不能加增距镜",
  tele200: "1440 g · f/2.8",
  std: "500 g · f/4 · Z 卡口，不能上 F3 / F4",
  f3: "胶片机身 · SR44",
  f4: "胶片机身 · AA",
  action4: "裸机约 145 g · 盖严防水 18 m · 遮光罩装上就不防水",
  pack65: "约 65 L · 约 1650 g · 用户说明 2026-11-13 · 不默认计入行程重量",
  sling: "挎包 · 约 420 g",
  daynf: "书包",
  insert: "中号内胆。只在勾选 65L 大包时可选",
  cards: "主槽 CFexpress Type B。副槽另备一张 SD",
  reader: "USB-C。读 CFexpress Type B 和 XQD",
  tc14: "约 220 g。只加在 Z 70-200 f/2.8 上，约 98–280 mm f/4。不能加在 180-600 上",
  strap: "锚点拧在 180-600 的脚架环上，不要只挂机身吊耳",
  bins: "8×42。先找喷气和鸟，再举相机",
  rain: "罩得住拉到 600 mm 的机身加镜头。盐雾天拍完擦盐",
  monopod: "碳素。夹具要能夹镜头脚架环",
  plb: "无月费。买回在 AMSA 注册。有信号先打 000，不要拿来试按",
  snake: "10 cm 宽、带压力指示。沿肢体包紧，打 000。不切开、不吸、不冰敷",
  lamp: "选带红光的。红光只照路，不照动物，不照水面"
};

function deltaLabel(item) {
  const rule = BAR_DELTAS[item.id];
  if (!rule) return "";
  return BAR_NAMES.filter((name) => rule[name]).map((name) => `${name}${rule[name] > 0 ? "+" : ""}${rule[name]}`).join(" ");
}

function noSignal(site) {
  const scores = FIELD[site.id] && FIELD[site.id].safety;
  if (!scores) return false;
  return scores.rescue <= 4 || scores.nav <= 4;
}

function saltSite(site) {
  if (!site) return false;
  if (SALT_IDS.has(site.id)) return true;
  return (site.themes || []).includes("海洋");
}

function clampBar(n) {
  return Math.max(0, Math.min(10, Math.round(n)));
}

function barBaselines(site) {
  const scores = (FIELD[site.id] && FIELD[site.id].safety) || {};
  const animals = (FIELD[site.id] && FIELD[site.id].animals) || [];
  const themes = site.themes || [];
  const close = Number(site.close) || 3;
  const whale = animals.some((row) => row.id === "whale");
  const forest = themes.includes("雨林") || animals.some((row) => row.id === "lyrebird");
  const date = localStorage.getItem("caolou-weather-date") || "";
  const month = date ? Number(date.slice(5, 7)) : (typeof NOW === "number" ? NOW : 11);
  const vote = loadJson("caolou-wx-vote", {});
  let near = Math.round((Math.min(5, Math.max(1, close)) / 5) * 10);
  if (whale) near = Math.min(near, 4);
  if (animals.some((row) => row.id === "lyrebird")) near = Math.max(near, 6);
  let light = 6;
  if (forest) light -= 2;
  if (whale || themes.includes("海洋")) light -= 1;
  if (vote.sky && /云|雨|雾/.test(vote.sky)) light -= 2;
  if (vote.sky && /晴/.test(vote.sky)) light += 1;
  let wind = scores.wind == null ? 5 : scores.wind;
  if (["solander", "malabar", "northhead"].includes(site.id)) wind = Math.min(wind, 4);
  if (forest) wind = Math.max(wind, 7);
  let quiet = scores.crowd == null ? 5 : scores.crowd;
  if (site.obscure) quiet += 1;
  if (whale) quiet -= 2;
  let season = 3;
  const inMonth = animals.some((row) => row.windows.some((item) => item.months.includes(month)));
  if (inMonth) season = 7;
  if (whale && month === 11) season = 4;
  let support = whale ? 3 : forest ? 5 : 4;
  const stop = typeof stopInfo === "function" ? stopInfo(site) : null;
  let exit = Math.round((((scores.rescue == null ? 5 : scores.rescue) + (scores.access == null ? 5 : scores.access)) / 2));
  if (!stop) exit = Math.min(exit, 4);
  else exit += 1;
  const climb = FIELD[site.id] && FIELD[site.id].walk ? FIELD[site.id].walk.climb : 0;
  let load = 8;
  if (climb > 200) load -= 3;
  else if (climb > 100) load -= 1;
  return { 靠近: near, 光线: light, 风稳: wind, 人少: quiet, 当季: season, 支撑: support, 撤离: exit, 负荷: load };
}

function barState(site) {
  const flags = packFlags();
  const base = site ? barBaselines(site) : Object.fromEntries(BAR_NAMES.map((name) => [name, 5]));
  const add = Object.fromEntries(BAR_NAMES.map((name) => [name, 0]));
  PACK.forEach((item) => {
    if (!pointCounts(item, flags)) return;
    const rule = BAR_DELTAS[item.id];
    BAR_NAMES.forEach((name) => { if (rule[name]) add[name] += rule[name]; });
  });
  add.负荷 += packLoadAdjust(packTotals().kg);
  const total = {};
  BAR_NAMES.forEach((name) => { total[name] = clampBar(base[name] + add[name]); });
  return { base, add, total };
}

function barsHtml(site) {
  const state = barState(site);
  const rows = BAR_NAMES.map((name) => {
    const n = state.total[name];
    const delta = state.add[name];
    const mark = delta === 0 ? "" : `${delta > 0 ? "+" : ""}${delta}`;
    return `<div class="bar"><span>${name}</span><b>${n}</b><i style="width:${n * 10}%"></i><small>${mark}</small></div>`;
  }).join("");
  return `<div class="bars"><h3>八条</h3><p class="note">地点先给基准。勾上并且已有的装备再加减，限制在 0 到 10。未买的加减是灰的，不计。</p>${rows}</div>`;
}

function chosenBags(flags) {
  return ["pack65", "daynf", "sling"].filter((id) => flags[id]);
}

function gridHtml() {
  const flags = packFlags();
  const bags = chosenBags(flags);
  const bag = bags[0] ? PACK.find((item) => item.id === bags[0]) : null;
  const inside = [];
  const worn = [];
  const outside = [];
  PACK.forEach((item) => {
    if (item.packable === false) {
      outside.push({ item, reason: item.block || "不进野外包" });
      return;
    }
    if (!flags[item.id]) return;
    if (["pack65", "daynf", "sling"].includes(item.id)) {
      if (bags.length > 1 && item.id !== bags[0]) outside.push({ item, reason: "一天一只包。格子先用另一只。" });
      return;
    }
    if (item.group === "衣服" || item.group === "鞋") {
      worn.push(item);
      return;
    }
    if (item.id === "insert" && !flags.pack65) {
      outside.push({ item, reason: "阿尔菲斯 L 内胆只跟 65L" });
      return;
    }
    if (!bag) {
      outside.push({ item, reason: "先勾一只包，才挂进去" });
      return;
    }
    inside.push(item);
  });
  const slot = (item) => {
    const spec = itemSpec(item);
    const grams = spec.g == null ? "克数未填" : `${spec.g} g`;
    const qty = item.qty == null ? "若干" : `×${item.qty}`;
    return `<div class="slot"><b>${esc(item.name)}</b><span>${qty} · ${grams} · ${moneyText(item)}</span></div>`;
  };
  const bagName = bag ? bag.name : "还没有包";
  const extra = bags.length > 1 ? `<p class="warnline">勾了不止一只包。格子先挂在${esc(bagName)}上。</p>` : "";
  return `<div class="re4">
    <div class="worn"><h4>身上</h4>${worn.length ? worn.map(slot).join("") : `<p class="note">衣服和鞋勾上之后出现在这里。</p>`}</div>
    <div class="baggrid"><h4>${esc(bagName)}</h4>${extra}${inside.length ? inside.map(slot).join("") : `<p class="note">勾上的东西挂在这只包里。</p>`}</div>
    <div class="outside"><h4>不进这只包</h4>${outside.map((row) => `<div class="slot out"><b>${esc(row.item.name)}</b><span>${esc(row.reason)}</span></div>`).join("")}</div>
  </div>`;
}

function warnHtml(site) {
  const flags = packFlags();
  const notes = [];
  if (flags.tele600 && flags.tele200) notes.push("Z 70-200 和 Z 180-600 不能同时装上。选择没有被清掉。两只的克数都留在计划总重量里。带不带两只由你决定。");
  const bodies = ["z8", "f3", "f4", "rb67", "x2d"].filter((id) => flags[id]);
  if (bodies.length > 1) notes.push("勾了不止一台机身。重量都会算，计分不会把两只长焦叠在一起。");
  if ((flags.nd8 || flags.nd64 || flags.nd1000 || flags.cpl) && !flags.std) notes.push("卡色滤镜还在清单里，但没勾 24-70，不计重、不计分。");
  if (["nd8", "nd64", "nd1000"].filter((id) => flags[id]).length > 1) notes.push("ND 一天只带一片。计分只留勾上的第一片。");
  if (flags.tc14 && flags.tele600 && !flags.tele200) notes.push("增距镜不能加在 180-600 上。");
  if (site && saltSite(site) && (flags.f3 || flags.f4 || flags.film)) notes.push("胶片和高盐岩台不要放在同一天。不会自动改你的勾选。");
  if (flags.sandals && !flags.boots && site && suggestKind(site) !== "snorkel") notes.push("凉鞋不上步道。");
  if (site && noSignal(site)) notes.push("这里信号差。有信号先打 000。");
  if (site && NPWS_PLB[site.id]) notes.push(`免费借用示位标：出发前去 ${NPWS_PLB[site.id]} 借。不是观景台上的设备。`);
  notes.push("两只长焦不能同时装上。勾了两只也不会被清掉。滤镜只上 24-70。");
  return `<div class="kitwarn">${notes.map((line) => `<p class="warnline">${esc(line)}</p>`).join("")}</div>`;
}

function packRowsHtml() {
  const flags = packFlags();
  const groups = GROUP_ORDER.filter((name) => PACK.some((item) => item.group === name));
  return groups.map((group) => {
    const rows = PACK.filter((item) => item.group === group).map((item) => {
      const spec = itemSpec(item);
      const locked = (item.id === "insert" && !flags.pack65) || item.packable === false;
      const ownedNow = isOwned(item);
      const counts = pointCounts(item, flags);
      const delta = deltaLabel(item);
      const deltaClass = delta ? (counts ? "delta" : "delta dim") : "";
      const line = item.spec || SPECS[item.id] || "";
      const buy = !ownedNow && item.shop
        ? `<a class="shop" href="${esc(item.shop)}" target="_blank" rel="noopener noreferrer">去买 · ${esc(item.shopName || "商店")}</a>`
        : "";
      const mark = item.owned
        ? ""
        : `<button type="button" class="textbtn" data-act="bought" data-id="${item.id}">${ownedNow ? "改回未买" : "标成已买"}</button>`;
      const qty = item.qty == null ? "若干" : item.qty;
      const gVal = spec.g == null ? "" : spec.g;
      const cVal = spec.cost == null ? "" : spec.cost;
      return `<tr>
        <td><label class="check"><input type="checkbox" data-pack="${item.id}" ${flags[item.id] && !locked ? "checked" : ""} ${locked ? "disabled" : ""}><span>${esc(item.name)}${line ? `<span class="spec">${esc(line)}</span>` : ""}${delta ? `<span class="${deltaClass}">${esc(delta)}</span>` : ""}</span></label></td>
        <td>${qty}</td>
        <td><input class="num" data-edit="g" data-id="${item.id}" type="number" min="0" step="10" value="${gVal}" placeholder="未填"></td>
        <td><input class="num" data-edit="cost" data-id="${item.id}" type="number" min="0" step="1" value="${cVal}" placeholder="未填"> ${esc(item.cur || (spec.cost == null ? "" : "AUD"))}</td>
        <td>${ownedNow ? "已有" : "要买"}${buy}${mark}</td>
      </tr>`;
    }).join("");
    return `<tr class="group"><th colspan="5">${esc(group)}</th></tr>${rows}`;
  }).join("");
}

function bucketOf(item, flags, suggested) {
  if (item.packable === false) return "home";
  if (!isOwned(item)) return "buy";
  if (["机身", "镜头", "转接", "滤镜", "胶片", "中画幅", "水下"].includes(item.group)) return "photo";
  if (suggested.has(item.id)) return "suggest";
  return "optional";
}

const TRAIT_NAMES = ["防雨", "防水", "防风", "透气", "保温", "速干", "运动", "耐磨"];

function clothBars(item) {
  const wear = item.group === "衣服" || item.group === "鞋" || item.group === "包" || ["pack65", "daynf", "sling", "boots"].includes(item.id);
  if (!wear) return "";
  const on = new Set(item.traits || []);
  const bars = TRAIT_NAMES.map((name) => `<span class="trait"><i class="${on.has(name) ? "on" : ""}"></i>${esc(name)}</span>`).join("");
  const series = item.series ? `系列：${item.series}` : "系列：未核对";
  const fabric = item.fabric ? `面料：${item.fabric}` : "面料：未核对";
  const from = item.fabricUrl ? `<p>面料来源：${esc(item.fabricUrl)} · ${esc(item.fabricRead || "")}</p>` : "";
  return `<p>${esc(series)} · ${esc(fabric)}</p><div class="traits">${bars}</div>${from}`;
}

function gearCard(item, flags) {
  const spec = itemSpec(item);
  const price = spec.cost == null ? "未记录" : (item.cur && item.cur !== "AUD" ? `${spec.cost} ${item.cur}` : `A$${spec.cost}`);
  const grams = spec.g == null ? "未记录" : `${Number(spec.g).toLocaleString("en-AU")}`;
  const word = personalOnly(item) ? "不计入本次方案" : (item.tech ? "不计入普通露营方案" : statusWord(item, flags));
  const bought = isOwned(item);
  const carry = !!flags[item.id];
  const buyBtn = item.owned
    ? `<button type="button" class="take" disabled>已有</button>`
    : `<button type="button" class="take ${bought ? "on" : ""}" data-act="bought" data-id="${item.id}">${bought ? "已买" : "标记为已买"}</button>`;
  const carryBtn = `<button type="button" class="take ${carry ? "on" : ""}" data-act="toggle" data-id="${item.id}">${carry ? "已选本次携带" : "本次携带"}</button>`;
  const shop = item.shop
    ? `<a href="${esc(item.shop)}" target="_blank" rel="noopener noreferrer">${esc(item.shopName || "链接")}</a>`
    : `<span>无购买链接</span>`;
  const tech = item.tech ? `<p>需要专业训练｜需要确认路线许可｜不计入普通露营方案</p>` : "";
  return `<article class="gcard" data-gear="${esc(item.id)}">
    ${gearPhotoHtml(item)}
    <div>
      <h4>${esc(item.name)}</h4>
      <p>价格 AUD：${esc(price)} · 重量 g：${esc(grams)} · ${esc(word)}</p>
      ${item.briefRow ? `<p>适配型号：${esc(item.fitModel || "未记录")} · 包装数量：${item.packQty == null ? "未记录" : esc(String(item.packQty))} · 重量是否含配件：${esc(item.includesAccessories || "未记录")}</p>` : ""}
      ${item.weightNote ? `<p>${esc(item.weightNote)}</p>` : ""}
      <p>装法：${esc(placeText(item, flags))}</p>
      ${clothBars(item)}
      <p>来源：${esc(item.source || "未记录")} · 更新时间：${esc(item.updated || "未记录")}</p>
      <p>${shop}</p>
      ${tech}
    </div>
    <div class="gbtns">${buyBtn}${carryBtn}</div>
  </article>`;
}

function splitKg(flags) {
  const photoG = ["机身", "镜头", "转接", "滤镜", "胶片", "中画幅", "水下"];
  const safeG = ["应急", "补给"];
  let photo = 0;
  let safe = 0;
  let night = 0;
  PACK.forEach((item) => {
    if (!ownedWeightCounts(item, flags)) return;
    const g = itemSpec(item).g || 0;
    if (photoG.includes(item.group)) photo += g;
    else if (safeG.includes(item.group)) safe += g;
    else if (item.group === "过夜" || item.id === "pack65" || item.id === "insert") night += g;
  });
  return { photo: photo / 1000, safe: safe / 1000, night: night / 1000 };
}

function heavyAdvice(flags) {
  if (packTotals().kg <= 10) return "";
  if (flags.tele200) return "超过 10 kg，建议去掉 70–200mm 或改为日间行程。";
  let best = null;
  PACK.forEach((item) => {
    if (!weightCounts(item, flags) || item.id === "z8" || item.id === "tele600") return;
    const g = itemSpec(item).g || 0;
    if (!best || g > best.g) best = { name: item.name, g };
  });
  if (!best || !best.g) return "超过 10 kg。先拿下一件最重的，或改为日间行程。";
  return `超过 10 kg，建议先拿下${best.name}，或改为日间行程。`;
}

function shopMenuHtml() {
  const sections = [
    ["澳洲本地发货", [
      ["Snowys", "https://www.snowys.com.au/"],
      ["Wild Earth", "https://www.wildearth.com.au/"],
      ["Paddy Pallin", "https://www.paddypallin.com.au/"],
      ["Anaconda", "https://www.anacondastores.com/en-au"],
      ["Kase Australia", "https://www.kaseaustralia.com.au/"],
      ["SURVIVAL First Aid", "https://survivalfirstaidkits.com/collections/outdoor"],
      ["St John", "https://shop.stjohn.org.au/collections/first-aid-kits"],
      ["Naturehike Australia", "https://www.naturehike.au/"],
      ["BCF", "https://www.bcf.com.au/"],
      ["Tentworld", "https://www.tentworld.com.au/"],
      ["Macpac", "https://www.macpac.com.au/"],
      ["Kathmandu", "https://www.kathmandu.com.au/"],
      ["Decathlon", "https://www.decathlon.com.au/"],
      ["Aussie Disposals", "https://www.aussiedisposals.com.au/"],
      ["Backpacking Light", "https://www.backpackinglight.com.au/"],
      ["PAST Outdoors", "https://pastoutdoors.com/"],
      ["Bogong", "https://www.bogong.com.au/"],
      ["Mont", "https://mont.com.au/"],
      ["Wilderness Equipment", "https://www.wildernessequipment.com.au/"],
      ["Sea to Summit", "https://seatosummit.com.au/"],
      ["One Planet", "https://oneplanet.com.au/"],
      ["Naturehike 澳洲仓", "https://www.naturehike.com/collections/fast-arrival-au"],
      ["Naturexplore", "https://www.naturexplore.com.au/"],
      ["Naturehike 清仓仓", "https://www.naturehike.com/collections/naturehike-outlet-australia-warehouse-clearance"],
      ["OZtrail", "https://www.oztrail.com.au/"]
    ]],
    ["实体店", [
      ["Paddy Pallin", "https://www.paddypallin.com.au/"],
      ["Anaconda", "https://www.anacondastores.com/en-au"],
      ["Kathmandu", "https://www.kathmandu.com.au/"],
      ["Macpac", "https://www.macpac.com.au/"],
      ["Snowys", "https://www.snowys.com.au/"],
      ["Camera House", "https://www.camerahouse.com.au/"],
      ["DigiDirect", "https://www.digidirect.com.au/"],
      ["Kase Hurstville 展厅", "https://www.kaseaustralia.com.au/"]
    ]],
    ["摄影户外", [
      ["Camera House", "https://www.camerahouse.com.au/"],
      ["DigiDirect", "https://www.digidirect.com.au/"],
      ["Ted’s Cameras", "https://www.teds.com.au/"],
      ["George’s Cameras", "https://www.georges.com.au/"],
      ["CameraPro", "https://www.camerapro.com.au/"],
      ["Digital Camera Warehouse", "https://www.digitalcamerawarehouse.com.au/"],
      ["PhotoShop Studio", "https://photo-shop-studio.com.au/"],
      ["Kase Australia", "https://www.kaseaustralia.com.au/"],
      ["Nikon Australia", "https://www.nikon.com.au/"],
      ["Kase MRC CPL II 77 mm", "https://www.kaseaustralia.com.au/kase-mrc-cpl-ii-77mm-hd-multi-coated-optical-glass"]
    ]],
    ["露营徒步", [
      ["Petzl Actik Core", "https://www.snowys.com.au/actik-core-600-rechargeable-headlamp"],
      ["Black Diamond 头灯", "https://k2.com.au/collections/headlamps"],
      ["HydraPak Contour 2 L", "https://hydrapak.com.au/products/contour-2l-reservoir"],
      ["CamelBak", "https://camelbak.com.au/"],
      ["Anaconda 水袋包", "https://www.anacondastores.com/en-au/c/hydration-packs"],
      ["Naturehike 水袋", "https://www.naturehike.com/products/yunquan%E2%84%A2-tpu-hydration-bladder"],
      ["Snowys", "https://www.snowys.com.au/"],
      ["Wild Earth", "https://www.wildearth.com.au/"],
      ["Paddy Pallin", "https://www.paddypallin.com.au/"]
    ]],
    ["急救用品", [
      ["SURVIVAL 户外", "https://survivalfirstaidkits.com/collections/outdoor"],
      ["SURVIVAL 徒步包", "https://survivalfirstaidkits.net.au/collections/hiking"],
      ["St John 急救包", "https://shop.stjohn.org.au/collections/first-aid-kits"],
      ["St John 蛇伤模块", "https://shop.stjohn.org.au/products/outdoor-snakebite-first-aid-module"],
      ["TacMed 户外", "https://tacmedaustralia.com.au/collections/outdoor-remote-first-aid-kits/first-aid"],
      ["Paddy Pallin 应急", "https://www.paddypallin.com.au/equipment/hiking/emergency-and-survival.html"],
      ["Anaconda 急救", "https://www.anacondastores.com/camping-hiking/first-aid"],
      ["St John 空包", "https://shop.stjohn.org.au/products/medium-first-aid-empty-bag"],
      ["St John 补充装", "https://shop.stjohn.org.au/collections/refills-supplies"],
      ["St John 伤口护理", "https://shop.stjohn.org.au/collections/wound-care"],
      ["TacMed 蛇伤绷带", "https://tacmedaustralia.com.au/products/snake-bite-bandage"],
      ["St John 蛇伤绷带", "https://shop.stjohn.org.au/products/bandage-snake-bite-4-5m"],
      ["Ocean Signal PLB1", "https://www.snowys.com.au/rescueme-plb1"],
      ["GME MT610G", "https://www.gme.net.au/au/emergency-safety/mt610g/"],
      ["BCF PLB", "https://www.bcf.com.au/boating/marine-safety/plb"],
      ["Anaconda PLB", "https://www.anacondastores.com/en-au/c/personal-locater-beacons-satellite-communicators"],
      ["Garmin", "https://www.garmin.com/en-AU/"],
      ["Macpac 租用", "https://www.macpac.com.au/plb-hire.html"],
      ["NPWS 免费借用", "https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety/personal-locator-beacon"]
    ]]
  ];
  return sections.map(([title, links]) => `<section class="shopsec"><h4>${title}</h4><p>${links.map(([name, href]) => `<a href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(name)}</a>`).join("")}</p></section>`).join("");
}

let gearQuery = "";
let schemeNote = "";

const GEAR_ALIAS = {
  z8: "Nikon Z8 尼康",
  f3: "Nikon F3 尼康",
  f4: "Nikon F4 尼康",
  tele600: "Nikon NIKKOR Z 180-600mm",
  tele200: "Nikon NIKKOR Z 70-200mm",
  std: "Nikon NIKKOR Z 24-70mm f/4",
  ais3570: "Nikon Ai-S 35-70mm",
  micro55: "Micro-Nikkor 55mm",
  ai50: "Nikon Ai 50mm f/1.4",
  ftz: "Nikon FTZ",
  nd8: "Kase 卡色 ND8 72mm",
  nd64: "Kase 卡色 ND64 72mm",
  nd1000: "Kase 卡色 ND1000 72mm",
  cpl: "Kase 卡色 CPL 72mm",
  cpl77: "Kase MRC CPL II 77mm",
  action4: "DJI Osmo Action 4 大疆",
  mavic: "DJI Mavic 4 大疆 御4",
  rb67: "Mamiya RB67 玛米亚",
  rb137: "Mamiya RB67 137mm",
  x2d: "Hasselblad X2D 哈苏",
  xcd38: "Hasselblad XCD 38V 哈苏",
  boots: "The North Face Breithorn NF0A7W51 北面",
  daynf: "The North Face NF0A8BK4 北面",
  sling: "The North Face NF0A81DP 北面",
  pack65: "The North Face 65L 北面 背包",
  j8a4d: "The North Face NF0A8A4D 北面",
  j831: "The North Face NF0A831M 北面",
  s8bwc: "The North Face NF0A8BWC 北面",
  s8ezy: "The North Face NF0A8EZY 北面",
  s8fzp: "The North Face NF0A8FZP 北面",
  v8cm4: "The North Face NF0A8CM4 北面",
  j8en9: "The North Face NF0A8EN9 北面",
  j89zj: "The North Face NF0A89ZJ 北面",
  j89zm: "The North Face NF0A89ZM 北面",
  p12502: "The North Face NP12502 北面",
  b8fjq: "The North Face 8FJQ 北面",
  f8h1u: "The North Face 8H1U 北面",
  monopod: "Benro 百诺 独脚架",
  bins: "Vortex Diamondback 8x42 双筒",
  strap: "Peak Design Slide Lite",
  cube: "Peak Design 内胆",
  plb: "Ocean Signal rescueME PLB1",
  cards: "Sony CFexpress Type B",
  mac: "Apple MacBook Pro M4 Pro",
  watch: "Apple Watch",
  ssd: "WD 西数 SSD",
  nhpot: "Naturehike 铝锅",
  nhpole: "Naturehike 碳素杖",
  nhpad: "Naturehike Tuye",
  nhtent: "Naturehike Cloud UP",
  nhbag: "Naturehike CW295",
  stsdry: "Sea to Summit 干袋",
  stsmat: "Sea to Summit Ether Light",
  stsnet: "Sea to Summit 防蚊",
  svhike: "SURVIVAL Hiking",
  svtrail: "SURVIVAL Trail",
  sjsnake: "St John 蛇伤绷带",
  tacsnake: "TacMed 蛇伤绷带",
  hpcontour: "HydraPak Contour",
  cbcrux: "CamelBak Crux"
};

function gearHay(item) {
  return [item.name, item.spec, item.group, item.shopName, item.id, GEAR_ALIAS[item.id] || ""].join(" ").toLowerCase();
}

function matchItem(item) {
  const q = gearQuery.trim().toLowerCase();
  if (!q) return true;
  return gearHay(item).includes(q);
}

function gearPhotoHtml(item) {
  const src = typeof GEAR_PHOTOS !== "undefined" && GEAR_PHOTOS ? GEAR_PHOTOS[item.id] : "";
  if (!src) return `<span class="gphoto empty"></span>`;
  return `<img class="gphoto" alt="" src="${esc(src)}">`;
}

function statusWord(item, flags) {
  if (item.packable === false) return "留在住处";
  if (!isOwned(item) && flags[item.id]) return "尚未具备";
  if (!isOwned(item)) return "未买";
  if (flags[item.id]) return "本次携带";
  return item.borrow ? "免费借用" : "已有";
}

function pickerGroup(item) {
  if (item.fine) return item.fine;
  if (["z8", "f3", "f4", "action4", "rb67", "x2d", "mavic"].includes(item.id)) return "相机";
  if (item.group === "镜头" || item.group === "转接") return "镜头";
  return "其他配件";
}

const INSERT_IDS = new Set(["z8", "f3", "f4", "action4", "rb67", "x2d", "std", "tele200", "tele600", "ais3570", "micro55", "ai50", "ftz", "rb137", "xcd38", "tc14", "nd8", "nd64", "nd1000", "cpl", "cpl77", "gnd72", "gndHard", "batts", "copyStand", "film"]);
const OUTSIDE_IDS = new Set(["tripod", "monopod", "coman", "nhpole", "nhtent", "tent1", "tarp", "groundcloth", "boots", "sandals", "bottle", "water", "tech10", "tech11"]);
const RAIN_IDS = new Set(["j8a4d", "j831", "j89zj", "j89zm", "p12502", "j8en9"]);
const BAG_IDS = new Set(["pack65", "daynf", "sling"]);

function carryBag(flags) {
  if (flags.pack65) return "65";
  if (flags.daynf) return "day";
  if (flags.sling) return "sling";
  return "none";
}

function placeOf(item, flags) {
  if (!item || item.packable === false) return "home";
  if (BAG_IDS.has(item.id)) return "bag";
  if (item.id === "insert") return flags.pack65 ? "inside" : "skip";
  if (item.id === "z8") return carryBag(flags) === "65" ? "insert" : "inside";
  if (OUTSIDE_IDS.has(item.id) || RAIN_IDS.has(item.id) || item.group === "鞋") return "outside";
  if (INSERT_IDS.has(item.id)) return carryBag(flags) === "65" ? "insert" : "inside";
  return "inside";
}

function placeText(item, flags) {
  const place = placeOf(item, flags);
  if (place === "home") return "留在住处";
  if (place === "bag") return "这是包，不另算一个位置";
  if (place === "skip") return "只跟 65L，这次不装进这只包";
  if (item.id === "z8" && place === "insert") return "装内胆。不出水。";
  if (item.id === "z8") return "装包里。不出水。";
  if (place === "insert") return "装内胆";
  if (place === "outside") return "装外面";
  return "装包里";
}

function settleBags(flags, id) {
  if (id === "plb" && flags.plb) flags.plbnpws = false;
  if (id === "plbnpws" && flags.plbnpws) flags.plb = false;
  if (id === "pack65" && flags.pack65) {
    flags.daynf = false;
    flags.sling = false;
    flags.insert = true;
  }
  if (id === "daynf" && flags.daynf) {
    flags.pack65 = false;
    flags.sling = false;
    flags.insert = false;
  }
  if (id === "sling" && flags.sling) {
    flags.pack65 = false;
    flags.daynf = false;
    flags.insert = false;
  }
  if (!flags.pack65) flags.insert = false;
  const nds = ["nd8", "nd64", "nd1000"];
  if (nds.includes(id) && flags[id]) nds.forEach((key) => { if (key !== id) flags[key] = false; });
}

function moneyHtml(flags) {
  let owned = 0;
  let blank = 0;
    PACK.forEach((item) => {
    if (!flags[item.id] || !isOwned(item) || item.packable === false || personalOnly(item) || item.tech) return;
    if (!weightCounts(item, flags)) return;
    const spec = itemSpec(item);
    const aud = spec.cost != null && (!item.cur || item.cur === "AUD") && !item.borrow;
    if (spec.cost == null) blank += 1;
    if (!aud) return;
    owned += spec.cost;
  });
  return `<div class="money" id="moneyLines">
    <p>当前已有价格：A$${owned.toFixed(2)}</p>
    <p>未买或不勾本次携带的不计入金额。</p>
    <p>有 ${blank} 件已携带但价格未记录。</p>
  </div>`;
}

function cardsOf(items, flags) {
  const rows = items.filter(matchItem);
  if (!rows.length) return "";
  return `<div class="gcards">${rows.map((item) => gearCard(item, flags)).join("")}</div>`;
}

function sunNote(site) {
  const sun = loadJson("caolou-sun", null);
  const date = localStorage.getItem("caolou-weather-date") || "";
  if (!sun || !site || sun.id !== site.id || sun.date !== date || !sun.sunset) {
    return "天黑前返回：未查到。先选日期并读取天气。日落只采用 Open-Meteo 的读数，没有读数就不判断。";
  }
  const field = FIELD[site.id];
  const hours = field && field.walk && field.walk.hours ? field.walk.hours[1] : null;
  const set = String(sun.sunset).slice(11, 16);
  const rise = sun.sunrise ? String(sun.sunrise).slice(11, 16) : "";
  let line = `日落 ${set}${rise ? `，日出 ${rise}` : ""}。来源 Open-Meteo，读取时间 ${esc(String(sun.at || "").slice(0, 16))}。`;
  if (hours != null) line += ` 公告现场最长约 ${hours} 小时。末班车未查到，不能写成已经赶得上返回。`;
  return line;
}

function plbLine(site) {
  if (!NPWS_PLB[site.id]) return "PLB：不计入本地点方案。";
  const info = typeof stopInfo === "function" ? stopInfo(site) : null;
  if (!info) return "PLB：不计入本地点方案。没有已记录的车站能接到借用点。";
  if (site.id === "walls") return "车站记录是 Blackheath。示位标要提前到 Blue Mountains Heritage Centre 借，不是岩洞上的设备。地址、电话和开放时间未查到。";
  return "可先坐已记录的火车到 Blackheath，再去 Blue Mountains Heritage Centre 借。不是这个步道上的设备，也不按直线距离算。地址、电话和开放时间未查到。";
}

function soloTone(site) {
  const info = typeof stopInfo === "function" ? stopInfo(site) : null;
  if (!info) return "tone-red";
  if (noSignal(site) || site.id === "royal" || site.id === "kuringgai") return "tone-orange";
  if (info.walk && /[4-9]0/.test(info.walk)) return "tone-yellow";
  return "tone-green";
}

function verdictPair(site) {
  const info = typeof stopInfo === "function" ? stopInfo(site) : null;
  if (!info) return ["不建议独行", "没有好用的车站或码头。不写从草楼开车的路线。"];
  if (noSignal(site)) return ["不建议独行", "现有撤离或找路分数偏低。"];
  if (site.id === "royal" || site.id === "kuringgai") return ["建议过夜", "地点记录里写了可以过夜。末班车未查到。"];
  return ["可当天往返", "推测。只因为已有车站，并且记录不是过夜行程。末班车未查到，不能当成已经核对。"];
}

function transitRow(site) {
  if (typeof TRANSIT === "undefined" || !site) return null;
  return TRANSIT[site.id] || null;
}

function transitSentence(site) {
  const row = transitRow(site);
  if (!row) return "公共交通：还没有查到谷歌地图的结果。";
  if (!row.ok) {
    const why = row.error ? "这次没有从谷歌地图读到结果，没有编班次。" : "谷歌地图没有给出公共交通。";
    return `公共交通：${why}来源 Google 地图，查询时间 ${row.at || ""}。`;
  }
  const ride = (row.lines || []).map((line) => {
    const head = line.head ? `（${line.head}）` : "";
    return `${line.mode} ${line.code}${head}`;
  }).join(" → ");
  const clock = row.depart && row.arrive ? `${row.depart}–${row.arrive}` : "";
  const when = String(row.duration || "").startsWith("每")
    ? `班距${row.duration}${clock ? `，查询当时能看到 ${clock}` : ""}。这不是末班车。`
    : `${row.duration}${clock ? `，查询当时的下一班 ${clock}` : ""}。这不是末班车。`;
  const walk = row.walkM ? `步行合计约 ${row.walkM >= 1000 ? (row.walkM / 1000).toFixed(1) + " km" : row.walkM + " m"}。` : "";
  const alight = row.alight ? `在 ${row.alight} 下车，之后是步行。` : "下车点没有从这一班里拆出来。";
  return `公共交通 ${when}${ride ? ride + "。" : ""}换乘 ${row.transfers} 次。${walk}${alight}来源 Google 地图，查询时间 ${row.at || ""}。从草楼到这里的线不画在地图上。`;
}

function loadDayPlan(id) {
  const all = loadJson("caolou-dayplan", {});
  return Object.assign({ depart: "", stay: "", back: "" }, (all && all[id]) || {});
}

function parseClock(value) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(value || "").trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return hour * 60 + minute;
}

function fmtClock(mins) {
  const n = ((mins % (24 * 60)) + 24 * 60) % (24 * 60);
  return `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
}

function transitAddMinutes(row) {
  if (!row || !row.ok || String(row.duration || "").startsWith("每")) return null;
  const hour = /(\d+)\s*小时/.exec(row.duration || "");
  const minute = /(\d+)\s*分钟/.exec(row.duration || "");
  if (!hour && !minute) return null;
  return (hour ? Number(hour[1]) * 60 : 0) + (minute ? Number(minute[1]) : 0);
}

function dayMathText(site) {
  const plan = loadDayPlan(site.id);
  const row = transitRow(site);
  const ride = transitAddMinutes(row);
  const depart = parseClock(plan.depart);
  const stayRaw = String(plan.stay || "").trim();
  const stayN = stayRaw === "" ? null : Number(stayRaw);
  const stayOk = stayN != null && Number.isFinite(stayN) && stayN >= 0;
  const back = parseClock(plan.back);
  let arriveLine = "未填";
  let arriveMin = null;
  if (depart != null && row && row.ok && String(row.duration || "").startsWith("每")) arriveLine = "班距不能加到出发时刻上";
  else if (depart != null && ride != null) {
    arriveMin = depart + ride;
    arriveLine = fmtClock(arriveMin);
  }
  const leaveLine = arriveMin == null || !stayOk ? "未填" : fmtClock(arriveMin + stayN);
  const leaveMin = leaveLine === "未填" ? null : parseClock(leaveLine);
  let compare = "未填";
  if (leaveMin != null && back != null) {
    compare = leaveMin < back ? "离开现场早于所填返程时刻" : leaveMin === back ? "离开现场正好是所填返程时刻" : "离开现场晚于所填返程时刻";
  }
  return { arriveLine, leaveLine, compare };
}

function dayMathHtml(site) {
  const math = dayMathText(site);
  return `<p>到达现场：${esc(math.arriveLine)}</p><p>离开现场：${esc(math.leaveLine)}</p><p>和返程时刻比：${esc(math.compare)}</p>`;
}

function dayPlanHtml(site) {
  const plan = loadDayPlan(site.id);
  const row = transitRow(site);
  const google = !row || !row.ok
    ? "谷歌地图没有给出公共交通。"
    : `${transitSentence(site)} 查询当时的下一班，不是末班，也不是你填的出发时刻。`;
  return `<section class="block" id="dayPlan">
    <h3>时间</h3>
    <p>${esc(google)}</p>
    <label>出发时刻 <input data-plan="depart" value="${esc(plan.depart || "")}" placeholder="HH:MM" inputmode="numeric"></label>
    <label>现场停留 <input data-plan="stay" value="${esc(plan.stay || "")}" placeholder="分钟" inputmode="numeric"></label>
    <label>返程时刻 <input data-plan="back" value="${esc(plan.back || "")}" placeholder="HH:MM" inputmode="numeric"></label>
    <div id="dayMath">${dayMathHtml(site)}</div>
  </section>`;
}

function dayPlanReadout(site) {
  if (!site) return "";
  const math = dayMathText(site);
  return `准备页填的窗口：到达现场 ${math.arriveLine}，离开现场 ${math.leaveLine}，和返程时刻比：${math.compare}。步道上的点仍分开改。`;
}

const ROUTE_MODES = ["火车", "轻轨", "渡轮", "公交", "步行", "开车"];
const ROUTE_NAME = { "火车": "火车", "轻轨": "轻轨", "轮渡": "渡轮", "渡轮": "渡轮", "公交": "公交" };
const OPAL_ADULT = "https://transportnsw.info/tickets-fares/fares/adult-opal-fares";
const FARE_READ = "2026-11-13";

function fareSentence(kind, code) {
  if (kind === "步行") return "不需要票。";
  if (kind === "开车") return "开车路线未查。油费未查到。过路费未查到。";
  if (code === "MFF") {
    return `票价未查到。运营商页面没有印出金额，只写这班按 Opal 计价。https://www.myfastferry.com.au/fares/ 阅读日期 ${FARE_READ}。成人价表 ${OPAL_ADULT} 同一天打开。距离档没有写在这班记录里，所以不写大约金额。`;
  }
  return `票价未查到。成人票按距离分档，这班记录里没有车程公里，对不上档。${OPAL_ADULT} 阅读日期 ${FARE_READ}。`;
}

function routeModesHtml(site) {
  const row = transitRow(site);
  const lines = row && row.ok && Array.isArray(row.lines) ? row.lines : [];
  const groups = {};
  lines.forEach((line) => {
    const kind = ROUTE_NAME[line.mode];
    if (!kind || !line.code) return;
    if (!groups[kind]) groups[kind] = [];
    groups[kind].push(line);
  });
  if (row && row.ok && row.walkM != null) groups["步行"] = groups["步行"] || [];
  groups["开车"] = groups["开车"] || [];
  const alight = row && row.alight ? `这趟记录的下车点：${row.alight}。` : "";
  const blocks = ROUTE_MODES.filter((kind) => Object.prototype.hasOwnProperty.call(groups, kind)).map((kind) => {
    if (kind === "步行") {
      const metres = Number(row.walkM);
      const dist = metres >= 1000 ? `${(metres / 1000).toFixed(1)} km` : `${metres} m`;
      return `<section class="mode"><h4>步行</h4><p>记录里的步行合计约 ${esc(dist)}。不需要票。</p></section>`;
    }
    if (kind === "开车") {
      return `<section class="mode"><h4>开车</h4><p>开车路线未查。没有把直线距离写成公路。油费未查到。过路费未查到。</p></section>`;
    }
    const legs = groups[kind].map((line) => {
      const head = line.head ? `，方向 ${line.head}` : "";
      return `<p>${esc(kind)} ${esc(line.code)}${esc(head)}。${alight ? esc(alight) : ""}</p><p>${esc(fareSentence(kind, line.code))}</p>`;
    }).join("");
    return `<section class="mode"><h4>${esc(kind)}</h4>${legs}</section>`;
  }).join("");
  const missing = !row || !row.ok ? `<p class="note">谷歌地图没有给出公共交通。没有编班次。</p>` : "";
  return `<section class="block" id="routeModes"><h3>怎么去</h3>${missing}${blocks}</section>`;
}

function decisionHtml(site) {
  const info = typeof stopInfo === "function" ? stopInfo(site) : null;
  const pair = verdictPair(site);
  const kmText = typeof km === "function" ? `直线估算 ${km(site).toFixed(0)} km。` : "";
  const recorded = info ? `原先记下的车站：${info.label}。${info.walk || ""}` : "";
  const row = transitRow(site);
  const back = row && row.ok && row.alight ? `往回走到 ${row.alight}。` : (info ? `往回走到 ${info.label}。` : "没有从谷歌地图拆出下车点。");
  return `<section class="decide ${soloTone(site)}">
    <h3>这一天能不能走</h3>
    <p class="verdict">${esc(pair[0])}</p>
    <p>${esc(pair[1])}</p>
    <p>${kmText}不要把直线当成已经到了。</p>
    <p>${esc(transitSentence(site))}</p>
    <p>${recorded ? esc(recorded) : ""}</p>
    <p>最晚一班没有另查。上面的钟点是查询当时的下一班，不是末班，也不能当成夜间一定还有车。</p>
    <p>${sunNote(site)}</p>
    <p>${esc(plbLine(site))}</p>
    <p>撤退：${esc(back)} 厕所和饮水：未记录。有信号的具体位置：未记录。${noSignal(site) ? "现有分数认为手机信号不稳。" : "现有分数没有把信号标成很差。"}</p>
    <p class="note">公共交通来自 Google 地图。查询时间写在上面。不是末班，也没有画从草楼出发的线。</p>
  </section>`;
}

function compatHtml(flags) {
  const lines = [];
  if (flags.tele600 && flags.tele200) lines.push("Z 70-200 和 Z 180-600 不能同时装上。选择没有被清掉。两只的克数都留在计划总重量里。带不带两只由你决定。");
  else if (schemeNote.includes("70–200") || schemeNote.includes("70-200")) lines.push("风光方案没有自动勾上 70–200。你可以自己勾上，勾上之后不会被清掉。");
  if (["nd8", "nd64", "nd1000", "cpl"].some((id) => flags[id]) && !flags.std) lines.push("72 mm 滤镜只装 24–70。现在没勾 24–70，不计重。");
  if (flags.cpl77 && !flags.tele200) lines.push("77 mm 只上 70-200。现在没勾 70-200，不计重。");
  if (flags.tc14 && !flags.tele200) lines.push("增距镜只打算加在 70–200 上。没勾 70–200 就不计。");
  if (flags.tc14 && flags.tele600 && !flags.tele200) lines.push("增距镜不能加在 180–600 上。");
  if (flags.insert && !flags.pack65) lines.push("阿尔菲斯 L 只跟 65L。65L 没记下时，内胆不计重。");
  if (flags.pack65) lines.push("65L 背包不计入本次重量。");
  PACK.forEach((item) => {
    if (!flags[item.id] || isOwned(item) || personalOnly(item) || item.packable === false || item.tech) return;
    if (!showGear(item, flags)) return;
    const spec = itemSpec(item);
    if (weightCounts(item, flags)) {
      lines.push(`${item.name} 尚未具备。${spec.g == null ? "克数未记录，计划总重量不加这一行。" : "克数计入计划总重量。"}`);
    } else {
      lines.push(`${item.name} 尚未具备。这次的搭配条件没满足，不计入重量。`);
    }
  });
  if (!lines.length) lines.push("没有新的装不上的提醒。");
  return lines.map((line) => `<p class="warnline">${esc(line)}</p>`).join("");
}

function nestedCards(name, rows, flags) {
  const tree = (typeof GEAR_TREE !== "undefined" && GEAR_TREE[name]) || {};
  const buckets = {};
  rows.forEach((item) => {
    const mid = item.mid || "未再分";
    const leaf = item.leaf || "未再分";
    if (!buckets[mid]) buckets[mid] = {};
    if (!buckets[mid][leaf]) buckets[mid][leaf] = [];
    buckets[mid][leaf].push(item);
  });
  Object.keys(tree).forEach((mid) => {
    if (!buckets[mid]) buckets[mid] = {};
    tree[mid].forEach((leaf) => {
      if (!buckets[mid][leaf]) buckets[mid][leaf] = [];
    });
  });
  const searching = gearQuery.trim();
  const mids = Object.keys(tree).concat(Object.keys(buckets).filter((mid) => !tree[mid]));
  return mids.map((mid) => {
    const known = tree[mid] || [];
    const leaves = known.concat(Object.keys(buckets[mid] || {}).filter((leaf) => !known.includes(leaf)));
    const body = leaves.map((leaf) => {
      const html = cardsOf((buckets[mid] && buckets[mid][leaf]) || [], flags);
      if (searching && !html) return "";
      return `<h5>${esc(leaf)}</h5>${html || `<p class="note">未核对。这一级没有单品。</p>`}`;
    }).join("");
    if (!body) return "";
    return `<h4>${esc(mid)}</h4>${body}`;
  }).join("");
}

function tripGroupsHtml(flags) {
  const bag = carryBag(flags);
  const note = bag === "65"
    ? "65L 用阿尔菲斯 L。机身和镜头装内胆。上了身的那台机加一只镜头收进内胆时仍算装内胆。两只长焦不能同时上身，没上身的那只仍在内胆。内胆本身装在 65L 里，克数只在勾了 65L 且勾了内胆时才算。"
    : bag === "day"
      ? "这只包没有内胆。书包是 NF0A8BK4。相机改到装包里。"
      : bag === "sling"
        ? "这只包没有内胆。挎包是 NF0A81DP。相机改到装包里。"
        : "还没有勾选 65L、书包或挎包。相机先按装包里，不单开内胆。";
  const buckets = { insert: [], inside: [], outside: [] };
  PACK.forEach((item) => {
    if (item.hide || !matchItem(item) || !showGear(item, flags)) return;
    const place = placeOf(item, flags);
    if (place === "home" || place === "bag" || place === "skip") return;
    buckets[place].push(item);
  });
  const block = (title, list, extra) => {
    const rows = list.map((item) => {
      const spec = itemSpec(item);
      const grams = weightCounts(item, flags) ? (spec.g == null ? "克数未记录" : `${spec.g} g`) : "不计重";
      return `<li>${esc(item.name)} · ${esc(placeText(item, flags))} · ${esc(statusWord(item, flags))} · ${esc(grams)}</li>`;
    }).join("");
    return `<h4>${title}</h4>${extra || ""}${rows ? `<ul class="triplist">${rows}</ul>` : `<p class="note">这一格没有单品。</p>`}`;
  };
  const insertExtra = bag === "65" ? "" : bag === "none"
    ? `<p class="note">还没选到 65L，所以没有内胆这一格。</p>`
    : `<p class="note">这只包没有内胆。</p>`;
  const home = PACK.filter((item) => item.packable === false && matchItem(item)).map((item) => esc(item.name)).join("、");
  return `<section class="gearsec" id="tripList"><h3>出行清单</h3><p class="note">${esc(note)}</p>
    ${block("装内胆", buckets.insert, insertExtra)}
    ${block("装包里", buckets.inside, "")}
    ${block("装外面", buckets.outside, "")}
    <p>留在住处：${home || "没有"}</p>
  </section>`;
}

function gearListsHtml(site) {
  const flags = packFlags();
  const q = gearQuery.trim();
  const visible = PACK.filter((item) => !item.hide && !personalOnly(item) && showGear(item, flags));
  const order = ["相机", "镜头", "滤镜", "支撑", "携带与防护", "电力与存储", "观测", "照明", "导航", "求救", "庇护", "睡眠", "饮水", "炊事", "卫生", "急救", "修理", "技术活动", "其他配件"];
  const groups = order.map((name) => {
    const rows = visible.filter((item) => pickerGroup(item) === name && item.packable !== false);
    const html = nestedCards(name, rows, flags);
    if (!html) return "";
    const nav = name === "导航" ? `<p class="note">离线地图、GPX 导入导出和自定义路线是网站已有功能，不是未买商品。</p>` : "";
    const power = name === "电力与存储" ? `<p class="note">分设备用电量未测。不估算 mAh。</p>` : "";
    return `<section class="gearsec"><h3>${name}</h3>${nav}${power}${html}</section>`;
  }).join("");
  const buyNames = PACK.filter((item) => !isOwned(item) && !item.hide && !personalOnly(item) && !item.tech && matchItem(item) && showGear(item, flags));
  const trip = tripGroupsHtml(flags);
  const buySec = `<section class="gearsec" id="buyList"><h3>购买清单</h3><p class="note">未买留在这里。标记为已买不会自动变成本次携带。勾进方案的未买仍计入计划总重量，并写尚未具备。克数空着的不加。价格不跨货币相加。</p>
    <p>${buyNames.length ? buyNames.map((item) => esc(item.name)).join("、") : "没有匹配的未买单品。"}</p>
    ${q ? "" : shopMenuHtml()}</section>`;
  const personalRows = PACK.filter((item) => personalOnly(item) && !item.hide);
  const perSec = `<section class="gearsec"><h3>个人记录</h3><p class="note">衣服、靴子、墨镜、背包和帽子不计入本次方案。包本身不另算一个装法。</p>${nestedCards("个人记录", personalRows, flags)}</section>`;
  return `${groups}${trip}${buySec}${perSec}`;
}

function statusHtml(site) {
  const flags = packFlags();
  const parts = splitKg(flags);
  const t = packTotals();
  const toneKg = Number.isFinite(t.ownedKg) ? t.ownedKg : t.kg;
  const tone = toneKg > 10 ? "tone-red" : toneKg > 8 ? "tone-yellow" : "tone-green";
  return `${site ? decisionHtml(site) : ""}
    ${moneyHtml(flags)}
    <div class="splitkg ${tone}"><p>摄影 ${parts.photo.toFixed(2)} kg · 安全 ${parts.safe.toFixed(2)} kg · 过夜 ${parts.night.toFixed(2)} kg · 已具备 ${toneKg.toFixed(2)} kg · 计划总重量 ${t.kg.toFixed(2)} kg</p>
    <p class="warnline">${esc(heavyAdvice(flags))}</p></div>
    ${site ? barsHtml(site) : ""}
    ${site ? effortHtml(site) : ""}
    <div id="packTotals">${totalsHtml()}</div>
    <div id="packWarn">${site ? warnHtml(site) : ""}</div>
    <div class="kitwarn">${compatHtml(flags)}</div>`;
}

function schemeNoteForActive() {
  const saved = loadJson("caolou-scheme", {});
  const row = activeId && saved[activeId];
  if (!row) return "";
  if (row.note) return row.note;
  if (row.name) return `已采用${row.name}。仍可拿下。`;
  return "";
}

function packPanelHtml(site) {
  schemeNote = schemeNoteForActive();
  const name = site ? site.name : "这一处";
  return `<section class="panel prep-split" id="packBox">
    <div class="prep-gear" id="gearCol">
      <input id="gearSearch" type="search" placeholder="搜中文名、英文名、款号或牌子" value="${esc(gearQuery)}">
      <div class="schemes">
        <button type="button" class="take" data-act="scheme" data-kind="light">采用${esc(name)}轻装方案</button>
        <button type="button" class="take" data-act="scheme" data-kind="animal">采用${esc(name)}动物方案</button>
        <button type="button" class="take" data-act="scheme" data-kind="full">采用${esc(name)}风光方案</button>
      </div>
      <p id="schemeNote" class="note">${esc(schemeNote || "三套都是建议。可以再拿下。衣服、靴子和背包不在里面。")}</p>
      <div id="gearLists">${gearListsHtml(site)}</div>
    </div>
    <aside class="prep-status" id="statusCol">${statusHtml(site)}</aside>
  </section>`;
}

function refreshPack() {
  schemeNote = schemeNoteForActive();
  const site = activeId ? SITES.find((item) => item.id === activeId) : null;
  const lists = document.getElementById("gearLists");
  if (lists && site) lists.innerHTML = gearListsHtml(site);
  const note = document.getElementById("schemeNote");
  if (note) note.textContent = schemeNote || "三套都是建议。可以再拿下。衣服、靴子和背包不在里面。";
  const status = document.getElementById("statusCol");
  if (status && site) status.innerHTML = statusHtml(site);
  const head = document.getElementById("planHead");
  if (head) {
    const totals = packTotals();
    head.textContent = `当前装备方案：${schemeLabel()}｜已具备 ${totals.ownedKg.toFixed(2)} kg｜计划总重量 ${totals.kg.toFixed(2)} kg`;
  }
}

function applyScheme(kind) {
  const flags = {};
  PACK.forEach((item) => { flags[item.id] = false; });
  const wanted = {
    light: ["z8", "std"],
    animal: ["z8", "tele600"],
    full: ["z8", "std", "tele200", "tele600"]
  }[kind] || [];
  const on = [];
  wanted.forEach((id) => {
    if (kind === "full" && id === "tele200") return;
    const item = PACK.find((row) => row.id === id);
    if (!item || personalOnly(item) || !isOwned(item)) return;
    flags[id] = true;
    on.push(item.name);
  });
  if (flags.tele600) flags.tele200 = false;
  if (!flags.pack65) flags.insert = false;
  const prev = activeId;
  if (prev) saveFlags(flags);
  const names = { light: "轻装观察", animal: "动物优先", full: "风光完整" };
  const saved = loadJson("caolou-scheme", {});
  const site = SITES.find((item) => item.id === prev);
  const place = site ? site.name : "这一处";
  if (kind === "light") schemeNote = `已采用${place}轻装方案：${on.join("、")}。仍可拿下。技术活动不在这套里。`;
  else if (kind === "animal") schemeNote = `已采用${place}动物方案：${on.join("、")}。独脚架仍是未买，没有勾上。仍可拿下。`;
  else schemeNote = `已采用${place}风光方案：勾上 ${on.join("、")}。风光完整列出了 24–70、70–200 和 180–600。两只不能同时装上，所以这套没有自动勾上 70–200。你可以自己勾上。勾上之后不会被清掉，克数都计入计划总重量。`;
  if (prev) saved[prev] = { name: names[kind], kind, note: schemeNote };
  saveJson("caolou-scheme", saved);
  activeId = prev;
  refreshPack();
}

function schemeLabel() {
  const saved = loadJson("caolou-scheme", {});
  const row = activeId && saved[activeId];
  return row && row.name ? row.name : "未选";
}

function applySuggestion(siteId) {
  const flags = {};
  PACK.forEach((item) => { flags[item.id] = false; });
  const ids = suggestIds(siteId);
  ids.forEach((id) => { flags[id] = true; });
  if (!flags.pack65) flags.insert = false;
  const prev = activeId;
  activeId = siteId;
  saveFlags(flags);
  activeId = prev;
  refreshPack();
  const note = document.getElementById("suggestNote");
  if (note) {
    const names = ids.map((id) => (PACK.find((item) => item.id === id) || {}).name).filter(Boolean);
    note.textContent = `已勾上：${names.join("、")}。仍可拿下任何一件。`;
  }
}

function routeFacts(site) {
  const walk = FIELD[site.id].walk;
  const scores = FIELD[site.id].safety;
  const vals = Object.values(scores);
  const pack = packTotals().kg;
  const mass = BODY_KG + pack;
  const low = walk.met * mass * walk.hours[0];
  const high = walk.met * mass * walk.hours[1];
  const compare = (walk.km / 5 + walk.climb / 600) * mass / BODY_KG;
  const stop = typeof stopInfo === "function" ? stopInfo(site) : null;
  return {
    low, high, compare, pack, climb: walk.climb, hours: walk.hours[1],
    safetyMin: Math.min(...vals), rescue: scores.rescue, noStop: !stop, walk
  };
}

function bandFor(facts) {
  if (facts.high > 3400 || facts.pack > 18 || (facts.safetyMin <= 3 && facts.hours > 4) || (facts.noStop && facts.rescue <= 4)) return ROUTE_COLORS.black;
  if (facts.high > 2400 || facts.climb > 400) return ROUTE_COLORS.red;
  if (facts.high >= 1600) return ROUTE_COLORS.orange;
  if (facts.high >= 800 || facts.climb >= 150 || facts.pack >= 8) return ROUTE_COLORS.yellow;
  return ROUTE_COLORS.green;
}

function publishedBand(site) {
  const facts = routeFacts(site);
  return { facts, band: bandFor(facts) };
}

function drawnKm(siteId) {
  if (typeof hikePoints !== "function" || typeof map === "undefined" || !map || !siteId) return null;
  const points = hikePoints(siteId);
  if (!points || points.length < 2) return null;
  let meters = 0;
  for (let i = 1; i < points.length; i += 1) {
    meters += map.distance([points[i - 1].lat, points[i - 1].lng], [points[i].lat, points[i].lng]);
  }
  return meters / 1000;
}

function timeLinePaint(site) {
  const sun = loadJson("caolou-sun", null);
  const date = localStorage.getItem("caolou-weather-date") || "";
  const hasSun = !!(sun && site && sun.id === site.id && sun.date === date && sun.sunset);
  const hasLast = false;
  if (!hasSun || !hasLast) {
    const missing = [];
    if (!hasSun) missing.push("日落未查到");
    if (!hasLast) missing.push("最晚返程未查到");
    return { hex: "#c8c2b4", name: "未按时间上色", note: `${missing.join("。")}。不按猜测的钟点上色。` };
  }
  const pair = verdictPair(site);
  const colors = {
    "可当天往返": ["#7d9a62", "绿 · 可当天往返"],
    "时间较紧": ["#d4a017", "黄 · 时间较紧"],
    "建议过夜": ["#e07a3a", "橙 · 建议过夜"],
    "不建议独行": ["#c44536", "红 · 不建议独行"]
  };
  const color = colors[pair[0]] || ["#c8c2b4", "未按时间上色"];
  return { hex: color[0], name: color[1], note: pair[1] || "" };
}

function lineBand(site) {
  const facts = routeFacts(site);
  const km = typeof drawnKm === "function" ? drawnKm(site.id) : null;
  if (km == null) return null;
  const mass = BODY_KG + facts.pack;
  const hours = (km / 5) * mass / BODY_KG;
  const kcal = FIELD[site.id].walk.met * mass * hours;
  const band = bandFor(Object.assign({}, facts, { high: kcal, low: kcal }));
  return { km, kcal, band };
}

function effortHtml(site) {
  if (!FIELD[site.id]) return "";
  const { facts, band } = publishedBand(site);
  const low = Math.round(facts.low);
  const high = Math.round(facts.high);
  const knee = facts.climb >= 150 ? "这段有下坡。按 100 kg 记膝盖负担，不重复加进热量。" : "下坡不多。膝盖仍按 100 kg 看，不进热量。";
  return `<div id="kcalOut">
    <p>公告 ${facts.walk.hours[0]}–${facts.walk.hours[1]} 小时 · ${facts.walk.km} km · 爬升约 ${facts.climb} m</p>
    <p>热量 <strong>${low}–${high} kcal</strong>。公式：MET ×（100 + 包重公斤）× 公告小时。身高 183 cm 不进公式。爬升已经在 MET 里，不加第二遍。</p>
    <p>对照小时 <strong>${facts.compare.toFixed(1)}</strong>。公式：（公里 / 5 + 爬升米 / 600）×（100 + 包重公斤）/ 100。只对照，不替换公告时间。</p>
    <p>颜色按热量上沿：<strong class="route-name" style="color:${band.hex === "#111111" ? "#f3f0e6" : band.hex}">${band.name}</strong></p>
    <p>包重 ${facts.pack.toFixed(2)} kg，是 100 kg 的 ${(facts.pack).toFixed(1)}%。</p>
    <p>${knee}</p>
    <p class="note">${esc(facts.walk.note)}</p>
  </div>`;
}

function safetyHtml(site) {
  const scores = FIELD[site.id].safety;
  const vals = SAFETY.map(([key]) => scores[key]);
  const avg = (vals.reduce((sum, n) => sum + n, 0) / vals.length).toFixed(1);
  const low = Math.min(...vals);
  const lowName = SAFETY.find(([key]) => scores[key] === low)[1];
  const rows = SAFETY.map(([key, label, hint]) => {
    const n = scores[key];
    return `<div class="srow ${n <= 4 ? "bad" : ""}"><span>${label}<small>${hint}</small></span><b>${n}</b><i style="width:${n * 10}%"></i></div>`;
  }).join("");
  return `<section class="safety"><h3>安全 ${avg}/10 · 最短板是${lowName} ${low}</h3>
    <p class="note">10 分最安全。这是好天气、不封园时的判断。出发当天看火灾、风和步枪场。</p>${rows}</section>`;
}

function monthTicks(months) {
  return `<span class="mticks">${ALL.map((month) => `<i class="${months.includes(month) ? "on" : ""} ${month === NOW ? "now" : ""}">${month}</i>`).join("")}</span>`;
}

function animalTier(animal) {
  const windows = animal.windows || [];
  const notes = windows.map((item) => item.note || "").join(" ");
  if (/经常在|很常见/.test(notes)) return "常驻";
  const odds = [...new Set(windows.map((item) => String(item.odds || "").trim()))];
  if (odds.length !== 1) return "未分级";
  const word = odds[0];
  if (word === "高" || word === "季节内高" || word === "看见的概率高") return "概率高";
  if (word === "中") return "概率中";
  if (word === "低") return "概率低";
  return "未分级";
}

function animalRealm(id) {
  if (typeof SPECIES !== "undefined" && SPECIES[id] && SPECIES[id].realm) return SPECIES[id].realm;
  const water = new Set(["whale", "dolphin", "groper", "seadragon", "cuttlefish", "octopus", "platypus", "rightwhale", "stingray", "ray", "seal"]);
  const bird = new Set(["honeyeater", "wattlebird", "lyrebird", "blackcockatoo", "kingfisher", "seaeagle", "bowerbird", "ganggang", "rosella", "wedgetail", "spoonbill", "swan", "bristlebird", "groundparrot", "fantail", "oystercatcher", "fairywren", "osprey", "heron", "shorebird", "rockwarbler", "owl", "spinebill", "currawong", "egret", "duck"]);
  if (water.has(id)) return "水中";
  if (bird.has(id)) return "飞禽";
  return "地面";
}

const NAMED_ANIMALS = [
  { id: "rightwhale", name: "南露脊鲸", keys: ["南露脊鲸"], realm: "水中" },
  { id: "spinebill", name: "刺嘴吸蜜鸟", keys: ["刺嘴吸蜜鸟"], realm: "飞禽" },
  { id: "wattlebird", keys: ["小垂蜜鸟"], realm: "飞禽" },
  { id: "fairywren", keys: ["华丽细尾鹩莺", "细尾鹩莺"], realm: "飞禽" },
  { id: "currawong", name: "灰噪钟鹊", keys: ["灰噪钟鹊"], realm: "飞禽" },
  { id: "blackcockatoo", keys: ["黄尾黑凤头鹦鹉"], realm: "飞禽" },
  { id: "ganggang", keys: ["帮帮凤头鹦鹉"], realm: "飞禽" },
  { id: "rosella", keys: ["深红玫瑰鹦鹉", "玫瑰鹦鹉"], realm: "飞禽" },
  { id: "honeyeater", keys: ["新荷兰吸蜜鸟", "吸蜜鸟"], realm: "飞禽" },
  { id: "lyrebird", keys: ["华丽琴鸟", "琴鸟"], realm: "飞禽" },
  { id: "kingfisher", keys: ["天蓝翠鸟", "翠鸟"], realm: "飞禽" },
  { id: "seaeagle", keys: ["白腹海雕", "海雕"], realm: "飞禽" },
  { id: "wedgetail", keys: ["楔尾雕"], realm: "飞禽" },
  { id: "bowerbird", keys: ["缎亭鸟"], realm: "飞禽" },
  { id: "spoonbill", keys: ["皇家琵鹭", "琵鹭"], realm: "飞禽" },
  { id: "swan", keys: ["黑天鹅", "天鹅"], realm: "飞禽" },
  { id: "heron", keys: ["白脸鹭"], realm: "飞禽" },
  { id: "egret", name: "鹭", keys: ["鹭"], realm: "飞禽" },
  { id: "duck", name: "鸭", keys: ["鸭"], realm: "飞禽" },
  { id: "fantail", keys: ["棕扇尾鹟", "扇尾鹟"], realm: "飞禽" },
  { id: "bristlebird", keys: ["东部刺莺", "刺莺"], realm: "飞禽" },
  { id: "groundparrot", keys: ["地鹦鹉"], realm: "飞禽" },
  { id: "oystercatcher", keys: ["斑蛎鹬", "蛎鹬"], realm: "飞禽" },
  { id: "owl", keys: ["猛鸮"], realm: "飞禽" },
  { id: "osprey", keys: ["鹗"], realm: "飞禽" },
  { id: "rockwarbler", keys: ["岩莺"], realm: "飞禽" },
  { id: "shorebird", keys: ["迁徙涉禽", "涉禽"], realm: "飞禽" },
  { id: "dolphin", keys: ["宽吻海豚", "海豚"], realm: "水中" },
  { id: "groper", keys: ["东部蓝唇鱼", "蓝唇鱼"], realm: "水中" },
  { id: "seadragon", keys: ["草海龙", "海龙"], realm: "水中" },
  { id: "cuttlefish", keys: ["澳洲巨乌贼", "乌贼"], realm: "水中" },
  { id: "octopus", keys: ["忧郁章鱼", "章鱼"], realm: "水中" },
  { id: "platypus", keys: ["鸭嘴兽"], realm: "水中" },
  { id: "stingray", name: "黄貂鱼", keys: ["黄貂鱼"], realm: "水中" },
  { id: "ray", name: "鳐", keys: ["鳐"], realm: "水中" },
  { id: "seal", name: "海狗", keys: ["海狗"], realm: "水中" },
  { id: "whale", keys: ["座头鲸", "鲸"], realm: "水中" },
  { id: "antechinus", name: "袋鼩", keys: ["小袋鼩", "袋鼩"], realm: "地面", sensitive: true },
  { id: "quoll", name: "袋鼬", keys: ["袋鼬"], realm: "地面", sensitive: true },
  { id: "koala", name: "考拉", keys: ["考拉"], realm: "地面", sensitive: true },
  { id: "wombat", name: "袋熊", keys: ["袋熊"], realm: "地面", sensitive: true },
  { id: "bandicoot", keys: ["长鼻袋狸", "袋狸"], realm: "地面" },
  { id: "echidna", keys: ["短吻针鼹", "针鼹"], realm: "地面" },
  { id: "wallaby", keys: ["沼泽沙袋鼠", "沙袋鼠", "袋鼠"], realm: "地面" },
  { id: "goanna", keys: ["巨蜥"], realm: "地面" },
  { id: "dragon", keys: ["东部水龙", "水龙"], realm: "地面" },
  { id: "flyingfox", keys: ["灰头狐蝠", "狐蝠"], realm: "地面" },
  { id: "glowworm", keys: ["萤火虫"], realm: "地面" }
];

function textHasKey(blob, key) {
  let text = String(blob || "");
  NAMED_ANIMALS.forEach((row) => {
    row.keys.forEach((other) => {
      if (other.length > key.length && other.includes(key)) text = text.split(other).join("");
    });
  });
  return text.includes(key);
}

function siteBlob(site) {
  const bits = [site.summary, site.access, ...(site.dont || [])];
  (site.do || []).forEach((item) => bits.push(item.t, item.when, item.text, item.lens));
  return bits.filter(Boolean).join("\n");
}

function extraAnimals(site, existing) {
  const have = new Set(existing.map((animal) => animal.id));
  const blob = siteBlob(site);
  const added = [];
  NAMED_ANIMALS.forEach((row) => {
    if (have.has(row.id) || added.some((animal) => animal.id === row.id)) return;
    const key = row.keys.find((name) => textHasKey(blob, name));
    if (!key) return;
    if (/企鹅/.test(key) || /企鹅/.test(blob) && key.includes("企鹅")) return;
    const hits = (site.do || []).filter((item) => textHasKey(`${item.t}\n${item.text}\n${item.when}`, key));
    const windows = hits.length
      ? hits.map((item) => ({ months: [], hours: item.when || "未另写", odds: item.odds || "—", note: item.text }))
      : [{ months: [], hours: "未另写", odds: "—", note: (site.dont || []).find((line) => textHasKey(line, key)) || site.summary || key }];
    if (!SPECIES[row.id]) {
      SPECIES[row.id] = { name: row.name || row.keys[0], sci: "", sensitive: !!row.sensitive, realm: row.realm };
    } else if (!SPECIES[row.id].realm) {
      SPECIES[row.id].realm = row.realm;
    }
    added.push({ id: row.id, windows });
  });
  return added;
}

function animalCard(site, animal) {
  const info = SPECIES[animal.id];
  if (!info) return "";
  const photo = (typeof SPECIES_PHOTOS !== "undefined" && SPECIES_PHOTOS[animal.id]) || null;
  const records = (typeof SIGHTINGS !== "undefined" && SIGHTINGS[`${site.id}|${animal.id}`]) || [];
  const windows = animal.windows.map((item) => `<div class="window">
      ${monthTicks(item.months)}
      <p><strong>${esc(item.hours)}</strong> · ${esc(item.odds)}</p>
      <p>${esc(item.note)}</p>
    </div>`).join("");
  const dates = records.map((row) => row.date).filter(Boolean).sort();
  const span = dates.length ? `已保存的日期从 ${esc(dates[0])} 到 ${esc(dates[dates.length - 1])}。` : "";
  const shots = records.length
    ? `<p class="sightlabel">历史记录，不代表当天一定出现。${span}</p><ul class="records">${records.map((row) => {
      const near = row.km != null && row.km <= 8;
      const where = row.km == null ? "" : near ? `公开坐标在大约 ${row.km} km 内` : `最近公开坐标大约在 ${row.km} km 外，不一定是同一小群`;
      return `<li>${esc(row.date)} · ${esc(row.source)}${where ? ` · ${where}` : ""}</li>`;
    }).join("")}</ul>`
    : `<p class="note">这附近没有检索到可用的公开观测。上面的月份和钟点仍是活动规律，不是某一次目击。</p>`;
  const img = photo
    ? `<figure><img src="${esc(photo.thumb)}" alt="${esc(info.name)}" referrerpolicy="no-referrer" loading="lazy"><figcaption>${esc(photo.artist)} · ${esc(photo.license)}。物种照片，拍摄地不一定是这里。</figcaption></figure>`
    : "";
  const guide = info.guide
    ? `<p><strong>样子。</strong>${esc(info.guide.look)}</p><p><strong>一天里。</strong>${esc(info.guide.when)}</p><p><strong>不要惊扰。</strong>${esc(info.guide.rule)}</p>`
    : "";
  const title = site.id === "northhead" && (animal.id === "honeyeater" || animal.id === "wattlebird")
    ? { name: "小垂蜜鸟", sci: "Anthochaera chrysoptera" }
    : { name: info.name, sci: info.sci || "" };
  return `<article class="animal">${img}<div><h3>${esc(title.name)}${title.sci ? ` <em>${esc(title.sci)}</em>` : ""}</h3>
      <p class="note">${esc(animalRealm(animal.id))} · 原词见下面的概率。</p>
      ${guide}
      ${info.sensitive ? `<p class="warnline">受胁或局部濒危。记录只保留日期和大约距离，不在地图上打精确点。</p>` : ""}
      ${windows}${shots}</div></article>`;
}

function animalHtml(site) {
  const base = ((FIELD[site.id] && FIELD[site.id].animals) || []).map((animal) => Object.assign({}, animal, { windows: (animal.windows || []).slice() }));
  let animals = base.concat(extraAnimals(site, base));
  if (site.id === "northhead") {
    const honey = animals.find((animal) => animal.id === "honeyeater");
    const watt = animals.find((animal) => animal.id === "wattlebird");
    if (honey && watt) {
      watt.windows = watt.windows.concat(honey.windows);
      animals = animals.filter((animal) => animal.id !== "honeyeater");
    }
  }
  const order = ["概率高", "概率中", "常驻", "概率低"];
  const realms = ["水中", "地面", "飞禽"];
  const buckets = {};
  animals.forEach((animal) => {
    const tier = animalTier(animal);
    const realm = animalRealm(animal.id);
    if (!buckets[tier]) buckets[tier] = {};
    if (!buckets[tier][realm]) buckets[tier][realm] = [];
    buckets[tier][realm].push(animal);
  });
  const block = (tier) => {
    const bag = buckets[tier] || {};
    const body = realms.map((realm) => {
      const list = bag[realm] || [];
      if (!list.length) return "";
      return `<h5>${realm}</h5>${list.map((animal) => animalCard(site, animal)).join("")}`;
    }).join("");
    if (!body) return "";
    return `<h4>${tier}</h4>${body}`;
  };
  const extra = buckets["未分级"] ? block("未分级") : "";
  return `<section id="seeLife"><h3>能看到什么</h3>
    <p class="note">分档只用记录里的原词。对不上四档的放在未分级。每一档下面再按水中、地面、飞禽。历史记录，不代表当天一定出现。</p>
    ${order.map(block).join("")}${extra}</section>`;
}

function galleryHtml(site) {
  const photos = (typeof PLACE_PHOTOS !== "undefined" && PLACE_PHOTOS[site.id]) || [];
  if (!photos.length) return `<p class="note">这个地点还没有嵌进可引用的照片。</p>`;
  return `<div class="gallery">${photos.map((photo) => `<figure>
    <a href="${esc(photo.page)}" target="_blank" rel="noreferrer"><img src="${esc(photo.thumb)}" alt="${esc(photo.title)}" referrerpolicy="no-referrer" loading="lazy"></a>
    <figcaption>${esc(photo.artist)} · ${esc(photo.license)}</figcaption>
  </figure>`).join("")}</div>`;
}

function userMarkers() {
  return loadJson("caolou-markers", []);
}

function markerListHtml() {
  const marks = userMarkers();
  if (!marks.length) return `<p class="note">还没有自己的标记。选一种，写个名字，再点「在地图上落下」。</p>`;
  return `<ul class="marks">${marks.map((mark) => `<li><strong>${MARK_LABEL[mark.kind] || "标记"}</strong> ${esc(mark.name)}
    <button type="button" data-act="delmark" data-id="${mark.id}">删除</button></li>`).join("")}</ul>`;
}

function plannerDetail(site) {
  return `${galleryHtml(site)}
    ${safetyHtml(site)}
    <section><h3>时间和热量</h3><div id="kcalOut">${effortHtml(site)}</div></section>
    ${animalHtml(site)}
    ${packPanelHtml(site)}`;
}

function mapToolsHtml() {
  return `<div class="maptools" id="maptools">
    <p class="note">标记落在你正在看的这块地图上。</p>
    <label>标记 <select id="markKind">
      <option value="spot">机位</option>
      <option value="seen">目击</option>
      <option value="danger">危险</option>
      <option value="park">停车</option>
      <option value="water">补给</option>
    </select></label>
    <input id="markName" placeholder="名称，例如琴鸟坡">
    <button type="button" data-act="arm">在地图上落下</button>
    <p id="routeStat"></p>
    <div id="markList">${markerListHtml()}</div>
  </div>`;
}

function setBase(name) {
  if (!map || !TILES[name]) return;
  if (tileLayer) map.removeLayer(tileLayer);
  const spec = TILES[name];
  tileLayer = L.tileLayer(spec.url, { attribution: spec.attr, maxZoom: spec.max });
  tileLayer.addTo(map);
  tileLayer.bringToBack();
  localStorage.setItem("caolou-layer", name);
  document.querySelectorAll("[data-layer]").forEach((button) => button.classList.toggle("on", button.dataset.layer === name));
}

function drawUserMarkers() {
  if (!markerLayer) markerLayer = L.layerGroup().addTo(map);
  markerLayer.clearLayers();
  userMarkers().forEach((mark) => {
    const icon = L.divIcon({
      className: "pinwrap",
      html: `<span class="dot ${mark.kind}"></span>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });
    L.marker([mark.lat, mark.lng], { icon, zIndexOffset: 500 })
      .bindTooltip(`${MARK_LABEL[mark.kind] || ""} ${mark.name}`, { direction: "top" })
      .addTo(markerLayer);
  });
  if (typeof modeShows === "function" && !modeShows("marks")) {
    if (map.hasLayer(markerLayer)) map.removeLayer(markerLayer);
  } else if (!map.hasLayer(markerLayer)) {
    markerLayer.addTo(map);
  }
  const list = document.getElementById("markList");
  if (list) list.innerHTML = markerListHtml();
}

function rememberMarker(latlng) {
  const kind = document.getElementById("markKind").value;
  const name = (document.getElementById("markName").value || MARK_LABEL[kind]).trim();
  const marks = userMarkers();
  marks.push({ id: String(Date.now()), lat: latlng.lat, lng: latlng.lng, kind, name });
  saveJson("caolou-markers", marks);
  drawUserMarkers();
}

function drawRoute(saved) {
  if (routeLine) map.removeLayer(routeLine);
  routeLine = L.geoJSON({ type: "Feature", geometry: saved.geometry, properties: {} }, {
    style: { color: "#9d3b22", weight: 5, opacity: 0.9 }
  }).addTo(map);
  const stat = document.getElementById("routeStat");
  if (stat) stat.textContent = `${saved.label} ${saved.km} km · 大约 ${saved.minutes} 分钟。这条线记在浏览器里，刷新还在。`;
  if (saved.geometry && saved.geometry.coordinates) {
    const bounds = L.latLngBounds(saved.geometry.coordinates.map((pair) => [pair[1], pair[0]]));
    map.fitBounds(bounds, { padding: [24, 24] });
  }
}

function stopFollow() {
  if (followId != null && navigator.geolocation) navigator.geolocation.clearWatch(followId);
  followId = null;
}

async function planRoute(profile, origin) {
  return;
  const site = SITES.find((item) => item.id === activeId);
  const stat = document.getElementById("routeStat");
  if (!site) {
    if (stat) stat.textContent = "先在右边选一个地点，再规划到那里的路。";
    return;
  }
  if (stat) stat.textContent = "正在算路…";
  const mode = profile === "foot" ? "foot" : "driving";
  const url = `https://router.project-osrm.org/route/v1/${mode}/${origin.lng},${origin.lat};${site.lng},${site.lat}?overview=full&geometries=geojson`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    const route = data.routes && data.routes[0];
    if (!route) throw new Error(data.message || "no route");
    const saved = {
      destId: site.id,
      profile: mode,
      label: `${origin.name} → ${site.name} · ${mode === "foot" ? "步行" : "开车"}`,
      km: (route.distance / 1000).toFixed(1),
      minutes: Math.round(route.duration / 60),
      geometry: route.geometry,
      dest: { lat: site.lat, lng: site.lng }
    };
    saveJson("caolou-route", saved);
    drawRoute(saved);
    const kcal = document.getElementById("kcalOut");
    if (kcal) kcal.innerHTML = effortHtml(site);
  } catch (error) {
    if (stat) stat.textContent = "路网没有返回。可以改用卫星看地形，或先按页面上的开车分钟出发。";
  }
}

function locateAndRoute(profile) {
  const stat = document.getElementById("routeStat");
  if (!navigator.geolocation) {
    if (stat) stat.textContent = "这台浏览器没有定位。";
    return;
  }
  if (stat) stat.textContent = "在要当前位置…";
  navigator.geolocation.getCurrentPosition((pos) => {
    const here = { lat: pos.coords.latitude, lng: pos.coords.longitude, name: "我的位置" };
    if (userDot) map.removeLayer(userDot);
    userDot = L.circleMarker([here.lat, here.lng], { radius: 7, color: "#17241f", fillColor: "#e0a24a", fillOpacity: 1 }).addTo(map);
    planRoute(profile, here);
  }, () => {
    if (stat) stat.textContent = "没有拿到定位。可以改从草楼规划，或在系统里允许这个页面使用位置。";
  }, { enableHighAccuracy: true, timeout: 12000 });
}

function startFollow() {
  const saved = loadJson("caolou-route", null);
  const stat = document.getElementById("routeStat");
  if (!saved || !saved.dest) {
    if (stat) stat.textContent = "先规划一条路线，再跟着走。";
    return;
  }
  if (followId != null) {
    stopFollow();
    if (stat) stat.textContent = "已停止跟随。";
    return;
  }
  if (!navigator.geolocation) return;
  const dest = saved.dest;
  followId = navigator.geolocation.watchPosition((pos) => {
    const here = [pos.coords.latitude, pos.coords.longitude];
    if (userDot) map.removeLayer(userDot);
    userDot = L.circleMarker(here, { radius: 7, color: "#17241f", fillColor: "#e0a24a", fillOpacity: 1 }).addTo(map);
    const meters = map.distance(here, [dest.lat, dest.lng]);
    if (stat) stat.textContent = `距终点直线还有 ${(meters / 1000).toFixed(1)} km。路线不会每秒重算，偏了就再点一次规划。`;
    map.panTo(here, { animate: true });
  }, () => {
    if (stat) stat.textContent = "跟随中断，定位没有继续更新。";
  }, { enableHighAccuracy: true, maximumAge: 5000 });
}

function initFieldMap() {
  localStorage.removeItem("caolou-route");
  setBase(localStorage.getItem("caolou-layer") || "street");
  drawUserMarkers();
  map.on("click", (event) => {
    if (!armed) return;
    armed = false;
    map.getContainer().style.cursor = "";
    rememberMarker(event.latlng);
  });
}

function mountMapTools() {
  const stage = document.querySelector(".mapstage");
  if (!stage || document.getElementById("maptools")) return;
  stage.insertAdjacentHTML("beforeend", mapToolsHtml());
}

document.addEventListener("click", (event) => {
  const act = event.target.closest("[data-act]");
  if (!act) return;
  if (act.dataset.act === "layer") setBase(act.dataset.layer);
  if (act.dataset.act === "toggle") {
    const flags = packFlags();
    const id = act.dataset.id;
    flags[id] = !flags[id];
    settleBags(flags, id);
    saveFlags(flags);
    refreshPack();
    if (typeof view !== "undefined" && view === "field") drawHike();
  }
  if (act.dataset.act === "suggest") applySuggestion(act.dataset.id);
  if (act.dataset.act === "scheme") applyScheme(act.dataset.kind);
  if (act.dataset.act === "route") planRoute(act.dataset.profile, { lat: HOME.lat, lng: HOME.lng, name: "草楼" });
  if (act.dataset.act === "gps") locateAndRoute(act.dataset.profile || "driving");
  if (act.dataset.act === "follow") startFollow();
  if (act.dataset.act === "clearroute") {
    if (routeLine) map.removeLayer(routeLine);
    routeLine = null;
    localStorage.removeItem("caolou-route");
    stopFollow();
    const stat = document.getElementById("routeStat");
    if (stat) stat.textContent = "路线已清掉。";
  }
  if (act.dataset.act === "arm") {
    armed = true;
    if (map) map.getContainer().style.cursor = "crosshair";
    const stat = document.getElementById("routeStat");
    if (stat) stat.textContent = "在地图上点一下，落下这个标记。";
  }
  if (act.dataset.act === "bought") {
    const bag = boughtMap();
    bag[act.dataset.id] = !bag[act.dataset.id];
    saveJson("caolou-bought", bag);
    refreshPack();
  }
  if (act.dataset.act === "delmark") {
    saveJson("caolou-markers", userMarkers().filter((mark) => mark.id !== act.dataset.id));
    drawUserMarkers();
  }
});

document.addEventListener("change", (event) => {
  const pack = event.target.closest("[data-pack]");
  if (pack) {
    const flags = packFlags();
    flags[pack.dataset.pack] = pack.checked;
    settleBags(flags, pack.dataset.pack);
    saveFlags(flags);
    refreshPack();
    if (typeof drawHike === "function" && typeof view !== "undefined" && view === "field") drawHike();
  }
  const edit = event.target.closest("[data-edit]");
  if (edit) {
    const all = loadJson("caolou-pack-edit", {});
    all[edit.dataset.id] = all[edit.dataset.id] || {};
    all[edit.dataset.id][edit.dataset.edit] = Number(edit.value);
    saveJson("caolou-pack-edit", all);
    const site = activeId ? SITES.find((item) => item.id === activeId) : null;
    const totals = document.getElementById("packTotals");
    if (totals) totals.innerHTML = totalsHtml();
    const kcal = document.getElementById("kcalOut");
    if (kcal && site) kcal.outerHTML = effortHtml(site);
    const bars = document.getElementById("packBars");
    if (bars && site) bars.innerHTML = barsHtml(site);
    const grid = document.getElementById("packGrid");
    if (grid) grid.innerHTML = gridHtml();
  }
});

document.addEventListener("input", (event) => {
  const plan = event.target.closest("[data-plan]");
  if (plan && activeId) {
    const all = loadJson("caolou-dayplan", {});
    const row = Object.assign({ depart: "", stay: "", back: "" }, all[activeId] || {});
    row[plan.dataset.plan] = plan.value;
    all[activeId] = row;
    saveJson("caolou-dayplan", all);
    const math = document.getElementById("dayMath");
    const site = SITES.find((item) => item.id === activeId);
    if (math && site) math.innerHTML = dayMathHtml(site);
    return;
  }
  if (event.target.id !== "gearSearch") return;
  gearQuery = event.target.value;
  const lists = document.getElementById("gearLists");
  const site = activeId ? SITES.find((item) => item.id === activeId) : null;
  if (lists && site) lists.innerHTML = gearListsHtml(site);
});
