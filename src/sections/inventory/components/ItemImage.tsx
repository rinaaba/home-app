import { CATEGORY_ICONS } from '../taxonomy';
import type { Item } from '../types';

/** The item's picture, or a color tile with a category icon when there is none. */
export function ItemImage({ item }: { item: Item }) {
  if (item.image) {
    return <img className="item-img" src={item.image.url} alt={item.name} loading="lazy" decoding="async" />;
  }
  return (
    <div className="item-img tile" style={item.colorHex ? { background: item.colorHex } : undefined} aria-label={item.name}>
      <span className="tile-icon">{CATEGORY_ICONS[item.category] ?? '📦'}</span>
    </div>
  );
}
