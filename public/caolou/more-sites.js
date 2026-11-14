GEAR.have.push({
  name: "Osmo Action 4 潜水套装",
  note: "裸机约 145 克。电池盖、USB 盖和镜头盖都拧严时防水 18 米。装上遮光罩就不防水。潜水配件套件用来浮潜。盒子里如果没有 60 米防水壳，就不要按深潜来用。鱼和海龙用它，鸟和鲸仍用 Z8。"
});

Object.assign(SPECIES, {
  seadragon: { name: "草海龙", sci: "Phyllopteryx taeniolatus", sensitive: true },
  dragon: { name: "东部水龙", sci: "Intellagama lesueurii" },
  owl: { name: "猛鸮", sci: "Ninox strenua", sensitive: true },
  platypus: { name: "鸭嘴兽", sci: "Ornithorhynchus anatinus", sensitive: true },
  oystercatcher: { name: "斑蛎鹬", sci: "Haematopus longirostris" },
  fairywren: { name: "华丽细尾鹩莺", sci: "Malurus cyaneus" },
  osprey: { name: "鹗", sci: "Pandion cristatus" },
  cuttlefish: { name: "澳洲巨乌贼", sci: "Sepia apama" },
  octopus: { name: "忧郁章鱼", sci: "Octopus tetricus" },
  flyingfox: { name: "灰头狐蝠", sci: "Pteropus poliocephalus" },
  rockwarbler: { name: "岩莺", sci: "Origma solitaria" },
  heron: { name: "白脸鹭", sci: "Egretta novaehollandiae" },
  shorebird: { name: "迁徙涉禽", sci: "Scolopacidae", sensitive: true },
  glowworm: { name: "萤火虫幼虫", sci: "Arachnocampa richardsae" }
});

function place(p) {
  SITES.push(Object.assign({
    transit: [0, 0],
    noCar: false,
    obscure: true,
    themes: ["鸟"]
  }, p, { no: String(SITES.length + 1).padStart(2, "0") }));
}

function see(id, safety, walk, preset, animals) {
  FIELD[id] = { safety, walk, preset, animals };
}

const snorkel = ["action4", "sling", "water", "field"];
const forest = ["z8", "tele200", "bins", "sling", "water", "field", "cards"];
const tele = ["z8", "tele600", "bins", "monopod", "sling", "water", "field", "cards"];
const cliff = ["z8", "tele600", "monopod", "bins", "shell", "rain", "water", "field"];

place({
  id: "clifton", name: "克利夫顿花园", en: "Clifton Gardens",
  park: "Sydney Harbour National Park · Chowder Bay",
  lat: -33.83971, lng: 151.24653, drive: [25, 40], transit: [45, 70], noCar: true,
  wild: 4, close: 5, day: "两小时浮潜", pack: "Action 4 下水，Z8 留在沙滩。",
  themes: ["海洋"],
  how: "开车经 Military Road 到 Clifton Gardens。也可以从 Circular Quay 转渡轮再走一小段。",
  summary: "港内最值得用 Action 4 的冷门点。草海龙在防鲨网外的海藻里，游客大多只待在沙滩。",
  access: "风平、能见度好再下水。不要游进航道。盖子没拧严不要下水，遮光罩装上时机身不防水。",
  do: [
    { t: "草海龙", when: "上午，水清", lens: "Action 4", odds: "中", text: "沿海藻边缘慢慢漂。看到一条就跟一个来回，然后离开。它停住不动，就是你已经堵到它了。" },
    { t: "章鱼和礁鱼", when: "同一潜", lens: "Action 4", odds: "中高", text: "石缝里的章鱼看见就停。不要把镜头塞进洞里。上岸用淡水冲，自然晾干，不要用热风吹。" }
  ],
  dont: ["不要把 Z8 带进水里。", "18 米是相机标称，不是这次要潜到的深度。这里只浮潜。"]
});
see("clifton",
  { fall: 7, snake: 8, heat: 6, sea: 7, nav: 9, fire: 8, access: 8, wind: 7, rescue: 9, crowd: 6 },
  { km: 1, hours: [1, 2], met: 4, climb: 20, note: "主要是泡在水里。热量按轻松浮潜。" },
  snorkel,
  [{ id: "seadragon", windows: [win(ALL, "上午水清时", "中", "全年都可能在。冬天水更清。")] },
   { id: "octopus", windows: [win(ALL, "白天", "中", "石缝里。看见就停。")] }]
);

place({
  id: "gordons", name: "戈登斯湾", en: "Gordons Bay",
  park: "Gordons Bay Aquatic Reserve",
  lat: -33.91580, lng: 151.26481, drive: [25, 40], transit: [40, 65], noCar: true,
  wild: 4, close: 5, day: "两小时", pack: "Action 4。岸上拍崖再加 24-70。",
  themes: ["海洋"],
  how: "巴士或开车到 Clovelly，走 Gordon's Bay Walking Track 到南端台阶。比 Clovelly 本湾人少。",
  summary: "不能采的保护区。蓝唇鱼和乌贼在步道下面，本地人知道，外地游客很少走到这里。",
  access: "入口是湿台阶。涌浪大就留在岸上。不要站在活的礁石上。",
  do: [
    { t: "保护区浮潜", when: "涌浪小的上午", lens: "Action 4", odds: "高", text: "蓝唇鱼会靠近。春夏乌贼更常停在礁上。广角会把距离显得比真实远，人要停在鱼不改道的地方。" },
    { t: "岸边的鸟", when: "上岸", lens: "70-200", odds: "中", text: "吸蜜鸟在灌丛里，这一段用 Z8。" }
  ],
  dont: ["涌浪发白就不要下台阶。", "不要把相机伸进地毯鲨的洞。"]
});
see("gordons",
  { fall: 5, snake: 8, heat: 6, sea: 4, nav: 8, fire: 8, access: 7, wind: 6, rescue: 8, crowd: 7 },
  { km: 2, hours: [1.5, 2.5], met: 4.5, climb: 40, note: "含一段下礁和浮潜。" },
  snorkel,
  [{ id: "groper", windows: [win([10, 11, 12, 1, 2, 3, 4, 5], "上午", "高", "水清就能看见。")] },
   { id: "cuttlefish", windows: [win([8, 9, 10, 11], "白天", "中", "看就走，不要拨海藻。")] },
   { id: "octopus", windows: [win(ALL, "白天", "中", "石缝。")] }]
);

place({
  id: "capebanks", name: "班克斯角", en: "Cape Banks",
  park: "Kamay Botany Bay · La Perouse",
  lat: -34.00090, lng: 151.24887, drive: [35, 55], transit: [55, 80], noCar: true,
  wild: 4, close: 4, day: "两到三小时", pack: "Action 4 加浮力柄。观鲸的 180-600 留在车上换。",
  themes: ["海洋", "鲸"],
  how: "巴士或开车到 La Perouse 的 Cape Banks。Kurnell 的 Inscription Point 是对岸另一处海龙，海更温和时可以改去那边。",
  summary: "人从这里下水，而不是站在索尔兰德的观鲸台上。草海龙和礁鱼都有。灰护士鲨在附近礁上，不要追。",
  access: "白浪盖过岩台就不要下。北面 Henry Head 可以只站在崖上看鲸。",
  do: [
    { t: "岩台下浮潜", when: "小涌的上午", lens: "Action 4", odds: "中", text: "海龙按克利夫顿的规矩：一个来回就离开。" },
    { t: "崖上的鲸", when: "五月到十一月", lens: "180-600", odds: "中", text: "鲸用 Z8。不要改成下水追。" }
  ],
  dont: ["灰护士鲨用广角要靠得很近才成画面，所以不追、不堵。", "不要在大涌里从岩台跳下去。"]
});
see("capebanks",
  { fall: 4, snake: 7, heat: 5, sea: 3, nav: 8, fire: 7, access: 7, wind: 4, rescue: 7, crowd: 7 },
  { km: 3, hours: [1.5, 3], met: 5, climb: 40, note: "海况不好就只走崖线。" },
  ["action4", "z8", "tele600", "sling", "water", "field", "shell"],
  [{ id: "seadragon", windows: [win(ALL, "小涌的上午", "中", "水混就不要下。")] },
   { id: "whale", windows: [win([5, 6, 7, 9, 10, 11], "白天", "中", "人留在崖上。")] },
   { id: "honeyeater", windows: [win([8, 9, 10, 11], "上午", "高", "岸边灌丛。")] }]
);

place({
  id: "bare", name: "裸岛", en: "Bare Island",
  park: "Kamay Botany Bay · La Perouse",
  lat: -33.99103, lng: 151.23185, drive: [35, 55], transit: [50, 75], noCar: true,
  wild: 4, close: 4, day: "两小时", pack: "Action 4。桥上风大时加冲锋衣。",
  themes: ["海洋"],
  how: "和拉佩鲁斯同一站。浮潜在桥两侧，不要进入没开放的炮台。",
  summary: "桥下是另一处草海龙。比班克斯角好到达，涌浪仍然不讲情面。",
  access: "只在水清、涌小的时候下水。",
  do: [
    { t: "桥两侧浮潜", when: "小涌", lens: "Action 4", odds: "中", text: "海龙、刺河豚和章鱼。浮力柄拴在手腕上。上岸淡水冲。" }
  ],
  dont: ["不要从桥上跳水。", "不要和大涌的班克斯角排在同一天。"]
});
see("bare",
  { fall: 5, snake: 8, heat: 6, sea: 3, nav: 9, fire: 8, access: 7, wind: 5, rescue: 8, crowd: 6 },
  { km: 1, hours: [1, 2], met: 4, climb: 15, note: "路程短，风险在水里。" },
  snorkel,
  [{ id: "seadragon", windows: [win(ALL, "水清的白天", "中", "一个来回就离开。")] }]
);

