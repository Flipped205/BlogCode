



/**

 * 公历[1900-1-31,2100-12-31]时间区间内的公历、农历互转

 * @charset UTF-8

 * @Author  Jea杨(JJonline@JJonline.Cn)

 * @Version 1.0.0

 * @公历转农历：calendar.solar2lunar(1987,11,01); //[you can ignore params of prefix 0]

 * @农历转公历：calendar.lunar2solar(1987,09,10); //[you can ignore params of prefix 0] */var calendar = {    /**

     * 农历1900-2100的润大小信息表

     * @Array Of Property

     * @return Hex     */

    lunarInfo: [0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,//1900-1909

        0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977,//1910-1919

        0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970,//1920-1929

        0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,//1930-1939

        0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557,//1940-1949

        0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0,//1950-1959

        0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0,//1960-1969

        0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6,//1970-1979

        0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570,//1980-1989

        0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x055c0, 0x0ab60, 0x096d5, 0x092e0,//1990-1999

        0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5,//2000-2009

        0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,//2010-2019

        0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530,//2020-2029

        0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45,//2030-2039

        0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0,//2040-2049

        0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0,//2050-2059

        0x0a2e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4,//2060-2069

        0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0,//2070-2079

        0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160,//2080-2089

        0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a2d0, 0x0d150, 0x0f252,//2090-2099

        0x0d520],//2100

    /**

     * 公历每个月份的天数普通表

     * @Array Of Property

     * @return Number     */

    solarMonth: [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],    /**

     * 天干地支之天干速查表

     * @Array Of Property

     * @trans ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"]

     * @return Cn string     */

    Gan: ["\u7532", "\u4e59", "\u4e19", "\u4e01", "\u620a", "\u5df1", "\u5e9a", "\u8f9b", "\u58ec", "\u7678"],    /**

     * 天干地支之地支速查表

     * @Array Of Property

     * @trans ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"]

     * @return Cn string     */

    Zhi: ["\u5b50", "\u4e11", "\u5bc5", "\u536f", "\u8fb0", "\u5df3", "\u5348", "\u672a", "\u7533", "\u9149", "\u620c", "\u4ea5"],    /**

     * 生肖速查表

     * @Array Of Property

     * @trans ["鼠","牛","虎","兔","龙","蛇","马","羊","猴","鸡","狗","猪"]

     * @return Cn string     */

    Animals: ["\u9f20", "\u725b", "\u864e", "\u5154", "\u9f99", "\u86c7", "\u9a6c", "\u7f8a", "\u7334", "\u9e21", "\u72d7", "\u732a"],    /**

     * 24节气速查表

     * @Array Of Property

     * @trans ["小寒","大寒","立春","雨水","惊蛰","春分","清明","谷雨","立夏","小满","芒种","夏至","小暑","大暑","立秋","处暑","白露","秋分","寒露","霜降","立冬","小雪","大雪","冬至"]

     * @return Cn string     */

    solarTerm: ["\u5c0f\u5bd2", "\u5927\u5bd2", "\u7acb\u6625", "\u96e8\u6c34", "\u60ca\u86f0", "\u6625\u5206", "\u6e05\u660e", "\u8c37\u96e8", "\u7acb\u590f", "\u5c0f\u6ee1", "\u8292\u79cd", "\u590f\u81f3", "\u5c0f\u6691", "\u5927\u6691", "\u7acb\u79cb", "\u5904\u6691", "\u767d\u9732", "\u79cb\u5206", "\u5bd2\u9732", "\u971c\u964d", "\u7acb\u51ac", "\u5c0f\u96ea", "\u5927\u96ea", "\u51ac\u81f3"],    /**

     * 1900-2100各年的24节气日期速查表

     * @Array Of Property

     * @return 0x string For splice     */

    sTermInfo: ['9778397bd097c36b0b6fc9274c91aa', '97b6b97bd19801ec9210c965cc920e', '97bcf97c3598082c95f8c965cc920f',        '97bd0b06bdb0722c965ce1cfcc920f', 'b027097bd097c36b0b6fc9274c91aa', '97b6b97bd19801ec9210c965cc920e',        '97bcf97c359801ec95f8c965cc920f', '97bd0b06bdb0722c965ce1cfcc920f', 'b027097bd097c36b0b6fc9274c91aa',        '97b6b97bd19801ec9210c965cc920e', '97bcf97c359801ec95f8c965cc920f', '97bd0b06bdb0722c965ce1cfcc920f',        'b027097bd097c36b0b6fc9274c91aa', '9778397bd19801ec9210c965cc920e', '97b6b97bd19801ec95f8c965cc920f',        '97bd09801d98082c95f8e1cfcc920f', '97bd097bd097c36b0b6fc9210c8dc2', '9778397bd197c36c9210c9274c91aa',        '97b6b97bd19801ec95f8c965cc920e', '97bd09801d98082c95f8e1cfcc920f', '97bd097bd097c36b0b6fc9210c8dc2',        '9778397bd097c36c9210c9274c91aa', '97b6b97bd19801ec95f8c965cc920e', '97bcf97c3598082c95f8e1cfcc920f',        '97bd097bd097c36b0b6fc9210c8dc2', '9778397bd097c36c9210c9274c91aa', '97b6b97bd19801ec9210c965cc920e',        '97bcf97c3598082c95f8c965cc920f', '97bd097bd097c35b0b6fc920fb0722', '9778397bd097c36b0b6fc9274c91aa',        '97b6b97bd19801ec9210c965cc920e', '97bcf97c3598082c95f8c965cc920f', '97bd097bd097c35b0b6fc920fb0722',        '9778397bd097c36b0b6fc9274c91aa', '97b6b97bd19801ec9210c965cc920e', '97bcf97c359801ec95f8c965cc920f',        '97bd097bd097c35b0b6fc920fb0722', '9778397bd097c36b0b6fc9274c91aa', '97b6b97bd19801ec9210c965cc920e',        '97bcf97c359801ec95f8c965cc920f', '97bd097bd097c35b0b6fc920fb0722', '9778397bd097c36b0b6fc9274c91aa',        '97b6b97bd19801ec9210c965cc920e', '97bcf97c359801ec95f8c965cc920f', '97bd097bd07f595b0b6fc920fb0722',        '9778397bd097c36b0b6fc9210c8dc2', '9778397bd19801ec9210c9274c920e', '97b6b97bd19801ec95f8c965cc920f',        '97bd07f5307f595b0b0bc920fb0722', '7f0e397bd097c36b0b6fc9210c8dc2', '9778397bd097c36c9210c9274c920e',        '97b6b97bd19801ec95f8c965cc920f', '97bd07f5307f595b0b0bc920fb0722', '7f0e397bd097c36b0b6fc9210c8dc2',        '9778397bd097c36c9210c9274c91aa', '97b6b97bd19801ec9210c965cc920e', '97bd07f1487f595b0b0bc920fb0722',        '7f0e397bd097c36b0b6fc9210c8dc2', '9778397bd097c36b0b6fc9274c91aa', '97b6b97bd19801ec9210c965cc920e',        '97bcf7f1487f595b0b0bb0b6fb0722', '7f0e397bd097c35b0b6fc920fb0722', '9778397bd097c36b0b6fc9274c91aa',        '97b6b97bd19801ec9210c965cc920e', '97bcf7f1487f595b0b0bb0b6fb0722', '7f0e397bd097c35b0b6fc920fb0722',        '9778397bd097c36b0b6fc9274c91aa', '97b6b97bd19801ec9210c965cc920e', '97bcf7f1487f531b0b0bb0b6fb0722',        '7f0e397bd097c35b0b6fc920fb0722', '9778397bd097c36b0b6fc9274c91aa', '97b6b97bd19801ec9210c965cc920e',        '97bcf7f1487f531b0b0bb0b6fb0722', '7f0e397bd07f595b0b6fc920fb0722', '9778397bd097c36b0b6fc9274c91aa',        '97b6b97bd19801ec9210c9274c920e', '97bcf7f0e47f531b0b0bb0b6fb0722', '7f0e397bd07f595b0b0bc920fb0722',        '9778397bd097c36b0b6fc9210c91aa', '97b6b97bd197c36c9210c9274c920e', '97bcf7f0e47f531b0b0bb0b6fb0722',        '7f0e397bd07f595b0b0bc920fb0722', '9778397bd097c36b0b6fc9210c8dc2', '9778397bd097c36c9210c9274c920e',        '97b6b7f0e47f531b0723b0b6fb0722', '7f0e37f5307f595b0b0bc920fb0722', '7f0e397bd097c36b0b6fc9210c8dc2',        '9778397bd097c36b0b70c9274c91aa', '97b6b7f0e47f531b0723b0b6fb0721', '7f0e37f1487f595b0b0bb0b6fb0722',        '7f0e397bd097c35b0b6fc9210c8dc2', '9778397bd097c36b0b6fc9274c91aa', '97b6b7f0e47f531b0723b0b6fb0721',        '7f0e27f1487f595b0b0bb0b6fb0722', '7f0e397bd097c35b0b6fc920fb0722', '9778397bd097c36b0b6fc9274c91aa',        '97b6b7f0e47f531b0723b0b6fb0721', '7f0e27f1487f531b0b0bb0b6fb0722', '7f0e397bd097c35b0b6fc920fb0722',        '9778397bd097c36b0b6fc9274c91aa', '97b6b7f0e47f531b0723b0b6fb0721', '7f0e27f1487f531b0b0bb0b6fb0722',        '7f0e397bd097c35b0b6fc920fb0722', '9778397bd097c36b0b6fc9274c91aa', '97b6b7f0e47f531b0723b0b6fb0721',        '7f0e27f1487f531b0b0bb0b6fb0722', '7f0e397bd07f595b0b0bc920fb0722', '9778397bd097c36b0b6fc9274c91aa',        '97b6b7f0e47f531b0723b0787b0721', '7f0e27f0e47f531b0b0bb0b6fb0722', '7f0e397bd07f595b0b0bc920fb0722',        '9778397bd097c36b0b6fc9210c91aa', '97b6b7f0e47f149b0723b0787b0721', '7f0e27f0e47f531b0723b0b6fb0722',        '7f0e397bd07f595b0b0bc920fb0722', '9778397bd097c36b0b6fc9210c8dc2', '977837f0e37f149b0723b0787b0721',        '7f07e7f0e47f531b0723b0b6fb0722', '7f0e37f5307f595b0b0bc920fb0722', '7f0e397bd097c35b0b6fc9210c8dc2',        '977837f0e37f14998082b0787b0721', '7f07e7f0e47f531b0723b0b6fb0721', '7f0e37f1487f595b0b0bb0b6fb0722',        '7f0e397bd097c35b0b6fc9210c8dc2', '977837f0e37f14998082b0787b06bd', '7f07e7f0e47f531b0723b0b6fb0721',        '7f0e27f1487f531b0b0bb0b6fb0722', '7f0e397bd097c35b0b6fc920fb0722', '977837f0e37f14998082b0787b06bd',        '7f07e7f0e47f531b0723b0b6fb0721', '7f0e27f1487f531b0b0bb0b6fb0722', '7f0e397bd097c35b0b6fc920fb0722',        '977837f0e37f14998082b0787b06bd', '7f07e7f0e47f531b0723b0b6fb0721', '7f0e27f1487f531b0b0bb0b6fb0722',        '7f0e397bd07f595b0b0bc920fb0722', '977837f0e37f14998082b0787b06bd', '7f07e7f0e47f531b0723b0b6fb0721',        '7f0e27f1487f531b0b0bb0b6fb0722', '7f0e397bd07f595b0b0bc920fb0722', '977837f0e37f14998082b0787b06bd',        '7f07e7f0e47f149b0723b0787b0721', '7f0e27f0e47f531b0b0bb0b6fb0722', '7f0e397bd07f595b0b0bc920fb0722',        '977837f0e37f14998082b0723b06bd', '7f07e7f0e37f149b0723b0787b0721', '7f0e27f0e47f531b0723b0b6fb0722',        '7f0e397bd07f595b0b0bc920fb0722', '977837f0e37f14898082b0723b02d5', '7ec967f0e37f14998082b0787b0721',        '7f07e7f0e47f531b0723b0b6fb0722', '7f0e37f1487f595b0b0bb0b6fb0722', '7f0e37f0e37f14898082b0723b02d5',        '7ec967f0e37f14998082b0787b0721', '7f07e7f0e47f531b0723b0b6fb0722', '7f0e37f1487f531b0b0bb0b6fb0722',        '7f0e37f0e37f14898082b0723b02d5', '7ec967f0e37f14998082b0787b06bd', '7f07e7f0e47f531b0723b0b6fb0721',        '7f0e37f1487f531b0b0bb0b6fb0722', '7f0e37f0e37f14898082b072297c35', '7ec967f0e37f14998082b0787b06bd',        '7f07e7f0e47f531b0723b0b6fb0721', '7f0e27f1487f531b0b0bb0b6fb0722', '7f0e37f0e37f14898082b072297c35',        '7ec967f0e37f14998082b0787b06bd', '7f07e7f0e47f531b0723b0b6fb0721', '7f0e27f1487f531b0b0bb0b6fb0722',        '7f0e37f0e366aa89801eb072297c35', '7ec967f0e37f14998082b0787b06bd', '7f07e7f0e47f149b0723b0787b0721',        '7f0e27f1487f531b0b0bb0b6fb0722', '7f0e37f0e366aa89801eb072297c35', '7ec967f0e37f14998082b0723b06bd',        '7f07e7f0e47f149b0723b0787b0721', '7f0e27f0e47f531b0723b0b6fb0722', '7f0e37f0e366aa89801eb072297c35',        '7ec967f0e37f14998082b0723b06bd', '7f07e7f0e37f14998083b0787b0721', '7f0e27f0e47f531b0723b0b6fb0722',        '7f0e37f0e366aa89801eb072297c35', '7ec967f0e37f14898082b0723b02d5', '7f07e7f0e37f14998082b0787b0721',        '7f07e7f0e47f531b0723b0b6fb0722', '7f0e36665b66aa89801e9808297c35', '665f67f0e37f14898082b0723b02d5',        '7ec967f0e37f14998082b0787b0721', '7f07e7f0e47f531b0723b0b6fb0722', '7f0e36665b66a449801e9808297c35',        '665f67f0e37f14898082b0723b02d5', '7ec967f0e37f14998082b0787b06bd', '7f07e7f0e47f531b0723b0b6fb0721',        '7f0e36665b66a449801e9808297c35', '665f67f0e37f14898082b072297c35', '7ec967f0e37f14998082b0787b06bd',        '7f07e7f0e47f531b0723b0b6fb0721', '7f0e26665b66a449801e9808297c35', '665f67f0e37f1489801eb072297c35',        '7ec967f0e37f14998082b0787b06bd', '7f07e7f0e47f531b0723b0b6fb0721', '7f0e27f1487f531b0b0bb0b6fb0722'],    /**

     * 数字转中文速查表

     * @Array Of Property

     * @trans ['日','一','二','三','四','五','六','七','八','九','十']

     * @return Cn string     */

    nStr1: ["\u65e5", "\u4e00", "\u4e8c", "\u4e09", "\u56db", "\u4e94", "\u516d", "\u4e03", "\u516b", "\u4e5d", "\u5341"],    /**

     * 日期转农历称呼速查表

     * @Array Of Property

     * @trans ['初','十','廿','卅']

     * @return Cn string     */

    nStr2: ["\u521d", "\u5341", "\u5eff", "\u5345"],    /**

     * 月份转农历称呼速查表

     * @Array Of Property

     * @trans ['正','二','三','四','五','六','七','八','九','十','冬','腊']

     * @return Cn string     */

     nStr3: ["\u6b63", "\u4e8c", "\u4e09", "\u56db", "\u4e94", "\u516d", "\u4e03", "\u516b", "\u4e5d", "\u5341", "\u51ac", "\u814a"],   
     /**

     * 中国法定节假日速查表(公历)(清明节属24节气)

     * @Json of Property

     * @trans {"0101" : "元旦节", "0501" : "劳动节", "1001" : "国庆节", "0308" : "妇女节", "0504" : "青年节", "0601" : "儿童节", "0801" : "建军节"}

     * @return Cn string     */

    nStr4: {        "0101": "\u5143\u65e6\u8282", // 公历1月1日

        "0501": "\u52b3\u52a8\u8282", // 公历5月1日

        "1001": "\u56fd\u5e86\u8282", // 公历10月1日

        "0308": "\u5987\u5973\u8282", // 公历3月8日

        "0504": "\u9752\u5e74\u8282", // 公历5月4日

        "0601": "\u513f\u7ae5\u8282", // 公历6月1日

        "0801": "\u5efa\u519b\u8282" // 公历8月1日   
    },   
         /**

     * 中国法定节假日速查表(农历)(清明节属24节气)

     * @Json of Property

     * @trans {"0101" : "春节", "0505" : "端午节", "0815" : "中秋节"}

     * @return Cn string     */

    nStr5: {        "0101": "\u6625\u8282", // 农历正月初一

  		"0115": "\u5143\u5bb5\u8282", // 农历一月十五

        "0505": "\u7aef\u5348\u8282", // 农历五月初五

        "0815": "\u4e2d\u79cb\u8282" // 农历八月十五    
    },   
         /**

     * 休息日速查表

     * @Json of Property

     * @return Json     */

     leave: {        "2018": {            "01": ["01", "06", "07", "13", "14", "20", "21", "27", "28"],            "02": ["03", "04", "10", "15", "16", "17", "18", "19", "20", "21", "25"],            "03": ["03", "04", "10", "11", "17", "18", "24", "25", "31"],            "04": ["05", "06", "07", "14", "15", "21", "22", "29", "30"],            "05": ["01", "05", "06", "12", "13", "19", "20", "26", "27"],            "06": ["02", "03", "09", "10", "16", "17", "18", "23", "24", "30"],            "07": ["01", "07", "08", "14", "15", "21", "22", "28", "29"],            "08": ["04", "05", "11", "12", "18", "19", "25", "26"],            "09": ["01", "02", "08", "09", "15", "16", "22", "23", "24"],            "10": ["01", "02", "03", "04", "05", "06", "07", "13", "14", "20", "21", "27", "28"],            "11": ["03", "04", "10", "11", "17", "18", "24", "25"],            "12": ["01", "02", "08", "09", "15", "16", "22", "23", "29", "30"]

 }

    },    /**

     * 获取农历y年一整年的总天数

     * @param {Number} y - lunar year

     * @return {Number}

     * @eg:var count = calendar.lYearDays(1987) ;//count=384     */

     lYearDays: function (y) {        var i, sum = 348;        for (i = 0x8000; i > 0x8; i >>= 1) {

     	sum += (calendar.lunarInfo[y - 1900] & i) ? 1 : 0;

     }        return (sum + calendar.leapDays(y));

    },    /**

     * 获取农历y年闰月是哪个月；若y年没有闰月 则返回0

     * @param {Number} y - lunar year

     * @return {Number} (0-12)

     * @eg:var leapMonth = calendar.leapMonth(1987) ;//leapMonth=6     */

    leapMonth: function (y) { //闰字编码 \u95f0

    	return (calendar.lunarInfo[y - 1900] & 0xf);

    },    /**

     * 获取农历y年闰月的天数；若该年没有闰月则返回0

     * @param {Number} y - lunar year

     * @return {Number} (0、29、30)

     * @eg:var leapMonthDay = calendar.leapDays(1987) ;//leapMonthDay=29     */

     leapDays: function (y) {        if (calendar.leapMonth(y)) {            return ((calendar.lunarInfo[y - 1900] & 0x10000) ? 30 : 29);

     }        return (0);

    },    /**

     * 获取农历y年m月（非闰月）的总天数，计算m为闰月时的天数请使用leapDays方法

     * @param {Number} y - lunar year

     * @param {Number} m - lunar month

     * @return {Number} (-1、29、30)

     * @eg:var MonthDay = calendar.monthDays(1987,9) ;//MonthDay=29     */

     monthDays: function (y, m) {        if (m > 12 || m < 1) {            return -1

        }//月份参数从1至12，参数错误返回-1

        return ( (calendar.lunarInfo[y - 1900] & (0x10000 >> m)) ? 30 : 29 );

    },    /**

     * 获取公历y年m月的天数

     * @param {Number} solar Year

     * @param {Number} solar Month

     * @return Number (-1、28、29、30、31)

     * @eg:var solarMonthDay = calendar.leapDays(1987) ;//solarMonthDay=30     */

     solarDays: function (y, m) {        if (m > 12 || m < 1) {            return -1

        } //若参数错误 返回-1

        var ms = m - 1;        if (ms == 1) { //2月份的闰平规律测算后确认返回28或29

        	return (((y % 4 == 0) && (y % 100 != 0) || (y % 400 == 0)) ? 29 : 28);

        } else {            return (calendar.solarMonth[ms]);

        }

    },    /**

     * 农历年份转换为干支纪年

     * @param {Number} y - lunar year

     * @return {String} Cn string     */

    toGanZhiYear: function (y) {        var ganKey = (y - 3) % 10;        var zhiKey = (y - 3) % 12;        if (ganKey == 0) ganKey = 10;//如果余数为0则为最后一个天干

        if (zhiKey == 0) zhiKey = 12;//如果余数为0则为最后一个地支

        return calendar.Gan[ganKey - 1] + calendar.Zhi[zhiKey - 1];

    },    /**

     * 公历月、日判断所属星座

     * @param {Number} m - solar month

     * @param {Number} d - solar day

     * @return {String} Cn string     */

    toAstro: function (m, d) {        var s = "\u9b54\u7faf\u6c34\u74f6\u53cc\u9c7c\u767d\u7f8a\u91d1\u725b\u53cc\u5b50\u5de8\u87f9\u72ee\u5b50\u5904\u5973\u5929\u79e4\u5929\u874e\u5c04\u624b\u9b54\u7faf";        var arr = [20, 19, 21, 21, 21, 22, 23, 23, 23, 23, 23, 22];        return s.substr(m * 2 - (d < arr[m - 1] ? 2 : 0), 2) + "\u5ea7";//座 
       },    /**

     * 传入offset偏移量返回干支

     * @param {Number} offset - 相对甲子的偏移量

     * @return {String} Cn string     */

     toGanZhi: function (offset) {        return calendar.Gan[offset % 10] + calendar.Zhi[offset % 12];

    },    /**

     * 传入公历y年获得该年第n个节气的公历日期

     * @param {Number} y - 公历年(1900-2100)

     * @param {Number} n - 二十四节气中的第几个节气(1~24),从n=1(小寒)算起

     * @return {Number} day

     * @eg:var _24 = calendar.getTerm(1987,3) ;//_24=4;意即1987年2月4日立春     */

     getTerm: function (y, n) {        if (y < 1900 || y > 2100) {            return -1;

     }        if (n < 1 || n > 24) {            return -1;

     }        var _table = calendar.sTermInfo[y - 1900];        var _info = [

     parseInt('0x' + _table.substr(0, 5)).toString(),

     parseInt('0x' + _table.substr(5, 5)).toString(),

     parseInt('0x' + _table.substr(10, 5)).toString(),

     parseInt('0x' + _table.substr(15, 5)).toString(),

     parseInt('0x' + _table.substr(20, 5)).toString(),

     parseInt('0x' + _table.substr(25, 5)).toString()

     ];        var _calday = [

     _info[0].substr(0, 1),

     _info[0].substr(1, 2),

     _info[0].substr(3, 1),

     _info[0].substr(4, 2),

     _info[1].substr(0, 1),

     _info[1].substr(1, 2),

     _info[1].substr(3, 1),

     _info[1].substr(4, 2),

     _info[2].substr(0, 1),

     _info[2].substr(1, 2),

     _info[2].substr(3, 1),

     _info[2].substr(4, 2),

     _info[3].substr(0, 1),

     _info[3].substr(1, 2),

     _info[3].substr(3, 1),

     _info[3].substr(4, 2),

     _info[4].substr(0, 1),

     _info[4].substr(1, 2),

     _info[4].substr(3, 1),

     _info[4].substr(4, 2),

     _info[5].substr(0, 1),

     _info[5].substr(1, 2),

     _info[5].substr(3, 1),

     _info[5].substr(4, 2),

     ];        return parseInt(_calday[n - 1]);

    },    /**

     * 传入农历数字月份返回汉语通俗表示法

     * @param {Number} m - lunar month

     * @return {String} Cn string

     * @eg:var cnMonth = calendar.toChinaMonth(12) ;//cnMonth='腊月'     */

    toChinaMonth: function (m) { // 月 => \u6708

    	if (m > 12 || m < 1) {            return -1

        } //若参数错误 返回-1

        var s = calendar.nStr3[m - 1];

        s += "\u6708";//加上月字

        return s;

    },    /**

     * 传入农历日期数字返回汉字表示法

     * @param {Number} d - lunar day

     * @return {String} Cn string

     * @eg:var cnDay = calendar.toChinaDay(21) ;//cnMonth='廿一'     */

    toChinaDay: function (d) { //日 => \u65e5

    	var s;        switch (d) {            case 10:

    		s = '\u521d\u5341';                break;            case 20:

    		s = '\u4e8c\u5341';                break;                break;            case 30:

    		s = '\u4e09\u5341';                break;                break;            default :

    		s = calendar.nStr2[Math.floor(d / 10)];

    		s += calendar.nStr1[d % 10];

    	}        return (s);

    },    /**

     * 公历日期转生肖(分界线是“立春”)

     * @param {Number} y - solar year

     * @param {Number} m - solar month

     * @param {Number} d - solar day

     * @return {String} Cn string

     * @eg:var animal = calendar.getAnimal(1987, 2, 4) ;//animal='兔'     */

    getAnimal: function (y, m, d) {        var term = calendar.getTerm(y, 3);//返回当年第三个节气[立春]为公历几日

    	if ((m == 2 && d >= term) || m > 2) {            return calendar.Animals[(y - 4) % 12];

    	}        return calendar.Animals[(y - 5) % 12];

    },    /**

     * 公历日期是否24节气

     * @param {Number} y - solar year

     * @param {Number} m - solar month

     * @param {Number} d - solar day

     * @return {boolean}

     * @eg:var isTerm = calendar.isTerm(1987, 2, 4) ; // isTerm = true     */

    isTerm: function (y, m, d) {        // 当月的两个节气

        var firstNode = calendar.getTerm(y, (m * 2 - 1));//返回当月第一「节气」为几日开始

        var secondNode = calendar.getTerm(y, (m * 2));//返回当月第二「节气」为几日开始

        //传入的日期的节气与否

        var isTerm = false;        if (firstNode == d) {

        	isTerm = true;

        }        if (secondNode == d) {

        	isTerm = true;

        }        return isTerm;

    },    /**

     * 获取公历日期的24节气值

     * @param {Number} y - solar year

     * @param {Number} m - solar month

     * @param {Number} d - solar day

     * @return {String} Cn string

     * @eg:var term = calendar.getShowTerm(1987, 2, 4); // term = '立春'     */

    getShowTerm: function (y, m, d) {        // 当月的两个节气

        var firstNode = calendar.getTerm(y, (m * 2 - 1));//返回当月第一个「节气」为几日开始

        var secondNode = calendar.getTerm(y, (m * 2));//返回当月第二个「节气」为几日开始

        //传入的日期的节气与否

        var term = null;        if (firstNode == d) {

        	term = calendar.solarTerm[m * 2 - 2];

        }        if (secondNode == d) {

        	term = calendar.solarTerm[m * 2 - 1];

        }        return term;

    },    /**

     * 获取指定公历日期是一年中的第几周

     * @param {Number} y - solar year

     * @param {Number} m - solar month

     * @param {Number} d - solar day

     * @return {Number} 第几周     */

    getWeekOfYear: function (y, m, d) {        // 指定日期是一年中的第几天

    	var days = d;        for (var i = 1; i < m; i++) {

    		days += calendar.solarDays(y, i);

        }        // 指定年份的第一天是星期几

        var yearFirstDay = new Date(y, 0, 1).getDay() || 7;        var week = null;        if (yearFirstDay == 1) {

        	week = Math.ceil(days / 7);

        } else {

        	days -= (7 - yearFirstDay + 1);

        	week = Math.ceil(days / 7) + 1;

        }        return week;

    },    /**

     * 传入公历年月日获得详细的公历、农历 JSON object信息

     * @param {Number} y - solar year

     * @param {Number} m - solar month

     * @param {Number} d - solar day

     * @return {JSON} JSON object

     * @eg:console.log(calendar.solar2lunar(1987,11,01));     */

    solar2lunar: function (y, m, d) { //参数区间公历1900.1.31~2100.12.31

        //年份限定

        if (y < 1900 || y > 2100) {            return -1;

        }        //公历传参最下限

        if (y == 1900 && m == 1 && d < 31) {            return -1;

        }        //未传参;获得当天

        var objDate = null;        if (!y) {

        	objDate = new Date();

        } else {

        	objDate = new Date(y, parseInt(m) - 1, d)

        }        var i, leap = 0, temp = 0;        //修正ymd参数

        var y = objDate.getFullYear(),

        m = objDate.getMonth() + 1,

        d = objDate.getDate();        var offset = (Date.UTC(objDate.getFullYear(), objDate.getMonth(), objDate.getDate()) - Date.UTC(1900, 0, 31)) / 86400000;        for (i = 1900; i < 2101 && offset > 0; i++) {

        	temp = calendar.lYearDays(i);

        	offset -= temp;

        }        if (offset < 0) {

        	offset += temp;

        	i--;

        }        //是否今天

        var isTodayObj = new Date(),

        isToday = false;        if (isTodayObj.getFullYear() == y && isTodayObj.getMonth() + 1 == m && isTodayObj.getDate() == d) {

        	isToday = true;

        }        //星期几

        var nWeek = objDate.getDay(),

            cWeek = calendar.nStr1[nWeek];        //数字表示周几顺应天朝周一开始的惯例

            if (nWeek == 0) {

            	nWeek = 7;

        }        //农历年

        var year = i;        var leap = calendar.leapMonth(i); //闰哪个月

        var isLeap = false;        //效验闰月

        for (i = 1; i < 13 && offset > 0; i++) {            //闰月

        	if (leap > 0 && i == (leap + 1) && isLeap == false) {                --i;

        		isLeap = true;

                temp = calendar.leapDays(year); //计算农历闰月天数

            } else {

                temp = calendar.monthDays(year, i);//计算农历普通月天数       
                     }            //解除闰月

                     if (isLeap == true && i == (leap + 1)) {

                     	isLeap = false;

                     }

                     offset -= temp;

        }        // 闰月导致数组下标重叠取反

        if (offset == 0 && leap > 0 && i == leap + 1) {            if (isLeap) {

        	isLeap = false;

        } else {

        	isLeap = true;                --i;

        }

    }        if (offset < 0) {

    	offset += temp;            --i;

        }        //农历月

        var month = i;        //农历日

        var day = offset + 1;        //天干地支处理

        var gzY = calendar.toGanZhiYear(year);        // 当月的第一个节气

        var firstNode = calendar.getTerm(y, (m * 2 - 1));//返回当月第一个「节气」为几日开始

        // 依据12节气修正干支月

        var gzM = calendar.toGanZhi((y - 1900) * 12 + m + 11);        if (d >= firstNode) {

        	gzM = calendar.toGanZhi((y - 1900) * 12 + m + 12);

        }        // 指定日期与 1900/1/1 相差天数

        var dayCyclical = Date.UTC(y, m - 1, d, 0, 0, 0, 0) / 86400000 + 25567 + 10;        var gzD = calendar.toGanZhi(dayCyclical);        //该日期所属的星座

        var astro = calendar.toAstro(m, d);        //中国法定节假日

        var vacation = null;        var month_day = (month > 9 ? "" + month : "0" + month) + (day > 9 ? "" + day : "0" + day);        var m_d = (m > 9 ? "" + m : "0" + m) + (d > 9 ? "" + d : "0" + d);        var vacation_temp = calendar.nStr5[month_day] || calendar.nStr4[m_d];        if (vacation_temp) {

        	vacation = vacation_temp;

        }        return {            'lYear': year,            'lMonth': month,            'lDay': day,            'Animal': calendar.getAnimal(y, m, d),            'IMonthCn': (isLeap ? "\u95f0" : '') + calendar.toChinaMonth(month),            'IDayCn': calendar.toChinaDay(day),            'cYear': y,            'cMonth': m,            'cDay': d,            'gzYear': gzY,            'gzMonth': gzM,            'gzDay': gzD,            'isToday': isToday,            'isLeap': isLeap,            'nWeek': nWeek,            'ncWeek': "\u661f\u671f" + cWeek,            'weekOfYear': "\u7b2c" + calendar.getWeekOfYear(y, m, d) + "\u5468",            'isTerm': calendar.isTerm(y, m, d),            'Term': calendar.getShowTerm(y, m, d),            'astro': astro,            'vacation': vacation

    };

}, 
     /**

     * 传入农历年月日以及传入的月份是否闰月获得详细的公历、农历 JSON object信息

     * @param {Number} y - lunar year

     * @param {Number} m - lunar month

     * @param {Number} [d] - lunar day

     * @param {Boolean} [isLeapMonth] - lunar month is leap or not,如果是农历闰月赋值true即可.

     * @return {JSON} JSON object

     * @eg:console.log(calendar.lunar2solar(1987,9,10));     */

    lunar2solar: function (y, m, d, isLeapMonth) { //参数区间农历1900.1.1~2100.12.1

        //年份限定

        if (y < 1900 || y > 2100) {            return -1;

        }        //农历传参最上限

        if (y == 2100 && m == 12 && d > 1) {            return -1;

        }        var isLeapMonth = !!isLeapMonth;        var leapMonth = calendar.leapMonth(y);        if (isLeapMonth && (leapMonth != m)) { // 计算得出的闰月与传参的月份不同

        	return -1;

        }        var day = calendar.monthDays(y, m);        var _day = day;        if (isLeapMonth) {

        	_day = calendar.leapDays(y, m);

        }        if (d > _day) { // 传参的日期大于计算得出的农历当月的天数

        	return -1;

        }        //计算传入时间相对于农历1900年正月初一的时间差

        var offset = 0;        for (var i = 1900; i < y; i++) {

        	offset += calendar.lYearDays(i);

        }        for (var i = 1; i < m; i++) {            if (i == leapMonth) { //处理闰月

        	offset += calendar.leapDays(y);

        }

        offset += calendar.monthDays(y, i);

        }        //如果是闰月，需补充该年闰月的前一个月的时差

        if (isLeapMonth) {

        	offset += day;

        }        // 农历1900年正月初一的公历时间为1900年1月30日0时0分0秒(该时间也是本农历的最开始起始点)

        var stmap = Date.UTC(1900, 0, 30, 0, 0, 0);        var calObj = new Date((offset + d) * 86400000 + stmap);        var cY = calObj.getUTCFullYear();        var cM = calObj.getUTCMonth() + 1;        var cD = calObj.getUTCDate();        return calendar.solar2lunar(cY, cM, cD);

    }
    

};

