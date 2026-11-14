const SAFETY = [
  ["fall", "坠落", "崖、湿岩、陡坡"],
  ["snake", "蛇虫", "蛇、蜱、蚂蟥"],
  ["heat", "高温缺水", "暴晒、没有水源"],
  ["sea", "海况", "浪、离岸流、盐雾"],
  ["nav", "迷路", "岔路、没信号"],
  ["fire", "火险", "夏天封园的可能"],
  ["access", "封闭", "门禁、步枪场、落石"],
  ["wind", "风寒", "崖上的风和冬天的谷"],
  ["rescue", "救援", "离公路和信号有多远"],
  ["crowd", "惊扰", "拥挤、俯冲、易被喂熟的动物"]
];

const ALL = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const SPECIES = {
  bandicoot: { name: "长鼻袋狸", sci: "Perameles nasuta", sensitive: true },
  honeyeater: { name: "新荷兰吸蜜鸟", sci: "Phylidonyris novaehollandiae" },
  wattlebird: { name: "小垂蜜鸟", sci: "Anthochaera chrysoptera" },
  whale: { name: "座头鲸", sci: "Megaptera novaeangliae" },
  echidna: { name: "短吻针鼹", sci: "Tachyglossus aculeatus" },
  lyrebird: { name: "华丽琴鸟", sci: "Menura novaehollandiae" },
  blackcockatoo: { name: "黄尾黑凤头鹦鹉", sci: "Zanda funerea" },
  kingfisher: { name: "天蓝翠鸟", sci: "Ceyx azureus" },
  goanna: { name: "巨蜥", sci: "Varanus varius" },
  wallaby: { name: "沼泽沙袋鼠", sci: "Wallabia bicolor" },
  seaeagle: { name: "白腹海雕", sci: "Haliaeetus leucogaster" },
  bowerbird: { name: "缎亭鸟", sci: "Ptilonorhynchus violaceus" },
  ganggang: { name: "帮帮凤头鹦鹉", sci: "Callocephalon fimbriatum" },
  rosella: { name: "深红玫瑰鹦鹉", sci: "Platycercus elegans" },
  wedgetail: { name: "楔尾雕", sci: "Aquila audax" },
  spoonbill: { name: "皇家琵鹭", sci: "Platalea regia" },
  swan: { name: "黑天鹅", sci: "Cygnus atratus" },
  groper: { name: "东部蓝唇鱼", sci: "Achoerodus viridis" },
  bristlebird: { name: "东部刺莺", sci: "Dasyornis brachypterus", sensitive: true },
  groundparrot: { name: "地鹦鹉", sci: "Pezoporus wallicus", sensitive: true },
  dolphin: { name: "宽吻海豚", sci: "Tursiops aduncus" },
  fantail: { name: "棕扇尾鹟", sci: "Rhipidura rufifrons" }
};

function win(months, hours, odds, note) {
  return { months, hours, odds, note };
}