place({
  id: "longreef", name: "长礁", en: "Long Reef",
  park: "Long Reef Aquatic Reserve",
  lat: -33.74006, lng: 151.31604, drive: [35, 55], transit: [55, 80], noCar: true,
  wild: 4, close: 4, day: "三小时", pack: "退潮带 Action 4。涉禽和鲸用 180-600。",
  themes: ["海洋", "鲸", "鸟"],
  how: "开车或巴士到 Long Reef Headland。退潮前一小时到。",
  summary: "岩台上是蛎鹬，崖外是鲸，水坑里是小动物。冲浪的人多，拿长焦的人少。",
  access: "只在退潮、涌小的时候走到外缘，并且留一条退路。涨潮会切断退路。",
  do: [
    { t: "岩台上的涉禽", when: "退潮", lens: "180-600", odds: "高", text: "蛎鹬和鸻。人停在它们不跑的距离。" },
    { t: "岩池", when: "退潮后", lens: "Action 4", odds: "中", text: "不要翻石头。鲸在崖外用 Z8。" }
  ],
  dont: ["不要翻开石头找章鱼。", "不要在涨潮时还留在外礁。"]
});
see("longreef",
  { fall: 4, snake: 7, heat: 5, sea: 4, nav: 7, fire: 8, access: 7, wind: 4, rescue: 7, crowd: 7 },
  { km: 4, hours: [2, 3], met: 4.5, climb: 30, note: "岩台往返。" },
  ["action4", "z8", "tele600", "bins", "sling", "water", "shell"],
  [{ id: "oystercatcher", windows: [win(ALL, "退潮", "高", "全年在岩台上。")] },
   { id: "whale", windows: [win([6, 7, 9, 10, 11], "白天", "中", "从头地看。")] }]
);

place({
  id: "bushrangers", name: "布殊兰格斯湾", en: "Bushrangers Bay",
  park: "Bass Point Aquatic Reserve",
  lat: -34.58405, lng: 150.87262, drive: [100, 130],
  wild: 5, close: 5, day: "半天加往返", pack: "Action 4 进湾。180-600 留在岬上，不要两套一起下岩石。",
  themes: ["海洋", "鲸"],
  how: "开车经 Shellharbour 到 Bass Point，步道下到海湾。回去是爬坡。",
  summary: "悉尼南边最值得专程浮潜的冷门湾。鱼多，而且是保护区。灰护士鲨在外海礁上，浮潜不要去找。",
  access: "入口岩石滑。涌大时整段取消，改在岬上看鲸。",
  do: [
    { t: "湾里浮潜", when: "上午小涌", lens: "Action 4", odds: "高", text: "大鱼、鳐，春夏有乌贼。鲨鱼如果自己出现，你停住，让它离开。" },
    { t: "岬上观鲸", when: "五月到十一月", lens: "180-600", odds: "中", text: "人比索尔兰德少。风一样大。" }
  ],
  dont: ["不要为了灰护士鲨做近距离广角。", "不要同一天再赶明娜穆拉。"]
});
see("bushrangers",
  { fall: 4, snake: 6, heat: 5, sea: 5, nav: 6, fire: 6, access: 6, wind: 4, rescue: 5, crowd: 8 },
  { km: 4, hours: [2, 3], met: 5.5, climb: 120, note: "下湾容易，上来累。水自带。" },
  ["action4", "z8", "tele600", "sling", "water", "field", "shell"],
  [{ id: "groper", windows: [win([10, 11, 12, 1, 2, 3, 4], "上午", "高", "待在湾里，不游向外海礁。")] },
   { id: "cuttlefish", windows: [win([8, 9, 10, 11], "白天", "中", "不要拨海藻。")] },
   { id: "whale", windows: [win([6, 7, 9, 10], "白天", "中", "只在岬上。")] }]
);

place({
  id: "killalea", name: "基拉利", en: "Killalea",
  park: "Killalea Regional Park",
  lat: -34.59912, lng: 150.86785, drive: [95, 125],
  wild: 4, close: 3, day: "半天", pack: "崖上 180-600。潟湖鸟近就换 70-200。",
  themes: ["鲸", "鸟"],
  how: "开车走 Princes Highway，在 Shell Cove 南面进公园。",
  summary: "潟湖、崖和过路的鲸。可以和布殊兰格斯湾分成两天，不要挤在一起。",
  access: "崖边没有完整栏杆。不要涉进潟湖的鸟群。",
  do: [
    { t: "潟湖水鸟", when: "清晨", lens: "180-600 或 70-200", odds: "高", text: "天鹅、鸭、鹭。站在岸上。" },
    { t: "崖上观鲸", when: "六月、七月和九、十月", lens: "180-600", odds: "中", text: "风大，雨罩套上。" }
  ],
  dont: ["不要下到没退路的岩架。"]
});
see("killalea",
  { fall: 4, snake: 6, heat: 5, sea: 6, nav: 7, fire: 6, access: 7, wind: 4, rescue: 6, crowd: 8 },
  { km: 5, hours: [2, 3], met: 4.5, climb: 80, note: "崖线有起伏。" },
  cliff,
  [{ id: "swan", windows: [win(ALL, "清晨", "高", "潟湖里很常见。")] },
   { id: "whale", windows: [win([6, 7, 9, 10], "上午", "中", "崖上。")] }]
);

place({
  id: "turimetta", name: "图里梅塔", en: "Turimetta",
  park: "Turimetta Headland",
  lat: -33.69498, lng: 151.31150, drive: [45, 70], transit: [70, 95], noCar: true,
  wild: 4, close: 3, day: "两小时", pack: "观鲸用 180-600。退潮才带 Action 4。",
  themes: ["鲸", "海洋", "鸟"],
  how: "B-Line 到 Narrabeen，或开车，再走到 Turimetta Head。",
  summary: "纳拉宾和阿瓦隆之间的小头地。冲浪的人多，拿相机的人少。",
  access: "岩台只在退潮、留有退路时走到外缘。",
  do: [
    { t: "头地观鲸", when: "五月到十一月的上午", lens: "180-600", odds: "中", text: "比巴伦乔伊人少。双筒先找喷气。" },
    { t: "岩池", when: "退潮", lens: "Action 4", odds: "中", text: "不翻石头。" }
  ],
  dont: ["不要在涨潮走到外礁。"]
});
see("turimetta",
  { fall: 4, snake: 7, heat: 5, sea: 4, nav: 8, fire: 8, access: 8, wind: 4, rescue: 7, crowd: 7 },
  { km: 3, hours: [1.5, 2.5], met: 4, climb: 40, note: "头地来回不长。" },
  cliff,
  [{ id: "whale", windows: [win([6, 7, 9, 10, 11], "上午", "中", "崖上。")] },
   { id: "honeyeater", windows: [win([8, 9, 10, 11], "上午", "高", "头地灌丛。")] }]
);

place({
  id: "bangalley", name: "班加利角", en: "Bangalley Head",
  park: "Bangalley Head Reserve · Avalon",
  lat: -33.62746, lng: 151.33929, drive: [55, 80], transit: [80, 110], noCar: true,
  wild: 4, close: 2, day: "两小时", pack: "180-600 和双筒。",
  themes: ["鲸", "鸟"],
  how: "B-Line 到 Avalon，或开车。步道在头地灌丛里。",
  summary: "北部海滩最被忽略的观鲸头地。吸蜜鸟在齐腰的灌丛里，鲸在崖下。",
  access: "崖边无栏。风大。",
  do: [
    { t: "灌丛和鲸", when: "鲸季的上午", lens: "180-600", odds: "鸟高，鲸中", text: "八月到十一月沿花找吸蜜鸟，双筒扫海。不要探出崖。" }
  ],
  dont: ["不要为了角度越过崖边的土。"]
});
see("bangalley",
  { fall: 3, snake: 6, heat: 5, sea: 7, nav: 8, fire: 7, access: 8, wind: 3, rescue: 7, crowd: 8 },
  { km: 3, hours: [1.5, 2.5], met: 4, climb: 50, note: "风是主要消耗。" },
  cliff,
  [{ id: "whale", windows: [win([6, 7, 9, 10], "上午", "中", "头地。")] },
   { id: "honeyeater", windows: [win([8, 9, 10, 11], "上午 10 点前", "高", "海风起来前。")] }]
);

place({
  id: "wolli", name: "沃利溪", en: "Wolli Creek",
  park: "Wolli Creek Regional Park · Girrahween",
  lat: -33.92992, lng: 151.13996, drive: [15, 30], transit: [25, 40], noCar: true,
  wild: 3, close: 3, day: "两小时，适合下班", pack: "70-200。听猛鸮带双筒，头灯只用红光照路。",
  themes: ["鸟"],
  how: "从草楼十几分钟到 Turrella 或 Bardwell Park。火车也停在这些站。",
  summary: "离草楼最近的一块真残林。猛鸮在这里叫。人在步道上听，不要去找它睡觉的树。",
  access: "黄昏以后谷底很暗。不要播放猫头鹰叫声。",
  do: [
    { t: "残林里的小鸟", when: "清晨", lens: "70-200 或 180-600", odds: "高", text: "细尾鹩莺和吸蜜鸟沿主步道就有。" },
    { t: "猛鸮", when: "黄昏，只听", lens: "双筒，不一定举机", odds: "听见中，看见低", text: "看见也只用长焦，拍两张就走。不找栖木，不放录音。" }
  ],
  dont: ["不要离开步道找猫头鹰。", "这是被 suburb 围住的残林，不是原始荒野。"]
});
see("wolli",
  { fall: 7, snake: 6, heat: 7, sea: 10, nav: 7, fire: 7, access: 8, wind: 8, rescue: 9, crowd: 6 },
  { km: 4, hours: [1.5, 2.5], met: 4, climb: 60, note: "谷地有一段下坡。" },
  forest,
  [{ id: "fairywren", windows: [win(ALL, "清晨", "高", "步道边缘。")] },
   { id: "owl", windows: [win(ALL, "黄昏", "听见中，看见低", "只在步道上。")] }]
);

place({
  id: "lights", name: "着陆灯湿地", en: "Landing Lights",
  park: "Landing Lights Wetland · Arncliffe",
  lat: -33.94021, lng: 151.15472, drive: [15, 30], transit: [25, 40], noCar: true,
  wild: 2, close: 4, day: "两小时", pack: "180-600。人留在路上。",
  themes: ["鸟", "湿地"],
  how: "火车到 Wolli Creek 或 Arncliffe。开车不要停进私人车道。",
  summary: "跑道旁边的一小块泥滩。迁徙季的涉禽离草楼只有一站路。不是荒野，是冷门。",
  access: "不要走下泥滩。鸟飞起来就说明你已经太近。",
  do: [
    { t: "涉禽", when: "退潮到半潮", lens: "180-600", odds: "迁徙季高", text: "北迁大约八月到十一月，南迁三月到五月。其余月份只有留鸟。" }
  ],
  dont: ["不要包抄鸟群。", "不要放饵。"]
});
see("lights",
  { fall: 9, snake: 7, heat: 6, sea: 8, nav: 9, fire: 9, access: 8, wind: 7, rescue: 9, crowd: 5 },
  { km: 2, hours: [1, 2], met: 3, climb: 5, note: "站着等，热量低。" },
  tele,
  [{ id: "shorebird", windows: [win([8, 9, 10, 11, 3, 4, 5], "退潮前后", "高", "迁徙季。")] }]
);

