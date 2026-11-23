// Mode offline: pasien menjawab dengan pencocokan kata kunci, dan penilaian berbasis rubrik.
import { FISIK_KATALOG, PENUNJANG_KATALOG } from "./katalog.js";

export const BOBOT = {
  "Anamnesis": 30,
  "Tanda Vital": 10,
  "Pemeriksaan Fisik": 15,
  "Pemeriksaan Penunjang": 10,
  "Diagnosis": 15,
  "Tatalaksana": 12,
  "Edukasi": 8,
};

export function norm(t) {
  return ` ${String(t || "")
    .toLowerCase()
    .replace(/[^a-z0-9À-ɏ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()} `;
}

// kata kunci cocok bila muncul di awal sebuah kata (agar "kencingnya" cocok dengan "kencing")
function ada(teksNorm, kw) {
  const k = norm(kw).trim();
  if (!k) return false;
  return teksNorm.includes(` ${k}`);
}

// ---------------- Pemahaman bahasa (mode offline) ----------------
// Kata gaul / singkatan / sinonim -> bentuk baku. Berlaku untuk ucapan dokter DAN kata kunci.
const SINONIM = {
  gak: "tidak", ga: "tidak", gk: "tidak", nggak: "tidak", enggak: "tidak", engga: "tidak", ngga: "tidak", kagak: "tidak", tak: "tidak", tdk: "tidak", ndak: "tidak",
  udah: "sudah", udh: "sudah", sdh: "sudah", dah: "sudah", blm: "belum", belom: "belum",
  gimana: "bagaimana", gmn: "bagaimana", bgmn: "bagaimana", gimane: "bagaimana", kayak: "seperti", kaya: "seperti", kek: "seperti",
  knp: "kenapa", napa: "kenapa", kpn: "kapan", brp: "berapa", yg: "yang", dgn: "dengan", sm: "sama", aja: "saja", kalo: "kalau", klo: "kalau",
  tau: "tahu", ngerasa: "merasa", ngerasain: "merasakan", dirasain: "dirasakan", rasain: "rasakan", nyeri: "nyeri", sakitnya: "sakit",
  pipis: "kencing", kemih: "kencing", berak: "bab", mencret: "diare", menceret: "diare", murus: "diare",
  pegel: "pegal", pegel2: "pegal", liat: "lihat", ngeliat: "melihat", pake: "pakai", make: "pakai", temen: "teman", ngapain: "sedang apa",
  sakit2: "sakit", bintik2: "bintik", kerasa: "terasa", berasa: "terasa", ngerokok2: "merokok", bengkok: "bengkak",
  lemes: "lemas", lesu: "lemas", meriang: "demam", febris: "demam", pening: "pusing", puyeng: "pusing", cenat: "pusing",
  eneg: "mual", enek: "mual", muntahan: "muntah", ngik: "mengi", mengik: "mengi", sesek: "sesak", ngos: "sesak",
  ortu: "orang tua", bokap: "ayah", nyokap: "ibu", papa: "ayah", mama: "ibu", bapak: "bapak", ibunya: "ibu",
  belekan: "belek", blobok: "belek", kotoran: "kotoran", obatin: "obati", ngobatin: "obati", periksain: "periksa",
  ngerokok: "merokok", rokoknya: "rokok", nyamuknya: "nyamuk", tetangganya: "tetangga",
};
const AKHIRAN = /(nya|kah|lah|pun|mu|ku|in)$/;
const AWALAN = /^(meng|meny|mem|men|me|ber|be|ter|di|ke|se|pe)(?=[a-z]{3,})/;

/** Normalisasi + sinonim + varian kata tanpa imbuhan, untuk pencocokan anamnesis. */
export function kanon(teks, { varian = true } = {}) {
  const kata = norm(teks).trim().split(" ").filter(Boolean);
  const out = [];
  const ekstra = [];
  for (let w of kata) {
    let dasar = w.length > 5 ? w.replace(AKHIRAN, "") : w;
    const s = SINONIM[w] || SINONIM[dasar];
    if (s) {
      out.push(s);
      continue;
    }
    out.push(w);
    if (varian) {
      if (dasar !== w) ekstra.push(dasar);
      const tanpaAwalan = dasar.replace(AWALAN, "");
      if (tanpaAwalan !== dasar && tanpaAwalan.length >= 4) ekstra.push(tanpaAwalan);
    }
  }
  // varian imbuhan diletakkan setelah pemisah agar tidak membentuk frasa palsu
  return ` ${out.join(" ")} | ${ekstra.join(" ")} `;
}

