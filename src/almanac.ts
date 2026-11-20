import { LunarUtil, Solar } from 'lunar-typescript'
import { JI_STOCK, NONE, YI_JI_STOCK } from './yiji'

// lunar-typescript outputs Simplified; these are the only differing chars in the fields we display.
const S2T: Record<string, string> = {
  腊: '臘', 闰: '閏', 龙: '龍', 马: '馬', 鸡: '雞', 猪: '豬', 东: '東',
  满: '滿', 执: '執', 开: '開', 闭: '閉',
}
const t = (s: string) => s.replace(/./g, (c) => S2T[c] ?? c)

// Trading fortunes per 建除十二神; one is picked per date.
export const ZHI_XING_FORTUNE: Record<string, string[]> = {
  建: [
    '自選股的第一欄，留給你說得出靠什麼賺錢的公司。',
    '建倉只要一張單，寫清楚買進理由要久一點。',
    '翻開交易日誌，第一筆先記下本金。',
    '買股票之前，先想想有什麼消息會讓你改觀。',
    '畫第一條趨勢線之前，先看圖上的時間刻度。',
  ],
  除: [
    '除息不是打折，股息也要一起算進報酬。',
    '刪掉一檔自選股，不必特地買另一檔補位。',
    '清掉去年的獲利預估，再看今年的本益比。',
    '成交價差扣掉手續費，才知道這一趟忙了什麼。',
    '選股清單太長，先劃掉已經忘記為何入選的公司。',
  ],
  满: [
    '看盤畫面滿江紅，持股報酬還是得看成本。',
    '掛單排滿五檔，不代表輪到你時還在。',
    '行事曆排滿法說會，留點時間讀會後問答。',
    '營收創新高，別忘了翻到毛利率那一頁。',
    '自選股滿了一頁，不等於投資組合已經分散。',
  ],
  平: [
    '收在當日平盤價，盤中走過的路可不一定平。',
    '股價橫著走，交易日誌也可以寫「今天沒下單」。',
    '帳面打平了嗎？把買賣兩邊的費用都算進來。',
    '大盤平盤，不代表每一檔股票都沒動。',
    '比較兩檔股票的報酬，起算日要放在同一天。',
  ],
  定: [
    '定期定額之前，先對一下扣款日和發薪日。',
    '定好比較基準，別等輸贏揭曉才挑指數。',
    '限價單定的是價格，不是成交的保證。',
    '設定股價提醒，也替自己留一段不看盤的時間。',
    '定好部位上限，就不必靠開盤時的膽量決定股數。',
  ],
  执: [
    '看法可以堅定，財報出了還是要讀。',
    '下單前多看一眼：是買還是賣，是整張還是零股？',
    '成交回報比記憶可靠，尤其是那筆買在最低點的。',
    '當初寫下的買進理由，今天還有幾條成立？',
    '聽到明牌先找公告，轉傳次數不算證據。',
  ],
  破: [
    '突破前高的那根線，配著成交量一起看。',
    '新聞寫「破紀錄」，先看看比的是上個月還是去年。',
    '股價破底和公司破產，是兩件不同的事。',
    '虧損打破紀錄那天，也值得留一頁筆記。',
    '打破自己的交易規則前，先重讀當初訂它的原因。',
  ],
  危: [
    '槓桿會放大損益，乘號不挑正負。',
    '買了五檔同產業的股票，遇到的可能還是同一個風險。',
    '成交量稀薄時，報價和賣得掉的價格可能很遠。',
    '聽到「穩賺」兩個字，先問風險是誰扛。',
    '翻開資產負債表，看看哪筆債最早到期。',
  ],
  成: [
    '成交不是句點，交割日還在後面。',
    '成交單留著，月底對帳就不用猜。',
    '成交量放大時，買賣兩邊其實都有人。',
    '獲利的一筆交易，也值得問問哪些是運氣。',
    '完成年度績效表，別漏了已經賣掉的那幾檔。',
  ],
  收: [
    '收盤之後，才知道今天的日 K 線長什麼樣子。',
    '股息入帳那天，記得和對帳單打個勾。',
    '月營收的數字出來了，先和去年同月比一比。',
    '盤後筆記留兩欄：市場怎麼走，你怎麼做。',
    '帳上獲利和已經落袋的錢，記在不同欄。',
  ],
  开: [
    '開盤鐘響，不是催你按下單鍵的鬧鐘。',
    '打開財報，別只停在封面那張獲獎照。',
    '開高是跟當日平盤價比，不是跟你的成本比。',
    '開戶時的費率，值得和最近的成交單對一次。',
    '打開法說會簡報，找找管理層上次說過的那個數字。',
  ],
  闭: [
    '關掉報價畫面，公司的生意還在做。',
    '休市也能做功課，一份年報不會因為沒開盤就過期。',
    '關掉群組通知，再讀一次那則重大訊息。',
    '合上交易日誌前，留一句話給下次想追價的自己。',
    '不看盤的一天，也算得進長期投資。',
  ],
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

// Deterministic per (date, term): same day -> same pick for everyone.
function pick<T>(items: T[], seed: string): T {
  let h = 5381
  for (const c of seed) h = ((h * 33) ^ c.codePointAt(0)!) >>> 0
  return items[h % items.length]
}

function toStockActivities(terms: string[], dateKey: string, phrases: Record<string, string[]>): string[] {
  const out = terms
    .filter((term) => term !== NONE)
    .map((term) => {
      const options = phrases[term]
      return options ? pick(options, `${dateKey}:${term}`) : t(term)
    })
  return [...new Set(out)]
}

// Ages (lunar year minus birth year, 1..100) of people born in a year with the given 干支.
function agesForGanZhi(ganZhi: string, lunarYear: number): number[] {
  const idx = LunarUtil.JIA_ZI.indexOf(ganZhi)
  const age = (((lunarYear - 4 - idx) % 60) + 60) % 60 // year 4 AD is 甲子
  return [age, age + 60].filter((a) => a >= 1 && a <= 100)
}

export interface Almanac {
  month: number
  day: number
  weekday: string
  lunarText: string
  fortune: string
  godDirection: string
  luckyHours: string[]
  chong: string
  sha: string
  yi: string[]
  ji: string[]
}

export function getAlmanac(date: Date): Almanac {
  const solar = Solar.fromYmd(date.getFullYear(), date.getMonth() + 1, date.getDate())
  const lunar = solar.getLunar()
  const dateKey = solar.toYmd()

  const chongGanZhi = lunar.getDayChongGan() + lunar.getDayChong()
  const chongShengXiao = t(lunar.getDayChongShengXiao())
  const chong = agesForGanZhi(chongGanZhi, lunar.getYear())
    .map((age) => `屬${chongShengXiao}(${chongGanZhi}，${age}歲)`)
    .join('、')

  // getTimes()[12] is the late 子 hour, which belongs to the next day.
  const luckyHours = lunar
    .getTimes()
    .slice(0, 12)
    .filter((time) => time.getTianShenLuck() === '吉')
    .map((time) => time.getZhi())
  const yi = toStockActivities(lunar.getDayYi(), dateKey, YI_JI_STOCK)

  return {
    month: solar.getMonth(),
    day: solar.getDay(),
    weekday: `星期${WEEKDAYS[solar.getWeek()]}`,
    lunarText: `農曆${lunar.getYearInGanZhi()}年 ${t(lunar.getMonthInChinese())}月${lunar.getDayInChinese()}`,
    fortune: pick(ZHI_XING_FORTUNE[lunar.getZhiXing()], `${dateKey}:fortune`),
    // NBSP keeps each god and direction on one line.
    godDirection: t(
      `多方神\u00a0${lunar.getDayPositionXiDesc()}・空方神\u00a0${lunar.getDayPositionFuDesc()}`,
    ),
    luckyHours,
    chong,
    sha: t(lunar.getDaySha()),
    yi,
    // Different terms may map to the same trading phrase; never show it as both "宜" and "忌".
    ji: toStockActivities(lunar.getDayJi(), dateKey, JI_STOCK).filter((item) => !yi.includes(item)),
  }
}
