import { PRODUCTS, PLANNED } from '../products/index.js';
import { HARDWARE, TOOLS, UI_ICONS as I, SILHOUETTES } from './catalog.js';
import { Viewer } from './viewer.js';
import { Voice, voiceSupported } from './voice.js';
import { askClaude, stepSystemPrompt, MANUAL_MODE, imageToBlock, summarizeFixings, DEFAULT_MODEL } from './ai.js';

// ---------- storage (wrapped: private mode or full storage must not break the app) ----------
const store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(`fg.${key}`);
      return v === null ? fallback : JSON.parse(v);
    } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(`fg.${key}`, JSON.stringify(value)); } catch { /* ignore */ }
  },
};
const settings = () => ({
  apiKey: store.get('apiKey', ''),
  model: store.get('model', DEFAULT_MODEL),
  lang: store.get('lang', 'en-US'),
  readAloud: store.get('readAloud', true),
});

const app = document.getElementById('app');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const state = { product: null, step: 0, chat: [], chatMode: null, pending: [], busy: false };
let viewer = null;
let voice = null;

// ---------- routing ----------
function route() {
  const [, screen, id] = (location.hash.slice(1) || '/').split('/');
  closeModal();
  if (screen === 'guide' && PRODUCTS.some((p) => p.id === id)) openGuide(id);
  else renderHome();
}
window.addEventListener('hashchange', route);

function teardown() {
  viewer?.dispose();
  viewer = null;
  voice?.stop();
  voice = null;
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}

// ---------- home ----------
function renderHome() {
  teardown();
  state.product = null;
  document.title = 'Flatpack Guide';
  app.innerHTML = `
    <header class="home-head">
      <div><h1>Flatpack Guide</h1><p>Animated, hands-free assembly guides</p></div>
      <button class="icon-btn" data-act="settings" aria-label="Settings">${I.settings}</button>
    </header>
    <main class="home">
      <button class="scan-card" data-act="manual">
        <span class="scan-icon">${I.scan}</span>
        <span><strong>Help with any manual</strong><small>Photograph a page and ask what it means</small></span>
      </button>
      <h2 class="section">Guides</h2>
      <div class="cards">
        ${PRODUCTS.map((p) => {
          const saved = store.get(`step.${p.id}`, 0);
          return `<a class="card" href="#/guide/${p.id}">
            <span class="sil">${SILHOUETTES[p.silhouette]}</span>
            <span class="meta">
              <strong>${esc(p.name)}</strong>
              <small>${esc(p.kind)} · ${esc(p.size)}</small>
              <span class="badges"><b>${esc(p.level)}</b><b>~${p.minutes} min</b><b>${p.people} ${p.people > 1 ? 'people' : 'person'}</b><b>${p.steps.length} steps</b></span>
            </span>
            ${saved > 0 ? `<span class="resume">Step ${saved + 1}</span>` : ''}
          </a>`;
        }).join('')}
      </div>
      <h2 class="section">Coming next</h2>
      <ul class="planned">${PLANNED.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>
      <p class="fineprint">Unofficial, simplified guides for personal use. Not affiliated with any furniture brand. Product versions change; when the guide and your paper manual disagree, the manual wins.</p>
    </main>`;
}

// ---------- guide ----------
function openGuide(id) {
  teardown();
  const product = PRODUCTS.find((p) => p.id === id);
  state.product = product;
  state.step = Math.min(store.get(`step.${id}`, 0), product.steps.length - 1);
  state.chat = [];
  document.title = `${product.name} · Flatpack Guide`;
  app.innerHTML = `
    <div class="guide">
      <header class="topbar">
        <a class="icon-btn" href="#/" aria-label="All guides">${I.back}</a>
        <div class="title"><strong>${esc(product.name)}</strong><small id="stepcount"></small></div>
        <button class="icon-btn" data-act="parts" aria-label="Parts list">${I.parts}</button>
      </header>
      <div class="stage" id="stage">
        <div class="progress"><i id="bar"></i></div>
        <div class="toast" id="toast"></div>
        <div class="heard" id="heard"></div>
        <button class="fab" data-act="replay" aria-label="Replay animation">${I.replay}</button>
      </div>
      <section class="sheet" id="sheet"></section>
      <nav class="controls">
        <button class="ctl" data-act="prev">${I.back}<span>Back</span></button>
        <button class="ctl mic" data-act="mic" id="micBtn">${I.mic}<span>Voice</span></button>
        <button class="ctl" data-act="ask">${I.ask}<span>Ask</span></button>
        <button class="ctl primary" data-act="next" id="nextBtn"><span>Next</span>${I.next}</button>
      </nav>
    </div>`;
  const stage = document.getElementById('stage');
  viewer = new Viewer(stage, { onPick: (label) => toast(label) });
  viewer.load(product);
  showStep(state.step, false);
  // Let the layout settle, then play the current step.
  requestAnimationFrame(() => viewer.show(state.step));
  attachSwipe(document.getElementById('sheet'));
}