// Kata tanya/umum diberi bobot kecil agar kata topik (kencing, mual, dst.) lebih menentukan.
const KATA_UMUM = new Set(["kapan", "bagaimana", "apa", "apakah", "ada", "sudah", "pernah", "sering", "berapa", "yang", "seperti", "sedang", "lagi", "itu", "ini", "di", "ke", "dari", "dengan", "tidak", "saja", "mana", "kenapa"]);

function jarak1(a, b) {
  // true bila beda paling banyak 1 huruf (salah ketik/salah dengar)
  if (Math.abs(a.length - b.length) > 1 || a[0] !== b[0]) return false;
  let i = 0;
  let j = 0;
  let beda = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++beda > 1) return false;
    if (a.length > b.length) i++;
    else if (b.length > a.length) j++;
    else { i++; j++; }
  }
  return beda + (a.length - i) + (b.length - j) <= 1;
}

function cocokKw(teksK, kataTeks, kw) {
  const k = kanon(kw, { varian: false }).split("|")[0].trim();
  if (!k) return 0;
  const bagian = k.split(" ");
  let cocok = teksK.includes(` ${k}`);
  // toleransi salah ketik untuk kata kunci tunggal yang cukup panjang
  if (!cocok && bagian.length === 1 && k.length >= 6) cocok = kataTeks.some((w) => w.length >= 4 && jarak1(w, k));
  if (!cocok) return 0;
  return bagian.reduce((s, w) => s + (KATA_UMUM.has(w) ? 0.4 : 1), 0) + 0.5;
}

function skorK(teksK, kwList) {
  const kataTeks = teksK.replace("|", " ").trim().split(/\s+/);
  let s = 0;
  for (const kw of kwList) s += cocokKw(teksK, kataTeks, kw);
  return s;
}

export function adaK(teksK, daftar) {
  return daftar.some((p) => {
    const k = kanon(p, { varian: false }).split("|")[0].trim();
    return k && teksK.includes(` ${k}`);
  });
}

