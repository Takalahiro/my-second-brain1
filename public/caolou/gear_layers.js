/* 徒步六层。每一件都是可选项，默认不勾。不发明克数和价格。 */
const LAYER_WHEN = "2026-11-13";
const layerOn = { day: false, night: false, tech: false, climb: false, photo: false };
const layerCarry = {};
const layerFold = {};

function layerEsc(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[ch]));
}

function layerPhoto(id) {
  if (typeof GEAR_PHOTOS === "undefined" || !GEAR_PHOTOS) return "";
  return GEAR_PHOTOS[id] || "";
}

function layerPlbNote() {
  const id = typeof flowPlace === "string" ? flowPlace : "";
  const counter = typeof NPWS_PLB !== "undefined" && id ? NPWS_PLB[id] : "";
  if (counter) {
    return `页面里这一处写了借用点：${counter}。状态仍是待定，没有标成已借，也没有标成已买。若借不到就自购。`;
  }
  return "没有写在已核对路线的借用点上。状态待定。若借不到就自购。没有标成已买。";
}

const LAYER_CORE = [
  { id: "inreach", name: "Garmin inReach Mini 2", kind: "通信", show: "已买但未收货", own: "ordered", safety: true, photo: "gear/inreach-mini2.jpg", note: "已订购，所以是已买但未收货。没收货之前不计入携带重量。它不能完全代替 PLB。照片来自佳明官网 2026-11-13。克数未填。价格未填。" },
  { id: "plb", name: "PLB", kind: "定位", show: "待定", own: "未买", lack: true, safety: true, photo: "", note: "" },
  { id: "nav", name: "手机离线地图、GPX、指南针、纸质地图", kind: "导航", show: "待补／设置", own: "未买", lack: true, safety: true, photo: "", note: "待补／设置。没有说底图已经下载。" },
  { id: "lampMain", name: "主头灯", kind: "照明", show: "待买", own: "未买", lack: true, safety: true, photo: "", note: "待买。型号未定。不挂某一款头灯的图。徒步层另写 Black Diamond Storm 500-R。" },
  { id: "lumos", name: "Lumos FP200", kind: "照明", show: "待买", own: "未买", lack: true, safety: true, photo: "gear/lumos-fp200.jpg", note: "备用头灯。型号按用户所写 Lumos FP200。待买。照片来自 OZtrail 官方产品页 2026-11-13。不把页面上的克数写成已有重量。" },
  { id: "fox40", name: "Fox 40 无珠哨", kind: "求救", show: "待买", own: "未买", lack: true, safety: true, photo: "gear/fox40-classic.jpg", note: "待买。fox40.com 产品页被拒绝。照片来自 Fox 40 Shop 的 Classic 无珠哨，2026-11-13。克数未填。价格未填。" },
  { id: "blanket", name: "保温毯", kind: "求救", show: "待买", own: "未买", lack: true, safety: true, photo: "", note: "待买。型号未定。无产品图。" },
  { id: "aidkit", name: "急救包", kind: "急救", show: "已有", own: "已有", safety: true, photo: "", note: "已有。克数未填。蛇伤绷带不在这一包的重量里，那些行勾上之前不加。" },
  { id: "snake", name: "蛇咬压迫绷带 ×2", kind: "急救", show: "待买", own: "未买", lack: true, safety: true, photo: "", note: "待买。不并进急救包重量。" },
  { id: "elastic", name: "弹性绷带", kind: "急救", show: "待买", own: "未买", lack: true, safety: true, photo: "", note: "待买。型号未定。无产品图。" },
  { id: "scissors", name: "剪刀", kind: "急救", show: "待买", own: "未买", lack: true, safety: true, photo: "", note: "待买。型号未定。无产品图。" },
  { id: "liner", name: "背包防水内胆", kind: "防水", show: "待买", own: "未买", lack: true, safety: true, photo: "", note: "待买。型号未定。无产品图。" },
  { id: "dryelec", name: "电子设备防水袋", kind: "防水", show: "待买", own: "未买", lack: true, safety: true, photo: "", note: "待买。型号未定。无产品图。" },
  { id: "power", name: "充电宝、USB-C 线、备用电池", kind: "电力", show: "部分已有", own: "部分已有", safety: true, photo: "", note: "部分已有，不是整行已有。已有两只 20000 mAh、一只 5000 mAh，牌子未知，另有四块 EN-EL15。不发明牌子。克数未填。这一行不加一个总克数。" },
  { id: "water", name: "饮水", kind: "饮水", show: "待确认", own: "未买", lack: true, safety: true, photo: "", note: "至少 2 L。夏季长线 3 L 或更多。待确认。不发明水瓶克数。" },
  { id: "info", name: "紧急联系人、路线、预计返回", kind: "个人信息", show: "需要设置", own: "未买", lack: true, safety: true, photo: "", note: "需要设置。填了这些也不会自动开始救援。" },
  { id: "sun", name: "防晒霜、驱蚊剂、帽子、墨镜", kind: "防晒防虫", show: "部分已有", own: "部分已有", safety: true, wear: true, photo: "", note: "部分已有，不是整行已有。帽子和墨镜不勾本次携带就不进行程重量。" },
  { id: "trash", name: "防漏垃圾袋", kind: "垃圾", show: "待买", own: "未买", lack: true, safety: true, photo: "", note: "待买。型号未定。无产品图。" }
];

