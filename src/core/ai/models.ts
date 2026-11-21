/**
 * Which Gemini models to use. Model names change often, so each is a list:
 * the app tries them in order and uses the first one that exists.
 * To switch models, change the order or add a name at the top.
 */
// Checked Nov 2026: gemini-3-flash-preview answers; gemini-3-flash and gemini-2.5-flash are gone for new projects.
// When one model is over its free daily limit, the next one is tried (each model has its own allowance).
export const TEXT_MODELS = ['gemini-3-flash-preview', 'gemini-3.1-flash-lite', 'gemini-3.1-flash-lite-preview', 'gemini-3-flash-lite-preview', 'gemini-3.8-flash'];
// The lite model is tried first: it's the cheapest and may work on the free plan.
export const IMAGE_MODELS = ['gemini-3.1-flash-lite-image', 'gemini-3.1-flash-lite-image-preview', 'gemini-3.1-flash-image', 'gemini-3.1-flash-image-preview', 'gemini-2.5-flash-image'];