// Kata kunci tambahan berdasarkan id entri anamnesis (berlaku untuk semua kasus)
const KW_TAMBAHAN = {
  ku: ["keluhannya apa", "apa keluhan", "sakit apa", "kenapa", "ada apa", "yang dikeluhkan", "dikeluhkan", "mau periksa apa", "keperluan", "yang dirasakan", "merasa sakit", "bisa dibantu", "datang ke sini", "datang kemari"],
  onset: ["kapan", "sejak kapan", "dari kapan", "mulai kapan", "sejak", "berapa hari", "berapa jam", "berapa minggu", "berapa lama", "sudah lama", "awalnya", "pertama kali", "mulainya", "kapan mulai"],
  rpd: ["sebelumnya", "dulu pernah", "riwayat sakit", "riwayat penyakit", "penyakit sebelumnya", "penyakit dahulu", "sakit berat", "operasi", "penyakit kronis", "sakit gula", "gula darah", "tekanan darah tinggi", "tensi tinggi", "pernah sakit", "pernah mengalami", "pernah seperti ini", "pernah begini"],
  obat: ["obat", "minum obat", "diberi obat", "berobat", "beli obat", "apotek", "sudah diobati", "sudah periksa", "ke dokter", "ke puskesmas", "ke bidan", "ke klinik", "jamu", "pengobatan", "diobati", "upaya", "usaha"],
  alergi: ["alergi", "tidak cocok obat", "gatal setelah minum", "biduran"],
  kebiasaan: ["merokok", "rokok", "alkohol", "minuman keras", "miras", "olahraga", "begadang", "kopi", "narkoba", "kebiasaan", "gaya hidup"],
  gi: ["mual", "muntah", "nafsu makan", "selera makan", "makannya", "mau makan", "makan berkurang"],
  perut: ["perut", "ulu hati", "maag", "lambung", "kembung", "begah", "sakit perut", "nyeri perut", "melilit"],
  kepala: ["kepala", "pusing", "sakit kepala", "nyeri kepala", "bola mata", "belakang mata"],
  mialgia: ["otot", "sendi", "pegal", "linu", "ngilu", "tulang", "badan sakit", "nyeri badan", "badan pegal"],
  bab: ["bab", "buang air besar", "diare", "feses", "tinja", "sembelit", "susah bab", "warna bab", "bab hitam", "bab berdarah"],
  bak: ["kencing", "buang air kecil", "urin", "air seni", "anyang", "bak", "warna kencing"],
  lemas: ["lemas", "letih", "capek", "lelah", "pingsan", "gelisah", "tangan dingin", "kaki dingin", "kesadaran", "linglung", "mengigau"],
  respirasi: ["batuk", "pilek", "flu", "sesak", "napas", "nafas", "tenggorokan", "bersin", "ingus"],
  sistemik: ["demam", "batuk", "pilek", "flu", "tenggorokan", "badan demam", "badan panas", "panas badan", "panas tinggi"],
  demam: ["demam", "suhu badan", "badan demam", "badan panas", "panas badan", "panas tinggi"],
  lingkungan: ["keluarga", "serumah", "tetangga", "lingkungan", "sekitar", "teman", "orang lain", "ada yang sakit", "sakit serupa", "sakit yang sama", "keluhan serupa", "menular", "nyamuk"],
  kontak: ["keluarga", "serumah", "tetangga", "lingkungan", "sekitar", "teman", "orang lain", "ada yang sakit", "sakit serupa", "sakit yang sama", "keluhan serupa", "tertular", "menular", "kos", "handuk"],
  keluarga: ["keluarga", "orang tua", "ibu", "ayah", "saudara", "keturunan", "kakak", "adik", "nenek", "kakek", "riwayat keluarga"],
  travel: ["bepergian", "pergi", "jalan jalan", "luar kota", "keluar kota", "mudik", "liburan", "luar pulau", "perjalanan", "luar daerah"],
  pola: ["demamnya", "panasnya", "badan panas", "pola demam", "naik turun", "terus menerus", "sepanjang hari", "malam", "sore", "pagi", "diukur", "termometer", "derajat", "suhu", "seberapa tinggi", "demam seperti apa", "bagaimana demam", "karakter demam", "tipe demam"],
  menggigil: ["menggigil", "keringat", "berkeringat", "kedinginan"],
  perdarahan: ["berdarah", "perdarahan", "pendarahan", "darah", "mimisan", "gusi", "bintik", "ruam", "lebam", "memar", "bercak", "bintik merah", "kulit merah", "bintik bintik"],
  minum: ["minum", "minumnya", "cairan", "gelas", "banyak minum"],
  higiene: ["makan", "jajan", "warung", "kebersihan", "cuci tangan", "air minum", "pola makan", "makan di luar", "makanan", "masak sendiri", "makan di mana"],
  pencetus: ["pencetus", "pemicu", "dipicu", "memicu", "sebelum sesak", "sedang apa", "habis apa", "setelah apa", "debu", "dingin", "kambuh karena", "penyebab", "sebabnya", "gara gara"],
  mengi: ["bunyi", "mengi", "suara napas", "berbunyi", "napasnya bunyi", "suara ngik"],
  batuk: ["batuk", "dahak", "riak", "berdahak"],
  dada: ["dada", "berat di dada", "nyeri dada", "tertekan", "diikat", "sakit dada"],
  derajat: ["posisi", "berbaring", "tiduran", "duduk", "bicara", "ngomong", "berjalan", "aktivitas", "seberapa sesak", "makin berat", "tidur telentang"],
  riwayat_asma: ["riwayat", "asma", "sering kambuh", "berapa kali", "serangan", "pernah sesak", "malam hari", "terbangun", "kambuh", "sesak sebelumnya"],
  rawat: ["dirawat", "opname", "rumah sakit", "igd", "ventilator", "selang", "icu", "alat bantu", "mondok"],
  atopi: ["alergi", "bersin", "hidung", "gatal", "kulit", "eksim", "kucing", "debu"],
  rokok: ["merokok", "rokok", "asap", "perokok"],
  pekerjaan: ["pekerjaan", "kerja", "kantor", "pabrik", "tempat kerja", "lingkungan kerja", "lingkungan rumah", "bekerja"],
  jantung: ["kaki bengkak", "bengkak", "jantung", "bantal", "hipertensi", "darah tinggi", "berdebar"],
  sekret: ["belek", "kotoran", "sekret", "cairan", "lengket", "nanah", "keluar cairan", "keluar kotoran"],
  gatal: ["gatal"],
  ganjal: ["mengganjal", "berpasir", "pasir", "perih", "panas di mata", "tidak nyaman", "rasa panas"],
  nyeri: ["nyeri", "sakit matanya", "sakit sekali", "mata sakit", "cekot"],
  visus: ["penglihatan", "kabur", "buram", "pandangan", "melihat", "rabun", "mata kabur", "lihat jelas"],
  silau: ["silau", "cahaya", "terang"],
  lateral: ["mata kanan", "kanan", "kiri", "kedua mata", "dua mata", "sebelah", "satu mata", "mata yang lain", "dua duanya", "kiri saja"],
  trauma: ["kemasukan", "terkena", "kena benda", "kena debu", "terbentur", "benturan", "trauma", "debu", "kena sesuatu", "kecelakaan", "kecolok", "tercolok"],
  lensa: ["lensa kontak", "softlens", "kacamata", "kontak lens", "lensa"],
};