const LAYER_HIKE = [
  { id: "cobra", name: "Cobra 65", kind: "包", show: "已有", own: "已有", wear: true, g: 1650, photo: "gear/nm62355-cobra65.png", note: "已有。约 65 L。约 1650 g。来源 用户说明 2026-11-13。原先 1900 g 的估计不再显示。款号 NM62355 是用户确认。照片上没有印这个款号。背包不勾本次携带就不进默认行程重量。" },
  { id: "boots", name: "徒步鞋或登山靴", kind: "鞋", show: "已有", own: "已有", wear: true, photo: "", note: "按路线地形从已有的鞋里选，不新造一双。靴子不勾本次携带就不进默认行程重量。克数不在这一层新写。" },
  { id: "poles", name: "登山杖", kind: "杖", show: "待买", own: "未买", lack: true, photo: "", note: "下坡和负重时用。型号未定。无产品图。待买。" },
  { id: "bladder", name: "水袋 2–3 L", kind: "饮水", show: "待买", own: "未买", lack: true, photo: "", note: "2–3 L。待买。型号未定。不发明克数。" },
  { id: "bottle", name: "独立硬水瓶", kind: "饮水", show: "待买", own: "未买", lack: true, photo: "", note: "水袋漏了不至于把水全部失去。待买。型号未定。不发明克数。" },
  { id: "sawyer", name: "Sawyer Squeeze", kind: "滤水", show: "未买", own: "未买", lack: true, photo: "gear/sawyer-squeeze.png", note: "和 Katadyn BeFree 二选一。这一只未买。照片来自 sawyer.com 官网产品图 2026-11-13。克数未填。价格未填。" },
  { id: "befree", name: "Katadyn BeFree", kind: "滤水", show: "未买", own: "未买", lack: true, photo: "", note: "和 Sawyer Squeeze 二选一。这一只未买。升数未定。官网页面的产品图是占位图，没有保存，所以无产品图。" },
  { id: "tabs", name: "净水片", kind: "滤水", show: "待买", own: "未买", lack: true, photo: "", note: "滤水器的备用。待买。型号未定。无产品图。" },
  { id: "papermap", name: "防水纸质地图", kind: "导航", show: "待买", own: "未买", lack: true, photo: "", note: "待买。没有说底图或某一张图已经下载。无产品图。" },
  { id: "silva", name: "指南针", kind: "导航", show: "未买", own: "未买", lack: true, photo: "", note: "例如 Silva。未买。没有指定具体型号。型号未定。无产品图。" },
  { id: "storm", name: "Black Diamond Storm 500-R", kind: "照明", show: "待买", own: "未买", lack: true, photo: "gear/bd-storm-500r.jpg", note: "主头灯的徒步选择。待买。照片来自 Black Diamond 欧洲官网 Storm 500-R 产品页 2026-11-13。不把页面上的克数写成已有重量。" },
  { id: "lumosHike", name: "备用 Lumos FP200", kind: "照明", show: "待买", own: "未买", lack: true, photo: "gear/lumos-fp200.jpg", note: "和核心层是同一只备用灯，不重复买。待买。" },
  { id: "fenix", name: "Fenix PD36R Pro", kind: "手电", show: "未买", own: "未买", lack: true, photo: "gear/fenix-pd36r-pro.jpg", note: "和轻量 IP68 手电二选一。默认不买。照片来自 fenixlighting.com 官网 2026-11-13。克数未填。价格未填。" },
  { id: "ip68", name: "轻量 IP68 手电", kind: "手电", show: "未买", own: "未买", lack: true, photo: "", note: "和 Fenix PD36R Pro 二选一。默认不买。没有指定型号。型号未定。无产品图。" },
  { id: "liner80", name: "防水内胆 60–80 L", kind: "防水", show: "待买", own: "未买", lack: true, photo: "", note: "待买。型号未定。无产品图。" },
  { id: "smalldry", name: "小防水袋", kind: "防水", show: "待买", own: "未买", lack: true, photo: "", note: "急救、电子、干衣物分开。待买。型号未定。无产品图。" },
  { id: "repair", name: "维修包", kind: "修理", show: "待买", own: "未买", lack: true, photo: "", note: "胶带、扎带、针线、备用扣具。待买。无产品图。" },
  { id: "foxHike", name: "Fox 40", kind: "求救", show: "待买", own: "未买", lack: true, photo: "gear/fox40-classic.jpg", note: "和核心层是同一只哨，不重复买。待买。" },
  { id: "blanket2", name: "保温毯 ×2", kind: "求救", show: "待买", own: "未买", lack: true, photo: "", note: "两张。待买。型号未定。无产品图。" },
  { id: "meds", name: "个人药物", kind: "急救", show: "需要设置", own: "未买", lack: true, photo: "", note: "必须单独放进防水袋。不写药名和剂量。需要设置。" },
  { id: "snakeHike", name: "蛇咬绷带 ×2", kind: "急救", show: "待买", own: "未买", lack: true, photo: "", note: "和核心层是同一项，不重复买。勾上之前不进急救包重量。待买。" },
  { id: "sunHike", name: "防晒和驱虫", kind: "防晒防虫", show: "部分已有", own: "部分已有", wear: true, photo: "", note: "澳洲夏季要带。部分已有。帽子和墨镜不勾就不进重量。" }
];

