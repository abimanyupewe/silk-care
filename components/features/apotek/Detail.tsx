import React from 'react';

// Sub-komponen untuk bagian informasi ringkas (kolom kanan)
const InfoSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-gray-50 p-6 rounded-lg">
    <h3 className="text-lg font-bold text-gray-900 pb-4 border-b border-gray-200 mb-4">
      {title}
    </h3>
    {children}
  </div>
);

// Sub-komponen untuk baris data di info section
const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between text-sm mb-3">
    <span className="text-gray-500">{label}</span>
    <span className="font-semibold text-gray-800 text-right">{value}</span>
  </div>
);

// Sub-komponen untuk item list dengan bullet point
const ListItem = ({ children }: { children: React.ReactNode }) => (
  <li className="flex items-start gap-3">
    <span className="mt-1.5 w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0"></span>
    <span>{children}</span>
  </li>
);

export const Detail = () => {
  return (
    <section className="bg-white py-12">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Kolom Kiri: Deskripsi Detail */}
          <div className="lg:col-span-2 text-gray-700 leading-relaxed space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Deskripsi</h2>
              <p>
                <span className="font-semibold text-gray-800">Amoxicillin Tablet 500 Mg</span> bermanfaat untuk mengatasi berbagai jenis infeksi bakteri.
              </p>
              <p className="mt-4">
                Amoxicillin Tablet 500 Mg berkerja dengan cara menghambat pertumbuhan bakteri yang menyebabkan infeksi di organ paru-paru, saluran kemih, kulit, serta di bagian telinga, hidung, dan tenggorokan.
              </p>
              <p className="mt-4">
                Studi pada binatang percobaan tidak memperlihatkan adanya risiko terhadap janin, namun belum ada studi terkontrol pada wanita hamil.
              </p>
              <p className="mt-4">
                <span className="font-semibold text-gray-800">Amoxicillin Tablet 500 Mg terserap ke dalam ASI.</span> Bila Anda sedang menyusui, jangan menggunakan obat ini tanpa memberi tahu dokter terlebih dahulu.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Hal yang Perlu Diperhatikan</h3>
              <ul className="space-y-2">
                <ListItem>
                  Jangan menggunakan Amoxicillin Tablet 500 Mg jika menderita asma, penyakit ginjal, penyakit hati, mononukleosis, dan rinitis alergi.
                </ListItem>
                <ListItem>
                  Beri tahu dokter jika memiliki riwayat diare yang disebabkan oleh obat antibiotik.
                </ListItem>
                <ListItem>
                  Beri tahu dokter jika berencana untuk melakukan vaksinasi dalam waktu dekat, sebab Amoxicillin Tablet 500 Mg dapat menghambat kerja vaksin, terutama vaksin tifoid.
                </ListItem>
                 <ListItem>
                  Beri tahu dokter jika akan menjalani operasi. Dokter akan meminta konsumsi Amoxicillin Tablet 500 Mg dihentikan setidaknya dua minggu sebelum operasi.
                </ListItem>
                 <ListItem>
                  Segera ke dokter jika terjadi reaksi alergi atau overdosis setelah mengonsumsi Amoxicillin Tablet 500 Mg.
                </ListItem>
              </ul>
            </div>
            
            <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Cara Mengonsumsi Amoxicillin Tablet 500 Mg dengan Benar</h3>
                 <p>
                    Pastikan Anda mengonsumsi Amoxicillin Tablet 500 Mg sesuai dosis yang dianjurkan dokter atau keterangan yang tercantum di kemasan obat. Jangan menambah dosis tanpa berkonsultasi dulu dengan dokter.
                 </p>
                 <p className="mt-4">
                    Amoxicillin Tablet 500 Mg dapat dikonsumsi sebelum atau sesudah makan. Gunakan segelas air putih untuk menelan Amoxicillin Tablet 500 Mg. Usahakan untuk mengonsumsi Amoxsan Kapsul 500 Mg pada jam yang sama setiap harinya agar obat dapat bekerja dengan maksimal.
                 </p>
                 <p className="mt-4">
                    Jangan berhenti mengonsumsi Amoxicillin Tablet 500 Mg sebelum masa pengobatan yang ditentukan oleh dokter selesai, meskipun gejala yang dialami telah membaik.
                 </p>
                 <p className="mt-4">
                    Simpan Amoxicillin Tablet 500 Mg dalam suhu ruangan, terhindar dari panas dan lembap, serta jauhkan dari jangkauan anak-anak.
                 </p>
            </div>
          </div>

          {/* Kolom Kanan: Informasi Ringkas */}
          <div className="lg:col-span-1 space-y-6">
            <InfoSection title="">
              <InfoRow label="Komposisi" value="Amoxicillin 500 mg" />
              <InfoRow label="Kategori Obat" value="Antibiotik" />
              <InfoRow label="Dikonsumsi Oleh" value="Dewasa dan Anak-Anak" />
              <InfoRow label="Bentuk Obat" value="Kaplet" />
              <InfoRow label="Pabrik/Manufaktur" value="ERRITA" />
            </InfoSection>
            
            <InfoSection title="Dosis Dari Amoxicillin 500mg">
                <InfoRow label="Dewasa" value="250–500 mg tiap 8 jam" />
                <InfoRow label="Anak - Anak" value="berat badan di bawah 8 kg: 20 mg/ kg BB (Berat Badan) tiap 8 jam" />
            </InfoSection>

             <InfoSection title="Interaksi Amoxicillin Tablet 500 Mg dengan Obat Lain">
                <ul className="space-y-2 text-sm text-gray-700">
                    <ListItem>
                        Meningkatan risiko perdarahan, jika digunakan bersamaan dengan obat pengencer darah
                    </ListItem>
                     <ListItem>
                        Meningkatan risiko alergi, jika digunakan dengan allopurinol
                    </ListItem>
                     <ListItem>
                        Menurunkan efek samping Amoxicillin Tablet 500 Mg, jika digunakan dengan probenecid
                    </ListItem>
                    <ListItem>
                        Menurunkan efektivitas Amoxicillin Tablet 500 Mg, jika digunakan dengan chloramphenicol, makrolid, sulfonamida, dan tetracycline HCl
                    </ListItem>
                    <ListItem>
                        Menurunkan efektivitas pil KB
                    </ListItem>
                </ul>
            </InfoSection>
          </div>
        </div>
      </div>
    </section>
  );
};
