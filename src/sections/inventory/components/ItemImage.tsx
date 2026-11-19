import { useEffect, useState } from 'react';
import { fullImageUrl, type StoredImage } from '../../../core/images/imageStore';
import type { Item } from '../types';

/** Shows one stored image. Full size is loaded on demand; the thumbnail shows meanwhile. */
export function StoredImageView({ img, size, alt }: { img: StoredImage; size: 'thumb' | 'full'; alt: string }) {
  const [src, setSrc] = useState(size === 'thumb' || !img.url ? img.thumbUrl : img.url);
  useEffect(() => {
    if (size === 'thumb') { setSrc(img.thumbUrl); return; }
    let live = true;
    setSrc(img.url || img.thumbUrl);
    fullImageUrl(img).then((u) => live && setSrc(u)).catch(() => undefined);
    return () => { live = false; };
  }, [img, size]);
  return <img className="item-img" src={src} alt={alt} loading="lazy" decoding="async" />;
}

/** Shows the clean image when ready, otherwise the original photo, otherwise a placeholder. */
export function ItemImage({ item, size }: { item: Item; size: 'thumb' | 'full' }) {
  const img = item.clean ?? item.photo;
  if (!img) return <div className="item-img placeholder">📦</div>;
  return <StoredImageView img={img} size={size} alt={item.name} />;
}
