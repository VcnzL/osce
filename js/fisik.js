// Memetakan kalimat pemeriksaan dari dokter ("auskultasi paru", "saya ukur tekanan darah")
// ke item pemeriksaan fisik dan tanda vital. Dipakai di mode offline dan sebagai cadangan mode AI.
import { kanon, adaK } from "./offline.js";

const TEKNIK = {
  insp: ["inspeksi", "lihat", "melihat", "amati", "mengamati", "perhatikan", "observasi"],
  palp: ["palpasi", "raba", "meraba", "tekan", "menekan", "pegang"],
  perk: ["perkusi", "ketuk", "mengetuk"],
  ausk: ["auskultasi", "dengarkan", "mendengarkan", "stetoskop", "dengar"],
};
const KATA_PERIKSA = ["periksa", "pemeriksaan", "cek", "lakukan", "nilai", "evaluasi", "lihat", "observasi"];

// Wilayah tubuh yang diperiksa dengan teknik IPPA
const WILAYAH = [
  {
    kw: ["paru", "thoraks", "toraks", "thorax", "dada", "pulmo"],
    item: {
      insp: "paru_inspeksi",
      palp: "paru_palpasi",
      perk: "paru_perkusi",
      ausk: "paru_auskultasi",
    },
    khusus: { paru_palpasi: ["fremitus", "ekspansi dada", "vokal fremitus"], paru_auskultasi: ["suara napas", "bunyi napas", "wheezing", "mengi", "ronki", "vesikuler"] },
  },
  {
    kw: ["jantung", "kordis", "cor", "iktus", "ictus"],
    item: { insp: "jantung_inspal", palp: "jantung_inspal", perk: "jantung_perkusi", ausk: "jantung_auskultasi" },
    khusus: { jantung_perkusi: ["batas jantung"], jantung_auskultasi: ["bunyi jantung", "murmur", "gallop"] },
  },
  {
    kw: ["abdomen", "perut", "abdominal"],
    item: { insp: "abd_inspeksi", palp: "abd_palpasi", perk: "abd_perkusi", ausk: "abd_auskultasi" },
    khusus: {
      abd_auskultasi: ["bising usus", "peristaltik"],
      abd_perkusi: ["shifting dullness", "undulasi", "asites"],
      abd_palpasi: ["hepar", "hati", "lien", "limpa", "hepatomegali", "splenomegali", "organomegali"],
    },
    // kata kunci yang hanya berlaku bila wilayahnya disebut ("nyeri tekan perut", bukan "nyeri tekan sendi")
    perluWilayah: { abd_palpasi: ["nyeri tekan", "supel", "defans", "nyeri lepas"] },
  },
];