function showStep(index, animate = true) {
  const p = state.product;
  state.step = Math.max(0, Math.min(p.steps.length - 1, index));
  store.set(`step.${p.id}`, state.step);
  const s = p.steps[state.step];
  const n = p.steps.length;
  document.getElementById('stepcount').textContent = `Step ${state.step + 1} of ${n}`;
  document.getElementById('bar').style.width = `${((state.step + 1) / n) * 100}%`;
  const hw = summarizeFixings(s);
  document.getElementById('sheet').innerHTML = `
    ${state.step === 0 && p.note ? `<p class="note">${esc(p.note)}</p>` : ''}
    <h2>${esc(s.title)}</h2>
    <p class="text">${esc(s.text)}</p>
    ${hw.length || (s.tools || []).length ? `<div class="chips">
      ${hw.map(([k, c]) => `<span class="chip hw">${HARDWARE[k].icon}<b>${c}×</b>${esc(HARDWARE[k].label)}</span>`).join('')}
      ${(s.tools || []).map((t) => `<span class="chip tool">${TOOLS[t].icon}${esc(TOOLS[t].label)}</span>`).join('')}
    </div>` : ''}
    ${s.tip ? `<p class="tip"><b>Tip</b>${esc(s.tip)}</p>` : ''}`;
  document.getElementById('sheet').scrollTop = 0;
  const last = state.step === n - 1;
  document.getElementById('nextBtn').innerHTML = last ? `<span>Finish</span>${I.next}` : `<span>Next</span>${I.next}`;
  if (animate) viewer?.show(state.step);
  if (animate && voice?.listening && settings().readAloud) voice.speak(`Step ${state.step + 1}. ${s.title}. ${s.text}`);
}

function next() {
  const n = state.product.steps.length;
  if (state.step < n - 1) return showStep(state.step + 1);
  toast(`${state.product.name} is done. Nice work!`, 3000);
  store.set(`step.${state.product.id}`, 0);
  voice?.speak('All done. Nice work!');
  setTimeout(() => { if (state.product) location.hash = '#/'; }, 2200);
}
const prev = () => showStep(state.step - 1);

let toastTimer;
function toast(text, ms = 1800) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), ms);
}

function attachSwipe(el) {
  let x0 = null, y0 = null;
  el.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  el.addEventListener('touchend', (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    const dy = e.changedTouches[0].clientY - y0;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) (dx < 0 ? next : prev)();
    x0 = null;
  });
}

// ---------- voice ----------
function toggleVoice() {
  const btn = document.getElementById('micBtn');
  if (voice?.listening) { voice.stop(); return; }
  if (!voiceSupported()) {
    toast('Voice control isn\'t available in this browser. Try opening the app in Safari.', 3500);
    return;
  }
  voice = new Voice({
    lang: settings().lang,
    onState: (s) => {
      btn?.classList.toggle('on', s === 'on');
      if (s === 'denied') toast('Microphone access was blocked. Allow it in Settings → Safari → Microphone.', 4000);
    },
    onHeard: (text) => {
      const el = document.getElementById('heard');
      if (!el) return;
      el.textContent = `“${text}”`;
      el.classList.add('show');
      setTimeout(() => el.classList.remove('show'), 2200);
    },
    onCommand: (cmd, arg) => {
      if (cmd === 'next') next();
      else if (cmd === 'prev') prev();
      else if (cmd === 'replay') viewer?.show(state.step);
      else if (cmd === 'read') {
        const s = state.product.steps[state.step];
        voice.speak(`${s.title}. ${s.text} ${s.tip ? `Tip: ${s.tip}` : ''}`);
      } else if (cmd === 'parts') openParts();
      else if (cmd === 'stop') voice.stop();
      else if (cmd === 'ask') {
        openChat('step');
        if (arg) sendChat(arg);
        else {
          voice.speak('What\'s your question?');
          voice.capture = (q) => sendChat(q);
        }
      }
    },
  });
  if (voice.start()) {
    toast('Listening: say “next”, “back”, “repeat”, “read”, or “help” plus your question', 3500);
  }
}

