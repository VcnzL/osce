import { CASES, SISTEM } from "./cases.js";
import { FISIK_KATALOG, PENUNJANG_KATALOG } from "./katalog.js";
import { Perekam, micDidukung, ttsDidukung, bicara, diam, putarAuskultasi, adaSuaraIndonesia, isBrave } from "./suara.js";
import { jawabOffline, evaluasiOffline, BOBOT } from "./offline.js";
import { cocokPemeriksaan, tampakPemeriksaan } from "./fisik.js";

const PESAN_BRAVE = "Kamu memakai browser <b>Brave</b>. Brave tidak menyediakan layanan pengenalan suara, jadi mikrofon tidak bisa mengubah ucapan menjadi teks walaupun izinnya sudah diberikan. Buka aplikasi ini di <b>Google Chrome</b> atau <b>Microsoft Edge</b> untuk anamnesis lewat mic. Edge juga punya suara pasien berbahasa Indonesia yang lebih natural.";

// ======================= Utilitas =======================
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const tunda = (ms) => new Promise((r) => setTimeout(r, ms));
const inisial = (nama) => nama.split(" ").map((x) => x[0]).slice(0, 2).join("").toUpperCase();
const fmtWaktu = (d) => `${String(Math.floor(d / 60)).padStart(2, "0")}:${String(d % 60).padStart(2, "0")}`;
const fmtJam = (d) => [Math.floor(d / 3600), Math.floor((d % 3600) / 60), d % 60].map((x) => String(x).padStart(2, "0")).join(":");
const angka = (x) => String(Math.round(x * 100) / 100).replace(".", ",");

const simpan = {
  get(k, def) {
    try { const v = localStorage.getItem(k); return v === null ? def : JSON.parse(v); } catch { return def; }
  },
  set(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* penyimpanan tidak tersedia */ }
  },
};

const MAKS_PENUNJANG = 5;
const BATAS_LULUS = 60;
const TTV_ITEM = [
  { id: "kesadaran", nama: "Kesadaran" },
  { id: "td", nama: "Tekanan darah" },
  { id: "nadi", nama: "Nadi" },
  { id: "rr", nama: "Laju napas" },
  { id: "suhu", nama: "Suhu" },
  { id: "spo2", nama: "Saturasi O₂" },
  { id: "bbtb", nama: "Berat & tinggi badan" },
];
const TABS = [
  ["percakapan", "Percakapan"],
  ["fisik", "Pemeriksaan Fisik"],
  ["penunjang", "Data Penunjang"],
  ["diagnosis", "Diagnosis"],
  ["terapi", "Terapi"],
  ["edukasi", "Edukasi"],
];
const TAB_CHAT = new Set(["percakapan", "fisik"]);

// ======================= State =======================
const S = {
  ai: false,
  model: null,
  sesi: null,
  durasi: simpan.get("osce-durasi", 15),
  autoKirim: simpan.get("osce-autokirim", true),
  suaraPasien: simpan.get("osce-suara", true),
  filterSistem: simpan.get("osce-filter-sistem", "Semua"),
  cariKasus: "",
  filterStatus: simpan.get("osce-filter-status", "semua"),
  urutan: simpan.get("osce-urutan", "sudah-dulu"),
};
let perekamChat = null;
let perekamDikte = null;

// ======================= Notifikasi (toast) =======================
const CONTOH_PERTANYAAN = [
  "Sejak kapan keluhannya?",
  "Apakah ada demam?",
  "Sudah minum obat apa?",
  "Ada keluhan lain?",
  "Apakah pernah sakit seperti ini?",
  "Di keluarga ada yang sakit serupa?",
  "Apakah ada mual atau muntah?",
  "Bagaimana BAB dan BAK-nya?",
];
let toastTimer = null;
function toast({ judul, isi, jenis = "info", durasi = 7000 }) {
  $(".toast")?.remove();
  clearTimeout(toastTimer);
  const el = document.createElement("div");
  el.className = `toast ${jenis}`;
  el.setAttribute("role", "status");
  el.innerHTML = `<div class="toast-ikon">${jenis === "peringatan" ? "⚠️" : "ℹ️"}</div>
    <div><b>${esc(judul)}</b><div>${esc(isi)}</div></div>
    <button class="toast-tutup" aria-label="Tutup">✕</button>`;
  el.querySelector(".toast-tutup").onclick = () => el.remove();
  document.body.appendChild(el);
  toastTimer = setTimeout(() => el.remove(), durasi);
}

// ======================= Modal =======================
function bukaModal(html, { lebar = false } = {}) {
  $("#modalIsi").innerHTML = html;
  $(".modal-box").classList.toggle("lebar", lebar);
  $("#modal").hidden = false;
}
function tutupModal() {
  $("#modal").hidden = true;
  $("#modalIsi").innerHTML = "";
}
$("#modal").addEventListener("click", (e) => {
  if (e.target.id === "modal" || e.target.closest("[data-tutup]")) tutupModal();
});
function konfirmasi({ judul, isi, ya = "Ya", tidak = "Batal", ikon = "⚠️", warnaYa = "merah" }) {
  return new Promise((resolve) => {
    bukaModal(`
      <div class="modal-ikon">${ikon}</div>
      <h2>${judul}</h2>
      <p class="muted">${isi}</p>
      <div class="modal-aksi">
        ${tidak ? `<button class="btn garis" id="mTidak">${tidak}</button>` : ""}
        <button class="btn ${warnaYa}" id="mYa">${ya}</button>
      </div>`);
    $("#mYa").onclick = () => { tutupModal(); resolve(true); };
    const t = $("#mTidak");
    if (t) t.onclick = () => { tutupModal(); resolve(false); };
  });
}
function perbesarGambar(src, judul) {
  bukaModal(`<h3 style="text-align:left">${esc(judul)}</h3><img src="${esc(src)}" alt="${esc(judul)}"><div class="modal-aksi"><button class="btn garis" data-tutup>Tutup</button></div>`, { lebar: true });
}

// ======================= Navigasi =======================
function setNav(view) {
  $$(".nav-item").forEach((b) => b.classList.toggle("aktif", b.dataset.view === view));
}

// Menu samping berupa laci dari kiri (semua perangkat): dibuka dengan ☰ hanya saat dibutuhkan.
const appEl = $("#app");
function aturMenu({ buka } = {}) {
  if (buka !== undefined) {
    appEl.classList.toggle("nav-buka", buka);
    document.body.classList.toggle("kunci-gulir", buka);
    if (buka) setTimeout(() => $("#nav .nav-item.aktif, #nav .nav-item")?.focus({ preventScroll: true }), 50);
  }
  $("#btnMenu").setAttribute("aria-expanded", String(appEl.classList.contains("nav-buka")));
}
$("#btnMenu").onclick = () => aturMenu({ buka: true });
$("#btnTutupNav").onclick = () => aturMenu({ buka: false });
$("#navLatar").onclick = () => aturMenu({ buka: false });
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && appEl.classList.contains("nav-buka")) aturMenu({ buka: false });
  // Ctrl/Cmd + B: buka/tutup menu
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
    e.preventDefault();
    aturMenu({ buka: !appEl.classList.contains("nav-buka") });
  }
});
// Geser ke kiri pada laci untuk menutupnya (layar sentuh)
let sentuhX = null;
$("#nav").addEventListener("touchstart", (e) => { sentuhX = e.touches[0].clientX; }, { passive: true });
$("#nav").addEventListener("touchend", (e) => {
  if (sentuhX !== null && e.changedTouches[0].clientX - sentuhX < -60) aturMenu({ buka: false });
  sentuhX = null;
}, { passive: true });
aturMenu();
$$(".nav-item").forEach((b) =>
  b.addEventListener("click", async () => {
    aturMenu({ buka: false });
    if (S.sesi && !S.sesi.selesai) {
      const ok = await konfirmasi({ judul: "Tinggalkan sesi?", isi: "Sesi yang sedang berjalan akan dibatalkan dan tidak dinilai.", ya: "Tinggalkan" });
      if (!ok) return;
      batalkanSesi();
    }
    tampil(b.dataset.view);
  }),
);
window.addEventListener("beforeunload", (e) => {
  if (S.sesi && !S.sesi.selesai) {
    e.preventDefault();
    e.returnValue = "";
  }
});

function tampil(view, arg) {
  setNav(view === "evaluasi" ? (arg?.dariRiwayat ? "riwayat" : "beranda") : view);
  const fn = { beranda: viewBeranda, riwayat: viewRiwayat, panduan: viewPanduan, evaluasi: viewEvaluasi }[view];
  fn?.(arg);
  judulAtas({ beranda: "Latihan Kasus", riwayat: "Riwayat Sesi", panduan: "Panduan", evaluasi: "Hasil Latihan" }[view]);
  window.scrollTo(0, 0);
}
function judulAtas(teks) {
  $("#topbarJudul").textContent = teks || "Simulasi OSCE";
}

// ======================= Status =======================
async function cekStatus() {
  // Server AI hanya ada saat aplikasi dijalankan di komputer sendiri (localhost).
  // Di hosting statis (GitHub Pages dll.) langsung memakai mode latihan tanpa server.
  const lokal = ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname);
  try {
    if (!lokal) throw new Error("hosting statis");
    const r = await fetch("/api/status");
    const j = await r.json();
    S.ai = Boolean(j.ai);
    S.model = j.model;
  } catch {
    S.ai = false;
  }
  $("#statusMode").innerHTML = S.ai
    ? `<b>● Mode AI aktif</b>Pasien &amp; penilaian oleh Claude`
    : `<b>💾 Progres tersimpan</b>di browser perangkat ini`;
}