// Item yang dikenali dari kata kuncinya langsung
const LANGSUNG = {
  ku: ["keadaan umum", "kesan umum", "tampak sakit"],
  gizi: ["status gizi", "imt", "indeks massa tubuh"],
  kulit: ["kulit", "ruam", "petekie", "ptekie", "peteki", "bintik merah", "ikterik kulit"],
  mata_umum: ["anemis", "sklera", "ikterik", "konjungtiva palpebra inferior"],
  mulut: ["mulut", "lidah", "gusi", "bibir", "rongga mulut", "oral"],
  faring: ["faring", "tonsil", "tenggorokan", "amandel"],
  hidung: ["hidung", "rinoskopi", "konka", "nasal"],
  kgb_leher: ["kgb leher", "kelenjar leher", "kelenjar getah bening leher", "limfonodi leher", "limfadenopati"],
  jvp: ["jvp", "vena jugularis", "tekanan vena"],
  otot_bantu: ["otot bantu", "retraksi", "sternokleidomastoid", "interkostal", "cuping hidung"],
  visus: ["visus", "snellen", "tajam penglihatan", "ketajaman penglihatan", "hitung jari"],
  segmen_anterior: ["segmen anterior", "palpebra", "konjungtiva", "kornea", "bilik mata", "bmd", "iris", "lensa", "slit lamp", "kelopak mata"],
  refleks_pupil: ["refleks pupil", "refleks cahaya", "reflek pupil", "reflek cahaya", "rcl", "rctl"],
  fluoresein: ["fluoresein", "fluorescein", "fluoresens"],
  tio: ["tekanan intraokular", "tio", "tonometri", "tekanan bola mata", "palpasi bola mata"],
  kgb_preaurikular: ["preaurikular", "pre aurikular", "preauricular", "depan telinga"],
  akral: ["akral", "crt", "capillary refill", "pengisian kapiler", "perfusi", "ujung jari"],
  edema: ["edema", "pitting", "kaki bengkak", "bengkak di kaki", "bengkak tungkai", "tungkai bengkak", "edema tungkai", "edema pretibial", "pretibial"],
  tremor: ["tremor"],
  rumple_leede: ["rumple", "rumpel", "tourniquet", "torniket", "tornikuet", "uji bendung"],
  meningeal: ["meningeal", "kaku kuduk", "brudzinski", "kernig", "rangsang meningen"],
  cvat: ["cva", "costovertebra", "kostovertebra", "ketok ginjal", "nyeri ketok", "ballotement", "balotemen", "palpasi ginjal", "bimanual ginjal", "sudut kostovertebra"],
  murphy: ["murphy"],
  mcburney: ["mcburney", "mc burney", "rovsing", "titik mc"],
  psoas_obturator: ["psoas", "obturator", "obturatorius"],
  blumberg: ["blumberg", "nyeri lepas tekan", "rebound", "defans muskular", "defense muskular", "defans", "perut papan", "rigiditas"],
  anal: ["anoskopi", "anoskop", "perianal", "peri anal", "inspeksi anus", "inspeksi anal", "regio anal", "daerah anus", "benjolan anus", "prolaps"],
  suprapubik: ["suprapubik", "supra pubik", "buli buli", "kandung kemih", "vesika urinaria", "bladder", "perut bawah tengah"],
  lingkar_perut: ["lingkar perut", "lingkar pinggang", "waist", "obesitas sentral"],
  // psikiatri (status mental)
  penampilan: ["penampilan", "cara berpakaian", "perawatan diri", "psikomotor", "perilaku pasien", "sikap terhadap pemeriksa", "sikap pasien", "kontak mata"],
  mood_afek: ["mood", "afek", "suasana perasaan", "suasana hati"],
  pembicaraan: ["pembicaraan", "cara bicara", "arus bicara", "flight of ideas", "produktivitas bicara"],
  persepsi: ["halusinasi", "ilusi", "persepsi", "depersonalisasi", "derealisasi"],
  pikiran: ["proses pikir", "isi pikir", "bentuk pikir", "arus pikir", "waham", "preokupasi", "reality testing", "rta", "pikiran pasien"],
  kognitif: ["orientasi", "daya ingat", "memori", "konsentrasi", "perhatian", "kognitif", "mmse", "sensorium", "visuospasial", "pikiran abstrak", "berhitung"],
  tilikan: ["tilikan", "insight", "daya nilai", "judgment", "judgement", "pengendalian impuls", "kontrol impuls"],
  // obgyn
  vt: ["vaginal toucher", "pemeriksaan dalam", "periksa dalam", "bimanual", "colok vagina", "nyeri goyang", "adneksa", "kavum douglas", "vt "],
  payudara: ["payudara", "mammae", "mamae", "puting", "areola", "dada ibu", "kgb aksila", "aksila", "ketiak"],
  // endokrin
  tiroid: ["tiroid", "thyroid", "gondok", "struma", "menelan", "bruit tiroid", "benjolan leher", "leher depan"],
  mata_tiroid: ["eksoftalmus", "exophthalmus", "eksoftalmos", "proptosis", "lid lag", "von graefe", "joffroy", "mobius", "moebius", "stellwag", "retraksi kelopak", "retraksi palpebra", "mata menonjol", "tanda mata"],
  kaki_diabetik: ["kaki diabetik", "kaki diabetes", "monofilamen", "monofilament", "semmes", "sensasi kaki", "sensibilitas kaki", "vibrasi", "128 hz", "ankle brachial", "ulkus kaki", "luka kaki"],
  // mata
  eversi_palpebra: ["eversi", "membalik kelopak", "balik kelopak", "tarsal superior", "konjungtiva tarsal", "papil", "cobblestone", "folikel"],
  palpasi_palpebra: ["palpasi kelopak", "palpasi palpebra", "raba kelopak", "meraba kelopak", "benjolan kelopak", "benjolan di kelopak", "nyeri tekan kelopak"],
  funduskopi: ["funduskopi", "oftalmoskop", "ophthalmoscope", "fundus", "papil saraf optik", "cup disc", "retina"],
  tes_fenilefrin: ["fenilefrin", "phenylephrine", "blanching"],
  // anak & infeksi
  antropometri: ["antropometri", "z score", "zscore", "lila", "lingkar lengan", "lingkar kepala", "kurva who", "bb tb", "berat badan menurut", "status gizi anak", "plot"],
  rectal_toucher: ["colok dubur", "rectal toucher", "rektal toucher", "rt ", "dubur", "anus"],
  tes_spatula: ["spatula", "tes spatula", "refleks gigit"],
  nyeri_betis: ["betis", "otot betis", "gastroknemius", "nyeri tekan otot"],
  // kegawatdaruratan
  cek_respons: ["respons", "tepuk bahu", "menepuk bahu", "panggil pasien", "memanggil", "apakah sadar", "cek kesadaran", "bangunkan", "pak pak", "bu bu"],
  airway: ["airway", "jalan napas", "jalan nafas", "head tilt", "chin lift", "jaw thrust", "sumbatan", "gurgling", "snoring", "stridor", "buka mulut pasien"],
  napas_nadi: ["karotis", "carotis", "nadi karotis", "cek napas", "cek nafas", "look listen feel", "lihat dengar rasakan", "napas spontan", "nafas spontan", "gasping"],
  trakea: ["trakea", "deviasi trakea", "distensi vena leher", "vena leher"],
  status_hidrasi: ["turgor", "mata cekung", "mukosa kering", "dehidrasi", "status hidrasi", "air mata", "ubun ubun"],
  // THT
  telinga_luar: ["aurikula", "daun telinga", "tragus", "tarik telinga", "nyeri tarik", "retroaurikula", "belakang telinga", "mastoid", "telinga luar"],
  otoskopi: ["otoskop", "otoskopi", "liang telinga", "membran timpani", "gendang telinga", "kanalis akustikus", "lihat telinga", "periksa telinga", "dalam telinga"],
  garpu_tala: ["garpu tala", "garputala", "penala", "rinne", "weber", "schwabach", "tes pendengaran", "fungsi pendengaran"],
  sinus_paranasal: ["sinus", "nyeri ketok sinus", "nyeri tekan sinus", "transiluminasi", "pipi dan dahi"],
  // muskuloskeletal
  look: ["look", "status lokalis", "deformitas", "swelling", "pembengkakan", "jejas", "memar", "ekimosis", "inspeksi sendi", "inspeksi lutut", "inspeksi bahu", "inspeksi pergelangan", "inspeksi tungkai", "inspeksi kaki", "inspeksi lengan", "inspeksi tangan", "inspeksi luka", "inspeksi tumit", "inspeksi area"],
  feel: ["feel", "krepitasi", "nyeri tekan tulang", "nyeri tekan sendi", "nyeri tekan lokal", "palpasi sendi", "raba sendi", "palpasi lutut", "palpasi bahu", "palpasi klavikula", "palpasi tulang", "palpasi pergelangan", "palpasi tumit", "palpasi ankle", "palpasi tungkai", "palpasi lengan", "palpasi tangan", "palpasi kaki", "palpasi luka", "palpasi area", "teraba gap", "gap", "suhu sendi"],
  move: ["move", "rom sendi", "rom aktif", "rom pasif", "cek rom", "periksa rom", "nilai rom", "range of motion", "lingkup gerak", "gerak sendi", "gerakan sendi", "gerak aktif", "gerak pasif", "fleksi", "ekstensi", "dorsofleksi", "plantarfleksi", "abduksi", "rotasi", "menggerakkan sendi"],
  nv_distal: ["neurovaskular", "neurovaskuler", "nadi distal", "pulsasi distal", "pulsasi", "dorsalis pedis", "tibialis posterior", "arteri radialis", "sensorik distal", "nvd"],
  stabilitas_sendi: ["anterior drawer", "drawer", "talar tilt", "stabilitas sendi", "stabilitas ligamen", "varus", "valgus", "lachman", "stres test", "uji ligamen"],
  thompson: ["thompson", "simmonds", "remas betis", "meremas betis"],
  // kulit & kelamin
  status_dermatologis: ["status dermatologis", "status dermatologikus", "efloresensi", "ujud kelainan kulit", "ukk", "lesi kulit", "lesinya", "lesi", "inspeksi kulit", "kelainan kulit", "bercak", "bintil", "lenting", "kutil", "luka di kemaluan"],
  palpasi_lesi: ["palpasi lesi", "raba lesi", "meraba lesi", "indurasi", "konsistensi lesi", "fluktuasi", "nyeri tekan lesi", "raba luka", "meraba luka"],
  kulit_kepala: ["kulit kepala", "rambut", "alopesia", "botak", "pitak"],
  kuku: ["kuku", "pitting", "onikolisis"],
  tes_psoriasis: ["tetesan lilin", "tetes lilin", "auspitz", "kobner", "koebner", "karsvet"],
  saraf_tepi: ["saraf tepi", "penebalan saraf", "nervus ulnaris", "nervus peroneus", "aurikularis magnus", "sensibilitas lesi", "rasa raba pada lesi", "baal pada bercak", "tes sensibilitas", "anestesi lesi"],
  genitalia_pria: ["genitalia", "genital", "kemaluan", "penis", "uretra", "oue", "orifisium uretra", "milking", "skrotum", "duh tubuh"],
  genitalia_wanita: ["vulva", "inspekulo", "spekulum", "vagina", "serviks", "porsio"],
  kgb_inguinal: ["inguinal", "selangkangan", "lipat paha", "kgb inguinal"],
  // neurologi
  gcs: ["gcs", "glasgow", "glasgow coma"],
  n_kranialis: ["nervus kranialis", "saraf kranial", "nervi kranialis", "saraf otak", "n kranialis", "nervus cranialis", "saraf kepala"],
  n_fasialis: ["nervus fasialis", "nervus facialis", "n vii", "n 7", "saraf tujuh", "nervus tujuh", "mengangkat alis", "angkat alis", "kerutkan dahi", "mengerutkan dahi", "menutup mata", "tutup mata", "tersenyum", "senyum", "menggembungkan pipi", "gembungkan pipi", "meringis", "bersiul", "otot wajah", "simetris wajah", "wajah simetris", "lagoftalmus", "bell phenomenon", "fenomena bell"],
  motorik: ["motorik", "kekuatan otot", "kekuatan motorik", "tonus", "trofi", "kekuatan tangan", "kekuatan kaki", "lateralisasi", "kelemahan anggota gerak"],
  refleks_fisiologis: ["refleks fisiologis", "reflek fisiologis", "refleks biseps", "refleks triseps", "refleks patela", "refleks patella", "kpr", "apr", "bpr", "tpr", "refleks achilles", "refleks tendon"],
  refleks_patologis: ["refleks patologis", "reflek patologis", "babinski", "chaddock", "hoffman", "tromner", "oppenheim", "gordon"],
  sensorik: ["sensorik", "sensibilitas", "rasa raba", "rasa nyeri", "kapas", "jarum", "dermatom", "hipestesi", "kesemutan diperiksa"],
  koordinasi: ["koordinasi", "keseimbangan", "romberg", "jari hidung", "finger to nose", "tumit lutut", "tandem", "disdiadokokinesis", "serebelum", "fungsi serebelar"],
  dix_hallpike: ["dix hallpike", "dixhallpike", "hallpike", "dix-hallpike", "uji posisi"],
  nistagmus: ["nistagmus", "nystagmus", "gerak bola mata", "gerakan bola mata"],
  laseque: ["laseque", "lasegue", "laseq", "slr", "straight leg", "angkat tungkai", "bragard", "sicard"],
  patrick: ["patrick", "fabere", "kontrapatrick", "kontra patrick"],
  phalen_tinel: ["phalen", "tinel", "flick sign", "carpal"],
  perikranial: ["perikranial", "pericranial", "otot leher", "otot tengkuk", "otot kepala", "nyeri tekan otot", "trapezius"],
  tulang_belakang: ["tulang belakang", "vertebra", "punggung bawah", "pinggang", "paravertebra", "lumbal", "spinal"],
};

