// Helper bersama untuk semua file kasus.
// Format entri anamnesis: { id, kat, label, kw: [kata kunci...], jawab, rubrik }
//   kw     : dipakai mode offline untuk mencocokkan pertanyaan
//   rubrik : poin yang dinilai (harus ditanyakan); false = hanya jawaban, tidak dinilai
export const a = (id, kat, label, kw, jawab, rubrik = true) => ({ id, kat, label, kw, jawab, rubrik });

// Kata kunci yang sering dipakai lintas kasus
export const KW = {
  keluhan: ["keluhan apa", "apa keluhan", "keluhannya", "keluhan utama", "ada yang bisa", "bisa saya bantu", "yang dirasakan", "ada apa", "kenapa", "datang ke sini", "datang kemari", "sakit apa", "masalah"],
  onset: ["sejak kapan", "berapa lama", "kapan mulai", "mulai kapan", "sudah berapa hari", "sudah berapa lama", "kapan pertama", "sudah lama"],
  rpd: ["pernah sakit", "pernah mengalami", "sebelumnya pernah", "riwayat penyakit", "penyakit dahulu", "sakit sebelumnya", "pernah seperti ini", "penyakit lain", "darah tinggi", "kencing manis", "diabetes", "hipertensi"],
  obat: ["sudah berobat", "obat", "diobati", "pengobatan", "minum apa", "sudah diapakan", "periksa ke", "salep", "krim", "dioles", "dioleskan", "pakai apa"],
  alergi: ["alergi"],
  kebiasaan: ["merokok", "rokok", "alkohol", "minuman keras", "olahraga", "kebiasaan"],
  demam: ["demam", "panas badan", "meriang", "suhu badan"],
  batukPilek: ["batuk", "pilek", "flu", "tenggorokan", "bersin"],
  keluarga: ["keluarga", "orang tua", "bapak", "ibu", "ayah", "saudara", "keturunan", "serumah", "keluarga ada", "keluarga yang", "di keluarga", "dalam keluarga", "orang tua ada", "riwayat keluarga"],
  trauma: ["trauma", "jatuh", "terbentur", "benturan", "kecelakaan", "terpukul", "cedera"],
  kerja: ["pekerjaan", "kerja", "bekerja", "kantor", "aktivitas sehari", "sehari hari"],
};

// Tugas standar stasion OSCE
export const TUGAS = [
  "Lakukan anamnesis",
  "Lakukan pemeriksaan tanda vital dan pemeriksaan fisik yang sesuai",
  "Usulkan pemeriksaan penunjang dan interpretasikan hasilnya",
  "Tegakkan diagnosis dan diagnosis banding",
  "Berikan tatalaksana dan edukasi kepada pasien",
];

// Temuan kulit dipasang di dua item ("Inspeksi kulit" umum dan "Status dermatologis")
// supaya mahasiswa yang menyebut salah satunya tetap mendapat hasil yang sama.
export const derm = (hasil, gambar) => {
  const o = { abnormal: true, hasil, ...(gambar ? { gambar } : {}) };
  return { kulit: o, status_dermatologis: o };
};
export const DERM_WAJIB = ["status_dermatologis", "kulit"];

// Entri pembuka/riwayat yang hampir selalu sama (tinggal ubah jawabannya)
export const rpdUmum = (jawab, rubrik = true) => a("rpd", "RPD", "Riwayat sakit serupa / penyakit kronik", KW.rpd, jawab, rubrik);
export const alergiObat = (jawab = "Tidak ada alergi obat, Dok.", rubrik = false) => a("alergi", "RPD", "Riwayat alergi obat", KW.alergi, jawab, rubrik);
export const keluargaUmum = (jawab, rubrik = true) => a("keluarga", "Riwayat keluarga", "Riwayat penyakit keluarga", [...KW.keluarga, "menurun", "sakit serupa di keluarga"], jawab, rubrik);
export const kebiasaanUmum = (jawab, rubrik = false) => a("kebiasaan", "Kebiasaan", "Kebiasaan (rokok, alkohol, olahraga)", KW.kebiasaan, jawab, rubrik);
export const obatUmum = (label, jawab, rubrik = true) => a("obat", "Riwayat pengobatan", label, KW.obat, jawab, rubrik);
