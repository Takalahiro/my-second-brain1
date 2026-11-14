const PERMIT_DAY = "2026-11-13";
const PERMIT_NONE = "未打开写明这五项的 NPWS 或 environment.nsw.gov.au 页面";

const PERMIT_URL = {
  royal: "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/royal-national-park",
  heathcote: "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/heathcote-national-park",
  kuringgai: "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/ku-ring-gai-chase-national-park",
  blue: "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/blue-mountains-national-park",
  bouddi: "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/bouddi-national-park",
  minnamurra: "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/budderoo-national-park",
  barren: "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/barren-grounds-nature-reserve",
  malabar: "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/malabar-headland-national-park",
  dharawal: "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/dharawal-national-park",
  macpass: "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/macquarie-pass-national-park",
  seven: "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/seven-mile-beach-national-park",
  cattai: "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/cattai-national-park",
  bents: "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/bents-basin-state-conservation-area",
  thirlmere: "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/thirlmere-lakes-national-park",
  scheyville: "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/scheyville-national-park",
  muogamarra: "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/muogamarra-nature-reserve",
  crosslands: "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/berowra-valley-national-park",
  pitttown: "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/pitt-town-nature-reserve",
  wiana: "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/wianamatta-nature-reserve",
  popran: "https://www.environment.nsw.gov.au/sites/default/files/popran-national-park-plan-of-management-000097.pdf",
  nattai: "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/nattai-national-park",
  solitary: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/mount-solitary-walking-track",
  nadgee: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/nadgee-wilderness-walk/visitor-info",
  mainrange: "https://www.nationalparks.nsw.gov.au/safety/alpine-safety/kosciuszko-back-country-camping",
  lanecove: "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/lane-cove-national-park",
  dharug: "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/dharug-national-park",
  wyrrabalong: "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/wyrrabalong-national-park",
  munmorah: "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/munmorah-state-conservation-area",
  wallumatta: "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/wallumatta-nature-reserve",
  dalrymple: "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/dalrymple-hay-nature-reserve",
  newington: "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/newington-nature-reserve",
  yellomundee: "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/yellomundee-regional-park",
  williamhowe: "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/william-howe-regional-park",
  windsordowns: "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/windsor-downs-nature-reserve",
  gulguer: "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/gulguer-nature-reserve",
  euroka: "https://www.nationalparks.nsw.gov.au/camping-and-accommodation/campgrounds/euroka-campground",
  prospect: "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/prospect-nature-reserve",
  agnesbanks: "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/agnes-banks-nature-reserve",
  castlereagh: "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/castlereagh-nature-reserve",
  mulgoa: "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/mulgoa-nature-reserve",
  lionisland: "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/lion-island-nature-reserve"
};

function permitSame(url, note) {
  return { url, note };
}

