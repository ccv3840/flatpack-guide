// Hands-free control: speech recognition for commands, speech synthesis for reading steps.

const COMMANDS = [
  { cmd: 'next', re: /\b(next|continue|done|go on|weiter|nächster|naechster|fertig)\b/ },
  { cmd: 'prev', re: /\b(back|previous|go back|zurück|zurueck|vorher)\b/ },
  { cmd: 'replay', re: /\b(repeat|again|replay|show again|nochmal|wiederholen)\b/ },
  { cmd: 'read', re: /\b(read|what do i do|what now|vorlesen|was jetzt)\b/ },
  { cmd: 'parts', re: /\b(parts|hardware|inventory|teile)\b/ },
  { cmd: 'stop', re: /\b(stop listening|microphone off|mic off|stopp)\b/ },
];
const ASK = /^(?:hey\s+)?(?:ask|help|question|frage|hilfe)\b[\s,:]*(.*)$/;

export const voiceSupported = () => !!(window.SpeechRecognition || window.webkitSpeechRecognition);

export class Voice {
  constructor({ lang = 'en-US', onCommand, onHeard, onState }) {
    this.lang = lang;
    this.onCommand = onCommand;
    this.onHeard = onHeard;
    this.onState = onState;
    this.listening = false;
    this.speaking = false;
  }

  start() {
    const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Rec) return false;
    this.listening = true;
    this.rec = new Rec();
    this.rec.lang = this.lang;
    this.rec.continuous = true;
    this.rec.interimResults = false;
    this.rec.onresult = (e) => {
      if (this.speaking) return; // ignore our own voice
      const res = e.results[e.results.length - 1];
      if (!res.isFinal) return;
      const text = res[0].transcript.trim();
      this.onHeard?.(text);
      if (this.capture) {
        // The app asked for free text (e.g. a spoken question), not a command.
        const deliver = this.capture;
        this.capture = null;
        return deliver(text);
      }
      this.handle(text);
    };
    this.rec.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        this.listening = false;
        this.onState?.('denied');
      }
    };
    this.rec.onend = () => {
      // Safari ends sessions after silence; keep listening while enabled.
      if (this.listening) setTimeout(() => this.listening && this.safeStart(), 250);
      else this.onState?.('off');
    };
    this.safeStart();
    this.onState?.('on');
    return true;
  }

  safeStart() {
    try { this.rec.start(); } catch { /* already started */ }
  }

  stop() {
    this.listening = false;
    try { this.rec?.stop(); } catch { /* ignore */ }
    this.onState?.('off');
  }

  handle(raw) {
    const text = raw.toLowerCase().replace(/[.!?]/g, '').trim();
    const ask = text.match(ASK);
    if (ask) return this.onCommand('ask', ask[1]);
    const hit = COMMANDS.find((c) => c.re.test(text));
    if (hit) this.onCommand(hit.cmd);
  }

  speak(text) {
    if (!('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = this.lang;
    u.rate = 1.0;
    this.speaking = true;
    u.onend = u.onerror = () => { setTimeout(() => { this.speaking = false; }, 300); };
    speechSynthesis.speak(u);
  }
}