place({
  id: "saltpan", name: "盐盘溪", en: "Salt Pan Creek",
  park: "Salt Pan Creek mangroves",
  lat: -33.93959, lng: 151.04005, drive: [25, 40], transit: [40, 60], noCar: true,
  wild: 3, close: 3, day: "两小时", pack: "180-600 或 70-200。",
  themes: ["鸟", "湿地"],
  how: "火车到 Riverwood 或 Padstow，走红树林栈道。",
  summary: "一条被忽略的红树林。翠鸟和鹭比皇家海岸近，也更安静。",
  access: "不要下到泥里。",
  do: [
    { t: "红树林鸟", when: "清晨", lens: "180-600", odds: "中高", text: "白脸鹭很常见。翠鸟要等，不要追着飞。" }
  ],
  dont: ["不要用饵。"]
});
see("saltpan",
  { fall: 8, snake: 6, heat: 6, sea: 9, nav: 8, fire: 8, access: 8, wind: 8, rescue: 8, crowd: 8 },
  { km: 4, hours: [1.5, 2.5], met: 3.5, climb: 15, note: "平路栈道。" },
  tele,
  [{ id: "heron", windows: [win(ALL, "白天", "高", "白脸鹭沿水道。")] },
   { id: "kingfisher", windows: [win(ALL, "清晨", "低", "等，不追。")] }]
);

place({
  id: "manlydam", name: "曼利水坝", en: "Manly Dam",
  park: "Manly Warringah War Memorial Park",
  lat: -33.78278, lng: 151.25389, drive: [35, 55], transit: [50, 75], noCar: true,
  wild: 3, close: 4, day: "三小时", pack: "水龙用 70-200，林鸟用 180-600。",
  themes: ["鸟", "有袋类"],
  how: "巴士或开车到 King Street，Allambie Heights。",
  summary: "北部一块被当成遛狗公园的林子。工作日清晨有水龙、细尾鹩莺，运气好有沙袋鼠。",
  access: "绕坝步道清楚。不要喂鸟。",
  do: [
    { t: "坝边的水龙", when: "上午晒到石头之后", lens: "70-200", odds: "高", text: "它们会停在木头上。人停下，它们才不停。" },
    { t: "林鸟和沙袋鼠", when: "清晨", lens: "180-600", odds: "鸟高，兽低", text: "沙袋鼠在安静的工作日才到步道边。" }
  ],
  dont: ["周末中午人多，不要当成荒野。"]
});
see("manlydam",
  { fall: 7, snake: 6, heat: 6, sea: 10, nav: 8, fire: 7, access: 8, wind: 8, rescue: 8, crowd: 6 },
  { km: 6, hours: [2, 3], met: 4, climb: 80, note: "绕坝有起伏。" },
  forest,
  [{ id: "dragon", windows: [win([9, 10, 11, 12, 1, 2, 3, 4], "上午晒到石头后", "高", "阴天少见。")] },
   { id: "wallaby", windows: [win(ALL, "清晨", "低", "工作日。")] },
   { id: "fairywren", windows: [win(ALL, "清晨", "高", "林缘。")] }]
);

place({
  id: "buffalo", name: "布法罗溪", en: "Buffalo Creek",
  park: "Buffalo Creek Reserve · Hunters Hill",
  lat: -33.81607, lng: 151.13739, drive: [20, 35], transit: [40, 60], noCar: true,
  wild: 3, close: 3, day: "两小时", pack: "70-200 或 180-600。",
  themes: ["鸟", "湿地"],
  how: "开车或巴士到 Hunters Hill，从 Pittwater Road 一侧进红树林。",
  summary: "离草楼很近的一条红树林，几乎没有游客。翠鸟和鹭是目标。",
  access: "栈道和土路。退潮泥泞。",
  do: [
    { t: "红树林", when: "清晨", lens: "180-600", odds: "中", text: "白脸鹭常见，翠鸟要等。" }
  ],
  dont: ["不要下到泥滩。"]
});
see("buffalo",
  { fall: 8, snake: 6, heat: 7, sea: 9, nav: 8, fire: 8, access: 8, wind: 8, rescue: 9, crowd: 8 },
  { km: 3, hours: [1, 2], met: 3.5, climb: 20, note: "短而平。" },
  tele,
  [{ id: "heron", windows: [win(ALL, "白天", "高", "沿溪。")] },
   { id: "kingfisher", windows: [win(ALL, "清晨", "低", "等。")] }]
);

place({
  id: "oatley", name: "奥特利公园", en: "Oatley Park",
  park: "Oatley Park · Georges River",
  lat: -33.98143, lng: 151.06145, drive: [25, 40], transit: [40, 60], noCar: true,
  wild: 3, close: 4, day: "两小时", pack: "70-200。",
  themes: ["鸟"],
  how: "火车到 Oatley，走下坡进公园。开车有门，注意关门时间。",
  summary: "乔治河上的残林头地。水龙、细尾鹩莺，黄昏有时有狐蝠飞过。本地公园，不是国家公园。",
  access: "关门以后不要留在里面。",
  do: [
    { t: "头地和林缘", when: "清晨或黄昏", lens: "70-200", odds: "高", text: "水龙在晒太阳的石头上。狐蝠是路过，不是让你去找营地。" }
  ],
  dont: ["不要把狐蝠过路当成一个可以靠近的营地点。"]
});
see("oatley",
  { fall: 6, snake: 6, heat: 6, sea: 9, nav: 8, fire: 7, access: 6, wind: 7, rescue: 8, crowd: 7 },
  { km: 3, hours: [1.5, 2.5], met: 4, climb: 60, note: "有下坡。" },
  forest,
  [{ id: "dragon", windows: [win([9, 10, 11, 12, 1, 2, 3, 4], "上午", "高", "石头晒热以后。")] },
   { id: "flyingfox", windows: [win(ALL, "黄昏飞过", "中", "只在头顶过路。")] },
   { id: "fairywren", windows: [win(ALL, "清晨", "高", "林缘。")] }]
);

place({
  id: "crosslands", name: "克罗斯兰兹", en: "Crosslands",
  park: "Berowra Valley National Park",
  lat: -33.6235, lng: 151.1145, drive: [50, 75], transit: [70, 100], noCar: true,
  wild: 4, close: 4, day: "半天", pack: "70-200 挂身。水龙很近，180-600 可以留在车上。",
  themes: ["鸟", "有袋类", "雨林"],
  how: "火车到 Berowra，再走或转车到 Crosslands。开车直接到保护区停车场。",
  summary: "火车能到的安静河谷。水龙、琴鸟和沙袋鼠都在，游客很少走到这里。",
  access: "雨后贝罗瓦溪会涨。不要在涨水时过石滩。",
  do: [
    { t: "河边的水龙", when: "上午", lens: "70-200", odds: "高", text: "它们趴在倒木上。人在步道上就够近。" },
    { t: "琴鸟和沙袋鼠", when: "清晨", lens: "70-200 或 180-600", odds: "中", text: "湿林里听琴鸟。沙袋鼠在安静的早晨到草地边缘。" }
  ],
  dont: ["不要离开步道抄近路下到深潭。"]
});
see("crosslands",
  { fall: 6, snake: 5, heat: 6, sea: 10, nav: 6, fire: 6, access: 7, wind: 8, rescue: 6, crowd: 8 },
  { km: 6, hours: [2, 3.5], met: 4.5, climb: 80, note: "沿溪有泥。" },
  forest,
  [{ id: "dragon", windows: [win([9, 10, 11, 12, 1, 2, 3, 4], "上午", "高", "倒木上。")] },
   { id: "lyrebird", windows: [win([5, 6, 7, 8], "清晨", "中", "湿林里听。")] },
   { id: "wallaby", windows: [win(ALL, "清晨", "中", "草地边缘。")] }]
);

place({
  id: "katandra", name: "卡坦德拉", en: "Katandra",
  park: "Katandra Bushland Sanctuary · Ingleside",
  lat: -33.67245, lng: 151.28187, drive: [45, 70],
  wild: 4, close: 3, day: "两到三小时", pack: "70-200 和双筒。",
  themes: ["鸟", "有袋类"],
  how: "开车到 Ingleside 的 Lane Cove Road 入口。开放时间有限，去之前看门口。",
  summary: "一块几乎不上游客地图的灌丛保护区。沙袋鼠和林鸟都在，门常常关着。",
  access: "只在开放日进入。不要翻门。",
  do: [
    { t: "灌丛", when: "开放日的清晨", lens: "70-200 或 180-600", odds: "中", text: "细尾鹩莺和吸蜜鸟在路缘。沙袋鼠在安静的早晨。" }
  ],
  dont: ["不要翻门。", "不要离路去找兽。"]
});
see("katandra",
  { fall: 7, snake: 5, heat: 5, sea: 10, nav: 7, fire: 6, access: 4, wind: 7, rescue: 7, crowd: 9 },
  { km: 4, hours: [1.5, 2.5], met: 4, climb: 50, note: "小径清楚，门是限制。" },
  forest,
  [{ id: "wallaby", windows: [win(ALL, "清晨", "中", "开放日。")] },
   { id: "fairywren", windows: [win(ALL, "上午", "高", "路缘。")] },
   { id: "honeyeater", windows: [win([8, 9, 10, 11], "上午", "高", "开花时。")] }]
);

place({
  id: "deewhy", name: "迪怀潟湖", en: "Dee Why Lagoon",
  park: "Dee Why Lagoon Wildlife Refuge",
  lat: -33.74858, lng: 151.29578, drive: [35, 55], transit: [50, 75], noCar: true,
  wild: 3, close: 4, day: "两小时", pack: "180-600。人留在岸上。",
  themes: ["鸟", "湿地"],
  how: "巴士或开车到 Dee Why 西侧的环湖步道。",
  summary: "海滩后面的野生动物保护区。天鹅、琵鹭和涉禽都有，冲浪的人很少绕到西岸。",
  access: "不要涉进浅水赶鸟。",
  do: [
    { t: "西岸的水鸟", when: "清晨", lens: "180-600", odds: "高", text: "黑天鹅、琵鹭、白脸鹭。长焦让你不必靠近。" }
  ],
  dont: ["不要走进浅水。"]
});
see("deewhy",
  { fall: 8, snake: 7, heat: 6, sea: 8, nav: 9, fire: 8, access: 8, wind: 6, rescue: 8, crowd: 7 },
  { km: 4, hours: [1.5, 2.5], met: 3.5, climb: 10, note: "平路。" },
  tele,
  [{ id: "swan", windows: [win(ALL, "清晨", "高", "湖面上。")] },
   { id: "spoonbill", windows: [win(ALL, "白天", "中", "浅水边缘。")] },
   { id: "heron", windows: [win(ALL, "白天", "高", "岸边。")] }]
);