// ======================= Beranda =======================
function viewBeranda() {
  const opsiDurasi = [10, 15, 20, 0].map((m) => `<option value="${m}" ${S.durasi === m ? "selected" : ""}>${m ? m + " menit" : "Tanpa batas"}</option>`).join("");
  $("#main").innerHTML = `
    <div class="hero">
      <div>
        <h1>Latihan Kasus OSCE</h1>
        <div class="muted">Percakapan dengan suara → pemeriksaan fisik → penunjang → diagnosis → terapi → edukasi.</div>
      </div>
      <label class="baris"><span class="muted">Durasi stasion</span>
        <select class="input" id="durasi" style="width:auto">${opsiDurasi}</select>
      </label>
    </div>
    ${isBrave ? `<div class="info-box kuning">🎙️ ${PESAN_BRAVE}</div>` : ""}
    ${!micDidukung ? `<div class="info-box kuning">🎙️ Browser ini belum mendukung pengenalan suara. Gunakan <b>Google Chrome</b> atau <b>Microsoft Edge</b> agar bisa anamnesis lewat mikrofon. Kamu tetap bisa mengetik.</div>` : ""}
    <div class="filter-kasus">
      <input class="input" id="cariKasus" type="search" placeholder="Cari kasus atau keluhan… (mis. mata merah, pusing)" value="${esc(S.cariKasus)}">
      <div class="chips" id="chipSistem"></div>
    </div>
    <div class="card panel-progres">
      <div id="ringkasProgres"></div>
      <div class="toolbar-kasus">
        <div class="segmen" id="segStatus" role="group" aria-label="Saring status">
          <button data-status="semua">Semua <span></span></button>
          <button data-status="belum" title="Belum dikerjakan">Belum <span></span></button>
          <button data-status="sudah">✓ Sudah <span></span></button>
        </div>
        <label class="baris urut"><span class="muted">Urutkan</span>
          <select class="input" id="urutan">
            <option value="sudah-dulu" ${S.urutan === "sudah-dulu" ? "selected" : ""}>Sudah dikerjakan di atas</option>
            <option value="belum-dulu" ${S.urutan === "belum-dulu" ? "selected" : ""}>Belum dikerjakan di atas</option>
            <option value="bawaan" ${S.urutan === "bawaan" ? "selected" : ""}>Urutan bawaan</option>
          </select>
        </label>
      </div>
    </div>
    <div class="grid-kasus" id="gridKasus"></div>`;
  $$("#segStatus [data-status]").forEach((b) => (b.onclick = () => {
    S.filterStatus = b.dataset.status;
    simpan.set("osce-filter-status", S.filterStatus);
    renderDaftarKasus();
  }));
  $("#urutan").onchange = (e) => {
    S.urutan = e.target.value;
    simpan.set("osce-urutan", S.urutan);
    renderDaftarKasus();
  };
  $("#durasi").onchange = (e) => {
    S.durasi = Number(e.target.value);
    simpan.set("osce-durasi", S.durasi);
  };
  $("#cariKasus").oninput = (e) => {
    S.cariKasus = e.target.value;
    renderDaftarKasus();
  };
  renderDaftarKasus();
}

