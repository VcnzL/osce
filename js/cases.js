// =====================================================================
//  DATA KASUS OSCE
//  Setiap kasus berisi skenario, naskah pasien (anamnesis), tanda vital,
//  temuan fisik (menimpa hasil normal di katalog.js), hasil penunjang,
//  dan kunci jawaban untuk penilaian.
//
//  Kunci jawaban adalah contoh untuk latihan. Selalu cocokkan dengan
//  PPK / panduan institusi dan sumber terbaru yang kamu pakai.
//
//  Format entri anamnesis:
//    { id, kat, label, kw: [kata kunci...], jawab, rubrik: true/false }
//    - kw    : dipakai mode offline untuk mencocokkan pertanyaan
//    - rubrik: poin yang dinilai (harus ditanyakan)
//  penunjangWajib / fisikWajib: string = wajib; array = salah satu cukup.
// =====================================================================

import { a, KW } from "./kasus/_util.js";
import { KASUS_MATA } from "./kasus/mata.js";
import { KASUS_NEURO } from "./kasus/neuro.js";
import { KASUS_KULIT } from "./kasus/kulit.js";
import { KASUS_IMS } from "./kasus/ims.js";
import { KASUS_THT } from "./kasus/tht.js";
import { KASUS_MUSKULO } from "./kasus/muskulo.js";
import { KASUS_PARU } from "./kasus/paru.js";
import { KASUS_KARDIO } from "./kasus/kardio.js";
import { KASUS_GAWAT } from "./kasus/gawat.js";
import { KASUS_INFEKSI } from "./kasus/infeksi.js";
import { KASUS_ANAK } from "./kasus/anak.js";
import { KASUS_DIGESTIF } from "./kasus/digestif.js";
import { KASUS_GINJAL } from "./kasus/ginjal.js";
import { KASUS_ENDOKRIN } from "./kasus/endokrin.js";
import { KASUS_PSIKIATRI } from "./kasus/psikiatri.js";
import { KASUS_OBGYN } from "./kasus/obgyn.js";

// Urutan sistem untuk filter di Beranda
export const SISTEM = ["Respirasi", "Kardiovaskular", "Infeksi Tropis", "Hemato-Imunologi", "Anak", "Digestif", "Ginjal & Saluran Kemih", "Endokrin & Metabolik", "Neurologi", "Psikiatri", "Obstetri & Ginekologi", "Kulit & Kelamin", "Mata", "THT", "Muskuloskeletal", "Kegawatdaruratan"];