place({
  id: "deepcreek", name: "深溪", en: "Deep Creek",
  park: "Garigal National Park · Narrabeen",
  lat: -33.70767, lng: 151.27455, drive: [40, 65],
  wild: 4, close: 3, day: "三小时", pack: "70-200。湿林，雨罩带上。",
  themes: ["鸟", "雨林"],
  how: "开车到 Narrabeen Lakes 西端，从 Wakehurst Parkway 一侧进 Garigal。",
  summary: "纳拉宾潟湖西边的湿谷。琴鸟在这里，游客都在东边的湖上划船。",
  access: "雨后小路滑。不要在涨水时过溪。",
  do: [
    { t: "湿谷琴鸟", when: "清晨", lens: "70-200", odds: "中", text: "先听。看见就停。它们比明娜穆拉怕人。" }
  ],
  dont: ["不要播放鸣声。"]
});
see("deepcreek",
  { fall: 6, snake: 5, heat: 6, sea: 10, nav: 5, fire: 6, access: 7, wind: 8, rescue: 6, crowd: 8 },
  { km: 5, hours: [2, 3], met: 5, climb: 100, note: "谷地有泥和根。" },
  forest,
  [{ id: "lyrebird", windows: [win([5, 6, 7, 8], "清晨", "中", "湿林。")] },
   { id: "dragon", windows: [win([9, 10, 11, 12, 1, 2, 3], "上午", "中", "溪边石头。")] }]
);

place({
  id: "resolute", name: "坚毅海滩", en: "Resolute Beach",
  park: "Ku-ring-gai Chase · West Head",
  lat: -33.58490, lng: 151.30699, drive: [80, 110],
  wild: 5, close: 3, day: "半天", pack: "70-200。观鲸再加 180-600，坡陡，不要两支都挂身上。",
  themes: ["有袋类", "鲸", "鸟"],
  how: "开车到 West Head。Resolute Track 从西头路下去，比观景台人少得多。",
  summary: "库灵盖里真正安静的一段。黎明的沙袋鼠在草地，崖外有鲸。不要和 Bobbin Head 的喂鱼混为一谈。",
  access: "下坡陡，回来更陡。夏季火险会封路。",
  do: [
    { t: "清晨的沙袋鼠", when: "开门后尽早", lens: "70-200", odds: "中高", text: "它们在步道边的草地。人停下。" },
    { t: "海滩外的鲸", when: "六月到十月", lens: "180-600", odds: "中", text: "下到海滩再往外看。人留在沙上。" }
  ],
  dont: ["不要喂任何东西。", "不要在封路日翻门。"]
});
see("resolute",
  { fall: 4, snake: 4, heat: 5, sea: 6, nav: 5, fire: 5, access: 5, wind: 5, rescue: 4, crowd: 8 },
  { km: 6, hours: [2.5, 4], met: 6, climb: 180, note: "下去容易，回来是这次的热量。" },
  forest,
  [{ id: "wallaby", windows: [win(ALL, "清晨", "中高", "步道边。")] },
   { id: "whale", windows: [win([6, 7, 9, 10], "上午", "中", "海滩外。")] }]
);

place({
  id: "jibbon", name: "吉本角", en: "Jibbon Head",
  park: "Royal National Park · Bundeena",
  lat: -34.08063, lng: 151.16570, drive: [55, 80], transit: [70, 100], noCar: true,
  wild: 4, close: 3, day: "半天", pack: "180-600。渡轮日用单肩包，不要背空的 65L。",
  themes: ["鲸", "鸟"],
  how: "Cronulla 渡轮到 Bundeena，再走 Jibbon Track。开车则绕皇家南门。",
  summary: "邦迪纳后面的头地。岩刻在步道旁，鲸在崖外，吸蜜鸟在灌丛里。比 Audley 的游客少。",
  access: "岩刻只看，不踩、不拓。渡轮有末班。",
  do: [
    { t: "头地观鲸和鸟", when: "鲸季上午", lens: "180-600", odds: "鸟高，鲸中", text: "先看岩刻，再走到头地扫海。花期拍吸蜜鸟。" }
  ],
  dont: ["不要踩岩刻。", "不要误了末班渡轮。"]
});
see("jibbon",
  { fall: 5, snake: 5, heat: 5, sea: 7, nav: 7, fire: 5, access: 6, wind: 4, rescue: 6, crowd: 7 },
  { km: 6, hours: [2, 3], met: 4.5, climb: 60, note: "沙地，回程慢。" },
  cliff,
  [{ id: "whale", windows: [win([6, 7, 9, 10, 11], "上午", "中", "头地。")] },
   { id: "honeyeater", windows: [win([8, 9, 10, 11], "上午", "高", "灌丛。")] }]
);

place({
  id: "otford", name: "奥特福德", en: "Otford",
  park: "Royal National Park · Palm Jungle",
  lat: -34.21069, lng: 151.00582, drive: [70, 95], transit: [90, 120], noCar: true,
  wild: 4, close: 4, day: "半天", pack: "70-200。雨林湿，雨罩带上。",
  themes: ["鸟", "雨林"],
  how: "火车到 Otford，或开车。Palm Jungle 和 Lady Carrington 是同一批琴鸟，这里人少一个数量级。",
  summary: "皇家南端的雨林。琴鸟在清晨很近，游客几乎都在北面的 Audley。",
  access: "台阶湿。不要播放鸣声。",
  do: [
    { t: "雨林琴鸟", when: "清晨", lens: "70-200", odds: "中高", text: "先听。它们会走到步道上。你停下比你靠近更有用。" }
  ],
  dont: ["不要播放录音。"]
});
see("otford",
  { fall: 5, snake: 5, heat: 6, sea: 8, nav: 6, fire: 5, access: 7, wind: 6, rescue: 6, crowd: 8 },
  { km: 5, hours: [2, 3], met: 5, climb: 160, note: "下到雨林再上来。" },
  forest,
  [{ id: "lyrebird", windows: [win([5, 6, 7, 8], "清晨", "中高", "雨林步道。")] }]
);

place({
  id: "curracurrang", name: "卡拉库朗", en: "Curracurrang",
  park: "Royal National Park coast",
  lat: -34.13771, lng: 151.11476, drive: [65, 95],
  wild: 5, close: 3, day: "大半天", pack: "70-200 挂身。水比你以为的多。",
  themes: ["有袋类", "鲸"],
  how: "地图钉在 Wattamolla 停车场。小湾还要沿海岸步道走，这是皇家里真正人少的一段。",
  summary: "小湾、灌丛和过路的鲸。沙袋鼠比 Audley 怕人。来这里是走路，不是野餐。",
  access: "步道暴晒，水自己带。崖边无栏。夏季火险封园就取消。",
  do: [
    { t: "灌丛里的沙袋鼠", when: "清晨", lens: "70-200 或 180-600", odds: "中", text: "远远看见就停。它们不会像营地里的那样站着等你。" },
    { t: "湾外的鲸", when: "六月到十月", lens: "180-600", odds: "中", text: "人留在崖上。" }
  ],
  dont: ["不要在封园日翻门。", "不要把这一段排进已经很长的海岸穿越。"]
});
see("curracurrang",
  { fall: 4, snake: 4, heat: 4, sea: 6, nav: 4, fire: 4, access: 5, wind: 4, rescue: 4, crowd: 9 },
  { km: 8, hours: [3, 4.5], met: 6, climb: 160, note: "暴晒。水至少两升。" },
  ["z8", "tele200", "pack65", "water", "field", "shell", "bins"],
  [{ id: "wallaby", windows: [win(ALL, "清晨", "中", "比营地怕人。")] },
   { id: "whale", windows: [win([6, 7, 9, 10], "白天", "中", "崖上。")] }]
);

place({
  id: "karloo", name: "卡卢池", en: "Karloo Pool",
  park: "Royal National Park · Heathcote",
  lat: -34.08796, lng: 151.00826, drive: [50, 75], transit: [60, 85], noCar: true,
  wild: 4, close: 4, day: "三小时", pack: "70-200。",
  themes: ["鸟"],
  how: "火车到 Heathcote，走 Karloo Track。开车也可以停在 Heathcote。",
  summary: "希思科特南边的水潭。夏天有人游泳，清晨只有水龙和林鸟。比皇家海岸冷门。",
  access: "雨后石头滑。不要从高处跳进潭。",
  do: [
    { t: "潭边的水龙", when: "上午", lens: "70-200", odds: "高", text: "石头晒热以后它们出来。游泳的人来了就收工。" }
  ],
  dont: ["不要跳水。"]
});
see("karloo",
  { fall: 5, snake: 5, heat: 5, sea: 10, nav: 6, fire: 5, access: 7, wind: 7, rescue: 6, crowd: 7 },
  { km: 5, hours: [2, 3], met: 5, climb: 120, note: "下到潭再上来。" },
  forest,
  [{ id: "dragon", windows: [win([9, 10, 11, 12, 1, 2, 3, 4], "上午", "高", "石头上。")] },
   { id: "lyrebird", windows: [win([5, 6, 7, 8], "清晨", "低", "谷里听。")] }]
);