function findArray(array,year,month,day)
{
	var a=0,b=0;c=0;
	for(a=0;a<array.data.length;a++)
	{
		if(array.data[a].year == year)
		{
			for(b=0;b<array.data[a].month.length;b++)
			{
				if(array.data[a].month[b].m == month)
				{
					for(c=0;c<array.data[a].month[b].day.length;c++)
					{
						if(array.data[a].month[b].day[c] == day)
							return 1;
					}
				}
			}
			
		}
	}
	return 0;
}

function getJiaQi(year,month,day)
{
	var tmp = ''+year+''+month+''+day;
	//console.log(tmp);
	var ret = 0;
	var val = 0;

	var sleep = {"data":[{"year":2018,"month":[{"m":12,"day":[30,31]}]},{"year":2019,"month":[{"m":1,"day":[1]},{"m":2,"day":[4,5,6,7,8,9,10]},{"m":4,"day":[5,6,7]},{"m":5,"day":[1,2,3,4]},{"m":6,"day":[7,8,9]},{"m":9,"day":[13,14,15]},{"m":10,"day":[1,2,3,4,5,6,7]}]}]};
	
	var work = {"data":[{"year":2018,"month":[{"m":12,"day":[29]}]},{"year":2019,"month":[{"m":2,"day":[2,3]},{"m":4,"day":[28]},{"m":5,"day":[5]},{"m":9,"day":[29]},{"m":10,"day":[12]}]}]};


	ret = findArray(sleep,year,month,day);
	val = findArray(work,year,month,day);
	if(val == 1)
		ret = 2;

	//console.log(ret);
	
	return ret;
}