const LAYER_CAMP = [
  { id: "tent", name: "单人帐篷", kind: "睡眠", show: "未买", own: "未买", lack: true, photo: "", note: "未买。不指定帐篷牌子。型号未定。无产品图。" },
  { id: "ground", name: "地布", kind: "睡眠", show: "未买", own: "未买", lack: true, photo: "", note: "未买。型号未定。无产品图。" },
  { id: "bag", name: "睡袋", kind: "睡眠", show: "未买", own: "未买", lack: true, photo: "", note: "未买。型号未定。无产品图。夏季普通低地可以用更轻的睡袋。Kosciuszko 仍要看 comfort 温标，不能只看极限温标。没有填写温度。" },
  { id: "bagdry", name: "睡袋防水袋", kind: "睡眠", show: "未买", own: "未买", lack: true, photo: "", note: "未买。型号未定。无产品图。" },
  { id: "pad", name: "睡垫", kind: "睡眠", show: "未买", own: "未买", lack: true, photo: "", note: "未买。型号未定。无产品图。" },
  { id: "patch", name: "睡垫补片", kind: "睡眠", show: "未买", own: "未买", lack: true, photo: "", note: "未买。型号未定。无产品图。" },
  { id: "pump", name: "充气袋", kind: "睡眠", show: "未买", own: "未买", lack: true, photo: "", note: "未买。型号未定。无产品图。" },
  { id: "pillow", name: "轻量枕头或衣物枕套", kind: "睡眠", show: "未买", own: "未买", lack: true, photo: "", note: "未买。可以用衣物袋代替。型号未定。无产品图。" },
  { id: "stove", name: "炉具", kind: "炊事", show: "未买", own: "未买", lack: true, photo: "", note: "未买。型号未定。无产品图。没有在这一页查询当天的 Total Fire Ban。若全面禁火或公园禁火生效，按 NPWS：不生火，也不使用被禁止的炉具。" },
  { id: "fuel", name: "燃料", kind: "炊事", show: "未买", own: "未买", lack: true, photo: "", note: "未买。型号未定。无产品图。" },
  { id: "pot", name: "小锅", kind: "炊事", show: "未买", own: "未买", lack: true, photo: "", note: "未买。型号未定。无产品图。" },
  { id: "lighter", name: "打火机 ×2", kind: "炊事", show: "未买", own: "未买", lack: true, photo: "", note: "两只。未买。无产品图。" },
  { id: "uco", name: "UCO 打火棒", kind: "炊事", show: "未买", own: "未买", lack: true, photo: "", note: "备用点火，不能代替炉具。未买。具体型号未定。无产品图。" },
  { id: "wind", name: "防风板", kind: "炊事", show: "未买", own: "未买", lack: true, photo: "", note: "未买。型号未定。无产品图。" },
  { id: "spoons", name: "简易餐具", kind: "炊事", show: "未买", own: "未买", lack: true, photo: "", note: "未买。型号未定。无产品图。" },
  { id: "food", name: "高热量食物", kind: "炊事", show: "未买", own: "未买", lack: true, photo: "", note: "未买。不写具体食品克数。" },
  { id: "nocook", name: "不用加热的备用食物", kind: "炊事", show: "未买", own: "未买", lack: true, photo: "", note: "未买。不写具体食品克数。" },
  { id: "foodbag", name: "防漏食物袋", kind: "炊事", show: "未买", own: "未买", lack: true, photo: "", note: "未买。型号未定。无产品图。" },
  { id: "rubseal", name: "垃圾密封袋", kind: "炊事", show: "未买", own: "未买", lack: true, photo: "", note: "未买。型号未定。无产品图。" },
  { id: "tp", name: "厕纸", kind: "卫生", show: "未买", own: "未买", lack: true, photo: "", note: "未买。" },
  { id: "sanit", name: "免洗洗手液", kind: "卫生", show: "未买", own: "未买", lack: true, photo: "", note: "未买。型号未定。无产品图。" },
  { id: "wag", name: "排泄物携出袋", kind: "卫生", show: "未买", own: "未买", lack: true, photo: "", note: "未买。高山和敏感地区可能要求带走。不默认掩埋。" },
  { id: "trowel", name: "小铲", kind: "卫生", show: "未买", own: "未买", lack: true, photo: "", note: "只在当地规则允许掩埋时使用。未买。不默认掩埋。型号未定。无产品图。" },
  { id: "wipes", name: "湿巾", kind: "卫生", show: "未买", own: "未买", lack: true, photo: "", note: "未买。" },
  { id: "towel", name: "轻量毛巾", kind: "卫生", show: "未买", own: "未买", lack: true, photo: "", note: "未买。型号未定。无产品图。" },
  { id: "hygiene", name: "个人卫生用品", kind: "卫生", show: "未买", own: "未买", lack: true, photo: "", note: "未买。不写具体牌子。" }
];

const LAYER_TECH = [
  { id: "techpoles", name: "Black Diamond 登山杖", kind: "技术探索", show: "待买", own: "未买", lack: true, photo: "", note: "型号未定。无产品图。待买。" },
  { id: "techlamp", name: "Black Diamond 头灯", kind: "技术探索", show: "待买", own: "未买", lack: true, photo: "", note: "徒步层写的是 Storm 500-R。这里不另造第二只已买的灯。待买。" },
  { id: "mapcase", name: "防水地图袋", kind: "技术探索", show: "待买", own: "未买", lack: true, photo: "", note: "待买。型号未定。无产品图。" },
  { id: "gps", name: "手持 GPS 或第二导航", kind: "技术探索", show: "待买", own: "未买", lack: true, photo: "", note: "待买。型号未定。无产品图。" },
  { id: "notebook", name: "防水笔记板", kind: "技术探索", show: "待买", own: "未买", lack: true, photo: "", note: "待买。型号未定。无产品图。" },
  { id: "techcells", name: "备用电池", kind: "技术探索", show: "部分已有", own: "部分已有", photo: "", note: "核心层已有的电池不算整行新买。不发明克数。" },
  { id: "helper", name: "轻量救生绳或辅助绳", kind: "技术探索", show: "待买", own: "未买", lack: true, photo: "", note: "待买。不能用于保护人体、下降或攀岩。" },
  { id: "para", name: "备用伞绳一条", kind: "技术探索", show: "待买", own: "未买", lack: true, photo: "", note: "待买。只用于固定、维修和收纳。" },
  { id: "techdry", name: "防水袋", kind: "技术探索", show: "待买", own: "未买", lack: true, photo: "", note: "待买。型号未定。无产品图。" },
  { id: "wetshoes", name: "涉水鞋或备用袜", kind: "技术探索", show: "待买", own: "未买", lack: true, photo: "", note: "待买。型号未定。鞋不勾本次携带就不进默认重量。" },
  { id: "techgloves", name: "手套", kind: "技术探索", show: "待买", own: "未买", lack: true, wear: true, photo: "", note: "待买。型号未定。无产品图。不是攀岩手套。" },
  { id: "kneepad", name: "护膝", kind: "技术探索", show: "待买", own: "未买", lack: true, photo: "", note: "待买。型号未定。无产品图。不是攀岩护膝。" },
  { id: "traction", name: "防滑鞋套", kind: "技术探索", show: "待买", own: "未买", lack: true, photo: "", note: "待买。型号未定。无产品图。" },
  { id: "rainpants", name: "轻量雨裤", kind: "技术探索", show: "已有", own: "已有", wear: true, photo: "", note: "已有 NP12502，用户确认 GORE-TEX，只标防水和防雨。不勾本次携带就不进默认重量。这不是新买的一条。" },
  { id: "locator", name: "个人定位器", kind: "技术探索", show: "待定", own: "未买", lack: true, photo: "", note: "和核心层的 PLB、inReach 同一件事。inReach 不能代替 PLB。待定。没有标成已买。" },
  { id: "techtool", name: "小型维修工具", kind: "技术探索", show: "待买", own: "未买", lack: true, photo: "", note: "待买。型号未定。无产品图。" },
  { id: "techfilter", name: "水过滤器", kind: "技术探索", show: "未买", own: "未买", lack: true, photo: "", note: "仍是 Sawyer Squeeze 或 Katadyn BeFree，两只都未买。不在这里再指定第三只。" },
  { id: "mesh", name: "防虫网", kind: "技术探索", show: "待买", own: "未买", lack: true, photo: "", note: "待买。型号未定。无产品图。" },
  { id: "techsnake", name: "防蛇压迫绷带", kind: "技术探索", show: "待买", own: "未买", lack: true, photo: "", note: "和核心层同一项。待买。" },
  { id: "bivy", name: "应急露宿袋", kind: "技术探索", show: "待买", own: "未买", lack: true, photo: "", note: "待买。型号未定。无产品图。" }
];