place({
  id: "kelly", name: "凯利瀑布", en: "Kelly's Falls",
  park: "Stanwell Park rainforest",
  lat: -34.22638, lng: 150.98111, drive: [70, 95], transit: [85, 110], noCar: true,
  wild: 4, close: 4, day: "三小时", pack: "70-200。",
  themes: ["鸟", "雨林"],
  how: "火车到 Stanwell Park，或开车。瀑布步道在村后，不是海边的人行桥。",
  summary: "斯坦韦尔后面的一小块雨林。琴鸟比明娜穆拉怕人，也比明娜穆拉近草楼。",
  access: "台阶湿。瀑布边的石头滑。",
  do: [
    { t: "雨林琴鸟", when: "清晨", lens: "70-200", odds: "中", text: "先听再等。不要追进坡。" }
  ],
  dont: ["不要把海边的观景台当成这个点。"]
});
see("kelly",
  { fall: 5, snake: 5, heat: 6, sea: 8, nav: 7, fire: 6, access: 7, wind: 6, rescue: 7, crowd: 8 },
  { km: 3, hours: [1.5, 2.5], met: 5, climb: 140, note: "短，但是陡。" },
  forest,
  [{ id: "lyrebird", windows: [win([5, 6, 7, 8], "清晨", "中", "雨林。")] }]
);

place({
  id: "carrington", name: "卡林顿瀑布", en: "Carrington Falls",
  park: "Budderoo National Park",
  lat: -34.62380, lng: 150.65489, drive: [100, 130],
  wild: 4, close: 4, day: "半天", pack: "70-200。",
  themes: ["鸟", "雨林"],
  how: "开车经 Robertson。比明娜穆拉的栈道人少，琴鸟一样在。",
  summary: "明娜穆拉的安静替代。瀑布是风景，琴鸟才是来的理由。",
  access: "崖边栏杆不要翻。雨后土路滑。",
  do: [
    { t: "雨林琴鸟", when: "清晨", lens: "70-200", odds: "中高", text: "步道边就能遇到。人停下。" },
    { t: "瀑布环境", when: "鸟安静以后", lens: "24-70", odds: "高", text: "风景用广角。不要为了前景踩过栏杆。" }
  ],
  dont: ["不要翻越瀑布栏杆。"]
});
see("carrington",
  { fall: 4, snake: 5, heat: 6, sea: 10, nav: 7, fire: 6, access: 7, wind: 5, rescue: 5, crowd: 7 },
  { km: 4, hours: [1.5, 2.5], met: 4.5, climb: 80, note: "观景步道。" },
  forest,
  [{ id: "lyrebird", windows: [win([5, 6, 7, 8], "清晨", "中高", "雨林步道。")] },
   { id: "dragon", windows: [win([10, 11, 12, 1, 2, 3], "上午", "中", "溪边。")] }]
);

place({
  id: "macpass", name: "麦夸里山口", en: "Macquarie Pass",
  park: "Macquarie Pass National Park",
  lat: -34.56740, lng: 150.64702, drive: [100, 130],
  wild: 5, close: 3, day: "大半天", pack: "70-200。山谷湿、凉，冲锋衣带上。",
  themes: ["鸟", "雨林"],
  how: "开车走 Illawarra Highway 的山口。Clover Hill 和雨林步道在公路旁，但人很少停。",
  summary: "公路切过的一块真雨林。琴鸟、鞭鸟和岩鹨都在。停下来的人大多只是为了弯道。",
  access: "公路弯急。车要停进正规停车带，不要停在盲弯。",
  do: [
    { t: "雨林鸟", when: "清晨", lens: "70-200 或 180-600", odds: "中", text: "琴鸟在谷底。岩鹨在砂岩上，更小，更要长焦。" }
  ],
  dont: ["不要把车停在盲弯里。"]
});
see("macpass",
  { fall: 5, snake: 5, heat: 6, sea: 10, nav: 6, fire: 6, access: 7, wind: 5, rescue: 5, crowd: 8 },
  { km: 5, hours: [2, 3], met: 5, climb: 150, note: "谷底凉，上来出汗。" },
  forest,
  [{ id: "lyrebird", windows: [win([5, 6, 7, 8], "清晨", "中", "谷底。")] },
   { id: "rockwarbler", windows: [win(ALL, "上午", "低", "砂岩上，用长焦。")] }]
);

place({
  id: "sassafras", name: "檫木谷", en: "Sassafras Gully",
  park: "Blue Mountains · Springwood",
  lat: -33.7035, lng: 150.5705, drive: [70, 95], transit: [80, 110], noCar: true,
  wild: 4, close: 4, day: "大半天", pack: "70-200。",
  themes: ["鸟", "雨林"],
  how: "火车到 Springwood，比温特沃斯瀑布近一站。步道从镇边下到谷底。",
  summary: "火车能到的琴鸟谷，比回声谷人少。来这里是为了谷底，不是为了观景台。",
  access: "下去远，上来更远。天黑前留出上坡时间。",
  do: [
    { t: "谷底琴鸟", when: "清晨第一班车", lens: "70-200", odds: "中高", text: "湿林里先听。它们会横过步道。" }
  ],
  dont: ["不要把上坡留到黄昏。"]
});
see("sassafras",
  { fall: 5, snake: 5, heat: 6, sea: 10, nav: 5, fire: 5, access: 7, wind: 6, rescue: 5, crowd: 8 },
  { km: 8, hours: [3, 4.5], met: 6, climb: 250, note: "下谷容易，回来是热量的大头。" },
  ["z8", "tele200", "pack65", "water", "field", "bins"],
  [{ id: "lyrebird", windows: [win([5, 6, 7, 8], "清晨", "中高", "谷底。")] },
   { id: "rosella", windows: [win(ALL, "上午", "中", "林缘。")] }]
);

place({
  id: "victory", name: "胜利小径", en: "Victory Track",
  park: "Blue Mountains · Faulconbridge",
  lat: -33.6955, lng: 150.5455, drive: [75, 100], transit: [85, 115], noCar: true,
  wild: 4, close: 3, day: "大半天", pack: "70-200。",
  themes: ["鸟", "雨林"],
  how: "火车到 Faulconbridge。Victory Track 下到谷里，游客更常在春木镇停。",
  summary: "和檫木谷同一类：火车、雨林、琴鸟，人更少。",
  access: "上坡留时间。雨后滑。",
  do: [
    { t: "谷里的琴鸟", when: "清晨", lens: "70-200", odds: "中", text: "先听。不要追进坡。" }
  ],
  dont: ["不要和檫木谷排在同一天。两段上坡加在一起太长。"]
});
see("victory",
  { fall: 5, snake: 5, heat: 6, sea: 10, nav: 5, fire: 5, access: 7, wind: 6, rescue: 5, crowd: 8 },
  { km: 7, hours: [2.5, 4], met: 6, climb: 220, note: "回来是陡坡。" },
  ["z8", "tele200", "pack65", "water", "field", "bins"],
  [{ id: "lyrebird", windows: [win([5, 6, 7, 8], "清晨", "中", "谷底。")] }]
);

place({
  id: "putty", name: "帕蒂海滩", en: "Putty Beach",
  park: "Bouddi National Park",
  lat: -33.53074, lng: 151.36321, drive: [100, 130],
  wild: 5, close: 3, day: "大半天", pack: "清晨 70-200。观鲸把 180-600 留在车上，下到海滩再决定。",
  themes: ["有袋类", "鲸"],
  how: "开车到 Killcare 南面的 Putty Beach。比 Maitland Bay 的步道人少。",
  summary: "布迪里更安静的一片沙。黎明沙袋鼠在海滩后面的草地上，鲸从岬外过。",
  access: "公园门按时开。不要在封园日进入。",
  do: [
    { t: "黎明的沙袋鼠", when: "到达后的第一小时", lens: "70-200", odds: "中", text: "你得是当天较早的人。它们退进灌丛就不要跟。" },
    { t: "岬外的鲸", when: "六月到十月", lens: "180-600", odds: "中", text: "人留在沙和崖上。" }
  ],
  dont: ["不要喂。", "不要和 Maitland Bay 排成同一天的两段下坡。"]
});
see("putty",
  { fall: 5, snake: 5, heat: 5, sea: 5, nav: 6, fire: 5, access: 6, wind: 5, rescue: 5, crowd: 8 },
  { km: 4, hours: [2, 3], met: 5, climb: 100, note: "下到海滩再上来。" },
  forest,
  [{ id: "wallaby", windows: [win(ALL, "黎明", "中", "海滩后的草地。")] },
   { id: "whale", windows: [win([6, 7, 9, 10], "上午", "中", "岬外。")] }]
);

place({
  id: "pitttown", name: "皮特敦潟湖", en: "Pitt Town Lagoon",
  park: "Pitt Town Nature Reserve",
  lat: -33.59002, lng: 150.85522, drive: [60, 85],
  wild: 3, close: 4, day: "三小时", pack: "180-600 和双筒。车就是隐蔽处。",
  themes: ["鸟", "湿地"],
  how: "开车经 Windsor 到 Pitt Town 的潟湖边。没有步道系统，人停在路边看。",
  summary: "悉尼西北最被忽略的水鸟点。水位对了，琵鹭、鸭和猛禽都在，几乎没有游客。",
  access: "不要开车下到泥岸，不要走进鸟群。私人农场的门不要进。",
  do: [
    { t: "潟湖水鸟", when: "清晨，水位中等或偏低", lens: "180-600", odds: "高", text: "从车边或路肩拍。鸟飞了就退。" }
  ],
  dont: ["不要进入私人土地。", "不要走到水边赶鸟。"]
});
see("pitttown",
  { fall: 8, snake: 6, heat: 5, sea: 10, nav: 8, fire: 6, access: 7, wind: 6, rescue: 7, crowd: 8 },
  { km: 2, hours: [1.5, 2.5], met: 3, climb: 5, note: "站着等。" },
  tele,
  [{ id: "spoonbill", windows: [win(ALL, "清晨", "中高", "浅水。")] },
   { id: "swan", windows: [win(ALL, "白天", "高", "湖面。")] },
   { id: "seaeagle", windows: [win(ALL, "上午", "低", "头顶经过时再举机。")] }]
);

place({
  id: "bushells", name: "布舍尔斯潟湖", en: "Bushells Lagoon",
  park: "Bushells Lagoon · Wilberforce",
  lat: -33.5755, lng: 150.8085, drive: [70, 95],
  wild: 3, close: 5, day: "三小时", pack: "180-600。",
  themes: ["鸟", "湿地"],
  how: "开车到 Wilberforce 北面。观鸟点在路边，不是一个有游客中心的公园。",
  summary: "悉尼观鸟的人知道、游客完全不知道的潟湖。水鸟可以近到 180-600 很从容。",
  access: "停在路肩，不要堵农场车道。不要进入围栏。",
  do: [
    { t: "路边的水鸟", when: "清晨", lens: "180-600", odds: "高", text: "鸭、琵鹭、鹭、有时是猛禽。人留在路边。" }
  ],
  dont: ["不要翻围栏。", "不要用饵。"]
});
see("bushells",
  { fall: 9, snake: 6, heat: 5, sea: 10, nav: 8, fire: 7, access: 7, wind: 6, rescue: 7, crowd: 9 },
  { km: 1, hours: [1.5, 3], met: 2.5, climb: 0, note: "几乎不走路。热量低。" },
  tele,
  [{ id: "spoonbill", windows: [win(ALL, "清晨", "高", "浅水。")] },
   { id: "heron", windows: [win(ALL, "白天", "高", "岸边。")] },
   { id: "swan", windows: [win(ALL, "白天", "高", "湖面。")] }]
);