function kwEntri(e) {
  // gabungkan kata kunci kasus + tambahan umum, tanpa duplikat (setelah dinormalkan)
  const semua = KW_TAMBAHAN[e.id] ? [...e.kw, ...KW_TAMBAHAN[e.id]] : e.kw;
  const lihat = new Set();
  return semua.filter((k) => {
    const n = kanon(k, { varian: false });
    if (lihat.has(n)) return false;
    lihat.add(n);
    return true;
  });
}

const POLA_SALAM = ["selamat pagi", "selamat siang", "selamat sore", "selamat malam", "assalamualaikum", "halo", "permisi", "perkenalkan", "saya dokter", "nama saya"];
const POLA_IZIN = ["boleh saya", "izin", "ijin", "bersedia", "apakah boleh", "saya akan bertanya", "menanyakan beberapa", "boleh bertanya", "boleh tanya"];
const POLA_TERIMA_KASIH = ["terima kasih", "makasih", "trims"];
const POLA_TANYA = ["apakah", "apa", "ada", "pernah", "sudah", "bisa", "bagaimana", "berapa", "kapan", "kenapa", "mengapa", "siapa", "mana", "boleh", "sering", "masih"];
const POLA_PERIKSA = ["saya periksa", "periksa dulu", "diperiksa", "izin periksa", "saya cek", "saya ukur", "tensi", "saya tensi", "berbaring dulu", "silakan berbaring", "lihat dulu", "saya lihat", "buka mulut", "tarik napas", "saya dengarkan", "cuci tangan"];
const POLA_EDUKASI = ["sebaiknya", "jangan", "hindari", "harus", "diminum", "minum obat", "obatnya", "saya resepkan", "saya beri", "saya berikan", "kontrol", "istirahat", "penyakit bapak", "penyakit ibu", "penyakitnya", "diagnosis", "kemungkinan", "jadi bapak", "jadi ibu", "jadi mbak", "jadi mas", "jadi adik", "dirawat", "dirujuk", "rujuk", "menular", "cuci tangan", "tanda bahaya", "segera kembali"];
const POLA_KELUHAN_LAIN = ["keluhan lain", "selain itu", "ada lagi", "keluhan lainnya", "keluhan tambahan", "apa lagi", "yang dirasakan lagi"];
const POLA_PERTANYAAN_PASIEN = ["ada pertanyaan", "ingin ditanyakan", "mau ditanyakan", "ada yang mau ditanya", "ada yang ingin ditanya", "sudah jelas", "sudah paham", "mengerti"];

function entriIdentitas(p) {
  const usia = p.usiaTeks || `${p.usia} tahun`;
  // Kasus anak (dijawab ibu/pengasuh) atau pasien tidak sadar (dijawab pendamping dengan awalan penjawab)
  const anak = p.usia < 13 && p.pendamping;
  const pj = p.penjawab ? `${p.penjawab} ` : "";
  if (anak || pj) {
    const siapa = anak ? "Anak saya" : "Pasien";
    const nya = anak ? "anak saya" : "beliau";
    return [
      { id: "_nama", kw: ["nama", "siapa", "siapa nama", "namanya siapa", "dengan siapa", "nama anak", "namanya"], jawab: `${pj}Namanya ${p.nama}, Dok.${anak ? " Saya ibunya." : ""}` },
      { id: "_usia", kw: ["usia", "umur", "berapa tahun", "berapa bulan", "tahun berapa", "tanggal lahir", "lahir tahun"], jawab: `${pj}Umur ${nya} ${usia}, Dok.` },
      { id: "_alamat", kw: ["alamat", "tinggal di mana", "tinggal dimana", "tinggalnya", "rumahnya di", "rumah di mana", "domisili", "asal", "dari mana"], jawab: `${pj}Kami tinggal di ${p.alamat}, Dok.` },
      { id: "_kerja", kw: ["pekerjaan", "bekerja", "kerja apa", "kerjanya", "sekolah", "kelas berapa", "kesibukan"], jawab: `${pj}${siapa} ${p.pekerjaan.toLowerCase()}, Dok.` },
      { id: "_status", kw: ["menikah", "status", "sudah berkeluarga"], jawab: anak ? "Masih anak-anak, Dok, belum menikah." : `${pj}${p.statusNikah || "Sudah menikah"}, Dok.` },
      { id: "_agama", kw: ["agama"], jawab: `${pj}Islam, Dok.` },
    ];
  }
  return [
    { id: "_nama", kw: ["nama", "siapa", "siapa nama", "namanya siapa", "dengan siapa", "dengan bapak siapa", "dengan ibu siapa"], jawab: `Nama saya ${p.nama}, Dok.` },
    { id: "_usia", kw: ["usia", "umur", "berapa tahun", "tahun berapa", "tanggal lahir", "lahir tahun"], jawab: `Umur saya ${usia}, Dok.` },
    { id: "_alamat", kw: ["alamat", "tinggal di mana", "tinggal dimana", "tinggalnya", "rumahnya di", "rumah di mana", "domisili", "asal", "dari mana"], jawab: `Saya tinggal di ${p.alamat}, Dok.` },
    { id: "_kerja", kw: ["pekerjaan", "bekerja", "kerja apa", "kerjanya", "kesibukan", "sehari hari", "profesi", "aktivitas sehari"], jawab: `Saya ${p.pekerjaan.toLowerCase()}, Dok.` },
    { id: "_status", kw: ["menikah", "status", "sudah berkeluarga", "suami", "istri", "anak"], jawab: p.statusNikah ? `${p.statusNikah}, Dok.` : p.usia < 25 ? "Belum menikah, Dok." : "Sudah menikah, Dok." },
    { id: "_agama", kw: ["agama"], jawab: "Islam, Dok." },
  ];
}

