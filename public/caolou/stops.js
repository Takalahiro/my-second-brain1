const STOPS = {
  manly: { label: "F1 Manly 码头", lat: -33.8000957, lng: 151.2849153 },
  taronga: { label: "F2 Taronga Zoo 码头", lat: -33.8463913, lng: 151.2395952 },
  bundeena: { label: "Bundeena 渡轮码头", lat: -34.0827226, lng: 151.1510425 },
  cronulla: { label: "T4 Cronulla", lat: -34.0557283, lng: 151.1514553 },
  heathcote: { label: "T4 Heathcote", lat: -34.0879621, lng: 151.0082554 },
  wentworth: { label: "蓝山线 Wentworth Falls", lat: -33.7098800, lng: 150.3764087 },
  bondi: { label: "T4 Bondi Junction", lat: -33.8912429, lng: 151.2484550 },
  turrella: { label: "T8 Turrella", lat: -33.9299188, lng: 151.1399608 },
  arncliffe: { label: "T4 Arncliffe", lat: -33.9364350, lng: 151.1473489 },
  riverwood: { label: "T8 Riverwood", lat: -33.9515353, lng: 151.0520048 },
  oatley: { label: "T4 Oatley", lat: -33.9805174, lng: 151.0790256 },
  berowra: { label: "T1 Berowra", lat: -33.6235384, lng: 151.1531676 },
  otford: { label: "南海岸线 Otford", lat: -34.2106925, lng: 151.0058190 },
  stanwell: { label: "南海岸线 Stanwell Park", lat: -34.2262668, lng: 150.9813283 },
  springwood: { label: "蓝山线 Springwood", lat: -33.6987482, lng: 150.5639732 },
  faulcon: { label: "蓝山线 Faulconbridge", lat: -33.6964307, lng: 150.5350695 },
  cowan: { label: "T1 Cowan", lat: -33.5935721, lng: 151.1716446 },
  bulli: { label: "南海岸线 Bulli", lat: -34.3344310, lng: 150.9147602 },
  blackheath: { label: "蓝山线 Blackheath", lat: -33.6332273, lng: 150.2843174 },
  deewhy: { label: "B-Line，Dee Why", lat: -33.7500275, lng: 151.2901763 },
  narrabeen: { label: "B-Line，Narrabeen", lat: -33.7122386, lng: 151.2975454 },
  warriewood: { label: "B-Line，Warriewood", lat: -33.6964104, lng: 151.3021165 }
};

const SITE_STOP = {
  northhead: ["manly", "下船后走到北头大约 40–60 分钟。"],
  shelly: ["manly", "下船后沿海岸走到 Shelly Beach 大约 20–30 分钟。"],
  clifton: ["taronga", "下船后走到 Clifton Gardens 大约 20–30 分钟。"],
  jibbon: ["bundeena", "下船后走到 Jibbon 步道口大约 10–20 分钟。"],
  boatharbour: ["cronulla", "出站后走到南边岩台大约 20–30 分钟。"],
  heathcote: ["heathcote", "出站后到公园入口大约 10–20 分钟。"],
  karloo: ["heathcote", "出站后这段池边步道大约要走 40–60 分钟，那是你自己的行程。"],
  blue: ["wentworth", "出站后走到瀑布观景台大约 20–30 分钟。"],
  gordons: ["bondi", "出站走到戈登斯湾大约 40–50 分钟。"],
  wolli: ["turrella", "出站进谷大约 5–15 分钟。"],
  lights: ["arncliffe", "出站走到湿地大约 10–15 分钟。"],
  saltpan: ["riverwood", "出站走到红树林栈道大约 10–20 分钟。"],
  oatley: ["oatley", "出站下坡进公园大约 15–20 分钟。"],
  crosslands: ["berowra", "出站走到保护区大约 50–70 分钟。"],
  otford: ["otford", "出站下到雨林大约 20–40 分钟。"],
  kelly: ["stanwell", "出站走到瀑布步道大约 15–25 分钟。"],
  sassafras: ["springwood", "出站后下到谷底大约 40–70 分钟，回来更久。"],
  victory: ["faulcon", "出站后下到谷里大约 40–70 分钟，回来更久。"],
  jerusalem: ["cowan", "出站下到海湾大约 40–60 分钟。"],
  sandon: ["bulli", "出站走到头地大约 15–25 分钟。"],
  walls: ["blackheath", "出站走到岩洞步道大约 15–25 分钟。"],
  deewhy: ["deewhy", "下车后走到潟湖西岸大约 10–20 分钟。"],
  narrabeen: ["narrabeen", "下车后走到湖岸大约 10–20 分钟。"],
  deepcreek: ["narrabeen", "下车后走到潟湖西端大约 25–40 分钟。"],
  turimetta: ["narrabeen", "下车后走到头地大约 15–25 分钟。"],
  longreef: ["deewhy", "下车后走到长礁头地大约 20–30 分钟。"],
  irrawong: ["warriewood", "下车后走到湿地大约 15–25 分钟。"]
};

function stopInfo(site) {
  const row = SITE_STOP[site.id];
  if (!row) return null;
  const stop = STOPS[row[0]];
  if (!stop) return null;
  return { id: row[0], label: stop.label, lat: stop.lat, lng: stop.lng, walk: row[1] };
}

function stopBlurb(site) {
  if (site.id === "muogamarra") {
    return "<p><strong>下车。</strong>开放季走预约的入口。不标车站，也不要沿铁路走进去。</p>";
  }
  const info = stopInfo(site);
  if (!info) {
    return "<p><strong>下车。</strong>这里没有近到可以步行接上的火车站或渡轮码头，也没有可以确定的巴士站。不编班次号。</p>";
  }
  return `<p><strong>下车。</strong>${info.label}。${info.walk}</p>`;
}
