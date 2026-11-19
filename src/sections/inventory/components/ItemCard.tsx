import { Link } from 'react-router-dom';
import type { Item } from '../types';
import { ItemImage } from './ItemImage';

export function ItemCard({ item, place }: { item: Item; place: string }) {
  return (
    <Link to={`item/${item.id}`} className="item-card">
      <div className="item-img-wrap">
        <ItemImage item={item} />
        {item.imageStatus === 'pending' && <span className="badge">making picture…</span>}
      </div>
      <div className="item-card-body">
        <div className="item-name">{item.name || 'Untitled'}</div>
        <div className="item-place">{[item.color, place].filter(Boolean).join(' · ')}</div>
      </div>
    </Link>
  );
}