/** Mencari entri anamnesis yang cocok dengan satu ucapan dokter (diurutkan dari skor tertinggi). */
export function cocokkan(kasus, teks) {
  const t = kanon(teks);
  return [...kasus.anamnesis, ...entriIdentitas(kasus.pasien)]
    .map((e, urut) => ({ e, s: skorK(t, kwEntri(e)), urut }))
    .filter((x) => x.s >= 0.9)
    // keluhan utama bersifat umum: kalah dari topik spesifik bila keduanya cocok
    .map((x) => (x.e.id === "ku" ? { ...x, s: x.s * 0.6 } : x))
    .sort((a, b) => b.s - a.s || a.urut - b.urut);
}

function sapaanWaktu(t) {
  for (const w of ["pagi", "siang", "sore", "malam"]) if (t.includes(` selamat ${w}`)) return `selamat ${w} juga`;
  if (t.includes(" assalamualaikum")) return "waalaikumsalam";
  return "halo";
}

function keluhanLain(kasus, sudahDijawab) {
  const kandidat = kasus.anamnesis.filter((a) => a.kat === "RPS" && a.id !== "onset" && !sudahDijawab.has(a.id) && !/tidak|belum/i.test(a.jawab.slice(0, 12)));
  return kandidat.slice(0, 2);
}

/**
 * Jawaban pasien mode offline.
 * Mengembalikan { teks, paham, ids } ; paham=false bila pasien tidak mengerti pertanyaan.
 * konteks.sudah = Set id entri yang sudah pernah dijawab (agar "keluhan lain?" tidak mengulang).
 */
export function jawabOffline(kasus, teks, konteks = {}) {
  const sudah = konteks.sudah || new Set();
  const t = kanon(teks);
  const kandidat = cocokkan(kasus, teks);
  const salam = adaK(t, POLA_SALAM);
  const izin = adaK(t, POLA_IZIN);
  const terimaKasih = adaK(t, POLA_TERIMA_KASIH);
  const bertanya = adaK(t, POLA_TANYA) || /\?/.test(teks);
  // Bila pasien tidak dapat menjawab (mis. tidak sadar), jawaban umum diucapkan pendamping, contoh "(Anak)"
  const pj = kasus.pasien.penjawab ? `${kasus.pasien.penjawab} ` : "";
  const awalan = salam ? `${pj}Iya, ${sapaanWaktu(t)}, Dok. ` : pj;
  // jawaban naskah kasus alloanamnesis sudah diawali "(Ibu) " dsb.; dibuang lalu dipasang sekali di depan
  const buangPj = (s) => (pj && s.startsWith(pj) ? s.slice(pj.length) : s);

  // "Ada keluhan lain?" (kecuali bila ada topik spesifik yang jelas ditanyakan)
  if (adaK(t, POLA_KELUHAN_LAIN) && !(kandidat[0]?.s >= 2)) {
    const lain = keluhanLain(kasus, sudah);
    if (lain.length) return { teks: awalan + lain.map((x) => buangPj(x.jawab)).join(" "), paham: true, ids: lain.map((x) => x.id) };
    return { teks: awalan + "Itu saja sih, Dok.", paham: true, ids: [] };
  }
  // Dokter menawarkan pertanyaan / memastikan pemahaman
  if (adaK(t, POLA_PERTANYAAN_PASIEN)) {
    return { teks: kasus.pasien.pertanyaan || "Saya sakit apa ya, Dok? Apa berbahaya?", paham: true, ids: [] };
  }

  // Dokter menjelaskan/mengedukasi (kalimat pernyataan, bukan pertanyaan)
  const kataTanya = ["apakah", "apa", "bagaimana", "berapa", "kapan", "pernah", "kenapa", "mengapa", "siapa"];
  if (adaK(t, POLA_EDUKASI) && !adaK(t, kataTanya) && !/\?/.test(teks)) {
    return { teks: "Baik, Dok, saya mengerti.", paham: true, ids: [] };
  }

  if (kandidat.length) {
    const jawab = [buangPj(kandidat[0].e.jawab)];
    const ids = [kandidat[0].e.id];
    const kedua = kandidat[1];
    const banyakTanya = / dan | serta | atau |,|\?.*\?/.test(` ${teks} `);
    const hampirSeri = kedua && kedua.s >= 1.4 && kedua.s >= kandidat[0].s * 0.9;
    if (kedua && kedua.e.jawab !== kandidat[0].e.jawab && (kedua.s >= 2.5 || hampirSeri || (banyakTanya && kedua.s >= 1.4))) {
      jawab.push(buangPj(kedua.e.jawab));
      ids.push(kedua.e.id);
    }
    return { teks: (awalan + jawab.join(" ")).trim(), paham: true, ids };
  }

  if (terimaKasih) return { teks: `${pj}Sama-sama, Dok. Terima kasih juga.`, paham: true, ids: [] };
  if (adaK(t, POLA_PERIKSA)) return { teks: (awalan + "Iya, silakan, Dok.").trim(), paham: true, ids: [] };
  if (salam || izin) return { teks: (awalan + (izin ? "Iya, boleh, silakan, Dok." : "Silakan, Dok.")).trim(), paham: true, ids: [] };
  // Pertanyaan ya/tidak tentang hal yang tidak ada di naskah -> dianggap tidak ada
  if (bertanya && adaK(t, ["apakah", "ada", "pernah", "apa ada", "sering", "masih"])) {
    return { teks: `${pj}Tidak ada, Dok.`, paham: true, ids: [] };
  }
  return { teks: `${pj}Maaf, Dok, maksudnya bagaimana ya?`, paham: false, ids: [] };
}

