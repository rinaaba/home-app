import { Link } from 'react-router-dom';
import type { Item } from '../types';
import { ItemImage } from './ItemImage';

export function ItemCard({ item, place }: { item: Item; place: string }) {
  return (
    <Link to={`item/${item.id}`} className="item-card">
      <div className="item-img-wrap">
        <ItemImage item={item} size="thumb" />
        {item.cleanStatus === 'pending' && <span className="badge">Making image…</span>}
      </div>
      <div className="item-card-body">
        <div className="item-name">{item.name || 'Untitled'}</div>
        <div className="item-place">{place}</div>
      </div>
    </Link>
  );
}
