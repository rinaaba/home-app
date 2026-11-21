import { useEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import { Modal } from './Modal';

/** Turn a picture a quarter turn (dir 1 = clockwise, -1 = counter-clockwise). Returns it as a data URL. */
async function rotate(src: string, dir: 1 | -1): Promise<string> {
  const img = new Image();
  img.src = src;
  await img.decode();
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalHeight;
  canvas.height = img.naturalWidth;
  const ctx = canvas.getContext('2d')!;
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((dir * Math.PI) / 2);
  ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
  return canvas.toDataURL('image/jpeg', 0.92);
}

/**
 * Edit a picture: rotate it, and crop it to a square (drag the frame to move it, drag its corner to resize).
 * Returns a small square JPEG.
 */
export function CropDialog({ src: original, onDone, onClose, size = 400 }: {
  src: string;
  onDone: (blob: Blob) => void;
  onClose: () => void;
  size?: number;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [src, setSrc] = useState(original);
  const [turning, setTurning] = useState(false);
  const turn = async (dir: 1 | -1) => {
    setTurning(true);
    try { setSrc(await rotate(src, dir)); } finally { setTurning(false); }
  };
  const [box, setBox] = useState({ x: 0, y: 0, s: 0 }); // in displayed pixels
  const [shown, setShown] = useState({ w: 0, h: 0 });
  const drag = useRef<{ mode: 'move' | 'resize'; px: number; py: number; start: typeof box } | null>(null);

  const onLoad = () => {
    const img = imgRef.current!;
    const w = img.clientWidth;
    const h = img.clientHeight;
    setShown({ w, h });
    const s = Math.min(w, h) * 0.9;
    setBox({ x: (w - s) / 2, y: (h - s) / 2, s });
  };
  useEffect(() => { if (imgRef.current?.complete) onLoad(); }, []);

  const clamp = (b: typeof box) => {
    const s = Math.max(40, Math.min(b.s, shown.w, shown.h));
    return { s, x: Math.min(Math.max(0, b.x), shown.w - s), y: Math.min(Math.max(0, b.y), shown.h - s) };
  };
  const start = (mode: 'move' | 'resize') => (e: RPointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    drag.current = { mode, px: e.clientX, py: e.clientY, start: box };
  };
  const move = (e: RPointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.px;
    const dy = e.clientY - d.py;
    setBox(clamp(d.mode === 'move' ? { ...d.start, x: d.start.x + dx, y: d.start.y + dy } : { ...d.start, s: d.start.s + Math.max(dx, dy) }));
  };
  const end = () => { drag.current = null; };

  const save = () => {
    const img = imgRef.current!;
    const k = img.naturalWidth / shown.w; // displayed → real pixels
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, size, size);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, box.x * k, box.y * k, box.s * k, box.s * k, 0, 0, size, size);
    canvas.toBlob((b) => b && onDone(b), 'image/jpeg', 0.85);
  };

  return (
    <Modal title="Edit picture" onClose={onClose}>
      <div className="crop-area" onPointerMove={move} onPointerUp={end} onPointerCancel={end}>
        <img ref={imgRef} src={src} alt="" onLoad={onLoad} draggable={false} />
        {box.s > 0 && (
          <div className="crop-box" style={{ left: box.x, top: box.y, width: box.s, height: box.s }} onPointerDown={start('move')}>
            <span className="crop-handle" onPointerDown={start('resize')} />
          </div>
        )}
      </div>
      <div className="rotate-row">
        <button type="button" className="btn" onClick={() => void turn(-1)} disabled={turning}>↺ Rotate left</button>
        <button type="button" className="btn" onClick={() => void turn(1)} disabled={turning}>↻ Rotate right</button>
      </div>
      <p className="meta center">Drag the frame to move it · drag its corner to resize</p>
      <button type="button" className="btn primary big" onClick={save} disabled={!box.s || turning}>Save picture</button>
    </Modal>
  );
}
