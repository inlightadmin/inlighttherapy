/**
 * Generates public/sitemap.xml and public/robots.txt on every build (prebuild).
 * Member-only and staff routes are intentionally excluded.
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const publicDir = resolve(root, 'public')

const siteUrl = (
  process.env.VITE_SITE_URL || 'https://in-lighttherapy.web.app'
).replace(/\/$/, '')

/** Public, indexable routes only */
const staticRoutes: { path: string; changefreq: string; priority: string }[] = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/about', changefreq: 'monthly', priority: '0.8' },
  { path: '/services', changefreq: 'monthly', priority: '0.8' },
  { path: '/clinicians', changefreq: 'weekly', priority: '0.9' },
  { path: '/tools', changefreq: 'weekly', priority: '0.7' },
  { path: '/contact', changefreq: 'monthly', priority: '0.8' },
  // Soft landing for local SEO; app redirects to /contact#location
  { path: '/location', changefreq: 'monthly', priority: '0.7' },
  { path: '/newsletter', changefreq: 'monthly', priority: '0.6' },
  { path: '/terms', changefreq: 'yearly', priority: '0.3' },
  { path: '/privacy', changefreq: 'yearly', priority: '0.3' },
]

// Placeholder clinician/tool slugs for sitemap until CMS is live.
// prebuild can later fetch published docs from Firestore.
const dynamicRoutes: { path: string; changefreq: string; priority: string }[] = [
  {
    path: '/clinicians/sample-clinician',
    changefreq: 'monthly',
    priority: '0.7',
  },
]

const today = new Date().toISOString().slice(0, 10)
const allRoutes = [...staticRoutes, ...dynamicRoutes]

const urlEntries = allRoutes
  .map(
    (route) => `  <url>
    <loc>${siteUrl}${route.path === '/' ? '' : route.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`,
  )
  .join('\n')

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>
`

const robots = `User-agent: *
Allow: /

Disallow: /admin
Disallow: /admin/
Disallow: /account
Disallow: /chat
Disallow: /login
Disallow: /signup
Disallow: /auth
Disallow: /auth/
Disallow: /newsletters

Sitemap: ${siteUrl}/sitemap.xml
`

mkdirSync(publicDir, { recursive: true })
writeFileSync(resolve(publicDir, 'sitemap.xml'), sitemap, 'utf8')
writeFileSync(resolve(publicDir, 'robots.txt'), robots, 'utf8')

console.log(
  `Sitemap generated: ${allRoutes.length} URLs → ${siteUrl}/sitemap.xml`,
)