const PERMIT_SEEN = {
  jibbon: permitSame(PERMIT_URL.royal, "打开的是 Royal National Park 页，没有点名这一处的五项许可"),
  otford: permitSame(PERMIT_URL.royal, "打开的是 Royal National Park 页，没有点名这一处的五项许可"),
  curracurrang: permitSame(PERMIT_URL.royal, "打开的是 Royal National Park 页，没有点名这一处的五项许可"),
  karloo: permitSame(PERMIT_URL.royal, "打开的是 Royal National Park 页，没有点名这一处的五项许可"),
  sassafras: permitSame(PERMIT_URL.blue, "打开的是 Blue Mountains National Park 页，没有点名这一处的五项许可"),
  victory: permitSame(PERMIT_URL.blue, "打开的是 Blue Mountains National Park 页，没有点名这一处的五项许可"),
  walls: permitSame(PERMIT_URL.blue, "打开的是 Blue Mountains National Park 页，没有点名这一处的五项许可"),
  mtwilson: permitSame(PERMIT_URL.blue, "打开的是 Blue Mountains National Park 页，没有点名这一处的五项许可"),
  grose: permitSame(PERMIT_URL.blue, "打开的是 Blue Mountains National Park 页，没有点名 Grose Wilderness 的五项许可"),
  southbm: permitSame(PERMIT_URL.blue, "打开的是 Blue Mountains National Park 页，没有点名这一处的五项许可"),
  resolute: permitSame(PERMIT_URL.kuringgai, "页面写了 West Head 大门时间，没有点名 Resolute Beach 的五项许可"),
  jerusalem: permitSame(PERMIT_URL.kuringgai, "打开的是 Ku-ring-gai Chase National Park 页，没有点名 Jerusalem Bay 的五项许可"),
  northhead: permitSame("https://www.nationalparks.nsw.gov.au/visit-a-park/parks/sydney-harbour-national-park", "页面写了 North Head 的车辆费，没有写这五项许可"),
  clifton: permitSame("https://www.nationalparks.nsw.gov.au/visit-a-park/parks/sydney-harbour-national-park", "打开的是 Sydney Harbour National Park 页，没有点名这一处的五项许可"),
  grotto: permitSame("https://www.nationalparks.nsw.gov.au/visit-a-park/parks/sydney-harbour-national-park", "打开的是 Sydney Harbour National Park 页，没有点名这一处的五项许可"),
  solander: permitSame("https://www.nationalparks.nsw.gov.au/visit-a-park/parks/kamay-botany-bay-national-park", "打开了 Kamay Botany Bay National Park 页，没有读到这五项许可"),
  capebanks: permitSame("https://www.nationalparks.nsw.gov.au/visit-a-park/parks/kamay-botany-bay-national-park", "打开了 Kamay Botany Bay National Park 页，没有读到这五项许可"),
  bare: permitSame("https://www.nationalparks.nsw.gov.au/visit-a-park/parks/kamay-botany-bay-national-park", "打开了 Kamay Botany Bay National Park 页，没有读到这五项许可"),
  inscript: permitSame("https://www.nationalparks.nsw.gov.au/visit-a-park/parks/kamay-botany-bay-national-park", "打开了 Kamay Botany Bay National Park 页，没有读到这五项许可"),
  deepcreek: permitSame("https://www.nationalparks.nsw.gov.au/visit-a-park/parks/garigal-national-park", "打开的是 Garigal National Park 页，没有点名 Deep Creek 的五项许可"),
  irrawong: permitSame("https://www.nationalparks.nsw.gov.au/visit-a-park/parks/garigal-national-park", "打开的是 Garigal National Park 页，没有点名 Irrawong 的五项许可"),
  yeramba: permitSame("https://www.nationalparks.nsw.gov.au/visit-a-park/parks/georges-river-national-park", "打开的是 Georges River National Park 页，没有点名 Yeramba Lagoon 的五项许可"),
  warrah: permitSame("https://www.nationalparks.nsw.gov.au/visit-a-park/parks/brisbane-water-national-park", "打开了 Brisbane Water National Park 页，没有读到这五项许可"),
  putty: permitSame(PERMIT_URL.bouddi, "打开的是 Bouddi National Park 页，没有把 Putty Beach 写成这五项许可"),
  carrington: permitSame(PERMIT_URL.minnamurra, "打开的是 Budderoo National Park 页，没有把 Carrington Falls 写成这五项许可"),
  belmore: permitSame(PERMIT_URL.minnamurra, "打开的是 Budderoo National Park 页，没有把 Belmore Falls 写成这五项许可"),
  jagungal: permitSame(PERMIT_URL.mainrange, "离开步道那句只写了 Kosciuszko Main Range，不套到这里"),
  schlink: permitSame(PERMIT_URL.mainrange, "离开步道那句只写了 Kosciuszko Main Range，不套到这里"),
  pilot: permitSame(PERMIT_URL.mainrange, "离开步道那句只写了 Kosciuszko Main Range，不套到这里"),
  marramarra: permitSame("https://www.nationalparks.nsw.gov.au/visit-a-park/parks/marramarra-national-park", "打开的是 Marramarra National Park 页，没有点名 Marramarra Ridge 或 Smugglers Ridge")
};