// ---------- Progres per kasus ----------
// Disimpan terpisah dari riwayat sesi (riwayat dibatasi 40 sesi terakhir), jadi tanda "sudah dikerjakan" tidak hilang.
function catatProgres(peta, r) {
  const s = typeof r.total === "number" ? r.total : null;
  const lama = peta[r.caseId] || { kali: 0, terbaik: null, terakhir: null };
  peta[r.caseId] = {
    kali: lama.kali + 1,
    terbaik: s === null ? lama.terbaik : Math.max(lama.terbaik ?? 0, s),
    terakhir: !lama.terakhir || r.tanggal > lama.terakhir ? r.tanggal : lama.terakhir,
  };
}
function bacaProgres() {
  const ada = simpan.get("osce-progres", null);
  if (ada) return ada;
  const baru = {}; // pertama kali: bangun dari riwayat lama
  for (const r of simpan.get("osce-riwayat", [])) catatProgres(baru, r);
  simpan.set("osce-progres", baru);
  return baru;
}
const statusKasus = (pr) => (!pr ? "belum" : (pr.terbaik ?? 0) >= BATAS_LULUS ? "lulus" : "dicoba");
const fmtTanggalPendek = (iso) => (iso ? new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short" }) : "");

function renderDaftarKasus() {
  const q = (S.cariKasus || "").toLowerCase().trim();
  const cocokCari = (k) => !q || [k.judul, k.skenario, k.sistem, k.pasien.keluhanUtama].join(" ").toLowerCase().includes(q);
  const hitung = (sis) => CASES.filter((k) => (sis === "Semua" || k.sistem === sis) && cocokCari(k)).length;
  const sistemAda = ["Semua", ...SISTEM.filter((s) => CASES.some((k) => k.sistem === s))];
  if (!sistemAda.includes(S.filterSistem)) S.filterSistem = "Semua";
  const prog = bacaProgres();
  const hitungSudah = (sis) => CASES.filter((k) => (sis === "Semua" || k.sistem === sis) && cocokCari(k) && prog[k.id]).length;
  $("#chipSistem").innerHTML = sistemAda.map((s) => {
    const n = hitung(s), sudah = hitungSudah(s);
    const tuntas = n > 0 && sudah === n;
    return `<button class="chip ${S.filterSistem === s ? "aktif" : ""} ${tuntas ? "tuntas" : ""}" data-sistem="${esc(s)}" title="${sudah} dari ${n} sudah dikerjakan">${tuntas ? "✓ " : ""}${esc(s)} <span>${sudah ? `${sudah}/${n}` : n}</span></button>`;
  }).join("");
  $$("#chipSistem [data-sistem]").forEach((b) => (b.onclick = () => {
    S.filterSistem = b.dataset.sistem;
    simpan.set("osce-filter-sistem", S.filterSistem);
    renderDaftarKasus();
  }));
  const diSistem = CASES.filter((k) => (S.filterSistem === "Semua" || k.sistem === S.filterSistem) && cocokCari(k));

  // Ringkasan progres untuk kategori yang dipilih
  const jmlSudah = diSistem.filter((k) => prog[k.id]).length;
  const jmlLulus = diSistem.filter((k) => statusKasus(prog[k.id]) === "lulus").length;
  const pct = diSistem.length ? Math.round((jmlSudah / diSistem.length) * 100) : 0;
  $("#ringkasProgres").innerHTML = `
    <div class="progres-teks"><span><b>${jmlSudah}</b> dari ${diSistem.length} kasus${S.filterSistem === "Semua" ? "" : ` ${esc(S.filterSistem)}`} sudah dikerjakan</span>
      <span class="muted">${jmlLulus} lulus · ${diSistem.length - jmlSudah} belum</span></div>
    <div class="progres-bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><span style="width:${pct}%"></span></div>`;
  const jmlStatus = { semua: diSistem.length, belum: diSistem.length - jmlSudah, sudah: jmlSudah };
  $$("#segStatus [data-status]").forEach((b) => {
    b.classList.toggle("aktif", b.dataset.status === S.filterStatus);
    b.querySelector("span").textContent = jmlStatus[b.dataset.status];
  });

  const urutAsli = new Map(CASES.map((k, i) => [k.id, i]));
  let daftar = diSistem.filter((k) => S.filterStatus === "semua" || (S.filterStatus === "sudah" ? prog[k.id] : !prog[k.id]));
  if (S.urutan !== "bawaan") {
    const sudahDulu = S.urutan === "sudah-dulu";
    daftar = [...daftar].sort((a, b) => {
      const pa = prog[a.id], pb = prog[b.id];
      if (!!pa !== !!pb) return (pa ? -1 : 1) * (sudahDulu ? 1 : -1);
      if (pa && pb) return pb.terakhir.localeCompare(pa.terakhir); // terbaru dikerjakan di atas
      return urutAsli.get(a.id) - urutAsli.get(b.id);
    });
  }

  $("#gridKasus").innerHTML = daftar.length ? daftar.map((k) => {
    const pr = prog[k.id];
    const st = statusKasus(pr);
    const info = pr ? `
          <div class="kasus-progres ${st}">
            <b>${st === "lulus" ? "✓ Lulus" : "✓ Sudah dicoba"}</b>${typeof pr.terbaik === "number" ? ` · skor terbaik ${Math.round(pr.terbaik)}` : ""}
            <small>${pr.kali}× dikerjakan · terakhir ${fmtTanggalPendek(pr.terakhir)}</small>
          </div>` : "";
    return `
        <div class="card kasus-card ${pr ? `selesai ${st}` : ""}">
          ${pr ? `<span class="tanda-selesai" title="${st === "lulus" ? "Sudah dikerjakan dan lulus" : "Sudah dikerjakan, belum lulus"}" aria-label="Sudah dikerjakan">✓</span>` : ""}
          <div class="baris"><span class="badge">${esc(k.sistem)}</span><span class="badge ${k.tingkat === "Mudah" ? "biru" : k.tingkat === "Sulit" ? "merah" : "oranye"}">${esc(k.tingkat)}</span></div>
          <h2 style="margin:0">${esc(k.judul)}</h2>
          <p>${esc(k.skenario)}</p>
          ${info}
          <button class="btn ${pr ? "garis" : ""}" data-mulai="${k.id}">${pr ? "↻ Ulangi stasion" : "Mulai stasion"}</button>
        </div>`;
  }).join("") : `<div class="card kosong">${S.filterStatus === "belum" && diSistem.length ? "🎉 Semua kasus di kategori ini sudah kamu kerjakan!" : S.filterStatus === "sudah" ? "Belum ada kasus yang dikerjakan di kategori ini." : "Tidak ada kasus yang cocok dengan pencarian."}</div>`;
  $$("[data-mulai]").forEach((b) => (b.onclick = () => persiapanSesi(b.dataset.mulai)));
}

// ======================= Persiapan sesi (izin mikrofon) =======================
async function statusIzinMic() {
  if (!navigator.mediaDevices?.getUserMedia) return "tidak-didukung";
  try {
    const p = await navigator.permissions?.query({ name: "microphone" });
    if (p) return p.state; // granted | denied | prompt
  } catch { /* sebagian browser tidak mendukung query mikrofon */ }
  return "prompt";
}

async function persiapanSesi(id) {
  const kasus = CASES.find((k) => k.id === id);
  if (!kasus) return;
  setNav("beranda");
  judulAtas("Persiapan Sesi");
  window.scrollTo(0, 0);
  $("#main").innerHTML = `
    <div class="persiapan">
      <div class="persiapan-ikon">🎙️</div>
      <h1>Persiapan Sesi</h1>
      <p class="muted">Sebelum memulai sesi, kami membutuhkan akses ke mikrofon agar kamu bisa melakukan anamnesis dengan suara seperti ujian sungguhan.</p>
      <div class="persiapan-kasus"><span class="badge">${esc(kasus.sistem)}</span> <b>${esc(kasus.judul)}</b></div>
      <div class="persiapan-mic" id="kartuMic">
        <div class="persiapan-mic-ikon">🎤</div>
        <div class="persiapan-mic-teks">
          <b>Akses Mikrofon</b>
          <small class="muted">Diperlukan agar sistem dapat mendengar dan memproses suaramu</small>
          <span class="badge abu" id="badgeMic">Memeriksa…</span>
        </div>
        <button class="btn" id="btnIzinMic">Izinkan</button>
      </div>
      <div class="persiapan-info">
        <div class="persiapan-info-kartu"><b>🛡️ Privasi &amp; Keamanan</b><small>Suaramu hanya diubah menjadi teks oleh layanan browser. Tidak ada rekaman yang disimpan aplikasi ini.</small></div>
        <div class="persiapan-info-kartu"><b>🎧 Kualitas Audio</b><small>Pilih ruangan yang tenang dan gunakan earphone agar suara pasien tidak ikut terekam.</small></div>
      </div>
      <div class="persiapan-status" id="statusSiap"></div>
      <div class="persiapan-aksi">
        <button class="btn garis" id="btnKembali">✕ Kembali ke Daftar Kasus</button>
        <button class="btn" id="btnMulaiSesi" disabled>Mulai Sesi</button>
      </div>
    </div>`;

  const perbarui = (state) => {
    const badge = $("#badgeMic"), tombol = $("#btnIzinMic"), status = $("#statusSiap"), mulai = $("#btnMulaiSesi");
    if (!badge) return; // pengguna sudah pindah halaman
    const tanpaSuara = !micDidukung || isBrave;
    $("#kartuMic").className = `persiapan-mic ${state === "granted" ? "ok" : state === "denied" ? "tolak" : ""}`;
    if (state === "granted") {
      badge.className = "badge hijau"; badge.textContent = "✓ Diizinkan";
      tombol.disabled = true; tombol.textContent = "✓ Diizinkan"; tombol.className = "btn garis";
    } else if (state === "denied") {
      badge.className = "badge merah"; badge.textContent = "✕ Ditolak";
      tombol.disabled = false; tombol.textContent = "Coba lagi"; tombol.className = "btn";
    } else if (state === "tidak-didukung") {
      badge.className = "badge oranye"; badge.textContent = "Tidak didukung browser ini";
      tombol.disabled = true; tombol.className = "btn garis";
    } else {
      badge.className = "badge abu"; badge.textContent = "Belum diizinkan";
      tombol.disabled = false; tombol.textContent = "Izinkan"; tombol.className = "btn";
    }
    let pesan, jenis;
    if (state === "granted" && !tanpaSuara) { pesan = "✅ Semua siap! Kamu dapat memulai sesi sekarang."; jenis = "ok"; }
    else if (state === "granted") { pesan = isBrave ? `⚠️ ${PESAN_BRAVE} Kamu tetap bisa mengetik pertanyaan.` : "⚠️ Mikrofon diizinkan, tetapi browser ini belum bisa mengubah suara menjadi teks. Gunakan Chrome atau Edge, atau ketik pertanyaanmu."; jenis = "kuning"; }
    else if (state === "denied") { pesan = "⚠️ Akses mikrofon ditolak. Izinkan lewat ikon gembok/kamera di samping alamat situs, lalu tekan “Coba lagi”. Kamu juga bisa mulai dan mengetik pertanyaan."; jenis = "kuning"; }
    else if (state === "tidak-didukung") { pesan = "⚠️ Browser ini tidak mendukung mikrofon. Gunakan Chrome atau Edge, atau mulai dan ketik pertanyaanmu."; jenis = "kuning"; }
    else { pesan = "Tekan <b>Izinkan</b>, lalu pilih <b>Izinkan/Allow</b> pada jendela browser."; jenis = ""; }
    status.className = `persiapan-status ${jenis}`;
    status.innerHTML = pesan;
    // Mulai baru aktif setelah izin diputuskan (diizinkan, ditolak, atau memang tidak didukung)
    mulai.disabled = state === "prompt";
    mulai.textContent = state === "granted" && !tanpaSuara ? "Mulai Sesi" : state === "prompt" ? "Mulai Sesi" : "Mulai tanpa mikrofon";
  };

  $("#btnKembali").onclick = () => tampil("beranda");
  $("#btnMulaiSesi").onclick = () => mulaiSesi(id);
  $("#btnIzinMic").onclick = async () => {
    const tombol = $("#btnIzinMic");
    tombol.disabled = true; tombol.textContent = "Menunggu izin…";
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop()); // hanya meminta izin, tidak merekam
      perbarui("granted");
    } catch (e) {
      perbarui(e?.name === "NotFoundError" ? "tidak-didukung" : "denied");
      if (e?.name === "NotFoundError") $("#statusSiap").innerHTML = "⚠️ Mikrofon tidak ditemukan di perangkat ini. Kamu tetap bisa mulai dan mengetik pertanyaan.";
    }
  };

  const awal = await statusIzinMic();
  perbarui(awal);
  try {
    const p = await navigator.permissions?.query({ name: "microphone" });
    if (p) p.onchange = () => perbarui(p.state);
  } catch { /* abaikan */ }
}

// ======================= Sesi =======================
function mulaiSesi(id) {
  const kasus = CASES.find((k) => k.id === id);
  S.sesi = {
    kasus,
    mulai: Date.now(),
    batasDetik: S.durasi ? S.durasi * 60 : 0,
    tab: "percakapan",
    riwayat: [], // khusus dialog dokter-pasien (untuk AI & penilaian anamnesis)
    logPercakapan: [], // tampilan tab Percakapan (termasuk hasil dari SISTEM)
    logFisik: [], // tampilan tab Pemeriksaan Fisik
    ttv: [],
    fisik: [],
    penunjang: [],
    pilihan: new Set(),
    diagnosis: { utama: "", banding: ["", ""] },
    tatalaksana: "",
    edukasi: "",
    menunggu: false,
    selesai: false,
    aiGagal: false,
    aiFisikGagal: false,
    sudahDijawab: new Set(),
    gagal: 0,
    timerId: null,
  };
  renderSesi();
  judulAtas(kasus.judul);
  S.sesi.timerId = setInterval(tikTimer, 1000);
  tikTimer();
}

function batalkanSesi() {
  if (!S.sesi) return;
  clearInterval(S.sesi.timerId);
  perekamChat?.berhenti();
  perekamDikte?.berhenti();
  diam();
  S.sesi = null;
}

function detikBerjalan() {
  return Math.floor((Date.now() - S.sesi.mulai) / 1000);
}

function tikTimer() {
  const s = S.sesi;
  if (!s || s.selesai) return;
  const el = $("#timer");
  if (!el) return;
  const jalan = detikBerjalan();
  if (s.batasDetik) {
    const sisa = Math.max(0, s.batasDetik - jalan);
    $("#timerAngka").textContent = fmtJam(sisa);
    el.classList.toggle("kuning", sisa <= 300 && sisa > 120);
    el.classList.toggle("merah", sisa <= 120);
    if (sisa === 0) waktuHabis();
  } else {
    $("#timerAngka").textContent = fmtJam(jalan);
  }
}

async function waktuHabis() {
  if (S.sesi.selesai) return;
  clearInterval(S.sesi.timerId);
  perekamChat?.berhenti();
  perekamDikte?.berhenti();
  diam();
  await konfirmasi({ judul: "Waktu habis", isi: "Waktu stasion sudah selesai. Penampilanmu akan dinilai sekarang.", ya: "Lihat analisis", tidak: null, ikon: "⏰", warnaYa: "" });
  selesaikanSesi();
}

