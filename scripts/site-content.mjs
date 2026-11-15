// SPDX-License-Identifier: AGPL-3.0-only
export const siteTitle = '西方哲学思想脉络图 · 西方哲学史地图 | Western Philosophy Map'
export const siteDescription = '用交互式西方哲学史地图梳理思想脉络：搜索哲学家，探索哲学流派、主要思想与传承关系，按世纪和流派查看西方哲学史发展。开源、免费，无需登录。'
export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
export function siteBase(value = 'https://western-philosophy.inklinks.io/') {
  const url = new URL(value)
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw Error('VITE_SITE_URL must be an HTTP(S) site URL without credentials, query or fragment')
  if (!url.pathname.endsWith('/')) url.pathname += '/'
  return url
}
export function createSiteContent(snapshot, configuredUrl, verification = '') {
  const base = siteBase(configuredUrl)
  const e = escapeHtml
  const people = [...snapshot.philosophers].sort((a,b) => String(a.chinese_name || a.name).localeCompare(String(b.chinese_name || b.name),'zh-CN'))
  const sharePath = (person, prefix = './') => prefix + '?layout=lineage&philosopher=' + encodeURIComponent(person.id)
  const intro = `<section class="site-intro" aria-labelledby="intro-title"><h1 id="intro-title">西方哲学思想脉络图</h1><p>${e(siteDescription)}</p><p>${people.length} 位哲学家，${snapshot.schools.length} 个流派，${snapshot.influences.length} 条已录入关系。</p><p>正在加载交互图谱。也可以直接浏览<a href="./explore/">人物与流派索引</a>，或访问<a href="https://github.com/adonisly/western-philosophy-map">GitHub 开源仓库</a>。</p><h2>从人物开始探索西方哲学史</h2><ul>${['苏格拉底','柏拉图','亚里士多德','康德','黑格尔','杜威'].map(name=>people.find(p=>p.chinese_name===name)).filter(Boolean).map(p=>`<li><a href="${e(sharePath(p))}">${e(p.chinese_name)} · ${e(p.name)}</a>：${e(p.school)}</li>`).join('')}</ul><noscript><p>交互图谱需要 JavaScript；人物与流派索引无需 JavaScript 即可阅读。</p></noscript></section>`
  const head = `${verification ? '<meta name="google-site-verification" content="' + e(verification) + '" />\n' : ''}<link rel="canonical" href="${e(base.href)}" />
<meta property="og:type" content="website" /><meta property="og:locale" content="zh_CN" /><meta property="og:site_name" content="西方哲学思想脉络图" />
<meta property="og:title" content="${e(siteTitle)}" /><meta property="og:description" content="${e(siteDescription)}" /><meta property="og:url" content="${e(base.href)}" />
<meta property="og:image" content="${e(new URL('social-preview.png',base).href)}" /><meta property="og:image:width" content="1280" /><meta property="og:image:height" content="640" /><meta property="og:image:alt" content="西方哲学思想脉络图：人物、流派与思想传承" />
<meta name="twitter:card" content="summary_large_image" /><meta name="twitter:title" content="${e(siteTitle)}" /><meta name="twitter:description" content="${e(siteDescription)}" /><meta name="twitter:image" content="${e(new URL('social-preview.png',base).href)}" />`
  const catalogTitle = '西方哲学人物与流派索引 | 西方哲学思想脉络图'
  const groups = [...snapshot.schools].sort((a,b)=>a.name.localeCompare(b.name,'zh-CN')).map(school=>({school,people:people.filter(p=>p.school===school.name)})).filter(group=>group.people.length)
  const catalog = `<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>${catalogTitle}</title><meta name="description" content="浏览西方哲学人物、英文名、年代与流派，点击人物进入思想传承图谱。"/><link rel="canonical" href="${e(new URL('explore/',base).href)}"/><style>body{margin:0;font:16px/1.8 system-ui,sans-serif;color:#172033;background:#f8fafc}main{max-width:960px;margin:auto;padding:32px 20px 64px}a{color:#1d4ed8;text-underline-offset:3px}h1{font-size:clamp(1.7rem,4vw,2.5rem);line-height:1.3}h2{margin-top:2.5rem;border-bottom:1px solid #cbd5e1;padding-bottom:8px;font-size:1.25rem}nav{display:flex;flex-wrap:wrap;gap:6px 20px}ul{padding-left:22px}li{margin:10px 0}.meta{color:#475569;font-size:.9rem}footer{margin-top:48px;border-top:1px solid #cbd5e1;padding-top:20px}a:focus-visible{outline:2px solid #2563eb;outline-offset:3px}</style></head><body><main><a href="../">返回交互图谱</a><h1>西方哲学人物与流派索引</h1><p>从古希腊到当代，按流派浏览 ${people.length} 位哲学家。点击姓名，定位人物并查看思想与传承关系。</p><p>本索引来自公开数据快照，是持续整理的学习材料。人物分类和思想关系不穷尽哲学史，重要论断请结合原著与可靠研究核对。</p><details><summary>按流派跳转（${groups.length} 个分类）</summary><nav aria-label="按流派跳转">${groups.map(({school})=>`<a href="#school-${e(encodeURIComponent(school.id))}">${e(school.name)}</a>`).join('')}</nav></details>${groups.map(({school,people})=>`<section id="school-${e(encodeURIComponent(school.id))}"><h2>${e(school.name)}</h2><ul>${people.map(p=>`<li><a href="${e(sharePath(p,'../'))}">${e(p.chinese_name || p.name)}</a> <span lang="en">${e(p.name)}</span><div class="meta">${e(p.period)}${p.nationality?' · '+e(p.nationality):''}</div></li>`).join('')}</ul></section>`).join('')}<footer><a href="../">打开完整思想图谱</a> · <a href="https://github.com/adonisly/western-philosophy-map/issues">附来源提交纠错</a> · <a href="../LICENSE">AGPL-3.0 许可</a></footer></main></body></html>`
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${e(base.href)}</loc></url><url><loc>${e(new URL('explore/',base).href)}</loc></url></urlset>\n`
  return {intro,head,assets:{'explore/index.html':catalog,'sitemap.xml':sitemap,'robots.txt':`User-agent: *\nAllow: /\nSitemap: ${new URL('sitemap.xml',base).href}\n`}}
}
