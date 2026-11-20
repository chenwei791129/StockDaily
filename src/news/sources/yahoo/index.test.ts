import { expect, spyOn, test } from 'bun:test'
import { yahooStock } from '.'

const LINK = 'https://tw.stock.yahoo.com/news/test.html'
const DATE = 'Fri, 20 Nov 2026 06:18:40 GMT'
const rss = (...items: [string, string, string][]) => `<rss><channel>${items.map(([title, link, date]) => `
  <item><title>${title}</title><link>${link}</link><pubDate>${date}</pubDate></item>
`).join('')}</channel></rss>`

test('Yahoo stock news fetches RSS and returns only usable articles', async () => {
  const signal = new AbortController().signal
  const fetchSpy = spyOn(globalThis, 'fetch').mockResolvedValue(new Response(rss(
    ['台股 &amp; 美股', LINK, DATE],
    ['外站', 'https://example.com/news/test.html', DATE],
    ['壞日期', LINK, 'invalid'],
    ['', LINK, DATE],
  )))
  try {
    expect(await yahooStock.fetch(signal)).toEqual([
      { title: '台股 & 美股', link: LINK, published: Date.UTC(2026, 10, 20, 6, 18, 40) },
    ])
    expect(fetchSpy).toHaveBeenCalledWith('https://tw.stock.yahoo.com/rss', { signal })

    fetchSpy.mockResolvedValue(new Response(rss(['壞日期', LINK, 'invalid'])))
    await expect(yahooStock.fetch(signal)).rejects.toThrow('no usable items')

    fetchSpy.mockResolvedValue(new Response('', { status: 503 }))
    await expect(yahooStock.fetch(signal)).rejects.toThrow('responded 503')
  } finally {
    fetchSpy.mockRestore()
  }
})