place({
  id: "scheyville", name: "沙伊维尔", en: "Scheyville",
  park: "Scheyville National Park",
  lat: -33.59631, lng: 150.89626, drive: [65, 90],
  wild: 4, close: 3, day: "三小时", pack: "180-600 和双筒。林地鸟小，长焦比 70-200 有用。",
  themes: ["鸟"],
  how: "开车到 Scheyville。林地步道从停车场出去，平，但是晒。",
  summary: "坎伯兰平原上剩下的一块林地。没有瀑布，所以没有游客。玫瑰鹦鹉、吸蜜鸟和猛禽是这里的动物。",
  access: "夏天很晒，水自己带。火险季节看封园。",
  do: [
    { t: "林地鸟", when: "清晨", lens: "180-600", odds: "中高", text: "沿主路听。不要为了一只小鸟钻进密林。" }
  ],
  dont: ["不要在封园日进入。"]
});
see("scheyville",
  { fall: 8, snake: 5, heat: 4, sea: 10, nav: 6, fire: 4, access: 6, wind: 6, rescue: 6, crowd: 9 },
  { km: 6, hours: [2, 3], met: 4, climb: 30, note: "平，但是晒。" },
  tele,
  [{ id: "rosella", windows: [win(ALL, "上午", "高", "林缘。")] },
   { id: "honeyeater", windows: [win([8, 9, 10, 11], "上午", "中", "开花的灌丛。")] },
   { id: "wedgetail", windows: [win(ALL, "上午", "低", "上空。")] }]
);

place({
  id: "bents", name: "本茨盆地", en: "Bents Basin",
  park: "Bents Basin State Conservation Area",
  lat: -33.93140, lng: 150.63151, drive: [55, 80],
  wild: 4, close: 4, day: "三小时", pack: "70-200。",
  themes: ["鸟"],
  how: "开车经 Wallacia。夏天有人游泳，清晨是水龙和林鸟。",
  summary: "尼皮恩河边的一个深潭。游客来游泳，清晨的水龙没人拍。",
  access: "不要从高处跳进潭。雨后河会涨。",
  do: [
    { t: "潭边水龙", when: "上午", lens: "70-200", odds: "高", text: "石头晒热以后。游泳的人来了就换成林鸟。" }
  ],
  dont: ["不要跳水。"]
});
see("bents",
  { fall: 5, snake: 5, heat: 5, sea: 10, nav: 7, fire: 6, access: 7, wind: 7, rescue: 6, crowd: 6 },
  { km: 3, hours: [1.5, 2.5], met: 4, climb: 40, note: "短。河边石头滑。" },
  forest,
  [{ id: "dragon", windows: [win([9, 10, 11, 12, 1, 2, 3, 4], "上午", "高", "石头上。")] },
   { id: "rosella", windows: [win(ALL, "上午", "中", "林缘。")] }]
);

place({
  id: "thirlmere", name: "瑟尔米尔湖", en: "Thirlmere Lakes",
  park: "Thirlmere Lakes National Park",
  lat: -34.22681, lng: 150.53984, drive: [70, 100],
  wild: 4, close: 3, day: "半天", pack: "180-600。湖边平，单肩包够。",
  themes: ["鸟"],
  how: "开车经 Picton 南面。湖区没有瀑布，所以比蓝山安静得多。",
  summary: "一串安静的湖。水鸟和林鸟都有，几乎碰不到旅行团。",
  access: "水位低的年份湖会缩。不要把车开进泥岸。",
  do: [
    { t: "湖边", when: "清晨", lens: "180-600", odds: "中高", text: "鸭、鹭、林缘的鹦鹉。人留在岸上。" }
  ],
  dont: ["不要涉进泥里靠近鸟。"]
});
see("thirlmere",
  { fall: 7, snake: 5, heat: 5, sea: 10, nav: 6, fire: 5, access: 7, wind: 6, rescue: 5, crowd: 8 },
  { km: 6, hours: [2, 3], met: 4, climb: 40, note: "湖边平路。" },
  tele,
  [{ id: "heron", windows: [win(ALL, "清晨", "中", "岸边。")] },
   { id: "swan", windows: [win(ALL, "白天", "中", "有水的时候。")] },
   { id: "rosella", windows: [win(ALL, "上午", "中", "林缘。")] }]
);

place({
  id: "cataract", name: "卡塔拉克特水坝", en: "Cataract Dam",
  park: "Cataract Dam bush",
  lat: -34.26559, lng: 150.80320, drive: [60, 90],
  wild: 4, close: 2, day: "三小时", pack: "180-600 和双筒。",
  themes: ["鸟"],
  how: "开车经 Appin。坝上可以走，下面的林子比坝本身更值得。",
  summary: "水坝把游客留在栏杆边。林子里的鹰和鹦鹉没人看。",
  access: "栏杆不要翻。坝区开放时间看门口。",
  do: [
    { t: "坝上和林缘", when: "上午", lens: "180-600", odds: "中", text: "楔尾鹰在谷地上空。鹦鹉在桉树上。坝只是到达点。" }
  ],
  dont: ["不要翻坝区栏杆。"]
});
see("cataract",
  { fall: 5, snake: 5, heat: 5, sea: 10, nav: 7, fire: 5, access: 6, wind: 5, rescue: 6, crowd: 7 },
  { km: 5, hours: [2, 3], met: 4, climb: 60, note: "坝区道路清楚。" },
  tele,
  [{ id: "wedgetail", windows: [win(ALL, "上午到中午", "中", "谷地上空。")] },
   { id: "rosella", windows: [win(ALL, "上午", "中", "林缘。")] }]
);

place({
  id: "tallowa", name: "塔洛瓦", en: "Tallowa Dam",
  park: "Kangaroo Valley",
  lat: -34.77254, lng: 150.31322, drive: [120, 155],
  wild: 4, close: 3, day: "一整天，最好黎明到", pack: "70-200 或 180-600。Action 4 留在岸上当第二机位，不要下水追。",
  themes: ["有袋类", "鸟"],
  how: "开车到 Kangaroo Valley，再下到 Tallowa Dam。鸭嘴兽在黎明的静水，人在岸上。",
  summary: "这一圈里少数还能正经等鸭嘴兽的地方。不保证看见。看见了也留在岸上，不开灯直射。",
  access: "要在天刚亮到。白天来，兽已经进洞。不要找洞口。",
  do: [
    { t: "黎明的鸭嘴兽", when: "天刚亮的一小时", lens: "180-600 或 70-200", odds: "低", text: "找有涟漪、没有人的静水。兽浮起来就拍，它潜入就等下一次。不要沿着水面追，不要打光。" },
    { t: "白天的林鸟", when: "兽没出现以后", lens: "70-200", odds: "中", text: "琴鸟和鹦鹉让这趟不至于空手。不要把白天耗在洞口。" }
  ],
  dont: ["不要找或堵住洞穴。", "不要用闪光灯或头灯照水面。", "不要下水跟着兽。"]
});
see("tallowa",
  { fall: 5, snake: 5, heat: 6, sea: 10, nav: 6, fire: 6, access: 6, wind: 6, rescue: 4, crowd: 8 },
  { km: 4, hours: [2, 3.5], met: 4, climb: 80, note: "早起本身是消耗。步行不长。" },
  tele,
  [{ id: "platypus", windows: [win(ALL, "天刚亮的一小时", "低", "岸上，不开灯。")] },
   { id: "lyrebird", windows: [win([5, 6, 7, 8], "清晨", "中", "兽没出现再转去林子。")] }]
);

place({
  id: "glow", name: "萤火虫隧道", en: "Glow Worm Tunnel",
  park: "Wollemi · Newnes",
  lat: -33.23833, lng: 150.22628, drive: [165, 200],
  wild: 5, close: 4, day: "一整天，偏远", pack: "70-200 留在洞外。洞里 Action 4 用已有的光，不要打灯。",
  themes: ["鸟"],
  how: "开车经 Lithgow 到 Newnes。土路，雨后先看能不能过。这不是日归里轻松的一个。",
  summary: "冷门是因为远。隧道里的萤火虫用它们自己的光。洞外的雨林有琴鸟。",
  access: "洞里湿、暗、低。头灯只在走路时用，拍的时候关掉。雨后土路取消。",
  do: [
    { t: "隧道", when: "进洞后等眼睛适应", lens: "Action 4，关掉灯", odds: "高", text: "萤火虫是幼虫的光。灯会让它们灭。拍完就退出，不要停留太久。" },
    { t: "洞外的琴鸟", when: "清晨，如果天色还早", lens: "70-200", odds: "中", text: "雨林在隧道两端。远的那天往往中午才到，琴鸟就不作为这天的承诺。" }
  ],
  dont: ["不要用闪光灯。", "不要用手电直照萤火虫。", "雨后不要硬开土路。"]
});
see("glow",
  { fall: 5, snake: 5, heat: 6, sea: 10, nav: 4, fire: 5, access: 4, wind: 6, rescue: 3, crowd: 7 },
  { km: 6, hours: [2.5, 4], met: 5, climb: 120, note: "步行不长，开车很长。土路才是这天的风险。" },
  ["action4", "z8", "tele200", "sling", "water", "field", "shell"],
  [{ id: "glowworm", windows: [win(ALL, "进洞后", "高", "关灯再拍。")] },
   { id: "lyrebird", windows: [win([5, 6, 7, 8], "清晨", "低", "只有你到得够早。")] }]
);

