/* 每处九项。论坛帖是第三方参考，不升成已官方确认，也不是扎营许可或时刻表。
   核实日期 2026-11-13。Lithgow 约 5 km、城镇到公园的笼统距离，都不是车站到入口。 */
const FACT_DAY = "2026-11-13";
const FACT_FIELDS = ["入口名称", "最后一段", "返程", "离开步道", "独自过夜", "封闭", "风景", "爬升", "安全"];
const FACT_FORUM = [
  "https://www.bushwalk.com/forum/viewtopic.php?f=47&t=13479",
  "https://bushwalk.com/forum/viewtopic.php?f=36&t=42702",
  "https://bushwalk.com/forum/viewtopic.php?f=36&t=13562",
  "https://bushwalk.com/j/7vvctl/",
  "https://bushwalk.com/j/t7v110/",
  "https://bushwalk.com/forum/viewtopic.php?f=36&t=3114"
].join("｜");

function factRow(field, state, url, quote) {
  return [field, state, url, quote];
}

const FACT_CUSTOM = {
  northhead: {
    "入口名称": factRow("入口名称", "已官方确认", "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/fairfax-walk", "The paved track starts at the end of North Head Scenic Drive and loops around the top of North Head."),
    "最后一段": factRow("最后一段", "查过仍未写明", "https://www.nationalparks.nsw.gov.au/things-to-do/lookouts/north-head/visitor-info", "Catch a ferry from Circular Quay wharf to Manly wharf. From there, take the 135 bus to North Head Q Station. 页面没有写 Q Station 到 North Head Scenic Drive 尽头的米数。最后一段交通未落实。"),
    "独自过夜": factRow("独自过夜", "已官方确认", "https://www.environment.nsw.gov.au/sites/default/files/sydney-harbour-national-park-plan-of-management-120757.pdf", "Camping is not permitted in any part of Sydney Harbour National Park except Clark Island. 北头不在例外里。这是禁止扎营，不是独自过夜许可。"),
    "封闭": factRow("封闭", "已官方确认", "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/fairfax-walk", "The gates to North Head are open from 6am to 8pm during daylight savings, and 6am to 6pm rest of the year. 另写 Sydney Harbour National Park is open sunrise to sunset but may have to close at times due to poor weather or fire danger. 当天告示没有另打开。"),
    "风景": factRow("风景", "已官方确认", "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/fairfax-walk", "Look out over endless ocean from Yiningma lookout, or across the harbour to the city skyline from Burragula lookout."),
    "爬升": factRow("爬升", "已官方确认", "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/fairfax-walk/visitor-info", "Gradient Flat. There are no steps along Fairfax walk. 没有爬升米数。")
  },
  malabar: {
    "入口名称": factRow("入口名称", "已官方确认", "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/malabar-headland-national-park", "The western section of the park is open year-round. 页上点了 Western Escarpment walking track 和 Boora Point walking track。没有另写一个车站名。"),
    "封闭": factRow("封闭", "已官方确认", "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/malabar-headland-national-park", "Eastern section: Often closed because of the ANZAC rifle range operation. Closed every Saturday and every 1st and 3rd Sunday of the month. Western section: Open all year but may close at times due to poor weather or fire danger."),
    "风景": factRow("风景", "已官方确认", "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/malabar-headland-national-park", "Dramatic cliff top views. The natural landscape is dominated by towering cliffs, sandstone escarpments and remnant heritage structures."),
    "安全": factRow("安全", "已官方确认", "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/malabar-headland-national-park", "The eastern section of the park is closed when ANZAC Rifle Range is in use so check safety messages and alerts before visiting.")
  },
  minnamurra: {
    "入口名称": factRow("入口名称", "已官方确认", "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/minnamurra-falls-walk/visitor-info", "Minnamurra Rainforest Centre 345 Minnamurra Falls Road, Jamberoo NSW 2533. Lyrebird loop walk starts from Minnamurra Rainforest Centre."),
    "最后一段": factRow("最后一段", "查过仍未写明", "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/lyrebird-loop-walk/visitor-info", "To get there from Jamberoo: drive west, then Minnamurra Falls Road, the centre is 3km along to the end of the road. 这是开车指引。没有车站到门口的米数。最后一段交通未落实。"),
    "离开步道": factRow("离开步道", "已官方确认", "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/lyrebird-loop-walk", "Please remain on the walkway and paved tracks at all times. 标签：只能走官方步道。范围是 Minnamurra Rainforest 的这条步道，不套到 Carrington Falls。"),
    "封闭": factRow("封闭", "已官方确认", "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/lyrebird-loop-walk", "Opening times 9am to 5pm daily. Last access 4pm. 中心另写 9am to 4pm daily. Closed Christmas Day."),
    "风景": factRow("风景", "已官方确认", "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/lyrebird-loop-walk", "subtropical, dry, riparian and temperate rainforest. 瀑布页写 trickling streams, moss-covered rocks and feathered ferns，lower and upper Minnamurra Falls."),
    "爬升": factRow("爬升", "已官方确认", "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/minnamurra-falls-walk/visitor-info", "Minnamurra Falls walk：Very steep，Occasional steps，4.2km return。Lyrebird loop：Short steep hills。没有爬升米数。"),
    "安全": factRow("安全", "已官方确认", "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/lyrebird-loop-walk", "There is no river access. There's one long suspension bridge which sways back and forth.")
  },
  royal: {
    "入口名称": factRow("入口名称", "已官方确认", "https://www.nationalparks.nsw.gov.au/things-to-do/cycling-trails/lady-carrington-drive/visitor-info", "Lady Carrington Drive is in the Audley precinct of Royal National Park. Parking is available at Fig Tree Flat and at the southern end."),
    "最后一段": factRow("最后一段", "查过仍未写明", "https://www.nationalparks.nsw.gov.au/things-to-do/cycling-trails/lady-carrington-drive/visitor-info", "Turn off Princes Highway at Waterfall train station. Follow McKell Avenue to the end. Turn left onto Sir Bertram Stevens Drive and continue for approximately 0.5km. 这 0.5 km 是开车，不是站台走到入口。最后一段交通未落实。"),
    "封闭": factRow("封闭", "已官方确认", "https://www.nationalparks.nsw.gov.au/things-to-do/cycling-trails/lady-carrington-drive", "页头写 Affected by closures, check current alerts. 导览页写 Royal National Park is open 7am to 8.30pm but may have to close at times due to poor weather or fire danger. 告示地址此前 404，当天关闭没有另打开的告示页。"),
    "风景": factRow("风景", "已官方确认", "https://www.nationalparks.nsw.gov.au/things-to-do/cycling-trails/lady-carrington-drive", "follows the Hacking River upstream from Audley. blue gums, turpentines and patches of rainforest."),
    "安全": factRow("安全", "已官方确认", "https://www.nationalparks.nsw.gov.au/things-to-do/cycling-trails/lady-carrington-drive", "Lady Carrington Drive can become boggy when it rains. If you're riding a bike, please give way to walkers along this shared track.")
  },
  kelly: {
    "入口名称": factRow("入口名称", "已官方确认", "https://www.nationalparks.nsw.gov.au/things-to-do/picnic-areas/kellys-falls-picnic-area/visitor-info", "Kellys Falls picnic area is in the Kellys Falls precinct of Garawarra State Conservation Reserve. Parking is available in a bitumen carpark at Kellys Falls picnic area."),
    "最后一段": factRow("最后一段", "查过仍未写明", "https://www.nationalparks.nsw.gov.au/things-to-do/picnic-areas/kellys-falls-picnic-area/visitor-info", "Kellys Falls is approximately 2km on your right, just before Walker Street. 这是公路上的大约 2 km，不是车站到入口。最后一段交通未落实。"),
    "安全": factRow("安全", "已官方确认", "https://www.nationalparks.nsw.gov.au/things-to-do/picnic-areas/kellys-falls-picnic-area/visitor-info", "rocks and paths can be extremely slippery around the waterfalls. Stay behind the railing and barriers. there is limited mobile phone reception in this park.")
  },
  glow: {
    "入口名称": factRow("入口名称", "已官方确认", "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/glow-worm-tunnel-walking-track", "The track starts from the carpark at the end of Glowworm Tunnel Road."),
    "最后一段": factRow("最后一段", "查过仍未写明", "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/glow-worm-tunnel-walking-track/visitor-info｜https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/lost-city-walking-track", "访客页写的是从 Lithgow 开车，After about 39km 到 Glow Worm Tunnel car park。总览里的 Just 5km from Lithgow 写在 Lost City 那一页，是城镇到公园的笼统距离，不是这条步道口，也不拿来算出租车。没有车站到车场的米数。最后一段交通未落实。"),
    "离开步道": factRow("离开步道", "查过仍未写明", "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/glow-worm-tunnel-walking-track｜https://www.environment.nsw.gov.au/sites/default/files/wollemi-national-park-plan-of-management-220080.pdf", "步道页写 Please stay on the walking tracks to protect this World Heritage Area，以及 staying on the path。这是这条步道上的嘱咐。计划里 cross-country walks 那句仍只是在描述人们怎么走，不升成 off-track明确允许，也不把整座 Wollemi 标成只能走官方步道。标签保持资料不足。"),
    "独自过夜": factRow("独自过夜", "已官方确认", "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/glow-worm-tunnel-walking-track/visitor-info", "Camping is not permitted in the Glow Worm Tunnel area. The nearest campground is Newnes campground. 这是这一片禁止扎营，不是独自过夜许可，也不套到整座 Wollemi。"),
    "封闭": factRow("封闭", "已官方确认", "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/glow-worm-tunnel-walking-track", "The Glow Worm Tunnel to Newnes section of the track may be closed during or after heavy rain because of rock fall and flood risk. Wollemi National Park is always open but may have to close at times due to poor weather or fire danger."),
    "风景": factRow("风景", "已官方确认", "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/glow-worm-tunnel-walking-track", "tall forests, lush tree ferns, narrow gorges and stunning pagoda rock formations. The 387metre-long tunnel. views of Donkey Mountain and Wolgan Valley."),
    "爬升": factRow("爬升", "查过仍未写明", "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/glow-worm-tunnel-walking-track/visitor-info｜https://maps.bushwalk.com/j/mf0u58/", "官方是 6km return，Gradient Short steep hills，over 80 steps，没有爬升米数。bushwalk 的 The Glow Worm Tunnel Walk 写 3.1 km return ↑ 270 m。长度对不上，270 m 不套到官方 6 km。"),
    "安全": factRow("安全", "已官方确认", "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/glow-worm-tunnel-walking-track/visitor-info", "there is limited mobile phone reception in this park and you'll need mobile reception to call Triple Zero (000). The glow worm tunnel at the end of the walk is uneven and rocky. The ground may be wet. 不写萤火虫的洞口坐标。")
  },
  wollemi: {
    "入口名称": factRow("入口名称", "查过仍未写明", "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/glow-worm-tunnel-walking-track", "Glow Worm Tunnel 的车场只是园内一条步道的入口，不是整座 Wollemi 的入口。整座的入口名称仍未写明。"),
    "独自过夜": factRow("独自过夜", "查过仍未写明", "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/glow-worm-tunnel-walking-track/visitor-info", "Camping is not permitted in the Glow Worm Tunnel area. 这句只写隧道这一片，不套成整座 Wollemi 的过夜规则。"),
    "风景": factRow("风景", "已官方确认", "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/glow-worm-tunnel-walking-track", "隧道页写 pagoda rock formations、Donkey Mountain and Wolgan Valley。这是这一条步道，不是整座公园的地貌清单。"),
    "离开步道": factRow("离开步道", "查过仍未写明", "https://www.environment.nsw.gov.au/sites/default/files/wollemi-national-park-plan-of-management-220080.pdf｜https://bushwalk.com/forum/viewtopic.php?f=36&t=13562", "计划没有另写允许或禁止越野。论坛帖 t=13562 写的是 Donkey Mountain 一带 off-track，并转述一封旧邮件。那不是现行许可，也不升成 off-track明确允许。标签保持资料不足。")
  },
  gos: {
    "入口名称": factRow("入口名称", "已官方确认", "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/lost-city-walking-track/visitor-info", "Lost City carpark is at the southern end of the walking track. 只限 Lost City walking track。整片 Gardens of Stone 没有另写一个总入口。"),
    "最后一段": factRow("最后一段", "查过仍未写明", "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/lost-city-walking-track｜https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/lost-city-walking-track/visitor-info｜https://bushwalk.com/j/t7v110/｜https://bushwalk.com/forum/viewtopic.php?f=36&t=13562", "总览写 Just 5km from Lithgow。这是城镇到公园的笼统距离，不是 Lithgow 站到 Lost City carpark。访客页的 800m 是 State Conservation Area entry 到 Lost City Road 转弯，是开车，不是站到入口。bushwalk.com/j/t7v110/ 的 Lost City 在 Litchfield，不是这里。论坛 t=13562 写的是 Wolgan Road 的 Donkey Mountain 车场，不是 Lost City carpark。最后一段交通未落实。"),
    "离开步道": factRow("离开步道", "查过仍未写明", "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/lost-city-walking-track｜https://bushwalk.com/forum/viewtopic.php?f=36&t=13562", "Lost City 页写 Please stay on the track and tread lightly around the fragile pagoda formations。这句只写这条步道，不套到整片。论坛里 ALL off-track 的邮件是 Donkey Mountain，不是这条步道的许可。整片标签保持资料不足。"),
    "封闭": factRow("封闭", "已官方确认", "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/lost-city-walking-track", "Gardens of Stone State Conservation Area is always open but may have to close at times due to poor weather or fire danger. Litchfield 那个因洪水关闭的 Lost City 不是这一处。"),
    "风景": factRow("风景", "已官方确认", "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/lost-city-walking-track", "unique rock formations named pagodas, panoramic views, tranquil creeks and historic mining relics. nationally significant platy pagodas."),
    "爬升": factRow("爬升", "查过仍未写明", "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/lost-city-walking-track｜https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/lost-city-walking-track/visitor-info", "页面写 the 800m uphill trek following signs for Lost City North lookout。800 m 是这段路的长度，不是爬升米数。Gradient 写 Short steep hills，Many steps。没有爬升米数。"),
    "安全": factRow("安全", "已官方确认", "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/lost-city-walking-track/visitor-info", "The track is remote with sections near exposed cliff edges. there is limited mobile phone reception in this park and you'll need mobile reception to call Triple Zero (000).")
  },
  blue: {
    "爬升": factRow("爬升", "第三方参考", "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/grand-cliff-top-walk｜https://www.aussiebushwalking.com/nsw/blue-mountains-national-park/grand-cliff-top-walk｜https://www.trailhiking.com.au/hikes/grand-cliff-top-walk/", "官方页没有总爬升米数。Aussie Bushwalking 写 795m Total Climb，并写 These values are provided by users。Trail Hiking 写 Total Ascent: 1908m。两个数字对不上，不取其中一个。"),
    "封闭": factRow("封闭", "第三方参考", "https://bushwalk.com/j/VFWRIB/", "第三方页末写 Prince Henry Cliff Top Walk (part of the Grand Cliff Top Walk) is closed between Honeymoon Lookout and Carrington Park, and between Ampitheatre Track and Kiah Lookout due to recent landslides。不是当天打开的 NPWS 告示，不标已官方确认。"),
    "最后一段": factRow("最后一段", "已官方确认", "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/grand-cliff-top-walk/visitor-info", "From Wentworth Falls station it's a 3km walk along Darwins walk to Wentworth Falls picnic area. 这是步行距离，不是出租车道路公里。返程班次仍未查到钟点。")
  },
  karloo: {
    "离开步道": factRow("离开步道", "第三方参考", "https://www.bushwalk.com/forum/viewtopic.php?f=47&t=13479｜https://www.environment.nsw.gov.au/sites/default/files/2026-07/royal-and-heathcote-national-parks-garawarra-state-conservation-area-plan-of-management-260201.pdf", "论坛帖写 After that it was off track but quite negotiable。这是在描述离开水道，不是许可。官方计划仍没有写可以离开步道。标签保持资料不足。"),
    "爬升": factRow("爬升", "查过仍未写明", "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/karloo-walking-track｜https://dev.bushwalk.com/j/nzs1rg/｜https://bushwalk.com/j/fiywja/", "官方 10km return 没有爬升米数。名为 The Karloo Track 的页打开返回 500，摘录里的 ↑ 374 m 不采用。另一条到 Engadine 的笔记是 14.9 km one way ↑ 559 m，不是这条往返。")
  },
  capebanks: {
    "风景": factRow("风景", "第三方参考", "https://bushwalk.com/j/c7ojjv/", "From the unfenced cliff top, you can watch the power of the ocean as waves crash into the sandstone rock face below. The shipwreck of the SS Minmi can be seen at low tide. 不把页上的起点坐标写进地图。"),
    "爬升": factRow("爬升", "第三方参考", "https://bushwalk.com/j/c7ojjv/", "Cape Banks Walk：2.5 km return，↑ 39 m ↓ -39 m。这是岸上这条步道的第三方数字，不是官方爬升，也不是下水深度。"),
    "最后一段": factRow("最后一段", "查过仍未写明", "https://bushwalk.com/j/c7ojjv/", "页上 Mode 写 bus car，开车方向从 Oxford Street 算起。没有写出哪一班车、哪一个站到入口的米数。最后一段交通未落实。"),
    "安全": factRow("安全", "查过仍未写明", "https://bushwalk.com/j/c7ojjv/｜https://www.nationalparks.nsw.gov.au/visit-a-park/parks/kamay-botany-bay-national-park", "岸上笔记写 unfenced cliff top。没有写灰护士鲨的接近办法，这里也不补。历史记录，不代表当天一定出现。")
  },
  killalea: {
    "风景": factRow("风景", "第三方参考", "https://bushwalk.com/forum/viewtopic.php?f=36&t=3114", "帖子写 Killalea State Park 有 two absolutely beautiful beaches, the Farm and Mystics，以及 paid camping facilities。这不是现行营地许可，也没有爬升米数。")
  },
  shelly: {
    "入口名称": factRow("入口名称", "已官方确认", "https://www.dpi.nsw.gov.au/fishing/marine-protected-areas/aquatic-reserves/cabbage-tree-bay-aquatic-reserve", "from the southern end of Manly Beach to the northern end of Shelly Beach Headland. ease of foreshore access. 没有写出步道口的米数。"),
    "风景": factRow("风景", "已官方确认", "https://www.dpi.nsw.gov.au/fishing/marine-protected-areas/aquatic-reserves/cabbage-tree-bay-aquatic-reserve", "The small north facing Bay, with its north and west facing beaches. rocky shores, and beaches. protected waters."),
    "安全": factRow("安全", "已官方确认", "https://www.dpi.nsw.gov.au/fishing/marine-protected-areas/aquatic-reserves/cabbage-tree-bay-aquatic-reserve", "declared a no-take aquatic reserve in 2002. one of the most popular places for snorkelling, scuba diving, swimming and underwater photography. 不写靠近地毯鲨的办法。历史记录，不代表当天一定出现。")
  },
  sassafras: {
    "入口名称": factRow("入口名称", "第三方参考", "https://maps.bushwalk.com/j/hrlosp/", "这条 Martins Lookout 环线写：the walk continues to the bottom of Sassafras Gully Rd, in front of house number 18。这是环线的第三方起点，不是官方命名的唯一入口。"),
    "最后一段": factRow("最后一段", "查过仍未写明", "https://maps.bushwalk.com/j/hrlosp/", "From Springwood Station, the walk crosses the pedestrian crossing，再沿 Macquarie Rd、Homedale St、Valley Rd、Sassafras Gully Rd。没有写出站台到步道口单独的米数，也没有返程钟点。最后一段交通未落实。"),
    "风景": factRow("风景", "第三方参考", "https://maps.bushwalk.com/j/hrlosp/", "lush valleys and deep bushland, as well as the panoramic Martins Lookout。"),
    "爬升": factRow("爬升", "查过仍未写明", "https://maps.bushwalk.com/j/hrlosp/", "13.8 km 环线 ↑ 674 m 同时用了 Sassafras Gully 和 Victory Track。不把 674 m 拆成檫木谷单独的爬升。")
  },
  victory: {
    "风景": factRow("风景", "第三方参考", "https://maps.bushwalk.com/j/hrlosp/", "环线经过 Victory Track 与 Sassafras Gully Walking Track 的交点，写 lush valleys and deep bushland。"),
    "爬升": factRow("爬升", "查过仍未写明", "https://maps.bushwalk.com/j/hrlosp/", "↑ 674 m 属于 13.8 km 的 Martins Lookout 环线，不写成胜利小径单独的爬升。"),
    "最后一段": factRow("最后一段", "查过仍未写明", "https://maps.bushwalk.com/j/hrlosp/", "环线从 Springwood Station 走出。没有胜利小径单独的车站到入口米数，也没有返程钟点。最后一段交通未落实。")
  },
  solitary: {
    "入口名称": factRow("入口名称", "已官方确认", "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/mount-solitary-walking-track", "Starting at Katoomba Falls Kiosk, descend Furber Steps to Federal Pass."),
    "独自过夜": factRow("独自过夜", "查过仍未写明", "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/mount-solitary-walking-track｜https://api.bushwalk.com/publication/magazine/201604/pdf", "官方页写 Ruined Castle campground 和 Kedumba River campground。2016 年杂志写 plenty of informal campsites。杂志不是扎营许可，也不把非正式营地写成可以自由选址。"),
    "爬升": factRow("爬升", "查过仍未写明", "https://api.bushwalk.com/publication/magazine/201604/pdf｜https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/mount-solitary-walking-track", "杂志写 Challenging climbs，没有米数。官方页有 steep eastern slope，没有总爬升米数。杂志写的 20 km return 不替换官方分段。")
  },
  jagungal: {
    "入口名称": factRow("入口名称", "第三方参考", "https://api.bushwalk.com/publication/magazine/201604/pdf", "Walk in from Round Mountain or Munyang power station, or between them. 这是 2016 年杂志，不是 Main Range 网页，也不覆盖 Schlink 或 Pilot。"),
    "离开步道": factRow("离开步道", "已官方确认", "https://www.environment.nsw.gov.au/sites/default/files/kosciuszko-national-park-plan-of-management-210174.pdf", "Wilderness Zone 名单里有 Jagungal。计划写 trackless areas for dispersed use。不是 Main Range 网页那句 Off track walking is permitted on the Kosciuszko Main range。标签：off-track按区域核实。"),
    "爬升": factRow("爬升", "查过仍未写明", "https://api.bushwalk.com/publication/magazine/201604/pdf", "杂志写 25 km or more, return, 3 days。没有爬升米数。")
  },
  schlink: {
    "入口名称": factRow("入口名称", "第三方参考", "https://api.bushwalk.com/publication/magazine/201604/pdf", "Munyang to Schlink Hilton Hut 22.4 km return, 9 hours. Mostly on fire trail. 这不是 Main Range 的入口，也不套到 Jagungal 或 Pilot。"),
    "离开步道": factRow("离开步道", "已官方确认", "https://www.environment.nsw.gov.au/sites/default/files/kosciuszko-national-park-plan-of-management-210174.pdf", "Schlink Pass Road 写在 Main Range Management Unit 的边界上，Valentine Trail 写在 Jagungal Wilderness Area。不用 Main Range 网页那句单独覆盖这里。标签：off-track按区域核实。"),
    "爬升": factRow("爬升", "查过仍未写明", "https://api.bushwalk.com/publication/magazine/201604/pdf", "22.4 km return 没有爬升米数。")
  },
  pilot: {
    "离开步道": factRow("离开步道", "已官方确认", "https://www.environment.nsw.gov.au/sites/default/files/kosciuszko-national-park-plan-of-management-210174.pdf｜https://api.bushwalk.com/publication/magazine/201604/pdf", "计划名单里有 Pilot。杂志这一期的摘录写了 Main Range 和 Jagungal，没有把 Pilot 写成同一条已核实路线。不用 Main Range 网页那句。标签：off-track按区域核实。")
  },
  lanecove: {
    "封闭": factRow("封闭", "已官方确认", "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/lane-cove-national-park", "Lane Cove National Park is open 9am to 7pm during daylight savings (until 6pm at other times). The park may have to close at times due to poor weather or fire danger."),
    "风景": factRow("风景", "已官方确认", "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/lane-cove-national-park", "bushland that sits on either side of the peaceful Lane Cove River."),
    "独自过夜": factRow("独自过夜", "已官方确认", "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/lane-cove-national-park", "If you'd like to stay overnight in the park, head to Lane Cove Holiday Park and book a campsite or cabin. 这是假日公园预订，不是林中独自过夜许可。"),
    "最后一段": factRow("最后一段", "查过仍未写明", "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/lane-cove-national-park", "Bus: $4.40 per adult, $2.20 per child (per day). 这是入园的巴士票价，没有班次，也没有车站到入口的米数。最后一段交通未落实。")
  },
  prospect: {
    "封闭": factRow("封闭", "已官方确认", "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/prospect-nature-reserve", "Prospect Nature Reserve is closed to the public as it's part of a Special Water catchment area."),
    "入口名称": factRow("入口名称", "查过仍未写明", "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/prospect-nature-reserve", "页面把野餐指向附近的 Andrew Campbell Reserve，不是这座自然保护区的开放入口。about 35km west of Sydney 是城镇距离，不是入口距离。"),
    "最后一段": factRow("最后一段", "查过仍未写明", "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/prospect-nature-reserve", "对公众关闭。没有车站到入口的米数。最后一段交通未落实。")
  },
  wallumatta: {
    "封闭": factRow("封闭", "已官方确认", "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/wallumatta-nature-reserve", "Wallumatta Nature Reserve is open sunrise to sunset but may have to close at times due to poor weather or fire danger."),
    "风景": factRow("风景", "已官方确认", "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/wallumatta-nature-reserve", "the largest remnant forest of the Sydney turpentine and ironbark forest."),
    "最后一段": factRow("最后一段", "查过仍未写明", "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/wallumatta-nature-reserve", "Only 10km from the Sydney CBD 是离市区的笼统距离，不是车站到入口。最后一段交通未落实。")
  },
  bushrangers: {
    "最后一段": factRow("最后一段", "查过仍未写明", "https://www.dpi.nsw.gov.au/fishing/marine-protected-areas/aquatic-reserves/bushrangers-bay-aquatic-reserve｜https://bushwalk.com/j/7vvctl/", "bushwalk.com/j/7vvctl/ 的 Bushrangers Bay 在 Boneo Road、Mornington Peninsula，是维多利亚，不是这一处。不采用那里的台阶和坐标。新南威尔士这一处的车站到入口仍未写明。最后一段交通未落实。"),
    "安全": factRow("安全", "查过仍未写明", "https://www.dpi.nsw.gov.au/fishing/marine-protected-areas/aquatic-reserves/bushrangers-bay-aquatic-reserve", "这次打开的搜索结果没有给出这一处的接近句子。不写靠近灰护士鲨的办法。历史记录，不代表当天一定出现。")
  }
};

