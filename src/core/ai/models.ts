/**
 * Which Gemini models to use. Model names change often, so each is a list:
 * the app tries them in order and uses the first one that exists.
 * To switch models, change the order or add a name at the top.
 */
export const TEXT_MODELS = ['gemini-3-flash', 'gemini-3-flash-preview', 'gemini-2.5-flash'];
export const IMAGE_MODELS = ['gemini-3.1-flash-image', 'gemini-3.1-flash-image-preview', 'gemini-2.5-flash-image'];
