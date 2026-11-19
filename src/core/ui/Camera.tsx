import { useEffect, useRef, useState } from 'react';
import { Icons } from './icons';

/**
 * A full-screen camera inside the app (phone, tablet or laptop webcam).
 * Calls onPhoto with the picture, or onUnavailable if the camera can't be used
 * (no camera, or permission refused) so the caller can fall back to the system picker.
 */
export function Camera({ onPhoto, onClose, onUnavailable }: {
  onPhoto: (file: File) => void;
  onClose: () => void;
  onUnavailable: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facing, setFacing] = useState<'environment' | 'user'>('environment');
  const [ready, setReady] = useState(false);
  const [canFlip, setCanFlip] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    if (!navigator.mediaDevices?.getUserMedia) { onUnavailable(); return; }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: facing }, width: { ideal: 1920 }, height: { ideal: 1440 } }, audio: false })
      .then(async (stream) => {
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
        setReady(true);
        const cams = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'videoinput');
        if (!cancelled) setCanFlip(cams.length > 1);
      })
      .catch(() => { if (!cancelled) onUnavailable(); });
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facing]);

  const shoot = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    canvas.getContext('2d')!.drawImage(v, 0, 0);
    canvas.toBlob((b) => b && onPhoto(new File([b], 'photo.jpg', { type: 'image/jpeg' })), 'image/jpeg', 0.92);
  };

  return (
    <div className="camera" role="dialog" aria-label="Camera">
      <video ref={videoRef} playsInline muted className={facing === 'user' ? 'mirrored' : ''} />
      {!ready && <div className="camera-wait">Opening the camera…</div>}
      <div className="camera-bar">
        <button type="button" className="camera-side" onClick={onClose} aria-label="Close camera"><Icons.close /></button>
        <button type="button" className="shutter" onClick={shoot} disabled={!ready} aria-label="Take photo" />
        {canFlip ? (
          <button type="button" className="camera-side" onClick={() => setFacing((f) => (f === 'user' ? 'environment' : 'user'))} aria-label="Switch camera">⟲</button>
        ) : <span className="camera-side" />}
      </div>
    </div>
  );
}