function factMissQuote(field) {
  if (field === "最后一段") return "打开的官方页和这些论坛帖没有写出车站到这一处入口的米数。城镇到公园的笼统距离不算。最后一段交通未落实。";
  if (field === "返程") return "没有打开写出这一处返程班次钟点的页面。不抄一个钟点。";
  if (field === "爬升") return "没有打开写出这一处爬升米数、并且长度对得上的页面。不另编一个数。";
  if (field === "独自过夜") return "没有打开把这一处写成可以独自过夜的句子。论坛帖不是许可。";
  if (field === "入口名称") return "没有打开写出这一处入口名称的句子。";
  if (field === "封闭") return "没有打开这一处当天的告示页。开放时间若写在别处，不把另一座公园的关闭搬过来。";
  if (field === "风景") return "这些论坛帖没有点名这一处的地貌原句。不把别的地点的句子搬过来。";
  if (field === "安全") return "没有打开点名这一处的安全原句。不写靠近灰护士鲨或地毯鲨的办法。";
  return "打开的页面没有写这一项。";
}

function placeFactRows(id) {
  const custom = FACT_CUSTOM[id] || {};
  const off = typeof offtrackOf === "function" ? offtrackOf(id) : null;
  const official = off && off.url ? off.url : "";
  return FACT_FIELDS.map((field) => {
    if (custom[field]) return custom[field];
    if (field === "离开步道" && off) {
      const state = off.label === "资料不足" ? "查过仍未写明" : "已官方确认";
      return factRow(field, state, off.url, `${off.label}。${off.quote} 论坛里离开步道的描述不改这个标签。`);
    }
    const urls = [official, FACT_FORUM].filter(Boolean).join("｜");
    return factRow(field, "查过仍未写明", urls, factMissQuote(field));
  });
}