function renderSesi() {
  const s = S.sesi;
  const k = s.kasus;
  const p = k.pasien;
  $("#main").innerHTML = `
    <div class="sesi">
      <div class="sisi">
        <div class="timer" id="timer">
          <div class="timer-ikon">⏱</div>
          <div><small>${s.batasDetik ? "WAKTU TERSISA" : "WAKTU BERJALAN"}</small><b id="timerAngka">00:00:00</b></div>
        </div>
        <div class="card kartu-tugas">
          <div class="pasien-kartu">
            <div class="avatar">${esc(inisial(p.nama))}</div>
            <div><b>${esc(k.judul)}</b><div class="muted" style="font-size:13px">${esc(p.jk)}, ${esc(p.usiaTeks || `${p.usia} tahun`)}</div></div>
          </div>
          <details class="tugas" style="margin-top:14px" open>
            <summary><h3>Tugas</h3><span class="tugas-panah" aria-hidden="true">▾</span></summary>
            <div style="font-size:14px">${esc(k.skenario)}</div>
            <ol>${k.tugas.map((t) => `<li>${esc(t)}</li>`).join("")}</ol>
          </details>
        </div>
        <div class="card kartu-setelan">
          <label class="saklar"><span>Kirim otomatis <span class="muted" id="labelAuto">${S.autoKirim ? "aktif" : "mati"}</span></span>
            <span class="toggle"><input type="checkbox" id="swAuto" ${S.autoKirim ? "checked" : ""}><span></span></span></label>
          <label class="saklar"><span>Suara pasien${ttsDidukung && !adaSuaraIndonesia() ? " <small class='muted'>(suara Indonesia tidak ditemukan)</small>" : ""}</span>
            <span class="toggle"><input type="checkbox" id="swSuara" ${S.suaraPasien ? "checked" : ""} ${ttsDidukung ? "" : "disabled"}><span></span></span></label>
          <div class="catatan-saklar">💡 Kalau suara pasien mengganggu atau ikut terekam mikrofon, matikan saja. Jawaban pasien tetap muncul sebagai teks.</div>
          ${S.ai ? `<div class="muted" style="font-size:12px;margin-top:6px">Mode AI · ${esc(S.model || "")}</div>` : ""}
        </div>
        <button class="btn merah" id="btnAkhiri">✕ Akhiri Sesi</button>
      </div>
      <div class="card panel-utama">
        <div class="tabs" id="tabs">${TABS.map(([id, nama]) => `<button class="tab" data-tab="${id}">${nama}</button>`).join("")}</div>
        <div id="panel"></div>
      </div>
    </div>`;
  // Di HP, tugas dilipat agar panel percakapan langsung terlihat (bisa dibuka kapan saja)
  if (window.matchMedia("(max-width: 760px)").matches) $(".tugas").open = false;
  $("#swAuto").onchange = (e) => {
    S.autoKirim = e.target.checked;
    simpan.set("osce-autokirim", S.autoKirim);
    $("#labelAuto").textContent = S.autoKirim ? "aktif" : "mati";
    aturCatatanMic();
  };
  $("#swSuara").onchange = (e) => {
    S.suaraPasien = e.target.checked;
    simpan.set("osce-suara", S.suaraPasien);
    if (!S.suaraPasien) diam();
  };
  $("#btnAkhiri").onclick = async () => {
    const ok = await konfirmasi({ judul: "Akhiri Sesi?", isi: "Apakah Anda yakin ingin mengakhiri sesi ini? Pastikan semua jawaban Anda sudah tersimpan.", ya: "Ya", tidak: "Batal" });
    if (ok) selesaikanSesi();
  };
  $$("#tabs .tab").forEach((b) => (b.onclick = () => gantiTab(b.dataset.tab)));
  gantiTab(s.tab);
}

function tandaiTab() {
  const s = S.sesi;
  if (!s) return;
  const terisi = {
    percakapan: s.riwayat.length > 0,
    fisik: s.fisik.length > 0 || s.ttv.length > 0,
    penunjang: s.penunjang.length > 0,
    diagnosis: Boolean(s.diagnosis.utama.trim()),
    terapi: Boolean(s.tatalaksana.trim()),
    edukasi: Boolean(s.edukasi.trim()),
  };
  $$("#tabs .tab").forEach((b) => {
    b.classList.toggle("aktif", b.dataset.tab === s.tab);
    const nama = TABS.find((t) => t[0] === b.dataset.tab)[1];
    b.innerHTML = `${terisi[b.dataset.tab] ? '<span class="titik"></span>' : ""}${nama}`;
  });
}

function gantiTab(tab) {
  const s = S.sesi;
  perekamDikte?.berhenti();
  if (!TAB_CHAT.has(tab)) perekamChat?.berhenti();
  s.tab = tab;
  tandaiTab();
  ({ percakapan: panelPercakapan, fisik: panelFisik, penunjang: panelPenunjang, diagnosis: panelDiagnosis, terapi: panelTerapi, edukasi: panelEdukasi })[tab]();
}

// ======================= Komponen chat =======================
function hasilFisik(id) {
  const kat = FISIK_KATALOG.find((f) => f.id === id);
  const o = S.sesi?.kasus.fisik[id] || {};
  return { nama: kat.nama, hasil: o.hasil || kat.normal, gambar: o.gambar, abnormal: Boolean(o.abnormal), suara: o.suara || kat.suara };
}

function bubbleHTML(r, kasus) {
  if (r.role === "info") return `<div class="pesan tengah"><div class="bubble info">${esc(r.text)}</div></div>`;
  if (r.role === "dokter") {
    return `<div class="pesan kanan"><div class="bubble dokter"><div class="kepala"><span class="ava d">D</span>Anda</div><div class="isi">${esc(r.text)}</div></div></div>`;
  }
  if (r.role === "pasien") {
    return `<div class="pesan"><div class="bubble pasien"><div class="kepala"><span class="ava p">P</span>Pasien</div><div class="isi">${esc(r.text)}</div></div></div>`;
  }
  // sistem
  let isi = r.text ? `<div>${esc(r.text)}</div>` : "";
  if (r.ttv?.length || r.fisik?.length) {
    isi += `<div class="hasil-judul">Anda mendapatkan hasil:</div><ul class="hasil-ul">`;
    for (const t of r.ttv || []) {
      const item = TTV_ITEM.find((x) => x.id === t);
      isi += `<li><b>${esc(item.nama)}:</b> ${esc(kasus.ttv[t])}</li>`;
    }
    for (const id of r.fisik || []) {
      const h = hasilFisik(id);
      isi += `<li class="${h.abnormal ? "abn" : ""}"><b>${esc(h.nama)}:</b> <span class="pre">${esc(h.hasil)}</span>
        ${h.suara ? `<div><button class="btn sekunder kecil" data-suara="${h.suara}">🔊 Dengarkan bunyi</button></div>` : ""}
        ${h.gambar ? `<img class="gambar-temuan" src="${esc(h.gambar)}" alt="${esc(h.nama)}" data-zoom="${esc(h.nama)}">` : ""}</li>`;
    }
    isi += `</ul>`;
  }
  return `<div class="pesan"><div class="bubble sistem"><div class="kepala"><span class="ava s">S</span>Sistem</div><div class="isi">${isi}</div></div></div>`;
}

function pasangAksiBubble(root) {
  $$("[data-zoom]", root).forEach((img) => (img.onclick = () => perbesarGambar(img.getAttribute("src"), img.dataset.zoom)));
  $$("[data-suara]", root).forEach((b) => (b.onclick = () => putarAuskultasi(b.dataset.suara)));
}

function logAktif() {
  const s = S.sesi;
  return s.tab === "fisik" ? s.logFisik : s.logPercakapan;
}

function panelChat({ log, panduan, kosong, placeholder, ekstra = "" }) {
  const s = S.sesi;
  $("#panel").innerHTML = `
    <div class="panduan"><div class="panduan-judul">Panduan</div><p>${panduan}</p>${ekstra}</div>
    <div class="chat" id="chat">
      ${log.length ? log.map((r) => bubbleHTML(r, s.kasus)).join("") : `<div class="chat-kosong">${kosong}</div>`}
    </div>
    <div class="komposer">
      <textarea class="input" id="masukan" rows="2" placeholder="${esc(placeholder)}"></textarea>
      <div class="rekam-baris">
        <button class="btn btn-rekam" id="btnRekam" ${micDidukung ? "" : "disabled"}>🎙️ MULAI REKAM</button>
        <button class="btn sekunder btn-kirim" id="btnKirim" title="Kirim">➤</button>
      </div>
      <div class="catatan-kecil" id="catatanMic"></div>
    </div>`;
  const chat = $("#chat");
  pasangAksiBubble(chat);
  chat.scrollTop = chat.scrollHeight;
  const masukan = $("#masukan");
  masukan.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      kirimChat(masukan.value);
    }
  });
  $("#btnKirim").onclick = () => kirimChat(masukan.value);

  if (!perekamChat) {
    perekamChat = new Perekam({
      onTeks: (t) => {
        const m = $("#masukan");
        if (m) m.value = t;
      },
      onJeda: (t) => {
        if (S.autoKirim && S.sesi && TAB_CHAT.has(S.sesi.tab) && t.trim() && !S.sesi.menunggu) kirimChat(t);
      },
      onStatus: (st) => {
        aturTombolRekam();
        if (st === "ditolak") konfirmasi({ judul: "Mikrofon diblokir", isi: "Izinkan akses mikrofon untuk situs ini (ikon gembok/kamera di bilah alamat), lalu coba lagi.", ya: "Mengerti", tidak: null, ikon: "🎙️", warnaYa: "" });
        if (st === "jaringan") {
          if (isBrave) konfirmasi({ judul: "Mic tidak bisa dipakai di Brave", isi: PESAN_BRAVE, ya: "Mengerti", tidak: null, ikon: "🎙️", warnaYa: "" });
          else toast({ jenis: "peringatan", judul: "Pengenalan suara gagal", isi: "Layanan pengenalan suara tidak bisa dihubungi. Pastikan internet tersambung dan kamu memakai Chrome/Edge, atau ketik saja." });
        }
      },
    });
  }
  $("#btnRekam").onclick = () => {
    if (perekamChat.aktif) perekamChat.berhenti();
    else {
      perekamDikte?.berhenti();
      diam();
      perekamChat.mulai($("#masukan").value);
    }
    aturTombolRekam();
  };
  aturTombolRekam();
  aturCatatanMic();
  masukan.focus();
}

