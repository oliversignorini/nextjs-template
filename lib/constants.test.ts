import { APP_NAME, NAVIGATION_ITEMS, SIDEBAR_ITEMS, FOOTER_LINKS } from './constants'

describe('APP_NAME', () => {
  it('is "App Template"', () => {
    expect(APP_NAME).toBe('App Template')
  })
})

describe('NAVIGATION_ITEMS', () => {
  it('has 3 items', () => {
    expect(NAVIGATION_ITEMS).toHaveLength(3)
  })

  it('contains Home, Guide, and Dashboard', () => {
    const labels = NAVIGATION_ITEMS.map((item) => item.label)
    expect(labels).toEqual(['Home', 'Guide', 'Dashboard'])
  })

  it('each item has a label and href', () => {
    for (const item of NAVIGATION_ITEMS) {
      expect(item.label).toBeTruthy()
      expect(item.href).toBeTruthy()
    }
  })
})

describe('SIDEBAR_ITEMS', () => {
  it('has 4 items', () => {
    expect(SIDEBAR_ITEMS).toHaveLength(4)
  })

  it('each item has an icon', () => {
    for (const item of SIDEBAR_ITEMS) {
      expect(item.icon).toBeDefined()
    }
  })

  it('contains expected labels', () => {
    const labels = SIDEBAR_ITEMS.map((item) => item.label)
    expect(labels).toEqual(['Dashboard', 'Trips', 'Destinations', 'Settings'])
  })
})

describe('FOOTER_LINKS', () => {
  it('has 2 links', () => {
    expect(FOOTER_LINKS).toHaveLength(2)
  })

  it('all links have label and href', () => {
    for (const link of FOOTER_LINKS) {
      expect(link.label).toBeTruthy()
      expect(link.href).toBeTruthy()
    }
  })

  it('contains Guide and Dashboard links', () => {
    const labels = FOOTER_LINKS.map((l) => l.label)
    expect(labels).toEqual(['Guide', 'Dashboard'])
  })
})