place({
  id: "seven", name: "七英里海滩", en: "Seven Mile Beach",
  park: "Seven Mile Beach National Park",
  lat: -34.77284, lng: 150.80668, drive: [125, 160],
  wild: 4, close: 3, day: "一整天", pack: "180-600。海滩风大，雨罩和冲锋衣。",
  themes: ["鸟", "海洋"],
  how: "开车到 Gerroa 北面的公园。涉禽在沙滩和入海口，不要走到鸟群中间。",
  summary: "南边一条很长、很空的海滩。蛎鹬和海雕是目标。比皇家海岸远，也更没人。",
  access: "涨潮会把你和鸟挤到同一条干沙上。退潮再沿水线走，并且绕开鸟。",
  do: [
    { t: "沙滩涉禽", when: "退潮", lens: "180-600", odds: "高", text: "蛎鹬沿水线。你在它们上方的干沙走，不要跟着水线包抄。" }
  ],
  dont: ["不要走进休息的鸟群。"]
});
see("seven",
  { fall: 8, snake: 6, heat: 4, sea: 5, nav: 7, fire: 6, access: 7, wind: 3, rescue: 5, crowd: 8 },
  { km: 6, hours: [2, 3], met: 4, climb: 10, note: "沙地走路比看起来累。风大。" },
  cliff,
  [{ id: "oystercatcher", windows: [win(ALL, "退潮", "高", "水线上方绕行。")] },
   { id: "seaeagle", windows: [win(ALL, "上午", "低", "上空。")] }]
);

place({
  id: "jerusalem", name: "耶路撒冷湾", en: "Jerusalem Bay",
  park: "Ku-ring-gai Chase · Cowan",
  lat: -33.58893, lng: 151.18572, drive: [60, 85], transit: [75, 100], noCar: true,
  wild: 5, close: 3, day: "大半天", pack: "70-200。水自己带。",
  themes: ["鸟", "有袋类"],
  how: "火车到 Cowan，走 Great North Walk 下到海湾。开车能到附近，步道才是这个点。",
  summary: "从火车站下去的一条安静海湾。水龙、林鸟，偶尔沙袋鼠。游客通常在下一站的布鲁克林吃饭。",
  access: "下坡陡，回来留时间。不要赶末班车。",
  do: [
    { t: "湾边", when: "上午", lens: "70-200", odds: "中", text: "水龙在石头上。林鸟用听到的声音决定要不要换 180-600。" }
  ],
  dont: ["不要误了回程的火车。"]
});
see("jerusalem",
  { fall: 4, snake: 5, heat: 5, sea: 8, nav: 5, fire: 5, access: 6, wind: 6, rescue: 5, crowd: 8 },
  { km: 6, hours: [2.5, 4], met: 6, climb: 200, note: "回来是陡坡。" },
  ["z8", "tele200", "pack65", "water", "field", "bins"],
  [{ id: "dragon", windows: [win([9, 10, 11, 12, 1, 2, 3, 4], "上午", "中", "石头上。")] },
   { id: "wallaby", windows: [win(ALL, "清晨", "低", "步道边，不跟进林。")] }]
);

place({
  id: "muogamarra", name: "穆加马拉", en: "Muogamarra",
  park: "Muogamarra Nature Reserve",
  lat: -33.55605, lng: 151.17956, drive: [55, 80],
  wild: 5, close: 3, day: "只在开放季", pack: "70-200 或 180-600。按当年的预约走。",
  themes: ["鸟", "有袋类"],
  how: "只在每年大约八月中到九月开放，而且常要预约。其余十一个月不要来，门是关着的。",
  summary: "悉尼最冷门的一块林地，因为一年只开几周。花、鸟和沙袋鼠都在。没预约就当它不存在。",
  access: "不开放的日子不要翻门，也不要沿铁路走进去。",
  do: [
    { t: "开放季的林地", when: "预约当天的清晨", lens: "180-600 或 70-200", odds: "中", text: "花上的吸蜜鸟是稳的。沙袋鼠看你到的早晚。" }
  ],
  dont: ["不要在关闭季进入。", "不要沿铁路线走。"]
});
see("muogamarra",
  { fall: 6, snake: 4, heat: 6, sea: 10, nav: 5, fire: 6, access: 2, wind: 6, rescue: 5, crowd: 8 },
  { km: 6, hours: [2.5, 4], met: 4.5, climb: 80, note: "只在开放日。封闭是这项安全分最低的原因。" },
  tele,
  [{ id: "honeyeater", windows: [win([8, 9], "上午", "高", "只有开放的那几周。")] },
   { id: "wallaby", windows: [win([8, 9], "清晨", "中", "开放季。")] }]
);

place({
  id: "sandon", name: "桑登角", en: "Sandon Point",
  park: "Sandon Point · Bulli",
  lat: -34.33024, lng: 150.92734, drive: [70, 100], transit: [80, 110], noCar: true,
  wild: 3, close: 3, day: "两小时", pack: "180-600。退潮才加 Action 4。",
  themes: ["鲸", "鸟", "海洋"],
  how: "火车到 Bulli，或开车。头地在车站东边，冲浪者多，观鸟的人少。",
  summary: "伊拉瓦拉的一个小头地。鲸从外面过，退潮有岩池。不是国家公园，所以更没人把它当成拍摄点。",
  access: "岩台只在退潮、有退路时走。",
  do: [
    { t: "头地观鲸", when: "六月到十月", lens: "180-600", odds: "中", text: "比基亚马灯塔人少。" },
    { t: "岩池", when: "退潮", lens: "Action 4", odds: "中", text: "不翻石头。" }
  ],
  dont: ["不要在涨潮留在外礁。"]
});
see("sandon",
  { fall: 4, snake: 7, heat: 5, sea: 4, nav: 8, fire: 8, access: 8, wind: 4, rescue: 7, crowd: 6 },
  { km: 3, hours: [1.5, 2.5], met: 4, climb: 30, note: "头地来回。" },
  cliff,
  [{ id: "whale", windows: [win([6, 7, 9, 10], "上午", "中", "头地。")] },
   { id: "oystercatcher", windows: [win(ALL, "退潮", "中", "岩台。")] }]
);

place({
  id: "boatharbour", name: "船港", en: "Boat Harbour",
  park: "Boat Harbour · Cronulla",
  lat: -34.05573, lng: 151.15146, drive: [45, 70], transit: [70, 95], noCar: true,
  wild: 4, close: 3, day: "两到三小时", pack: "180-600。退潮岩池加 Action 4。",
  themes: ["鲸", "鸟", "海洋"],
  how: "火车到 Cronulla，再往南走到岩台。开车也停在 Cronulla 南边，不要开去索尔兰德。",
  summary: "克罗努拉南边的岩台。鲸、吸蜜鸟和退潮的水坑。索尔兰德人满的日子可以改来这里。",
  access: "岩台湿。白浪上来就退。",
  do: [
    { t: "岩台和鲸", when: "鲸季上午", lens: "180-600", odds: "中", text: "双筒找喷气。灌丛里的吸蜜鸟是鲸不出现时的照片。" },
    { t: "水坑", when: "退潮小涌", lens: "Action 4", odds: "中", text: "不翻石头，不追鱼到浪里。" }
  ],
  dont: ["不要在大涌走到外缘。"]
});
see("boatharbour",
  { fall: 4, snake: 6, heat: 5, sea: 4, nav: 8, fire: 7, access: 8, wind: 4, rescue: 7, crowd: 7 },
  { km: 3, hours: [1.5, 2.5], met: 4, climb: 40, note: "岩台。" },
  cliff,
  [{ id: "whale", windows: [win([6, 7, 9, 10, 11], "上午", "中", "岩台上方。")] },
   { id: "honeyeater", windows: [win([8, 9, 10, 11], "上午", "高", "灌丛。")] }]
);

place({
  id: "walls", name: "岩洞步道", en: "Walls Cave",
  park: "Blue Mountains · Blackheath",
  lat: -33.65691, lng: 150.30210, drive: [100, 130], transit: [110, 140], noCar: true,
  wild: 4, close: 4, day: "半天", pack: "70-200。",
  themes: ["鸟", "雨林"],
  how: "火车到 Blackheath。Walls Cave 在镇的北面，比回声谷人少。",
  summary: "黑希斯一条被忽略的雨林步道。琴鸟在清晨很近。",
  access: "湿岩。不要离开步道进洞的暗处太深。",
  do: [
    { t: "雨林琴鸟", when: "清晨", lens: "70-200", odds: "中高", text: "步道上就能遇到。人停下。" }
  ],
  dont: ["不要离开步道。"]
});
see("walls",
  { fall: 5, snake: 5, heat: 6, sea: 10, nav: 6, fire: 5, access: 7, wind: 5, rescue: 6, crowd: 7 },
  { km: 4, hours: [1.5, 2.5], met: 5, climb: 120, note: "下到谷再上来。" },
  forest,
  [{ id: "lyrebird", windows: [win([5, 6, 7, 8], "清晨", "中高", "雨林。")] },
   { id: "rockwarbler", windows: [win(ALL, "上午", "低", "砂岩。")] }]
);

place({
  id: "mtwilson", name: "威尔逊山", en: "Mount Wilson",
  park: "Mount Wilson rainforest",
  lat: -33.51500, lng: 150.36778, drive: [120, 150],
  wild: 4, close: 4, day: "大半天", pack: "70-200。山谷凉，冲锋衣带上。",
  themes: ["鸟", "雨林"],
  how: "开车经 Bells Line of Road。雨林步道在村子里，没有火车。",
  summary: "蓝山北面的冷凉雨林。琴鸟和玫瑰鹦鹉都在，旅行团很少开上这条路。",
  access: "弯道多。冬天路面会有冰，那天取消。",
  do: [
    { t: "雨林", when: "清晨", lens: "70-200", odds: "中高", text: "琴鸟在步道上。鹦鹉在树冠，需要时换 180-600。" }
  ],
  dont: ["冬天结冰就不要上山。"]
});
see("mtwilson",
  { fall: 6, snake: 6, heat: 7, sea: 10, nav: 7, fire: 7, access: 6, wind: 4, rescue: 4, crowd: 8 },
  { km: 4, hours: [1.5, 2.5], met: 4, climb: 80, note: "步道不长。冷才是消耗。" },
  forest,
  [{ id: "lyrebird", windows: [win([5, 6, 7, 8], "清晨", "中高", "雨林步道。")] },
   { id: "rosella", windows: [win(ALL, "上午", "高", "树冠和林缘。")] }]
);