// ---------------- Penilaian offline ----------------
function namaFisik(id) {
  return FISIK_KATALOG.find((f) => f.id === id)?.nama || id;
}
function namaPenunjang(id) {
  return PENUNJANG_KATALOG.find((f) => f.id === id)?.nama || id;
}

const UMUM = new Set(["demam", "infeksi", "akut", "kronik", "konjungtivitis", "derajat", "gagal", "eksaserbasi", "sindrom", "asma", "dengan", "pada", "dan", "atau"]);
function tokenBanding(s) {
  return norm(s).trim().split(" ").filter((w) => w.length >= 3);
}
function bandingCocok(jawabanMhs, kunci) {
  const tm = norm(jawabanMhs);
  const tok = tokenBanding(kunci).filter((w) => !UMUM.has(w));
  if (!tok.length) return false;
  // cocok bila salah satu kata khas (3 huruf awal) muncul, mis. "viral" ~ "virus", "dbd" ~ "DBD"
  return tok.some((w) => tm.includes(` ${w.slice(0, 3)}`));
}

function rubrikTeks(rubrik, teks) {
  const t = norm(teks);
  const baik = [];
  const kurang = [];
  for (const r of rubrik) (r.kw.some((k) => ada(t, k)) ? baik : kurang).push(r.poin);
  return { baik, kurang };
}

const f1 = (x) => String(Math.round(x * 10) / 10).replace(".", ",");