const LAYER_CLIMB = [
  { id: "helmet", name: "头盔", kind: "技术攀岩", show: "未买", own: "未买", lack: true, photo: "", note: "未买。这一层优先看 Black Diamond。型号未定。无产品图。" },
  { id: "harness", name: "安全带", kind: "技术攀岩", show: "未买", own: "未买", lack: true, photo: "", note: "未买。型号未定。无产品图。" },
  { id: "rope", name: "动态单绳", kind: "技术攀岩", show: "未买", own: "未买", lack: true, photo: "", note: "未买。不是一条万能绳。要先问：动态还是静力、直径、长度、单绳／半绳／双绳，以及用于攀爬、下降、峡谷还是救援。型号未定。无产品图。" },
  { id: "belay", name: "保护器", kind: "技术攀岩", show: "未买", own: "未买", lack: true, photo: "", note: "未买。型号未定。无产品图。要和绳径匹配。" },
  { id: "lockers", name: "主锁", kind: "技术攀岩", show: "未买", own: "未买", lack: true, photo: "", note: "未买。型号未定。无产品图。" },
  { id: "slings", name: "扁带", kind: "技术攀岩", show: "未买", own: "未买", lack: true, photo: "", note: "未买。型号未定。无产品图。" },
  { id: "runners", name: "绳套", kind: "技术攀岩", show: "未买", own: "未买", lack: true, photo: "", note: "未买。型号未定。无产品图。" },
  { id: "descender", name: "下降器", kind: "技术攀岩", show: "未买", own: "未买", lack: true, photo: "", note: "未买。型号未定。无产品图。" },
  { id: "ascenders", name: "上升器", kind: "技术攀岩", show: "未买", own: "未买", lack: true, photo: "", note: "未买。型号未定。无产品图。" },
  { id: "prusik", name: "抓结绳", kind: "技术攀岩", show: "未买", own: "未买", lack: true, photo: "", note: "未买。型号未定。无产品图。" },
  { id: "pitons", name: "岩钉", kind: "技术攀岩", show: "未买", own: "未买", lack: true, photo: "", note: "未买。型号未定。无产品图。" },
  { id: "nuts", name: "岩塞", kind: "技术攀岩", show: "未买", own: "未买", lack: true, photo: "", note: "未买。型号未定。无产品图。" },
  { id: "pro", name: "其他保护器材", kind: "技术攀岩", show: "未买", own: "未买", lack: true, photo: "", note: "未买。型号未定。无产品图。" },
  { id: "ropebag", name: "绳包", kind: "技术攀岩", show: "未买", own: "未买", lack: true, photo: "", note: "未买。型号未定。无产品图。" },
  { id: "cgloves", name: "攀岩手套", kind: "技术攀岩", show: "未买", own: "未买", lack: true, photo: "", note: "未买。型号未定。无产品图。" },
  { id: "cshoes", name: "攀岩鞋", kind: "技术攀岩", show: "未买", own: "未买", lack: true, photo: "", note: "未买。型号未定。无产品图。" },
  { id: "cknee", name: "护膝", kind: "技术攀岩", show: "未买", own: "未买", lack: true, photo: "", note: "未买。型号未定。无产品图。" },
  { id: "loops", name: "装备挂环", kind: "技术攀岩", show: "未买", own: "未买", lack: true, photo: "", note: "未买。型号未定。无产品图。" },
  { id: "qds", name: "攀岩快挂 ×3", kind: "技术攀岩", show: "未买", own: "未买", lack: true, photo: "", note: "先不定购，等系统选定。要核对：是不是认证攀岩锁扣、要不要自动锁、用于锚点还是保护站还是装备、是否匹配绳径和保护器。未买。无产品图。" }
];