const TTV = {
  kesadaran: ["kesadaran", "gcs", "keadaan umum"],
  td: ["tekanan darah", "tensi", "td", "tensimeter", "sfigmomanometer"],
  nadi: ["nadi", "denyut", "heart rate", "frekuensi jantung", "hr"],
  rr: ["laju napas", "frekuensi napas", "respirasi", "pernapasan", "rr", "laju pernapasan", "hitung napas"],
  suhu: ["suhu", "temperatur", "termometer"],
  spo2: ["saturasi", "spo2", "oksimeter", "pulse oxymeter", "pulse oximeter"],
  bbtb: ["berat badan", "tinggi badan", "bb", "tb", "antropometri", "timbang", "imt"],
};
const STATUS_MENTAL = ["status mental", "status psikiatri", "status psikiatrikus", "pemeriksaan psikiatri", "mental status"];
const TTV_SEMUA =["tanda vital", "tanda tanda vital", "ttv", "vital sign", "tanda-tanda vital"];

/** Apakah kalimat ini jelas merupakan tindakan pemeriksaan (bukan pertanyaan anamnesis)? */
export function tampakPemeriksaan(teks) {
  const t = kanon(teks);
  // pertanyaan tentang pemeriksaan yang sudah dilakukan pasien di rumah/di tempat lain = anamnesis
  if (adaK(t, ["di rumah", "sebelumnya", "pernah", "apakah sudah", "sudah periksa", "sudah cek", "sudah diperiksa", "hasilnya berapa", "kemarin"])) return false;
  return adaK(t, [
    "periksa", "pemeriksaan", "cek", "uji", "dengarkan", "ukur", "hitung",
    ...TTV_SEMUA, "saya periksa", "saya akan memeriksa", "saya akan periksa", "saya ukur", "saya akan mengukur", "saya cek",
    "lakukan pemeriksaan", "melakukan pemeriksaan", "pemeriksaan fisik", "inspeksi", "palpasi", "perkusi", "auskultasi",
    "tekanan darah", "tensi", "saturasi", "visus",
    "tepuk bahu", "karotis", "jalan napas", "head tilt", "chin lift", "turgor", "trakea",
    "otoskopi", "otoskop", "rinoskopi", "saya lakukan", "saya tarik", "status lokalis", "look", "feel", "garpu tala",
    "tes ", "manuver", "saya raba", "saya akan meraba", "meraba", "saya tekan", "saya ketuk", "minta pasien", "meminta pasien", "coba angkat", "coba tutup", "coba tersenyum", "eversi", "funduskopi", "dix hallpike", "laseque", "lasegue", "phalen", "tinel", "patrick", "babinski", "romberg",
    "mcburney", "mc burney", "rovsing", "psoas", "obturator", "blumberg", "murphy", "anoskopi", "colok dubur", "rectal toucher", "monofilamen",
    "lingkar perut", "lingkar pinggang", "lid lag", "eksoftalmus", "nyeri ketok", "ballotement",
    ...STATUS_MENTAL, "saya nilai", "menilai", "mood dan afek", "tilikan", "inspekulo", "vaginal toucher", "pemeriksaan dalam", "bimanual",
  ]);
}