function aturTombolRekam() {
  const b = $("#btnRekam");
  if (!b) return;
  const aktif = perekamChat?.aktif;
  b.classList.toggle("aktif", Boolean(aktif));
  b.innerHTML = aktif ? "🔴 MEREKAM… (klik untuk berhenti)" : "🎙️ MULAI REKAM";
}

function aturCatatanMic() {
  const c = $("#catatanMic");
  if (!c) return;
  c.textContent = !micDidukung
    ? "Pengenalan suara hanya tersedia di Chrome/Edge."
    : S.autoKirim
      ? "Mode kirim otomatis aktif: rekaman akan otomatis terkirim setelah kamu selesai bicara."
      : "Kirim otomatis mati: tekan ➤ untuk mengirim.";
}

function tambahLog(log, r) {
  log.push(r);
  const s = S.sesi;
  const chat = $("#chat");
  if (!chat || logAktif() !== log) return;
  $(".chat-kosong", chat)?.remove();
  const wrap = document.createElement("div");
  wrap.innerHTML = bubbleHTML(r, s.kasus);
  const el = wrap.firstElementChild;
  chat.appendChild(el);
  pasangAksiBubble(el);
  chat.scrollTop = chat.scrollHeight;
  $$("img", el).forEach((img) => img.addEventListener("load", () => (chat.scrollTop = chat.scrollHeight)));
  tandaiTab();
}

function tampilMengetik(label) {
  const chat = $("#chat");
  if (!chat) return;
  $(".chat-kosong", chat)?.remove();
  chat.insertAdjacentHTML("beforeend", `<div class="pesan" id="mengetik"><div class="bubble ${label === "Sistem" ? "sistem" : "pasien"}"><div class="kepala"><span class="ava ${label === "Sistem" ? "s" : "p"}">${label[0]}</span>${label}</div><div class="isi"><span class="mengetik"><i></i><i></i><i></i></span></div></div></div>`);
  chat.scrollTop = chat.scrollHeight;
}

function kirimChat(teks) {
  const s = S.sesi;
  teks = (teks || "").trim();
  if (!teks || !s || s.menunggu || s.selesai) return;
  const m = $("#masukan");
  if (m) m.value = "";
  perekamChat?.reset();
  perekamChat?.jeda();
  s.menunggu = true;
  const jalan = s.tab === "fisik" ? kirimFisik(teks) : kirimPercakapan(teks);
  jalan.finally(() => {
    if (S.sesi === s) s.menunggu = false;
  });
}

// ---------- Pemeriksaan (dipakai di tab Fisik & Percakapan) ----------
async function petakanPemeriksaan(teks) {
  const s = S.sesi;
  let h = null;
  if (S.ai && !s.aiFisikGagal) {
    try {
      const r = await fetch("/api/fisik", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ teks }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || r.statusText);
      h = { fisik: j.pemeriksaan || [], ttv: j.tanda_vital || [] };
    } catch {
      s.aiFisikGagal = true;
    }
  }
  if (!h || (!h.fisik.length && !h.ttv.length)) h = cocokPemeriksaan(teks);
  for (const id of h.ttv) if (!s.ttv.includes(id)) s.ttv.push(id);
  for (const id of h.fisik) if (!s.fisik.includes(id)) s.fisik.push(id);
  return h;
}

async function kirimFisik(teks) {
  const s = S.sesi;
  tambahLog(s.logFisik, { role: "dokter", text: teks });
  tampilMengetik("Sistem");
  const [h] = await Promise.all([petakanPemeriksaan(teks), tunda(400)]);
  if (S.sesi !== s) return;
  $("#mengetik")?.remove();
  if (!h.fisik.length && !h.ttv.length) {
    tambahLog(s.logFisik, {
      role: "sistem",
      text: "Pemeriksaan belum dikenali. Sebutkan bagian tubuh dan teknik pemeriksaannya secara spesifik, misalnya “auskultasi paru”, “palpasi abdomen”, atau “periksa tanda-tanda vital”.",
    });
  } else {
    tambahLog(s.logFisik, { role: "sistem", fisik: h.fisik, ttv: h.ttv });
  }
  perekamChat?.lanjut();
}

// ---------- Percakapan (anamnesis) ----------
async function kirimPercakapan(teks) {
  const s = S.sesi;
  tambahLog(s.logPercakapan, { role: "dokter", text: teks });

  // Permintaan pemeriksaan (mis. tanda vital) dijawab SISTEM, bukan pasien
  if (tampakPemeriksaan(teks)) {
    const awal = cocokPemeriksaan(teks);
    if (awal.fisik.length || awal.ttv.length) {
      tampilMengetik("Sistem");
      const [h] = await Promise.all([petakanPemeriksaan(teks), tunda(350)]);
      if (S.sesi !== s) return;
      $("#mengetik")?.remove();
      tambahLog(s.logPercakapan, { role: "sistem", fisik: h.fisik, ttv: h.ttv });
      perekamChat?.lanjut();
      return;
    }
  }

  s.riwayat.push({ role: "dokter", text: teks });
  tampilMengetik("Pasien");

  let jawab;
  if (S.ai && !s.aiGagal) {
    try {
      const r = await fetch("/api/pasien", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId: s.kasus.id, riwayat: s.riwayat }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || r.statusText);
      jawab = j.jawaban;
    } catch (e) {
      s.aiGagal = true;
      toast({ jenis: "peringatan", judul: "Pasien AI tidak bisa dihubungi", isi: `${e.message}. Beralih ke mode offline untuk sesi ini.` });
    }
  }
  let paham = true;
  if (!jawab) {
    await tunda(450 + Math.random() * 400);
    const r = jawabOffline(s.kasus, teks, { sudah: s.sudahDijawab });
    r.ids.forEach((id) => s.sudahDijawab.add(id));
    jawab = r.teks;
    paham = r.paham;
  }
  if (S.sesi !== s) return;

  // Pasien tidak paham: percobaan pertama -> minta ulang/persingkat; kedua -> lewati.
  if (!paham) {
    s.gagal += 1;
    if (s.gagal >= 2) {
      jawab = "Maaf, Dok, saya kurang mengerti pertanyaannya.";
      s.gagal = 0;
      toast({ jenis: "info", judul: "Pertanyaan dilewati", isi: "Pasien belum bisa menjawab pertanyaan itu. Lanjutkan ke pertanyaan berikutnya." });
    } else {
      const contoh = CONTOH_PERTANYAAN.slice().sort(() => Math.random() - 0.5).slice(0, 2);
      toast({ jenis: "peringatan", judul: "Pasien belum paham", isi: `Ulangi atau persingkat pertanyaanmu, satu hal per pertanyaan. Contoh: “${contoh[0]}” atau “${contoh[1]}”` });
    }
  } else {
    s.gagal = 0;
  }

  $("#mengetik")?.remove();
  s.riwayat.push({ role: "pasien", text: jawab });
  tambahLog(s.logPercakapan, { role: "pasien", text: jawab });

  const lanjutkan = () => perekamChat?.lanjut();
  if (S.suaraPasien && ttsDidukung && !s.selesai) bicara(jawab, { jk: s.kasus.pasien.jk, onSelesai: lanjutkan });
  else lanjutkan();
}

function panelPercakapan() {
  const s = S.sesi;
  panelChat({
    log: s.logPercakapan,
    panduan: "Jika pasien memberikan respons yang tidak sesuai harapan, coba tanyakan lagi hal yang sama. Jika masih belum, persingkat pertanyaanmu atau tanyakan secara bertahap. Tanda vital bisa langsung diminta di sini, misalnya “Saya periksa tanda-tanda vital”.",
    kosong: `Pasien sudah duduk di depanmu. Mulailah dengan salam dan memperkenalkan diri.<br>Tekan <b>Mulai Rekam</b> lalu bicara, atau ketik ucapanmu.`,
    placeholder: "Ketik respons Anda di sini… (Enter untuk kirim)",
  });
}

function panelFisik() {
  const s = S.sesi;
  panelChat({
    log: s.logFisik,
    panduan: "Sebutkan pemeriksaan yang kamu lakukan beserta bagian tubuh dan tekniknya, seperti saat ujian. Contoh: “Saya periksa tanda-tanda vital”, “Inspeksi, palpasi, perkusi, dan auskultasi paru”, “Minta pasien melihat lurus ke depan, lalu inspeksi segmen anterior dengan senter”.",
    ekstra: `<button class="btn garis kecil" id="btnDaftar" style="margin-top:8px">📋 Lihat daftar pemeriksaan</button>`,
    kosong: "Belum ada pemeriksaan. Ucapkan atau ketik pemeriksaan yang ingin kamu lakukan.",
    placeholder: "Contoh: auskultasi paru kanan dan kiri…",
  });
  $("#btnDaftar").onclick = bukaDaftarFisik;
}

