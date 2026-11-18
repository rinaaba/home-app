import {
  getGenerativeModel,
  ResponseModality,
  type GenerationConfig,
  type Part,
  type Schema,
} from 'firebase/ai';
import { ai } from '../firebase/app';
import { IMAGE_MODELS, TEXT_MODELS } from './models';

// Remember which model worked, so we don't retry missing ones every time.
const working: Record<string, string> = {};

function isModelMissing(err: unknown) {
  const msg = String((err as Error)?.message ?? err).toLowerCase();
  return msg.includes('not found') || msg.includes('404') || msg.includes('is not supported') || msg.includes('unknown model');
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
      if (!isModelMissing(err)) throw err;
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
  const parts: Part[] = [{ text: prompt }, ...(await Promise.all(images.map(blobToPart)))];
  const generationConfig: GenerationConfig = { responseMimeType: 'application/json', responseSchema: schema };
  return withModelFallback('text', TEXT_MODELS, async (model) => {
    const m = getGenerativeModel(ai, { model, generationConfig });
    const res = await m.generateContent(parts);
    return JSON.parse(res.response.text()) as T;
  });
}

/** Ask Gemini to create an image (optionally based on input images). Returns the image as a Blob. */
export async function generateImage(prompt: string, images: Blob[]): Promise<Blob> {
  const parts: Part[] = [{ text: prompt }, ...(await Promise.all(images.map(blobToPart)))];
  return withModelFallback('image', IMAGE_MODELS, async (model) => {
    const m = getGenerativeModel(ai, {
      model,
      generationConfig: {
        responseModalities: [ResponseModality.TEXT, ResponseModality.IMAGE],
        imageConfig: { aspectRatio: '1:1' },
      },
    });
    const res = await m.generateContent(parts);
    const img = res.response.inlineDataParts()?.[0]?.inlineData;
    if (!img) throw new Error('The AI did not return an image');
    const bytes = Uint8Array.from(atob(img.data), (c) => c.charCodeAt(0));
    return new Blob([bytes], { type: img.mimeType });
  });
}
