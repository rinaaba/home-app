/**
 * Make a small, square "product view" of the main item in a photo:
 * crop to the item's box (from the AI), add a little room around it, center it on white.
 * `box` is [ymin, xmin, ymax, xmax] on a 0–1000 scale (the format Gemini uses).
 */
export async function cropToItem(photo: Blob, box: number[] | undefined, size = 400): Promise<Blob> {
  const bitmap = await createImageBitmap(photo);
  const W = bitmap.width;
  const H = bitmap.height;

  // Use the box only if it looks sensible; otherwise use the whole photo.
  let [y0, x0, y1, x1] = [0, 0, H, W];
  if (box && box.length === 4 && box.every((n) => Number.isFinite(n))) {
    const [a, b, c, d] = box.map((n) => Math.min(1000, Math.max(0, n)));
    if (c - a > 20 && d - b > 20) [y0, x0, y1, x1] = [(a / 1000) * H, (b / 1000) * W, (c / 1000) * H, (d / 1000) * W];
  }

  const side = Math.max(y1 - y0, x1 - x0) * 1.12; // ~6% room on each side
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);
  ctx.imageSmoothingQuality = 'high';
  const scale = size / side;
  // Place the item's center in the middle of the square.
  ctx.drawImage(bitmap, size / 2 - cx * scale, size / 2 - cy * scale, W * scale, H * scale);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not make the picture'))), 'image/jpeg', 0.82),
  );
}
