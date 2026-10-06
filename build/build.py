import re, urllib.parse, json
import os
B = os.path.dirname(os.path.abspath(__file__)) + '/'
OUT = os.path.join(B, '..', 'public', 'invite.html')
THEMES = ['porcelain', 'lubugo', 'emerald', 'vellum', 'royal']
rd = lambda p: open(B + p).read()
def uri(svg): return "data:image/svg+xml," + urllib.parse.quote(svg, safe="=/:' ")
SUBS = {
 '__BARK_DARK__': uri("<svg xmlns='http://www.w3.org/2000/svg' width='420' height='420'><filter id='f'><feTurbulence type='fractalNoise' baseFrequency='0.004 0.09' numOctaves='4' seed='4' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .16 0 0 0 0 .07 0 0 0 0 .03 0 0 0 1.2 -.4'/></filter><rect width='420' height='420' filter='url(#f)'/></svg>"),
 '__BARK_LIGHT__': uri("<svg xmlns='http://www.w3.org/2000/svg' width='420' height='420'><filter id='f'><feTurbulence type='fractalNoise' baseFrequency='0.006 0.45' numOctaves='3' seed='9' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .95 0 0 0 0 .72 0 0 0 0 .5 0 0 0 1.5 -.9'/></filter><rect width='420' height='420' filter='url(#f)'/></svg>"),
 '__ZIGZAG__': uri("<svg xmlns='http://www.w3.org/2000/svg' width='24' height='12'><path d='M0 12 L6 1 L12 12Z' fill='#A8802F'/><path d='M13.5 11 L18 3 L22.5 11Z' fill='none' stroke='#A8802F' stroke-width='1'/></svg>"),
 '__VELVET__': uri("<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .9 0 0 0 0 .95 0 0 0 0 .9 0 0 0 .06 0'/></filter><rect width='200' height='200' filter='url(#n)'/></svg>"),
 '__DAMASK__': uri("<svg xmlns='http://www.w3.org/2000/svg' width='56' height='56'><g fill='none' stroke='#E6C97A' stroke-opacity='.13' stroke-width='1'><path d='M28 6 L40 28 L28 50 L16 28Z'/><path d='M28 16 L34 28 L28 40 L22 28Z'/></g><g fill='#E6C97A' fill-opacity='.14'><circle cx='0' cy='0' r='2'/><circle cx='56' cy='0' r='2'/><circle cx='0' cy='56' r='2'/><circle cx='56' cy='56' r='2'/></g></svg>"),
}
PIN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/></svg>'

def split_blocks(css):
    out, i, n = [], 0, len(css)
    while i < n:
        j = css.find('{', i)
        if j < 0: break
        head = css[i:j].strip(); depth, k = 1, j + 1
        while depth and k < n:
            if css[k] == '{': depth += 1
            elif css[k] == '}': depth -= 1
            k += 1
        out.append((head, css[j+1:k-1])); i = k
    return out

def scope(css, cls):
    res = []
    for head, body in split_blocks(css):
        if head.startswith('@keyframes'): res.append(f'{head}{{{body}}}')
        elif head.startswith('@media') or head.startswith('@supports'): res.append(f'{head}{{{scope(body, cls)}}}')
        else:
            sels = []
            for s in head.split(','):
                s = s.strip()
                if s.startswith(':root'): sels.append('body.' + cls + re.sub(r'^:root(:not\([^)]*\)|\[[^\]]*\])*', '', s))
                else: sels.append(f'body.{cls} {s}')
            res.append(','.join(sels) + '{' + body + '}')
    return '\n'.join(res)

css_all, tpls, js_all, fonts = [], [], [], {}
for t in THEMES:
    css = rd(f'themes/{t}/theme.css')
    for k, v in SUBS.items(): css = css.replace(k, v)
    for name in set(re.findall(r'@keyframes\s+([\w-]+)', css)):
        css = re.sub(r'(?<![\w-])' + re.escape(name) + r'(?![\w-])', f'{name}-{t}', css)
    css_all.append(scope(css, 't-' + t))
    tpls.append(f'<template id="deco-{t}">\n{rd(f"themes/{t}/deco.html")}</template>\n<template id="gate-{t}">\n{rd(f"themes/{t}/gate.html")}</template>')
    js_all.append(rd(f'themes/{t}/theme.js'))
    fonts[t] = rd(f'themes/{t}/fonts.txt').strip()

html = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>You’re invited</title>
<meta name="description" content="Tap to open your invitation.">
<meta property="og:type" content="website">
<meta property="og:site_name" content="RibbonInvites">
<meta property="og:title" content="You’re invited">
<meta property="og:description" content="Tap to open your personal invitation.">
<meta property="og:image" content="https://ribboninvites.com/img/og-invite.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="robots" content="noindex">
<meta name="theme-color" content="#1a1412">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<style>
{rd('invite/core.css')}
{chr(10).join(css_all)}
</style>
</head>
<body>
<main class="frame" id="frame">
  <div class="loader" id="loader" aria-label="Loading your invitation"><img src="/img/logo-mark.svg" alt=""></div>
  <div class="inside" aria-live="polite">
{rd('invite/pages.html').replace('__PIN__', PIN)}  </div>
</main>
{chr(10).join(tpls)}
<script>window.THEMES = {{}}; const FONTS = {json.dumps(fonts)};</script>
<script>
{chr(10).join(js_all)}
</script>
<script src="/vendor/qrcode.min.js" defer></script>
<script>
{rd('invite/runtime.js')}
</script>
</body>
</html>
'''
open(OUT, 'w').write(html)
print('invite.html', len(html))