function factEsc(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[ch]));
}

function factLinks(value) {
  return String(value || "无链接").split("｜").map((part) => {
    const url = part.trim();
    if (/^https?:\/\//.test(url)) {
      return `<a href="${factEsc(url)}" target="_blank" rel="noreferrer">${factEsc(url)}</a>`;
    }
    return factEsc(url);
  }).join("｜");
}

function placeFactsHtml(id) {
  if (!id) return "";
  const rows = placeFactRows(id);
  const body = rows.map((row) => `<p class="factmeta" data-fact="${factEsc(row[0])}" data-fact-state="${factEsc(row[1])}">${factEsc(row[0])}｜${factLinks(row[2])}｜${factEsc(row[3])}｜${FACT_DAY}｜${factEsc(row[1])}</p>`).join("");
  return `<details class="atlas-fold place-facts" data-place-facts="${factEsc(id)}"><summary>查过的来源</summary>${body}</details>`;
}

function factPlaceIds() {
  const ids = new Set();
  if (typeof SITES !== "undefined") SITES.forEach((site) => ids.add(site.id));
  if (typeof CAMP_AREAS !== "undefined") CAMP_AREAS.forEach((area) => ids.add(area.id));
  if (typeof BRIEF_PLACES !== "undefined") BRIEF_PLACES.forEach((area) => ids.add(area.id));
  if (typeof OFFTRACK !== "undefined") OFFTRACK.forEach((row) => ids.add(row.id));
  return Array.from(ids);
}

