// Pengenalan suara (Web Speech API), suara pasien (speechSynthesis), dan bunyi auskultasi sintetis.

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
export const micDidukung = Boolean(SR);
export const ttsDidukung = "speechSynthesis" in window;

// Brave menyediakan objek SpeechRecognition tetapi layanannya tidak berfungsi.
export let isBrave = false;
try {
  if (navigator.brave?.isBrave) isBrave = await navigator.brave.isBrave();
} catch { /* abaikan */ }

/**
 * Perekam suara kontinu berbahasa Indonesia.
 * onTeks(teks)  : dipanggil tiap ada hasil (termasuk sementara)
 * onJeda(teks)  : dipanggil bila pengguna diam selama jedaMs (untuk kirim otomatis)
 * onStatus(s)   : "mulai" | "berhenti" | "ditolak" | "jaringan" | "error"
 */
export class Perekam {
  constructor({ onTeks, onJeda, onStatus, jedaMs = 1700 } = {}) {
    this.o = { onTeks, onJeda, onStatus, jedaMs };
    this.aktif = false;
    this.dijeda = false;
    this.base = "";
    this.teksTerakhir = "";
    this.timer = null;
    this.rec = null;
  }

  _buatDanMulai() {
    const rec = new SR();
    rec.lang = "id-ID";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let fin = "";
      let inter = "";
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) fin += r[0].transcript + " ";
        else inter += r[0].transcript;
      }
      const teks = `${this.base} ${fin} ${inter}`.replace(/\s+/g, " ").trim();
      this.teksTerakhir = teks;
      this.o.onTeks?.(teks);
      clearTimeout(this.timer);
      if (this.o.onJeda) this.timer = setTimeout(() => this.o.onJeda?.(this.teksTerakhir), this.o.jedaMs);
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        this.aktif = false;
        this.o.onStatus?.("ditolak");
      } else if (e.error === "network") {
        // Layanan pengenalan suara tidak bisa dihubungi (internet mati, atau browser seperti Brave
        // yang tidak menyediakan layanan ini). Hentikan agar tidak terus mencoba.
        this.aktif = false;
        this.o.onStatus?.("jaringan");
      } else if (e.error !== "no-speech" && e.error !== "aborted") {
        this.o.onStatus?.("error");
      }
    };
    rec.onend = () => {
      this.base = this.teksTerakhir;
      if (this.aktif && !this.dijeda) {
        try { this._buatDanMulai(); } catch { /* abaikan */ }
      } else if (!this.aktif) {
        this.o.onStatus?.("berhenti");
      }
    };
    this.rec = rec;
    rec.start();
  }

  mulai(teksAwal = "") {
    if (!micDidukung) return;
    this.aktif = true;
    this.dijeda = false;
    this.base = teksAwal.trim();
    this.teksTerakhir = this.base;
    this._buatDanMulai();
    this.o.onStatus?.("mulai");
  }

  berhenti() {
    this.aktif = false;
    clearTimeout(this.timer);
    try { this.rec?.stop(); } catch { /* abaikan */ }
  }

  /** Kosongkan teks yang sudah ditampung (setelah pesan terkirim). */
  reset() {
    clearTimeout(this.timer);
    this.base = "";
    this.teksTerakhir = "";
    if (this.aktif && !this.dijeda) {
      try { this.rec?.abort(); } catch { /* abaikan */ }
    }
  }

  /** Hentikan sementara (misalnya saat pasien sedang berbicara). */
  jeda() {
    if (!this.aktif) return;
    this.dijeda = true;
    clearTimeout(this.timer);
    try { this.rec?.abort(); } catch { /* abaikan */ }
  }

  lanjut() {
    if (!this.aktif || !this.dijeda) return;
    this.dijeda = false;
    this.base = "";
    this.teksTerakhir = "";
    try { this._buatDanMulai(); } catch { /* abaikan */ }
  }
}

// ---------------- Suara pasien ----------------
let suaraId = null;
function muatSuara() {
  if (!ttsDidukung) return;
  const v = speechSynthesis.getVoices();
  suaraId = v.find((x) => /^id(-|_)?/i.test(x.lang)) || null;
}
if (ttsDidukung) {
  muatSuara();
  speechSynthesis.onvoiceschanged = muatSuara;
}

