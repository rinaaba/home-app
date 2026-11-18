import type { Item } from '../types';

/** Shows the clean image when ready, otherwise the original photo, otherwise a placeholder. */
export function ItemImage({ item, size }: { item: Item; size: 'thumb' | 'full' }) {
  const img = item.clean ?? item.photo;
  if (!img) return <div className="item-img placeholder">📦</div>;
  return (
    <img
      className="item-img"
      src={size === 'thumb' ? img.thumbUrl : img.url}
      alt={item.name}
      loading="lazy"
      decoding="async"
    />
  );
}
