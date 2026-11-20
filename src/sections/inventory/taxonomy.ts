/**
 * Starting list of categories and sub-categories. The AI picks from these when it can,
 * and you can always type your own in the form.
 */
export const TAXONOMY: Record<string, string[]> = {
  Clothing: ['T-shirt', 'Top', 'Shirt', 'Blouse', 'Sweater', 'Hoodie', 'Jacket', 'Coat', 'Pants', 'Jeans', 'Leggings', 'Shorts', 'Dress', 'Skirt', 'Swimwear', 'Underwear', 'Socks', 'Tights', 'Pajamas', 'Sportswear'],
  Shoes: ['Sneakers', 'Sandals', 'Boots', 'Dress shoes', 'Slippers', 'Flip-flops'],
  Accessories: ['Bag', 'Backpack', 'Hat', 'Scarf', 'Sunglasses', 'Belt', 'Jewelry', 'Watch'],
  Kitchen: ['Small appliance', 'Cookware', 'Bakeware', 'Utensils', 'Knives', 'Dishes', 'Glassware', 'Storage containers', 'Coffee and tea'],
  Electronics: ['Phone', 'Tablet', 'Laptop', 'Charger', 'Cable', 'Headphones', 'Speaker', 'Camera', 'TV', 'Router', 'Smart home'],
  Furniture: ['Chair', 'Table', 'Sofa', 'Bed', 'Shelf', 'Cabinet', 'Desk', 'Outdoor furniture'],
  Linens: ['Bedding', 'Towels', 'Blankets', 'Pillows', 'Tablecloths', 'Curtains'],
  'Bath and beauty': ['Hair tools', 'Skincare', 'Makeup', 'Toiletries', 'Shaving'],
  Tools: ['Hand tools', 'Power tools', 'Hardware', 'Paint', 'Ladder', 'Garden tools'],
  Cleaning: ['Vacuum', 'Cleaning supplies', 'Laundry'],
  'Kids and toys': ['Toys', 'Games', 'Books', 'Baby gear', 'Kids clothing'],
  'Sports and outdoors': ['Beach', 'Camping', 'Bikes', 'Fitness', 'Water sports', 'Ball sports'],
  Travel: ['Suitcase', 'Travel accessories', 'Documents'],
  'Books and media': ['Books', 'Board games', 'Music', 'Movies'],
  Decor: ['Art', 'Lamps', 'Plants', 'Rugs', 'Mirrors', 'Candles'],
  'Health and medicine': ['Medicine', 'First aid', 'Medical devices'],
  Documents: ['Paperwork', 'Manuals', 'Warranties'],
  Other: ['Other'],
};

export const CATEGORIES = Object.keys(TAXONOMY);



/** Shown on the color tile of items without a picture. */
export const CATEGORY_ICONS: Record<string, string> = {
  Clothing: '👕', Shoes: '👟', Accessories: '👜', Kitchen: '🍳', Electronics: '🔌', Furniture: '🪑',
  Linens: '🛏️', 'Bath and beauty': '🧴', Tools: '🔧', Cleaning: '🧹', 'Kids and toys': '🧸',
  'Sports and outdoors': '⚽', Travel: '🧳', 'Books and media': '📚', Decor: '🖼️',
  'Health and medicine': '💊', Documents: '📄',
};