function is_leap(year) {
	return (year%100==0?res=(year%400==0?1:0):res=(year%4==0?1:0));
}
function get_month_days(year,month) {
	var m_days=new Array(31,28+is_leap(year),31,30,31,30,31,31,30,31,30,31); //各月份的总天数
	return m_days[month];
} 


function drawRili(year,month,day)
{
	var today=new Date();
	var today_year = today.getFullYear();
	var today_month = today.getMonth();
	var today_day = today.getDate();
	console.log(today);
	//var cur_time = ' '+today.getHours()+':'+today.getMinutes()+':'+(today.getSeconds()+1);
	var t_day = ''+year+'-'+(month+1)+'-'+day;

	var t_day1 = new Date(t_day.replace(/\-/g,"\/"));
	console.log(t_day1);

	var days = today.getTime() - t_day1.getTime();
	console.log(days);
	var time = parseInt(days / (1000 * 60 * 60 * 24));
	console.log(time);
	var m_day_text = "";
	if(days<0){
		time-=1;
	}
	if(time<0){
		time = 0-time;
		switch(time){
			case 1:
            m_day_text +="明天";
            break;
            case 2:
            m_day_text +="后天";
            break;
            case 3:
            m_day_text +="大后天";
            break;
            default:
            if(today_day == day)
            {
               if(today_year==year)
               {
                  m_day_text = (month-today_month)+"个月后";
              }
              else{
                  if(month == today_month)
                     m_day_text = (year-today_year)+"年后";
                 else{
                     var t_year = (year-today_year);
                     if(month<today_month)
                     {
                        t_year -=1;
                    }
                    if(t_year>0)
                    {
                        var t_month = 0; 
                        if(month>today_month){
                           t_month = month-today_month;
                       }
                       else{
                           t_month = (month+12-today_month);
                       }
                       m_day_text = t_year+"年零"+t_month+"个月后";
                   }
                   else
                    m_day_text = (month+12-today_month)+"个月后";

            }
        }
    }
    else if(time%7==0)
    {
       m_day_text = ""+(time/7)+"周后";
   }
   else{
       m_day_text=""+(time)+"天后";
   }
   break;

}

}
else if(time>0){
  switch(time){
     case 1:
     m_day_text +="昨天";
     break;
     case 2:
     m_day_text +="前天";
     break;
     default:
     if(time%7==0)
     {
       m_day_text = ""+(time/7)+"周前";
   }
   else{
       m_day_text=""+(time)+"天前";
   }
   break;

}
}
else{
  m_day_text="今天";
}


$("#m_moth").html((month+1)+"月");
$("#m_day").html(m_day_text);
$("#m_year").html(year+"年");

$("#m_day").attr("value",day);
$("#m_moth").attr("value",month);
$("#m_year").attr("value",year);

var today=new Date();
var today_year = today.getFullYear();
var today_month = today.getMonth();
var today_day = today.getDate();

	var n1str=new Date(year,month,1); //当月第一天Date资讯
	var firstday=n1str.getDay(); //当月第一天星期几
	var tr_str=Math.ceil((get_month_days(year,month) + firstday)/7); //表格所需要行数

	var prev_month_days = 0;
	var cur_month = month;
	var cur_year = year;
	var cur_day = day;
	if(month == 0)
	{
		prev_month_days =get_month_days(year-1,11);
	}
	else
	{
		prev_month_days = get_month_days(year,month-1);
	}
	var no_month_day_flag = 0;
	var str = 0;
 for(i=0;i<tr_str;i++)
 {
   str+="<tr>";
   for(k=0;k<7;k++) 
		{ //表格每行的单元格
			idx=i*7+k; //单元格自然序列号
            cur_day=idx-firstday+1; //计算日期

            if(cur_day<=0)
            {
            	cur_day +=prev_month_days;
            	cur_month = month-1;
            	if(cur_month==-1){
            		cur_month = 11;
            		cur_year = year-1;
            	}
            	no_month_day_flag = 1;

            }
            else if(cur_day>get_month_days(year,month))
            {
            	cur_day -=get_month_days(year,month);
            	cur_month = month+1;
            	if(cur_month==12){
            		cur_month = 0;
            		cur_year = year+1;
            	}
            	no_month_day_flag = 1;

            }else{
            	cur_month = month;
            	cur_year = year;
            	no_month_day_flag = 0;
            }
            var today_flag = 0;
            str +="<td align='center' year='"+cur_year+"'  month='"+cur_month+"'";
            if((cur_day == today_day)&&(cur_month == today_month)&&(cur_year == today_year))
            {
            	str += "class='today'";
            	today_flag = 1;
            }
            else if((cur_day == day)&&(cur_month == month)&&(cur_year == year))
            {
            	str +="class='select_day'";
            	today_flag = 0;
            }
            else{
            	str +="class='td_default'";
            	today_flag = 0;
            }

            if(no_month_day_flag == 1)
            {
            	str+="style='color:#cccccc;'";
            }
            else
            {
            	if(k==0||k==6){
            	//	str+="style='color:#ff0000;'";
            }
        }
        var jia = getJiaQi(cur_year,cur_month+1,cur_day);

        str += ("><i>" + cur_day +"</i>" );
        if(jia==1)
        {
           str+='<span class="jiaqi">休</span>';	
       }
       else if(jia == 2)
       {
           str+='<span class="work">班</span>';
       }
       var nl = calendar.solar2lunar(cur_year,cur_month+1,cur_day);
       var jieqi = nl.vacation;
       if(!jieqi)
           jieqi = nl.Term;
            //console.log(nl);
           // console.log(cur_year+'-'+(cur_month+1)+'-'+cur_day);
           if(jieqi)	
               str+=("<em class='jieqi'>"+jieqi+"</em>");
           else{
               if(today_flag==1)
                  str +=("<em style='color:#fff'>"+nl.IDayCn+"</em>");
              else
                  str +=("<em>"+nl.IDayCn+"</em>");
          }
          str+="</td>";

      }
      str+="</tr>";
  }
  $("#rili").find("table").html(str);

  $("#rili").find("table").find("td").click(function(){
      var year = Number($(this).attr("year"));
      var month = Number($(this).attr("month"));
      console.log(month);
      var day = Number($(this).children("i").text());
      drawRili(year,month,day);
  });
  var str1 = new String($("#m_day").text());
  console.log($("#m_day").text());
  if(str1.indexOf("今天") ==0)
  {
      console.log("1");
      $("#ret_jt").hide();
  }
  else{
      $("#ret_jt").show();
      console.log("0");
  }
	//$("#rili").show(1000);

}
$(function(){ 
	var bindSwipeEvent = function (dom,leftCallback,rightCallback) {
		var isMove = false;
		var startX = 0;
		var distanceX = 0;
		dom.addEventListener('touchstart',function (e) {
			startX = e.touches[0].clientX;
		});
		dom.addEventListener('touchmove',function (e) {
			isMove = true;
			var moveX = e.touches[0].clientX;
			distanceX = moveX - startX;
		});
		dom.addEventListener('touchend',function (e) {
			if(isMove && Math.abs(distanceX) > 50){
				if(distanceX > 0){
					rightCallback && rightCallback.call(this,e);
				}else{
					leftCallback && leftCallback.call(this,e);
				}
			}
			isMove = false;
			startX = 0;
			distanceX = 0;
		});
	}
	bindSwipeEvent(document.querySelector('#rili'),function (e) {
		var year = Number($("#m_year").attr("value"));
		var month = Number($("#m_moth").attr("value"));
		var day = Number($("#m_day").attr("value"));
		//console.log(year+"-"+month+"="+day);
		month = Number(month)+1;
		if(month==12){
			month = 0;
			year +=1;
		}
		var m_day = get_month_days(year,month)
		if(day>m_day)
			day = m_day;
		drawRili(year,month,day);
		console.log(' 左滑手势');
	},function (e) {
		var year = Number($("#m_year").attr("value"));
		var month = Number($("#m_moth").attr("value"));
		var day = Number($("#m_day").attr("value"));
		//console.log(year+"-"+month+"="+day);
		month -=1;
		if(month<0){
			month = 11;
			year -=1;
		}
		var m_day = get_month_days(year,month)
		if(day>m_day)
			day = m_day;
		drawRili(year,month,day);
		console.log('右滑手势');
	});
	//$("#rili").hide();
	var today=new Date();
	var today_year = today.getFullYear();
	var today_month = today.getMonth();
	var today_day = today.getDate();
	drawRili(today_year,today_month,today_day);


	$("#ret_jt").click(function(){
		drawRili(today_year,today_month,today_day);
	});
});

