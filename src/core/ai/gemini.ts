import {
  getGenerativeModel,
  ResponseModality,
  type GenerationConfig,
  type Part,
  type Schema,
} from 'firebase/ai';
import { ai } from '../firebase/app';
import { IMAGE_MODELS, TEXT_MODELS } from './models';
import { AiLimitReached, countAiRequest } from './quota';

// Remember which model worked, so we don't retry missing ones every time.
const working: Record<string, string> = {};

const errText = (err: unknown) => String((err as Error)?.message ?? err);

function isModelMissing(err: unknown) {
  const msg = errText(err).toLowerCase();
  return msg.includes('[404') || msg.includes('not found') || msg.includes('is not supported') || msg.includes('unknown model');
}

/** True when the AI said "too many requests" or "over the limit" (common on the free plan). */
export function isRateLimited(err: unknown) {
  return /\[429|resource_exhausted|quota/i.test(errText(err));
}

/** A short explanation of an AI error, in plain words. */
export function describeAiError(err: unknown): string {
  if (err instanceof AiLimitReached) return err.message;
  const msg = errText(err);
  if (/must enforce firebase app check/i.test(msg)) return 'AI pictures need App Check to be set up and enforced in Firebase. Your cropped picture is kept.';
  if (/app check/i.test(msg)) return 'The AI is busy. It will try again soon.';
  if (/\[403|permission|api has not been used|disabled/i.test(msg)) return 'The AI isn’t turned on for this Firebase project yet (Firebase → AI Logic → Get started).';
  if (isRateLimited(err)) return 'The AI’s free limit was reached. Try again in a minute, or tomorrow if it keeps happening.';
  if (/timed out/i.test(msg)) return 'The AI took too long to answer. Check the internet connection and try again.';
  return msg.slice(0, 200);
}

/** Give up on an AI request that takes too long, instead of spinning forever. */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('The AI request timed out')), ms);
    promise.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}

async function withModelFallback<T>(
  kind: 'text' | 'image',
  candidates: string[],
  run: (model: string) => Promise<T>,
): Promise<T> {
  const ordered = working[kind] ? [working[kind], ...candidates.filter((m) => m !== working[kind])] : candidates;
  let lastErr: unknown;
  for (const model of ordered) {
    try {
      const result = await run(model);
      working[kind] = model;
      return result;
    } catch (err) {
      lastErr = err;
      // A missing model, or one that's over its free limit: try the next one.
      if (!isModelMissing(err) && !isRateLimited(err)) throw err;
      console.warn(`Model ${model} unavailable, trying next`, err);
    }
  }
  throw lastErr;
}

export async function blobToPart(blob: Blob): Promise<Part> {
  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
  return { inlineData: { data, mimeType: blob.type || 'image/jpeg' } };
}

/** Ask Gemini a question (optionally about images) and get back JSON matching `schema`. */
export async function generateJson<T>(prompt: string, images: Blob[], schema: Schema): Promise<T> {
  await countAiRequest(); // counts toward the family's daily AI limit
  const parts: Part[] = [{ text: prompt }, ...(await Promise.all(images.map(blobToPart)))];
  const generationConfig: GenerationConfig = { responseMimeType: 'application/json', responseSchema: schema };
  return withModelFallback('text', TEXT_MODELS, async (model) => {
    const m = getGenerativeModel(ai, { model, generationConfig });
    const res = await withTimeout(m.generateContent(parts), 60_000);
    return JSON.parse(res.response.text()) as T;
  });
}

/** Ask Gemini to create an image (optionally based on input images). Returns the image as a Blob. */
export async function generateImage(prompt: string, images: Blob[]): Promise<Blob> {
  await countAiRequest(); // counts toward the family's daily AI limit
  const parts: Part[] = [{ text: prompt }, ...(await Promise.all(images.map(blobToPart)))];
  return withModelFallback('image', IMAGE_MODELS, async (model) => {
    const m = getGenerativeModel(ai, {
      model,
      generationConfig: {
        responseModalities: [ResponseModality.TEXT, ResponseModality.IMAGE],
        imageConfig: { aspectRatio: '1:1' },
      },
    });
    const res = await withTimeout(m.generateContent(parts), 120_000);
    const img = res.response.inlineDataParts()?.[0]?.inlineData;
    if (!img) throw new Error('The AI did not return an image');
    const bytes = Uint8Array.from(atob(img.data), (c) => c.charCodeAt(0));
    return new Blob([bytes], { type: img.mimeType });
  });
}
