/* 过夜三项原文。每一行只记一个事实。已确认表示这句原文点名这一处，并直接写了该项。
   步道页里的营地句子不是过夜许可。Mount Solitary 的句子只保留为原文，三项都是待核实。
   一项不能从另一项推出来。条例第12条写的是 a park，没有点名具体地点，不标已确认。
   核实日期 2026-11-13。本文件不挂进页面。 */
const OVERNIGHT_FACTS = [
  {
    "place": "北头",
    "id": "northhead",
    "fact": "可以独自徒步",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/sydney-harbour-national-park-plan-of-management-120757.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/sydney-harbour-national-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "北头",
    "id": "northhead",
    "fact": "必须在营地扎营",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/sydney-harbour-national-park-plan-of-management-120757.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/sydney-harbour-national-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "Camping is not permitted in any part of Sydney Harbour National Park except Clark Island.",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "北头",
    "id": "northhead",
    "fact": "可以自由选址",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/sydney-harbour-national-park-plan-of-management-120757.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/sydney-harbour-national-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "Camping is not permitted in any part of Sydney Harbour National Park except Clark Island.",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "马拉巴岬",
    "id": "malabar",
    "fact": "可以独自徒步",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/malabar-headland-national-park-statement-of-management-intent-140190.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/malabar-headland-national-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "马拉巴岬",
    "id": "malabar",
    "fact": "必须在营地扎营",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/malabar-headland-national-park-statement-of-management-intent-140190.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/malabar-headland-national-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "马拉巴岬",
    "id": "malabar",
    "fact": "可以自由选址",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/malabar-headland-national-park-statement-of-management-intent-140190.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/malabar-headland-national-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "索尔兰德角",
    "id": "solander",
    "fact": "可以独自徒步",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/kamay-botany-bay-national-park-plan-of-management-20200019.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/kamay-botany-bay-national-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "索尔兰德角",
    "id": "solander",
    "fact": "必须在营地扎营",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/kamay-botany-bay-national-park-plan-of-management-20200019.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/kamay-botany-bay-national-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "索尔兰德角",
    "id": "solander",
    "fact": "可以自由选址",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/kamay-botany-bay-national-park-plan-of-management-20200019.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/kamay-botany-bay-national-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "皇家国家公园",
    "id": "royal",
    "fact": "可以独自徒步",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/2026-07/royal-and-heathcote-national-parks-garawarra-state-conservation-area-plan-of-management-260201.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/royal-national-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "皇家国家公园",
    "id": "royal",
    "fact": "必须在营地扎营",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/2026-07/royal-and-heathcote-national-parks-garawarra-state-conservation-area-plan-of-management-260201.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/royal-national-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "Camping is only permitted at designated camping areas in Royal National Park and Heathcote National Park (Table 3).",
    "checked": "2026-11-13",
    "state": "已确认"
  },
  {
    "place": "皇家国家公园",
    "id": "royal",
    "fact": "可以自由选址",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/2026-07/royal-and-heathcote-national-parks-garawarra-state-conservation-area-plan-of-management-260201.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/royal-national-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "Camping is only permitted at designated camping areas in Royal National Park and Heathcote National Park (Table 3).",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "希思科特",
    "id": "heathcote",
    "fact": "可以独自徒步",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/2026-07/royal-and-heathcote-national-parks-garawarra-state-conservation-area-plan-of-management-260201.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/heathcote-national-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "希思科特",
    "id": "heathcote",
    "fact": "必须在营地扎营",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/2026-07/royal-and-heathcote-national-parks-garawarra-state-conservation-area-plan-of-management-260201.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/heathcote-national-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "Camping is only permitted at designated camping areas in Royal National Park and Heathcote National Park (Table 3).",
    "checked": "2026-11-13",
    "state": "已确认"
  },
  {
    "place": "希思科特",
    "id": "heathcote",
    "fact": "可以自由选址",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/2026-07/royal-and-heathcote-national-parks-garawarra-state-conservation-area-plan-of-management-260201.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/heathcote-national-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "Camping is only permitted at designated camping areas in Royal National Park and Heathcote National Park (Table 3).",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "伊拉旺谷",
    "id": "irrawong",
    "fact": "可以独自徒步",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/garigal-national-park-plan-of-management-130789.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/garigal-national-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "伊拉旺谷",
    "id": "irrawong",
    "fact": "必须在营地扎营",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/garigal-national-park-plan-of-management-130789.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/garigal-national-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "伊拉旺谷",
    "id": "irrawong",
    "fact": "可以自由选址",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/garigal-national-park-plan-of-management-130789.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/garigal-national-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "库灵盖",
    "id": "kuringgai",
    "fact": "可以独自徒步",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/ku-ring-gai-chase-national-park-plan-of-management-240045.pdf ； https://www.nationalparks.nsw.gov.au/camping-and-accommodation/campgrounds/the-basin-campground ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "库灵盖",
    "id": "kuringgai",
    "fact": "必须在营地扎营",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/ku-ring-gai-chase-national-park-plan-of-management-240045.pdf ； https://www.nationalparks.nsw.gov.au/camping-and-accommodation/campgrounds/the-basin-campground ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "Camping outside these camping areas is prohibited. The Basin campground is the only place you can camp in Ku-ring-gai Chase National Park.",
    "checked": "2026-11-13",
    "state": "已确认"
  },
  {
    "place": "库灵盖",
    "id": "kuringgai",
    "fact": "可以自由选址",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/ku-ring-gai-chase-national-park-plan-of-management-240045.pdf ； https://www.nationalparks.nsw.gov.au/camping-and-accommodation/campgrounds/the-basin-campground ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "Camping outside these camping areas is prohibited.",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "耶兰巴潟湖",
    "id": "yeramba",
    "fact": "可以独自徒步",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/georges-river-national-park-plan-of-management-940001.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/georges-river-national-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "耶兰巴潟湖",
    "id": "yeramba",
    "fact": "必须在营地扎营",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/georges-river-national-park-plan-of-management-940001.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/georges-river-national-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "耶兰巴潟湖",
    "id": "yeramba",
    "fact": "可以自由选址",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/georges-river-national-park-plan-of-management-940001.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/georges-river-national-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "达拉沃尔",
    "id": "dharawal",
    "fact": "可以独自徒步",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/dharawal-national-park-nature-reserve-state-conservation-area-plan-of-management-220491.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/dharawal-national-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "达拉沃尔",
    "id": "dharawal",
    "fact": "必须在营地扎营",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/dharawal-national-park-nature-reserve-state-conservation-area-plan-of-management-220491.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/dharawal-national-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "Not permitted due to potential environmental impacts.",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "达拉沃尔",
    "id": "dharawal",
    "fact": "可以自由选址",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/dharawal-national-park-nature-reserve-state-conservation-area-plan-of-management-220491.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/dharawal-national-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "Not permitted due to potential environmental impacts.",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "蓝山",
    "id": "blue",
    "fact": "可以独自徒步",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/blue-mountains-np-kanangra-boyd-np-plan-of-management-240234.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/blue-mountains-national-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "蓝山",
    "id": "blue",
    "fact": "必须在营地扎营",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/blue-mountains-np-kanangra-boyd-np-plan-of-management-240234.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/blue-mountains-national-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "蓝山",
    "id": "blue",
    "fact": "可以自由选址",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/blue-mountains-np-kanangra-boyd-np-plan-of-management-240234.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/blue-mountains-national-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "Allowed at designated camping areas (see Table 3). Bush camping (outside of designated camping areas) is also allowed without consent, except under the following circumstances: within 200 m of a public road, constructed walking track, designated camping area, picnic area, formalised lookout or other visitor facility; within a limestone outcrop or karst area; within any ‘slot’ canyon; anywhere it is signposted that camping is not permitted.",
    "checked": "2026-11-13",
    "state": "已确认"
  },
  {
    "place": "布迪",
    "id": "bouddi",
    "fact": "可以独自徒步",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/bouddi-national-park-plan-of-management-200571.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/bouddi-national-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "布迪",
    "id": "bouddi",
    "fact": "必须在营地扎营",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/bouddi-national-park-plan-of-management-200571.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/bouddi-national-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "Remote or bush camping outside these designated camping areas is not permitted in the park.",
    "checked": "2026-11-13",
    "state": "已确认"
  },
  {
    "place": "布迪",
    "id": "bouddi",
    "fact": "可以自由选址",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/bouddi-national-park-plan-of-management-200571.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/bouddi-national-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "Remote or bush camping outside these designated camping areas is not permitted in the park.",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "明娜穆拉",
    "id": "minnamurra",
    "fact": "可以独自徒步",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/budderoo-macquarie-pass-barren-grounds-robertson-plan-of-management-981001.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/budderoo-national-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "明娜穆拉",
    "id": "minnamurra",
    "fact": "必须在营地扎营",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/budderoo-macquarie-pass-barren-grounds-robertson-plan-of-management-981001.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/budderoo-national-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "Walk-in camping will not be permitted within the Minnamurra Rainforest area or in the nature reserves.",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "明娜穆拉",
    "id": "minnamurra",
    "fact": "可以自由选址",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/budderoo-macquarie-pass-barren-grounds-robertson-plan-of-management-981001.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/budderoo-national-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "Walk-in camping will not be permitted within the Minnamurra Rainforest area or in the nature reserves.",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "巴伦地",
    "id": "barren",
    "fact": "可以独自徒步",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/budderoo-macquarie-pass-barren-grounds-robertson-plan-of-management-981001.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/barren-grounds-nature-reserve ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "巴伦地",
    "id": "barren",
    "fact": "必须在营地扎营",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/budderoo-macquarie-pass-barren-grounds-robertson-plan-of-management-981001.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/barren-grounds-nature-reserve ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "Camping will not be permitted in Barren Grounds Nature Reserve.",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "巴伦地",
    "id": "barren",
    "fact": "可以自由选址",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/budderoo-macquarie-pass-barren-grounds-robertson-plan-of-management-981001.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/barren-grounds-nature-reserve ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "Camping will not be permitted in Barren Grounds Nature Reserve.",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "卷心菜树湾",
    "id": "shelly",
    "fact": "可以独自徒步",
    "source": "https://www.dpi.nsw.gov.au/fishing/marine-protected-areas/aquatic-reserves/cabbage-tree-bay-aquatic-reserve ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "卷心菜树湾",
    "id": "shelly",
    "fact": "必须在营地扎营",
    "source": "https://www.dpi.nsw.gov.au/fishing/marine-protected-areas/aquatic-reserves/cabbage-tree-bay-aquatic-reserve ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "卷心菜树湾",
    "id": "shelly",
    "fact": "可以自由选址",
    "source": "https://www.dpi.nsw.gov.au/fishing/marine-protected-areas/aquatic-reserves/cabbage-tree-bay-aquatic-reserve ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "克利夫顿花园",
    "id": "clifton",
    "fact": "可以独自徒步",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/sydney-harbour-national-park-plan-of-management-120757.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/sydney-harbour-national-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "克利夫顿花园",
    "id": "clifton",
    "fact": "必须在营地扎营",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/sydney-harbour-national-park-plan-of-management-120757.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/sydney-harbour-national-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "Camping is not permitted in any part of Sydney Harbour National Park except Clark Island.",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "克利夫顿花园",
    "id": "clifton",
    "fact": "可以自由选址",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/sydney-harbour-national-park-plan-of-management-120757.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/sydney-harbour-national-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "Camping is not permitted in any part of Sydney Harbour National Park except Clark Island.",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "戈登斯湾",
    "id": "gordons",
    "fact": "可以独自徒步",
    "source": "https://www.dpi.nsw.gov.au/fishing/marine-protected-areas/aquatic-reserves/bronte-coogee-aquatic-reserve ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "戈登斯湾",
    "id": "gordons",
    "fact": "必须在营地扎营",
    "source": "https://www.dpi.nsw.gov.au/fishing/marine-protected-areas/aquatic-reserves/bronte-coogee-aquatic-reserve ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "戈登斯湾",
    "id": "gordons",
    "fact": "可以自由选址",
    "source": "https://www.dpi.nsw.gov.au/fishing/marine-protected-areas/aquatic-reserves/bronte-coogee-aquatic-reserve ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "班克斯角",
    "id": "capebanks",
    "fact": "可以独自徒步",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/kamay-botany-bay-national-park-plan-of-management-20200019.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "班克斯角",
    "id": "capebanks",
    "fact": "必须在营地扎营",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/kamay-botany-bay-national-park-plan-of-management-20200019.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "班克斯角",
    "id": "capebanks",
    "fact": "可以自由选址",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/kamay-botany-bay-national-park-plan-of-management-20200019.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "裸岛",
    "id": "bare",
    "fact": "可以独自徒步",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/kamay-botany-bay-national-park-plan-of-management-20200019.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "裸岛",
    "id": "bare",
    "fact": "必须在营地扎营",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/kamay-botany-bay-national-park-plan-of-management-20200019.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "裸岛",
    "id": "bare",
    "fact": "可以自由选址",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/kamay-botany-bay-national-park-plan-of-management-20200019.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "长礁",
    "id": "longreef",
    "fact": "可以独自徒步",
    "source": "https://www.dpi.nsw.gov.au/fishing/marine-protected-areas/aquatic-reserves/long-reef-aquatic-reserve ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "长礁",
    "id": "longreef",
    "fact": "必须在营地扎营",
    "source": "https://www.dpi.nsw.gov.au/fishing/marine-protected-areas/aquatic-reserves/long-reef-aquatic-reserve ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "长礁",
    "id": "longreef",
    "fact": "可以自由选址",
    "source": "https://www.dpi.nsw.gov.au/fishing/marine-protected-areas/aquatic-reserves/long-reef-aquatic-reserve ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "布殊兰格斯湾",
    "id": "bushrangers",
    "fact": "可以独自徒步",
    "source": "https://www.dpi.nsw.gov.au/fishing/marine-protected-areas/aquatic-reserves/bushrangers-bay-aquatic-reserve ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "布殊兰格斯湾",
    "id": "bushrangers",
    "fact": "必须在营地扎营",
    "source": "https://www.dpi.nsw.gov.au/fishing/marine-protected-areas/aquatic-reserves/bushrangers-bay-aquatic-reserve ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "布殊兰格斯湾",
    "id": "bushrangers",
    "fact": "可以自由选址",
    "source": "https://www.dpi.nsw.gov.au/fishing/marine-protected-areas/aquatic-reserves/bushrangers-bay-aquatic-reserve ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "基拉利",
    "id": "killalea",
    "fact": "可以独自徒步",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/2025-01/killalea-regional-park-plan-of-management-240285.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "基拉利",
    "id": "killalea",
    "fact": "必须在营地扎营",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/2025-01/killalea-regional-park-plan-of-management-240285.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "Only allowed at Killalea campground. Bookings required. Camping and overnight stays are prohibited elsewhere in the park.",
    "checked": "2026-11-13",
    "state": "已确认"
  },
  {
    "place": "基拉利",
    "id": "killalea",
    "fact": "可以自由选址",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/2025-01/killalea-regional-park-plan-of-management-240285.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "Only allowed at Killalea campground. Bookings required. Camping and overnight stays are prohibited elsewhere in the park.",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "图里梅塔",
    "id": "turimetta",
    "fact": "可以独自徒步",
    "source": "https://www.northernbeaches.nsw.gov.au/environment/coast-and-waterways/headlands ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "图里梅塔",
    "id": "turimetta",
    "fact": "必须在营地扎营",
    "source": "https://www.northernbeaches.nsw.gov.au/environment/coast-and-waterways/headlands ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "图里梅塔",
    "id": "turimetta",
    "fact": "可以自由选址",
    "source": "https://www.northernbeaches.nsw.gov.au/environment/coast-and-waterways/headlands ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "班加利角",
    "id": "bangalley",
    "fact": "可以独自徒步",
    "source": "https://www.northernbeaches.nsw.gov.au/environment/coast-and-waterways/headlands ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "班加利角",
    "id": "bangalley",
    "fact": "必须在营地扎营",
    "source": "https://www.northernbeaches.nsw.gov.au/environment/coast-and-waterways/headlands ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "班加利角",
    "id": "bangalley",
    "fact": "可以自由选址",
    "source": "https://www.northernbeaches.nsw.gov.au/environment/coast-and-waterways/headlands ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "沃利溪",
    "id": "wolli",
    "fact": "可以独自徒步",
    "source": "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/wolli-creek-regional-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "沃利溪",
    "id": "wolli",
    "fact": "必须在营地扎营",
    "source": "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/wolli-creek-regional-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "沃利溪",
    "id": "wolli",
    "fact": "可以自由选址",
    "source": "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/wolli-creek-regional-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "着陆灯湿地",
    "id": "lights",
    "fact": "可以独自徒步",
    "source": "https://www.bayside.nsw.gov.au/your-council/latest-news/landing-lights-wetlands-bushcare ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "着陆灯湿地",
    "id": "lights",
    "fact": "必须在营地扎营",
    "source": "https://www.bayside.nsw.gov.au/your-council/latest-news/landing-lights-wetlands-bushcare ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "着陆灯湿地",
    "id": "lights",
    "fact": "可以自由选址",
    "source": "https://www.bayside.nsw.gov.au/your-council/latest-news/landing-lights-wetlands-bushcare ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "盐盘溪",
    "id": "saltpan",
    "fact": "可以独自徒步",
    "source": "https://yoursay.georgesriver.nsw.gov.au/salt-pan-creek-corridor ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "盐盘溪",
    "id": "saltpan",
    "fact": "必须在营地扎营",
    "source": "https://yoursay.georgesriver.nsw.gov.au/salt-pan-creek-corridor ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "盐盘溪",
    "id": "saltpan",
    "fact": "可以自由选址",
    "source": "https://yoursay.georgesriver.nsw.gov.au/salt-pan-creek-corridor ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "曼利水坝",
    "id": "manlydam",
    "fact": "可以独自徒步",
    "source": "https://www.northernbeaches.nsw.gov.au/things-to-do/parks-and-trails/parks/manly-dam ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "曼利水坝",
    "id": "manlydam",
    "fact": "必须在营地扎营",
    "source": "https://www.northernbeaches.nsw.gov.au/things-to-do/parks-and-trails/parks/manly-dam ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "曼利水坝",
    "id": "manlydam",
    "fact": "可以自由选址",
    "source": "https://www.northernbeaches.nsw.gov.au/things-to-do/parks-and-trails/parks/manly-dam ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "布法罗溪",
    "id": "buffalo",
    "fact": "可以独自徒步",
    "source": "https://www.huntershill.nsw.gov.au/Recreation/Parks-and-Reserves/Buffalo-Creek-Reserve ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "布法罗溪",
    "id": "buffalo",
    "fact": "必须在营地扎营",
    "source": "https://www.huntershill.nsw.gov.au/Recreation/Parks-and-Reserves/Buffalo-Creek-Reserve ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "布法罗溪",
    "id": "buffalo",
    "fact": "可以自由选址",
    "source": "https://www.huntershill.nsw.gov.au/Recreation/Parks-and-Reserves/Buffalo-Creek-Reserve ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "奥特利公园",
    "id": "oatley",
    "fact": "可以独自徒步",
    "source": "https://www.nsw.gov.au/visiting-and-exploring-nsw/locations-and-attractions/oatley-park-0 ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "奥特利公园",
    "id": "oatley",
    "fact": "必须在营地扎营",
    "source": "https://www.nsw.gov.au/visiting-and-exploring-nsw/locations-and-attractions/oatley-park-0 ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "奥特利公园",
    "id": "oatley",
    "fact": "可以自由选址",
    "source": "https://www.nsw.gov.au/visiting-and-exploring-nsw/locations-and-attractions/oatley-park-0 ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "克罗斯兰兹",
    "id": "crosslands",
    "fact": "可以独自徒步",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/berowra-valley-national-park-regional-park-plan-of-management-230071.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/berowra-valley-national-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "克罗斯兰兹",
    "id": "crosslands",
    "fact": "必须在营地扎营",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/berowra-valley-national-park-regional-park-plan-of-management-230071.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/berowra-valley-national-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "Camping is currently permitted at Crosslands Reserve, Lyrebird Gully and Tunks Ridge. Crosslands Reserve is a designated camping area with supporting facilities and is used by a variety of community groups, such as Scouts Australia, for large camping events and by smaller, independent camping groups.",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "克罗斯兰兹",
    "id": "crosslands",
    "fact": "可以自由选址",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/berowra-valley-national-park-regional-park-plan-of-management-230071.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/berowra-valley-national-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "Crosslands Reserve is a designated camping area with supporting facilities and is used by a variety of community groups, such as Scouts Australia, for large camping events and by smaller, independent camping groups.",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "卡坦德拉",
    "id": "katandra",
    "fact": "可以独自徒步",
    "source": "https://www.northernbeaches.nsw.gov.au/things-to-do/recreation-area/katandra-sanctuary ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "卡坦德拉",
    "id": "katandra",
    "fact": "必须在营地扎营",
    "source": "https://www.northernbeaches.nsw.gov.au/things-to-do/recreation-area/katandra-sanctuary ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "卡坦德拉",
    "id": "katandra",
    "fact": "可以自由选址",
    "source": "https://www.northernbeaches.nsw.gov.au/things-to-do/recreation-area/katandra-sanctuary ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "迪怀潟湖",
    "id": "deewhy",
    "fact": "可以独自徒步",
    "source": "https://www.northernbeaches.nsw.gov.au/things-to-do/recreation-area/dee-why-lagoon-wildlife-refuge ； https://www.northernbeaches.nsw.gov.au/library/your-library/news/history-camping-on-northern-beaches ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "迪怀潟湖",
    "id": "deewhy",
    "fact": "必须在营地扎营",
    "source": "https://www.northernbeaches.nsw.gov.au/things-to-do/recreation-area/dee-why-lagoon-wildlife-refuge ； https://www.northernbeaches.nsw.gov.au/library/your-library/news/history-camping-on-northern-beaches ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety",
    "quote": "Queenscliff, Freshwater, Dee Why, Long Reef, Whale Beach, Narrabeen Lagoon and Middle Harbour were all popular places to camp.",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "迪怀潟湖",
    "id": "deewhy",
    "fact": "可以自由选址",
    "source": "https://www.northernbeaches.nsw.gov.au/things-to-do/recreation-area/dee-why-lagoon-wildlife-refuge ； https://www.northernbeaches.nsw.gov.au/library/your-library/news/history-camping-on-northern-beaches ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "深溪",
    "id": "deepcreek",
    "fact": "可以独自徒步",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/garigal-national-park-plan-of-management-130789.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "深溪",
    "id": "deepcreek",
    "fact": "必须在营地扎营",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/garigal-national-park-plan-of-management-130789.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "深溪",
    "id": "deepcreek",
    "fact": "可以自由选址",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/garigal-national-park-plan-of-management-130789.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "坚毅海滩",
    "id": "resolute",
    "fact": "可以独自徒步",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/ku-ring-gai-chase-national-park-plan-of-management-240045.pdf ； https://www.nationalparks.nsw.gov.au/camping-and-accommodation/campgrounds/the-basin-campground ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "坚毅海滩",
    "id": "resolute",
    "fact": "必须在营地扎营",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/ku-ring-gai-chase-national-park-plan-of-management-240045.pdf ； https://www.nationalparks.nsw.gov.au/camping-and-accommodation/campgrounds/the-basin-campground ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "坚毅海滩",
    "id": "resolute",
    "fact": "可以自由选址",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/ku-ring-gai-chase-national-park-plan-of-management-240045.pdf ； https://www.nationalparks.nsw.gov.au/camping-and-accommodation/campgrounds/the-basin-campground ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "吉本角",
    "id": "jibbon",
    "fact": "可以独自徒步",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/2026-07/royal-and-heathcote-national-parks-garawarra-state-conservation-area-plan-of-management-260201.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "吉本角",
    "id": "jibbon",
    "fact": "必须在营地扎营",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/2026-07/royal-and-heathcote-national-parks-garawarra-state-conservation-area-plan-of-management-260201.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "吉本角",
    "id": "jibbon",
    "fact": "可以自由选址",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/2026-07/royal-and-heathcote-national-parks-garawarra-state-conservation-area-plan-of-management-260201.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "奥特福德",
    "id": "otford",
    "fact": "可以独自徒步",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/2026-07/royal-and-heathcote-national-parks-garawarra-state-conservation-area-plan-of-management-260201.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "奥特福德",
    "id": "otford",
    "fact": "必须在营地扎营",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/2026-07/royal-and-heathcote-national-parks-garawarra-state-conservation-area-plan-of-management-260201.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "奥特福德",
    "id": "otford",
    "fact": "可以自由选址",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/2026-07/royal-and-heathcote-national-parks-garawarra-state-conservation-area-plan-of-management-260201.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "卡拉库朗",
    "id": "curracurrang",
    "fact": "可以独自徒步",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/2026-07/royal-and-heathcote-national-parks-garawarra-state-conservation-area-plan-of-management-260201.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "卡拉库朗",
    "id": "curracurrang",
    "fact": "必须在营地扎营",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/2026-07/royal-and-heathcote-national-parks-garawarra-state-conservation-area-plan-of-management-260201.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "卡拉库朗",
    "id": "curracurrang",
    "fact": "可以自由选址",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/2026-07/royal-and-heathcote-national-parks-garawarra-state-conservation-area-plan-of-management-260201.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "卡卢池",
    "id": "karloo",
    "fact": "可以独自徒步",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/2026-07/royal-and-heathcote-national-parks-garawarra-state-conservation-area-plan-of-management-260201.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "卡卢池",
    "id": "karloo",
    "fact": "必须在营地扎营",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/2026-07/royal-and-heathcote-national-parks-garawarra-state-conservation-area-plan-of-management-260201.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "卡卢池",
    "id": "karloo",
    "fact": "可以自由选址",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/2026-07/royal-and-heathcote-national-parks-garawarra-state-conservation-area-plan-of-management-260201.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "凯利瀑布",
    "id": "kelly",
    "fact": "可以独自徒步",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/2026-07/royal-and-heathcote-national-parks-garawarra-state-conservation-area-plan-of-management-260201.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "凯利瀑布",
    "id": "kelly",
    "fact": "必须在营地扎营",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/2026-07/royal-and-heathcote-national-parks-garawarra-state-conservation-area-plan-of-management-260201.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "凯利瀑布",
    "id": "kelly",
    "fact": "可以自由选址",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/2026-07/royal-and-heathcote-national-parks-garawarra-state-conservation-area-plan-of-management-260201.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "卡林顿瀑布",
    "id": "carrington",
    "fact": "可以独自徒步",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/budderoo-macquarie-pass-barren-grounds-robertson-plan-of-management-981001.pdf ； https://www.nationalparks.nsw.gov.au/camping-and-accommodation/campgrounds/carrington-falls-campground ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "卡林顿瀑布",
    "id": "carrington",
    "fact": "必须在营地扎营",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/budderoo-macquarie-pass-barren-grounds-robertson-plan-of-management-981001.pdf ； https://www.nationalparks.nsw.gov.au/camping-and-accommodation/campgrounds/carrington-falls-campground ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "卡林顿瀑布",
    "id": "carrington",
    "fact": "可以自由选址",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/budderoo-macquarie-pass-barren-grounds-robertson-plan-of-management-981001.pdf ； https://www.nationalparks.nsw.gov.au/camping-and-accommodation/campgrounds/carrington-falls-campground ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "麦夸里山口",
    "id": "macpass",
    "fact": "可以独自徒步",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/budderoo-macquarie-pass-barren-grounds-robertson-plan-of-management-981001.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/macquarie-pass-national-park/visitor-info ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "麦夸里山口",
    "id": "macpass",
    "fact": "必须在营地扎营",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/budderoo-macquarie-pass-barren-grounds-robertson-plan-of-management-981001.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/macquarie-pass-national-park/visitor-info ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "麦夸里山口",
    "id": "macpass",
    "fact": "可以自由选址",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/budderoo-macquarie-pass-barren-grounds-robertson-plan-of-management-981001.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/macquarie-pass-national-park/visitor-info ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "Walk-in camping will be permitted in Macquarie Pass and most of Budderoo National Park more than 1 km from any public vehicle access road.",
    "checked": "2026-11-13",
    "state": "已确认"
  },
  {
    "place": "檫木谷",
    "id": "sassafras",
    "fact": "可以独自徒步",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/blue-mountains-np-kanangra-boyd-np-plan-of-management-240234.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/blue-mountains-national-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "檫木谷",
    "id": "sassafras",
    "fact": "必须在营地扎营",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/blue-mountains-np-kanangra-boyd-np-plan-of-management-240234.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/blue-mountains-national-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "檫木谷",
    "id": "sassafras",
    "fact": "可以自由选址",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/blue-mountains-np-kanangra-boyd-np-plan-of-management-240234.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/blue-mountains-national-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "胜利小径",
    "id": "victory",
    "fact": "可以独自徒步",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/blue-mountains-np-kanangra-boyd-np-plan-of-management-240234.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "胜利小径",
    "id": "victory",
    "fact": "必须在营地扎营",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/blue-mountains-np-kanangra-boyd-np-plan-of-management-240234.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "胜利小径",
    "id": "victory",
    "fact": "可以自由选址",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/blue-mountains-np-kanangra-boyd-np-plan-of-management-240234.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "帕蒂海滩",
    "id": "putty",
    "fact": "可以独自徒步",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/bouddi-national-park-plan-of-management-200571.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "帕蒂海滩",
    "id": "putty",
    "fact": "必须在营地扎营",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/bouddi-national-park-plan-of-management-200571.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "At the designated camping areas listed below and shown on Figure 1, namely: Putty Beach Camping Area; Little Beach Camping Area; Tallow Beach Camping Area. Remote or bush camping outside these designated camping areas is not permitted in the park.",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "帕蒂海滩",
    "id": "putty",
    "fact": "可以自由选址",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/bouddi-national-park-plan-of-management-200571.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "Remote or bush camping outside these designated camping areas is not permitted in the park.",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "皮特敦潟湖",
    "id": "pitttown",
    "fact": "可以独自徒步",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/scheyville-national-park-pitt-town-nature-reserve-plan-of-management-000925.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/pitt-town-nature-reserve ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "皮特敦潟湖",
    "id": "pitttown",
    "fact": "必须在营地扎营",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/scheyville-national-park-pitt-town-nature-reserve-plan-of-management-000925.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/pitt-town-nature-reserve ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "皮特敦潟湖",
    "id": "pitttown",
    "fact": "可以自由选址",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/scheyville-national-park-pitt-town-nature-reserve-plan-of-management-000925.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/pitt-town-nature-reserve ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "布舍尔斯潟湖",
    "id": "bushells",
    "fact": "可以独自徒步",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/scheyville-national-park-pitt-town-nature-reserve-plan-of-management-000925.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "布舍尔斯潟湖",
    "id": "bushells",
    "fact": "必须在营地扎营",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/scheyville-national-park-pitt-town-nature-reserve-plan-of-management-000925.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "布舍尔斯潟湖",
    "id": "bushells",
    "fact": "可以自由选址",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/scheyville-national-park-pitt-town-nature-reserve-plan-of-management-000925.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "沙伊维尔",
    "id": "scheyville",
    "fact": "可以独自徒步",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/scheyville-national-park-pitt-town-nature-reserve-plan-of-management-000925.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/scheyville-national-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "沙伊维尔",
    "id": "scheyville",
    "fact": "必须在营地扎营",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/scheyville-national-park-pitt-town-nature-reserve-plan-of-management-000925.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/scheyville-national-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "Consequently, with the exception of educational groups given permission to camp at Longneck Lagoon (see section 4.2.1), camping will be prohibited within Scheyville National Park.",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "沙伊维尔",
    "id": "scheyville",
    "fact": "可以自由选址",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/scheyville-national-park-pitt-town-nature-reserve-plan-of-management-000925.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/scheyville-national-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "Consequently, with the exception of educational groups given permission to camp at Longneck Lagoon (see section 4.2.1), camping will be prohibited within Scheyville National Park.",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "本茨盆地",
    "id": "bents",
    "fact": "可以独自徒步",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/bents-basin-state-conservation-area-plan-of-management-220204.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/bents-basin-state-conservation-area ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "本茨盆地",
    "id": "bents",
    "fact": "必须在营地扎营",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/bents-basin-state-conservation-area-plan-of-management-220204.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/bents-basin-state-conservation-area ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "In Bents Basin Camping Area and, if developed, designated sites in Tara block. Bush camping is not allowed.",
    "checked": "2026-11-13",
    "state": "已确认"
  },
  {
    "place": "本茨盆地",
    "id": "bents",
    "fact": "可以自由选址",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/bents-basin-state-conservation-area-plan-of-management-220204.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/bents-basin-state-conservation-area ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "In Bents Basin Camping Area and, if developed, designated sites in Tara block. Bush camping is not allowed.",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "瑟尔米尔湖",
    "id": "thirlmere",
    "fact": "可以独自徒步",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/thirlmere-lakes-national-park-plan-of-management-190545.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/thirlmere-lakes-national-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "瑟尔米尔湖",
    "id": "thirlmere",
    "fact": "必须在营地扎营",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/thirlmere-lakes-national-park-plan-of-management-190545.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/thirlmere-lakes-national-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "Prohibit camping in the park.",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "瑟尔米尔湖",
    "id": "thirlmere",
    "fact": "可以自由选址",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/thirlmere-lakes-national-park-plan-of-management-190545.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/thirlmere-lakes-national-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "Prohibit camping in the park.",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "卡塔拉克特水坝",
    "id": "cataract",
    "fact": "可以独自徒步",
    "source": "https://www.waternsw.com.au/nsw-dams/greater-sydney-dams/cataract-dam ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "卡塔拉克特水坝",
    "id": "cataract",
    "fact": "必须在营地扎营",
    "source": "https://www.waternsw.com.au/nsw-dams/greater-sydney-dams/cataract-dam ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "卡塔拉克特水坝",
    "id": "cataract",
    "fact": "可以自由选址",
    "source": "https://www.waternsw.com.au/nsw-dams/greater-sydney-dams/cataract-dam ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "塔洛瓦",
    "id": "tallowa",
    "fact": "可以独自徒步",
    "source": "https://www.waternsw.com.au/nsw-dams/greater-sydney-dams/bendeela-recreation-area ； https://www.waternsw.com.au/nsw-dams/greater-sydney-dams/tallowa-dam ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "塔洛瓦",
    "id": "tallowa",
    "fact": "必须在营地扎营",
    "source": "https://www.waternsw.com.au/nsw-dams/greater-sydney-dams/bendeela-recreation-area ； https://www.waternsw.com.au/nsw-dams/greater-sydney-dams/tallowa-dam ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety",
    "quote": "Tallowa Dam Picnic Area is a day use only area and camping is not permitted.",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "塔洛瓦",
    "id": "tallowa",
    "fact": "可以自由选址",
    "source": "https://www.waternsw.com.au/nsw-dams/greater-sydney-dams/bendeela-recreation-area ； https://www.waternsw.com.au/nsw-dams/greater-sydney-dams/tallowa-dam ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety",
    "quote": "Tallowa Dam Picnic Area is a day use only area and camping is not permitted.",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "萤火虫隧道",
    "id": "glow",
    "fact": "可以独自徒步",
    "source": "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/glow-worm-tunnel-walking-track/visitor-info ； https://www.environment.nsw.gov.au/sites/default/files/2025-02/wollemi-national-park-plan-of-management-220080.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "萤火虫隧道",
    "id": "glow",
    "fact": "必须在营地扎营",
    "source": "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/glow-worm-tunnel-walking-track/visitor-info ； https://www.environment.nsw.gov.au/sites/default/files/2025-02/wollemi-national-park-plan-of-management-220080.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "Camping is not permitted in the Glow Worm Tunnel area.",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "萤火虫隧道",
    "id": "glow",
    "fact": "可以自由选址",
    "source": "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/glow-worm-tunnel-walking-track/visitor-info ； https://www.environment.nsw.gov.au/sites/default/files/2025-02/wollemi-national-park-plan-of-management-220080.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "Camping is not permitted in the Glow Worm Tunnel area.",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "七英里海滩",
    "id": "seven",
    "fact": "可以独自徒步",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/seven-mile-beach-national-park-comerong-island-reserve-plan-of-management-980218.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/seven-mile-beach-national-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "七英里海滩",
    "id": "seven",
    "fact": "必须在营地扎营",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/seven-mile-beach-national-park-comerong-island-reserve-plan-of-management-980218.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/seven-mile-beach-national-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "The Gerroa area will be closed to camping.",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "七英里海滩",
    "id": "seven",
    "fact": "可以自由选址",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/seven-mile-beach-national-park-comerong-island-reserve-plan-of-management-980218.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/seven-mile-beach-national-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "The Gerroa area will be closed to camping.",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "耶路撒冷湾",
    "id": "jerusalem",
    "fact": "可以独自徒步",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/ku-ring-gai-chase-national-park-plan-of-management-240045.pdf ； https://www.nationalparks.nsw.gov.au/camping-and-accommodation/campgrounds/the-basin-campground ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "耶路撒冷湾",
    "id": "jerusalem",
    "fact": "必须在营地扎营",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/ku-ring-gai-chase-national-park-plan-of-management-240045.pdf ； https://www.nationalparks.nsw.gov.au/camping-and-accommodation/campgrounds/the-basin-campground ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "耶路撒冷湾",
    "id": "jerusalem",
    "fact": "可以自由选址",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/ku-ring-gai-chase-national-park-plan-of-management-240045.pdf ； https://www.nationalparks.nsw.gov.au/camping-and-accommodation/campgrounds/the-basin-campground ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "穆加马拉",
    "id": "muogamarra",
    "fact": "可以独自徒步",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/marramarra-muogamarra-maroota-plan-of-management-160655.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/muogamarra-nature-reserve ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "穆加马拉",
    "id": "muogamarra",
    "fact": "必须在营地扎营",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/marramarra-muogamarra-maroota-plan-of-management-160655.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/muogamarra-nature-reserve ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "The Field Studies Centre will be permitted to have up to 40 students camping near the Field Studies building in the nature reserve on a limited number of nights each year with the permission of the District Manager.",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "穆加马拉",
    "id": "muogamarra",
    "fact": "可以自由选址",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/marramarra-muogamarra-maroota-plan-of-management-160655.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/muogamarra-nature-reserve ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "The Field Studies Centre will be permitted to have up to 40 students camping near the Field Studies building in the nature reserve on a limited number of nights each year with the permission of the District Manager.",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "桑登角",
    "id": "sandon",
    "fact": "可以独自徒步",
    "source": "https://www.wollongong.nsw.gov.au/__data/assets/pdf_file/0008/31004/Sandon-Point-and-McCauleys-Beach-Plan-of-Management.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "桑登角",
    "id": "sandon",
    "fact": "必须在营地扎营",
    "source": "https://www.wollongong.nsw.gov.au/__data/assets/pdf_file/0008/31004/Sandon-Point-and-McCauleys-Beach-Plan-of-Management.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "桑登角",
    "id": "sandon",
    "fact": "可以自由选址",
    "source": "https://www.wollongong.nsw.gov.au/__data/assets/pdf_file/0008/31004/Sandon-Point-and-McCauleys-Beach-Plan-of-Management.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "船港",
    "id": "boatharbour",
    "fact": "可以独自徒步",
    "source": "https://www.dpi.nsw.gov.au/fishing/marine-protected-areas/aquatic-reserves/boat-harbour-aquatic-reserve ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "船港",
    "id": "boatharbour",
    "fact": "必须在营地扎营",
    "source": "https://www.dpi.nsw.gov.au/fishing/marine-protected-areas/aquatic-reserves/boat-harbour-aquatic-reserve ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "船港",
    "id": "boatharbour",
    "fact": "可以自由选址",
    "source": "https://www.dpi.nsw.gov.au/fishing/marine-protected-areas/aquatic-reserves/boat-harbour-aquatic-reserve ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "岩洞步道",
    "id": "walls",
    "fact": "可以独自徒步",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/blue-mountains-np-kanangra-boyd-np-plan-of-management-240234.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "岩洞步道",
    "id": "walls",
    "fact": "必须在营地扎营",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/blue-mountains-np-kanangra-boyd-np-plan-of-management-240234.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "岩洞步道",
    "id": "walls",
    "fact": "可以自由选址",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/blue-mountains-np-kanangra-boyd-np-plan-of-management-240234.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "威尔逊山",
    "id": "mtwilson",
    "fact": "可以独自徒步",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/blue-mountains-np-kanangra-boyd-np-plan-of-management-240234.pdf ； https://www.bmcc.nsw.gov.au/camping ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "威尔逊山",
    "id": "mtwilson",
    "fact": "必须在营地扎营",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/blue-mountains-np-kanangra-boyd-np-plan-of-management-240234.pdf ； https://www.bmcc.nsw.gov.au/camping ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "威尔逊山",
    "id": "mtwilson",
    "fact": "可以自由选址",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/blue-mountains-np-kanangra-boyd-np-plan-of-management-240234.pdf ； https://www.bmcc.nsw.gov.au/camping ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "石窟角",
    "id": "grotto",
    "fact": "可以独自徒步",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/sydney-harbour-national-park-plan-of-management-120757.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "石窟角",
    "id": "grotto",
    "fact": "必须在营地扎营",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/sydney-harbour-national-park-plan-of-management-120757.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "Camping is not permitted in any part of Sydney Harbour National Park except Clark Island.",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "石窟角",
    "id": "grotto",
    "fact": "可以自由选址",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/sydney-harbour-national-park-plan-of-management-120757.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "Camping is not permitted in any part of Sydney Harbour National Park except Clark Island.",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "铭文角",
    "id": "inscript",
    "fact": "可以独自徒步",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/kamay-botany-bay-national-park-plan-of-management-20200019.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "铭文角",
    "id": "inscript",
    "fact": "必须在营地扎营",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/kamay-botany-bay-national-park-plan-of-management-20200019.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "铭文角",
    "id": "inscript",
    "fact": "可以自由选址",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/kamay-botany-bay-national-park-plan-of-management-20200019.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "瓦拉瞭望台",
    "id": "warrah",
    "fact": "可以独自徒步",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/brisbane-water-national-park-plan-of-management-920000.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/brisbane-water-national-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "瓦拉瞭望台",
    "id": "warrah",
    "fact": "必须在营地扎营",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/brisbane-water-national-park-plan-of-management-920000.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/brisbane-water-national-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "瓦拉瞭望台",
    "id": "warrah",
    "fact": "可以自由选址",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/brisbane-water-national-park-plan-of-management-920000.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/brisbane-water-national-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "卡泰",
    "id": "cattai",
    "fact": "可以独自徒步",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/cattai-national-park-plan-of-management-970124.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/cattai-national-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "卡泰",
    "id": "cattai",
    "fact": "必须在营地扎营",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/cattai-national-park-plan-of-management-970124.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/cattai-national-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "Camping will only be permitted in designated camping areas on Cattai Park and Hope Farm.",
    "checked": "2026-11-13",
    "state": "已确认"
  },
  {
    "place": "卡泰",
    "id": "cattai",
    "fact": "可以自由选址",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/cattai-national-park-plan-of-management-970124.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/cattai-national-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "Camping will only be permitted in designated camping areas on Cattai Park and Hope Farm.",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "贝尔莫尔瀑布",
    "id": "belmore",
    "fact": "可以独自徒步",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/budderoo-macquarie-pass-barren-grounds-robertson-plan-of-management-981001.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "贝尔莫尔瀑布",
    "id": "belmore",
    "fact": "必须在营地扎营",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/budderoo-macquarie-pass-barren-grounds-robertson-plan-of-management-981001.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "贝尔莫尔瀑布",
    "id": "belmore",
    "fact": "可以自由选址",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/budderoo-macquarie-pass-barren-grounds-robertson-plan-of-management-981001.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "纳拉宾潟湖",
    "id": "narrabeen",
    "fact": "可以独自徒步",
    "source": "https://www.northernbeaches.nsw.gov.au/things-to-do/recreation-area/narrabeen-lagoon-state-park ； https://www.northernbeaches.nsw.gov.au/library/your-library/news/history-camping-on-northern-beaches ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "纳拉宾潟湖",
    "id": "narrabeen",
    "fact": "必须在营地扎营",
    "source": "https://www.northernbeaches.nsw.gov.au/things-to-do/recreation-area/narrabeen-lagoon-state-park ； https://www.northernbeaches.nsw.gov.au/library/your-library/news/history-camping-on-northern-beaches ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety",
    "quote": "Today, the only places you can legally camp on the Northern Beaches are Narrabeen and The Basin in Pittwater.",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "纳拉宾潟湖",
    "id": "narrabeen",
    "fact": "可以自由选址",
    "source": "https://www.northernbeaches.nsw.gov.au/things-to-do/recreation-area/narrabeen-lagoon-state-park ； https://www.northernbeaches.nsw.gov.au/library/your-library/news/history-camping-on-northern-beaches ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety",
    "quote": "Today, the only places you can legally camp on the Northern Beaches are Narrabeen and The Basin in Pittwater.",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "维亚纳马塔",
    "id": "wiana",
    "fact": "可以独自徒步",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/wianamatta-nature-reserve-statement-of-management-intent-140250.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/wianamatta-nature-reserve ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "维亚纳马塔",
    "id": "wiana",
    "fact": "必须在营地扎营",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/wianamatta-nature-reserve-statement-of-management-intent-140250.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/wianamatta-nature-reserve ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "维亚纳马塔",
    "id": "wiana",
    "fact": "可以自由选址",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/wianamatta-nature-reserve-statement-of-management-intent-140250.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/wianamatta-nature-reserve ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "蓝山 Grose Wilderness",
    "id": "grose",
    "fact": "可以独自徒步",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/blue-mountains-np-kanangra-boyd-np-plan-of-management-240234.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "蓝山 Grose Wilderness",
    "id": "grose",
    "fact": "必须在营地扎营",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/blue-mountains-np-kanangra-boyd-np-plan-of-management-240234.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "蓝山 Grose Wilderness",
    "id": "grose",
    "fact": "可以自由选址",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/blue-mountains-np-kanangra-boyd-np-plan-of-management-240234.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "Grose Wilderness – 47,900 ha of the upper Grose Valley of Blue Mountains National Park Within the parks’ wilderness areas, formed trails are limited but there are basic walking tracks and walking routes and bush camping (i.e. camping outside of designated camping areas) is generally permitted, except in the Schedule 1 special areas as outlined in Section 1.3. Allowed at designated camping areas (see Table 3). Bush camping (outside of designated camping areas) is also allowed without consent, except under the following circumstances: within 200 m of a public road, constructed walking track, designated camping area, picnic area, formalised lookout or other visitor facility; within a limestone outcrop or karst area; within any ‘slot’ canyon; anywhere it is signposted that camping is not permitted.",
    "checked": "2026-11-13",
    "state": "已确认"
  },
  {
    "place": "蓝山南侧偏远区域",
    "id": "southbm",
    "fact": "可以独自徒步",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/blue-mountains-np-kanangra-boyd-np-plan-of-management-240234.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "蓝山南侧偏远区域",
    "id": "southbm",
    "fact": "必须在营地扎营",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/blue-mountains-np-kanangra-boyd-np-plan-of-management-240234.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "蓝山南侧偏远区域",
    "id": "southbm",
    "fact": "可以自由选址",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/blue-mountains-np-kanangra-boyd-np-plan-of-management-240234.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Gardens of Stone State Conservation Area",
    "id": "gos",
    "fact": "可以独自徒步",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/gardens-of-stone-state-conservation-area-plan-of-management-220570.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/gardens-of-stone-state-conservation-area/visitor-info ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Gardens of Stone State Conservation Area",
    "id": "gos",
    "fact": "必须在营地扎营",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/gardens-of-stone-state-conservation-area-plan-of-management-220570.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/gardens-of-stone-state-conservation-area/visitor-info ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "Vehicle-based camping is allowed in previous camping areas only.",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Gardens of Stone State Conservation Area",
    "id": "gos",
    "fact": "可以自由选址",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/gardens-of-stone-state-conservation-area-plan-of-management-220570.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/gardens-of-stone-state-conservation-area/visitor-info ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "Bush camping is allowed at sites further than 200 m from park infrastructure such as roads, walking tracks and lookouts. Remote, backpack camping for overnight bushwalks is also permitted.",
    "checked": "2026-11-13",
    "state": "已确认"
  },
  {
    "place": "Wollemi",
    "id": "wollemi",
    "fact": "可以独自徒步",
    "source": "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/wollemi-national-park/visitor-info ； https://www.environment.nsw.gov.au/sites/default/files/2025-02/wollemi-national-park-plan-of-management-220080.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "You should be absolutely sure of your capabilities, and always walk in a group. Party sizes in wilderness areas are restricted to a maximum of eight people.",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Wollemi",
    "id": "wollemi",
    "fact": "必须在营地扎营",
    "source": "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/wollemi-national-park/visitor-info ； https://www.environment.nsw.gov.au/sites/default/files/2025-02/wollemi-national-park-plan-of-management-220080.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Wollemi",
    "id": "wollemi",
    "fact": "可以自由选址",
    "source": "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/wollemi-national-park/visitor-info ； https://www.environment.nsw.gov.au/sites/default/files/2025-02/wollemi-national-park-plan-of-management-220080.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "Bush camping will not be permitted in close proximity (i.e. < 200 metres) to vehicular access routes, constructed walking tracks, threatened species, endangered populations, critical habitat or hazardous areas within the park.",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Kanangra-Boyd",
    "id": "kanangra",
    "fact": "可以独自徒步",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/blue-mountains-np-kanangra-boyd-np-plan-of-management-240234.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Kanangra-Boyd",
    "id": "kanangra",
    "fact": "必须在营地扎营",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/blue-mountains-np-kanangra-boyd-np-plan-of-management-240234.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Kanangra-Boyd",
    "id": "kanangra",
    "fact": "可以自由选址",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/blue-mountains-np-kanangra-boyd-np-plan-of-management-240234.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "Kanangra-Boyd Wilderness – 125,000 ha of Blue Mountains and Kanangra-Boyd national parks, and one of the largest and most rugged wilderness areas in New South Wales. Allowed at designated camping areas (see Table 3). Bush camping (outside of designated camping areas) is also allowed without consent, except under the following circumstances: within 200 m of a public road, constructed walking track, designated camping area, picnic area, formalised lookout or other visitor facility; within a limestone outcrop or karst area; within any ‘slot’ canyon; anywhere it is signposted that camping is not permitted.",
    "checked": "2026-11-13",
    "state": "已确认"
  },
  {
    "place": "Kosciuszko Main Range",
    "id": "mainrange",
    "fact": "可以独自徒步",
    "source": "https://www.nationalparks.nsw.gov.au/safety/alpine-safety/kosciuszko-back-country-camping ； https://www.environment.nsw.gov.au/sites/default/files/kosciuszko-national-park-plan-of-management-210174.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "Keep the size of your group to under 8 people.",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Kosciuszko Main Range",
    "id": "mainrange",
    "fact": "必须在营地扎营",
    "source": "https://www.nationalparks.nsw.gov.au/safety/alpine-safety/kosciuszko-back-country-camping ； https://www.environment.nsw.gov.au/sites/default/files/kosciuszko-national-park-plan-of-management-210174.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "Permit vehicle-based camping in designated camping areas only in the Minor and Major Road Corridors and at Sawpit Creek (Kosciusko Mountain Retreat), Threbo Ranger Station and Yarrangobilly Caves in the Visitor Services Zone.",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Kosciuszko Main Range",
    "id": "mainrange",
    "fact": "可以自由选址",
    "source": "https://www.nationalparks.nsw.gov.au/safety/alpine-safety/kosciuszko-back-country-camping ； https://www.environment.nsw.gov.au/sites/default/files/kosciuszko-national-park-plan-of-management-210174.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "Permit walk-in camping throughout the park except: Within 200 m of any road open to public vehicular access except at designated walk-in campsites; In the camping exclusion areas on the Main Range (Section 9.2) and near Blue Waterholes (Section 9.4.); and Within the Visitor Services Zone. Where possible, choose spots at least 50m from tracks (200m from Seamans Hut), and give other campers space so you can appreciate the scenery and solitude.",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Jagungal Wilderness",
    "id": "jagungal",
    "fact": "可以独自徒步",
    "source": "https://www.nationalparks.nsw.gov.au/safety/alpine-safety/kosciuszko-back-country-camping ； https://www.environment.nsw.gov.au/sites/default/files/kosciuszko-national-park-plan-of-management-210174.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "Keep the size of your group to under 8 people.",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Jagungal Wilderness",
    "id": "jagungal",
    "fact": "必须在营地扎营",
    "source": "https://www.nationalparks.nsw.gov.au/safety/alpine-safety/kosciuszko-back-country-camping ； https://www.environment.nsw.gov.au/sites/default/files/kosciuszko-national-park-plan-of-management-210174.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Jagungal Wilderness",
    "id": "jagungal",
    "fact": "可以自由选址",
    "source": "https://www.nationalparks.nsw.gov.au/safety/alpine-safety/kosciuszko-back-country-camping ； https://www.environment.nsw.gov.au/sites/default/files/kosciuszko-national-park-plan-of-management-210174.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "The most popular places for remote area camping include the Main Range, Whites River corridor, Jagungal and Pilot wilderness areas, the Tabletop Mountain area and the numerous plains and valleys of the northern end of the park. Permit walk-in camping throughout the park except: Within 200 m of any road open to public vehicular access except at designated walk-in campsites; In the camping exclusion areas on the Main Range (Section 9.2) and near Blue Waterholes (Section 9.4.); and Within the Visitor Services Zone.",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Schlink／Valentine",
    "id": "schlink",
    "fact": "可以独自徒步",
    "source": "https://www.nationalparks.nsw.gov.au/safety/alpine-safety/kosciuszko-back-country-camping ； https://www.environment.nsw.gov.au/sites/default/files/kosciuszko-national-park-plan-of-management-210174.pdf ； https://www.nationalparks.nsw.gov.au/-/media/visitor/files/pdf/brochures/kosciuszko-national-park/thredbo-perisher-area-walking-tracks-brochure.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "Keep the size of your group to under 8 people.",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Schlink／Valentine",
    "id": "schlink",
    "fact": "必须在营地扎营",
    "source": "https://www.nationalparks.nsw.gov.au/safety/alpine-safety/kosciuszko-back-country-camping ； https://www.environment.nsw.gov.au/sites/default/files/kosciuszko-national-park-plan-of-management-210174.pdf ； https://www.nationalparks.nsw.gov.au/-/media/visitor/files/pdf/brochures/kosciuszko-national-park/thredbo-perisher-area-walking-tracks-brochure.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Schlink／Valentine",
    "id": "schlink",
    "fact": "可以自由选址",
    "source": "https://www.nationalparks.nsw.gov.au/safety/alpine-safety/kosciuszko-back-country-camping ； https://www.environment.nsw.gov.au/sites/default/files/kosciuszko-national-park-plan-of-management-210174.pdf ； https://www.nationalparks.nsw.gov.au/-/media/visitor/files/pdf/brochures/kosciuszko-national-park/thredbo-perisher-area-walking-tracks-brochure.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "Permit walk-in camping throughout the park except: Within 200 m of any road open to public vehicular access except at designated walk-in campsites; In the camping exclusion areas on the Main Range (Section 9.2) and near Blue Waterholes (Section 9.4.); and Within the Visitor Services Zone.",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Cascade／Pilot Wilderness",
    "id": "pilot",
    "fact": "可以独自徒步",
    "source": "https://www.nationalparks.nsw.gov.au/safety/alpine-safety/kosciuszko-back-country-camping ； https://www.environment.nsw.gov.au/sites/default/files/kosciuszko-national-park-plan-of-management-210174.pdf ； https://www.nationalparks.nsw.gov.au/-/media/visitor/files/pdf/brochures/kosciuszko-national-park/thredbo-perisher-area-walking-tracks-brochure.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "Keep the size of your group to under 8 people.",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Cascade／Pilot Wilderness",
    "id": "pilot",
    "fact": "必须在营地扎营",
    "source": "https://www.nationalparks.nsw.gov.au/safety/alpine-safety/kosciuszko-back-country-camping ； https://www.environment.nsw.gov.au/sites/default/files/kosciuszko-national-park-plan-of-management-210174.pdf ； https://www.nationalparks.nsw.gov.au/-/media/visitor/files/pdf/brochures/kosciuszko-national-park/thredbo-perisher-area-walking-tracks-brochure.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Cascade／Pilot Wilderness",
    "id": "pilot",
    "fact": "可以自由选址",
    "source": "https://www.nationalparks.nsw.gov.au/safety/alpine-safety/kosciuszko-back-country-camping ； https://www.environment.nsw.gov.au/sites/default/files/kosciuszko-national-park-plan-of-management-210174.pdf ； https://www.nationalparks.nsw.gov.au/-/media/visitor/files/pdf/brochures/kosciuszko-national-park/thredbo-perisher-area-walking-tracks-brochure.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "The most popular places for remote area camping include the Main Range, Whites River corridor, Jagungal and Pilot wilderness areas, the Tabletop Mountain area and the numerous plains and valleys of the northern end of the park. Permit walk-in camping throughout the park except: Within 200 m of any road open to public vehicular access except at designated walk-in campsites; In the camping exclusion areas on the Main Range (Section 9.2) and near Blue Waterholes (Section 9.4.); and Within the Visitor Services Zone.",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Morton／Budawang Wilderness",
    "id": "budawang",
    "fact": "可以独自徒步",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/morton-budawang-national-parks-plan-of-management-010131.pdf ； https://www.environment.nsw.gov.au/sites/default/files/budawangs-walking-camping-strategy-morton-national-park.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "Overnight walkers will be encouraged to keep group sizes to a maximum of 8 people and no more than 12 people will be permitted.",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Morton／Budawang Wilderness",
    "id": "budawang",
    "fact": "必须在营地扎营",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/morton-budawang-national-parks-plan-of-management-010131.pdf ； https://www.environment.nsw.gov.au/sites/default/files/budawangs-walking-camping-strategy-morton-national-park.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Morton／Budawang Wilderness",
    "id": "budawang",
    "fact": "可以自由选址",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/morton-budawang-national-parks-plan-of-management-010131.pdf ； https://www.environment.nsw.gov.au/sites/default/files/budawangs-walking-camping-strategy-morton-national-park.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "Walk-in camping will generally be permitted throughout the parks except where closer than 500m to public access roads and vehicle based camping and day use areas. It will be prohibited at certain locations in the ‘Budawangs’ which are suffering environmental damage (see section 4.3.3) and may be regulated or prohibited in other areas if unacceptable impacts occur. camping will not be permitted in Monolith Valley, the Castle Saddle, Hidden Valley, the Vines rainforest or along the Two Rivers Track.",
    "checked": "2026-11-13",
    "state": "已确认"
  },
  {
    "place": "Barrington Tops",
    "id": "barrington",
    "fact": "可以独自徒步",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/barrington-tops-mount-royal-national-parks-barrington-tops-sca-plan-of-management-220192.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/barrington-tops-national-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Barrington Tops",
    "id": "barrington",
    "fact": "必须在营地扎营",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/barrington-tops-mount-royal-national-parks-barrington-tops-sca-plan-of-management-220192.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/barrington-tops-national-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "Provide 11 designated camping areas as outlined in Table 2 and on Figure 7. All other camping locations will be closed and rehabilitated. Permit bush camping more than 200 metres from a public road or walking track throughout the planning area, except in the Phytophthora quarantine area. 两句都留在记录里，不选边。",
    "checked": "2026-11-13",
    "state": "已确认"
  },
  {
    "place": "Barrington Tops",
    "id": "barrington",
    "fact": "可以自由选址",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/barrington-tops-mount-royal-national-parks-barrington-tops-sca-plan-of-management-220192.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/barrington-tops-national-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "Permit bush camping more than 200 metres from a public road or walking track throughout the planning area, except in the Phytophthora quarantine area. Provide 11 designated camping areas as outlined in Table 2 and on Figure 7. All other camping locations will be closed and rehabilitated. 两句都留在记录里，不选边。",
    "checked": "2026-11-13",
    "state": "已确认"
  },
  {
    "place": "New England National Park",
    "id": "newengland",
    "fact": "可以独自徒步",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/new-england-national-park-baalijin-jobs-mountain-nature-reserves-plan-management-210282.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "Walking/cycling in the wilderness — Groups of more than 10 people — Larger groups of up to 15 people may be permitted with NPWS consent",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "New England National Park",
    "id": "newengland",
    "fact": "必须在营地扎营",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/new-england-national-park-baalijin-jobs-mountain-nature-reserves-plan-management-210282.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "New England National Park",
    "id": "newengland",
    "fact": "可以自由选址",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/new-england-national-park-baalijin-jobs-mountain-nature-reserves-plan-management-210282.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "Allow self-reliant bush camping in areas more than one kilometre from facilities (including park roads) in New England National Park.",
    "checked": "2026-11-13",
    "state": "已确认"
  },
  {
    "place": "Popran National Park",
    "id": "popran",
    "fact": "可以独自徒步",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/popran-national-park-plan-of-management-000097.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Popran National Park",
    "id": "popran",
    "fact": "必须在营地扎营",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/popran-national-park-plan-of-management-000097.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "Consequently vehicle based camping will not be provided in Popran National Park.",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Popran National Park",
    "id": "popran",
    "fact": "可以自由选址",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/popran-national-park-plan-of-management-000097.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "Bush camping will be permitted away from roads, provided such camping is in accordance with minimal impact camping practices (including use of fuel stoves only) and in accordance with a camping permit issued by the Service.",
    "checked": "2026-11-13",
    "state": "已确认"
  },
  {
    "place": "Nattai National Park",
    "id": "nattai",
    "fact": "可以独自徒步",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/nattai-reserves-plan-of-management-010101.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/nattai-national-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Nattai National Park",
    "id": "nattai",
    "fact": "必须在营地扎营",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/nattai-reserves-plan-of-management-010101.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/nattai-national-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Nattai National Park",
    "id": "nattai",
    "fact": "可以自由选址",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/nattai-reserves-plan-of-management-010101.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/nattai-national-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "Bush camping is permitted in the Nattai Reserves System outside the Schedule One Water Quality Protection Zone. Bushwalkers may cross, but not camp within, the three kilometre zone via the Beloon Pass-Sheepwalk Track corridor.",
    "checked": "2026-11-13",
    "state": "已确认"
  },
  {
    "place": "Mount Solitary walking track",
    "id": "solitary",
    "fact": "可以独自徒步",
    "source": "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/mount-solitary-walking-track ； https://www.environment.nsw.gov.au/sites/default/files/blue-mountains-np-kanangra-boyd-np-plan-of-management-240234.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Mount Solitary walking track",
    "id": "solitary",
    "fact": "必须在营地扎营",
    "source": "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/mount-solitary-walking-track ； https://www.environment.nsw.gov.au/sites/default/files/blue-mountains-np-kanangra-boyd-np-plan-of-management-240234.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "After 4.5hrs you’ll be refilling your water and pitching a tent at Ruined Castle campground amid the mining ruins from 1882. Continue across the top of Mount Solitary before descending the steep eastern slope to Kedumba River campground.",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Mount Solitary walking track",
    "id": "solitary",
    "fact": "可以自由选址",
    "source": "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/mount-solitary-walking-track ； https://www.environment.nsw.gov.au/sites/default/files/blue-mountains-np-kanangra-boyd-np-plan-of-management-240234.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "Mount Solitary | Jamison Valley | Bush camping | Potential walk in camping New walk-in camping areas may be implemented to support the Mount Solitary Walk (see Figure 4 and Table 3).",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Great North Walk segments near Hornsby, Berowra, Cowan stations",
    "id": "gnw",
    "fact": "可以独自徒步",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/ku-ring-gai-chase-national-park-plan-of-management-240045.pdf ； https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/great-north-walk-brisbane-water-national-park/local-alerts ； https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/great-north-walk-berowra-valley-national-park ； https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/great-north-walk-lane-cove-national-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Great North Walk segments near Hornsby, Berowra, Cowan stations",
    "id": "gnw",
    "fact": "必须在营地扎营",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/ku-ring-gai-chase-national-park-plan-of-management-240045.pdf ； https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/great-north-walk-brisbane-water-national-park/local-alerts ； https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/great-north-walk-berowra-valley-national-park ； https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/great-north-walk-lane-cove-national-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "Permitted at The Basin Camping Area and walk-in campsites along the Great North Walk at Brooklyn Dam. Group camping (more than four people) is only permitted at the Mt Wondabyne remote bush camp within Brisbane Water National Park.",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Great North Walk segments near Hornsby, Berowra, Cowan stations",
    "id": "gnw",
    "fact": "可以自由选址",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/ku-ring-gai-chase-national-park-plan-of-management-240045.pdf ； https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/great-north-walk-brisbane-water-national-park/local-alerts ； https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/great-north-walk-berowra-valley-national-park ； https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/great-north-walk-lane-cove-national-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "Group camping (more than four people) is only permitted at the Mt Wondabyne remote bush camp within Brisbane Water National Park.",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Marramarra Ridge / Smugglers Ridge",
    "id": "marramarra",
    "fact": "可以独自徒步",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/marramarra-muogamarra-maroota-plan-of-management-160655.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/marramarra-national-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Marramarra Ridge / Smugglers Ridge",
    "id": "marramarra",
    "fact": "必须在营地扎营",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/marramarra-muogamarra-maroota-plan-of-management-160655.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/marramarra-national-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "the Smugglers Ridge Track from Bloodwood Road down to Marramarra Creek; the Marramarra Ridge Track from Bloodwood Road down to Marramarra Creek.",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Marramarra Ridge / Smugglers Ridge",
    "id": "marramarra",
    "fact": "可以自由选址",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/marramarra-muogamarra-maroota-plan-of-management-160655.pdf ； https://www.nationalparks.nsw.gov.au/visit-a-park/parks/marramarra-national-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "Bush camping will be permitted at other sites within Marramarra National Park, provided that it complies with the other policies in this plan and visitors adopt minimum impact practices.",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Nadgee Wilderness",
    "id": "nadgee",
    "fact": "可以独自徒步",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/nadgee-nature-reserve-plan-of-management-030122.pdf ； https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/nadgee-wilderness-walk/visitor-info ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "a maximum group size of 8 and maximum total of 20 overnight bushwalkers in the reserve",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Nadgee Wilderness",
    "id": "nadgee",
    "fact": "必须在营地扎营",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/nadgee-nature-reserve-plan-of-management-030122.pdf ； https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/nadgee-wilderness-walk/visitor-info ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "Walkers staying overnight require a permit.",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Nadgee Wilderness",
    "id": "nadgee",
    "fact": "可以自由选址",
    "source": "https://www.environment.nsw.gov.au/sites/default/files/nadgee-nature-reserve-plan-of-management-030122.pdf ； https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/nadgee-wilderness-walk/visitor-info ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "A permit will be required for overnight bushwalking and the following will apply: walk-in camping will be permitted more than 1km from roads but not in the vicinity of the Nadgee Lake Bar. Walkers staying overnight require a permit.",
    "checked": "2026-11-13",
    "state": "已确认"
  },
  {
    "place": "Lane Cove National Park",
    "id": "lanecove",
    "fact": "可以独自徒步",
    "source": "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/lane-cove-national-park ； https://www.environment.nsw.gov.au/sites/default/files/lane-cove-national-park-plan-of-management-160150.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Lane Cove National Park",
    "id": "lanecove",
    "fact": "必须在营地扎营",
    "source": "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/lane-cove-national-park ； https://www.environment.nsw.gov.au/sites/default/files/lane-cove-national-park-plan-of-management-160150.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "If you’d like to stay overnight in the park, head to Lane Cove Holiday Park and book a campsite or cabin.",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Lane Cove National Park",
    "id": "lanecove",
    "fact": "可以自由选址",
    "source": "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/lane-cove-national-park ； https://www.environment.nsw.gov.au/sites/default/files/lane-cove-national-park-plan-of-management-160150.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "If you’d like to stay overnight in the park, head to Lane Cove Holiday Park and book a campsite or cabin.",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Dharug National Park",
    "id": "dharug",
    "fact": "可以独自徒步",
    "source": "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/dharug-national-park ； https://www.environment.nsw.gov.au/sites/default/files/dharug-national-park-plan-of-management-970126.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Dharug National Park",
    "id": "dharug",
    "fact": "必须在营地扎营",
    "source": "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/dharug-national-park ； https://www.environment.nsw.gov.au/sites/default/files/dharug-national-park-plan-of-management-970126.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "Camping areas are provided within the park at Mill Creek and at Ten Mile Hollow on the Old Great North Road. Use of the informal pack camping areas along the Old Great North Road will be monitored and if unacceptable impacts arise through over use of these sites, additional formal pack camping areas may be provided, subject to environmental assessment.",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Dharug National Park",
    "id": "dharug",
    "fact": "可以自由选址",
    "source": "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/dharug-national-park ； https://www.environment.nsw.gov.au/sites/default/files/dharug-national-park-plan-of-management-970126.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "Use of the informal pack camping areas along the Old Great North Road will be monitored and if unacceptable impacts arise through over use of these sites, additional formal pack camping areas may be provided, subject to environmental assessment.",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Wyrrabalong National Park",
    "id": "wyrrabalong",
    "fact": "可以独自徒步",
    "source": "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/wyrrabalong-national-park ； https://www.environment.nsw.gov.au/sites/default/files/wyrrabalong-national-park-plan-of-management-130496.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Wyrrabalong National Park",
    "id": "wyrrabalong",
    "fact": "必须在营地扎营",
    "source": "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/wyrrabalong-national-park ； https://www.environment.nsw.gov.au/sites/default/files/wyrrabalong-national-park-plan-of-management-130496.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "No camping is permitted in the park.",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Wyrrabalong National Park",
    "id": "wyrrabalong",
    "fact": "可以自由选址",
    "source": "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/wyrrabalong-national-park ； https://www.environment.nsw.gov.au/sites/default/files/wyrrabalong-national-park-plan-of-management-130496.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "No camping is permitted in the park.",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Munmorah State Conservation Area",
    "id": "munmorah",
    "fact": "可以独自徒步",
    "source": "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/munmorah-state-conservation-area ； https://www.environment.nsw.gov.au/sites/default/files/munmorah-state-conservation-area-bird-island-plan-of-management-090410.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Munmorah State Conservation Area",
    "id": "munmorah",
    "fact": "必须在营地扎营",
    "source": "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/munmorah-state-conservation-area ； https://www.environment.nsw.gov.au/sites/default/files/munmorah-state-conservation-area-bird-island-plan-of-management-090410.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "Apart from Frazer and Freemans, no other camping areas will be established and camping will only be permitted in these two areas of the park.",
    "checked": "2026-11-13",
    "state": "已确认"
  },
  {
    "place": "Munmorah State Conservation Area",
    "id": "munmorah",
    "fact": "可以自由选址",
    "source": "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/munmorah-state-conservation-area ； https://www.environment.nsw.gov.au/sites/default/files/munmorah-state-conservation-area-bird-island-plan-of-management-090410.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "Apart from Frazer and Freemans, no other camping areas will be established and camping will only be permitted in these two areas of the park.",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Wallumatta Nature Reserve",
    "id": "wallumatta",
    "fact": "可以独自徒步",
    "source": "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/wallumatta-nature-reserve ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Wallumatta Nature Reserve",
    "id": "wallumatta",
    "fact": "必须在营地扎营",
    "source": "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/wallumatta-nature-reserve ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Wallumatta Nature Reserve",
    "id": "wallumatta",
    "fact": "可以自由选址",
    "source": "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/wallumatta-nature-reserve ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Dalrymple-Hay Nature Reserve",
    "id": "dalrymple",
    "fact": "可以独自徒步",
    "source": "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/dalrymple-hay-nature-reserve ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Dalrymple-Hay Nature Reserve",
    "id": "dalrymple",
    "fact": "必须在营地扎营",
    "source": "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/dalrymple-hay-nature-reserve ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Dalrymple-Hay Nature Reserve",
    "id": "dalrymple",
    "fact": "可以自由选址",
    "source": "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/dalrymple-hay-nature-reserve ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Newington Nature Reserve",
    "id": "newington",
    "fact": "可以独自徒步",
    "source": "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/newington-nature-reserve ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Newington Nature Reserve",
    "id": "newington",
    "fact": "必须在营地扎营",
    "source": "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/newington-nature-reserve ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Newington Nature Reserve",
    "id": "newington",
    "fact": "可以自由选址",
    "source": "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/newington-nature-reserve ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Yellomundee Regional Park",
    "id": "yellomundee",
    "fact": "可以独自徒步",
    "source": "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/yellomundee-regional-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Yellomundee Regional Park",
    "id": "yellomundee",
    "fact": "必须在营地扎营",
    "source": "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/yellomundee-regional-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Yellomundee Regional Park",
    "id": "yellomundee",
    "fact": "可以自由选址",
    "source": "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/yellomundee-regional-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "William Howe Regional Park",
    "id": "williamhowe",
    "fact": "可以独自徒步",
    "source": "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/william-howe-regional-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "William Howe Regional Park",
    "id": "williamhowe",
    "fact": "必须在营地扎营",
    "source": "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/william-howe-regional-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "William Howe Regional Park",
    "id": "williamhowe",
    "fact": "可以自由选址",
    "source": "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/william-howe-regional-park ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Windsor Downs Nature Reserve",
    "id": "windsordowns",
    "fact": "可以独自徒步",
    "source": "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/windsor-downs-nature-reserve ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Windsor Downs Nature Reserve",
    "id": "windsordowns",
    "fact": "必须在营地扎营",
    "source": "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/windsor-downs-nature-reserve ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Windsor Downs Nature Reserve",
    "id": "windsordowns",
    "fact": "可以自由选址",
    "source": "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/windsor-downs-nature-reserve ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Gulguer Nature Reserve",
    "id": "gulguer",
    "fact": "可以独自徒步",
    "source": "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/gulguer-nature-reserve ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Gulguer Nature Reserve",
    "id": "gulguer",
    "fact": "必须在营地扎营",
    "source": "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/gulguer-nature-reserve ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Gulguer Nature Reserve",
    "id": "gulguer",
    "fact": "可以自由选址",
    "source": "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/gulguer-nature-reserve ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Euroka campground",
    "id": "euroka",
    "fact": "可以独自徒步",
    "source": "https://www.nationalparks.nsw.gov.au/camping-and-accommodation/campgrounds/euroka-campground ； https://www.environment.nsw.gov.au/sites/default/files/blue-mountains-np-kanangra-boyd-np-plan-of-management-240234.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Euroka campground",
    "id": "euroka",
    "fact": "必须在营地扎营",
    "source": "https://www.nationalparks.nsw.gov.au/camping-and-accommodation/campgrounds/euroka-campground ； https://www.environment.nsw.gov.au/sites/default/files/blue-mountains-np-kanangra-boyd-np-plan-of-management-240234.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "There are 5 camping areas within Euroka: Appletree Flat, Bennett Ridge, Darug, Nioka and Red Gum.",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Euroka campground",
    "id": "euroka",
    "fact": "可以自由选址",
    "source": "https://www.nationalparks.nsw.gov.au/camping-and-accommodation/campgrounds/euroka-campground ； https://www.environment.nsw.gov.au/sites/default/files/blue-mountains-np-kanangra-boyd-np-plan-of-management-240234.pdf ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "There are 5 camping areas within Euroka: Appletree Flat, Bennett Ridge, Darug, Nioka and Red Gum.",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Prospect Nature Reserve",
    "id": "prospect",
    "fact": "可以独自徒步",
    "source": "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/prospect-nature-reserve ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Prospect Nature Reserve",
    "id": "prospect",
    "fact": "必须在营地扎营",
    "source": "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/prospect-nature-reserve ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Prospect Nature Reserve",
    "id": "prospect",
    "fact": "可以自由选址",
    "source": "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/prospect-nature-reserve ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Agnes Banks Nature Reserve",
    "id": "agnesbanks",
    "fact": "可以独自徒步",
    "source": "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/agnes-banks-nature-reserve ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Agnes Banks Nature Reserve",
    "id": "agnesbanks",
    "fact": "必须在营地扎营",
    "source": "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/agnes-banks-nature-reserve ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Agnes Banks Nature Reserve",
    "id": "agnesbanks",
    "fact": "可以自由选址",
    "source": "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/agnes-banks-nature-reserve ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Castlereagh Nature Reserve",
    "id": "castlereagh",
    "fact": "可以独自徒步",
    "source": "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/castlereagh-nature-reserve ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Castlereagh Nature Reserve",
    "id": "castlereagh",
    "fact": "必须在营地扎营",
    "source": "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/castlereagh-nature-reserve ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Castlereagh Nature Reserve",
    "id": "castlereagh",
    "fact": "可以自由选址",
    "source": "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/castlereagh-nature-reserve ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Mulgoa Nature Reserve",
    "id": "mulgoa",
    "fact": "可以独自徒步",
    "source": "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/mulgoa-nature-reserve ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Mulgoa Nature Reserve",
    "id": "mulgoa",
    "fact": "必须在营地扎营",
    "source": "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/mulgoa-nature-reserve ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Mulgoa Nature Reserve",
    "id": "mulgoa",
    "fact": "可以自由选址",
    "source": "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/mulgoa-nature-reserve ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Lion Island Nature Reserve",
    "id": "lionisland",
    "fact": "可以独自徒步",
    "source": "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/lion-island-nature-reserve ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Lion Island Nature Reserve",
    "id": "lionisland",
    "fact": "必须在营地扎营",
    "source": "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/lion-island-nature-reserve ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Lion Island Nature Reserve",
    "id": "lionisland",
    "fact": "可以自由选址",
    "source": "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/lion-island-nature-reserve ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety ； https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0408",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Blackheath Station",
    "id": "blackheath-station",
    "fact": "可以独自徒步",
    "source": "https://www.bmcc.nsw.gov.au/camping ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Blackheath Station",
    "id": "blackheath-station",
    "fact": "必须在营地扎营",
    "source": "https://www.bmcc.nsw.gov.au/camping ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Blackheath Station",
    "id": "blackheath-station",
    "fact": "可以自由选址",
    "source": "https://www.bmcc.nsw.gov.au/camping ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Lithgow Station",
    "id": "lithgow-station",
    "fact": "可以独自徒步",
    "source": "https://www.bmcc.nsw.gov.au/camping ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Lithgow Station",
    "id": "lithgow-station",
    "fact": "必须在营地扎营",
    "source": "https://www.bmcc.nsw.gov.au/camping ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  },
  {
    "place": "Lithgow Station",
    "id": "lithgow-station",
    "fact": "可以自由选址",
    "source": "https://www.bmcc.nsw.gov.au/camping ； https://www.nationalparks.nsw.gov.au/safety/bushwalking-safety",
    "quote": "",
    "checked": "2026-11-13",
    "state": "待核实"
  }
];
