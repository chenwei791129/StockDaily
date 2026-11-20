import { rssItems, tag } from '../../rss'
import type { NewsSource } from '../../source'

const RSS_URL = 'https://tw.stock.yahoo.com/rss'
const ARTICLE_PREFIX = 'https://tw.stock.yahoo.com/news/'

export const yahooStock: NewsSource = {
  id: 'yahoo-stock',
  async fetch(signal) {
    const res = await fetch(RSS_URL, { signal })
    if (!res.ok) throw new Error(`Yahoo 股市 RSS responded ${res.status}`)
    const items = rssItems(await res.text())
      .map((item) => ({
        title: tag(item, 'title'),
        link: tag(item, 'link'),
        published: Date.parse(tag(item, 'pubDate')),
      }))
      .filter((item) => item.title && item.link.startsWith(ARTICLE_PREFIX) && Number.isFinite(item.published))
    if (!items.length) throw new Error('Yahoo 股市 RSS has no usable items')
    return items
  },
}