function permitLine(text, source, scope, valid, state) {
  return { text, source, scope, checked: PERMIT_DAY, valid, state };
}

function permitBlank(scope, source, valid) {
  const row = permitLine("待核实", source || PERMIT_NONE, scope, valid || "页面未写", "待核实");
  return { enter: row, off: row, camp: row, book: row, style: row };
}

function permitYes(text, source, scope, valid) {
  return permitLine(text, source, scope, valid || "页面未写废止日", "已确认");
}

function permitOpen(text, id, scope) {
  return permitYes(text, PERMIT_URL[id], scope || id);
}

const PERMIT_PATCH = {
  royal: {
    enter: permitOpen("Royal National Park is open 7am to 8.30pm but may have to close at times due to poor weather or fire danger.", "royal", "Royal National Park。不是园内某一处步道。")
  },
  heathcote: {
    enter: permitOpen("Heathcote National Park is open sunrise to sunset but may have to close at times due to poor weather or fire danger.", "heathcote", "Heathcote National Park"),
    camp: permitYes("Seasoned bushwalkers will enjoy excellent walking tracks, as well as bush camping at Kingfisher Pool.", PERMIT_URL.heathcote, "Kingfisher Pool。不是整座公园，也不是分散扎营。", "页面未写废止日")
  },
  kuringgai: {
    enter: permitOpen("Ku-ring-gai Chase National Park is always open but may have to close at times due to poor weather or fire danger.", "kuringgai", "Ku-ring-gai Chase National Park。不是 West Head 的大门时间。"),
    book: permitYes("Under the Plan of Management for this park, prior written approval is required for organised groups of 40 or more people planning to visit this park.", PERMIT_URL.kuringgai, "40 人及以上的团体。不是独自进入。", "页面未写废止日")
  },
  blue: {
    enter: permitOpen("Blue Mountains National Park is always open but may have to close at times due to poor weather or fire danger.", "blue", "Blue Mountains National Park。不是园内某一条步道。")
  },
  bouddi: {
    enter: permitOpen("Bouddi National Park is always open but may have to close at times due to poor weather or fire danger.", "bouddi", "Bouddi National Park。不是 Putty Beach。")
  },
  minnamurra: {
    enter: permitYes("The park gates at Minnamurra Rainforest Centre open at 9am and close at 5pm every day.", PERMIT_URL.minnamurra, "Minnamurra Rainforest Centre 的大门。不是整座 Budderoo。", "页面未写废止日")
  },
  barren: {
    enter: permitOpen("Barren Grounds Nature Reserve is always open but may have to close at times due to poor weather or fire danger.", "barren", "Barren Grounds Nature Reserve")
  },
  malabar: {
    enter: permitYes("The western section of the park is open year-round. The eastern section is closed when ANZAC Rifle Range is in use so check safety messages and alerts before visiting. Closed every Saturday and every 1st and 3rd Sunday of the month. Western section: Open all year but may close at times due to poor weather or fire danger.", PERMIT_URL.malabar, "Malabar Headland National Park 的东、西两段。不是整座涂成可进入。", "页面未写废止日")
  },
  dharawal: {
    enter: permitOpen("Dharawal National Park is always open but may have to close at times due to poor weather or fire danger.", "dharawal", "Dharawal National Park")
  },
  macpass: {
    enter: permitOpen("Macquarie Pass National Park is always open but may have to close at times due to poor weather or fire danger.", "macpass", "Macquarie Pass National Park")
  },
  seven: {
    enter: permitOpen("Seven Mile Beach National Park is always open but may have to close at times due to poor weather or fire danger.", "seven", "Seven Mile Beach National Park")
  },
  cattai: {
    enter: permitOpen("Cattai National Park is open 8am to 6pm from May to August and 8am to 8pm from September to April.", "cattai", "Cattai National Park")
  },
  bents: {
    enter: permitOpen("Bents Basin State Conservation Area is open 8am to 6pm from May to August and 8am to 8pm from September to April.", "bents", "Bents Basin State Conservation Area")
  },
  thirlmere: {
    enter: permitYes("Thirmere Lakes is open from from 5.30am to 8pm during daylight savings and 5.30am to 6pm rest of year.", PERMIT_URL.thirlmere, "页面原文如此拼写。范围是这一页写的湖泊开放时间。", "页面未写废止日")
  },
  scheyville: {
    enter: permitOpen("Scheyville National Park is open 8am to 6pm from May to August and 8am to 8pm from September to April.", "scheyville", "Scheyville National Park")
  },
  muogamarra: {
    enter: permitYes("Muogamarra Nature Reserve is open to the public from 9am to 4.30pm for 6 weeks around August and September each year. The reserve is closed to the public at other times to protect sensitive natural and cultural heritage values.", PERMIT_URL.muogamarra, "Muogamarra Nature Reserve", "页面未写哪 6 周的起止日"),
    book: permitYes("To visit Muogamarra Nature Reserve, book in advance to join a guided tour and discover the secrets of this special place from our volunteer guides.", PERMIT_URL.muogamarra, "Muogamarra Nature Reserve 的参观", "页面未写废止日")
  },
  crosslands: {
    enter: permitYes("Crosslands Reserve is open 8am to 7.30pm during daylight savings and 9am to 5pm the rest of the year", PERMIT_URL.crosslands, "Crosslands Reserve。不是整座 Berowra Valley National Park。", "页面未写废止日")
  },
  popran: {
    enter: permitYes("Public access is currently available: to the Mt Olive section of the park from the end of Ironbark Road and from Berecry Road; to the Bedlam Creek section of the park from the Wisemans Ferry Road; to the Calga section of the park from the Old Pacific Highway; and to the Mt White section of the park from the end of Morgans Road. There is no public access available to the Mangrove Mountain section of the park as it is surrounded by private property.", PERMIT_URL.popran, "2000 年 Popran 计划点名的分区。不是现行告示，也不是坐标。", "计划写 2000-08-14 采纳，页面未写废止日"),
    camp: permitYes("Bush camping will be permitted away from roads, provided such camping is in accordance with minimal impact camping practices (including use of fuel stoves only) and in accordance with a camping permit issued by the Service.", PERMIT_URL.popran, "2000 年计划里的灌丛扎营条件。不是免费扎营，也没有多边形。", "计划写 2000-08-14 采纳，页面未写废止日"),
    book: permitYes("Bush camping will be permitted away from roads, provided such camping is in accordance with minimal impact camping practices (including use of fuel stoves only) and in accordance with a camping permit issued by the Service.", PERMIT_URL.popran, "2000 年计划写扎营要 Service 发的许可。不是已经拿到的许可。", "计划写 2000-08-14 采纳，页面未写废止日")
  },
  nattai: {
    enter: permitOpen("Nattai National Park is always open but may have to close at times due to poor weather or fire danger.", "nattai", "Nattai National Park。页面没有划出可以进入的范围。")
  },
  nadgee: {
    book: permitYes("Walkers staying overnight require a permit.", PERMIT_URL.nadgee, "Nadgee wilderness walk 的过夜。不是已经批准，也不是免费扎营。", "页面未写废止日")
  },
  mainrange: {
    off: permitYes("Off track walking is permitted on the Kosciuszko Main range, however we ask you follow a few rules to prevent damage: Always use hardened track surfaces where available Please spread out when there are eroded foot pads or no constructed tracks.", PERMIT_URL.mainrange, "Kosciuszko Main Range。不套到 Jagungal、Schlink 或 Pilot。", "页面未写废止日"),
    book: permitYes("Filling in a trip intention form is highly recommended for remote travel or backpack camping in all NSW national parks. Filling in a trip intention form is not a campsite booking.", PERMIT_URL.mainrange, "这一页写的远程或背包扎营。表格不是营地预订，也不是进入许可。", "页面未写废止日")
  },
  lanecove: {
    enter: permitOpen("Lane Cove National Park is open 9am to 7pm during daylight savings (until 6pm at other times).", "lanecove", "Lane Cove National Park"),
    camp: permitYes("If you’d like to stay overnight in the park, head to Lane Cove Holiday Park and book a campsite or cabin.", PERMIT_URL.lanecove, "Lane Cove Holiday Park。不是公园里自由选址。", "页面未写废止日"),
    book: permitYes("Under the National Parks and Wildlife Regulation 2019, prior written approval is required for organised groups of 30 or more people planning to visit the park.", PERMIT_URL.lanecove, "30 人及以上的团体。不是独自进入。", "页面未写废止日")
  },
  dharug: {
    enter: permitOpen("Dharug National Park is always open but may have to close at times due to poor weather or fire danger.", "dharug", "Dharug National Park")
  },
  wyrrabalong: {
    enter: permitOpen("Wyrrabalong National Park is open from 5.30am to 8pm during daylight saving and 5.30am to 6pm rest of year.", "wyrrabalong", "Wyrrabalong National Park")
  },
  munmorah: {
    enter: permitYes("Spring/summer open hours Munmorah State Conservation Area is open 5.30am–9pm, from the start of the NSW school holiday period in September (Friday) until 1 May. Autumn/winter open hours Munmorah State Conservation Area is open 5.30am–7pm, from 1 May until the day before the start of the NSW September school holidays (Friday).", PERMIT_URL.munmorah, "Munmorah State Conservation Area 的开放时间", "页面未写废止日")
  },
  wallumatta: {
    enter: permitOpen("Wallumatta Nature Reserve is open sunrise to sunset but may have to close at times due to poor weather or fire danger.", "wallumatta", "Wallumatta Nature Reserve")
  },
  dalrymple: {
    enter: permitOpen("Dalrymple-Hay Nature Reserve is open sunrise to sunset but may have to close at times due to poor weather or fire danger.", "dalrymple", "Dalrymple-Hay Nature Reserve")
  },
  yellomundee: {
    enter: permitOpen("Yellomundee Regional Park is always open but may have to close at times due to poor weather or fire danger.", "yellomundee", "Yellomundee Regional Park")
  },
  williamhowe: {
    enter: permitOpen("William Howe Regional Park is always open but may have to close at times due to poor weather or fire danger.", "williamhowe", "William Howe Regional Park")
  },
  gulguer: {
    enter: permitYes("You can only access this park on foot. Entry to the park is via a very steep fire trail. Gulguer Nature Reserve is open 8am to 6pm from May to August, and 8am to 8pm from September to April.", PERMIT_URL.gulguer, "Gulguer Nature Reserve。火道很陡，不是入口坐标。", "页面未写废止日")
  },
  euroka: {
    enter: permitYes("From the first Sunday in October to the first Sunday in April: park gates are open 8.30am to 7pm. Rest of the year: park gates are open 8.30am to 6pm.", PERMIT_URL.euroka, "页面写的 Glenbrook 大门时间。不是 Euroka 的坐标。", "页面未写废止日"),
    camp: permitYes("There are 5 camping areas within Euroka: Appletree Flat, Bennett Ridge, Darug, Nioka and Red Gum.", PERMIT_URL.euroka, "Euroka 页点名的 5 个营地区。不是蓝山自由选址。", "页面未写废止日"),
    book: permitYes("Book up to 20 people or 5 sites online.", PERMIT_URL.euroka, "Euroka campground 的网上预订。不是已经订到的场地。", "页面未写废止日")
  },
  prospect: {
    enter: permitYes("Prospect Nature Reserve is closed to the public as it's part of a Special Water catchment area.", PERMIT_URL.prospect, "Prospect Nature Reserve。关闭不是可以进入。", "页面未写废止日")
  }
};