// ---------- modals ----------
function openModal(html, cls = '') {
  closeModal();
  const wrap = document.createElement('div');
  wrap.className = 'backdrop';
  wrap.id = 'modal';
  wrap.innerHTML = `<div class="modal ${cls}" role="dialog">${html}</div>`;
  wrap.addEventListener('click', (e) => { if (e.target === wrap) closeModal(); });
  document.body.appendChild(wrap);
  return wrap;
}
function closeModal() { document.getElementById('modal')?.remove(); }

function openParts() {
  const p = state.product;
  const parts = new Map();
  for (const spec of p.parts) parts.set(spec.label, (parts.get(spec.label) || 0) + 1);
  const hw = new Map();
  for (const s of p.steps) for (const [k, n] of summarizeFixings(s)) hw.set(k, (hw.get(k) || 0) + n);
  const tools = new Set(p.steps.flatMap((s) => s.tools || []));
  openModal(`
    <header class="modal-head"><strong>${esc(p.name)} parts</strong><button class="icon-btn" data-act="close" aria-label="Close">${I.close}</button></header>
    <div class="modal-body">
      <h3>Panels</h3>
      <ul class="inv">${[...parts].map(([l, n]) => `<li><span>${esc(l)}</span><b>${n}</b></li>`).join('')}</ul>
      <h3>Hardware</h3>
      <ul class="inv">${[...hw].map(([k, n]) => `<li>${HARDWARE[k].icon}<span>${esc(HARDWARE[k].label)}</span><b>${n}</b></li>`).join('')}</ul>
      <h3>Tools</h3>
      <ul class="inv">${[...tools].map((t) => `<li>${TOOLS[t].icon}<span>${esc(TOOLS[t].label)}</span></li>`).join('')}</ul>
      <p class="fineprint">Counts are what this guide animates. Check them against the inventory page of your paper manual; boxes often include a spare or two.</p>
    </div>`);
}

function openSettings() {
  const s = settings();
  openModal(`
    <header class="modal-head"><strong>Settings</strong><button class="icon-btn" data-act="close" aria-label="Close">${I.close}</button></header>
    <form class="modal-body form" id="settingsForm">
      <label>Anthropic API key
        <input type="password" name="apiKey" value="${esc(s.apiKey)}" placeholder="sk-ant-…" autocomplete="off" autocapitalize="off" spellcheck="false">
        <small>Stored only on this phone. Used for “Ask” and manual help.</small>
      </label>
      <label>Model
        <input name="model" value="${esc(s.model)}" autocapitalize="off" spellcheck="false">
      </label>
      <label>Voice language
        <select name="lang">
          ${[['en-US', 'English (US)'], ['en-GB', 'English (UK)'], ['de-CH', 'Deutsch (Schweiz)'], ['de-DE', 'Deutsch']].map(([v, l]) => `<option value="${v}" ${v === s.lang ? 'selected' : ''}>${l}</option>`).join('')}
        </select>
      </label>
      <label class="row"><input type="checkbox" name="readAloud" ${s.readAloud ? 'checked' : ''}> Read steps and answers aloud while voice is on</label>
      <button class="primary-btn" type="submit">Save</button>
    </form>`);
  document.getElementById('settingsForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    store.set('apiKey', String(f.get('apiKey') || '').trim());
    store.set('model', String(f.get('model') || DEFAULT_MODEL).trim() || DEFAULT_MODEL);
    store.set('lang', f.get('lang'));
    store.set('readAloud', f.get('readAloud') === 'on');
    if (voice) voice.lang = settings().lang;
    closeModal();
    toast('Settings saved');
  });
}

// ---------- AI chat ----------
const SUGGESTIONS = {
  step: ['Which part is this?', 'Which way does it face?', 'I think a screw is missing', 'This joint won\'t close'],
  manual: ['What does this step mean?', 'Which screw is this?', 'What order do I do this in?'],
};

function openChat(mode) {
  if (state.chatMode !== mode) state.chat = [];
  state.chatMode = mode;
  state.pending = [];
  const title = mode === 'manual' ? 'Help with any manual' : `Ask about step ${state.step + 1}`;
  openModal(`
    <header class="modal-head"><strong>${esc(title)}</strong><button class="icon-btn" data-act="close" aria-label="Close">${I.close}</button></header>
    <div class="msgs" id="msgs"></div>
    <div class="suggest">${SUGGESTIONS[mode].map((q) => `<button class="chip" data-q="${esc(q)}">${esc(q)}</button>`).join('')}</div>
    <div class="attach" id="attach"></div>
    <form class="composer" id="composer">
      <label class="icon-btn" aria-label="Add photo">${I.camera}<input type="file" accept="image/*" id="photo" hidden></label>
      <textarea id="q" rows="1" placeholder="${mode === 'manual' ? 'Add a photo of the page, then ask…' : 'Ask anything about this step…'}"></textarea>
      <button class="icon-btn send" type="submit" aria-label="Send">${I.send}</button>
    </form>`, 'chat');
  renderMsgs();
  document.getElementById('composer').addEventListener('submit', (e) => {
    e.preventDefault();
    const q = document.getElementById('q');
    sendChat(q.value);
    q.value = '';
  });
  document.getElementById('photo').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      state.pending.push(await imageToBlock(file));
      renderAttach();
    } catch (err) { toast(err.message); }
  });
}