function bukaDaftarFisik() {
  const grup = {};
  for (const it of FISIK_KATALOG) (grup[it.grup] ||= []).push(it);
  bukaModal(`
    <h2 style="text-align:left">Daftar pemeriksaan fisik</h2>
    <p class="muted" style="text-align:left;margin-top:0">Klik untuk langsung melakukan pemeriksaan. Saat ujian, biasakan menyebutkannya sendiri.</p>
    <div class="daftar-modal">
      ${Object.entries(grup).map(([g, items]) => `<div class="grup-judul">${esc(g)}</div>
        ${items.map((it) => `<button class="item-periksa ${S.sesi.fisik.includes(it.id) ? "sudah" : ""}" data-langsung="${it.id}"><span>${esc(it.nama)}</span><span>${S.sesi.fisik.includes(it.id) ? "✓" : "＋"}</span></button>`).join("")}`).join("")}
    </div>
    <div class="modal-aksi"><button class="btn garis" data-tutup>Tutup</button></div>`, { lebar: true });
  $$("[data-langsung]").forEach((b) =>
    (b.onclick = () => {
      const s = S.sesi;
      const id = b.dataset.langsung;
      tutupModal();
      if (!s.fisik.includes(id)) s.fisik.push(id);
      tambahLog(s.logFisik, { role: "dokter", text: `Melakukan pemeriksaan: ${FISIK_KATALOG.find((f) => f.id === id).nama}` });
      tambahLog(s.logFisik, { role: "sistem", fisik: [id], ttv: [] });
    }));
}

// ---------- Data penunjang ----------
// Gambar ulang panel tanpa mengembalikan posisi scroll ke atas.
function renderTetap(fn) {
  const halaman = window.scrollY;
  const kat = $(".daftar-penunjang")?.scrollTop ?? 0;
  fn();
  const k = $(".daftar-penunjang");
  if (k) k.scrollTop = kat;
  window.scrollTo(0, halaman);
}

function hasilPenunjang(id) {
  const kat = PENUNJANG_KATALOG.find((p) => p.id === id);
  const o = S.sesi.kasus.penunjang[id];
  const h = o ? { ...o } : { ...kat.normal };
  return { nama: kat.nama, tabel: h.tabel, teks: h.teks, gambar: h.gambar, abnormal: Boolean(o?.abnormal) };
}

function tabelLab(rows) {
  return `<table class="lab"><thead><tr><th>Parameter</th><th>Hasil</th><th>Nilai rujukan</th><th></th></tr></thead><tbody>
    ${rows.map(([p, h, n, f]) => `<tr><td>${esc(p)}</td><td><b>${esc(h)}</b></td><td class="muted">${esc(n)}</td><td class="flag-${esc(f)}">${esc(f)}</td></tr>`).join("")}
  </tbody></table>`;
}