/** Mengembalikan { fisik: [id], ttv: [id] } dari kalimat pemeriksaan. */
export function cocokPemeriksaan(teks) {
  const t = kanon(teks);
  const fisik = new Set();
  const ttv = new Set();

  if (adaK(t, TTV_SEMUA)) ["kesadaran", "td", "nadi", "rr", "suhu", "spo2"].forEach((x) => ttv.add(x));
  for (const [id, kw] of Object.entries(TTV)) if (adaK(t, kw)) ttv.add(id);

  for (const w of WILAYAH) {
    let kena = false;
    for (const [id, kw] of Object.entries(w.khusus)) {
      if (adaK(t, kw)) {
        fisik.add(id);
        kena = true;
      }
    }
    if (!adaK(t, w.kw)) continue;
    for (const [id, kw] of Object.entries(w.perluWilayah || {})) {
      if (adaK(t, kw)) {
        fisik.add(id);
        kena = true;
      }
    }
    const teknik = Object.entries(TEKNIK).filter(([, kw]) => adaK(t, kw)).map(([k]) => k);
    if (teknik.length) teknik.forEach((k) => fisik.add(w.item[k]));
    else if (!kena && adaK(t, KATA_PERIKSA)) Object.values(w.item).forEach((id) => fisik.add(id)); // "periksa paru" -> IPPA
  }

  for (const [id, kw] of Object.entries(LANGSUNG)) if (adaK(t, kw)) fisik.add(id);

  // "keadaan umum" juga termasuk tanda vital kesadaran; kgb umum -> leher kecuali preaurikular
  if (!fisik.has("kgb_preaurikular") && adaK(t, ["kgb", "kelenjar getah bening"])) fisik.add("kgb_leher");
  // senter/lup juga dipakai di kulit: hanya dianggap pemeriksaan mata bila kalimat menyebut mata
  if (adaK(t, ["senter", "lup", "loupe", "penlight"]) && adaK(t, ["mata", "bola mata", "okuli"])) fisik.add("segmen_anterior");
  if (fisik.has("segmen_anterior") && adaK(t, ["refleks", "reflek"])) fisik.add("refleks_pupil");
  // "status mental/psikiatri" = seluruh komponen pemeriksaan status mental
  if (adaK(t, STATUS_MENTAL)) ["penampilan", "mood_afek", "pembicaraan", "persepsi", "pikiran", "kognitif", "tilikan"].forEach((x) => fisik.add(x));
  // kata "lihat"/"tampak" di kalimat mata tidak boleh dianggap inspeksi paru, dst. (sudah ditangani wilayah)
  return { fisik: [...fisik], ttv: [...ttv] };
}