$(function(){
    var Base64 = 
    {
    // private property
    _keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=", // public method for encoding
    encode : function (input) 
    {
        var output = "";
        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        var i = 0;
        input = Base64._utf8_encode(input);
        while (i < input.length) 
        {
            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);
            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;
            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            }
            else if (isNaN(chr3)) {
                enc4 = 64;
            }
            output = output + this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) + this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
        }
        return output;
    },
    // public method for decoding
    decode : function (input) 
    {
        var output = "";
        var chr1, chr2, chr3;
        var enc1, enc2, enc3, enc4;
        var i = 0;
        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
        while (i < input.length) 
        {
            enc1 = this._keyStr.indexOf(input.charAt(i++));
            enc2 = this._keyStr.indexOf(input.charAt(i++));
            enc3 = this._keyStr.indexOf(input.charAt(i++));
            enc4 = this._keyStr.indexOf(input.charAt(i++));
            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;
            output = output + String.fromCharCode(chr1);
            if (enc3 != 64) {
                output = output + String.fromCharCode(chr2);
            }
            if (enc4 != 64) {
                output = output + String.fromCharCode(chr3);
            }
        }
        output = Base64._utf8_decode(output);
        return output;
    },
    // private method for UTF-8 encoding
    _utf8_encode : function (string) 
    {
        string = string.replace(/\r\n/g, "\n");
        var utftext = "";
        for (var n = 0; n < string.length; n++) 
        {
            var c = string.charCodeAt(n);
            if (c < 128) {
                utftext += String.fromCharCode(c);
            }
            else if ((c > 127) && (c < 2048)) 
            {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            }
            else 
            {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }
        }
        return utftext;
    },
    // private method for UTF-8 decoding
    _utf8_decode : function (utftext) 
    {
        var string = "";
        var i = 0;
        var c = c1 = c2 = 0;
        while (i < utftext.length) 
        {
            c = utftext.charCodeAt(i);
            if (c < 128) {
                string += String.fromCharCode(c);
                i++;
            }
            else if ((c > 191) && (c < 224)) 
            {
                c2 = utftext.charCodeAt(i + 1);
                string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                i += 2;
            }
            else 
            {
                c2 = utftext.charCodeAt(i + 1);
                c3 = utftext.charCodeAt(i + 2);
                string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                i += 3;
            }
        }
        return string;
    }
}

});