const FIELD = {
  northhead: {
    safety: { fall: 5, snake: 6, heat: 6, sea: 7, nav: 8, fire: 7, access: 7, wind: 5, rescue: 9, crowd: 6 },
    walk: { km: 4, hours: [1.5, 2.5], met: 4.5, climb: 80, note: "Fairfax 一带的缓坡。崖边不要探身。" },
    preset: ["z8", "tele200", "sling", "bins", "water", "field", "cards", "power"],
    animals: [
      { id: "bandicoot", windows: [win(ALL, "日落前 40 分钟到天色刚暗", "中高", "全年。坐在步道边等，不要追到灌丛里。")] },
      { id: "honeyeater", windows: [win([8, 9, 10, 11], "日出后到上午 10 点", "高", "花期尾巴在十一月。海风起来后明显变少。"), win([12, 1, 2, 3, 4, 5, 6, 7], "清晨", "中", "花少的月份仍有，只是不停在同一丛花上。")] },
      { id: "wattlebird", windows: [win(ALL, "清晨到上午", "中高", "和吸蜜鸟同一段灌丛。")] },
      { id: "whale", windows: [win([5, 6, 7], "白天，上午风小更好", "中", "北上。"), win([8, 9, 10, 11], "白天", "中", "南下，亲子有时更近。十一月是尾声。")] },
      { id: "echidna", windows: [win(ALL, "暖和的白天", "低", "步道上偶遇。它一卷成球就退开。")] }
    ]
  },
  malabar: {
    safety: { fall: 3, snake: 5, heat: 5, sea: 7, nav: 8, fire: 7, access: 5, wind: 4, rescue: 8, crowd: 7 },
    walk: { km: 4, hours: [1.5, 2.5], met: 5, climb: 70, note: "西线大约 1.2 公里就有崖。东线 5.6 公里，步枪场开放日关闭。" },
    preset: ["z8", "tele600", "monopod", "sling", "bins", "water", "field", "cards", "shell", "rain"],
    animals: [
      { id: "whale", windows: [win([6, 7], "上午", "中高", "北上高峰。"), win([9, 10, 11], "上午", "中", "南下。东线关闭时只在西线看。")] },
      { id: "honeyeater", windows: [win([8, 9, 10, 11], "上午 10 点前", "高", "东部郊区班克西亚灌丛。")] },
      { id: "dolphin", windows: [win(ALL, "白天", "低", "鲸季里一起出现的机会更高。人留在崖上。")] }
    ]
  },
  solander: {
    safety: { fall: 4, snake: 6, heat: 6, sea: 7, nav: 9, fire: 7, access: 6, wind: 3, rescue: 8, crowd: 5 },
    walk: { km: 5, hours: [2, 3.5], met: 4, climb: 40, note: "平台本身很短。走到 Cape Baily 才接近这个距离。" },
    preset: ["z8", "tele600", "monopod", "sling", "bins", "water", "field", "cards", "shell", "rain"],
    animals: [
      { id: "whale", windows: [win([6, 7], "开门后尽早", "高", "北上，平台最稳的几周。"), win([9, 10], "上午", "高", "南下亲子，有时到离崖约 200 米。"), win([5, 8, 11], "上午", "中", "季初和季末。十一月只剩尾巴。")] },
      { id: "dolphin", windows: [win([5, 6, 7, 8, 9, 10, 11], "白天", "中", "经常比鲸更近，但停不了几秒。")] },
      { id: "honeyeater", windows: [win([8, 9, 10], "上午", "高", "平台外的灌丛。人多时比鲸好拍。")] }
    ]
  },
  royal: {
    safety: { fall: 4, snake: 4, heat: 5, sea: 6, nav: 6, fire: 4, access: 6, wind: 6, rescue: 6, crowd: 7 },
    walk: { km: 8, hours: [2.5, 4], met: 4.5, climb: 50, note: "按 Lady Carrington 的半天算。海岸线或过夜会远高于这个热量。" },
    preset: ["z8", "tele200", "sling", "bins", "water", "field", "cards", "power"],
    animals: [
      { id: "lyrebird", windows: [win(ALL, "进门后的头 90 分钟", "高", "全年扒土。"), win([5, 6, 7], "清晨", "高", "求偶和开屏。")] },
      { id: "wallaby", windows: [win(ALL, "清晨，人下沙滩之前", "中高", "Garie、Era 营地边缘比林子里近。"), win([3, 4, 5], "清晨", "高", "幼崽离袋的季节，仍然不要靠近。")] },
      { id: "blackcockatoo", windows: [win(ALL, "上午", "中高", "从头顶过。听到叫声再举 180-600。")] },
      { id: "kingfisher", windows: [win(ALL, "上午，沿 Hacking 河", "低", "不保证。站在桥或平路上等，不要下河岸。")] },
      { id: "goanna", windows: [win([9, 10, 11, 12, 1, 2, 3, 4], "上午晚些，天暖以后", "中高", "Audley 野餐区。不喂。")] },
      { id: "whale", windows: [win([6, 7, 8, 9, 10], "白天", "中", "海岸崖线，不在 Audley。")] },
      { id: "echidna", windows: [win(ALL, "暖天的白天", "低", "步道上停住再拍。")] }
    ]
  },
  heathcote: {
    safety: { fall: 6, snake: 4, heat: 4, sea: 10, nav: 5, fire: 4, access: 7, wind: 7, rescue: 5, crowd: 8 },
    walk: { km: 8, hours: [3, 4], met: 5.5, climb: 180, note: "砂岩台地没有可靠水源，水按这个时长带够。" },
    preset: ["z8", "tele600", "sling", "bins", "water", "field", "cards", "power"],
    animals: [
      { id: "wallaby", windows: [win(ALL, "清晨", "低", "怕人。能拍到通常是远距离。")] },
      { id: "honeyeater", windows: [win([8, 9, 10, 11], "上午", "高", "先用双筒。")] },
      { id: "rosella", windows: [win(ALL, "上午到中午", "中", "桉树上，用 180-600。")] }
    ]
  },
  irrawong: {
    safety: { fall: 7, snake: 5, heat: 6, sea: 10, nav: 7, fire: 6, access: 8, wind: 8, rescue: 8, crowd: 7 },
    walk: { km: 5, hours: [2, 3], met: 4.5, climb: 90, note: "湿地栈道加一段上坡到干林。" },
    preset: ["z8", "tele200", "tele600", "sling", "bins", "water", "field", "cards"],
    animals: [
      { id: "lyrebird", windows: [win(ALL, "清晨", "中高", "干林，瀑布上面那一段。")] },
      { id: "bandicoot", windows: [win(ALL, "日落前后", "中", "步道边。红光只照路。")] },
      { id: "wallaby", windows: [win(ALL, "清晨和黄昏", "中", "谷里，不保证站在开阔处。")] },
      { id: "fantail", windows: [win([9, 10, 11, 12, 1, 2, 3], "上午", "中", "湿林。春天夏天更常见。")] }
    ]
  },
  kuringgai: {
    safety: { fall: 4, snake: 4, heat: 5, sea: 6, nav: 4, fire: 4, access: 5, wind: 5, rescue: 4, crowd: 6 },
    walk: { km: 6, hours: [3, 4.5], met: 6, climb: 220, note: "西头平台很短。下到 The Basin 是陡坡，热量按包含一段下坡的半天算。" },
    preset: ["z8", "tele200", "sling", "bins", "water", "field", "cards", "power", "shell"],
    animals: [
      { id: "whale", windows: [win([5, 6, 7, 8, 9, 10, 11], "上午", "中", "West Head 和 Barrenjoey 方向。")] },
      { id: "lyrebird", windows: [win([5, 6, 7], "清晨", "中高", "西头求偶季较明显。"), win(ALL, "清晨", "中", "其余月份仍会扒土。")] },
      { id: "wallaby", windows: [win(ALL, "黎明", "中高", "The Basin 营地边缘。要预订才进得去过夜。")] },
      { id: "goanna", windows: [win([9, 10, 11, 12, 1, 2, 3, 4], "白天", "中", "营地和野餐区。食物收起来。")] },
      { id: "seaeagle", windows: [win(ALL, "有上升气流的上午", "中", "Pittwater 上空。")] },
      { id: "echidna", windows: [win(ALL, "暖天", "低", "步道偶遇。")] }
    ]
  },
  yeramba: {
    safety: { fall: 8, snake: 6, heat: 7, sea: 9, nav: 8, fire: 7, access: 8, wind: 8, rescue: 8, crowd: 8 },
    walk: { km: 3, hours: [1.5, 2.5], met: 3.5, climb: 20, note: "平的湿地步道，主要是站着等鸟。" },
    preset: ["z8", "tele600", "monopod", "sling", "bins", "water", "cards"],
    animals: [
      { id: "spoonbill", windows: [win(ALL, "清晨到上午", "中高", "浅水里。水位低时更近。")] },
      { id: "swan", windows: [win(ALL, "白天", "高", "黑天鹅经常在，不值得为了靠近下到泥里。")] },
      { id: "kingfisher", windows: [win(ALL, "上午", "低", "沿水面的枝头。等，不追。")] }
    ]
  },
  dharawal: {
    safety: { fall: 5, snake: 4, heat: 4, sea: 10, nav: 4, fire: 4, access: 6, wind: 7, rescue: 3, crowd: 9 },
    walk: { km: 2, hours: [1, 2], met: 4, climb: 40, note: "Maddens Falls 来回不长。没信号，把行程告诉别人。再往里走就要加水和时间。" },
    preset: ["z8", "tele600", "sling", "bins", "water", "field", "cards", "power"],
    animals: [
      { id: "wedgetail", windows: [win(ALL, "上午到中午", "中", "在谷地上空盘。180-600。")] },
      { id: "wallaby", windows: [win(ALL, "清晨", "低", "通常只有背影。")] },
      { id: "rosella", windows: [win(ALL, "上午", "中", "林缘。")] }
    ]
  },
  blue: {
    safety: { fall: 3, snake: 5, heat: 6, sea: 10, nav: 5, fire: 4, access: 6, wind: 4, rescue: 5, crowd: 6 },
    walk: { km: 6, hours: [3, 4.5], met: 6, climb: 280, note: "瀑布镇下到谷地再上来。崖边的步道会因风和火灾关闭。" },
    preset: ["z8", "tele200", "sling", "bins", "water", "field", "cards", "power", "shell"],
    animals: [
      { id: "lyrebird", windows: [win(ALL, "到站后的头两小时", "中高", "谷地和安静步道。"), win([5, 6, 7], "清晨", "高", "求偶。")] },
      { id: "bowerbird", windows: [win([8, 9, 10, 11, 12], "上午", "中", "亭在地上。远远拍，不拿亭上的东西。")] },
      { id: "ganggang", windows: [win(ALL, "上午到中午", "中高", "桉树冠。冬天更常下到镇子附近。")] },
      { id: "rosella", windows: [win(ALL, "白天", "高", "深红玫瑰鹦鹉很常见。")] },
      { id: "wallaby", windows: [win(ALL, "清晨和黄昏", "中", "林缘。不要跟着走到崖边。")] }
    ]
  },
  bouddi: {
    safety: { fall: 4, snake: 4, heat: 4, sea: 5, nav: 5, fire: 5, access: 5, wind: 5, rescue: 4, crowd: 8 },
    walk: { km: 4, hours: [2, 3], met: 6.5, climb: 200, note: "下到 Maitland Bay 容易，回去是爬坡。海湾没有救生员。" },
    preset: ["z8", "tele200", "sling", "bins", "water", "field", "cards", "power"],
    animals: [
      { id: "wallaby", windows: [win(ALL, "到达后的黎明", "中", "海滩后的草地。你得是当天较早的人。")] },
      { id: "whale", windows: [win([6, 7, 9, 10], "上午", "中", "先在上面的观景点看，再决定要不要把长焦留下。")] },
      { id: "honeyeater", windows: [win([8, 9, 10, 11], "上午", "中高", "海岸灌丛。")] }
    ]
  },
  minnamurra: {
    safety: { fall: 6, snake: 6, heat: 7, sea: 10, nav: 9, fire: 7, access: 7, wind: 8, rescue: 6, crowd: 6 },
    walk: { km: 4, hours: [1.5, 2.5], met: 3.5, climb: 60, note: "栈道湿滑。蚂蟥算在蛇虫一项里，裤脚扎进靴子。" },
    preset: ["z8", "tele200", "rain", "sling", "bins", "water", "field", "cards"],
    animals: [
      { id: "lyrebird", windows: [win(ALL, "开门后尽早", "高", "习惯了栈道上的人，所以能很近。它一停步你就停。")] },
      { id: "fantail", windows: [win([9, 10, 11, 12, 1, 2, 3, 4], "上午", "中", "林下层。")] }
    ]
  },
  barren: {
    safety: { fall: 5, snake: 4, heat: 5, sea: 10, nav: 5, fire: 4, access: 6, wind: 3, rescue: 4, crowd: 5 },
    walk: { km: 6, hours: [2.5, 3.5], met: 5, climb: 80, note: "风大。受胁鸟类只在栈道上远远看。" },
    preset: ["z8", "tele600", "bins", "sling", "water", "field", "cards", "shell", "rain"],
    animals: [
      { id: "bristlebird", windows: [win(ALL, "清晨和傍晚", "低", "听见就算成功。不要放录音，不要下栈道。")] },
      { id: "groundparrot", windows: [win([8, 9, 10, 11], "黎明和黄昏", "低", "受胁。鸟自己走出来才拍，不往前迈。")] },
      { id: "honeyeater", windows: [win([8, 9, 10, 11], "上午", "高", "这天才是大概率的照片。")] },
      { id: "rosella", windows: [win(ALL, "白天", "中高", "林缘和停车场附近就有。")] }
    ]
  },
  shelly: {
    safety: { fall: 7, snake: 8, heat: 6, sea: 4, nav: 9, fire: 8, access: 8, wind: 6, rescue: 9, crowd: 6 },
    walk: { km: 2, hours: [1, 1.5], met: 4, climb: 30, note: "热量按岸上走和短时间浮潜。Z8 不下水。礁石上的牡蛎会割脚。" },
    preset: ["action4", "z8", "tele200", "sling", "water"],
    animals: [
      { id: "groper", windows: [win([11, 12, 1, 2, 3, 4], "上午，风平水清", "高", "Action 4 超广角在一两米内就能拍到。跟着鱼，不要追着堵它。")] }
    ]
  }
};

