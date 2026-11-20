import { Link } from 'react-router-dom';
import type { Item } from '../types';
import { ItemImage } from './ItemImage';
import { useInventory } from '../InventoryContext';
import { homeStyle } from '../homeStyle';

export function ItemCard({ item, place }: { item: Item; place: string }) {
  const { homes } = useInventory();
  // The picture's background takes the home's pale color, so you can tell homes apart at a glance.
  const accent = homeStyle(homes.find((h) => h.id === item.homeId)).accent;
  return (
    <Link to={`item/${item.id}`} className={`item-card home-tint accent-${accent}`}>
      <div className="item-img-wrap">
        <ItemImage item={item} />
        {item.aiStatus === 'pending' ? <span className="badge">filling in…</span>
          : item.aiStatus === 'failed' && !item.name ? <span className="badge">add details</span>
          : item.imageStatus === 'pending' ? <span className="badge">making picture…</span> : null}
      </div>
      <div className="item-card-body">
        <div className="item-name">{item.name || (item.aiStatus === 'pending' ? 'New item' : 'Untitled')}</div>
        <div className="item-place">{[item.color, place].filter(Boolean).join(' · ')}</div>
      </div>
    </Link>
  );
}