jQuery.support.cors = true;
$(function() {
    var htmlobj=$.ajax({url:"http://blog.flipped205.top/rili.data",async:false});
    console.log(htmlobj.responseText);

/*


    $.ajax({
        xhrFields: {
            withCredentials: true
        },
        beforeSend: function(xhr) {
            xhr.setRequestHeader('Authorization', 'Basic ZmxpcHBlZDIwNUBzaW5hLmNvbTpmeDMyNjQ5NDY=');
        },
        crossDomain:true,
        url: "https://api.github.com/repos/Flipped205/flipped205.github.io/contents/rili.data",
        type: "PUT",
        dataType: "json",
        contentType: 'application/x-www-form-urlencoded',
        data: JSON.stringify({
            "message": "my commit message",
            "committer": {
                "name": "flipped205",
                "email": "flipped205@sina.com"
            },
            "content": "bXklMjB1cGRhdGVkJTIwZmlsZSUyMGNvbnRlbnRzJTIwdGVzdA==",
            "sha": "e69de29bb2d1d6434b8b29ae775ad8c2e48c5391"
        }),
        success: function(result) {
            alert("发送成功!");
        },
        error: function() {
            alert("数据发送失败!");
        }
    });*/
});


$(function(){
    $.ajax({
        url:"https://api.github.com/users",
        type: "GET",
        success: function(result){
            console.log(result);
        }

    })

})

