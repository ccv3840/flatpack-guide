// Claude API client for "help me with this step". The key stays on the device (localStorage).
import { HARDWARE, TOOLS } from './catalog.js';

export const DEFAULT_MODEL = 'claude-sonnet-5-5';

export function guideContext(product, stepIndex) {
  const lines = product.steps.map((s, i) => {
    const hw = summarizeFixings(s).map(([k, n]) => `${n}× ${HARDWARE[k].label}`).join(', ');
    const tools = (s.tools || []).map((t) => TOOLS[t].label).join(', ');
    return `${i + 1}. ${s.title}: ${s.text}${hw ? ` [hardware: ${hw}]` : ''}${tools ? ` [tools: ${tools}]` : ''}`;
  });
  return `The user is assembling ${product.name} (${product.kind}, ${product.size}) with an animated step-by-step guide.
They are currently on step ${stepIndex + 1} of ${product.steps.length}: "${product.steps[stepIndex].title}".
Guide note: ${product.note}

Full guide:
${lines.join('\n')}`;
}

export function summarizeFixings(step) {
  const counts = new Map();
  for (const f of step.fix || []) counts.set(f.t, (counts.get(f.t) || 0) + 1);
  return [...counts.entries()];
}

const BASE = `You are a calm, practical flat-pack furniture assembly helper inside a phone app.
The user is mid-assembly, probably holding tools, maybe reading on a small screen or listening via text-to-speech.
- Answer in at most 4 short sentences unless they ask for more. No headings.
- Be concrete: name the part by shape/size/hole pattern, say which way it faces, which hardware goes where.
- If a photo is attached, first say briefly what you see, then map it to the parts and steps.
- The app's guide is simplified. If the user's paper manual or hardware differs, trust their manual and help them read it.
- If something is missing or broken, say how to check (count against the manual's inventory page) and suggest contacting the retailer's spare-parts service.
- For tall or heavy furniture, remind them to anchor it to the wall when relevant.`;

export const MANUAL_MODE = `${BASE}
The user is photographing pages of an unfamiliar, mostly wordless assembly manual.
Explain the pictured step in plain words: which parts, which hardware (by shape and the number printed next to it), orientation, the order of actions, and the common mistake to avoid.`;

export function stepSystemPrompt(product, stepIndex) {
  return `${BASE}\n\n${guideContext(product, stepIndex)}`;
}

export async function askClaude({ apiKey, model, system, messages }) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({ model: model || DEFAULT_MODEL, max_tokens: 700, system, messages }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error?.message || `HTTP ${res.status}`;
    throw new Error(res.status === 401 ? 'The API key was rejected. Check it in Settings.' : msg);
  }
  return (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
}

// Shrink a photo before upload: phone pictures are far larger than the model needs.
export function imageToBlock(file, maxSide = 1400) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      resolve({
        preview: dataUrl,
        block: { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: dataUrl.split(',')[1] } },
      });
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read that image.')); };
    img.src = url;
  });
}