const LAYER_PHOTO = [
  { id: "z8", name: "Nikon Z8", kind: "摄影", show: "已有", own: "已有", g: 910, photo: "gear/z8.jpg", note: "已有。原清单约 910 g。不勾本次携带就不进重量。Z8 不出水。" },
  { id: "std2470", name: "Z 24-70/4", kind: "摄影", show: "已有", own: "已有", g: 500, photo: "gear/std.jpg", note: "已有。原清单约 500 g。不勾本次携带就不进重量。" },
  { id: "tele200p", name: "Z 70-200/2.8", kind: "摄影", show: "已有", own: "已有", g: 1440, photo: "gear/tele200.jpg", note: "已有。原清单约 1440 g。可以和 180-600 同时勾选。两只不能同时装上。同时携带不是默认。" },
  { id: "tele600p", name: "Z 180-600", kind: "摄影", show: "已有", own: "已有", g: 1955, testSkip: true, photo: "gear/tele600.jpg", note: "已有。原清单约 1955 g。负重测试不包含这一只。可以和 70-200 同时勾选。两只不能同时装上。" },
  { id: "enel", name: "EN-EL15 ×4", kind: "摄影", show: "已有", own: "已有", photo: "gear/batts.jpg", note: "四块已有。原清单有两块约 176 g 的记法。这一层不把那个数写进重量，默认也不勾本次携带。" },
  { id: "cards", name: "存储卡", kind: "摄影", show: "已有", own: "已有", photo: "", note: "用户说明里算已有。原清单那条未买的具体卡不改成已买货号。型号未定。无产品图。克数未填。" },
  { id: "reader", name: "读卡器", kind: "摄影", show: "已有", own: "已有", photo: "gear/reader.jpg", note: "已有。原记录留在住处。不默认本次携带。克数未填。" },
  { id: "cpl72", name: "卡色 72 mm CPL", kind: "摄影", show: "已有", own: "已有", photo: "gear/cpl.jpg", note: "已有。只上 24-70。克数未填。" },
  { id: "cpl77p", name: "卡色 77 mm CPL", kind: "摄影", show: "已有", own: "已有", photo: "", note: "用户说明里算已有。克数未填。无产品图。原清单那条商店记录不改成一个新的克数。" },
  { id: "smallrig", name: "SmallRig 三脚架", kind: "摄影", show: "未买", own: "未买", lack: true, photo: "", note: "未买。没有已有的同名行。型号未定。无产品图。" },
  { id: "coman", name: "科曼独脚架", kind: "摄影", show: "未买", own: "未买", lack: true, photo: "", note: "未买。没有已有的同名行。型号未定。无产品图。" },
  { id: "plate", name: "长焦快装板", kind: "摄影", show: "未买", own: "未买", lack: true, photo: "", note: "未买。型号未定。无产品图。" },
  { id: "head", name: "云台", kind: "摄影", show: "未买", own: "未买", lack: true, photo: "", note: "未买。型号未定。无产品图。" },
  { id: "raincover", name: "防雨罩", kind: "摄影", show: "未买", own: "未买", lack: true, photo: "", note: "未买。型号未定。无产品图。不把商店里另一只未买的罩当成已经选定。" },
  { id: "grey", name: "灰卡", kind: "摄影", show: "未买", own: "未买", lack: true, photo: "", note: "未买。型号未定。无产品图。" },
  { id: "bins", name: "双筒望远镜", kind: "摄影", show: "未买", own: "未买", lack: true, photo: "", note: "未买。型号未定。无产品图。" },
  { id: "ssd", name: "便携固态硬盘", kind: "摄影", show: "已有", own: "已有", photo: "gear/ssd.jpg", note: "原清单这行已有，记为留在住处。不默认本次携带。克数未填。不是未买。" },
  { id: "dryinsert", name: "防水摄影内胆", kind: "摄影", show: "未买", own: "未买", lack: true, photo: "", note: "未买。型号未定。无产品图。" },
  { id: "clean", name: "清洁工具", kind: "摄影", show: "未买", own: "未买", lack: true, photo: "", note: "未买。型号未定。无产品图。" }
];

const LAYER_MOLLE = [
  { id: "molleAid", name: "小型急救外挂袋 ×1", kind: "MOLLE", show: "未买", own: "未买", lack: true, photo: "", note: "未买。要能配高山包织带。不是战术背板。型号未定。无产品图。" },
  { id: "molleNav", name: "导航／电子外挂袋 ×1", kind: "MOLLE", show: "未买", own: "未买", lack: true, photo: "", note: "未买。型号未定。无产品图。" },
  { id: "molleTool", name: "小工具袋 ×1", kind: "MOLLE", show: "未买", own: "未买", lack: true, photo: "", note: "未买。型号未定。无产品图。" },
  { id: "molleStrap", name: "轻量压缩带 ×2", kind: "MOLLE", show: "未买", own: "未买", lack: true, photo: "", note: "未买。型号未定。无产品图。" },
  { id: "molleQd", name: "非攀岩快挂 ×4", kind: "MOLLE", show: "未买", own: "未买", lack: true, photo: "", note: "未买。只当装备挂钩。没有承重认证，不能挂人。" }
];

const LAYER_KNIVES = [
  { id: "huntsman", name: "Victorinox Huntsman", kind: "小刀", show: "未买", own: "未买", lack: true, photo: "gear/victorinox-huntsman.png", note: "选项，未拥有。照片来自 victorinox.com 官网 2026-11-13。克数未填。价格未填。不是大型战术匕首，也不是防身。放在包内。NSW 公共场所携带刀具需要合理用途。" },
  { id: "fieldmaster", name: "Victorinox Fieldmaster", kind: "小刀", show: "未买", own: "未买", lack: true, photo: "gear/victorinox-fieldmaster.png", note: "选项，未拥有。照片来自 victorinox.com 官网 2026-11-13。克数未填。价格未填。放在包内，用于修理、切绳和普通事务。" },
  { id: "rescueknife", name: "小型救援刀", kind: "小刀", show: "未买", own: "未买", lack: true, photo: "", note: "选项，未拥有。型号未定。无产品图。不是防身。" }
];

function layerActive() {
  return {
    core: true,
    hike: !!(layerOn.day || layerOn.night),
    camp: !!layerOn.night,
    tech: !!layerOn.tech,
    climb: !!layerOn.climb,
    photo: !!layerOn.photo
  };
}

function layerRowsNow() {
  return LAYER_CORE.concat(LAYER_HIKE, LAYER_MOLLE, LAYER_KNIVES, LAYER_CAMP, LAYER_TECH, LAYER_CLIMB, LAYER_PHOTO);
}

function layerExecutable(row) {
  if (!layerCarry[row.id] || row.testSkip) return false;
  if (row.show === "已买但未收货" || row.own === "ordered") return false;
  if (row.own !== "已有" && row.own !== "已买" && row.own !== "借用") return false;
  return row.g != null;
}

