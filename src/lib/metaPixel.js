let pixelInitialized = false

function getPixelId() {
  return import.meta.env.VITE_META_PIXEL_ID || ''
}

function shouldEnablePixel() {
  const forceEnable = (import.meta.env.VITE_ENABLE_META_PIXEL || '').toLowerCase() === 'true'
  return import.meta.env.PROD || forceEnable
}

function canUseBrowser() {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

export function initMetaPixel() {
  if (!canUseBrowser() || pixelInitialized) return
  if (!shouldEnablePixel()) return

  const pixelId = getPixelId()
  if (!pixelId) return

  !(function (f, b, e, v, n, t, s) {
    if (f.fbq) return
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments)
    }
    if (!f._fbq) f._fbq = n
    n.push = n
    n.loaded = true
    n.version = '2.0'
    n.queue = []
    t = b.createElement(e)
    t.async = true
    t.src = v
    s = b.getElementsByTagName(e)[0]
    s.parentNode.insertBefore(t, s)
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js')

  window.fbq('init', pixelId)
  pixelInitialized = true
}

export function trackPageView(pathname = '') {
  initMetaPixel()
  if (!canUseBrowser() || !window.fbq) return
  window.fbq('track', 'PageView', {path: pathname})
}

export function trackLead(data = {}) {
  initMetaPixel()
  if (!canUseBrowser() || !window.fbq) return
  window.fbq('track', 'Lead', data)
}

export function trackPurchase(data = {}) {
  initMetaPixel()
  if (!canUseBrowser() || !window.fbq) return
  window.fbq('track', 'Purchase', data)
}