place({
  id: "grotto", name: "石窟角", en: "Grotto Point",
  park: "Sydney Harbour National Park",
  lat: -33.81812, lng: 151.26118, drive: [30, 50], transit: [45, 70], noCar: true,
  wild: 3, close: 3, day: "两小时", pack: "70-200。港里如果水清，Action 4 可以在浅湾试，海龙不在这里承诺。",
  themes: ["鸟", "海洋"],
  how: "从 Balmoral 或 Castle Rock 走 Grotto Point 步道。灯塔很小，林子比灯塔值得。",
  summary: "港湾里一条本地步道。水龙、吸蜜鸟，浅湾能看鱼。草海龙不要指望，那是克利夫顿的事。",
  access: "步道清楚。浅湾只在风平的时候下水。",
  do: [
    { t: "林缘", when: "清晨", lens: "70-200", odds: "中高", text: "吸蜜鸟和水龙。" },
    { t: "浅湾", when: "风平水清", lens: "Action 4", odds: "中", text: "看看鱼就上来。不要游进航道。" }
  ],
  dont: ["不要把这里当成草海龙点。"]
});
see("grotto",
  { fall: 6, snake: 7, heat: 6, sea: 7, nav: 8, fire: 8, access: 8, wind: 6, rescue: 8, crowd: 6 },
  { km: 4, hours: [1.5, 2.5], met: 4, climb: 50, note: "港湾步道。" },
  ["action4", "z8", "tele200", "sling", "water"],
  [{ id: "honeyeater", windows: [win([8, 9, 10, 11], "上午", "高", "灌丛。")] },
   { id: "dragon", windows: [win([9, 10, 11, 12, 1, 2, 3, 4], "上午", "中", "步道边的石头。")] }]
);

place({
  id: "inscript", name: "铭文角", en: "Inscription Point",
  park: "Kamay Botany Bay · Kurnell",
  lat: -34.00174, lng: 151.22365, drive: [40, 65],
  wild: 4, close: 4, day: "两小时", pack: "Action 4。比班克斯角适合作为海龙的第一天。",
  themes: ["海洋"],
  how: "开车到 Kurnell，走到 Inscription Point。和索尔兰德同一侧公园，人少，海也比外海岩台温和。",
  summary: "草海龙的冷门替代。索尔兰德的人在看鲸，这里的人如果有，是在下水。",
  access: "仍然看涌浪。水混就不上。公园门票按门口。",
  do: [
    { t: "海龙和礁鱼", when: "上午水清", lens: "Action 4", odds: "中", text: "一个来回就离开。不要拨开海藻去找下一条。" }
  ],
  dont: ["不要和班克斯角在大涌的同一天都下。", "不要把 Z8 带下水。"]
});
see("inscript",
  { fall: 6, snake: 7, heat: 6, sea: 5, nav: 8, fire: 7, access: 7, wind: 5, rescue: 7, crowd: 8 },
  { km: 2, hours: [1, 2], met: 4, climb: 20, note: "路程短，风险在水里。" },
  snorkel,
  [{ id: "seadragon", windows: [win(ALL, "水清的上午", "中", "一个来回。")] },
   { id: "groper", windows: [win([10, 11, 12, 1, 2, 3, 4, 5], "上午", "中", "礁缘。")] }]
);

place({
  id: "warrah", name: "瓦拉瞭望台", en: "Warrah Lookout",
  park: "Brisbane Water National Park · Patonga",
  lat: -33.55281, lng: 151.28893, drive: [85, 115],
  wild: 4, close: 3, day: "半天", pack: "180-600。下到 Patonga 的沙滩再换 70-200。",
  themes: ["鲸", "鸟", "有袋类"],
  how: "开车到 Patonga，再上 Warrah Lookout。比布迪更少人把这里当观鲸点。",
  summary: "霍克斯伯里河口的头地。鲸从外面过，灌丛里有吸蜜鸟，清晨路边有时有沙袋鼠。",
  access: "瞭望台有栏杆就留在栏杆里。河口风大。",
  do: [
    { t: "瞭望台", when: "鲸季上午", lens: "180-600", odds: "中", text: "先扫海，再回头拍灌丛里的鸟。" },
    { t: "帕通加清晨", when: "到达得够早", lens: "70-200", odds: "低", text: "沙袋鼠如果在草地边缘，停下。退进林子就不要跟。" }
  ],
  dont: ["不要探出没有栏杆的崖。"]
});
see("warrah",
  { fall: 5, snake: 5, heat: 5, sea: 6, nav: 7, fire: 6, access: 7, wind: 4, rescue: 6, crowd: 8 },
  { km: 4, hours: [1.5, 2.5], met: 4.5, climb: 80, note: "瞭望台来回。" },
  cliff,
  [{ id: "whale", windows: [win([6, 7, 9, 10], "上午", "中", "河口外侧。")] },
   { id: "honeyeater", windows: [win([8, 9, 10, 11], "上午", "高", "灌丛。")] },
   { id: "wallaby", windows: [win(ALL, "清晨", "低", "草地边缘。")] }]
);

place({
  id: "cattai", name: "卡泰", en: "Cattai",
  park: "Cattai National Park",
  lat: -33.56516, lng: 150.92708, drive: [70, 95],
  wild: 4, close: 3, day: "半天", pack: "180-600 和双筒。",
  themes: ["鸟"],
  how: "开车经 Pitt Town 北面。河边林地，没有观景台营业。",
  summary: "霍克斯伯里河边一块安静的公园。水鸟、鹦鹉，黄昏可能听见猛鸮。听见就停在路上。",
  access: "不要进农场。雨后河边泥。",
  do: [
    { t: "河边林地", when: "清晨", lens: "180-600", odds: "中高", text: "鹭和鹦鹉沿河。猛鸮只听，不找树。" }
  ],
  dont: ["不要离路找猫头鹰。"]
});
see("cattai",
  { fall: 7, snake: 5, heat: 5, sea: 10, nav: 6, fire: 5, access: 7, wind: 7, rescue: 6, crowd: 8 },
  { km: 5, hours: [2, 3], met: 4, climb: 40, note: "河边平路。" },
  tele,
  [{ id: "heron", windows: [win(ALL, "清晨", "中", "河边。")] },
   { id: "rosella", windows: [win(ALL, "上午", "高", "林地。")] },
   { id: "owl", windows: [win(ALL, "黄昏", "听见低", "只在路上听。")] }]
);

place({
  id: "belmore", name: "贝尔莫尔瀑布", en: "Belmore Falls",
  park: "Budderoo · Belmore Falls",
  lat: -34.63915, lng: 150.55895, drive: [110, 140],
  wild: 4, close: 3, day: "半天", pack: "70-200。",
  themes: ["鸟", "雨林"],
  how: "开车经 Robertson，继续往瀑布。比费茨罗伊瀑布人少。",
  summary: "另一条被瀑布封面挡住的雨林。清晨的琴鸟比瀑布本身值得。",
  access: "崖边栏杆不要翻。",
  do: [
    { t: "雨林琴鸟", when: "清晨", lens: "70-200", odds: "中", text: "步道上听。瀑布用 24-70，人留在栏杆内。" }
  ],
  dont: ["不要翻栏杆。"]
});
see("belmore",
  { fall: 4, snake: 5, heat: 6, sea: 10, nav: 7, fire: 6, access: 7, wind: 4, rescue: 5, crowd: 8 },
  { km: 3, hours: [1.5, 2.5], met: 4.5, climb: 70, note: "观景步道。" },
  forest,
  [{ id: "lyrebird", windows: [win([5, 6, 7, 8], "清晨", "中", "雨林。")] }]
);

place({
  id: "narrabeen", name: "纳拉宾潟湖", en: "Narrabeen Lagoon",
  park: "Narrabeen Lagoon · western shore",
  lat: -33.71294, lng: 151.28225, drive: [40, 65], transit: [55, 80], noCar: true,
  wild: 3, close: 4, day: "两到三小时", pack: "180-600。",
  themes: ["鸟", "湿地"],
  how: "巴士或开车到潟湖西岸。东边是帆板，西边才是鸟。",
  summary: "湖的西岸比海滩冷门。天鹅、琵鹭和涉禽都在，人留在岸上。",
  access: "不要涉进浅水。",
  do: [
    { t: "西岸水鸟", when: "清晨", lens: "180-600", odds: "高", text: "长焦从岸上拍。鸟飞了就停。" }
  ],
  dont: ["不要走进浅水赶鸟。"]
});
see("narrabeen",
  { fall: 8, snake: 7, heat: 6, sea: 9, nav: 8, fire: 8, access: 8, wind: 7, rescue: 8, crowd: 7 },
  { km: 4, hours: [1.5, 2.5], met: 3.5, climb: 10, note: "平路。" },
  tele,
  [{ id: "swan", windows: [win(ALL, "清晨", "高", "湖面。")] },
   { id: "spoonbill", windows: [win(ALL, "白天", "中", "浅水边缘。")] },
   { id: "shorebird", windows: [win([8, 9, 10, 11, 3, 4, 5], "退潮前后", "中", "迁徙季更多。")] }]
);

place({
  id: "wiana", name: "维亚纳马塔", en: "Wianamatta",
  park: "Wianamatta Nature Reserve",
  lat: -33.69842, lng: 150.71685, drive: [55, 80],
  wild: 4, close: 2, day: "两小时", pack: "180-600。林地鸟小。",
  themes: ["鸟"],
  how: "开车到 Cranebrook 的保护区边界。只走开放的路。",
  summary: "一块为了剩下的林地而划出来的保护区。没有风景，所以没有游客。鹦鹉和吸蜜鸟是照片，不是猛禽的保证。",
  access: "不要开出规定的路。夏天晒，水自带。",
  do: [
    { t: "林地鸟", when: "清晨", lens: "180-600", odds: "中", text: "沿路听。不要钻进密林。" }
  ],
  dont: ["不要离开开放的路。"]
});
see("wiana",
  { fall: 8, snake: 5, heat: 4, sea: 10, nav: 6, fire: 4, access: 6, wind: 6, rescue: 6, crowd: 9 },
  { km: 4, hours: [1.5, 2.5], met: 4, climb: 20, note: "平，晒。" },
  tele,
  [{ id: "rosella", windows: [win(ALL, "上午", "中", "林缘。")] },
   { id: "honeyeater", windows: [win([8, 9, 10, 11], "上午", "中", "开花时。")] }]
);

const bluePin = SITES.find((s) => s.id === "blue");
bluePin.lat = -33.72608;
bluePin.lng = 150.37202;
bluePin.how = "火车到 Wentworth Falls。地图钉在瀑布观景台，不是车站。车站在北面，还要再走下去。";

/* SITES */
