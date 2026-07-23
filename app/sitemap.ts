import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/env';

export default function sitemap(): MetadataRoute.Sitemap {
  return ['', '/app', '/demo', '/security', '/privacy', '/terms', '/data-deletion'].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: path === '/app' ? 'weekly' : path ? 'monthly' : 'weekly',
    priority: path === '/app' ? 0.95 : path ? 0.7 : 1
  }));
}