const KASUS_AWAL = [
  // ------------------------------------------------------------------
  {
    id: "konjungtivitis-bakteri",
    judul: "Mata Merah Berbelek",
    sistem: "Mata",
    tingkat: "Mudah",
    waktuMenit: 15,
    skenario: "Seorang perempuan berusia 21 tahun datang ke Puskesmas dengan keluhan mata kiri merah.",
    tugas: [
      "Lakukan anamnesis",
      "Lakukan pemeriksaan tanda vital dan pemeriksaan fisik yang sesuai",
      "Usulkan pemeriksaan penunjang dan interpretasikan hasilnya",
      "Tegakkan diagnosis dan diagnosis banding",
      "Berikan tatalaksana dan edukasi kepada pasien",
    ],
    pasien: {
      nama: "Ayu Lestari", usia: 21, jk: "Perempuan", pekerjaan: "Mahasiswi", alamat: "Kos di Jalan Kaliurang, Yogyakarta",
      persona: "Ramah, sedikit cemas karena malu matanya merah saat kuliah.",
      keluhanUtama: "Mata kiri saya merah, Dok, dan banyak kotorannya.",
      pertanyaan: "Ini menular tidak ya, Dok? Saya masih boleh kuliah?",
    },
    anamnesis: [
      a("ku", "Keluhan utama", "Keluhan utama: mata kiri merah", KW.keluhan, "Mata kiri saya merah, Dok, dan banyak kotorannya."),
      a("onset", "RPS", "Onset: 2 hari, mendadak", KW.onset, "Sejak dua hari yang lalu, Dok. Bangun tidur tiba-tiba sudah merah."),
      a("sekret", "RPS", "Sekret: kental kuning-kehijauan, kelopak lengket pagi hari", ["belek", "kotoran", "sekret", "cairan", "lengket", "nanah"], "Iya, Dok, banyak belekan warnanya kuning kehijauan, kental. Pagi-pagi kelopak mata sampai lengket susah dibuka."),
      a("berair", "RPS", "Mata berair: tidak dominan", ["berair", "air mata", "nangis"], "Tidak terlalu berair, Dok, lebih banyak kotoran kentalnya.", false),
      a("gatal", "RPS", "Gatal: ringan", ["gatal"], "Sedikit gatal, Dok, tapi tidak terlalu."),
      a("ganjal", "RPS", "Rasa mengganjal/berpasir", ["mengganjal", "berpasir", "pasir", "perih", "panas di mata", "tidak nyaman"], "Rasanya seperti ada pasir yang mengganjal, Dok, agak perih."),
      a("nyeri", "RPS", "Nyeri hebat: tidak ada", ["nyeri", "sakit matanya", "sakit sekali", "cekot"], "Tidak nyeri sekali, Dok, cuma tidak nyaman saja."),
      a("visus", "RPS", "Penurunan penglihatan: tidak ada (kabur hilang bila sekret dibersihkan)", ["penglihatan", "kabur", "buram", "pandangan", "melihat", "rabun"], "Penglihatan tidak berkurang, Dok. Kadang buram karena kotorannya, tapi setelah berkedip atau dibersihkan jelas lagi."),
      a("silau", "RPS", "Silau/fotofobia: tidak ada", ["silau", "cahaya", "terang"], "Tidak silau, Dok."),
      a("lateral", "RPS", "Unilateral (mata kanan normal)", ["mata kanan", "kedua mata", "dua mata", "sebelah", "satu mata", "mata yang lain"], "Yang kanan masih normal, Dok, hanya yang kiri."),
      a("sistemik", "RPS", "Demam / batuk pilek: tidak ada", [...KW.demam, ...KW.batukPilek], "Tidak demam, Dok. Tidak batuk pilek juga."),
      a("trauma", "RPS", "Trauma/benda asing: tidak ada", ["kemasukan", "terkena", "kelilipan", "terbentur", "benturan", "trauma", "debu", "kena sesuatu", "kecelakaan"], "Tidak ada kemasukan apa-apa, Dok, tidak terbentur juga."),
      a("lensa", "RPS", "Pemakaian lensa kontak: tidak", ["lensa kontak", "softlens", "soft lens", "kacamata", "kontak lens"], "Saya tidak pakai softlens, Dok. Kacamata juga tidak."),
      a("rpd", "RPD", "Riwayat sakit serupa / penyakit lain: tidak ada", KW.rpd, "Belum pernah sakit mata seperti ini, Dok. Penyakit lain juga tidak ada."),
      a("alergi", "RPD", "Riwayat alergi/atopi: tidak ada", [...KW.alergi, "bersin bersin", "asma"], "Tidak ada alergi obat, makanan, atau debu, Dok. Asma juga tidak."),
      a("kontak", "Riwayat keluarga/lingkungan", "Kontak dengan penderita serupa (teman kos) + berbagi handuk", ["keluarga", "teman", "sekitar", "serumah", "kos", "menular", "tertular", "orang lain", "lingkungan", "handuk"], "Teman sekamar kos saya minggu lalu juga sakit mata merah, Dok. Kami kadang pakai handuk bareng."),
      a("obat", "Riwayat pengobatan", "Pengobatan sebelumnya: belum ada", KW.obat, "Belum diobati, Dok. Cuma saya bersihkan pakai tisu dan air hangat."),
      a("kebiasaan", "Kebiasaan", "Kebiasaan mengucek mata, kosmetik mata", ["kucek", "menggosok", "mengucek", "make up", "makeup", "kosmetik", "riasan", "eyeliner", "maskara", ...KW.kebiasaan], "Saya sering kucek mata, Dok, apalagi kalau gatal. Kadang pakai maskara kalau kuliah. Tidak merokok."),
      a("dampak", "Sosial", "Dampak pada aktivitas", ["aktivitas", "kuliah", "terganggu", "kegiatan"], "Agak terganggu kuliah, Dok, malu karena matanya merah.", false),
    ],
    ttv: { kesadaran: "Kompos mentis", td: "110/70 mmHg", nadi: "80 x/menit, reguler, kuat angkat", rr: "18 x/menit", suhu: "36,7 °C", spo2: "99 % (udara ruang)", bbtb: "52 kg / 158 cm (IMT 20,8)" },
    fisik: {
      ku: { hasil: "Tampak sakit ringan, kompos mentis." },
      visus: { hasil: "VOD 6/6, VOS 6/6 (setelah sekret dibersihkan)." },
      segmen_anterior: {
        abnormal: true, gambar: "img/konjungtivitis.svg",
        hasil: "OD: dalam batas normal.\nOS: palpebra edema ringan; sekret mukopurulen kuning kehijauan pada margo palpebra dan kantus medial; konjungtiva tarsal dan bulbi hiperemis (injeksi konjungtiva: paling merah di forniks dan memudar ke arah limbus); kornea jernih; BMD dalam; iris dan pupil normal; lensa jernih.",
      },
    },
    fisikWajib: ["visus", "segmen_anterior", "refleks_pupil", "kgb_preaurikular"],
    penunjang: {
      gram_sekret_mata: { abnormal: true, teks: "Ditemukan banyak sel PMN dan kokus Gram positif bergerombol." },
      kultur_sekret_mata: { abnormal: true, teks: "Tumbuh Staphylococcus aureus. Sensitif: kloramfenikol, gentamisin, levofloksasin. (Hasil tersedia 2–3 hari.)" },
    },
    penunjangWajib: [["gram_sekret_mata", "kultur_sekret_mata"]],
    interpretasiPenunjang: "Diagnosis umumnya klinis. Pewarnaan Gram sekret: PMN banyak dan kokus Gram positif yang mendukung infeksi bakteri; kultur hanya bila berat/tidak respons terapi.",
    diagnosis: {
      utama: "Konjungtivitis bakterial akut okuli sinistra",
      sinonim: ["konjungtivitis bakteri", "konjungtivitis bakterial", "bacterial conjunctivitis", "konjungtivitis purulen", "konjungtivitis mukopurulen", "konjungtivitis akut bakteri"],
      parsial: ["konjungtivitis"],
      banding: ["Konjungtivitis viral", "Konjungtivitis alergi", "Keratitis", "Uveitis anterior", "Glaukoma akut sudut tertutup", "Episkleritis", "Perdarahan subkonjungtiva"],
    },
    rubrikTatalaksana: [
      { poin: "Antibiotik topikal (kloramfenikol / gentamisin / fluorokuinolon tetes mata)", kw: ["kloramfenikol", "chloramphenicol", "gentamisin", "gentamicin", "levofloksasin", "levofloxacin", "ofloksasin", "ofloxacin", "tobramisin", "tobramycin", "antibiotik tetes", "tetes mata antibiotik", "salep mata"] },
      { poin: "Aturan pakai (frekuensi & lama)", kw: ["kali sehari", "x sehari", "x/hari", "kali/hari", "tiap", "setiap", "selama"] },
      { poin: "Membersihkan sekret / kompres", kw: ["bersihkan", "membersihkan", "kapas", "kasa", "kompres"] },
    ],
    rubrikEdukasi: [
      { poin: "Penyakit menular, rajin cuci tangan", kw: ["menular", "cuci tangan", "mencuci tangan"] },
      { poin: "Jangan mengucek/menyentuh mata", kw: ["kucek", "mengucek", "menggosok", "menyentuh mata", "pegang mata"] },
      { poin: "Barang pribadi terpisah (handuk, sarung bantal)", kw: ["handuk", "bantal", "barang pribadi", "terpisah", "sendiri sendiri", "tidak berbagi", "jangan berbagi"] },
      { poin: "Hindari kosmetik mata/lensa kontak sementara", kw: ["kosmetik", "make up", "makeup", "maskara", "riasan", "lensa kontak", "softlens"] },
      { poin: "Cara meneteskan obat & kontrol/tanda bahaya", kw: ["kontrol", "kembali", "nyeri", "silau", "penglihatan", "kabur", "tidak membaik", "cara meneteskan", "cara pakai"] },
    ],
    kunci: {
      tatalaksana: "Antibiotik topikal spektrum luas, misalnya kloramfenikol 0,5% tetes mata 1 tetes 4–6×/hari pada mata kiri selama 5–7 hari (dapat ditambah salep mata kloramfenikol 1% malam hari); alternatif gentamisin 0,3% atau levofloksasin 0,5% tetes mata. Bersihkan sekret dengan kapas/kasa bersih dan air matang sebelum meneteskan obat. Kompres dingin untuk kenyamanan. Tidak diberi kortikosteroid topikal.",
      edukasi: "Penyakit menular lewat tangan/benda: cuci tangan sebelum dan sesudah menyentuh mata, jangan mengucek mata, pakai handuk dan sarung bantal sendiri, buang tisu bekas, hindari kosmetik mata dan lensa kontak selama sakit. Ajarkan cara meneteskan obat dan pakai sampai tuntas. Kontrol bila tidak membaik dalam 3–5 hari atau muncul nyeri hebat, silau, atau penglihatan menurun.",
    },
  },

  // ------------------------------------------------------------------
  {
    id: "dbd",
    judul: "Demam Hari Keempat",
    sistem: "Infeksi Tropis",
    tingkat: "Sedang",
    waktuMenit: 15,
    skenario: "Seorang laki-laki berusia 19 tahun datang ke IGD Puskesmas diantar ibunya dengan keluhan demam sejak 4 hari.",
    tugas: [
      "Lakukan anamnesis",
      "Lakukan pemeriksaan tanda vital dan pemeriksaan fisik yang sesuai",
      "Usulkan pemeriksaan penunjang dan interpretasikan hasilnya",
      "Tegakkan diagnosis dan diagnosis banding",
      "Berikan tatalaksana dan edukasi kepada pasien",
    ],
    pasien: {
      nama: "Dimas Pratama", usia: 19, jk: "Laki-laki", pekerjaan: "Mahasiswa", alamat: "Bekasi Timur",
      pendamping: "Ibu pasien",
      persona: "Lemas, menjawab pelan tapi kooperatif. Agak cemas karena ada tetangga yang dirawat.",
      keluhanUtama: "Demam tinggi, Dok, sudah empat hari. Badan lemas sekali.",
      pertanyaan: "Saya harus dirawat ya, Dok? Bahaya tidak?",
    },
    anamnesis: [
      a("ku", "Keluhan utama", "Keluhan utama: demam 4 hari", KW.keluhan, "Demam tinggi, Dok, sudah empat hari. Badan lemas sekali."),
      a("onset", "RPS", "Onset: 4 hari, mendadak", KW.onset, "Mulai empat hari yang lalu, Dok, tiba-tiba langsung tinggi."),
      a("pola", "RPS", "Pola demam: mendadak tinggi, terus-menerus, turun sebentar dengan obat", ["mendadak", "tiba tiba", "naik turun", "terus menerus", "pola", "sepanjang hari", "malam", "sore", "diukur", "termometer", "berapa suhu", "berapa derajat", "tinggi sekali"], "Demamnya mendadak tinggi, Dok, terus-terusan siang malam. Diukur di rumah sampai 39 derajat lebih. Turun sebentar kalau minum obat penurun panas, lalu naik lagi."),
      a("kepala", "RPS", "Nyeri kepala & nyeri retro-orbital", ["kepala", "pusing", "bola mata", "belakang mata"], "Kepala sakit sekali, Dok, terutama di belakang bola mata."),
      a("mialgia", "RPS", "Mialgia / artralgia", ["otot", "sendi", "pegal", "linu", "ngilu", "tulang", "badan sakit"], "Iya, Dok, pegal-pegal seluruh badan, sendi-sendi juga ngilu."),
      a("gi", "RPS", "Mual, muntah 3× hari ini, nafsu makan turun", ["mual", "muntah", "nafsu makan", "makan"], "Mual, Dok, nafsu makan turun. Hari ini sudah muntah tiga kali, isinya makanan."),
      a("perut", "RPS", "Nyeri perut/ulu hati sejak kemarin", ["perut", "ulu hati", "maag", "lambung"], "Ulu hati terasa nyeri sejak kemarin, Dok."),
      a("perdarahan", "RPS", "Manifestasi perdarahan: bintik merah, gusi berdarah", ["berdarah", "darah", "mimisan", "gusi", "bintik", "ruam", "lebam", "memar", "bercak", "merah merah"], "Kemarin muncul bintik-bintik merah di lengan dan kaki, Dok. Tadi pagi gusi berdarah waktu sikat gigi. Mimisan tidak ada."),
      a("bab", "RPS", "BAB normal, tidak hitam", ["bab", "buang air besar", "mencret", "diare", "berak", "feses", "hitam"], "BAB biasa, Dok, kemarin sekali, warnanya kuning, tidak hitam."),
      a("bak", "RPS", "BAK berkurang, terakhir 4 jam lalu, pekat", ["bak", "kencing", "pipis", "buang air kecil", "urin"], "Kencing masih ada tapi lebih sedikit, Dok. Terakhir sekitar empat jam yang lalu, warnanya kuning pekat."),
      a("minum", "RPS", "Asupan cairan kurang", ["banyak minum", "minumnya", "minum air", "cairan", "berapa gelas"], "Minumnya kurang, Dok, karena mual. Paling tiga sampai empat gelas sehari."),
      a("lemas", "RPS", "Tanda syok: lemas, tidak gelisah, ekstremitas tidak dingin", ["lemas", "kesadaran", "mengantuk", "gelisah", "dingin", "pingsan", "keringat dingin"], "Lemas sekali, Dok, tapi masih bisa diajak bicara. Tangan kaki tidak dingin."),
      a("respirasi", "RPS", "Batuk/pilek/sesak: tidak ada", [...KW.batukPilek, "sesak", "napas"], "Tidak batuk, tidak pilek, tidak sesak, Dok."),
      a("menggigil", "RPS", "Menggigil periodik: tidak (singkirkan malaria)", ["menggigil", "keringat banyak", "berkeringat"], "Tidak terlalu menggigil, Dok.", false),
      a("travel", "Epidemiologi", "Riwayat bepergian ke daerah endemis malaria: tidak", ["bepergian", "perjalanan", "luar kota", "keluar kota", "luar pulau", "papua", "ntt", "hutan"], "Tidak ke mana-mana, Dok. Di rumah dan kampus saja."),
      a("lingkungan", "Epidemiologi", "Tetangga dirawat DBD, banyak nyamuk", ["tetangga", "lingkungan", "sekitar", "keluarga", "serumah", "nyamuk", "genangan", "kampung", "orang lain"], "Tetangga dua rumah dari saya minggu lalu dirawat karena demam berdarah, Dok. Di sekitar rumah memang banyak nyamuk."),
      a("banjir", "Epidemiologi", "Kontak banjir/genangan air kotor: tidak (singkirkan leptospirosis)", ["banjir", "got", "selokan", "tikus", "sawah"], "Tidak ada banjir, Dok. Saya juga tidak main di air kotor.", false),
      a("rpd", "RPD", "Riwayat sakit serupa / penyakit lain: tidak ada", KW.rpd, "Belum pernah sakit seperti ini, Dok. Tidak ada sakit lain."),
      a("obat", "Riwayat pengobatan", "Sudah minum parasetamol; tidak minum NSAID/jamu", KW.obat, "Sudah minum obat penurun panas parasetamol yang beli di warung, Dok, tiga kali sehari. Tidak minum obat lain atau jamu."),
      a("alergi", "RPD", "Alergi: tidak ada", KW.alergi, "Tidak ada alergi, Dok.", false),
      a("makan", "Kebiasaan", "Kebiasaan makan: masakan rumah", ["jajan", "warung", "makan di luar", "pola makan", "kebersihan makanan"], "Makan masakan ibu di rumah, Dok, jarang jajan.", false),
      a("kebiasaan", "Kebiasaan", "Rokok/alkohol: tidak", KW.kebiasaan, "Tidak merokok, tidak minum alkohol, Dok.", false),
    ],
    ttv: { kesadaran: "Kompos mentis", td: "110/70 mmHg", nadi: "100 x/menit, reguler, kuat angkat", rr: "20 x/menit", suhu: "38,4 °C", spo2: "98 % (udara ruang)", bbtb: "60 kg / 170 cm (IMT 20,8)" },
    fisik: {
      ku: { hasil: "Tampak sakit sedang, lemas, kompos mentis." },
      kulit: { abnormal: true, gambar: "img/petekie.svg", hasil: "Tampak petekie tersebar pada kedua lengan bawah dan tungkai bawah, tidak hilang dengan penekanan." },
      mulut: { abnormal: true, hasil: "Bibir kering. Tampak bekas perdarahan pada gusi (gum bleeding) minimal. Lidah bersih." },
      mata_umum: { hasil: "Konjungtiva tidak anemis, sklera tidak ikterik." },
      abd_palpasi: { abnormal: true, hasil: "Supel, nyeri tekan epigastrium (+). Hepar teraba 1 jari di bawah arkus kosta, tepi tajam, permukaan rata, nyeri tekan (+). Lien tidak teraba." },
      rumple_leede: { abnormal: true, gambar: "img/rumple-leede.svg", hasil: "Uji tourniquet POSITIF: ± 18 petekie per 2,5 cm × 2,5 cm di fossa kubiti." },
      akral: { hasil: "Akral hangat, kering, merah; CRT < 2 detik; nadi kuat." },
    },
    fisikWajib: ["ku", "kulit", "mulut", "paru_auskultasi", "abd_palpasi", "akral", "rumple_leede"],
    penunjang: {
      dl: { abnormal: true, tabel: [
        ["Hemoglobin", "16,2 g/dL", "13–17", "H"],
        ["Hematokrit", "49 %", "40–50 (data sebelum sakit: 40 %)", "H"],
        ["Leukosit", "3.100 /µL", "4.000–10.000", "L"],
        ["Trombosit", "62.000 /µL", "150.000–400.000", "L"],
      ] },
      diff: { abnormal: true, tabel: [
        ["Basofil", "0 %", "0–1", ""], ["Eosinofil", "1 %", "1–3", ""], ["Neutrofil batang", "2 %", "2–6", ""],
        ["Neutrofil segmen", "42 %", "50–70", "L"], ["Limfosit", "48 %", "20–40", "H"], ["Monosit", "7 %", "2–8", ""],
      ], teks: "Ditemukan limfosit plasma biru (LPB) 8 %." },
      ns1: { abnormal: true, teks: "NS1 antigen dengue: POSITIF." },
      igm_igg_dengue: { abnormal: true, tabel: [["IgM anti-dengue", "Positif", "Negatif", "H"], ["IgG anti-dengue", "Negatif", "Negatif", ""]] },
      kimia_hati: { abnormal: true, tabel: [["SGOT (AST)", "98 U/L", "< 35", "H"], ["SGPT (ALT)", "76 U/L", "< 35", "H"]] },
      widal: { tabel: [["S. typhi O", "1/80", "< 1/160", ""], ["S. typhi H", "negatif", "< 1/160", ""]] },
    },
    penunjangWajib: ["dl", ["ns1", "igm_igg_dengue"]],
    interpretasiPenunjang: "Hemokonsentrasi (Ht 49%, naik ≥ 20% dari 40%), leukopenia, trombositopenia ≤ 100.000/µL; NS1 positif dan IgM positif dengan IgG negatif → infeksi dengue primer. Transaminase meningkat.",
    diagnosis: {
      utama: "Demam berdarah dengue derajat II (dengan tanda bahaya), infeksi primer",
      sinonim: ["demam berdarah dengue", "dbd", "dengue hemorrhagic fever", "dengue haemorrhagic fever", "dhf", "dengue dengan tanda bahaya", "dengue with warning signs", "demam berdarah"],
      parsial: ["dengue", "demam dengue"],
      banding: ["Demam dengue", "Demam tifoid", "Malaria", "Leptospirosis", "Chikungunya", "Hepatitis virus akut"],
    },
    rubrikTatalaksana: [
      { poin: "Rawat inap / rujuk (ada tanda bahaya)", kw: ["rawat inap", "opname", "dirawat", "mrs", "rujuk", "observasi di"] },
      { poin: "Cairan kristaloid IV sesuai kebutuhan (RL/NaCl 0,9%)", kw: ["ringer", "rl", "nacl", "kristaloid", "infus", "cairan intravena", "iv"] },
      { poin: "Antipiretik parasetamol", kw: ["parasetamol", "paracetamol", "pct", "acetaminophen"] },
      { poin: "Hindari aspirin/NSAID & injeksi IM", kw: ["hindari", "aspirin", "nsaid", "ibuprofen", "jangan diberi", "tidak boleh", "kontraindikasi"] },
      { poin: "Pemantauan TTV, diuresis, Ht & trombosit serial", kw: ["monitor", "pantau", "observasi", "serial", "cek ulang", "periksa ulang", "evaluasi", "diuresis", "balans"] },
    ],
    rubrikEdukasi: [
      { poin: "Penjelasan penyakit (infeksi virus dengue lewat nyamuk Aedes)", kw: ["nyamuk", "virus", "dengue", "aedes", "demam berdarah"] },
      { poin: "Fase kritis & tanda bahaya (nyeri perut, muntah terus, perdarahan, lemas, akral dingin)", kw: ["tanda bahaya", "kritis", "syok", "perdarahan", "dingin", "muntah terus", "nyeri perut", "gelisah", "tidak kencing"] },
      { poin: "Minum yang cukup", kw: ["minum", "cairan", "jus", "oralit"] },
      { poin: "Pencegahan 3M Plus / PSN", kw: ["3m", "menguras", "menutup", "mengubur", "mendaur", "jentik", "psn", "abate", "kelambu", "lotion", "repelan", "anti nyamuk"] },
      { poin: "Keluarga & lingkungan (lapor ke Puskesmas/RT untuk PE)", kw: ["lapor", "puskesmas", "keluarga", "tetangga", "penyelidikan epidemiologi", "fogging"] },
    ],
    kunci: {
      tatalaksana: "Rawat inap karena terdapat tanda bahaya (muntah berulang, nyeri perut, hepatomegali, perdarahan mukosa, hemokonsentrasi). Cairan kristaloid IV (RL/NaCl 0,9%) dimulai ± 5–7 mL/kgBB/jam, dievaluasi tiap 1–2 jam lalu disesuaikan dengan Ht, TTV, dan produksi urin (target ≥ 0,5 mL/kgBB/jam). Parasetamol 500 mg PO 3–4×/hari bila demam; hindari aspirin/NSAID dan injeksi IM. Pantau TTV, tanda syok dan perdarahan, balans cairan, serta Ht dan trombosit tiap 6–12 jam.",
      edukasi: "Jelaskan bahwa ini infeksi virus dengue yang ditularkan nyamuk Aedes aegypti, tidak ada antivirus, dan pengobatan berupa cairan serta pemantauan. Fase kritis biasanya hari ke-3–5 atau saat demam turun; segera lapor bila nyeri perut hebat, muntah terus, perdarahan, sangat lemas/gelisah, tangan-kaki dingin, atau tidak kencing 4–6 jam. Minum cukup bila bisa. Pencegahan 3M Plus (menguras, menutup, mendaur ulang + abate, kelambu, lotion anti nyamuk) dan laporkan ke Puskesmas untuk penyelidikan epidemiologi.",
    },
  },

  // ------------------------------------------------------------------
  {
    id: "demam-tifoid",
    judul: "Demam Sepekan",
    sistem: "Infeksi Tropis",
    tingkat: "Sedang",
    waktuMenit: 15,
    skenario: "Seorang laki-laki berusia 24 tahun datang ke Puskesmas dengan keluhan demam sejak 1 minggu.",
    tugas: [
      "Lakukan anamnesis",
      "Lakukan pemeriksaan tanda vital dan pemeriksaan fisik yang sesuai",
      "Usulkan pemeriksaan penunjang dan interpretasikan hasilnya",
      "Tegakkan diagnosis dan diagnosis banding",
      "Berikan tatalaksana dan edukasi kepada pasien",
    ],
    pasien: {
      nama: "Andi Wijaya", usia: 24, jk: "Laki-laki", pekerjaan: "Kurir paket", alamat: "Kelurahan Sukajadi, Bandung",
      persona: "Tampak lemas, bicara pelan, cukup kooperatif. Ingin cepat sembuh karena harus bekerja.",
      keluhanUtama: "Demam sudah seminggu, Dok, tidak turun-turun.",
      pertanyaan: "Saya boleh kerja lagi kapan, Dok? Makannya harus bagaimana?",
    },
    anamnesis: [
      a("ku", "Keluhan utama", "Keluhan utama: demam 7 hari", KW.keluhan, "Demam sudah seminggu, Dok, tidak turun-turun."),
      a("onset", "RPS", "Onset: 7 hari, bertahap", KW.onset, "Sudah tujuh hari, Dok. Awalnya hanya meriang, lama-lama makin tinggi."),
      a("pola", "RPS", "Pola demam: naik bertahap, terutama sore–malam (step-ladder)", ["naik turun", "terus menerus", "pola", "sore", "malam", "pagi", "tinggi", "diukur", "termometer", "derajat", "sepanjang hari", "bertahap"], "Demamnya naik terutama sore sampai malam, Dok. Pagi agak turun tapi badan tetap hangat, tidak pernah benar-benar normal. Makin hari makin tinggi."),
      a("kepala", "RPS", "Nyeri kepala", ["kepala", "pusing"], "Kepala pusing dan berat, Dok, terutama di bagian depan."),
      a("gi", "RPS", "Mual, nafsu makan turun, tidak muntah", ["mual", "muntah", "nafsu makan"], "Mual, Dok, nafsu makan berkurang. Muntah tidak."),
      a("perut", "RPS", "Nyeri/tidak nyaman ulu hati, kembung", ["perut", "ulu hati", "kembung", "maag", "lambung"], "Ulu hati terasa tidak enak, agak nyeri, Dok. Perut juga terasa kembung."),
      a("bab", "RPS", "Konstipasi 4 hari; tidak BAB hitam/berdarah", ["bab", "buang air besar", "berak", "sembelit", "susah bab", "mencret", "diare", "feses", "hitam"], "Sudah empat hari belum BAB, Dok. Sebelumnya biasa. Tidak ada BAB hitam atau berdarah."),
      a("bak", "RPS", "BAK normal, tidak nyeri", ["bak", "kencing", "pipis", "buang air kecil", "anyang"], "Kencing biasa, Dok, tidak nyeri, warnanya kuning agak pekat.", false),
      a("perdarahan", "RPS", "Bintik merah/perdarahan: tidak ada (singkirkan dengue)", ["bintik", "ruam", "gusi", "mimisan", "berdarah", "lebam", "memar"], "Tidak ada bintik merah, Dok. Gusi tidak berdarah, tidak mimisan."),
      a("menggigil", "RPS", "Menggigil–berkeringat periodik: tidak (singkirkan malaria)", ["menggigil", "keringat", "berkeringat"], "Kadang sedikit menggigil, Dok, tapi tidak sampai keringat banjir.", false),
      a("respirasi", "RPS", "Batuk/pilek/sesak: tidak ada", [...KW.batukPilek, "sesak"], "Tidak batuk pilek, Dok, tidak sesak.", false),
      a("lemas", "RPS", "Lemas; tidak ada penurunan kesadaran/mengigau", ["lemas", "kesadaran", "mengigau", "linglung", "bingung", "tidur terus"], "Badan lemas, Dok, sudah tiga hari tidak kerja. Tidak sampai mengigau atau linglung."),
      a("higiene", "Kebiasaan", "Sering makan di warung pinggir jalan, jarang cuci tangan", ["makan", "jajan", "warung", "kebersihan", "cuci tangan", "air minum", "minum air", "pola makan", "pinggir jalan"], "Saya kurir, Dok, jadi makan hampir selalu di warung pinggir jalan. Kadang jajan es juga. Jarang cuci tangan sebelum makan."),
      a("travel", "Epidemiologi", "Bepergian ke daerah endemis malaria: tidak", ["bepergian", "perjalanan", "luar kota", "keluar kota", "luar pulau", "papua", "ntt", "hutan"], "Tidak bepergian ke luar kota, Dok, hanya keliling Bandung."),
      a("lingkungan", "Riwayat keluarga/lingkungan", "Sakit serupa di keluarga/lingkungan: tidak; tidak ada kasus DBD", ["keluarga", "serumah", "tetangga", "lingkungan", "sekitar", "teman", "orang lain", "nyamuk"], "Di rumah tidak ada yang sakit seperti ini, Dok. Tetangga setahu saya juga tidak ada yang demam berdarah."),
      a("rpd", "RPD", "Riwayat sakit serupa / penyakit lain: tidak ada", KW.rpd, "Belum pernah sakit seperti ini, Dok. Tidak ada penyakit lain."),
      a("obat", "Riwayat pengobatan", "Sudah minum parasetamol, belum antibiotik", KW.obat, "Sudah minum parasetamol dari warung, Dok. Demamnya turun sebentar lalu naik lagi. Belum minum antibiotik."),
      a("alergi", "RPD", "Alergi obat: tidak ada", KW.alergi, "Tidak ada alergi obat, Dok."),
      a("kebiasaan", "Kebiasaan", "Merokok ½ bungkus/hari, tidak alkohol", KW.kebiasaan, "Merokok setengah bungkus sehari, Dok. Tidak minum alkohol.", false),
    ],
    ttv: { kesadaran: "Kompos mentis", td: "110/70 mmHg", nadi: "84 x/menit, reguler, kuat angkat (bradikardia relatif)", rr: "20 x/menit", suhu: "38,9 °C", spo2: "98 % (udara ruang)", bbtb: "62 kg / 168 cm (IMT 22)" },
    fisik: {
      ku: { hasil: "Tampak sakit sedang, lemas, kompos mentis." },
      mulut: { abnormal: true, gambar: "img/lidah-kotor.svg", hasil: "Bibir kering. Lidah kotor (coated tongue): selaput putih di bagian tengah dengan tepi dan ujung hiperemis, tremor (+) saat dijulurkan. Gusi tidak berdarah." },
      abd_auskultasi: { hasil: "Bising usus menurun (± 4x/menit)." , abnormal: true },
      abd_palpasi: { abnormal: true, hasil: "Supel, nyeri tekan epigastrium (+). Hepar teraba 1 jari di bawah arkus kosta, kenyal, tepi tajam (hepatomegali ringan). Lien tidak teraba." },
      kulit: { hasil: "Tidak tampak petekie maupun ruam; rose spot tidak ditemukan." },
    },
    fisikWajib: ["ku", "mulut", "abd_auskultasi", "abd_palpasi", "kulit"],
    penunjang: {
      dl: { abnormal: true, tabel: [
        ["Hemoglobin", "13,6 g/dL", "13–17", ""],
        ["Hematokrit", "40 %", "40–50", ""],
        ["Leukosit", "3.800 /µL", "4.000–10.000", "L"],
        ["Trombosit", "165.000 /µL", "150.000–400.000", ""],
      ] },
      diff: { abnormal: true, tabel: [
        ["Basofil", "0 %", "0–1", ""], ["Eosinofil", "0 %", "1–3", "L"], ["Neutrofil batang", "3 %", "2–6", ""],
        ["Neutrofil segmen", "48 %", "50–70", "L"], ["Limfosit", "44 %", "20–40", "H"], ["Monosit", "5 %", "2–8", ""],
      ] },
      tubex: { abnormal: true, tabel: [["Skor Tubex", "6", "≤ 2 negatif; 3 borderline; 4–5 positif lemah; ≥ 6 positif kuat", "H"]] },
      widal: { abnormal: true, tabel: [["S. typhi O", "1/320", "< 1/160", "H"], ["S. typhi H", "1/160", "< 1/160", "H"], ["S. paratyphi AO", "negatif", "", ""], ["S. paratyphi BO", "negatif", "", ""]] },
      kultur_darah: { abnormal: true, teks: "Tumbuh Salmonella enterica serovar Typhi. Sensitif: kloramfenikol, seftriakson, siprofloksasin, sefiksim. (Hasil tersedia 3–5 hari.)" },
      kimia_hati: { abnormal: true, tabel: [["SGOT (AST)", "56 U/L", "< 35", "H"], ["SGPT (ALT)", "48 U/L", "< 35", "H"]] },
    },
    penunjangWajib: ["dl", ["tubex", "widal", "kultur_darah"]],
    interpretasiPenunjang: "Leukopenia ringan dengan aneosinofilia dan limfositosis relatif; Tubex skor 6 (positif kuat) mendukung demam tifoid; Widal O 1/320 (tunggal, kurang spesifik); kultur darah S. Typhi adalah baku emas. Peningkatan ringan transaminase.",
    diagnosis: {
      utama: "Demam tifoid",
      sinonim: ["demam tifoid", "tifoid", "typhoid", "tipes", "tifus abdominalis", "typhus abdominalis", "demam enterik", "enteric fever"],
      parsial: ["salmonella", "paratifoid"],
      banding: ["Infeksi dengue (DD/DBD)", "Malaria", "Leptospirosis", "Infeksi saluran kemih", "Hepatitis virus akut", "Tuberkulosis"],
    },
    rubrikTatalaksana: [
      { poin: "Antibiotik lini pertama (kloramfenikol / tiamfenikol / kotrimoksazol / amoksisilin / fluorokuinolon / sefiksim)", kw: ["kloramfenikol", "chloramphenicol", "tiamfenikol", "thiamphenicol", "kotrimoksazol", "cotrimoxazole", "siprofloksasin", "ciprofloxacin", "levofloksasin", "levofloxacin", "amoksisilin", "amoxicillin", "ampisilin", "sefiksim", "cefixime", "seftriakson", "ceftriaxone", "azitromisin", "azithromycin"] },
      { poin: "Dosis & lama antibiotik", kw: ["mg", "hari", "x sehari", "kali sehari", "bebas demam"] },
      { poin: "Antipiretik", kw: ["parasetamol", "paracetamol", "pct", "antipiretik"] },
      { poin: "Tirah baring", kw: ["tirah baring", "istirahat", "bed rest", "bedrest"] },
      { poin: "Diet lunak rendah serat, cukup cairan", kw: ["diet", "bubur", "lunak", "rendah serat", "tinggi kalori", "nasi tim"] },
    ],
    rubrikEdukasi: [
      { poin: "Penyebab & penularan (fekal-oral lewat makanan/minuman)", kw: ["bakteri", "kuman", "salmonella", "makanan", "minuman", "menular", "tertular"] },
      { poin: "Higiene: cuci tangan, makanan & air matang/bersih", kw: ["cuci tangan", "matang", "dimasak", "bersih", "jajan", "warung", "air minum"] },
      { poin: "Minum antibiotik teratur sampai habis", kw: ["habiskan", "sampai habis", "teratur", "tuntas", "jangan berhenti"] },
      { poin: "Tanda bahaya komplikasi (BAB hitam, nyeri perut hebat, penurunan kesadaran) & kontrol", kw: ["bab hitam", "berdarah", "nyeri perut hebat", "kesadaran", "perforasi", "segera kembali", "kontrol", "tanda bahaya"] },
      { poin: "Pencegahan lanjut (vaksin tifoid, karier)", kw: ["vaksin", "imunisasi", "karier", "carrier", "pembawa"] },
    ],
    kunci: {
      tatalaksana: "Rawat jalan bila masih bisa makan-minum dan tanpa komplikasi. Antibiotik: kloramfenikol 4×500 mg PO sampai 7 hari bebas demam; alternatif tiamfenikol 4×500 mg, kotrimoksazol 2×960 mg selama 10 hari, amoksisilin 3×1 g selama 10–14 hari, siprofloksasin 2×500 mg selama 7–10 hari, atau sefiksim 2×200 mg (sesuaikan pola resistensi setempat). Parasetamol 3×500 mg bila demam. Tirah baring, diet lunak rendah serat tinggi kalori-protein, cukup cairan.",
      edukasi: "Jelaskan bahwa ini infeksi bakteri Salmonella Typhi yang menular melalui makanan/minuman tercemar. Cuci tangan pakai sabun sebelum makan dan setelah BAB, konsumsi makanan dan air yang dimasak matang, kurangi jajan di tempat yang kurang bersih. Minum antibiotik teratur sampai habis. Segera kembali bila BAB hitam/berdarah, nyeri perut hebat, muntah terus, atau gelisah/penurunan kesadaran. Kontrol setelah obat habis. Vaksin tifoid dapat dipertimbangkan.",
    },
  },

  // ------------------------------------------------------------------
  {
    id: "asma-eksaserbasi",
    judul: "Sesak Napas Berbunyi",
    sistem: "Respirasi",
    tingkat: "Sedang",
    waktuMenit: 15,
    skenario: "Seorang perempuan berusia 32 tahun datang ke IGD Puskesmas dengan keluhan sesak napas sejak 3 jam yang lalu.",
    tugas: [
      "Lakukan anamnesis",
      "Lakukan pemeriksaan tanda vital dan pemeriksaan fisik yang sesuai",
      "Usulkan pemeriksaan penunjang dan interpretasikan hasilnya",
      "Tegakkan diagnosis dan diagnosis banding",
      "Berikan tatalaksana dan edukasi kepada pasien",
    ],
    pasien: {
      nama: "Sari Wulandari", usia: 32, jk: "Perempuan", pekerjaan: "Karyawan konveksi", alamat: "Kecamatan Cicalengka, Kabupaten Bandung",
      persona: "Sesak sehingga bicara terpenggal-penggal per frasa (gunakan '...' untuk jeda), tidak gelisah, kooperatif.",
      keluhanUtama: "Sesak napas, Dok... napas saya bunyi ngik-ngik.",
      pertanyaan: "Asma saya bisa sembuh tidak, Dok?... Obatnya harus dipakai terus?",
    },
    anamnesis: [
      a("ku", "Keluhan utama", "Keluhan utama: sesak napas", KW.keluhan, "Sesak napas, Dok... napas saya bunyi ngik-ngik."),
      a("onset", "RPS", "Onset: 3 jam, mendadak", KW.onset, "Sejak... tiga jam lalu, Dok... habis bersih-bersih gudang."),
      a("pencetus", "RPS", "Pencetus: debu (membersihkan gudang); biasa kambuh karena debu/udara dingin", ["pencetus", "dipicu", "memicu", "sebelum sesak", "habis apa", "sedang apa", "debu", "dingin", "kambuh karena", "penyebab"], "Habis bersih-bersih gudang... berdebu, Dok. Biasanya kambuh kalau kena debu... atau udara dingin."),
      a("mengi", "RPS", "Mengi (wheezing)", ["bunyi", "mengi", "ngik", "suara napas", "berbunyi"], "Iya, Dok... ngik-ngik... kedengaran sendiri."),
      a("batuk", "RPS", "Batuk kering, dahak sedikit putih", ["batuk", "dahak", "riak"], "Batuk kering, Dok... dahaknya sedikit, putih."),
      a("dada", "RPS", "Dada terasa berat, bukan nyeri tajam", ["dada", "berat", "nyeri dada", "tertekan", "diikat"], "Dada terasa berat... seperti diikat, Dok. Tidak nyeri tajam."),
      a("derajat", "RPS", "Derajat sesak: bicara per frasa, lebih nyaman duduk", ["posisi", "berbaring", "tiduran", "duduk", "bicara", "berjalan", "aktivitas", "seberapa sesak", "makin berat"], "Lebih enak duduk, Dok... kalau berbaring makin sesak... ngomong juga harus berhenti-henti."),
      a("demam", "RPS", "Demam: tidak ada (singkirkan infeksi)", KW.demam, "Tidak demam, Dok."),
      a("riwayat_asma", "RPD", "Riwayat asma sejak kecil; kambuh 2–3×/bulan, gejala malam 2×/bulan", ["riwayat", "sebelumnya", "asma", "sering kambuh", "berapa kali", "serangan", "pernah seperti ini", "pernah sesak", "malam hari", "terbangun"], "Saya punya asma dari kecil, Dok... Sebulan terakhir kambuh dua sampai tiga kali... malam juga dua kali terbangun karena sesak."),
      a("obat", "Riwayat pengobatan", "Salbutamol inhaler 2 semprot (sedikit membaik); obat pengontrol tidak rutin", ["obat", "semprot", "inhaler", "pengobatan", "sudah diobati", "pengontrol", "pencegah"], "Saya punya semprotan salbutamol, Dok... tadi sudah dua kali semprot... cuma sedikit lega. Obat pencegah dulu dikasih... tapi jarang saya pakai."),
      a("rawat", "RPD", "Riwayat dirawat karena asma: 1× (SMA), tidak pernah intubasi", ["dirawat", "opname", "rumah sakit", "igd", "ventilator", "selang", "icu", "alat bantu"], "Pernah dirawat di rumah sakit... sekali, waktu SMA, Dok. Tidak pernah sampai pakai alat bantu napas."),
      a("atopi", "RPD", "Atopi: alergi debu & bulu kucing, rinitis alergi; tidak alergi obat", ["alergi", "bersin", "hidung", "gatal", "kulit", "eksim", "kucing"], "Alergi debu... dan bulu kucing, Dok. Sering bersin-bersin pagi... hidung gatal. Alergi obat tidak ada."),
      a("keluarga", "Riwayat keluarga", "Riwayat asma pada ibu", ["keluarga", "orang tua", "ibu", "ayah", "saudara", "keturunan"], "Ibu saya... juga asma, Dok."),
      a("rokok", "Kebiasaan", "Merokok/terpapar asap rokok: tidak", ["merokok", "rokok", "asap", "suami"], "Saya tidak merokok... suami juga tidak, Dok."),
      a("pekerjaan", "Sosial", "Pajanan pekerjaan: debu kain di konveksi", ["pekerjaan", "kerja", "kantor", "pabrik", "tempat kerja", "lingkungan rumah"], "Saya kerja di konveksi... banyak debu kain, Dok."),
      a("jantung", "RPD", "Gejala jantung (bengkak kaki, ortopnea, nyeri dada): tidak", ["kaki bengkak", "bengkak", "jantung", "bantal", "darah tinggi", "hipertensi"], "Kaki tidak bengkak, Dok... tidak ada sakit jantung atau darah tinggi."),
      a("obat_lain", "Riwayat pengobatan", "Obat pencetus (aspirin/NSAID/beta-blocker): tidak", ["obat lain", "aspirin", "obat nyeri", "obat sakit kepala", "ibuprofen", "propranolol"], "Tidak minum obat lain, Dok.", false),
      a("hamil", "Riwayat obstetri", "Kehamilan: tidak hamil, HPHT 2 minggu lalu", ["hamil", "haid", "menstruasi", "mens", "datang bulan", "kb"], "Tidak sedang hamil, Dok... haid terakhir dua minggu lalu.", false),
    ],
    ttv: { kesadaran: "Kompos mentis", td: "120/80 mmHg", nadi: "110 x/menit, reguler, kuat angkat", rr: "26 x/menit", suhu: "36,7 °C", spo2: "93 % (udara ruang)", bbtb: "55 kg / 155 cm (IMT 22,9)" },
    fisik: {
      ku: { abnormal: true, hasil: "Tampak sesak, lebih nyaman posisi duduk, bicara dalam frasa (kalimat terpenggal), tidak gelisah, kompos mentis." },
      otot_bantu: { abnormal: true, hasil: "Retraksi interkostal ringan; otot sternokleidomastoid tidak tampak aktif." },
      hidung: { abnormal: true, hasil: "Konka inferior edema, mukosa pucat-livid, sekret serosa (kesan rinitis alergi)." },
      paru_inspeksi: { abnormal: true, hasil: "Dada simetris, retraksi interkostal ringan, fase ekspirasi memanjang." },
      paru_palpasi: { hasil: "Ekspansi dada simetris, fremitus taktil kanan = kiri." },
      paru_perkusi: { hasil: "Sonor di kedua lapang paru." },
      paru_auskultasi: { abnormal: true, suara: "wheezing", hasil: "Suara napas vesikuler +/+ dengan ekspirasi memanjang. Wheezing ekspiratoir +/+ di seluruh lapang paru. Ronki -/-." },
      jantung_auskultasi: { hasil: "Bunyi jantung I-II reguler, takikardia, murmur (-), gallop (-)." },
    },
    fisikWajib: ["ku", "paru_inspeksi", "paru_palpasi", "paru_perkusi", "paru_auskultasi", "jantung_auskultasi"],
    penunjang: {
      ape: { abnormal: true, tabel: [["APE", "270 L/menit", "Prediksi 435 L/menit", "L"], ["% prediksi", "62 %", "> 80 %", "L"]] },
      rontgen_thoraks: { abnormal: true, teks: "Hiperinflasi ringan (diafragma mendatar, sela iga melebar). Tidak tampak infiltrat maupun pneumotoraks. Cor tidak membesar. Kesan: sesuai gambaran asma, tidak ada komplikasi." },
      diff: { abnormal: true, tabel: [
        ["Basofil", "0 %", "0–1", ""], ["Eosinofil", "8 %", "1–3", "H"], ["Neutrofil batang", "3 %", "2–6", ""],
        ["Neutrofil segmen", "57 %", "50–70", ""], ["Limfosit", "27 %", "20–40", ""], ["Monosit", "5 %", "2–8", ""],
      ] },
      agd: { abnormal: true, tabel: [["pH", "7,46", "7,35–7,45", "H"], ["pCO2", "34 mmHg", "35–45", "L"], ["pO2", "68 mmHg", "80–100", "L"], ["HCO3", "24 mmol/L", "22–26", ""], ["SaO2", "93 %", "> 95", "L"]] },
      spirometri: { teks: "Spirometri tidak dilakukan saat serangan akut; dianjurkan saat kondisi stabil. Data lama (2 tahun lalu): FEV1/FVC 68%, reversibilitas FEV1 18% setelah bronkodilator." },
    },
    penunjangWajib: ["ape"],
    interpretasiPenunjang: "APE 62% prediksi menunjukkan eksaserbasi derajat sedang (GINA: ringan–sedang bila APE > 50%). Rontgen: hiperinflasi tanpa pneumonia/pneumotoraks. AGD: hipoksemia ringan dengan alkalosis respiratorik (hiperventilasi, belum ada retensi CO2). Eosinofilia mendukung asma alergi.",
    diagnosis: {
      utama: "Asma eksaserbasi akut derajat sedang pada asma tidak terkontrol",
      sinonim: ["asma", "asthma", "serangan asma", "eksaserbasi asma", "status asmatikus"],
      parsial: [],
      banding: ["PPOK eksaserbasi akut", "Gagal jantung akut (asma kardial)", "Bronkitis akut", "Pneumonia", "Aspirasi benda asing", "Disfungsi pita suara", "Pneumotoraks"],
    },
    rubrikTatalaksana: [
      { poin: "Oksigen dengan target SpO2 93–96%", kw: ["oksigen", "o2", "nasal kanul", "nasal cannula", "kanul"] },
      { poin: "SABA inhalasi (salbutamol nebulisasi/MDI-spacer) tiap 20 menit dalam 1 jam", kw: ["salbutamol", "albuterol", "saba", "nebul", "ventolin", "beta 2", "beta2", "beta agonis", "combivent", "berotec", "fenoterol"] },
      { poin: "Kortikosteroid sistemik (prednison/prednisolon 40–50 mg)", kw: ["prednison", "prednisone", "prednisolon", "metilprednisolon", "methylprednisolone", "kortikosteroid", "steroid", "deksametason", "dexamethasone"] },
      { poin: "Evaluasi ulang setelah 1 jam (gejala, SpO2, APE)", kw: ["evaluasi", "nilai ulang", "reevaluasi", "1 jam", "satu jam", "ulang ape", "observasi"] },
      { poin: "Obat pengontrol (ICS / ICS-formoterol) saat pulang", kw: ["ics", "budesonid", "budesonide", "formoterol", "flutikason", "fluticasone", "pengontrol", "controller", "symbicort", "seretide", "kortikosteroid inhalasi"] },
    ],
    rubrikEdukasi: [
      { poin: "Hindari pencetus (debu, bulu kucing, udara dingin); masker saat kerja", kw: ["pencetus", "debu", "masker", "kucing", "alergen", "dingin", "hindari"] },
      { poin: "Teknik penggunaan inhaler yang benar", kw: ["teknik", "cara pakai", "cara menggunakan", "spacer", "inhaler"] },
      { poin: "Kepatuhan obat pengontrol (rutin walau tidak sesak)", kw: ["rutin", "teratur", "setiap hari", "pengontrol", "pencegah", "walaupun tidak sesak"] },
      { poin: "Rencana aksi asma & tanda bahaya", kw: ["rencana aksi", "tanda bahaya", "segera ke", "igd", "memburuk", "bibir biru", "tidak membaik", "sulit bicara"] },
      { poin: "Kontrol ulang", kw: ["kontrol", "kembali", "follow up", "periksa lagi"] },
    ],
    kunci: {
      tatalaksana: "Posisi duduk, O2 nasal kanul dititrasi untuk target SpO2 93–96%. SABA inhalasi: salbutamol 2,5–5 mg nebulisasi (atau MDI + spacer 4–10 semprot) tiap 20 menit pada jam pertama; pertimbangkan ipratropium bromida. Kortikosteroid sistemik: prednison/prednisolon 40–50 mg/hari PO selama 5–7 hari. Evaluasi ulang gejala, SpO2, dan APE setelah 1 jam; bila membaik (APE > 60–80% prediksi, SpO2 > 94% udara ruang) boleh pulang dengan reliever, steroid oral, dan obat pengontrol berupa ICS (misalnya budesonid-formoterol), kontrol dalam 2–7 hari. Bila tidak membaik atau memburuk, rujuk ke rumah sakit.",
      edukasi: "Jelaskan asma sebagai peradangan kronik saluran napas yang dapat dikontrol. Hindari pencetus (debu, bulu kucing, udara dingin), gunakan masker saat bekerja. Ajarkan dan cek teknik inhaler/spacer. Obat pengontrol dipakai rutin walaupun tidak sesak, reliever hanya saat sesak. Berikan rencana aksi asma tertulis dan tanda bahaya (sulit bicara, bibir kebiruan, reliever tidak membantu) yang harus segera ke IGD. Kontrol ulang 2–7 hari lagi.",
    },
  },
];

export const CASES = [...KASUS_AWAL, ...KASUS_MATA, ...KASUS_NEURO, ...KASUS_KULIT, ...KASUS_IMS, ...KASUS_THT, ...KASUS_MUSKULO, ...KASUS_PARU, ...KASUS_KARDIO, ...KASUS_GAWAT, ...KASUS_INFEKSI, ...KASUS_ANAK, ...KASUS_DIGESTIF, ...KASUS_GINJAL, ...KASUS_ENDOKRIN, ...KASUS_PSIKIATRI, ...KASUS_OBGYN];
