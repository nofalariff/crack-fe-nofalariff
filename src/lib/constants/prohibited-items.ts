/**
 * Daftar barang terlarang (PRD §8.6). Dipakai di halaman Syarat & Ketentuan
 * dan pada langkah "Barang" di form booking — sumbernya harus satu agar tidak
 * pernah berbeda antara yang disetujui customer dan yang ditampilkan.
 */
export const PROHIBITED_ITEMS: { title: string; examples: string }[] = [
  {
    title: "Barang mudah terbakar, meledak, dan gas bertekanan",
    examples: "aerosol, korek api, tabung gas, kembang api",
  },
  {
    title: "Cairan berbahaya, bahan kimia korosif, dan baterai lithium lepas",
    examples: "baterai di luar perangkat, cairan kimia, aki",
  },
  {
    title: "Narkotika, obat terlarang, dan zat psikotropika",
    examples: "seluruh jenis tanpa terkecuali",
  },
  {
    title: "Senjata api, senjata tajam, dan amunisi",
    examples: "termasuk replika dan komponennya",
  },
  {
    title: "Uang tunai, logam mulia, perhiasan, dan dokumen berharga",
    examples: "emas, sertifikat, surat berharga",
  },
  {
    title: "Hewan hidup dan jenazah",
    examples: "termasuk bagian tubuh hewan yang tidak diawetkan",
  },
  {
    title: "Barang lain yang dilarang regulasi penerbangan sipil",
    examples: "mengikuti ketentuan otoritas bandara dan maskapai",
  },
]

export const PROHIBITED_ITEMS_AGREEMENT =
  "Saya menyatakan kiriman ini tidak mengandung barang terlarang seperti yang disebutkan di atas, dan bersedia menanggung konsekuensi bila pernyataan ini tidak benar."