function renderAttach() {
  const el = document.getElementById('attach');
  if (el) el.innerHTML = state.pending.map((p, i) => `<span class="thumb"><img src="${p.preview}" alt=""><button data-act="unattach" data-i="${i}" aria-label="Remove">×</button></span>`).join('');
}

function md(text) {
  return esc(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^[-•] (.*)$/gm, '<span class="li">$1</span>')
    .replace(/\n/g, '<br>');
}

function renderMsgs() {
  const el = document.getElementById('msgs');
  if (!el) return;
  const s = settings();
  const intro = state.chatMode === 'manual'
    ? 'Take a photo of the manual page you\'re stuck on and ask what it means. I\'ll walk you through it.'
    : `I know this ${state.product?.name} guide and that you're on “${state.product?.steps[state.step].title}”. Ask a question, or add a photo of your parts or manual.`;
  el.innerHTML = `
    <div class="msg ai">${esc(intro)}</div>
    ${!s.apiKey ? `<div class="msg warn">Add your Anthropic API key to use AI help. <button class="link" data-act="settings">Open Settings</button></div>` : ''}
    ${state.chat.map((m) => `<div class="msg ${m.role === 'user' ? 'me' : m.error ? 'warn' : 'ai'}">
      ${(m.previews || []).map((src) => `<img src="${src}" alt="">`).join('')}
      ${m.role === 'user' ? esc(m.text) : md(m.text)}
    </div>`).join('')}
    ${state.busy ? '<div class="msg ai typing"><i></i><i></i><i></i></div>' : ''}`;
  el.scrollTop = el.scrollHeight;
}

async function sendChat(text) {
  text = String(text || '').trim();
  const images = state.pending;
  if ((!text && !images.length) || state.busy) return;
  const s = settings();
  if (!s.apiKey) { openSettings(); return; }
  state.pending = [];
  renderAttach();
  const content = [...images.map((i) => i.block), { type: 'text', text: text || 'What does this show? Explain it for me.' }];
  state.chat.push({ role: 'user', text: text || '(photo)', content, previews: images.map((i) => i.preview) });
  state.busy = true;
  renderMsgs();
  try {
    const system = state.chatMode === 'manual' || !state.product ? MANUAL_MODE : stepSystemPrompt(state.product, state.step);
    const messages = state.chat.filter((m) => !m.error).map((m) => ({ role: m.role, content: m.role === 'user' ? m.content : m.text }));
    const reply = await askClaude({ apiKey: s.apiKey, model: s.model, system, messages });
    state.chat.push({ role: 'assistant', text: reply });
    if (voice?.listening && s.readAloud) voice.speak(reply.replace(/\*\*/g, ''));
  } catch (err) {
    state.chat.push({ role: 'assistant', text: err.message || 'Something went wrong.', error: true });
    // Drop the failed question from the API history so a retry starts clean.
    const lastUser = state.chat.length - 2;
    if (state.chat[lastUser]?.role === 'user') state.chat[lastUser].error = true;
  } finally {
    state.busy = false;
    renderMsgs();
  }
}

// ---------- global actions ----------
document.addEventListener('click', (e) => {
  const q = e.target.closest('[data-q]');
  if (q) return sendChat(q.dataset.q);
  const btn = e.target.closest('[data-act]');
  if (!btn) return;
  const act = btn.dataset.act;
  if (act === 'next') next();
  else if (act === 'prev') prev();
  else if (act === 'replay') viewer?.show(state.step);
  else if (act === 'mic') toggleVoice();
  else if (act === 'ask') openChat('step');
  else if (act === 'manual') openChat('manual');
  else if (act === 'parts') openParts();
  else if (act === 'settings') openSettings();
  else if (act === 'close') closeModal();
  else if (act === 'unattach') { state.pending.splice(Number(btn.dataset.i), 1); renderAttach(); }
});

document.addEventListener('keydown', (e) => {
  if (!state.product || e.target.closest('input, textarea, select')) return;
  if (e.key === 'ArrowRight') next();
  if (e.key === 'ArrowLeft') prev();
});

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

route();
