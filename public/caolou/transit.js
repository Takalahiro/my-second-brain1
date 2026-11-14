/* Google 地图公共交通。查询当时给出的下一班，不是末班车。 */
const TRANSIT = {
  "northhead": {
    "ok": true,
    "duration": "1 小时 38 分钟",
    "depart": "17:36",
    "arrive": "19:14",
    "lines": [
      {
        "mode": "公交",
        "code": "412",
        "head": ""
      },
      {
        "mode": "轮渡",
        "code": "MFF",
        "head": "Manly"
      },
      {
        "mode": "公交",
        "code": "161",
        "head": "Manly via North Head"
      }
    ],
    "transfers": 2,
    "walkM": 2200,
    "alight": "Quarantine Station, North Head Scenic Dr",
    "at": "2026-11-13T17:27+11:00",
    "url": "https://www.google.com/maps/dir/?api=1&origin=-33.88633,151.19982&destination=-33.8226,151.2971&travelmode=transit&hl=zh-CN",
    "name": "北头"
  },
  "malabar": {
    "ok": true,
    "duration": "每15分钟",
    "depart": "17:35",
    "arrive": "18:33",
    "lines": [
      {
        "mode": "公交",
        "code": "428",
        "head": "Martin Place"
      },
      {
        "mode": "公交",
        "code": "394X",
        "head": ""
      }
    ],
    "transfers": 1,
    "walkM": 950,
    "alight": "St Spyridon College, Anzac Pde",
    "at": "2026-11-13T17:27+11:00",
    "url": "https://www.google.com/maps/dir/?api=1&origin=-33.88633,151.19982&destination=-33.95671,151.24966&travelmode=transit&hl=zh-CN",
    "name": "马拉巴岬"
  },
  "solander": {
    "ok": true,
    "duration": "1 小时 57 分钟",
    "depart": "17:36",
    "arrive": "19:33",
    "lines": [
      {
        "mode": "火车",
        "code": "T4",
        "head": "Cronulla via Kogarah"
      },
      {
        "mode": "公交",
        "code": "987",
        "head": ""
      }
    ],
    "transfers": 1,
    "walkM": 3100,
    "alight": "Captain Cook Dr after Polo St",
    "at": "2026-11-13T17:27+11:00",
    "url": "https://www.google.com/maps/dir/?api=1&origin=-33.88633,151.19982&destination=-34.01707,151.23088&travelmode=transit&hl=zh-CN",
    "name": "索尔兰德角"
  },
  "royal": {
    "ok": true,
    "duration": "1 小时 52 分钟",
    "depart": "17:36",
    "arrive": "19:28",
    "lines": [
      {
        "mode": "火车",
        "code": "T4",
        "head": "Cronulla via Kogarah"
      },
      {
        "mode": "公交",
        "code": "976",
        "head": ""
      }
    ],
    "transfers": 1,
    "walkM": 3300,
    "alight": "Grays Point Public School, Grays Point Rd",
    "at": "2026-11-13T17:27+11:00",
    "url": "https://www.google.com/maps/dir/?api=1&origin=-33.88633,151.19982&destination=-34.0674,151.0566&travelmode=transit&hl=zh-CN",
    "name": "皇家国家公园"
  },
  "heathcote": {
    "ok": true,
    "duration": "1 小时 38 分钟",
    "depart": "17:43",
    "arrive": "19:21",
    "lines": [
      {
        "mode": "火车",
        "code": "SCO",
        "head": "Waterfall via Wolli Creek"
      }
    ],
    "transfers": 0,
    "walkM": 4000,
    "alight": "Heathcote",
    "at": "2026-11-13T17:27+11:00",
    "url": "https://www.google.com/maps/dir/?api=1&origin=-33.88633,151.19982&destination=-34.098,151.012&travelmode=transit&hl=zh-CN",
    "name": "希思科特"
  },
  "irrawong": {
    "ok": true,
    "duration": "每5分钟",
    "depart": "17:29",
    "arrive": "19:02",
    "lines": [
      {
        "mode": "火车",
        "code": "T3",
        "head": ""
      },
      {
        "mode": "公交",
        "code": "B1",
        "head": ""
      }
    ],
    "transfers": 1,
    "walkM": 2000,
    "alight": "Narrabeen B-Line, Pittwater Rd",
    "at": "2026-11-13T17:28+11:00",
    "url": "https://www.google.com/maps/dir/?api=1&origin=-33.88633,151.19982&destination=-33.69377,151.29312&travelmode=transit&hl=zh-CN",
    "name": "伊拉旺谷"
  },
  "kuringgai": {
    "ok": true,
    "duration": "每15分钟",
    "depart": "17:30",
    "arrive": "03:40",
    "lines": [
      {
        "mode": "公交",
        "code": "431",
        "head": "Martin Place"
      },
      {
        "mode": "公交",
        "code": "B1",
        "head": ""
      },
      {
        "mode": "公交",
        "code": "199",
        "head": "Palm Beach"
      }
    ],
    "transfers": 2,
    "walkM": 35200,
    "alight": "Observation Point, Barrenjoey Rd",
    "at": "2026-11-13T17:28+11:00",
    "url": "https://www.google.com/maps/dir/?api=1&origin=-33.88633,151.19982&destination=-33.57914,151.30924&travelmode=transit&hl=zh-CN",
    "name": "库灵盖"
  },
  "yeramba": {
    "ok": true,
    "duration": "1 小时 28 分钟",
    "depart": "17:38",
    "arrive": "19:06",
    "lines": [
      {
        "mode": "火车",
        "code": "T8",
        "head": ""
      },
      {
        "mode": "公交",
        "code": "923",
        "head": ""
      }
    ],
    "transfers": 1,
    "walkM": 3000,
    "alight": "Burns Rd opp Victor Ave",
    "at": "2026-11-13T17:28+11:00",
    "url": "https://www.google.com/maps/dir/?api=1&origin=-33.88633,151.19982&destination=-33.97648,151.0048&travelmode=transit&hl=zh-CN",
    "name": "耶兰巴潟湖"
  },
  "dharawal": {
    "ok": false,
    "at": "2026-11-13T17:28+11:00",
    "url": "https://www.google.com/maps/dir/?api=1&origin=-33.88633,151.19982&destination=-34.23897,150.91375&travelmode=transit&hl=zh-CN",
    "name": "达拉沃尔"
  },
  "blue": {
    "ok": true,
    "duration": "2 小时 39 分钟",
    "depart": "17:41",
    "arrive": "20:20",
    "lines": [
      {
        "mode": "火车",
        "code": "BMT",
        "head": ""
      }
    ],
    "transfers": 0,
    "walkM": 3400,
    "alight": "Wentworth Falls",
    "at": "2026-11-13T17:28+11:00",
    "url": "https://www.google.com/maps/dir/?api=1&origin=-33.88633,151.19982&destination=-33.72608,150.37202&travelmode=transit&hl=zh-CN",
    "name": "蓝山"
  },
  "bouddi": {
    "ok": true,
    "duration": "4 小时 22 分钟",
    "depart": "04:14",
    "arrive": "08:36",
    "lines": [
      {
        "mode": "公交",
        "code": "N40",
        "head": ""
      },
      {
        "mode": "公交",
        "code": "199",
        "head": "Palm Beach"
      },
      {
        "mode": "轮渡",
        "code": "WAGE",
        "head": "Wagstaffe Wharf"
      },
      {
        "mode": "公交",
        "code": "65",
        "head": ""
      }
    ],
    "transfers": 3,
    "walkM": 5050,
    "alight": "The Scenic Rd opp Bouddi National Park",
    "at": "2026-11-13T17:28+11:00",
    "url": "https://www.google.com/maps/dir/?api=1&origin=-33.88633,151.19982&destination=-33.524,151.39561&travelmode=transit&hl=zh-CN",
    "name": "布迪"
  },
  "minnamurra": {
    "ok": true,
    "duration": "3 小时 13 分钟",
    "depart": "07:12",
    "arrive": "10:25",
    "lines": [
      {
        "mode": "火车",
        "code": "SCO",
        "head": ""
      },
      {
        "mode": "公交",
        "code": "125",
        "head": ""
      }
    ],
    "transfers": 1,
    "walkM": 983,
    "alight": "Jamberoo Action Park",
    "at": "2026-11-13T17:28+11:00",
    "url": "https://www.google.com/maps/dir/?api=1&origin=-33.88633,151.19982&destination=-34.63473,150.72734&travelmode=transit&hl=zh-CN",
    "name": "明娜穆拉"
  },
  "barren": {
    "ok": false,
    "at": "2026-11-13T17:28+11:00",
    "url": "https://www.google.com/maps/dir/?api=1&origin=-33.88633,151.19982&destination=-34.69516,150.73317&travelmode=transit&hl=zh-CN",
    "name": "巴伦地"
  },
  "shelly": {
    "ok": true,
    "duration": "每10分钟",
    "depart": "17:36",
    "arrive": "18:49",
    "lines": [
      {
        "mode": "公交",
        "code": "412",
        "head": ""
      },
      {
        "mode": "轮渡",
        "code": "F1",
        "head": ""
      },
      {
        "mode": "轮渡",
        "code": "MFF",
        "head": "Manly"
      }
    ],
    "transfers": 2,
    "walkM": 1900,
    "alight": "Manly Wharf",
    "at": "2026-11-13T17:29+11:00",
    "url": "https://www.google.com/maps/dir/?api=1&origin=-33.88633,151.19982&destination=-33.8005,151.298&travelmode=transit&hl=zh-CN",
    "name": "卷心菜树湾"
  },
  "clifton": {
    "ok": true,
    "duration": "每6分钟",
    "depart": "17:30",
    "arrive": "18:37",
    "lines": [
      {
        "mode": "公交",
        "code": "431",
        "head": "Martin Place"
      },
      {
        "mode": "公交",
        "code": "100",
        "head": "Taronga Zoo via City QVB"
      }
    ],
    "transfers": 1,
    "walkM": 690,
    "alight": "Bradleys Head Rd opp Union St",
    "at": "2026-11-13T17:29+11:00",
    "url": "https://www.google.com/maps/dir/?api=1&origin=-33.88633,151.19982&destination=-33.83971,151.24653&travelmode=transit&hl=zh-CN",
    "name": "克利夫顿花园"
  },
  "gordons": {
    "ok": true,
    "duration": "59 分钟",
    "depart": "17:30",
    "arrive": "18:29",
    "lines": [
      {
        "mode": "公交",
        "code": "352",
        "head": ""
      },
      {
        "mode": "公交",
        "code": "339",
        "head": ""
      }
    ],
    "transfers": 1,
    "walkM": 690,
    "alight": "Clovelly Rd at Keith St",
    "at": "2026-11-13T17:29+11:00",
    "url": "https://www.google.com/maps/dir/?api=1&origin=-33.88633,151.19982&destination=-33.9158,151.26481&travelmode=transit&hl=zh-CN",
    "name": "戈登斯湾"
  },
  "capebanks": {
    "ok": false,
    "at": "2026-11-13T17:29+11:00",
    "url": "https://www.google.com/maps/dir/?api=1&origin=-33.88633,151.19982&destination=-34.0009,151.24887&travelmode=transit&hl=zh-CN",
    "name": "班克斯角"
  },
  "bare": {
    "ok": true,
    "duration": "每15分钟",
    "depart": "17:35",
    "arrive": "18:48",
    "lines": [
      {
        "mode": "公交",
        "code": "428",
        "head": "Martin Place"
      },
      {
        "mode": "公交",
        "code": "394X",
        "head": ""
      },
      {
        "mode": "公交",
        "code": "390X",
        "head": "La Perouse"
      }
    ],
    "transfers": 2,
    "walkM": 900,
    "alight": "Anzac Pde Terminus",
    "at": "2026-11-13T17:29+11:00",
    "url": "https://www.google.com/maps/dir/?api=1&origin=-33.88633,151.19982&destination=-33.99103,151.23185&travelmode=transit&hl=zh-CN",
    "name": "裸岛"
  },
  "longreef": {
    "ok": true,
    "duration": "1 小时 35 分钟",
    "depart": "17:36",
    "arrive": "19:11",
    "lines": [
      {
        "mode": "公交",
        "code": "412",
        "head": ""
      },
      {
        "mode": "公交",
        "code": "181X",
        "head": ""
      }
    ],
    "transfers": 1,
    "walkM": 1700,
    "alight": "Pittwater Rd before Hay St",
    "at": "2026-11-13T17:29+11:00",
    "url": "https://www.google.com/maps/dir/?api=1&origin=-33.88633,151.19982&destination=-33.74006,151.31604&travelmode=transit&hl=zh-CN",
    "name": "长礁"
  },
  "bushrangers": {
    "ok": true,
    "duration": "2 小时 36 分钟",
    "depart": "17:53",
    "arrive": "20:29",
    "lines": [
      {
        "mode": "火车",
        "code": "SCO",
        "head": "Kiama via Wolli Creek"
      },
      {
        "mode": "公交",
        "code": "52",
        "head": "Flinders"
      }
    ],
    "transfers": 1,
    "walkM": 1775,
    "alight": "Little Park, Wollongong St",
    "at": "2026-11-13T17:29+11:00",
    "url": "https://www.google.com/maps/dir/?api=1&origin=-33.88633,151.19982&destination=-34.58405,150.87262&travelmode=transit&hl=zh-CN",
    "name": "布殊兰格斯湾"
  },
  "killalea": {
    "ok": true,
    "duration": "2 小时 57 分钟",
    "depart": "17:53",
    "arrive": "20:50",
    "lines": [
      {
        "mode": "火车",
        "code": "SCO",
        "head": "Kiama via Wolli Creek"
      },
      {
        "mode": "公交",
        "code": "52",
        "head": "Flinders"
      }
    ],
    "transfers": 1,
    "walkM": 3775,
    "alight": "Southern Cross Bvd before Cove Bvd",
    "at": "2026-11-13T17:29+11:00",
    "url": "https://www.google.com/maps/dir/?api=1&origin=-33.88633,151.19982&destination=-34.59912,150.86785&travelmode=transit&hl=zh-CN",
    "name": "基拉利"
  },
  "turimetta": {
    "ok": true,
    "duration": "每6分钟",
    "depart": "17:29",
    "arrive": "19:09",
    "lines": [
      {
        "mode": "火车",
        "code": "T3",
        "head": ""
      },
      {
        "mode": "公交",
        "code": "B1",
        "head": ""
      }
    ],
    "transfers": 1,
    "walkM": 2400,
    "alight": "Warriewood B-Line, Pittwater Rd",
    "at": "2026-11-13T17:29+11:00",
    "url": "https://www.google.com/maps/dir/?api=1&origin=-33.88633,151.19982&destination=-33.69498,151.3115&travelmode=transit&hl=zh-CN",
    "name": "图里梅塔"
  },
  "bangalley": {
    "ok": true,
    "duration": "每10分钟",
    "depart": "17:31",
    "arrive": "19:30",
    "lines": [
      {
        "mode": "火车",
        "code": "T9",
        "head": ""
      },
      {
        "mode": "公交",
        "code": "B1",
        "head": ""
      },
      {
        "mode": "公交",
        "code": "199",
        "head": ""
      }
    ],
    "transfers": 2,
    "walkM": 1650,
    "alight": "Barrenjoey Rd after George St",
    "at": "2026-11-13T17:30+11:00",
    "url": "https://www.google.com/maps/dir/?api=1&origin=-33.88633,151.19982&destination=-33.62746,151.33929&travelmode=transit&hl=zh-CN",
    "name": "班加利角"
  },
  "wolli": {
    "ok": true,
    "duration": "每15分钟",
    "depart": "17:32",
    "arrive": "18:05",
    "lines": [
      {
        "mode": "火车",
        "code": "T8",
        "head": ""
      }
    ],
    "transfers": 0,
    "walkM": 1000,
    "alight": "Wolli Creek",
    "at": "2026-11-13T17:30+11:00",
    "url": "https://www.google.com/maps/dir/?api=1&origin=-33.88633,151.19982&destination=-33.92992,151.13996&travelmode=transit&hl=zh-CN",
    "name": "沃利溪"
  },
  "lights": {
    "ok": true,
    "duration": "50 分钟",
    "depart": "17:48",
    "arrive": "18:38",
    "lines": [
      {
        "mode": "公交",
        "code": "422",
        "head": "Kogarah Station"
      }
    ],
    "transfers": 0,
    "walkM": 5500,
    "alight": "Arncliffe Fire Station, West Botany St",
    "at": "2026-11-13T17:30+11:00",
    "url": "https://www.google.com/maps/dir/?api=1&origin=-33.88633,151.19982&destination=-33.94021,151.15472&travelmode=transit&hl=zh-CN",
    "name": "着陆灯湿地"
  },
  "saltpan": {
    "ok": true,
    "duration": "1 小时 15 分钟",
    "depart": "17:32",
    "arrive": "18:47",
    "lines": [
      {
        "mode": "火车",
        "code": "T8",
        "head": ""
      },
      {
        "mode": "公交",
        "code": "950",
        "head": ""
      }
    ],
    "transfers": 1,
    "walkM": 1000,
    "alight": "Fairford Rd after Watson Rd",
    "at": "2026-11-13T17:30+11:00",
    "url": "https://www.google.com/maps/dir/?api=1&origin=-33.88633,151.19982&destination=-33.93959,151.04005&travelmode=transit&hl=zh-CN",
    "name": "盐盘溪"
  },
  "manlydam": {
    "ok": true,
    "duration": "1 小时 15 分钟",
    "depart": "17:31",
    "arrive": "18:46",
    "lines": [
      {
        "mode": "火车",
        "code": "T8",
        "head": ""
      },
      {
        "mode": "公交",
        "code": "172X",
        "head": ""
      }
    ],
    "transfers": 1,
    "walkM": 2000,
    "alight": "Woodbine St at Kalaui St",
    "at": "2026-11-13T17:30+11:00",
    "url": "https://www.google.com/maps/dir/?api=1&origin=-33.88633,151.19982&destination=-33.78278,151.25389&travelmode=transit&hl=zh-CN",
    "name": "曼利水坝"
  },
  "buffalo": {
    "ok": true,
    "duration": "每10分钟",
    "depart": "17:39",
    "arrive": "18:45",
    "lines": [
      {
        "mode": "公交",
        "code": "433",
        "head": "Balmain - Gladstone Park"
      },
      {
        "mode": "公交",
        "code": "506",
        "head": "East Ryde"
      }
    ],
    "transfers": 1,
    "walkM": 1650,
    "alight": "Princes St at Pittwater Rd",
    "at": "2026-11-13T17:30+11:00",
    "url": "https://www.google.com/maps/dir/?api=1&origin=-33.88633,151.19982&destination=-33.81607,151.13739&travelmode=transit&hl=zh-CN",
    "name": "布法罗溪"
  },
  "oatley": {
    "ok": true,
    "duration": "每12分钟",
    "depart": "17:36",
    "arrive": "18:40",
    "lines": [
      {
        "mode": "火车",
        "code": "T4",
        "head": "Cronulla via Kogarah"
      }
    ],
    "transfers": 0,
    "walkM": 5400,
    "alight": "Oatley",
    "at": "2026-11-13T17:30+11:00",
    "url": "https://www.google.com/maps/dir/?api=1&origin=-33.88633,151.19982&destination=-33.98143,151.06145&travelmode=transit&hl=zh-CN",
    "name": "奥特利公园"
  },
  "crosslands": {
    "ok": true,
    "duration": "2 小时 4 分钟",
    "depart": "17:33",
    "arrive": "19:37",
    "lines": [
      {
        "mode": "火车",
        "code": "CCN",
        "head": ""
      },
      {
        "mode": "公交",
        "code": "596",
        "head": ""
      }
    ],
    "transfers": 1,
    "walkM": 4100,
    "alight": "Black Ash turnaround",
    "at": "2026-11-13T17:30+11:00",
    "url": "https://www.google.com/maps/dir/?api=1&origin=-33.88633,151.19982&destination=-33.6235,151.1145&travelmode=transit&hl=zh-CN",
    "name": "克罗斯兰兹"
  },
  "katandra": {
    "ok": true,
    "duration": "2 小时 7 分钟",
    "depart": "17:41",
    "arrive": "19:48",
    "lines": [
      {
        "mode": "火车",
        "code": "T1",
        "head": ""
      },
      {
        "mode": "公交",
        "code": "197",
        "head": ""
      }
    ],
    "transfers": 1,
    "walkM": 3050,
    "alight": "Mona Vale Rd before Chiltern Rd",
    "at": "2026-11-13T17:30+11:00",
    "url": "https://www.google.com/maps/dir/?api=1&origin=-33.88633,151.19982&destination=-33.67245,151.28187&travelmode=transit&hl=zh-CN",
    "name": "卡坦德拉"
  },
  "deewhy": {
    "ok": true,
    "duration": "1 小时 22 分钟",
    "depart": "17:35",
    "arrive": "18:57",
    "lines": [
      {
        "mode": "公交",
        "code": "428",
        "head": "Martin Place"
      },
      {
        "mode": "公交",
        "code": "180X",
        "head": ""
      }
    ],
    "transfers": 1,
    "walkM": 1400,
    "alight": "Dee Why B-Line, Pittwater Rd",
    "at": "2026-11-13T17:31+11:00",
    "url": "https://www.google.com/maps/dir/?api=1&origin=-33.88633,151.19982&destination=-33.74858,151.29578&travelmode=transit&hl=zh-CN",
    "name": "迪怀潟湖"
  },
  "deepcreek": {
    "ok": true,
    "duration": "每60分钟",
    "depart": "17:31",
    "arrive": "19:30",
    "lines": [
      {
        "mode": "火车",
        "code": "T9",
        "head": ""
      },
      {
        "mode": "公交",
        "code": "B1",
        "head": ""
      },
      {
        "mode": "公交",
        "code": "182",
        "head": "Mona Vale"
      }
    ],
    "transfers": 2,
    "walkM": 3250,
    "alight": "Rickard Rd opp Venetian Rd",
    "at": "2026-11-13T17:31+11:00",
    "url": "https://www.google.com/maps/dir/?api=1&origin=-33.88633,151.19982&destination=-33.70767,151.27455&travelmode=transit&hl=zh-CN",
    "name": "深溪"
  },
  "resolute": {
    "ok": true,
    "duration": "每8分钟",
    "depart": "17:33",
    "arrive": "03:47",
    "lines": [
      {
        "mode": "火车",
        "code": "T9",
        "head": "Gordon via Lindfield"
      },
      {
        "mode": "公交",
        "code": "B1",
        "head": ""
      },
      {
        "mode": "公交",
        "code": "199",
        "head": "Palm Beach"
      }
    ],
    "transfers": 2,
    "walkM": 36400,
    "alight": "Barrenjoey Rd after Illuka Rd",
    "at": "2026-11-13T17:31+11:00",
    "url": "https://www.google.com/maps/dir/?api=1&origin=-33.88633,151.19982&destination=-33.5849,151.30699&travelmode=transit&hl=zh-CN",
    "name": "坚毅海滩"
  },
  "jibbon": {
    "ok": true,
    "duration": "2 小时 11 分钟",
    "depart": "07:10",
    "arrive": "09:21",
    "lines": [
      {
        "mode": "火车",
        "code": "T4",
        "head": ""
      }
    ],
    "transfers": 0,
    "walkM": 2500,
    "alight": "Bundeena Wharf",
    "at": "2026-11-13T17:31+11:00",
    "url": "https://www.google.com/maps/dir/?api=1&origin=-33.88633,151.19982&destination=-34.08063,151.1657&travelmode=transit&hl=zh-CN",
    "name": "吉本角"
  },
  "otford": {
    "ok": true,
    "duration": "1 小时 27 分钟",
    "depart": "17:43",
    "arrive": "19:10",
    "lines": [
      {
        "mode": "火车",
        "code": "SCO",
        "head": "Waterfall via Wolli Creek"
      }
    ],
    "transfers": 0,
    "walkM": 4022,
    "alight": "Otford",
    "at": "2026-11-13T17:31+11:00",
    "url": "https://www.google.com/maps/dir/?api=1&origin=-33.88633,151.19982&destination=-34.21069,151.00582&travelmode=transit&hl=zh-CN",
    "name": "奥特福德"
  },
  "curracurrang": {
    "ok": false,
    "at": "2026-11-13T17:31+11:00",
    "url": "https://www.google.com/maps/dir/?api=1&origin=-33.88633,151.19982&destination=-34.13771,151.11476&travelmode=transit&hl=zh-CN",
    "name": "卡拉库朗"
  },
  "karloo": {
    "ok": true,
    "duration": "56 分钟",
    "depart": "17:43",
    "arrive": "18:39",
    "lines": [
      {
        "mode": "火车",
        "code": "SCO",
        "head": "Waterfall via Wolli Creek"
      }
    ],
    "transfers": 0,
    "walkM": 960,
    "alight": "Heathcote",
    "at": "2026-11-13T17:31+11:00",
    "url": "https://www.google.com/maps/dir/?api=1&origin=-33.88633,151.19982&destination=-34.08796,151.00826&travelmode=transit&hl=zh-CN",
    "name": "卡卢池"
  },
  "kelly": {
    "ok": true,
    "duration": "1 小时 14 分钟",
    "depart": "17:33",
    "arrive": "18:47",
    "lines": [
      {
        "mode": "火车",
        "code": "SCO",
        "head": "Kiama via Wolli Creek"
      }
    ],
    "transfers": 0,
    "walkM": 900,
    "alight": "Helensburgh",
    "at": "2026-11-13T17:32+11:00",
    "url": "https://www.google.com/maps/dir/?api=1&origin=-33.88633,151.19982&destination=-34.22638,150.98111&travelmode=transit&hl=zh-CN",
    "name": "凯利瀑布"
  },
  "carrington": {
    "ok": false,
    "at": "2026-11-13T17:32+11:00",
    "url": "https://www.google.com/maps/dir/?api=1&origin=-33.88633,151.19982&destination=-34.6238,150.65489&travelmode=transit&hl=zh-CN",
    "name": "卡林顿瀑布"
  },
  "macpass": {
    "ok": false,
    "at": "2026-11-13T17:32+11:00",
    "url": "https://www.google.com/maps/dir/?api=1&origin=-33.88633,151.19982&destination=-34.5674,150.64702&travelmode=transit&hl=zh-CN",
    "name": "麦夸里山口"
  },
  "sassafras": {
    "ok": true,
    "duration": "1 小时 56 分钟",
    "depart": "17:41",
    "arrive": "19:37",
    "lines": [
      {
        "mode": "火车",
        "code": "BMT",
        "head": ""
      },
      {
        "mode": "公交",
        "code": "693",
        "head": ""
      }
    ],
    "transfers": 1,
    "walkM": 1350,
    "alight": "Macquarie Rd at Hawkesbury Rd",
    "at": "2026-11-13T17:32+11:00",
    "url": "https://www.google.com/maps/dir/?api=1&origin=-33.88633,151.19982&destination=-33.7035,150.5705&travelmode=transit&hl=zh-CN",
    "name": "檫木谷"
  },
  "victory": {
    "ok": true,
    "duration": "1 小时 58 分钟",
    "depart": "17:41",
    "arrive": "19:39",
    "lines": [
      {
        "mode": "火车",
        "code": "BMT",
        "head": ""
      }
    ],
    "transfers": 0,
    "walkM": 2200,
    "alight": "Faulconbridge",
    "at": "2026-11-13T17:32+11:00",
    "url": "https://www.google.com/maps/dir/?api=1&origin=-33.88633,151.19982&destination=-33.6955,150.5455&travelmode=transit&hl=zh-CN",
    "name": "胜利小径"
  },
  "putty": {
    "ok": true,
    "duration": "2 小时 23 分钟",
    "depart": "17:33",
    "arrive": "19:56",
    "lines": [
      {
        "mode": "火车",
        "code": "CCN",
        "head": ""
      },
      {
        "mode": "公交",
        "code": "59",
        "head": "Wagstaffe"
      }
    ],
    "transfers": 1,
    "walkM": 1500,
    "alight": "Nukara Ave at Beach Dr",
    "at": "2026-11-13T17:32+11:00",
    "url": "https://www.google.com/maps/dir/?api=1&origin=-33.88633,151.19982&destination=-33.53074,151.36321&travelmode=transit&hl=zh-CN",
    "name": "帕蒂海滩"
  },
  "pitttown": {
    "ok": true,
    "duration": "2 小时 4 分钟",
    "depart": "18:04",
    "arrive": "20:08",
    "lines": [
      {
        "mode": "火车",
        "code": "T1",
        "head": ""
      },
      {
        "mode": "公交",
        "code": "672",
        "head": "Windsor via Wisemans Ferry"
      }
    ],
    "transfers": 1,
    "walkM": 1060,
    "alight": "Bathurst St opp Grenville St",
    "at": "2026-11-13T17:32+11:00",
    "url": "https://www.google.com/maps/dir/?api=1&origin=-33.88633,151.19982&destination=-33.59002,150.85522&travelmode=transit&hl=zh-CN",
    "name": "皮特敦潟湖"
  },
  "bushells": {
    "ok": false,
    "at": "2026-11-13T17:32+11:00",
    "url": "https://www.google.com/maps/dir/?api=1&origin=-33.88633,151.19982&destination=-33.5755,150.8085&travelmode=transit&hl=zh-CN",
    "name": "布舍尔斯潟湖"
  },
  "scheyville": {
    "ok": true,
    "duration": "2 小时 18 分钟",
    "depart": "11:10",
    "arrive": "13:28",
    "lines": [
      {
        "mode": "公交",
        "code": "639",
        "head": ""
      }
    ],
    "transfers": 0,
    "walkM": 3700,
    "alight": "Maraylya Public School, Boundary Rd",
    "at": "2026-11-13T17:32+11:00",
    "url": "https://www.google.com/maps/dir/?api=1&origin=-33.88633,151.19982&destination=-33.59631,150.89626&travelmode=transit&hl=zh-CN",
    "name": "沙伊维尔"
  },
  "bents": {
    "ok": true,
    "duration": "6 小时 33 分钟",
    "depart": "04:51",
    "arrive": "11:24",
    "lines": [
      {
        "mode": "火车",
        "code": "T1",
        "head": ""
      },
      {
        "mode": "公交",
        "code": "795",
        "head": ""
      },
      {
        "mode": "公交",
        "code": "32",
        "head": "St Paul's Catholic Primary"
      }
    ],
    "transfers": 2,
    "walkM": 17750,
    "alight": "Taylors Rd opp Barrington Rd",
    "at": "2026-11-13T17:33+11:00",
    "url": "https://www.google.com/maps/dir/?api=1&origin=-33.88633,151.19982&destination=-33.9314,150.63151&travelmode=transit&hl=zh-CN",
    "name": "本茨盆地"
  },
  "thirlmere": {
    "ok": true,
    "duration": "2 小时 41 分钟",
    "depart": "17:40",
    "arrive": "20:21",
    "lines": [
      {
        "mode": "火车",
        "code": "T8",
        "head": ""
      },
      {
        "mode": "火车",
        "code": "SHL",
        "head": ""
      },
      {
        "mode": "公交",
        "code": "828",
        "head": "Mittagong"
      }
    ],
    "transfers": 2,
    "walkM": 3600,
    "alight": "West Pde at Bargo River Rd",
    "at": "2026-11-13T17:33+11:00",
    "url": "https://www.google.com/maps/dir/?api=1&origin=-33.88633,151.19982&destination=-34.22681,150.53984&travelmode=transit&hl=zh-CN",
    "name": "瑟尔米尔湖"
  },
  "cataract": {
    "ok": false,
    "at": "2026-11-13T17:33+11:00",
    "url": "https://www.google.com/maps/dir/?api=1&origin=-33.88633,151.19982&destination=-34.26559,150.8032&travelmode=transit&hl=zh-CN",
    "name": "卡塔拉克特水坝"
  },
  "tallowa": {
    "ok": false,
    "at": "2026-11-13T17:33+11:00",
    "url": "https://www.google.com/maps/dir/?api=1&origin=-33.88633,151.19982&destination=-34.77254,150.31322&travelmode=transit&hl=zh-CN",
    "name": "塔洛瓦"
  },
  "glow": {
    "ok": false,
    "at": "2026-11-13T17:33+11:00",
    "url": "https://www.google.com/maps/dir/?api=1&origin=-33.88633,151.19982&destination=-33.23833,150.22628&travelmode=transit&hl=zh-CN",
    "name": "萤火虫隧道"
  },
  "seven": {
    "ok": true,
    "duration": "3 小时 26 分钟",
    "depart": "07:17",
    "arrive": "10:43",
    "lines": [
      {
        "mode": "火车",
        "code": "SCO",
        "head": ""
      },
      {
        "mode": "公交",
        "code": "126",
        "head": ""
      }
    ],
    "transfers": 1,
    "walkM": 961,
    "alight": "Belinda St opp Brook St",
    "at": "2026-11-13T17:33+11:00",
    "url": "https://www.google.com/maps/dir/?api=1&origin=-33.88633,151.19982&destination=-34.77284,150.80668&travelmode=transit&hl=zh-CN",
    "name": "七英里海滩"
  },
  "jerusalem": {
    "ok": true,
    "duration": "1 小时 27 分钟",
    "depart": "17:52",
    "arrive": "19:19",
    "lines": [
      {
        "mode": "火车",
        "code": "CCN",
        "head": "Wyong via Strathfield"
      }
    ],
    "transfers": 0,
    "walkM": 14300,
    "alight": "Cowan",
    "at": "2026-11-13T17:33+11:00",
    "url": "https://www.google.com/maps/dir/?api=1&origin=-33.88633,151.19982&destination=-33.58893,151.18572&travelmode=transit&hl=zh-CN",
    "name": "耶路撒冷湾"
  },
  "muogamarra": {
    "ok": true,
    "duration": "4 小时 6 分钟",
    "depart": "06:33",
    "arrive": "10:39",
    "lines": [
      {
        "mode": "火车",
        "code": "CCN",
        "head": ""
      },
      {
        "mode": "公交",
        "code": "592",
        "head": "Hawkesbury River"
      }
    ],
    "transfers": 1,
    "walkM": 1000,
    "alight": "3 Brooklyn Rd",
    "at": "2026-11-13T17:33+11:00",
    "url": "https://www.google.com/maps/dir/?api=1&origin=-33.88633,151.19982&destination=-33.55605,151.17956&travelmode=transit&hl=zh-CN",
    "name": "穆加马拉"
  },
  "sandon": {
    "ok": true,
    "duration": "2 小时 13 分钟",
    "depart": "17:43",
    "arrive": "19:56",
    "lines": [
      {
        "mode": "火车",
        "code": "SCO",
        "head": "Waterfall via Wolli Creek"
      }
    ],
    "transfers": 0,
    "walkM": 2400,
    "alight": "Bulli",
    "at": "2026-11-13T17:33+11:00",
    "url": "https://www.google.com/maps/dir/?api=1&origin=-33.88633,151.19982&destination=-34.33024,150.92734&travelmode=transit&hl=zh-CN",
    "name": "桑登角"
  },
  "boatharbour": {
    "ok": true,
    "duration": "每10分钟",
    "depart": "17:36",
    "arrive": "18:39",
    "lines": [
      {
        "mode": "火车",
        "code": "T4",
        "head": "Cronulla via Kogarah"
      }
    ],
    "transfers": 0,
    "walkM": 997,
    "alight": "Cronulla",
    "at": "2026-11-13T17:34+11:00",
    "url": "https://www.google.com/maps/dir/?api=1&origin=-33.88633,151.19982&destination=-34.05573,151.15146&travelmode=transit&hl=zh-CN",
    "name": "船港"
  },
  "walls": {
    "ok": true,
    "duration": "3 小时 59 分钟",
    "depart": "05:09",
    "arrive": "09:08",
    "lines": [
      {
        "mode": "火车",
        "code": "BMT",
        "head": ""
      },
      {
        "mode": "公交",
        "code": "698",
        "head": "Katoomba via Blackheath"
      }
    ],
    "transfers": 1,
    "walkM": 2500,
    "alight": "Evans Lookout Rd before Forest Park Rd",
    "at": "2026-11-13T17:34+11:00",
    "url": "https://www.google.com/maps/dir/?api=1&origin=-33.88633,151.19982&destination=-33.65691,150.3021&travelmode=transit&hl=zh-CN",
    "name": "岩洞步道"
  },
  "mtwilson": {
    "ok": false,
    "at": "2026-11-13T17:34+11:00",
    "url": "https://www.google.com/maps/dir/?api=1&origin=-33.88633,151.19982&destination=-33.515,150.36778&travelmode=transit&hl=zh-CN",
    "name": "威尔逊山"
  },
  "grotto": {
    "ok": true,
    "duration": "1 小时 22 分钟",
    "depart": "17:47",
    "arrive": "19:09",
    "lines": [
      {
        "mode": "公交",
        "code": "428",
        "head": "Martin Place"
      },
      {
        "mode": "公交",
        "code": "171X",
        "head": ""
      }
    ],
    "transfers": 1,
    "walkM": 1700,
    "alight": "Beatrice St at Moore St",
    "at": "2026-11-13T17:34+11:00",
    "url": "https://www.google.com/maps/dir/?api=1&origin=-33.88633,151.19982&destination=-33.81812,151.26118&travelmode=transit&hl=zh-CN",
    "name": "石窟角"
  },
  "inscript": {
    "ok": true,
    "duration": "1 小时 40 分钟",
    "depart": "17:36",
    "arrive": "19:16",
    "lines": [
      {
        "mode": "火车",
        "code": "T4",
        "head": "Cronulla via Kogarah"
      },
      {
        "mode": "公交",
        "code": "987",
        "head": ""
      }
    ],
    "transfers": 1,
    "walkM": 1900,
    "alight": "Kamay Botany Bay National Park, Captain Cook Dr",
    "at": "2026-11-13T17:34+11:00",
    "url": "https://www.google.com/maps/dir/?api=1&origin=-33.88633,151.19982&destination=-34.00174,151.22365&travelmode=transit&hl=zh-CN",
    "name": "铭文角"
  },
  "warrah": {
    "ok": true,
    "duration": "3 小时 8 分钟",
    "depart": "04:33",
    "arrive": "07:41",
    "lines": [
      {
        "mode": "火车",
        "code": "CCN",
        "head": ""
      },
      {
        "mode": "公交",
        "code": "54",
        "head": ""
      }
    ],
    "transfers": 1,
    "walkM": 9350,
    "alight": "Pearl Beach Memorial Community Hall, Diamond Rd",
    "at": "2026-11-13T17:34+11:00",
    "url": "https://www.google.com/maps/dir/?api=1&origin=-33.88633,151.19982&destination=-33.55281,151.28893&travelmode=transit&hl=zh-CN",
    "name": "瓦拉瞭望台"
  },
  "cattai": {
    "ok": true,
    "duration": "2 小时 46 分钟",
    "depart": "04:31",
    "arrive": "07:17",
    "lines": [
      {
        "mode": "公交",
        "code": "N71",
        "head": "Richmond Station"
      },
      {
        "mode": "公交",
        "code": "672",
        "head": "Windsor via Wisemans Ferry"
      }
    ],
    "transfers": 1,
    "walkM": 3350,
    "alight": "Cattai Public School, Cattai Rd",
    "at": "2026-11-13T17:34+11:00",
    "url": "https://www.google.com/maps/dir/?api=1&origin=-33.88633,151.19982&destination=-33.56516,150.92708&travelmode=transit&hl=zh-CN",
    "name": "卡泰"
  },
  "belmore": {
    "ok": false,
    "at": "2026-11-13T17:34+11:00",
    "url": "https://www.google.com/maps/dir/?api=1&origin=-33.88633,151.19982&destination=-34.63915,150.55895&travelmode=transit&hl=zh-CN",
    "name": "贝尔莫尔瀑布"
  },
  "narrabeen": {
    "ok": true,
    "duration": "1 小时 52 分钟",
    "depart": "17:34",
    "arrive": "19:26",
    "lines": [
      {
        "mode": "火车",
        "code": "T2",
        "head": ""
      },
      {
        "mode": "公交",
        "code": "180X",
        "head": ""
      }
    ],
    "transfers": 1,
    "walkM": 2700,
    "alight": "Veterans Pde opp RSL ANZAC Village",
    "at": "2026-11-13T17:34+11:00",
    "url": "https://www.google.com/maps/dir/?api=1&origin=-33.88633,151.19982&destination=-33.71294,151.28225&travelmode=transit&hl=zh-CN",
    "name": "纳拉宾潟湖"
  },
  "wiana": {
    "ok": true,
    "duration": "2 小时 28 分钟",
    "depart": "17:37",
    "arrive": "20:05",
    "lines": [
      {
        "mode": "火车",
        "code": "T1",
        "head": ""
      },
      {
        "mode": "公交",
        "code": "786",
        "head": "Penrith via Cranebrook"
      }
    ],
    "transfers": 1,
    "walkM": 4050,
    "alight": "Henry Fulton Public School, Grays Lane",
    "at": "2026-11-13T17:35+11:00",
    "url": "https://www.google.com/maps/dir/?api=1&origin=-33.88633,151.19982&destination=-33.69842,150.71685&travelmode=transit&hl=zh-CN",
    "name": "维亚纳马塔"
  }
};