const PACK = [
  { id: "z8", name: "尼康 Z8", qty: 1, g: 910, cost: 4998, cur: "AUD", owned: true, group: "机身", shop: "https://www.digidirect.com.au/products/nikon-z8-mirrorless-camera", shopName: "DigiDirect", spec: "约 910 g。Z 卡口。不出水。" },
  { id: "f3", name: "尼康 F3", qty: 1, g: 760, cost: null, owned: true, group: "机身", spec: "胶片机身。测光用 SR44，不能用 EN-EL15。Z 镜头上不去。" },
  { id: "f4", name: "尼康 F4", qty: 1, g: 1280, cost: null, owned: true, group: "机身", spec: "胶片机身。用 AA，不能用 EN-EL15。Z 镜头上不去。" },
  { id: "tele600", name: "Z 180-600", qty: 1, g: 1955, cost: 2636.08, cur: "AUD", owned: true, group: "镜头", shop: "https://www.digidirect.com.au/products/nikon-nikkor-z-180-600mm-f-5-6-6-3-vr-lens", shopName: "DigiDirect", spec: "约 1955 g。不能加增距镜。不要装 95 mm UV。" },
  { id: "tele200", name: "Z 70-200 f/2.8", qty: 1, g: 1440, cost: 3999, cur: "AUD", owned: true, group: "镜头", shop: "https://www.digidirect.com.au/products/nikon-z-70-200mm-f-2-8-vr-s-lens", shopName: "DigiDirect", spec: "约 1440 g。暗处用这只。一天不和 180-600 同上身。标价是 VR S，不是 S II。" },
  { id: "std", name: "Z 24-70 f/4", qty: 1, g: 500, cost: 899.95, cur: "AUD", owned: true, group: "镜头", shop: "https://www.teds.com.au/products/nikon-z-24-70mm-f4-s-zoom-kit-lens", shopName: "Ted's", spec: "约 500 g。72 mm。卡色滤镜只装这只。不能上 F3 / F4。标价来自白盒套机镜头，不是普通彩盒。" },
  { id: "ais3570", name: "Ai-S 35–70mm f/3.3–4.5", qty: 1, g: null, cost: null, owned: true, group: "镜头", spec: "老镜头。F3 / F4 直接上，Z8 要经 FTZ 一代。" },
  { id: "micro55", name: "55mm f/3.5 Micro-Nikkor-P·C", qty: 1, g: null, cost: null, owned: true, group: "镜头", spec: "微距。近处用。口径不是 72 mm。" },
  { id: "ai50", name: "Ai 50mm f/1.4", qty: 1, g: null, cost: null, owned: true, group: "镜头", spec: "暗处用。口径不是 72 mm。" },
  { id: "ftz", name: "FTZ 一代", qty: 1, g: null, cost: null, owned: true, group: "转接", spec: "只把三颗老镜头接到 Z8。不上 F3 / F4。" },
  { id: "nd8", name: "卡色 ND8", qty: 1, g: null, cost: null, owned: true, group: "滤镜", spec: "72 mm。只上 24-70 f/4。ND 一天一片。" },
  { id: "nd64", name: "卡色 ND64", qty: 1, g: null, cost: null, owned: true, group: "滤镜", spec: "72 mm。只上 24-70 f/4。" },
  { id: "nd1000", name: "卡色 ND1000", qty: 1, g: null, cost: null, owned: true, group: "滤镜", spec: "72 mm。只上 24-70 f/4。" },
  { id: "cpl", name: "卡色 CPL", qty: 1, g: null, cost: null, owned: true, group: "滤镜", spec: "72 mm。只上 24-70 f/4。" },
  { id: "film", name: "胶卷", qty: null, g: 60, cost: null, owned: true, group: "胶片", spec: "若干，不填卷数。高盐岩台不要同一天带。" },
  { id: "rb67", name: "玛米亚 RB67 Pro", qty: 1, g: null, cost: null, owned: true, group: "中画幅", spec: "单独一天。内胆里只放这一台，不和 Z8 同放。克数未填。" },
  { id: "rb137", name: "RB67 C 口 137 mm", qty: 1, g: null, cost: null, owned: true, group: "中画幅", spec: "按你写的 137 mm 记，不改成 127。克数空着。" },
  { id: "x2d", name: "哈苏 X2D", qty: 1, g: null, cost: null, owned: true, group: "中画幅", spec: "和 38V 单独一天。克数未填。" },
  { id: "xcd38", name: "XCD 38V", qty: 1, g: null, cost: null, owned: true, group: "中画幅", spec: "只配 X2D。克数未填。" },
  { id: "action4", name: "Osmo Action 4 潜水套装", qty: 1, g: 320, cost: null, owned: true, group: "水下", spec: "盖严时标称防水 18 m。遮光罩装上就不防水。没有 60 m 壳。只浮潜。" },
  { id: "pack65", name: "65L 巅峰蟒蛇", qty: 1, g: 1650, cost: null, owned: true, group: "包", spec: "约 65 L。约 1650 g。来源 用户说明 2026-11-13。原先 1900 g 的估计不再作为显示数字。照片上是 COBRA 65 和 THE NORTH FACE，没有印 NM62355。款号 NM62355 仍是用户确认。不默认计入行程重量。", source: "用户说明 2026-11-13。款号 NM62355，用户确认。照片用户提供 2026-11-13。", updated: "2026-11-13" },
  { id: "daynf", name: "书包 NF0A8BK4", qty: 1, g: null, cost: null, owned: true, group: "包", spec: "款号照你写的。升数和克数这次不填。", fabric: "BASE CAMP 防撕裂材质", traits: ["耐磨"], shop: "https://img2.thenorthface.com.cn/index.php/product-81870.html", shopName: "北面中国官网", source: "北面中国官网商品页，货号 NF0A8BK4", updated: "2026-11-13", fabricUrl: "https://img2.thenorthface.com.cn/index.php/product-81870.html", fabricRead: "2026-11-13" },
  { id: "sling", name: "挎包 NF0A81DP", qty: 1, g: null, cost: null, owned: true, group: "包", spec: "款号照你写的。升数和克数这次不填。", fabric: "Base Camp Voyager 防水耐磨面料", traits: ["防水", "防雨", "耐磨"], shop: "https://img2.thenorthface.com.cn/index.php/product-62296.html", shopName: "北面中国官网", source: "北面中国官网商品页，货号 NF0A81DP", updated: "2026-11-13", fabricUrl: "https://img2.thenorthface.com.cn/index.php/product-62296.html", fabricRead: "2026-11-13" },
  { id: "insert", name: "阿尔菲斯 L 内胆", qty: 1, g: null, cost: null, owned: true, group: "包", onlyBag: "pack65", spec: "只跟 65L。不是 Peak Design 内胆。克数未填。" },
  { id: "b8fjq", name: "8FJQ DOTKNIT 打底", qty: 1, g: null, cost: 798, cur: "CNY", owned: true, group: "衣服", spec: "Summit 长袖打底，cosmic black。标价按你写的 798 元。", series: "SUMMIT SERIES", fabric: "DOTKNIT 科技面料，双层针织", traits: ["透气", "速干"], shop: "https://img2.thenorthface.com.cn/index.php/product-78019.html", shopName: "北面中国官网", source: "北面中国官网商品页，货号 NF0A8FJQ", updated: "2026-11-13", fabricUrl: "https://img2.thenorthface.com.cn/index.php/product-78019.html", fabricRead: "2026-11-13" },
  { id: "f8h1u", name: "8H1U FUTUREFLEECE", qty: 1, g: null, cost: 1698, cur: "CNY", owned: true, group: "衣服", spec: "标价按你写的约 1698 元。", series: "SUMMIT SERIES", fabric: "FUTUREFLEECE", traits: ["保温", "透气", "速干"], shop: "https://img2.thenorthface.com.cn/index.php/product-87203.html", shopName: "北面中国官网", source: "北面中国官网商品页，货号 NF0A8H1U", updated: "2026-11-13", fabricUrl: "https://img2.thenorthface.com.cn/index.php/product-87203.html", fabricRead: "2026-11-13" },
  { id: "s8bwc", name: "NF0A8BWC 防晒衫", qty: 1, g: null, cost: 1098, cur: "CNY", owned: true, group: "衣服", spec: "Streamlet。页面写防泼水。标价按你写的 1098 元。", series: "溯水系列", traits: ["防雨"], shop: "https://img2.thenorthface.com.cn/index.php/product-84233.html", shopName: "北面中国官网", source: "北面中国官网商品页，货号 NF0A8BWC。页面没有印面料成分。", updated: "2026-11-13", fabricUrl: "https://img2.thenorthface.com.cn/index.php/product-84233.html", fabricRead: "2026-11-13" },
  { id: "s8ezy", name: "NF0A8EZY 防晒衫", qty: 1, g: null, cost: null, owned: true, group: "衣服", spec: "Urban Exploration 城市防晒衫。这一页没有写出面料成分。", source: "浏览器照片 2026-11-13 https://www.thepoizon.ru/product/the-north-face-urban-exploration-jacket-men-s-ebony-green-8900116649041834", updated: "2026-11-13" },
  { id: "s8fzp", name: "NF0A8FZP 防晒层", qty: 1, g: null, cost: null, owned: true, group: "衣服", spec: "男款。页面写 WINDWALL、防风、防泼溅。", fabric: "WINDWALL", traits: ["防风", "防雨"], shop: "https://img2.thenorthface.com.cn/index.php/product-85227.html", shopName: "北面中国官网", source: "北面中国官网商品页，货号 NF0A8FZP", updated: "2026-11-13", fabricUrl: "https://img2.thenorthface.com.cn/index.php/product-85227.html", fabricRead: "2026-11-13" },
  { id: "v8cm4", name: "NF0A8CM4 马甲", qty: 1, g: null, cost: null, owned: true, group: "衣服", spec: "Urban Exploration 工装马甲。不是羽绒。", fabric: "棉、聚酯纤维、聚酰胺", source: "浏览器照片 2026-11-13 https://www.thepoizon.ru/product/the-north-face-urban-exploration-vest-men-s-brown-8900067178161307", updated: "2026-11-13", fabricUrl: "https://www.thepoizon.ru/product/the-north-face-urban-exploration-vest-men-s-brown-8900067178161307", fabricRead: "2026-11-13" },
  { id: "j8en9", name: "NF0A8EN9 防风壳", qty: 1, g: null, cost: null, owned: true, group: "衣服", spec: "FW25 这一页。3XL 仍按你写的。", series: "HKe系列", fabric: "GORE-TEX；SPECTRA 功能性面料拼接", traits: ["防雨", "防水", "防风", "透气", "耐磨"], shop: "https://img2.thenorthface.com.cn/index.php/product-79020.html", shopName: "北面中国官网", source: "北面中国官网商品页，货号 NF0A8EN9，goods_bn TM-8EN9-FW25-D2", updated: "2026-11-13", fabricUrl: "https://img2.thenorthface.com.cn/index.php/product-79020.html", fabricRead: "2026-11-13" },
  { id: "j8a4d", name: "NF0A8A4D 轻雨壳", qty: 1, g: 220, cost: null, owned: true, group: "衣服", spec: "Summit Papsura FUTURELIGHT。约 220 g，按你写的。这一页另写 Avg Weight 224 g，克数没有改。", series: "Summit Series", fabric: "7D x 15D 71 g/m² FUTURELIGHT 3L—100% recycled nylon，tricot backer，non-PFC DWR", traits: ["防雨", "防水", "透气"], source: "浏览器照片 2026-11-13 https://www.ropeclimbpro.com/product/summit-series-papsura-futurelight-jacket-men-s-nf0a8a4d/", updated: "2026-11-13", fabricUrl: "https://www.ropeclimbpro.com/product/summit-series-papsura-futurelight-jacket-men-s-nf0a8a4d/", fabricRead: "2026-11-13" },
  { id: "j831", name: "NF0A831M 山壳", qty: 1, g: null, cost: null, owned: true, group: "衣服", spec: "GORE-TEX Mountain Jacket，2L，再生聚酯，宽松。克数未填。", fabric: "150D 176 g/m² GORE-TEX 2L—100% recycled polyester with non-PFC DWR", traits: ["防水", "防雨"], source: "浏览器照片 2026-11-13 https://www.thenorthface.com/en-us/p/shop-all/rain-gear-592279/mens-gore-tex-mountain-jacket-NF0A831M", updated: "2026-11-13", fabricUrl: "https://www.thenorthface.com/en-us/p/shop-all/rain-gear-592279/mens-gore-tex-mountain-jacket-NF0A831M", fabricRead: "2026-11-13" },
  { id: "j89zj", name: "NF0A89ZJ 防水帽衫", qty: 1, g: null, cost: null, owned: true, group: "衣服", spec: "页面写 FUTURELIGHT 3L 纳米壳。", fabric: "FUTURELIGHT 3L 纳米壳", traits: ["防雨", "防水", "防风", "透气"], shop: "https://img2.thenorthface.com.cn/index.php/product-72369.html", shopName: "北面中国官网", source: "北面中国官网商品页，货号 NF0A89ZJ", updated: "2026-11-13", fabricUrl: "https://img2.thenorthface.com.cn/index.php/product-72369.html", fabricRead: "2026-11-13" },
  { id: "j89zm", name: "NF0A89ZM 三合一", qty: 1, g: null, cost: null, owned: true, group: "衣服", spec: "页面写 FUTURELIGHT 壳和 600 蓬鹅绒内胆。", fabric: "FUTURELIGHT 纳米壳；600蓬鹅绒内胆", traits: ["防雨", "防水", "防风", "透气", "保温"], shop: "https://img2.thenorthface.com.cn/index.php/product-87895.html", shopName: "北面中国官网", source: "北面中国官网商品页，货号 NF0A89ZM", updated: "2026-11-13", fabricUrl: "https://img2.thenorthface.com.cn/index.php/product-87895.html", fabricRead: "2026-11-13" },
  { id: "p12502", name: "NP12502 雨裤", qty: 1, g: null, cost: 34100, cur: "JPY", owned: true, group: "衣服", spec: "日本 Climb Light Zip Pant，三层 GORE-TEX。标价按你写的约 34100 日元。", fabric: "GORE-TEX", traits: ["防水", "防雨"], source: "用户确认。照片：浏览器照片 2026-11-13 https://www.kamoshikasports.com/product/7068", updated: "2026-11-13", fabricUrl: "用户确认", fabricRead: "2026-11-13" },
  { id: "boots", name: "高山靴 NF0A7W51", qty: 1, g: 1103, cost: 280, cur: "USD", owned: true, group: "鞋", spec: "Summit Series Breithorn FUTURELIGHT。一双约 1103 g（半双 551.5 g）。防撕裂鞋面和鞋舌、弹性莱卡领、防刮橡胶鞋头鞋跟围条、FUTURELIGHT 靴套、玻纤尼龙中底梁、Vibram Litebase Mont。步道上穿它。这一页没有写克数。", fabric: "FUTURELIGHT", source: "浏览器照片 2026-11-13 https://www.korayspor.com/en/the-north-face-outdoor-shoes-trekking-boots-and-shoes-m-summit-breithorn-futurelight-nf0a7w51kx91/", updated: "2026-11-13", fabricUrl: "https://www.korayspor.com/en/the-north-face-outdoor-shoes-trekking-boots-and-shoes-m-summit-breithorn-futurelight-nf0a7w51kx91/", fabricRead: "2026-11-13" },
  { id: "sandals", name: "凉鞋", qty: null, g: null, cost: null, owned: true, group: "鞋", spec: "很多，不填双数。不上步道。" },
  { id: "batts", name: "EN-EL15", qty: 4, g: 176, cost: null, owned: true, group: "电力", spec: "家里四块。勾上按出门带两块，约 176 g。不买第五块，不买副厂。" },
  { id: "p20a", name: "充电宝 20000 mAh", qty: 1, g: null, cost: null, owned: true, group: "电力", spec: "两只里的第一只。长焦日带这一只。克数未填。" },
  { id: "p20b", name: "充电宝 20000 mAh 第二只", qty: 1, g: null, cost: null, owned: true, group: "电力", spec: "留在住处。一天不带两只大的。" },
  { id: "p5", name: "充电宝 5000 mAh", qty: 1, g: null, cost: null, owned: true, group: "电力", spec: "短途带这一只。克数未填。" },
  { id: "reader", name: "读卡器", qty: 1, g: null, cost: null, owned: true, group: "住处", packable: false, block: "读卡器留在住处", spec: "已有。不带出门，也不再链到商店。" },
  { id: "mac", name: "MacBook Pro M4 Pro", qty: 1, g: null, cost: null, owned: true, group: "住处", packable: false, block: "电脑留在住处", spec: "已有。不进野外包。尺寸未写。" },
  { id: "ssd", name: "西数外接固态 2TB", qty: 1, g: null, cost: null, owned: true, group: "住处", packable: false, block: "硬盘留在住处", spec: "已有。型号未写，克数未填。" },
  { id: "cables", name: "数据线", qty: null, g: null, cost: null, owned: true, group: "住处", packable: false, block: "线留在住处", spec: "有若干根，不填数量。" },
  { id: "mavic", name: "大疆御 4 创作者套装", qty: 1, g: 1063, cost: null, owned: true, group: "住处", packable: false, block: "公园默认不飞，不进包", spec: "已有。不进野外方案。1063 g 是官网写的飞机起飞重量，不是整箱，电池另计约 332 g。" },
  { id: "cards", name: "CFexpress Type B 一张", qty: 1, g: 20, cost: 749, cur: "AUD", owned: false, group: "专业", shop: "https://www.camerahouse.com.au/sony-cfexpress-type-b-memory-card-g-series-240gb", shopName: "Camera House", spec: "未买。主槽用。勾上并标成已买才计重。" },
  { id: "strap", name: "脚架环背带", qty: 1, g: 100, cost: 135, cur: "AUD", owned: false, group: "专业", shop: "https://www.camerahouse.com.au/peak-design-slide-lite-black-camera-strap", shopName: "Camera House", spec: "锚在 180-600 的脚架环上。" },
  { id: "monopod", name: "碳素独脚架", qty: 1, g: 490, cost: 188, cur: "AUD", owned: false, group: "专业", shop: "https://www.digidirect.com.au/products/benro-msd36c-supdadupa-carbon-fibre-monopod-with-leg-base", shopName: "digiDirect", spec: "未买。观鲸支撑先不满。" },
  { id: "bins", name: "双筒 8×42", qty: 1, g: 610, cost: 460, cur: "AUD", owned: false, group: "专业", shop: "https://www.opticscentral.com.au/vortex-diamondback-hd-8x42-binoculars.html", shopName: "Optics Central", spec: "未买。先找，再举相机。" },
  { id: "rain", name: "180-600 防雨罩", qty: 1, g: 420, cost: 360, cur: "AUD", owned: false, group: "专业", shop: "https://www.camerapro.com.au/14872-think-tank-hydrophobia-dm-300-600-v3-rain-cover.html", shopName: "CameraPro", spec: "未买。罩的是机器，不是人。" },
  { id: "cube", name: "Peak Design 内胆（备选）", qty: 1, g: 400, cost: 170, cur: "AUD", owned: false, group: "专业", shop: "https://www.teds.com.au/products/peak-design-camera-cube-med", shopName: "Ted's", spec: "不是你现在的内胆。你的是阿尔菲斯 L。" },
  { id: "tc14", name: "Z TC-1.4x", qty: 1, g: 220, cost: 999, cur: "AUD", owned: false, group: "专业", shop: "https://www.camerahouse.com.au/nikon-nikkor-z-tc-1-4x-teleconverter-lens", shopName: "Camera House", spec: "只加在 70-200 上。不能加在 180-600 上。" },
  { id: "clean", name: "气吹和镜头布", qty: 1, g: 40, cost: 25, cur: "AUD", owned: false, group: "专业", spec: "未买。没有单独的商店链接。" },
  { id: "plb", name: "个人示位标", qty: 1, g: 116, cost: 440, cur: "AUD", owned: false, group: "应急", shop: "https://www.snowys.com.au/rescueme-plb1", shopName: "Snowys", spec: "未买。有信号先打 000。买回要在 AMSA 注册。" },
  { id: "snake", name: "蛇伤压力绷带两条", qty: 2, g: 80, cost: 18, cur: "AUD", owned: false, group: "应急", shop: "https://www.wildfiresports.com.au/aeroform-snake-bite-bandage-with-indicator-10cm-x", shopName: "Wildfire", spec: "压力固定，打 000。不切开、不吸、不冰敷。不要和小急救包重复勾。" },
  { id: "lamp", name: "头灯", qty: 1, g: 110, cost: 176, cur: "AUD", owned: false, group: "应急", shop: "https://www.snowys.com.au/hiking-headlamps", shopName: "Snowys", spec: "商店是分类页，不是某一款。选带红光的。红光只照路。" },
  { id: "field", name: "小急救包", qty: 1, g: 220, cost: 55, cur: "AUD", owned: false, group: "应急", spec: "未买。不要和蛇伤绷带、头灯重复计算。" },
  { id: "water", name: "水 2 升", qty: 1, g: 2000, cost: null, owned: true, group: "补给", spec: "勾上按 2 升。" },
  { id: "airtag", name: "AirTag", qty: 2, g: 22, cost: null, owned: true, group: "其他", spec: "两枚。" },
  { id: "watch", name: "Apple Watch", qty: 1, g: null, cost: null, owned: true, group: "其他", spec: "型号没写，克数空着。" },
  { id: "plbnpws", name: "NPWS 示位标", qty: 1, g: null, cost: 0, cur: "AUD", owned: true, borrow: true, group: "应急", spec: "免费借用，不是已购买。出发前在柜台借，不是放在观景台。页面没写克数。" },
  { id: "cpl77", name: "卡色 MRC CPL II 77 mm", qty: 1, g: null, cost: null, owned: false, group: "滤镜", shop: "https://www.kaseaustralia.com.au/kase-mrc-cpl-ii-77mm-hd-multi-coated-optical-glass", shopName: "Kase Australia", spec: "未购买。只适合 77 mm 口径。不上 24-70，也不上 180-600。70-200 的口径这次没对上官网，所以先不计重。" },
  { id: "nhpot", name: "Naturehike 徒步铝锅", qty: 1, g: 1500, cost: 69.99, cur: "AUD", owned: false, group: "露营", shop: "https://www.naturehike.au/products/wild-trekking-aluminum-alloy-pot", shopName: "Naturehike Australia", spec: "未购买。克数和价格来自澳洲店商品记录。帐篷、垫子、水袋可以用这个牌子。示位标和急救不要用它。" },
  { id: "nhpole", name: "Naturehike 碳素杖", qty: 1, g: 1000, cost: 79.9, cur: "AUD", owned: false, group: "露营", shop: "https://www.naturehike.au/products/carbon-fiber-trekking-poles", shopName: "Naturehike Australia", spec: "未购买。店内记录 1000 g、79.90 澳元。" },
  { id: "nhpad", name: "Naturehike Tuye 充气垫", qty: 1, g: 600, cost: 99, cur: "AUD", owned: false, group: "过夜", shop: "https://www.naturehike.au/products/tuye-series-ultra-light-inflatable-sleeping-pad-r-value-4-6-minimum-temperature-20-4", shopName: "Naturehike Australia", spec: "未购买。店内记录 600 g、99 澳元。" },
  { id: "nhtent", name: "Naturehike Cloud UP 2 帐篷", qty: 1, g: 2500, cost: 199, cur: "AUD", owned: false, group: "过夜", shop: "https://www.naturehike.au/products/cloud-up-2-people-3-season-camping-tent", shopName: "Naturehike Australia", spec: "未购买。店内记录 2500 g、199 澳元。" },
  { id: "nhbag", name: "Naturehike CW295 睡袋", qty: 1, g: 600, cost: 149.99, cur: "AUD", owned: false, group: "过夜", shop: "https://www.naturehike.au/products/cw295-duck-down-envelope-sleeping-bag", shopName: "Naturehike Australia", spec: "未购买。店内记录 600 g、149.99 澳元。" },
  { id: "stsdry", name: "Sea to Summit 轻量干袋", qty: 1, g: 121, cost: 29.99, cur: "AUD", owned: false, group: "露营", shop: "https://seatosummit.com.au/products/lightweight-dry-sack", shopName: "Sea to Summit", spec: "未购买。店内记录 121 g、29.99 澳元。" },
  { id: "stsmat", name: "Sea to Summit Ether Light XR 垫", qty: 1, g: 560, cost: 299.99, cur: "AUD", owned: false, group: "过夜", shop: "https://seatosummit.com.au/products/ether-light-xr-insulated-air-sleeping-pad", shopName: "Sea to Summit", spec: "未购买。店内记录 560 g、299.99 澳元。" },
  { id: "stsnet", name: "Sea to Summit 防蚊头网", qty: 1, g: 37, cost: 17.99, cur: "AUD", owned: false, group: "露营", shop: "https://seatosummit.com.au/products/mosquito-head-net", shopName: "Sea to Summit", spec: "未购买。店内记录 37 g、17.99 澳元。" },
  { id: "svhike", name: "SURVIVAL Hiking First Aid Kit", qty: 1, g: 515, cost: 79.95, cur: "AUD", owned: false, group: "应急", shop: "https://survivalfirstaidkits.com/products/survival-hiking-first-aid-kit", shopName: "SURVIVAL", spec: "未购买。店内记录 515 g、79.95 澳元。蛇伤仍是压力固定后打 000。" },
  { id: "svtrail", name: "SURVIVAL Trail First Aid Kit", qty: 1, g: 254, cost: 71.95, cur: "AUD", owned: false, group: "应急", shop: "https://survivalfirstaidkits.net.au/products/survival-trail-first-aid-kit", shopName: "SURVIVAL", spec: "未购买。店内记录 254 g、71.95 澳元。" },
  { id: "svdry", name: "SURVIVAL 防水干袋", qty: 1, g: 260, cost: 29.95, cur: "AUD", owned: false, group: "露营", shop: "https://survivalfirstaidkits.com/products/survival-waterproof-dry-bag", shopName: "SURVIVAL", spec: "未购买。店内记录 260 g、29.95 澳元。" },
  { id: "sjsnake", name: "St John 蛇伤绷带 10 cm × 4.5 m", qty: 2, g: null, cost: 7.95, cur: "AUD", owned: false, group: "应急", shop: "https://shop.stjohn.org.au/products/bandage-snake-bite-4-5m", shopName: "St John", spec: "未购买。页面标价 7.95 澳元，没写克数。压力固定，打 000。不切开、不吸、不冰敷。" },
  { id: "sjmod", name: "St John 户外和蛇伤模块", qty: 1, g: null, cost: 39.95, cur: "AUD", owned: false, group: "应急", shop: "https://shop.stjohn.org.au/products/outdoor-snakebite-first-aid-module", shopName: "St John", spec: "未购买。页面标价 39.95 澳元，没写克数。" },
  { id: "sjbag", name: "St John 中号空包", qty: 1, g: null, cost: 54.9, cur: "AUD", owned: false, group: "应急", shop: "https://shop.stjohn.org.au/products/medium-first-aid-empty-bag", shopName: "St John", spec: "未购买。页面标价 54.90 澳元，没写克数。" },
  { id: "tacsnake", name: "TacMed 蛇伤绷带", qty: 1, g: null, cost: 9.95, cur: "AUD", owned: false, group: "应急", shop: "https://tacmedaustralia.com.au/products/snake-bite-bandage", shopName: "TacMed", spec: "未购买。页面标价 9.95 澳元，没写克数。" },
  { id: "hpcontour", name: "HydraPak Contour 2 L", qty: 1, g: null, cost: 94.99, cur: "AUD", owned: false, group: "露营", shop: "https://hydrapak.com.au/products/contour-2l-reservoir", shopName: "HydraPak", spec: "未购买。页面标价 94.99 澳元，没写克数。" },
  { id: "cbcrux", name: "CamelBak Crux 2 L", qty: 1, g: null, cost: 90, cur: "AUD", owned: false, group: "露营", shop: "https://camelbak.com.au/products/crux-2l-reservoir", shopName: "CamelBak", spec: "未购买。页面标价 90 澳元，没写克数。" },
  { id: "aidstrip", name: "创可贴和水泡贴", qty: 1, g: null, cost: null, owned: false, group: "应急", shop: "https://shop.stjohn.org.au/collections/wound-care", shopName: "St John", spec: "未购买。这是分类页，不是某一款。克数和单价空着。" },
  { id: "aidgauze", name: "无菌纱布和不粘敷料", qty: 1, g: null, cost: null, owned: false, group: "应急", shop: "https://shop.stjohn.org.au/collections/wound-care", shopName: "St John", spec: "未购买。分类页。克数空着。" },
  { id: "aidtape", name: "医用胶带", qty: 1, g: null, cost: null, owned: false, group: "应急", shop: "https://shop.stjohn.org.au/collections/refills-supplies", shopName: "St John", spec: "未购买。分类页。克数空着。" },
  { id: "aidwipe", name: "消毒湿巾", qty: 1, g: null, cost: null, owned: false, group: "应急", shop: "https://shop.stjohn.org.au/collections/refills-supplies", shopName: "St John", spec: "未购买。分类页。克数空着。" },
  { id: "aidwrap", name: "弹性绷带和三角巾", qty: 1, g: null, cost: null, owned: false, group: "应急", shop: "https://shop.stjohn.org.au/collections/refills-supplies", shopName: "St John", spec: "未购买。分类页。克数空着。" },
  { id: "aidtool", name: "镊子、小剪刀、一次性手套", qty: 1, g: null, cost: null, owned: false, group: "应急", shop: "https://shop.stjohn.org.au/collections/refills-supplies", shopName: "St John", spec: "未购买。分类页。克数空着。" },
  { id: "aidmeds", name: "止痛药、抗过敏药、个人药物", qty: 1, g: null, cost: null, owned: false, group: "应急", spec: "未购买。没有单独商品页，不编链接。克数空着。" },
  { id: "aidors", name: "口服补液盐", qty: 1, g: null, cost: null, owned: false, group: "应急", spec: "未购买。没有单独商品页。克数空着。" },
  { id: "aidpen", name: "防水记号笔", qty: 1, g: null, cost: null, owned: false, group: "应急", spec: "未购买。没有单独商品页。克数空着。" },
  { id: "aidblank", name: "保温毯", qty: 1, g: null, cost: null, owned: false, group: "应急", shop: "https://tacmedaustralia.com.au/collections/outdoor-remote-first-aid-kits/first-aid", shopName: "TacMed", spec: "未购买。分类页，不是某一条毯子。克数空着。" }
];