function layerPlanned(row) {
  if (!layerCarry[row.id] || row.testSkip || row.g == null || layerExecutable(row)) return false;
  return true;
}

function layerWeights() {
  let owned = 0;
  let plan = 0;
  layerRowsNow().forEach((row) => {
    if (layerExecutable(row)) {
      owned += row.g;
      plan += row.g;
    } else if (layerPlanned(row)) plan += row.g;
  });
  return { owned: owned, plan: plan };
}

function layerBucketOf(row) {
  if (LAYER_PHOTO.indexOf(row) >= 0) return "摄影";
  if (LAYER_CAMP.indexOf(row) >= 0) return "过夜";
  if (LAYER_CORE.indexOf(row) >= 0) return "安全";
  if (LAYER_HIKE.indexOf(row) >= 0 || LAYER_MOLLE.indexOf(row) >= 0 || LAYER_KNIVES.indexOf(row) >= 0) return "徒步";
  return "";
}

function layerSplitHtml() {
  const order = ["摄影", "徒步", "潜水", "安全", "过夜"];
  const bag = {};
  order.forEach((name) => { bag[name] = { owned: 0, plan: 0, saw: false }; });
  layerRowsNow().forEach((row) => {
    const name = layerBucketOf(row);
    if (!name || row.g == null) return;
    bag[name].saw = true;
    if (layerExecutable(row)) {
      bag[name].owned += row.g;
      bag[name].plan += row.g;
    } else if (layerPlanned(row)) bag[name].plan += row.g;
  });
  const parts = [];
  order.forEach((name) => {
    const item = bag[name];
    if (!item.saw || (item.owned === 0 && item.plan === 0)) return;
    parts.push(`${name} 已具备 ${item.owned} g，计划 ${item.plan} g`);
  });
  if (!parts.length) return "";
  return `<p class="layer-split">${parts.join(" · ")}</p>`;
}

function layerFace(row) {
  if (row.show === "已买但未收货" || row.own === "ordered") return "已订未到";
  if (row.own === "借用" || row.show === "借用") return "借用";
  if (row.own === "已有" || row.own === "已买") return "已有";
  if (row.own === "部分已有" || row.show === "部分已有") return "部分已有";
  return "未买";
}

function layerRowHtml(row) {
  const note = row.id === "plb" ? layerPlbNote() : row.note;
  const photo = row.photo
    ? `<img src="${layerEsc(row.photo)}" alt="">`
    : `<span class="layer-nophoto">无产品图</span>`;
  const face = layerFace(row);
  const ordered = face === "已订未到";
  const lack = face === "未买" ? " <em>尚未具备</em>" : "";
  const carrying = !!layerCarry[row.id];
  const carry = `<label><input type="checkbox" data-layer-carry="${layerEsc(row.id)}" ${layerCarry[row.id] ? "checked" : ""}> 这次带着</label>${ordered ? `<div>已订未到，勾了也不计入今天能带的重量</div>` : ""}`;
  const grams = row.g == null ? "克数未填" : `约 ${row.g} g`;
  return `<tr draggable="true" data-row="${layerEsc(row.id)}" data-status="${layerEsc(row.show)}" data-face="${layerEsc(face)}">
    <td>${photo}</td>
    <td><strong>${layerEsc(row.name)}</strong><br>${layerEsc(row.kind)}</td>
    <td class="layer-face">${layerEsc(face)}${lack}${carrying ? " · 这次带着" : ""}</td>
    <td>${grams}</td>
    <td>${carry}</td>
    <td>${layerEsc(note)}</td>
  </tr>`;
}

function layerTable(rows) {
  const body = rows.map(layerRowHtml).join("");
  return `<table><thead><tr><th>照片</th><th>名称</th><th>状态</th><th>克数</th><th>这次带着</th><th>说明</th></tr></thead><tbody>${body}</tbody></table>`;
}

function layerPick(id, label) {
  return `<label><input type="checkbox" data-layer-route="${id}" ${layerOn[id] ? "checked" : ""}> ${layerEsc(label)}</label>`;
}

function layerPhotoWarn() {
  if (!(layerCarry.tele200p && layerCarry.tele600p)) return "";
  return `<p class="warnline">Z 70-200 和 Z 180-600 不能同时装上。两只都勾了也不会被清掉。同时携带不是默认，除非路线短、重量有余，或拍摄对象明确。由你决定。</p>`;
}

function layerWeightHtml() {
  const totals = layerWeights();
  const cut = totals.plan > 10000
    ? `<p class="warnline">计划总重量超过 10 kg。超过 10 kg，建议去掉 70–200，或改为日间行程。</p>`
    : "";
  return `<section id="layerWeight">
    <h3>重量</h3>
    <p class="layer-rule">已有并且勾了「这次带着」才计入能出发的重量。未买的只出现在预计重量里，并标尚未具备。衣服、靴子、帽子、墨镜和背包默认不计，除非你勾上。</p>
    <div class="layer-figures">
      <p><span>已具备重量</span><strong>${totals.owned} g</strong></p>
      <p><span>计划总重量</span><strong>${totals.plan} g</strong></p>
    </div>
    ${layerSplitHtml()}
    ${cut}
    <p class="note">负重测试不包含 180–600。第一次过夜测试的目标是 10–12 kg。这是目标，不是实测总重。</p>
  </section>`;
}

function layerFoldHtml(id, title, when, openDefault, body) {
  if (!Object.prototype.hasOwnProperty.call(layerFold, id)) layerFold[id] = openDefault;
  const open = layerFold[id] ? " open" : "";
  const whenHtml = when ? `<span class="layer-when">${when}</span>` : "";
  return `<details class="layer-fold" id="${id}" data-layer-fold="${id}"${open}><summary><span class="layer-title">${title}</span>${whenHtml}</summary><div class="layer-body">${body}</div></details>`;
}