export function evaluasiOffline(kasus, sesi) {
  const bagian = [];
  const ucapanDokter = (sesi.riwayat || []).filter((r) => r.role === "dokter").map((r) => r.text);
  const semuaUcapan = ucapanDokter.join(" \n ");

  // Anamnesis
  {
    const ditanya = new Set();
    for (const u of ucapanDokter) for (const k of cocokkan(kasus, u)) ditanya.add(k.e.id);
    const rub = kasus.anamnesis.filter((x) => x.rubrik);
    const baik = rub.filter((x) => ditanya.has(x.id)).map((x) => x.label);
    const kurang = rub.filter((x) => !ditanya.has(x.id)).map((x) => x.label);
    const t = norm(semuaUcapan);
    const salam = POLA_SALAM.some((p) => ada(t, p));
    const izin = POLA_IZIN.some((p) => ada(t, p));
    const identitas = ["_nama", "_usia"].some((id) => ditanya.has(id));
    (salam ? baik : kurang).unshift("Salam dan memperkenalkan diri");
    (izin ? baik : kurang).unshift("Meminta izin/persetujuan (informed consent)");
    (identitas ? baik : kurang).unshift("Menanyakan identitas pasien");
    const nRub = rub.filter((x) => ditanya.has(x.id)).length;
    const s = rub.length ? (nRub / rub.length) * 24 : 0;
    const nUmum = (salam ? 1 : 0) + (izin ? 1 : 0) + (identitas ? 1 : 0);
    const skorAkhir = s + nUmum * 2;
    bagian.push({
      nama: "Anamnesis", bobot: 30, skor: ucapanDokter.length ? skorAkhir : 0,
      perhitungan: `(${nRub}/${rub.length} poin × 24) + (pembukaan ${nUmum}/3 × 6) = ${f1(ucapanDokter.length ? skorAkhir : 0)}`,
      ringkasan: ucapanDokter.length
        ? `Menanyakan ${nRub} dari ${rub.length} poin anamnesis penting dan ${nUmum} dari 3 poin pembukaan (salam, izin, identitas). Dinilai dari kata kunci.`
        : "Belum ada anamnesis yang dilakukan.",
      sudah_baik: baik, kurang,
    });
  }

  // Tanda vital
  {
    const kunci = { td: "Tekanan darah", nadi: "Nadi", rr: "Laju napas", suhu: "Suhu", spo2: "SpO2", bbtb: "BB/TB", kesadaran: "Kesadaran" };
    const wajib = ["td", "nadi", "rr", "suhu", "spo2"];
    const dicek = new Set(sesi.ttv || []);
    const baik = wajib.filter((k) => dicek.has(k)).map((k) => kunci[k]);
    const kurang = wajib.filter((k) => !dicek.has(k)).map((k) => kunci[k]);
    if (dicek.has("bbtb")) baik.push("BB/TB (status gizi)");
    const nW = wajib.filter((k) => dicek.has(k)).length;
    const s = (nW / wajib.length) * 9 + (dicek.has("bbtb") ? 1 : 0);
    bagian.push({ nama: "Tanda Vital", bobot: 10, skor: s, perhitungan: `(${nW}/${wajib.length} × 9) + (BB/TB ${dicek.has("bbtb") ? 1 : 0}/1 × 1) = ${f1(s)}`, ringkasan: `Memeriksa ${dicek.size} parameter tanda vital.`, sudah_baik: baik, kurang });
  }

  // Pemeriksaan fisik
  {
    const dilakukan = new Set(sesi.fisik || []);
    const baik = [];
    const kurang = [];
    let n = 0;
    for (const w of kasus.fisikWajib) {
      const opsi = Array.isArray(w) ? w : [w];
      const ok = opsi.some((o) => dilakukan.has(o));
      if (ok) n++;
      (ok ? baik : kurang).push(opsi.map(namaFisik).join(" / "));
    }
    const lain = [...dilakukan].filter((id) => !kasus.fisikWajib.flat().includes(id));
    bagian.push({
      nama: "Pemeriksaan Fisik", bobot: 15, skor: (n / kasus.fisikWajib.length) * 15,
      perhitungan: `${n}/${kasus.fisikWajib.length} × 15 = ${f1((n / kasus.fisikWajib.length) * 15)}`,
      ringkasan: `${n} dari ${kasus.fisikWajib.length} pemeriksaan kunci dilakukan.${lain.length ? ` Pemeriksaan tambahan: ${lain.length}.` : ""}`,
      sudah_baik: baik, kurang,
    });
  }

  // Penunjang
  {
    const diminta = new Map((sesi.penunjang || []).map((p) => [p.id, p]));
    const baik = [];
    const kurang = [];
    let n = 0;
    let interp = 0;
    for (const w of kasus.penunjangWajib) {
      const opsi = Array.isArray(w) ? w : [w];
      const kena = opsi.filter((o) => diminta.has(o));
      if (kena.length) {
        n++;
        if (kena.some((o) => (diminta.get(o).interpretasi || "").trim().length > 5)) interp++;
      }
      (kena.length ? baik : kurang).push(opsi.map(namaPenunjang).join(" / "));
    }
    const tot = kasus.penunjangWajib.length;
    if (!tot) {
      // Diagnosis klinis: penunjang tidak wajib; dikurangi bila meminta banyak pemeriksaan yang tidak perlu
      const lebih = Math.max(0, diminta.size - 1);
      const skor = Math.max(0, 10 - lebih * 2);
      (lebih ? kurang : baik).push(lebih ? `Meminta ${diminta.size} pemeriksaan padahal diagnosis cukup klinis` : "Tidak meminta pemeriksaan yang tidak perlu (diagnosis klinis)");
      bagian.push({
        nama: "Pemeriksaan Penunjang", bobot: 10, skor,
        perhitungan: `10 − (${lebih} pemeriksaan berlebih × 2) = ${f1(skor)}`,
        ringkasan: "Diagnosis kasus ini ditegakkan secara klinis; pemeriksaan penunjang tidak wajib.", sudah_baik: baik, kurang,
      });
    } else {
    if (n && interp < n) kurang.push("Interpretasi hasil penunjang belum lengkap");
    else if (n) baik.push("Menuliskan interpretasi hasil");
    bagian.push({
      nama: "Pemeriksaan Penunjang", bobot: 10, skor: (n / tot) * 7 + (n ? (interp / tot) * 3 : 0),
      perhitungan: `(${n}/${tot} × 7) + (interpretasi ${interp}/${tot} × 3) = ${f1((n / tot) * 7 + (interp / tot) * 3)}`,
      ringkasan: `${n} dari ${tot} pemeriksaan penunjang kunci diusulkan.`, sudah_baik: baik, kurang,
    });
    }
  }

  // Diagnosis
  {
    const dx = sesi.diagnosis?.utama || "";
    const t = norm(dx);
    let s = 0;
    const baik = [];
    const kurang = [];
    if (kasus.diagnosis.sinonim.some((x) => ada(t, x))) {
      s += 10;
      baik.push(`Diagnosis utama tepat: ${dx}`);
    } else if (kasus.diagnosis.parsial.some((x) => ada(t, x))) {
      s += 5;
      baik.push(`Diagnosis utama mendekati: ${dx}`);
      kurang.push(`Diagnosis utama kurang spesifik (kunci: ${kasus.diagnosis.utama})`);
    } else {
      kurang.push(`Diagnosis utama belum tepat (kunci: ${kasus.diagnosis.utama})`);
    }
    const banding = (sesi.diagnosis?.banding || []).filter((x) => x.trim());
    const cocok = kasus.diagnosis.banding.filter((k) => banding.some((b) => bandingCocok(b, k)));
    const sUtama = s;
    s += Math.min(cocok.length, 2) * 2.5;
    var perhitunganDx = `diagnosis utama ${sUtama}/10 + banding (${Math.min(cocok.length, 2)}/2 × 5) = ${f1(s)}`;
    if (cocok.length) baik.push(`Diagnosis banding relevan: ${cocok.join(", ")}`);
    if (cocok.length < 2) kurang.push(`Tambahkan diagnosis banding, misalnya: ${kasus.diagnosis.banding.filter((k) => !cocok.includes(k)).slice(0, 3).join(", ")}`);
    bagian.push({ nama: "Diagnosis", bobot: 15, skor: s, perhitungan: perhitunganDx, ringkasan: dx ? `Diagnosis kerja: ${dx}.` : "Diagnosis belum diisi.", sudah_baik: baik, kurang });
  }

  // Tatalaksana
  {
    const { baik, kurang } = rubrikTeks(kasus.rubrikTatalaksana, sesi.tatalaksana || "");
    bagian.push({
      nama: "Tatalaksana", bobot: 12, skor: (baik.length / kasus.rubrikTatalaksana.length) * 12,
      perhitungan: `${baik.length}/${kasus.rubrikTatalaksana.length} komponen × 12 = ${f1((baik.length / kasus.rubrikTatalaksana.length) * 12)}`,
      ringkasan: sesi.tatalaksana?.trim() ? `${baik.length} dari ${kasus.rubrikTatalaksana.length} komponen tatalaksana tercakup (dinilai dari kata kunci).` : "Tatalaksana belum diisi.",
      sudah_baik: baik, kurang,
    });
  }

  // Edukasi (dari kolom edukasi + ucapan kepada pasien)
  {
    const teks = `${sesi.edukasi || ""} \n ${semuaUcapan}`;
    const { baik, kurang } = rubrikTeks(kasus.rubrikEdukasi, teks);
    bagian.push({
      nama: "Edukasi", bobot: 8, skor: (baik.length / kasus.rubrikEdukasi.length) * 8,
      perhitungan: `${baik.length}/${kasus.rubrikEdukasi.length} poin × 8 = ${f1((baik.length / kasus.rubrikEdukasi.length) * 8)}`,
      ringkasan: `${baik.length} dari ${kasus.rubrikEdukasi.length} poin edukasi tersampaikan.`, sudah_baik: baik, kurang,
    });
  }

  const total = bagian.reduce((a, b) => a + b.skor, 0);
  const terlemah = [...bagian].sort((a, b) => a.skor / a.bobot - b.skor / b.bobot).slice(0, 2);
  return {
    bagian: bagian.map((b) => ({ ...b, skor: Math.round(b.skor * 10) / 10 })),
    komentar_umum:
      `Penilaian otomatis (berdasarkan kata kunci, jadi bisa meleset bila istilahmu berbeda). Skor total ${Math.round(total)}/100. ` +
      `Bagian yang paling perlu ditingkatkan: ${terlemah.map((b) => b.nama).join(" dan ")}.`,
    saran_belajar: terlemah.flatMap((b) => b.kurang.slice(0, 3)),
  };
}