export function adaSuaraIndonesia() {
  return Boolean(suaraId);
}

export function bicara(teks, { jk, onSelesai } = {}) {
  if (!ttsDidukung) return onSelesai?.();
  const u = new SpeechSynthesisUtterance(teks.replace(/\.{2,}|…/g, ", "));
  u.lang = "id-ID";
  if (suaraId) u.voice = suaraId;
  u.rate = 1;
  u.pitch = jk === "Perempuan" ? 1.15 : 0.85;
  let selesai = false;
  const akhir = () => {
    if (selesai) return;
    selesai = true;
    onSelesai?.();
  };
  u.onend = akhir;
  u.onerror = akhir;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
  // pengaman bila event onend tidak terpanggil
  setTimeout(akhir, 1500 + teks.length * 90);
}

export function diam() {
  if (ttsDidukung) speechSynthesis.cancel();
}

// ---------------- Auskultasi sintetis ----------------
let ctxAudio = null;
let hentikanAktif = null;

/** jenis: "vesikuler" | "wheezing" | "ronki" ; mengembalikan fungsi stop */
export function putarAuskultasi(jenis = "vesikuler", durasi = 9) {
  hentikanAktif?.();
  ctxAudio = ctxAudio || new (window.AudioContext || window.webkitAudioContext)();
  const ctx = ctxAudio;
  const t0 = ctx.currentTime + 0.05;

  // derau putih
  const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource();
  noise.buffer = buf;
  noise.loop = true;
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 350;
  bp.Q.value = 0.7;
  const gNoise = ctx.createGain();
  gNoise.gain.value = 0;
  noise.connect(bp).connect(gNoise).connect(ctx.destination);

  const nodes = [noise];
  const siklus = jenis === "wheezing" ? 3.6 : 3.2;
  const insp = jenis === "wheezing" ? 1.1 : 1.4;
  const eksp = jenis === "wheezing" ? 2.1 : 1.0;

  let gWheeze = null;
  if (jenis === "wheezing") {
    gWheeze = ctx.createGain();
    gWheeze.gain.value = 0;
    gWheeze.connect(ctx.destination);
    for (const [f, amp] of [[420, 0.06], [610, 0.035], [880, 0.015]]) {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = f;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 5;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 6;
      lfo.connect(lfoGain).connect(osc.frequency);
      const g = ctx.createGain();
      g.gain.value = amp;
      osc.connect(g).connect(gWheeze);
      osc.start(t0);
      lfo.start(t0);
      nodes.push(osc, lfo);
    }
  }

  for (let t = t0; t < t0 + durasi; t += siklus) {
    // inspirasi
    gNoise.gain.setValueAtTime(0, t);
    gNoise.gain.linearRampToValueAtTime(0.32, t + insp * 0.4);
    gNoise.gain.linearRampToValueAtTime(0.0, t + insp);
    // ekspirasi
    const te = t + insp + 0.15;
    gNoise.gain.setValueAtTime(0, te);
    gNoise.gain.linearRampToValueAtTime(jenis === "wheezing" ? 0.18 : 0.1, te + 0.2);
    gNoise.gain.linearRampToValueAtTime(0, te + eksp);
    if (gWheeze) {
      gWheeze.gain.setValueAtTime(0, te);
      gWheeze.gain.linearRampToValueAtTime(1, te + 0.25);
      gWheeze.gain.setValueAtTime(1, te + eksp - 0.3);
      gWheeze.gain.linearRampToValueAtTime(0, te + eksp);
    }
  }
  noise.start(t0);
  const stop = () => {
    for (const n of nodes) {
      try { n.stop(); } catch { /* abaikan */ }
    }
    if (hentikanAktif === stop) hentikanAktif = null;
  };
  nodes.forEach((n) => { try { n.stop(t0 + durasi); } catch { /* abaikan */ } });
  hentikanAktif = stop;
  return stop;
}