function permitRecord(id, name) {
  const seen = PERMIT_SEEN[id];
  const url = (seen && seen.url) || PERMIT_URL[id] || "";
  const valid = (seen && seen.note) || (url ? "这页没有把这一项写成许可" : "未打开");
  const base = permitBlank(name, url, valid);
  const patch = PERMIT_PATCH[id] || {};
  return {
    enter: patch.enter || base.enter,
    off: patch.off || base.off,
    camp: patch.camp || base.camp,
    book: patch.book || base.book,
    style: patch.style || base.style
  };
}

function permitFactHtml(label, row) {
  const source = /^https?:/.test(row.source)
    ? `<a href="${esc(row.source)}" target="_blank" rel="noreferrer">${esc(row.source)}</a>`
    : esc(row.source);
  return `<div class="fact" data-permit-state="${esc(row.state)}"><p><strong>${esc(label)}。</strong>${esc(row.text)}</p><p class="factmeta">${source}｜${esc(row.scope)}｜${esc(row.checked)}｜${esc(row.valid)}｜${esc(row.state)}</p></div>`;
}

function permitBlock(id, name) {
  const rows = permitRecord(id, name);
  return `<section class="permit-lines" data-permit-place="${esc(id)}">
    <h3>许可</h3>
    <p class="note">五项分开记。页面没写的就是待核实。步道页不是过夜许可。不知道不等于允许。不涂绿，没有边界就不画。</p>
    ${permitFactHtml("允许进入", rows.enter)}
    ${permitFactHtml("允许离开步道", rows.off)}
    ${permitFactHtml("允许扎营", rows.camp)}
    ${permitFactHtml("是否需要许可或预约", rows.book)}
    ${permitFactHtml("可以独自徒步 / 必须在营地扎营 / 可以自由选址", rows.style)}
  </section>`;
}

