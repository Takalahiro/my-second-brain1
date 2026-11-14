(function () {
  const WHEN = "2026-11-12";
  const shops = {
    kase: ["https://www.kaseaustralia.com.au/", "Kase Australia"],
    ch: ["https://www.camerahouse.com.au/", "Camera House"],
    digi: ["https://www.digidirect.com.au/", "DigiDirect"],
    snow: ["https://www.snowys.com.au/", "Snowys"],
    paddy: ["https://www.paddypallin.com.au/", "Paddy Pallin"],
    ana: ["https://www.anacondastores.com/en-au", "Anaconda"],
    wound: ["https://shop.stjohn.org.au/collections/wound-care", "St John"],
    refill: ["https://shop.stjohn.org.au/collections/refills-supplies", "St John"],
    stj: ["https://shop.stjohn.org.au/collections/first-aid-kits", "St John"],
    tac: ["https://tacmedaustralia.com.au/collections/outdoor-remote-first-aid-kits/first-aid", "TacMed"],
    surv: ["https://survivalfirstaidkits.com/collections/outdoor", "SURVIVAL"],
    head: ["https://www.snowys.com.au/hiking-headlamps", "Snowys"],
    water: ["https://www.anacondastores.com/en-au/c/hydration-packs", "Anaconda"],
    bogong: ["https://www.bogong.com.au/", "Bogong"],
    bcf: ["https://www.bcf.com.au/boating/marine-safety/plb", "BCF"],
    garmin: ["https://www.garmin.com/en-AU/", "Garmin"]
  };
  function add(row) {
    if (PACK.some((item) => item.id === row.id)) return;
    PACK.push(row);
  }
  function cat(id, name, fine, key, scene, compat, extra) {
    const shop = shops[key];
    add(Object.assign({
      id, name, qty: 1, g: null, cost: null, cur: "AUD", owned: false, fine,
      shop: shop[0], shopName: shop[1],
      source: "类目链接，单品未核对", updated: WHEN,
      scene, compat, spec: `${scene}。${compat}`
    }, extra || {}));
  }
  const tech = "需要专业训练｜需要确认路线许可｜不计入普通露营方案";
  function climb(id, name) {
    cat(id, name, "技术活动", "bogong", "技术活动", tech, { tech: true });
  }

  const owned = "已有装备";
  const known = "2026-11-12";
  const priced = "2026-11-13";
  const meta = {
    z8: { fine: "相机", source: "DigiDirect 商品页 Nikon Z8 Body", updated: priced, scene: "机身", compat: "Z 卡口。不出水。" },
    f3: { fine: "相机", source: owned, updated: known, scene: "胶片", compat: "Z 镜头上不去。" },
    f4: { fine: "相机", source: owned, updated: known, scene: "胶片", compat: "Z 镜头上不去。" },
    action4: { fine: "相机", source: owned, updated: known, scene: "浮潜", compat: "盖严防水 18 m。遮光罩装上就不防水。" },
    rb67: { fine: "相机", source: owned, updated: known, scene: "中画幅", compat: "不和 Z8 同放。" },
    x2d: { fine: "相机", source: owned, updated: known, scene: "中画幅", compat: "和 38V 单独一天。" },
    tele600: { fine: "镜头", source: "DigiDirect 商品页 Nikon NIKKOR Z 180-600mm f/5.6-6.3 VR Lens", updated: priced, scene: "野生动物", compat: "不能加增距镜。" },
    tele200: { fine: "镜头", source: "DigiDirect 商品页 Nikon Z 70-200mm f/2.8 VR S Lens。不是 S II。", updated: priced, scene: "暗处", compat: "不和 180-600 同一天上身。" },
    std: { fine: "镜头", source: "Ted's 商品页。标题是 Nikon Z 24-70mm F4 S Zoom - Kit Lens - White Box。", updated: priced, scene: "环境", compat: "72 mm。卡色只装这只。" },
    ais3570: { fine: "镜头", source: owned, updated: known, scene: "老镜头", compat: "Z8 要经 FTZ。" },
    micro55: { fine: "镜头", source: owned, updated: known, scene: "微距", compat: "不是 72 mm。" },
    ai50: { fine: "镜头", source: owned, updated: known, scene: "暗处", compat: "不是 72 mm。" },
    ftz: { fine: "镜头", source: owned, updated: known, scene: "转接", compat: "只把老镜头接到 Z8。" },
    rb137: { fine: "镜头", source: owned, updated: known, scene: "中画幅", compat: "137 mm，不改成 127。" },
    xcd38: { fine: "镜头", source: owned, updated: known, scene: "中画幅", compat: "只配 X2D。" },
    tc14: { fine: "镜头", source: "Camera House", updated: known, scene: "70-200", compat: "只加在 Z 70-200/2.8 上，不加在 180-600 上。" },
    nd8: { fine: "滤镜", source: owned, updated: known, scene: "慢门", compat: "72 mm。只上 24-70。一次一片。" },
    nd64: { fine: "滤镜", source: owned, updated: known, scene: "慢门", compat: "72 mm。只上 24-70。一次一片。" },
    nd1000: { fine: "滤镜", source: owned, updated: known, scene: "慢门", compat: "72 mm。只上 24-70。一次一片。" },
    cpl: { fine: "滤镜", source: owned, updated: known, scene: "反光", compat: "72 mm。只上 24-70。" },
    cpl77: { fine: "滤镜", source: "Kase Australia 商品页，克数和价格未记录", updated: known, scene: "反光", compat: "77 mm。只上 70-200。不上 24-70，不上 180-600。" },
    monopod: { fine: "支撑", source: "DigiDirect", updated: known, scene: "长焦", compat: "Benro。承重未记录。" },
    strap: { fine: "携带与防护", source: "Camera House", updated: known, scene: "180-600", compat: "锚在脚架环上。" },
    rain: { fine: "携带与防护", source: "CameraPro", updated: known, scene: "雨", compat: "罩机器，不罩人。" },
    cube: { fine: "携带与防护", source: "Ted's", updated: known, scene: "内胆", compat: "不是阿尔菲斯 L。" },
    insert: { fine: "携带与防护", source: owned, updated: "未记录", scene: "内胆", compat: "只跟 65L。克数未记录。" },
    batts: { fine: "电力与存储", source: owned, updated: known, scene: "Z8", compat: "出门按两块计。不买副厂。" },
    p20a: { fine: "电力与存储", source: owned, updated: "未记录", scene: "长焦日", compat: "牌子未写。克数未记录。" },
    p20b: { fine: "电力与存储", source: owned, updated: "未记录", scene: "住处", compat: "第二只大容量。克数未记录。" },
    p5: { fine: "电力与存储", source: owned, updated: "未记录", scene: "短途", compat: "克数未记录。" },
    cards: { fine: "电力与存储", source: "Camera House", updated: known, scene: "主槽", compat: "CFexpress Type B。" },
    reader: { fine: "电力与存储", source: owned, updated: "未记录", scene: "住处", compat: "无购买链接。不进公园包。" },
    ssd: { fine: "电力与存储", source: owned, updated: "未记录", scene: "住处", compat: "不进公园包。克数未记录。" },
    mac: { fine: "电力与存储", source: owned, updated: "未记录", scene: "住处", compat: "不进公园包。" },
    cables: { fine: "电力与存储", source: owned, updated: "未记录", scene: "住处", compat: "不进公园包。" },
    mavic: { fine: "相机", source: "DJI 官网飞机起飞重量", updated: known, scene: "住处", compat: "公园默认不飞。" },
    bins: { fine: "观测", source: "Optics Central", updated: known, scene: "先找再拍", compat: "8×42。" },
    lamp: { fine: "照明", source: "Snowys 头灯分类页，不是某一款", updated: known, scene: "天黑回程", compat: "要有红光。红光只照路。" },
    plb: { fine: "求救", source: "Snowys", updated: known, scene: "无信号", compat: "有信号先打 000。" },
    plbnpws: { fine: "求救", source: "NPWS 免费借用页，克数未记录", updated: known, scene: "蓝山线出发前", compat: "不是购买件。不进还需金额。" },
    water: { fine: "饮水", source: owned, updated: known, scene: "当天的水", compat: "勾上按 2 升。" },
    nhtent: { fine: "庇护", source: "Naturehike Australia", updated: known, scene: "过夜", compat: "这是 Cloud UP 2，不是单人帐篷那一行。" },
    nhbag: { fine: "睡眠", source: "Naturehike Australia", updated: known, scene: "过夜", compat: "店内记录的睡袋。" },
    nhpad: { fine: "睡眠", source: "Naturehike Australia", updated: known, scene: "过夜", compat: "店内记录的垫。" },
    stsmat: { fine: "睡眠", source: "Sea to Summit", updated: known, scene: "过夜", compat: "店内记录的垫。" },
    nhpot: { fine: "炊事", source: "Naturehike Australia", updated: known, scene: "煮水", compat: "店内记录的锅。" },
    stsdry: { fine: "携带与防护", source: "Sea to Summit", updated: known, scene: "淋雨", compat: "店内记录的干袋。" },
    svhike: { fine: "急救", source: "SURVIVAL", updated: known, scene: "徒步", compat: "蛇伤仍是压力固定后打 000。" },
    sjbag: { fine: "急救", source: "St John", updated: known, scene: "空包", compat: "克数未记录。" },
    snake: { fine: "急救", source: "Wildfire", updated: known, scene: "蛇", compat: "压力固定，打 000。不切开、不吸、不冰敷。" },
    sjsnake: { fine: "急救", source: "St John", updated: known, scene: "蛇", compat: "克数未记录。压力固定，打 000。" },
    tacsnake: { fine: "急救", source: "TacMed", updated: known, scene: "蛇", compat: "克数未记录。" },
    field: { fine: "急救", source: "原清单，没有单独商品页", updated: known, scene: "小包", compat: "不要和蛇伤绷带重复勾。" },
    aidtape: { fine: "急救", source: "St John 分类页", updated: known, scene: "固定", compat: "类目链接，单品未核对。克数未记录。" },
    aidwipe: { fine: "急救", source: "St John 分类页", updated: known, scene: "清洁", compat: "类目链接，单品未核对。" },
    aidors: { fine: "急救", source: "没有单独商品页", updated: "未记录", scene: "补液", compat: "克数和价格未记录。" },
    aidpen: { fine: "急救", source: "没有单独商品页", updated: "未记录", scene: "记录", compat: "克数和价格未记录。" },
    aidblank: { fine: "急救", source: "TacMed 分类页", updated: known, scene: "失温", compat: "类目链接，不是某一条毯子。" },
    hpcontour: { fine: "饮水", source: "HydraPak", updated: known, scene: "水袋", compat: "克数未记录。" },
    cbcrux: { fine: "饮水", source: "CamelBak", updated: known, scene: "水袋", compat: "克数未记录。" }
  };
  PACK.forEach((item) => {
    const row = meta[item.id];
    if (!row) return;
    Object.assign(item, row);
  });
  ["clean", "aidstrip", "aidgauze", "aidwrap", "aidtool", "aidmeds"].forEach((id) => {
    const item = PACK.find((row) => row.id === id);
    if (item) item.hide = true;
  });

  cat("gnd72", "72 mm 渐变灰", "滤镜", "kase", "亮暗过渡", "未买。只上 24-70。价格和克数未记录。");
  cat("plate600", "180-600 快装板", "支撑", "ch", "长焦上脚架", "未买。价格和克数未记录。");
  cat("arcafoot", "Arca-Swiss 镜头脚", "支撑", "ch", "脚架环", "未买。价格和克数未记录。");
  cat("gimbal", "长焦云台", "支撑", "ch", "跟拍", "未买。承重未记录。不另造一件叫承重的商品。");
  cat("coman", "科曼独脚架", "支撑", "digi", "长焦", "未买。不是已有的 Benro 那一行。价格和克数未记录。");
  cat("tripod", "专业三脚架", "支撑", "ch", "固定机位", "未买。价格和克数未记录。");
  cat("lplate", "L 型板", "支撑", "ch", "竖拍", "未买。价格和克数未记录。");
  cat("beanbag", "地垫式长焦支撑", "支撑", "ch", "趴拍", "未买。价格和克数未记录。");
  cat("shoulder", "相机肩带", "携带与防护", "ch", "机身", "未买。价格和克数未记录。");
  cat("drybag", "防水袋", "携带与防护", "snow", "淋雨", "未买。价格和克数未记录。");
  cat("dryinsert", "防水相机内胆", "携带与防护", "ch", "机器", "未买。价格和克数未记录。");
  cat("fogband", "镜头防雾带", "携带与防护", "ch", "温差", "未买。价格和克数未记录。");
  cat("blower", "气吹", "携带与防护", "ch", "灰尘", "未买。价格和克数未记录。");
  cat("cloth", "镜头布", "携带与防护", "ch", "指纹", "未买。价格和克数未记录。");
  cat("charger", "备用原厂充电器", "电力与存储", "ch", "EN-EL15", "未买。不要第三方电池。价格和克数未记录。");
  cat("pdbank", "USB-C PD 充电宝", "电力与存储", "digi", "补电", "未买。不是家里那几只未写牌子的充电宝。价格和克数未记录。");
  cat("spotter", "单筒望远镜", "观测", "digi", "先找", "未买。价格和克数未记录。");
  cat("grey", "灰卡", "观测", "ch", "白平衡", "未买。价格和克数未记录。");
  cat("torch", "小型强光手电", "照明", "head", "找路", "未买。分类页，不是某一款。价格和克数未记录。");
  cat("papermap", "纸质地图", "导航", "snow", "没电时", "未买。价格和克数未记录。");
  cat("compass", "指南针", "导航", "snow", "没电时", "未买。价格和克数未记录。");
  cat("gpsunit", "GPS 手持机", "导航", "garmin", "轨迹", "未买。价格和克数未记录。离线地图和 GPX 是网站功能，不是这件商品。");
  cat("satmsg", "卫星通信器", "求救", "garmin", "无信号", "未买。价格和克数未记录。");
  cat("alarm", "个人报警器", "求救", "snow", "呼救", "未买。价格和克数未记录。");
  cat("whistle", "求救哨", "求救", "paddy", "呼救", "未买。价格和克数未记录。");
  cat("phonebatt", "备用手机电池", "求救", "digi", "手机", "未买。不是相机电池。价格和克数未记录。");
  cat("tent1", "单人帐篷", "庇护", "snow", "过夜", "未买。不是 Cloud UP 2。价格和克数未记录。");
  cat("groundcloth", "地布", "庇护", "snow", "过夜", "未买。价格和克数未记录。");
  cat("tarp", "天幕", "庇护", "snow", "过夜", "未买。价格和克数未记录。");
  cat("sleepbag", "睡袋", "睡眠", "snow", "过夜", "未买。不是已核对的 CW295。价格和克数未记录。");
  cat("liner", "睡袋内胆", "睡眠", "snow", "过夜", "未买。价格和克数未记录。");
  cat("pad", "充气睡垫", "睡眠", "paddy", "过夜", "未买。价格和克数未记录。");
  cat("pillow", "枕头", "睡眠", "snow", "过夜", "未买。价格和克数未记录。");
  cat("bladder", "水袋", "饮水", "water", "补水", "未买。分类页。价格和克数未记录。");
  cat("bottle", "硬水瓶", "饮水", "snow", "补水", "未买。价格和克数未记录。");
  cat("filter", "滤水器", "饮水", "paddy", "溪水", "未买。价格和克数未记录。");
  cat("tabs", "净水片", "饮水", "paddy", "溪水", "未买。价格和克数未记录。");
  cat("stove", "炉具", "炊事", "snow", "煮水", "未买。价格和克数未记录。");
  cat("canister", "气罐", "炊事", "snow", "燃料", "未买。价格和克数未记录。");
  cat("firestarter", "点火器", "炊事", "snow", "点火", "未买。价格和克数未记录。");
  cat("pot", "小锅", "炊事", "snow", "煮水", "未买。不是已核对的铝锅。价格和克数未记录。");
  cat("utensils", "餐具", "炊事", "snow", "吃饭", "未买。价格和克数未记录。");
  cat("windscreen", "防风板", "炊事", "snow", "炉头", "未买。价格和克数未记录。");
  cat("trash", "垃圾密封袋", "卫生", "snow", "垃圾带走", "未买。价格和克数未记录。");
  cat("tp", "厕纸和密封袋", "卫生", "snow", "如厕", "未买。价格和克数未记录。");
  cat("towel", "轻量毛巾", "卫生", "snow", "擦干", "未买。价格和克数未记录。");
  cat("socks", "备用袜子", "卫生", "paddy", "湿脚", "未买。不是衣服方案。价格和克数未记录。");
  cat("trowel", "登山铲", "卫生", "paddy", "掩埋", "未买。价格和克数未记录。");
  cat("triangle", "三角巾", "急救", "refill", "固定", "未买。分类页。价格和克数未记录。");
  cat("elastic", "弹性绷带", "急救", "refill", "固定", "未买。分类页。价格和克数未记录。");
  cat("gauze", "无菌纱布", "急救", "wound", "覆盖", "未买。分类页。价格和克数未记录。");
  cat("nonstick", "不粘敷料", "急救", "wound", "覆盖", "未买。分类页。价格和克数未记录。");
  cat("hemo", "止血敷料", "急救", "tac", "出血", "未买。分类页。价格和克数未记录。");
  cat("plaster", "创可贴", "急救", "wound", "小伤口", "未买。分类页。价格和克数未记录。");
  cat("blister", "水泡贴", "急救", "wound", "脚", "未买。分类页。价格和克数未记录。");
  cat("tweezers", "镊子", "急救", "refill", "异物", "未买。分类页。价格和克数未记录。");
  cat("scissors", "小剪刀", "急救", "refill", "剪绷带", "未买。分类页。价格和克数未记录。");
  cat("gloves", "一次性手套", "急救", "refill", "防护", "未买。分类页。价格和克数未记录。");
  cat("pain", "止痛药", "急救", "stj", "疼痛", "未买。不写药名和剂量。价格和克数未记录。");
  cat("allergy", "抗过敏药", "急救", "stj", "过敏", "未买。不写药名和剂量。价格和克数未记录。");
  cat("rx", "个人处方药", "急救", "stj", "自备", "只写自备，不写药名和剂量。", { shop: "", shopName: "" });
  cat("knife", "瑞士军刀", "修理", "paddy", "修理", "不是自我保护。NSW 公共场所和国家公园对携带刀具的限制：携带限制未核对。");
  cat("pliers", "小型工具钳", "修理", "snow", "修理", "未买。价格和克数未记录。");
  cat("duct", "胶带", "修理", "snow", "修补", "未买。价格和克数未记录。");
  cat("ziptie", "扎带", "修理", "snow", "固定", "未买。价格和克数未记录。");
  cat("cord", "备用绳", "修理", "snow", "捆扎", "未买。价格和克数未记录。");
  cat("buckle", "备用扣件", "修理", "snow", "包扣", "未买。价格和克数未记录。");
  cat("sewing", "针线包", "修理", "snow", "缝补", "未买。价格和克数未记录。");
  cat("screws", "备用螺丝", "修理", "ch", "机身", "未买。价格和克数未记录。");
  cat("platescrews", "快装板备用螺丝", "修理", "ch", "快装板", "未买。价格和克数未记录。");
  cat("matches", "防水火柴或打火机", "修理", "snow", "点火", "未买。价格和克数未记录。");
  ["安全绳", "辅助绳", "扁带", "主锁", "快挂", "头盔", "安全带", "抓结绳", "岩钉", "岩塞", "冰镐", "冰爪", "绳包", "岩石保护器"].forEach((name, index) => {
    climb(`tech${index}`, name);
  });
  cat("copyStand", "翻拍支架", "镜头", "ch", "微距翻拍", "未买。价格和克数未核对。");
  cat("gndHard", "硬边渐变镜", "滤镜", "kase", "硬过渡", "未买。价格和克数未核对。不是已经记下的 72 mm 渐变灰。");
  cat("food", "口粮", "炊事", "snow", "当天吃的", "未买。价格和克数未核对。");
  cat("papers", "证件和许可复印件", "导航", "snow", "入园纸", "未买。价格和克数未核对。不是纸质地图。");

  const NEST = {
    z8: ["机身", "无反"],
    f3: ["机身", "胶片"],
    f4: ["机身", "胶片"],
    action4: ["运动", "浮潜"],
    mavic: ["运动", "飞机"],
    rb67: ["中画幅", "玛米亚"],
    x2d: ["中画幅", "哈苏"],
    film: ["胶片", "胶卷", "相机"],
    tele200: ["长焦", "中长焦"],
    tele600: ["长焦", "超长焦"],
    std: ["标准变焦", "套机"],
    ais3570: ["定焦", "变焦老镜头"],
    ai50: ["定焦", "标准"],
    micro55: ["微距", "近摄"],
    copyStand: ["微距", "翻拍"],
    ftz: ["转接", "卡口"],
    tc14: ["转接", "增距"],
    rb137: ["中画幅镜头", "玛米亚"],
    xcd38: ["中画幅镜头", "哈苏"],
    nd8: ["减光", "浅"],
    nd64: ["减光", "深"],
    nd1000: ["减光", "深"],
    cpl: ["偏振", "72 mm"],
    cpl77: ["偏振", "77 mm"],
    gnd72: ["渐变", "软边"],
    gndHard: ["渐变", "硬边"],
    tripod: ["脚架", "三脚架"],
    monopod: ["脚架", "独脚架"],
    coman: ["脚架", "独脚架"],
    nhpole: ["杖", "碳杖", "支撑"],
    gimbal: ["云台", "长焦"],
    lplate: ["云台", "竖拍"],
    plate600: ["快装", "镜头板"],
    arcafoot: ["快装", "镜头脚"],
    beanbag: ["贴地", "豆袋"],
    insert: ["内胆", "阿尔菲斯"],
    cube: ["内胆", "备选"],
    drybag: ["干袋", "防水袋"],
    stsdry: ["干袋", "轻量"],
    svdry: ["干袋", "防水袋", "携带与防护"],
    dryinsert: ["干袋", "相机"],
    shoulder: ["背带", "肩带"],
    strap: ["背带", "脚架环"],
    rain: ["防护", "雨罩"],
    stsnet: ["防护", "头网", "携带与防护"],
    fogband: ["清洁", "防雾"],
    blower: ["清洁", "气吹"],
    cloth: ["清洁", "镜头布"],
    clean: ["清洁", "气吹"],
    batts: ["相机电池", "原厂"],
    charger: ["相机电池", "充电"],
    p20a: ["充电宝", "已有"],
    p20b: ["充电宝", "已有"],
    p5: ["充电宝", "已有"],
    pdbank: ["充电宝", "另买"],
    cards: ["存储", "主槽"],
    reader: ["存储", "读卡"],
    ssd: ["存储", "硬盘"],
    mac: ["住处", "电脑"],
    cables: ["住处", "线"],
    bins: ["望远镜", "双筒"],
    spotter: ["望远镜", "单筒"],
    grey: ["校色", "灰卡"],
    lamp: ["头灯", "红光"],
    torch: ["手电", "强光"],
    papermap: ["纸图", "地图"],
    papers: ["纸图", "证件"],
    compass: ["仪器", "指南针"],
    gpsunit: ["仪器", "手持"],
    plb: ["示位", "购买"],
    plbnpws: ["示位", "借用"],
    whistle: ["呼叫", "哨"],
    alarm: ["呼叫", "报警"],
    satmsg: ["呼叫", "卫星"],
    phonebatt: ["手机", "备用电池"],
    nhtent: ["帐篷", "双人"],
    tent1: ["帐篷", "单人"],
    tarp: ["外帐", "天幕"],
    groundcloth: ["外帐", "地布"],
    nhbag: ["睡袋", "羽绒"],
    sleepbag: ["睡袋", "其他"],
    liner: ["睡袋", "内胆"],
    nhpad: ["垫子", "充气"],
    stsmat: ["垫子", "充气"],
    pad: ["垫子", "充气"],
    pillow: ["垫子", "枕头"],
    bottle: ["瓶", "硬瓶"],
    water: ["瓶", "当天"],
    bladder: ["袋", "通用"],
    hpcontour: ["袋", "品牌"],
    cbcrux: ["袋", "品牌"],
    filter: ["处理", "滤水"],
    tabs: ["处理", "药片"],
    stove: ["炉", "炉头"],
    canister: ["炉", "气罐"],
    nhpot: ["锅", "铝锅"],
    pot: ["锅", "小锅"],
    firestarter: ["点火", "点火器"],
    windscreen: ["点火", "防风"],
    utensils: ["吃", "餐具"],
    food: ["吃", "口粮"],
    tp: ["如厕", "厕纸"],
    trowel: ["如厕", "铲子"],
    towel: ["清洁", "毛巾"],
    trash: ["清洁", "垃圾袋"],
    socks: ["备用", "袜子"],
    field: ["包", "小包"],
    svhike: ["包", "徒步"],
    svtrail: ["包", "徒步"],
    sjbag: ["包", "空包"],
    snake: ["蛇伤", "压力"],
    sjsnake: ["蛇伤", "压力"],
    tacsnake: ["蛇伤", "压力"],
    sjmod: ["蛇伤", "模块"],
    gauze: ["伤口", "覆盖"],
    nonstick: ["伤口", "覆盖"],
    plaster: ["伤口", "覆盖"],
    blister: ["伤口", "覆盖"],
    hemo: ["伤口", "覆盖"],
    triangle: ["伤口", "固定"],
    elastic: ["伤口", "固定"],
    aidtape: ["伤口", "固定"],
    tweezers: ["工具", "镊子"],
    scissors: ["工具", "剪刀"],
    gloves: ["工具", "手套"],
    pain: ["药", "止痛"],
    allergy: ["药", "过敏"],
    rx: ["药", "自备"],
    aidors: ["药", "补液"],
    aidblank: ["保暖", "毯子"],
    aidpen: ["记录", "记号笔"],
    aidwipe: ["伤口", "清洁"],
    knife: ["刀具", "小刀"],
    pliers: ["刀具", "钳子"],
    duct: ["修补", "胶带"],
    sewing: ["修补", "针线"],
    ziptie: ["固定", "扎带"],
    cord: ["固定", "绳"],
    buckle: ["固定", "扣件"],
    screws: ["零件", "机身"],
    platescrews: ["零件", "快装"],
    matches: ["火种", "火柴"],
    tech0: ["绳索", "主绳"],
    tech1: ["绳索", "辅绳"],
    tech2: ["连接", "扁带"],
    tech3: ["连接", "锁"],
    tech4: ["连接", "锁"],
    tech5: ["护具", "头盔"],
    tech6: ["护具", "安全带"],
    tech7: ["绳结", "抓结"],
    tech8: ["锚点", "岩钉"],
    tech9: ["锚点", "岩塞"],
    tech10: ["冰雪", "冰镐"],
    tech11: ["冰雪", "冰爪"],
    tech12: ["收纳", "绳包"],
    tech13: ["护具", "保护器"],
    b8fjq: ["上衣", "打底", "个人记录"],
    f8h1u: ["上衣", "中间", "个人记录"],
    v8cm4: ["上衣", "中间", "个人记录"],
    s8bwc: ["上衣", "防晒", "个人记录"],
    s8ezy: ["上衣", "防晒", "个人记录"],
    s8fzp: ["上衣", "防晒", "个人记录"],
    j8en9: ["上衣", "外壳", "个人记录"],
    j8a4d: ["上衣", "外壳", "个人记录"],
    j831: ["上衣", "外壳", "个人记录"],
    j89zj: ["上衣", "外壳", "个人记录"],
    j89zm: ["上衣", "外壳", "个人记录"],
    p12502: ["下装", "雨裤", "个人记录"],
    boots: ["鞋", "靴子", "个人记录"],
    sandals: ["鞋", "凉鞋", "个人记录"],
    pack65: ["包", "大包", "个人记录"],
    daynf: ["包", "小包", "个人记录"],
    sling: ["包", "小包", "个人记录"],
    airtag: ["随身", "追踪", "其他配件"],
    watch: ["随身", "手表", "其他配件"]
  };
  PACK.forEach((item) => {
    const row = NEST[item.id];
    if (!row) {
      item.mid = "未再分";
      item.leaf = "未再分";
      return;
    }
    item.mid = row[0];
    item.leaf = row[1];
    if (row[2]) item.fine = row[2];
  });
  globalThis.GEAR_TREE = {
    "相机": { "机身": ["无反", "胶片"], "运动": ["浮潜", "飞机"], "中画幅": ["玛米亚", "哈苏"], "胶片": ["胶卷", "页片"] },
    "镜头": { "标准变焦": ["套机", "恒定光圈"], "长焦": ["中长焦", "超长焦"], "定焦": ["标准", "变焦老镜头"], "微距": ["近摄", "翻拍"], "转接": ["卡口", "增距"], "中画幅镜头": ["玛米亚", "哈苏"] },
    "滤镜": { "减光": ["浅", "深"], "偏振": ["72 mm", "77 mm"], "渐变": ["软边", "硬边"] },
    "支撑": { "脚架": ["三脚架", "独脚架"], "杖": ["碳杖", "铝杖"], "云台": ["长焦", "竖拍"], "快装": ["镜头板", "镜头脚"], "贴地": ["豆袋", "地垫"] },
    "携带与防护": { "内胆": ["阿尔菲斯", "备选"], "干袋": ["防水袋", "轻量", "相机"], "背带": ["肩带", "脚架环"], "防护": ["雨罩", "头网"], "清洁": ["气吹", "镜头布", "防雾"] },
    "电力与存储": { "相机电池": ["原厂", "充电"], "充电宝": ["已有", "另买"], "存储": ["主槽", "备用"], "住处": ["电脑", "线"] },
    "观测": { "望远镜": ["双筒", "单筒"], "校色": ["灰卡", "白卡"] },
    "照明": { "头灯": ["红光", "白光"], "手电": ["强光", "备用"] },
    "导航": { "纸图": ["地图", "证件"], "仪器": ["指南针", "手持"] },
    "求救": { "示位": ["购买", "借用"], "呼叫": ["哨", "报警", "卫星"], "手机": ["备用电池", "空"] },
    "庇护": { "帐篷": ["双人", "单人"], "外帐": ["天幕", "地布"] },
    "睡眠": { "睡袋": ["羽绒", "其他", "内胆"], "垫子": ["充气", "枕头"] },
    "饮水": { "瓶": ["硬瓶", "当天"], "袋": ["通用", "品牌"], "处理": ["滤水", "药片"] },
    "炊事": { "炉": ["炉头", "气罐"], "锅": ["铝锅", "小锅"], "点火": ["点火器", "防风"], "吃": ["餐具", "口粮"] },
    "卫生": { "如厕": ["厕纸", "铲子"], "清洁": ["毛巾", "垃圾袋"], "备用": ["袜子", "未再分"] },
    "急救": { "包": ["小包", "徒步", "空包"], "蛇伤": ["压力", "模块"], "伤口": ["覆盖", "固定", "清洁"], "工具": ["镊子", "剪刀", "手套"], "药": ["止痛", "过敏", "自备", "补液"], "保暖": ["毯子", "未再分"], "记录": ["记号笔", "未再分"] },
    "修理": { "刀具": ["小刀", "钳子"], "修补": ["胶带", "针线"], "固定": ["扎带", "绳", "扣件"], "零件": ["机身", "快装"], "火种": ["火柴", "备用"] },
    "技术活动": { "绳索": ["主绳", "辅绳"], "连接": ["扁带", "锁"], "护具": ["头盔", "安全带", "保护器"], "绳结": ["抓结", "收尾"], "锚点": ["岩钉", "岩塞"], "冰雪": ["冰镐", "冰爪"], "收纳": ["绳包", "未再分"] },
    "其他配件": { "随身": ["追踪", "手表"], "未再分": ["未再分", "其他"] },
    "个人记录": { "上衣": ["打底", "中间", "防晒", "外壳"], "下装": ["雨裤", "未再分"], "鞋": ["靴子", "凉鞋"], "包": ["大包", "小包"] }
  };
})();
