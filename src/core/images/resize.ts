/** Open any photo as a bitmap. iPhone HEIC photos are converted when the browser can't open them itself. */
async function openImage(file: Blob): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch (err) {
    // Only Safari opens HEIC natively. Elsewhere, load a converter (only when needed — it's large).
    const { heicTo, isHeic } = await import('heic-to');
    const asFile = file instanceof File ? file : new File([file], 'photo', { type: file.type });
    if (!(await isHeic(asFile))) throw err;
    return heicTo({ blob: file, type: 'bitmap' });
  }
}

/** Shrink an image so its longest side is at most `maxSide` pixels. Returns a JPEG. */
export async function resizeImage(file: Blob, maxSide: number, quality = 0.85): Promise<Blob> {
  const bitmap = await openImage(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not process image'))), 'image/jpeg', quality),
  );
}