function permitAddPlace(area) {
  if (typeof BRIEF_PLACES !== "undefined" && !BRIEF_PLACES.some((item) => item.id === area.id)) BRIEF_PLACES.push(area);
  if (typeof CAMP_AREAS !== "undefined" && !CAMP_AREAS.some((item) => item.id === area.id)) CAMP_AREAS.push(area);
}

[
  ["lanecove", "Lane Cove National Park", "官方页标题就是这个名字。离悉尼市区近，现有地点里没有这一座。不是推荐路线。"],
  ["dharug", "Dharug National Park", "官方页标题就是这个名字。在霍克斯伯里一带，现有地点里没有这一座。不是推荐路线。"],
  ["wyrrabalong", "Wyrrabalong National Park", "官方页标题就是这个名字。中央海岸，现有地点里没有这一座。不是推荐路线。"],
  ["munmorah", "Munmorah State Conservation Area", "官方页标题就是这个名字。现有地点里没有这一块。不是推荐路线。"],
  ["wallumatta", "Wallumatta Nature Reserve", "官方页写在 Ryde 附近。现有地点里没有这一块。不是推荐路线。"],
  ["dalrymple", "Dalrymple-Hay Nature Reserve", "官方页写在 North Sydney，有 Browns Forest loop trail 这个名字。不是推荐路线。"],
  ["newington", "Newington Nature Reserve", "官方页标题就是这个名字。页面让人向 Sydney Olympic Park Authority 问游览。不是推荐路线。"],
  ["yellomundee", "Yellomundee Regional Park", "官方页标题就是这个名字。现有地点里没有这一块。不是推荐路线。"],
  ["williamhowe", "William Howe Regional Park", "官方页标题就是这个名字，并写了 Loop trail。不是推荐路线。"],
  ["windsordowns", "Windsor Downs Nature Reserve", "官方页标题就是这个名字。现有地点里没有这一块。不是推荐路线。"],
  ["gulguer", "Gulguer Nature Reserve", "官方页写只能步行进入，火道很陡。不是推荐路线，也没有入口坐标。"],
  ["euroka", "Euroka campground", "官方营地页，点名 Appletree Flat、Bennett Ridge、Darug、Nioka、Red Gum。不是蓝山公园中心。不是推荐路线。"],
  ["prospect", "Prospect Nature Reserve", "官方页写因特别集水区对公众关闭。不是推荐路线。"],
  ["agnesbanks", "Agnes Banks Nature Reserve", "官方页标题就是这个名字。页面没有写五项许可。不是推荐路线。"],
  ["castlereagh", "Castlereagh Nature Reserve", "官方页标题就是这个名字。页面没有写五项许可。不是推荐路线。"],
  ["mulgoa", "Mulgoa Nature Reserve", "官方页标题就是这个名字。页面没有写五项许可。不是推荐路线。"],
  ["lionisland", "Lion Island Nature Reserve", "官方页标题就是这个名字。页面没有写进入或扎营。不造入口。不是推荐路线。"]
].forEach((row) => {
  const patch = PERMIT_PATCH[row[0]] || {};
  permitAddPlace({
    id: row[0],
    name: row[1],
    kind: "brief",
    brief: true,
    status: "候选",
    why: row[2],
    source: PERMIT_URL[row[0]],
    checked: PERMIT_DAY,
    enter: patch.enter ? patch.enter.text : "待核实",
    transit: "待核实",
    camp: patch.camp ? patch.camp.text : "待核实"
  });
});