function layerHikeBody() {
  return `<p>可选项。攀岩不在这一组。</p>
    ${layerTable(LAYER_HIKE)}
    <h3>Cobra 65 的外挂</h3>
    <p>不假定 Cobra 65 是标准 MOLLE 包。外挂要能配高山包织带。镜头、炉具和大部分水不要挂在外面。</p>
    ${layerTable(LAYER_MOLLE)}
    <h3>小刀</h3>
    <p>都还没买。不是防身。刀放在包内。NSW 公共场所携带刀具需要合理用途。</p>
    ${layerTable(LAYER_KNIVES)}`;
}

function layerCampBody() {
  return `<p>可选项。没有已有记录的行都是未买。不指定帐篷牌子。</p>${layerTable(LAYER_CAMP)}`;
}

function layerTechBody() {
  return `<p>可选项。不是正式攀岩。辅助绳不能用于保护人体、下降或攀岩。伞绳只用于固定、维修和收纳。</p>${layerTable(LAYER_TECH)}`;
}

function layerClimbBody() {
  return `<p>可选项。不会因为你有这些装备就加入今天的徒步。有装备也不等于这条路线可以走。</p>${layerTable(LAYER_CLIMB)}`;
}

function layerPhotoBody() {
  const both = layerCarry.tele200p && layerCarry.tele600p;
  return `${layerPhotoWarn()}<p>70-200 和 180-600 可以同时勾。${both ? "现在两只都勾了。" : "现在没有默认两只一起带。"}不能同时装上。由你决定。Z8 不出水。</p>${layerTable(LAYER_PHOTO)}`;
}

function layerCarryRows() {
  return layerRowsNow().filter((row) => layerCarry[row.id]);
}

function layerHasKind(rows, kinds, ids) {
  return rows.some((row) => (kinds && kinds.indexOf(row.kind) >= 0) || (ids && ids.indexOf(row.id) >= 0));
}

function layerChoiceBar(label, on, text) {
  const width = on ? 100 : 0;
  return `<div class="gear-bar" data-gear-bar="${layerEsc(label)}">
    <div class="gear-bar-label"><span>${layerEsc(label)}</span><span>${layerEsc(text)}</span></div>
    <div class="gear-bar-track"><div class="gear-bar-fill" style="width:${width}%"></div></div>
  </div>`;
}

function layerBarsHtml() {
  const selected = layerCarryRows();
  const withGrams = selected.filter((row) => row.g != null);
  const today = layerWeights().owned;
  let endurance;
  if (!selected.length) {
    endurance = layerChoiceBar("耐力", false, "0 g");
  } else if (!withGrams.length) {
    endurance = `<div class="gear-bar" data-gear-bar="耐力"><div class="gear-bar-label"><span>耐力</span><span>克数未填</span></div><p>这次带着里没有填写克数的行。不显示数字。</p></div>`;
  } else {
    const width = Math.min(100, Math.round(today / 10000 * 100));
    const extra = today > 10000 ? " 超过 10 kg，条是满的。" : "";
    endurance = `<div class="gear-bar" data-gear-bar="耐力">
      <div class="gear-bar-label"><span>耐力</span><span>${today} g</span></div>
      <div class="gear-bar-track"><div class="gear-bar-fill" style="width:${width}%"></div></div>
      <p>今天能带的克数对照 10 kg。0 g 是空条。未买和已订未到的克数不进这条。${extra}</p>
    </div>`;
  }
  const water = layerHasKind(selected, ["饮水"], []);
  const light = layerHasKind(selected, ["照明", "手电"], ["techlamp"]);
  const comms = layerHasKind(selected, [], ["inreach", "plb", "locator"]);
  const aid = layerHasKind(selected, [], ["aidkit", "snake", "snakeHike", "techsnake"]);
  const ordered = selected.some((row) => row.id === "inreach" && layerFace(row) === "已订未到");
  const commsText = !comms ? "未选" : (ordered ? "已订未到" : "已选");
  return `<section id="gearBars">
    <h3>这次带着的条</h3>
    <p>这些条只描述这次带着里有什么。不是体能分数，也不是出发许可。</p>
    ${endurance}
    ${layerChoiceBar("饮水", water, water ? "已选" : "未选")}
    ${layerChoiceBar("照明", light, light ? "已选" : "未选")}
    ${layerChoiceBar("通信", comms, commsText)}
    ${layerChoiceBar("急救", aid, aid ? "已选" : "未选")}
  </section>`;
}

function layerZoneHtml() {
  const chips = layerCarryRows().map((row) => {
    const face = layerFace(row);
    const extra = face === "未买" ? " 尚未具备" : (face === "已订未到" ? " 已订未到" : "");
    return `<span class="carry-chip" draggable="true" data-row="${layerEsc(row.id)}" data-from="zone">${layerEsc(row.name)}${layerEsc(extra)} <button type="button" data-carry-remove="${layerEsc(row.id)}">移除</button></span>`;
  }).join("");
  return `<div id="carryZone">
    <h3>这次带着</h3>
    <p>把一行拖进来，或点那一行。拖出去，或按移除，就拿掉。默认一件都不带。</p>
    <div class="carry-chips">${chips || `<p class="note">现在是空的。</p>`}</div>
  </div>`;
}

function gearLayersHtml() {
  return `<section id="hikeLayers">
    <p>分组只方便查找。打开一组，勾「这次带着」，或把那一行拖进上面的区域。没有一件是必须带的。</p>
    ${layerZoneHtml()}
    ${layerBarsHtml()}
    ${layerFoldHtml("layerCore", "核心包", "可选", false, layerTable(LAYER_CORE))}
    ${layerFoldHtml("layerHike", "徒步装备", "可选", false, layerHikeBody())}
    ${layerFoldHtml("layerCamp", "露营过夜装备", "可选", false, layerCampBody())}
    ${layerFoldHtml("layerTech", "技术探索装备", "可选", false, layerTechBody())}
    ${layerFoldHtml("layerClimb", "技术攀岩装备", "可选。需要专业训练。不会自动加入徒步。", false, layerClimbBody())}
    ${layerFoldHtml("layerPhoto", "休闲探索和日间摄影", "可选", false, layerPhotoBody())}
    ${layerWeightHtml()}
    ${layerFoldHtml("layerConclusions", "各组怎么分", "", false, `<p>已有的要勾「这次带着」才计入能出发的重量。未买的只进预计重量，并标尚未具备。</p><p>技术装备可以优先看 Black Diamond，但只限技术攀岩这一层。帐篷、睡袋、滤水器、急救和通信不必用同一个牌子。系统兼容比标志更重要。</p>`)}
  </section>`;
}