function factCensus() {
  let gained = 0;
  let blank = 0;
  let places = 0;
  factPlaceIds().forEach((id) => {
    places += 1;
    const rows = placeFactRows(id);
    const custom = FACT_CUSTOM[id] || {};
    const hit = Object.keys(custom).some((field) => custom[field][1] !== "查过仍未写明");
    if (hit) gained += 1;
    blank += rows.filter((row) => row[1] === "查过仍未写明").length;
  });
  return { places, gained, blank };
}

function factMountSide() {
  const side = document.getElementById("side");
  if (!side) return;
  side.querySelectorAll(".row[data-id] + .place-facts, .camp-row[data-id] + .place-facts").forEach((node) => node.remove());
  side.querySelectorAll(".row[data-id], .camp-row[data-id]").forEach((button) => {
    const id = button.dataset.id;
    if (!id || button.closest("#placeDock")) return;
    button.insertAdjacentHTML("afterend", placeFactsHtml(id));
  });
}

if (typeof renderSide === "function") {
  const factRenderSide = renderSide;
  renderSide = function factRenderSideWrapped() {
    const result = factRenderSide.apply(this, arguments);
    factMountSide();
    return result;
  };
}

if (typeof renderPrep === "function") {
  const factRenderPrep = renderPrep;
  renderPrep = function factRenderPrepWrapped() {
    const result = factRenderPrep.apply(this, arguments);
    const land = document.getElementById("seeLand");
    if (land && typeof activeId !== "undefined" && activeId && !land.querySelector(".place-facts")) {
      land.insertAdjacentHTML("beforeend", placeFactsHtml(activeId));
    }
    return result;
  };
}

if (typeof campRouteHtml === "function") {
  const factCampRoute = campRouteHtml;
  campRouteHtml = function factCampRouteWrapped(id) {
    return factCampRoute.apply(this, arguments) + placeFactsHtml(id);
  };
}

const factStyle = document.createElement("style");
factStyle.textContent = ".place-facts{border:1px solid var(--line);margin:0 0 12px;padding:8px 10px;background:var(--bg-2)}.place-facts h3{margin:0 0 6px;font-size:15px}.place-facts .factmeta{margin:0 0 8px;word-break:break-word}";
document.head.appendChild(factStyle);

if (typeof view === "undefined" || view === "atlas") {
  if (typeof renderSide === "function") renderSide();
}
