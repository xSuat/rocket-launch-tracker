import { Launch, LaunchLink } from '../types';

export function thumbnailUrl(launch: Launch): string | null {
  const image = launch.image;
  if (!image) return null;
  if (typeof image === 'string') return image;
  return image.thumbnail_url || image.image_url || null;
}

export function heroImageUrl(launch: Launch): string | null {
  const image = launch.image;
  if (!image) return null;
  if (typeof image === 'string') return image;
  return image.image_url || image.thumbnail_url || null;
}

export function imageCredit(launch: Launch): string | null {
  const image = launch.image;
  if (!image || typeof image === 'string') return null;
  return image.credit || null;
}

export function firstWatchUrl(launch: Launch): LaunchLink | null {
  return (launch.vid_urls || []).find((item) => item?.url) || null;
}

export function shareText(launch: Launch, when: string): string {
  const link = firstWatchUrl(launch)?.url || (launch.info_urls || []).find((item) => item?.url)?.url;
  return [launch.name, when, link].filter(Boolean).join('\n');
}