function permitPlaces() {
  const rows = [];
  const seen = new Set();
  const add = (id, name) => {
    if (!id || seen.has(id)) return;
    seen.add(id);
    rows.push({ id, name: name || id, lines: permitRecord(id, name || id) });
  };
  if (typeof SITES !== "undefined") SITES.forEach((site) => add(site.id, site.name));
  if (typeof CAMP_AREAS !== "undefined") CAMP_AREAS.forEach((area) => add(area.id, area.name));
  add("blackheath-station", "Blackheath Station");
  add("lithgow-station", "Lithgow Station");
  return rows;
}

function permitCensus() {
  const rows = permitPlaces();
  let confirmed = 0;
  let pending = 0;
  const hits = [];
  rows.forEach((row) => {
    const states = ["enter", "off", "camp", "book", "style"].map((key) => row.lines[key].state);
    if (states.every((state) => state === "已确认")) confirmed += 1;
    else pending += 1;
    ["enter", "off", "camp", "book", "style"].forEach((key) => {
      if (row.lines[key].state === "已确认") {
        hits.push({ id: row.id, name: row.name, key, text: row.lines[key].text, source: row.lines[key].source });
      }
    });
  });
  return { total: rows.length, confirmed, pending, hits };
}

if (typeof detailHtml === "function") {
  const permitDetail = detailHtml;
  detailHtml = function permitDetailWrapped(site) {
    return permitDetail(site) + permitBlock(site.id, site.name);
  };
}