(function layerInstall() {
  const style = document.createElement("style");
  style.textContent = `#hikeLayers{margin-top:8px}.gear-lead{font-size:18px;margin:0 0 14px}.layer-picks{display:flex;flex-wrap:wrap;gap:10px 16px;margin:0 0 14px;align-items:center}.layer-picks p{width:100%;margin:0;color:var(--muted)}#hikeLayers .layer-fold{margin:0 0 8px;border:1px solid var(--line);background:var(--bg-2)}#hikeLayers .layer-fold summary{cursor:pointer;padding:10px 12px}#hikeLayers .layer-title{margin-right:12px}#hikeLayers .layer-when{color:var(--muted)}#hikeLayers .layer-body{padding:0 12px 12px}#hikeLayers #layerCore{border-color:var(--ink)}#hikeLayers #layerClimb{border-color:var(--warn)}#hikeLayers #layerClimb .layer-when{color:var(--warn);display:block;margin-top:4px}#hikeLayers table{width:100%;border-collapse:collapse}#hikeLayers th,#hikeLayers td{border-bottom:1px solid var(--line);padding:8px;vertical-align:top;text-align:left}#hikeLayers td:last-child{color:var(--muted);font-size:14px}#hikeLayers img{width:72px;height:72px;object-fit:contain;background:#111}#hikeLayers .layer-nophoto{display:inline-block;width:72px;color:var(--muted)}#hikeLayers th:nth-child(4),#hikeLayers td:nth-child(4),#hikeLayers th:nth-child(5),#hikeLayers td:nth-child(5){white-space:nowrap}#hikeLayers .layer-face{font-weight:500;white-space:nowrap}#hikeLayers tr[data-face="已有"] .layer-face{color:var(--safe)}#hikeLayers tr[data-face="未买"] .layer-face,#hikeLayers tr[data-face="部分已有"] .layer-face{color:var(--muted)}#hikeLayers tr[data-face="已订未到"] .layer-face{color:var(--stop)}#hikeLayers .layer-face em{color:var(--warn);font-style:normal}#layerWeight{margin:16px 0;padding-top:12px;border-top:1px solid var(--line)}.layer-figures{display:flex;gap:28px;margin:8px 0 12px}.layer-figures p{margin:0}.layer-figures span{display:block;color:var(--muted);font-size:14px}.layer-figures strong{display:block;font-size:28px;font-weight:500}.layer-split{color:var(--muted)}#carryZone{border:1px dashed var(--line);padding:10px 12px;margin:0 0 12px}#carryZone.over{border-color:var(--ink)}.carry-chip{display:inline-block;margin:0 8px 8px 0;padding:4px 8px;border:1px solid var(--line);background:var(--bg-2)}#gearBars{margin:0 0 14px}.gear-bar{margin:0 0 8px}.gear-bar-label{display:flex;justify-content:space-between;gap:12px}.gear-bar-track{height:8px;background:var(--bg-3);margin-top:4px}.gear-bar-fill{height:8px;background:var(--ink)}#hikeLayers tr[draggable="true"]{cursor:grab}`;
  document.head.appendChild(style);
  document.body.addEventListener("toggle", (event) => {
    const fold = event.target.closest("[data-layer-fold]");
    if (!fold) return;
    layerFold[fold.dataset.layerFold] = fold.open;
  }, true);
  document.body.addEventListener("change", (event) => {
    const route = event.target.closest("[data-layer-route]");
    if (route) {
      layerOn[route.dataset.layerRoute] = route.checked;
      if (typeof flowRender === "function") flowRender();
      return;
    }
    const carry = event.target.closest("[data-layer-carry]");
    if (carry) {
      layerCarry[carry.dataset.layerCarry] = carry.checked;
      if (typeof flowRender === "function") flowRender();
    }
  });
  let layerDragging = "";
  let layerDragFrom = "";
  let layerDidDrag = false;
  document.body.addEventListener("click", (event) => {
    const remove = event.target.closest("[data-carry-remove]");
    if (remove) {
      event.preventDefault();
      layerCarry[remove.dataset.carryRemove] = false;
      if (typeof flowRender === "function") flowRender();
      return;
    }
    if (layerDidDrag) {
      layerDidDrag = false;
      return;
    }
    const row = event.target.closest("#hikeLayers tr[data-row]");
    if (!row || event.target.closest("a, button, input, label")) return;
    const id = row.dataset.row;
    layerCarry[id] = !layerCarry[id];
    if (typeof flowRender === "function") flowRender();
  });
  document.body.addEventListener("dragstart", (event) => {
    const chip = event.target.closest("#carryZone [data-row], #hikeLayers tr[data-row]");
    if (!chip) return;
    layerDragging = chip.dataset.row;
    layerDragFrom = chip.closest("#carryZone") ? "zone" : "table";
    event.dataTransfer.setData("text/plain", layerDragging);
    event.dataTransfer.effectAllowed = "move";
  });
  document.body.addEventListener("dragover", (event) => {
    if (layerDragFrom === "zone" || event.target.closest("#carryZone")) event.preventDefault();
  });
  document.body.addEventListener("drop", (event) => {
    if (!layerDragging) return;
    const id = layerDragging;
    const from = layerDragFrom;
    layerDragging = "";
    layerDragFrom = "";
    layerDidDrag = true;
    if (event.target.closest("#carryZone")) {
      event.preventDefault();
      layerCarry[id] = true;
    } else if (from === "zone") {
      event.preventDefault();
      layerCarry[id] = false;
    } else {
      return;
    }
    if (typeof flowRender === "function") flowRender();
  });
  document.body.addEventListener("dragend", () => {
    layerDragging = "";
    layerDragFrom = "";
  });
})();
