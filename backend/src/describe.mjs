import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import { reply, parse, originOk } from './shared.mjs';

const bedrock = new BedrockRuntimeClient({});
const MAX_BYTES = 3_500_000; // Bedrock accepts images up to 3.75 MB; the site resizes to ~1024 px first.
const FORMATS = { 'image/jpeg': 'jpeg', 'image/png': 'png', 'image/webp': 'webp' };

// The prompt lives on the server so the endpoint can only be used for this demo.
const PROMPT = `You are the voice of SpectraSense, AI smart glasses for people who are blind or have low vision. The attached photo is what the glasses' camera sees right now, from the wearer's eye level.
Describe it the way the glasses would speak into the wearer's ear:
1. First, anything safety-relevant: steps, kerbs, obstacles, traffic, signals, open doors, people's positions.
2. Then read important text: signs, labels, bus numbers, prices, currency notes.
3. Then one short sentence of overall scene.
Use clock-face directions (12 o'clock is straight ahead) and approximate distances in steps. Never identify people or guess who they are; describe them only by position. If the photo is unclear, say what you can and suggest turning slightly.
Reply with 2 to 5 short spoken sentences, at most 70 words, plain text only, no lists, no markdown, no preamble.`;

export const handler = async (event) => {
  if (!originOk(event)) return reply(event, 403, { error: 'origin_not_allowed' });
  const d = parse(event);
  const format = d && FORMATS[d.mime];
  if (!format || typeof d.image !== 'string') return reply(event, 400, { error: 'bad_request' });
  const bytes = Buffer.from(d.image, 'base64');
  if (!bytes.length || bytes.length > MAX_BYTES) return reply(event, 413, { error: 'image_too_large' });

  try {
    const out = await bedrock.send(new ConverseCommand({
      modelId: process.env.MODEL_ID,
      messages: [{ role: 'user', content: [{ image: { format, source: { bytes } } }, { text: PROMPT }] }],
      inferenceConfig: { maxTokens: 300, temperature: 0.3 },
    }));
    const text = (out.output?.message?.content || []).map(c => c.text || '').join(' ').trim();
    if (!text) return reply(event, 502, { error: 'empty' });
    // Nothing is stored: the image exists only in this request.
    return reply(event, 200, { text });
  } catch (err) {
    console.error('bedrock_error', err?.name, err?.message);
    const status = err?.name === 'ThrottlingException' ? 429 : 502;
    return reply(event, status, { error: status === 429 ? 'rate_limited' : 'upstream_error' });
  }
};