if (typeof campRouteHtml === "function") {
  const permitRoute = campRouteHtml;
  campRouteHtml = function permitRouteWrapped(id) {
    const area = typeof campArea === "function" ? campArea(id) : { name: id };
    return permitRoute(id) + permitBlock(id, area.name);
  };
}

if (typeof campListHtml === "function") {
  const permitList = campListHtml;
  campListHtml = function permitListWrapped() {
    const html = permitList();
    const extra = permitBlock("blackheath-station", "Blackheath Station") + permitBlock("lithgow-station", "Lithgow Station");
    return html.replace('<div class="camp-detail">', `<div class="camp-detail">${extra}`);
  };
}

if (typeof renderPrep === "function") {
  const permitPrep = renderPrep;
  renderPrep = function permitPrepWrapped() {
    const result = permitPrep.apply(this, arguments);
    const root = document.querySelector("#view .prep");
    if (root && typeof activeId === "string" && activeId && !root.querySelector(".permit-lines")) {
      const site = typeof SITES !== "undefined" && SITES.find((item) => item.id === activeId);
      if (site) root.insertAdjacentHTML("beforeend", permitBlock(site.id, site.name));
    }
    return result;
  };
}

if (typeof renderSide === "function" && typeof view !== "undefined" && view === "atlas") renderSide();
