import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/env';
export default function sitemap(): MetadataRoute.Sitemap { return ['', '/demo', '/security', '/privacy', '/terms', '/data-deletion'].map(path => ({ url: `${siteUrl}${path}`, lastModified: new Date(), changeFrequency: path ? 'monthly' : 'weekly', priority: path ? 0.7 : 1 })); }