function panelPenunjang(filter = "") {
  const s = S.sesi;
  const f = filter.toLowerCase();
  const sudah = new Set(s.penunjang.map((p) => p.id));
  const terpilih = s.penunjang.length + s.pilihan.size;
  const penuh = s.penunjang.length >= MAKS_PENUNJANG;
  const grup = {};
  for (const it of PENUNJANG_KATALOG) {
    if (f && !`${it.nama} ${it.kategori}`.toLowerCase().includes(f)) continue;
    (grup[it.kategori] ||= []).push(it);
  }
  const hasilHTML = s.penunjang.length
    ? `<div class="blok-terpilih">
        <h2 class="judul-ikon">📋 Pemeriksaan Penunjang yang Dipilih</h2>
        ${s.penunjang.map((p, i) => {
          const h = hasilPenunjang(p.id);
          return `<div class="kartu-hasil ${h.abnormal ? "abnormal" : ""}" id="hasil-${p.id}">
            <div class="judul-hasil">${esc(h.nama)}</div>
            <div class="detail">
              <div class="detail-judul">Detail Pemeriksaan:</div>
              ${h.tabel ? tabelLab(h.tabel) : ""}
              ${h.teks ? `<p>${esc(h.teks)}</p>` : ""}
              ${h.gambar ? `<img class="gambar-temuan" src="${esc(h.gambar)}" alt="${esc(h.nama)}" data-zoom="${esc(h.nama)}">` : ""}
            </div>
            <div class="label-interp">Interpretasi Anda</div>
            <textarea class="input" rows="2" data-interp="${i}" placeholder="Tuliskan interpretasi hasil pemeriksaan ini…">${esc(p.interpretasi)}</textarea>
          </div>`;
        }).join("")}
      </div>`
    : "";

  const pilihHTML = penuh
    ? `<div class="kosong">Kuota ${MAKS_PENUNJANG} pemeriksaan penunjang sudah terpakai.</div>`
    : `<div class="blok-pilih">
        <h2 class="judul-tengah">Pilih Pemeriksaan Penunjang</h2>
        <div class="sub-tengah">Pilih maksimal ${MAKS_PENUNJANG} pemeriksaan yang diperlukan</div>
        <div class="cari-wrap"><span>🔍</span><input class="input" id="cariPenunjang" placeholder="Cari pemeriksaan penunjang…" value="${esc(filter)}"></div>
        <div class="pill-wrap"><span class="pill">${terpilih} / ${MAKS_PENUNJANG} terpilih</span></div>
        <div class="daftar-penunjang">
          ${Object.entries(grup).map(([g, items]) => `
            <div class="kategori-judul"><span>${esc(g)}</span></div>
            <div class="grid-opsi">
              ${items.map((it) => sudah.has(it.id)
                ? `<div class="opsi sudah"><span class="cek">✓</span><span>${esc(it.nama)}</span></div>`
                : `<label class="opsi ${s.pilihan.has(it.id) ? "dipilih" : ""}"><input type="checkbox" data-pilih="${it.id}" ${s.pilihan.has(it.id) ? "checked" : ""}><span>${esc(it.nama)}</span></label>`).join("")}
            </div>`).join("") || `<div class="kosong">Tidak ditemukan.</div>`}
        </div>
        <div class="konfirmasi-wrap"><button class="btn" id="btnKonfirmasi" ${s.pilihan.size ? "" : "disabled"}>✓ Konfirmasi Pilihan</button></div>
      </div>`;

  $("#panel").innerHTML = hasilHTML + pilihHTML;

  const cari = $("#cariPenunjang");
  if (cari) {
    cari.oninput = () => {
      const pos = cari.selectionStart;
      renderTetap(() => panelPenunjang(cari.value));
      const c = $("#cariPenunjang");
      c.focus();
      c.setSelectionRange(pos, pos);
    };
  }
  $$("[data-pilih]").forEach((cb) =>
    (cb.onchange = () => {
      if (cb.checked) {
        if (s.penunjang.length + s.pilihan.size >= MAKS_PENUNJANG) {
          cb.checked = false;
          return toast({ jenis: "peringatan", judul: "Kuota penuh", isi: `Maksimal ${MAKS_PENUNJANG} pemeriksaan penunjang per kasus. Pilih yang paling relevan.` });
        }
        s.pilihan.add(cb.dataset.pilih);
      } else s.pilihan.delete(cb.dataset.pilih);
      const f2 = $("#cariPenunjang")?.value || "";
      renderTetap(() => panelPenunjang(f2));
    }));
  const btn = $("#btnKonfirmasi");
  if (btn) {
    btn.onclick = () => {
      const baru = [...s.pilihan];
      for (const id of baru) s.penunjang.push({ id, interpretasi: "" });
      s.pilihan.clear();
      panelPenunjang();
      tandaiTab();
      document.getElementById(`hasil-${baru[0]}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    };
  }
  $$("[data-interp]").forEach((t) => (t.oninput = () => (s.penunjang[Number(t.dataset.interp)].interpretasi = t.value)));
  pasangAksiBubble($("#panel"));
}

// ---------- Diagnosis ----------
function panelDiagnosis() {
  const s = S.sesi;
  const d = s.diagnosis;
  $("#panel").innerHTML = `
    <div class="form-blok">
      <h2 class="judul-ikon">🩺 Diagnosis</h2>
      <div class="label">Diagnosis utama</div>
      <div class="banding-baris"><span class="nomor utama">★</span>
        <input class="input" id="dxUtama" placeholder="Tuliskan diagnosis utama, sespesifik mungkin" value="${esc(d.utama)}"><span></span></div>
      <div class="label" style="margin-top:10px">Diagnosis banding</div>
      <div class="form-blok" style="gap:8px">
        ${d.banding.map((b, i) => `<div class="banding-baris"><span class="nomor">${i + 1}</span>
          <input class="input" data-banding="${i}" placeholder="Diagnosis banding ${i + 1}" value="${esc(b)}">
          <button class="btn garis kecil" data-hapus="${i}" title="Hapus">✕</button></div>`).join("")}
      </div>
      <div><button class="btn kecil" id="tambahBanding">＋ Tambah Diagnosis Banding</button></div>
    </div>`;
  $("#dxUtama").oninput = (e) => {
    d.utama = e.target.value;
    tandaiTab();
  };
  $$("[data-banding]").forEach((i) => (i.oninput = () => (d.banding[Number(i.dataset.banding)] = i.value)));
  $$("[data-hapus]").forEach((b) =>
    (b.onclick = () => {
      d.banding.splice(Number(b.dataset.hapus), 1);
      if (!d.banding.length) d.banding.push("");
      panelDiagnosis();
    }));
  $("#tambahBanding").onclick = () => {
    d.banding.push("");
    panelDiagnosis();
    $$("[data-banding]").at(-1).focus();
  };
}

// ---------- Terapi & edukasi (dengan dikte suara) ----------
function panelTeks({ kunci, judul, petunjuk, placeholder, tombolResep = false }) {
  const s = S.sesi;
  $("#panel").innerHTML = `
    <div class="form-blok" style="max-width:none">
      <div class="label"><h2 class="judul-ikon" style="margin:0">${judul}</h2>
        <span class="baris">
          ${tombolResep ? `<button class="btn-mic" id="btnResep">＋ R/</button>` : ""}
          <button class="btn-mic" id="btnDikte" ${micDidukung ? "" : "disabled"}>🎙️ Dikte</button>
        </span></div>
      <div class="muted" style="font-size:13.5px">${petunjuk}</div>
      <textarea class="input ${tombolResep ? "resep" : ""}" id="isiTeks" rows="14" placeholder="${esc(placeholder)}">${esc(s[kunci])}</textarea>
    </div>`;
  const ta = $("#isiTeks");
  ta.oninput = () => {
    s[kunci] = ta.value;
    tandaiTab();
  };
  const r = $("#btnResep");
  if (r) {
    r.onclick = () => {
      const sisip = `${ta.value && !ta.value.endsWith("\n") ? "\n\n" : ta.value ? "\n" : ""}R/ \n   S  dd  \n`;
      ta.value += sisip;
      s[kunci] = ta.value;
      tandaiTab();
      ta.focus();
      const pos = ta.value.length - sisip.length + 3 + (sisip.startsWith("\n\n") ? 2 : sisip.startsWith("\n") ? 1 : 0);
      ta.setSelectionRange(pos, pos);
    };
  }
  const btn = $("#btnDikte");
  const atur = () => {
    const aktif = perekamDikte?.aktif;
    btn.classList.toggle("aktif", Boolean(aktif));
    btn.textContent = aktif ? "⏹ Berhenti dikte" : "🎙️ Dikte";
  };
  btn.onclick = () => {
    if (perekamDikte?.aktif) {
      perekamDikte.berhenti();
      return atur();
    }
    perekamChat?.berhenti();
    diam();
    perekamDikte = new Perekam({
      onTeks: (t) => {
        const el = $("#isiTeks");
        if (!el) return;
        el.value = t;
        s[kunci] = t;
        tandaiTab();
      },
      onStatus: atur,
    });
    perekamDikte.mulai(ta.value ? ta.value + "\n" : "");
    atur();
  };
  ta.focus();
}

function panelTerapi() {
  panelTeks({
    kunci: "tatalaksana",
    judul: "💊 Terapi",
    tombolResep: true,
    petunjuk: "Tulis dalam format resep: nama obat, sediaan, kekuatan, jumlah (No.), dan signa. Tambahkan tatalaksana non-farmakologis dan rencana (rawat jalan/rawat inap/rujuk, monitoring). Tombol “＋ R/” menyisipkan kerangka resep.",
    placeholder: "R/ Amoksisilin tab 500 mg No. XV\n   S 3 dd tab 1\n\nR/ Parasetamol tab 500 mg No. X\n   S 3 dd tab 1 p.r.n. demam\n\nNon-farmakologis:\n- …\n\nRencana:\n- …",
  });
}

function panelEdukasi() {
  panelTeks({
    kunci: "edukasi",
    judul: "🗣️ Edukasi",
    petunjuk: "Tuliskan atau diktekan edukasi untuk pasien (penyakit, pengobatan, pencegahan, tanda bahaya, kontrol). Edukasi yang kamu ucapkan langsung ke pasien di tab Percakapan juga ikut dinilai.",
    placeholder: "Bapak/Ibu, penyakit yang dialami adalah …",
  });
}

// ======================= Selesai & analisis =======================
function dataSesi() {
  const s = S.sesi;
  return {
    mulaiISO: new Date(s.mulai).toISOString(),
    riwayat: s.riwayat,
    ttv: s.ttv,
    fisik: s.fisik,
    penunjang: s.penunjang,
    diagnosis: { utama: s.diagnosis.utama, banding: s.diagnosis.banding.filter((x) => x.trim()) },
    tatalaksana: s.tatalaksana,
    edukasi: s.edukasi,
    durasiDetik: detikBerjalan(),
  };
}

async function selesaikanSesi() {
  const s = S.sesi;
  if (!s || s.selesai) return;
  s.selesai = true;
  clearInterval(s.timerId);
  perekamChat?.berhenti();
  perekamDikte?.berhenti();
  diam();
  const data = dataSesi();
  $("#main").innerHTML = `<div class="card memuat"><div class="spinner"></div><b>Menganalisis latihanmu…</b><div>${S.ai ? "Penguji AI sedang membaca transkrip dan jawabanmu." : "Menghitung skor berdasarkan rubrik."}</div></div>`;

  let hasil = null;
  let mode = "offline";
  let catatan = "";
  if (S.ai) {
    try {
      const r = await fetch("/api/evaluasi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId: s.kasus.id, sesi: data }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || r.statusText);
      hasil = j;
      mode = "ai";
    } catch (e) {
      catatan = `Penilaian AI gagal (${e.message}); dipakai penilaian rubrik offline.`;
    }
  }
  if (!hasil) {
    await tunda(500);
    hasil = evaluasiOffline(s.kasus, data);
  }
  const total = Math.round(hasil.bagian.reduce((a, b) => a + Math.max(0, Math.min(b.skor, b.bobot || BOBOT[b.nama] || 0)), 0) * 100) / 100;
  const rekaman = {
    id: `${Date.now()}`,
    caseId: s.kasus.id,
    judul: s.kasus.judul,
    tanggal: new Date().toISOString(),
    total,
    mode,
    catatan,
    hasil,
    sesi: data,
  };
  const progres = bacaProgres(); // dibaca sebelum riwayat diperbarui agar sesi ini tidak terhitung dua kali
  catatProgres(progres, rekaman);
  simpan.set("osce-progres", progres);
  const riwayat = simpan.get("osce-riwayat", []);
  riwayat.unshift(rekaman);
  simpan.set("osce-riwayat", riwayat.slice(0, 40));
  S.sesi = null;
  tampil("evaluasi", rekaman);
}

function kunciBagian(k, nama) {
  const namaFisik = (id) => FISIK_KATALOG.find((f) => f.id === id)?.nama || id;
  const namaPenunjang = (id) => PENUNJANG_KATALOG.find((f) => f.id === id)?.nama || id;
  switch (nama) {
    case "Anamnesis":
      return `<ul class="daftar-eval">${k.anamnesis.filter((a) => a.rubrik).map((a) => `<li>${esc(a.label)}</li>`).join("")}</ul>`;
    case "Tanda Vital":
      return `<ul class="daftar-eval">${TTV_ITEM.map((t) => `<li>${t.nama}: ${esc(k.ttv[t.id])}</li>`).join("")}</ul>`;
    case "Pemeriksaan Fisik":
      return `<ul class="daftar-eval">${k.fisikWajib.flat().map((id) => {
        const o = k.fisik[id];
        const kat = FISIK_KATALOG.find((f) => f.id === id);
        return `<li><b>${esc(namaFisik(id))}</b>: ${esc(o?.hasil || kat?.normal)}</li>`;
      }).join("")}</ul>`;
    case "Pemeriksaan Penunjang":
      if (!k.penunjangWajib.length) return `<p>Diagnosis klinis; pemeriksaan penunjang tidak wajib.</p><p>${esc(k.interpretasiPenunjang)}</p>`;
      return `<p>Yang relevan: ${k.penunjangWajib.map((w) => (Array.isArray(w) ? w.map(namaPenunjang).join(" / ") : namaPenunjang(w))).map(esc).join("; ")}</p><p>${esc(k.interpretasiPenunjang)}</p>`;
    case "Diagnosis":
      return `<p><b>${esc(k.diagnosis.utama)}</b></p><p>Banding: ${esc(k.diagnosis.banding.join(", "))}</p>`;
    case "Tatalaksana":
      return `<p>${esc(k.kunci.tatalaksana)}</p>`;
    case "Edukasi":
      return `<p>${esc(k.kunci.edukasi)}</p>`;
    default:
      return "";
  }
}

function warnaPersen(p) {
  return p >= 80 ? "var(--ok)" : p >= BATAS_LULUS ? "var(--warn)" : "var(--danger)";
}

function viewEvaluasi(rek) {
  const k = CASES.find((c) => c.id === rek.caseId);
  const h = rek.hasil;
  const totalBobot = h.bagian.reduce((a, b) => a + (b.bobot || BOBOT[b.nama] || 0), 0) || 100;
  const pct = Math.round((rek.total / totalBobot) * 100);
  const lulus = pct >= BATAS_LULUS;
  const mulai = new Date(rek.sesi.mulaiISO || rek.tanggal);
  const tglMulai = mulai.toLocaleString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });

  $("#main").innerHTML = `
    <div class="analisis">
      <div class="card kepala-analisis">
        <h1>Analisis Latihan</h1>
        <div class="meta"><span>🪪 ${esc(rek.judul)}</span><span>📅 Mulai pada: ${esc(tglMulai)}</span>
          <span class="badge ${rek.mode === "ai" ? "" : "biru"}">${rek.mode === "ai" ? "Dinilai AI" : "Penilaian otomatis"}</span></div>
      </div>

      <div class="card blok">
        <div class="blok-judul">📈 Ringkasan</div>
        <div class="ringkasan-grid">
          <div><small>Kasus Medis</small><b>${esc(rek.judul)}</b></div>
          <div><small>Durasi</small><b>${fmtJam(rek.sesi.durasiDetik || 0)}</b></div>
          <div><small>Status</small><b class="status ${lulus ? "lulus" : "gagal"}">${lulus ? "✔ LULUS" : "✖ TIDAK LULUS"}</b><small>Minimum: ${BATAS_LULUS}%</small></div>
          <div><small>Skor</small><div class="bulat" style="background:${warnaPersen(pct)}">${pct}%</div></div>
        </div>
        ${rek.catatan ? `<p class="muted" style="font-size:13px;margin:12px 0 0">${esc(rek.catatan)}</p>` : ""}
      </div>

      <div class="card blok">
        <div class="blok-judul">🩺 Analisis</div>
        <div class="analisis-grid">
          ${h.bagian.map((b) => {
            const bobot = b.bobot || BOBOT[b.nama];
            const sk = Math.max(0, Math.min(b.skor, bobot));
            const p = bobot ? Math.round((sk / bobot) * 100) : 0;
            const perhitungan = b.perhitungan || `skor penguji ${angka(sk)} dari bobot ${bobot}`;
            return `<div class="kartu-analisis">
              <h3>${esc(b.nama)}</h3>
              <div class="bar"><i style="width:${p}%;background:${warnaPersen(p)}"></i></div>
              <div class="skor-kanan">${angka(sk)}/${bobot} (${p}%)</div>
              <div class="perhitungan">Perhitungan: ${esc(perhitungan)}</div>
              <p>${esc(b.ringkasan)}</p>
              <div class="alasan">
                <b>Alasan:</b>
                ${b.sudah_baik?.length ? `<ul class="daftar-eval baik">${b.sudah_baik.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
                ${b.kurang?.length ? `<ul class="daftar-eval kurang">${b.kurang.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
              </div>
              ${k ? `<details class="kunci"><summary>Lihat kunci jawaban</summary>${kunciBagian(k, b.nama)}</details>` : ""}
            </div>`;
          }).join("")}
        </div>
        <div class="total-skor">
          <div><b>Total Score:</b><div class="perhitungan">Perhitungan: Total Poin / Total Bobot = ${angka(rek.total)}/${totalBobot}</div></div>
          <div class="total-angka" style="color:${warnaPersen(pct)}">${angka(rek.total)}/${totalBobot} (${pct}%)</div>
        </div>
      </div>

      <div class="card blok">
        <div class="blok-judul">💡 Umpan Balik</div>
        <p>${esc(h.komentar_umum)}</p>
        ${h.saran_belajar?.length ? `<b>Saran belajar</b><ul class="daftar-eval">${h.saran_belajar.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
      </div>

      <div class="card blok">
        <div class="blok-judul">💬 Transkrip & Jawabanmu</div>
        <div class="transkrip">${rek.sesi.riwayat.length ? rek.sesi.riwayat.map((r) => `<p><b style="color:${r.role === "dokter" ? "var(--blue)" : "var(--orange)"}">${r.role === "dokter" ? "Dokter" : "Pasien"}:</b> ${esc(r.text)}</p>`).join("") : '<p class="muted">Tidak ada percakapan.</p>'}</div>
        <p style="margin-top:14px"><b>Diagnosis:</b> ${esc(rek.sesi.diagnosis.utama || "-")}${rek.sesi.diagnosis.banding.length ? ` · <b>Banding:</b> ${esc(rek.sesi.diagnosis.banding.join(", "))}` : ""}</p>
        <p class="pre"><b>Terapi:</b>\n${esc(rek.sesi.tatalaksana || "-")}</p>
        <p class="pre"><b>Edukasi:</b>\n${esc(rek.sesi.edukasi || "-")}</p>
      </div>

      <div class="baris" style="justify-content:center;margin:6px 0 24px">
        <button class="btn" id="ulang">↻ Ulangi kasus ini</button>
        <button class="btn garis" id="kembali">Pilih kasus lain</button>
      </div>
    </div>`;
  $("#ulang").onclick = () => persiapanSesi(rek.caseId);
  $("#kembali").onclick = () => tampil("beranda");
}

// ======================= Riwayat =======================
function viewRiwayat() {
  const r = simpan.get("osce-riwayat", []);
  $("#main").innerHTML = `
    <div class="hero"><div><h1>Riwayat Sesi</h1><div class="muted">Tersimpan di browser ini saja.</div></div>
      ${r.length ? `<button class="btn garis kecil" id="hapusSemua">Hapus semua</button>` : ""}</div>
    <div class="card" style="overflow-x:auto">
      ${r.length ? `<table class="tabel-riwayat"><thead><tr><th>Tanggal</th><th>Kasus</th><th>Skor</th><th>Status</th><th>Penilai</th><th></th></tr></thead><tbody>
        ${r.map((x, i) => `<tr><td>${new Date(x.tanggal).toLocaleString("id-ID")}</td><td>${esc(x.judul)}</td>
          <td><b style="color:${warnaPersen(x.total)}">${Math.round(x.total)}%</b></td>
          <td>${x.total >= BATAS_LULUS ? '<span class="badge">Lulus</span>' : '<span class="badge merah">Tidak lulus</span>'}</td>
          <td>${x.mode === "ai" ? "AI" : "Otomatis"}</td>
          <td><button class="btn sekunder kecil" data-lihat="${i}">Lihat</button></td></tr>`).join("")}
      </tbody></table>` : `<div class="kosong">Belum ada sesi. Selesaikan satu stasion untuk melihat riwayat di sini.</div>`}
    </div>`;
  $$("[data-lihat]").forEach((b) => (b.onclick = () => tampil("evaluasi", { ...r[Number(b.dataset.lihat)], dariRiwayat: true })));
  const h = $("#hapusSemua");
  if (h) h.onclick = async () => {
    if (await konfirmasi({ judul: "Hapus semua riwayat?", isi: "Riwayat sesi beserta tanda ✓ kasus yang sudah dikerjakan di browser ini akan dihapus dan tidak bisa dikembalikan.", ya: "Hapus" })) {
      simpan.set("osce-riwayat", []);
      simpan.set("osce-progres", {});
      viewRiwayat();
    }
  };
}

// ======================= Panduan =======================
function viewPanduan() {
  $("#main").innerHTML = `
    <h1>Panduan</h1>
    <div class="grid-kasus" style="margin-top:14px">
      <div class="card"><h2>Alur satu stasion</h2><ol class="daftar-eval">
        <li>Pilih kasus, timer mulai berjalan.</li>
        <li><b>Percakapan</b>: tekan <i>Mulai Rekam</i> lalu bicara seperti ke pasien sungguhan. Tanda vital bisa diminta langsung di sini.</li>
        <li><b>Pemeriksaan fisik</b>: sebutkan pemeriksaan yang kamu lakukan (mis. “auskultasi paru”). Sistem membalas dengan hasil, gambar, atau bunyi.</li>
        <li><b>Data penunjang</b>: pilih maks. ${MAKS_PENUNJANG} pemeriksaan, lalu tulis interpretasinya.</li>
        <li>Isi <b>diagnosis</b>, <b>terapi</b> (format resep), dan <b>edukasi</b>.</li>
        <li>Tekan <i>Akhiri Sesi</i> untuk melihat analisis latihan.</li>
      </ol></div>
      <div class="card"><h2>Mikrofon</h2><ul class="daftar-eval">
        <li>Gunakan <b>Google Chrome</b> atau <b>Microsoft Edge</b> (laptop atau HP Android).</li>
        <li>Izinkan akses mikrofon saat diminta browser.</li>
        <li>Pengenalan suara butuh koneksi internet.</li>
        <li>Pakai earphone agar suara pasien tidak ikut terekam.</li>
        <li>Mikrofon bermasalah? Kamu tetap bisa mengetik pertanyaan.</li>
      </ul></div>
      <div class="card"><h2>Tips agar pasien paham</h2><ul class="daftar-eval">
        <li>Tanyakan satu hal per kalimat, misalnya “Sejak kapan sakitnya?”.</li>
        <li>Pakai kata yang biasa dipakai pasien: “kencing manis”, “sesak”, “BAB”.</li>
        <li>Kalau jawabannya kurang pas, ulangi dengan kalimat yang lebih singkat.</li>
        <li>Di pemeriksaan fisik, sebutkan bagian tubuh dan tekniknya, mis. “palpasi abdomen”.</li>
      </ul></div>
      <div class="card"><h2>Progres &amp; riwayat</h2><ul class="daftar-eval">
        <li>Skor dan riwayat sesi tersimpan otomatis di browser perangkat ini.</li>
        <li>Progres tidak pindah ke perangkat atau browser lain.</li>
        <li>Menghapus data/riwayat browser atau memakai mode penyamaran akan menghapus progres.</li>
      </ul>
      <p class="muted" style="font-size:13px">Kunci jawaban adalah contoh untuk latihan. Cocokkan dengan PPK dan panduan institusimu.</p></div>
    </div>`;
}

// ======================= Mulai =======================
await cekStatus();
tampil("beranda");
