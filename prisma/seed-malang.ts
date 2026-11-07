import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { runSql, sqlNullableString, sqlString } from './run-sql';

// Mitra demo di sekitar Jl. Mergan Raya, Tanjungrejo, Sukun, Kota Malang. Nama usaha fiktif;
// foto dan video berupa link dummy (bukan upload Cloudinary, jadi publicId NULL).
// Aman dijalankan berulang: upsert lewat email/slug/id, jadwal & jam operasional diganti.

type FacilityType =
  | 'HOSPITAL'
  | 'CLINIC'
  | 'LABORATORY'
  | 'PHARMACY'
  | 'PHYSIOTHERAPY'
  | 'RADIOLOGY'
  | 'FUNERAL_HOME'
  | 'WELLNESS'
  | 'MASSAGE'
  | 'AMBULANCE';

type Hours = 'regular' | 'extended' | 'always';

type Service = {
  slug: string;
  name: string;
  description: string;
  priceMin: number;
  priceMax: number | null;
  durationMinutes: number;
};
type Product = {
  slug: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
};

type MalangFacility = {
  slug: string;
  email: string;
  name: string;
  type: FacilityType;
  description: string;
  address: string;
  phone: string;
  latitude: number;
  longitude: number;
  hours: Hours;
  details: object;
  internalDetails: object;
  services?: Service[];
  products?: Product[];
};

type MalangDoctor = {
  slug: string;
  email: string;
  name: string;
  specialty: string;
  bio: string;
  experienceYears: number;
  consultationFee: number;
  address: string;
  phone: string;
  latitude: number;
  longitude: number;
  details: object;
  internalDetails: object;
};

const password = process.env.SEED_DEMO_PASSWORD || 'Demo12345!';
const city = 'Kota Malang';
const area = 'Tanjungrejo, Kec. Sukun, Kota Malang, Jawa Timur 65147';
const patientEmail = 'pasien.malang@silk.local';

const photo = (slug: string) => `https://picsum.photos/seed/silk-${slug}/1200/800`;
const avatar = (slug: string) => `https://i.pravatar.cc/600?u=silk-${slug}`;
const videos = [
  'https://samplelib.com/lib/preview/mp4/sample-5s.mp4',
  'https://samplelib.com/lib/preview/mp4/sample-10s.mp4',
  'https://samplelib.com/lib/preview/mp4/sample-15s.mp4',
  'https://samplelib.com/lib/preview/mp4/sample-20s.mp4',
  'https://samplelib.com/lib/preview/mp4/sample-30s.mp4',
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'
];
const video = (index: number) => videos[index % videos.length];

const facilities: MalangFacility[] = [
  {
    slug: 'rs-sejahtera-mergan',
    email: 'rs.mergan@malang.silk.local',
    name: 'RS Sejahtera Mergan',
    type: 'HOSPITAL',
    description:
      'Rumah sakit umum dengan IGD 24 jam, rawat inap, dan poli spesialis untuk warga Sukun dan sekitarnya.',
    address: `Jl. Mergan Raya No. 88, ${area}`,
    phone: '0341560101',
    latitude: -7.9868,
    longitude: 112.6189,
    hours: 'always',
    details: {
      whatsapp: '081233560101',
      website: 'https://rs-sejahtera-mergan.example.com',
      hospitalClass: 'C',
      emergency24h: true,
      acceptsBpjs: true,
      polyclinics: ['Poli umum', 'Poli anak', 'Poli penyakit dalam', 'Poli kandungan', 'Poli gigi'],
      bedCount: 120
    },
    internalDetails: { licenseNumber: 'DEMO-MLG-RS-001' },
    services: [
      {
        slug: 'rs-sejahtera-mergan-poli-umum',
        name: 'Poli umum',
        description: 'Pemeriksaan oleh dokter umum, termasuk resep dan surat keterangan sehat.',
        priceMin: 100000,
        priceMax: 150000,
        durationMinutes: 20
      },
      {
        slug: 'rs-sejahtera-mergan-poli-anak',
        name: 'Poli anak',
        description:
          'Konsultasi tumbuh kembang, imunisasi, dan keluhan anak oleh dokter spesialis anak.',
        priceMin: 200000,
        priceMax: 300000,
        durationMinutes: 30
      },
      {
        slug: 'rs-sejahtera-mergan-medical-check-up',
        name: 'Medical check-up dasar',
        description:
          'Paket pemeriksaan fisik, darah lengkap, gula darah, kolesterol, dan rontgen dada.',
        priceMin: 450000,
        priceMax: 950000,
        durationMinutes: 120
      }
    ]
  },
  {
    slug: 'klinik-pratama-tanjungrejo-sehat',
    email: 'klinik.tanjungrejo@malang.silk.local',
    name: 'Klinik Pratama Tanjungrejo Sehat',
    type: 'CLINIC',
    description: 'Klinik pratama keluarga: pemeriksaan umum, imunisasi, KB, dan perawatan luka.',
    address: `Jl. Mergan Lori No. 15, ${area}`,
    phone: '0341560102',
    latitude: -7.9879,
    longitude: 112.6214,
    hours: 'extended',
    details: {
      whatsapp: '081233560102',
      website: 'https://klinik-tanjungrejo.example.com',
      clinicKind: 'GENERAL',
      mainServices: ['Pemeriksaan umum', 'Imunisasi', 'KB', 'Perawatan luka'],
      acceptsBpjs: true,
      inpatient: false
    },
    internalDetails: { licenseNumber: 'DEMO-MLG-KL-001' },
    services: [
      {
        slug: 'klinik-tanjungrejo-pemeriksaan-umum',
        name: 'Pemeriksaan umum',
        description: 'Konsultasi dan pemeriksaan fisik oleh dokter umum.',
        priceMin: 75000,
        priceMax: null,
        durationMinutes: 20
      },
      {
        slug: 'klinik-tanjungrejo-imunisasi',
        name: 'Imunisasi anak',
        description: 'Imunisasi dasar dan lanjutan; harga bergantung jenis vaksin.',
        priceMin: 150000,
        priceMax: 650000,
        durationMinutes: 15
      },
      {
        slug: 'klinik-tanjungrejo-perawatan-luka',
        name: 'Perawatan luka',
        description: 'Pembersihan, jahit, dan ganti balut luka ringan.',
        priceMin: 50000,
        priceMax: 200000,
        durationMinutes: 30
      }
    ]
  },
  {
    slug: 'lab-klinik-sukun-prima',
    email: 'lab.sukun@malang.silk.local',
    name: 'Laboratorium Klinik Sukun Prima',
    type: 'LABORATORY',
    description:
      'Laboratorium klinik untuk cek darah, urine, dan paket skrining dengan layanan ambil sampel ke rumah.',
    address: 'Jl. Raya Sukun No. 21, Sukun, Kec. Sukun, Kota Malang, Jawa Timur 65147',
    phone: '0341560103',
    latitude: -7.9921,
    longitude: 112.6172,
    hours: 'regular',
    details: {
      whatsapp: '081233560103',
      website: 'https://lab-sukun-prima.example.com',
      examTypes: [
        'Darah lengkap',
        'Gula darah',
        'Kolesterol',
        'Asam urat',
        'Urine lengkap',
        'Fungsi hati'
      ],
      referralRequired: false,
      homeService: true,
      resultEstimate: '3-6 jam'
    },
    internalDetails: { licenseNumber: 'DEMO-MLG-LAB-001' },
    services: [
      {
        slug: 'lab-sukun-darah-lengkap',
        name: 'Darah lengkap',
        description: 'Hemoglobin, leukosit, trombosit, dan hematokrit.',
        priceMin: 95000,
        priceMax: null,
        durationMinutes: 15
      },
      {
        slug: 'lab-sukun-paket-metabolik',
        name: 'Paket metabolik',
        description: 'Gula darah puasa, kolesterol total, trigliserida, dan asam urat.',
        priceMin: 220000,
        priceMax: null,
        durationMinutes: 15
      },
      {
        slug: 'lab-sukun-ambil-sampel-rumah',
        name: 'Ambil sampel ke rumah',
        description: 'Petugas datang ke rumah untuk wilayah Kecamatan Sukun dan Klojen.',
        priceMin: 50000,
        priceMax: 100000,
        durationMinutes: 30
      }
    ]
  },
  {
    slug: 'apotek-mergan-farma',
    email: 'apotek.mergan@malang.silk.local',
    name: 'Apotek Mergan Farma',
    type: 'PHARMACY',
    description: 'Apotek dekat Mergan untuk obat resep, obat bebas, vitamin, dan alat kesehatan.',
    address: `Jl. Mergan Raya No. 4A, ${area}`,
    phone: '0341560104',
    latitude: -7.9858,
    longitude: 112.6201,
    hours: 'extended',
    details: {
      whatsapp: '081233560104',
      website: 'https://apotek-mergan-farma.example.com',
      open24h: false,
      acceptsPrescription: true,
      delivery: true
    },
    internalDetails: {
      licenseNumber: 'DEMO-MLG-APT-001',
      pharmacistName: 'apt. Laras Widya, S.Farm.'
    },
    products: [
      {
        slug: 'mergan-paracetamol-500',
        name: 'Paracetamol 500 mg (10 tablet)',
        description: 'Pereda demam dan nyeri ringan.',
        price: 8000,
        stock: 120,
        category: 'Obat bebas'
      },
      {
        slug: 'mergan-vitamin-c-1000',
        name: 'Vitamin C 1000 mg (30 tablet)',
        description: 'Suplemen vitamin C untuk daya tahan tubuh.',
        price: 65000,
        stock: 40,
        category: 'Vitamin'
      },
      {
        slug: 'mergan-oralit',
        name: 'Oralit (5 sachet)',
        description: 'Larutan pengganti cairan tubuh saat diare.',
        price: 7500,
        stock: 80,
        category: 'Obat bebas'
      },
      {
        slug: 'mergan-termometer-digital',
        name: 'Termometer digital',
        description: 'Termometer digital ujung fleksibel, hasil dalam 60 detik.',
        price: 45000,
        stock: 25,
        category: 'Alat kesehatan'
      },
      {
        slug: 'mergan-masker-medis',
        name: 'Masker medis 3 lapis (50 pcs)',
        description: 'Masker sekali pakai untuk perlindungan harian.',
        price: 35000,
        stock: 60,
        category: 'Alat kesehatan'
      }
    ]
  },
  {
    slug: 'fisio-gerak-sukun',
    email: 'fisio.sukun@malang.silk.local',
    name: 'Fisioterapi Gerak Sukun',
    type: 'PHYSIOTHERAPY',
    description:
      'Klinik fisioterapi untuk nyeri otot, cedera olahraga, dan pemulihan pasca stroke.',
    address: `Jl. Tanjungrejo Gg. II No. 7, ${area}`,
    phone: '0341560105',
    latitude: -7.9893,
    longitude: 112.6236,
    hours: 'regular',
    details: {
      whatsapp: '081233560105',
      therapyAreas: [
        'Muskuloskeletal',
        'Cedera olahraga',
        'Neurologi (pasca stroke)',
        'Tumbuh kembang anak'
      ],
      homeVisit: true,
      referralRequired: false
    },
    internalDetails: { licenseNumber: 'DEMO-MLG-FIS-001' },
    services: [
      {
        slug: 'fisio-sukun-terapi-nyeri-punggung',
        name: 'Terapi nyeri punggung',
        description: 'Asesmen, terapi manual, dan latihan untuk nyeri punggung bawah.',
        priceMin: 150000,
        priceMax: null,
        durationMinutes: 60
      },
      {
        slug: 'fisio-sukun-pemulihan-stroke',
        name: 'Pemulihan pasca stroke',
        description: 'Latihan gerak dan keseimbangan bertahap.',
        priceMin: 200000,
        priceMax: null,
        durationMinutes: 60
      },
      {
        slug: 'fisio-sukun-kunjungan-rumah',
        name: 'Fisioterapi kunjungan rumah',
        description: 'Terapis datang ke rumah di wilayah Kota Malang.',
        priceMin: 250000,
        priceMax: 350000,
        durationMinutes: 60
      }
    ]
  },
  {
    slug: 'radiologi-citra-malang',
    email: 'radiologi.citra@malang.silk.local',
    name: 'Radiologi Citra Malang',
    type: 'RADIOLOGY',
    description:
      'Pusat radiologi dengan layanan rontgen, USG, dan CT scan; hasil dibaca dokter spesialis radiologi.',
    address: 'Jl. S. Supriadi No. 30, Sukun, Kec. Sukun, Kota Malang, Jawa Timur 65147',
    phone: '0341560106',
    latitude: -7.9947,
    longitude: 112.623,
    hours: 'regular',
    details: {
      whatsapp: '081233560106',
      website: 'https://radiologi-citra.example.com',
      modalities: ['XRAY', 'ULTRASOUND', 'CT_SCAN'],
      referralRequired: true,
      resultEstimate: '1 hari kerja'
    },
    internalDetails: { licenseNumber: 'DEMO-MLG-RAD-001' },
    services: [
      {
        slug: 'radiologi-citra-rontgen-dada',
        name: 'Rontgen dada',
        description: 'Foto toraks PA dengan ekspertise dokter radiologi.',
        priceMin: 150000,
        priceMax: null,
        durationMinutes: 15
      },
      {
        slug: 'radiologi-citra-usg-abdomen',
        name: 'USG abdomen',
        description: 'Pemeriksaan USG perut atas dan bawah.',
        priceMin: 300000,
        priceMax: 450000,
        durationMinutes: 30
      },
      {
        slug: 'radiologi-citra-ct-scan-kepala',
        name: 'CT scan kepala',
        description: 'CT scan kepala tanpa atau dengan kontras.',
        priceMin: 900000,
        priceMax: 1600000,
        durationMinutes: 45
      }
    ]
  },
  {
    slug: 'rumah-duka-kasih-abadi',
    email: 'rumahduka.kasih@malang.silk.local',
    name: 'Rumah Duka Kasih Abadi',
    type: 'FUNERAL_HOME',
    description: 'Layanan pemulasaraan, persemayaman, dan transportasi jenazah 24 jam.',
    address: 'Jl. Bandulan Raya No. 55, Bandulan, Kec. Sukun, Kota Malang, Jawa Timur 65146',
    phone: '0341560107',
    latitude: -7.9822,
    longitude: 112.6128,
    hours: 'always',
    details: {
      whatsapp: '081233560107',
      funeralServices: ['EMBALMING', 'COFFIN', 'TRANSPORT'],
      open24h: true,
      roomCapacity: 4
    },
    internalDetails: { licenseNumber: 'DEMO-MLG-RD-001' },
    services: [
      {
        slug: 'rumah-duka-kasih-pemulasaraan',
        name: 'Pemulasaraan jenazah',
        description: 'Memandikan, mengafani, atau merias jenazah sesuai keyakinan keluarga.',
        priceMin: 1500000,
        priceMax: 3500000,
        durationMinutes: 120
      },
      {
        slug: 'rumah-duka-kasih-ruang-semayam',
        name: 'Ruang persemayaman (per hari)',
        description: 'Ruang semayam ber-AC dengan kursi tamu dan sound system.',
        priceMin: 2000000,
        priceMax: 4000000,
        durationMinutes: 1440
      },
      {
        slug: 'rumah-duka-kasih-mobil-jenazah',
        name: 'Mobil jenazah dalam kota',
        description: 'Antar jenazah di wilayah Malang Raya.',
        priceMin: 750000,
        priceMax: 1500000,
        durationMinutes: 120
      }
    ]
  },
  {
    slug: 'rumah-sehat-seimbang',
    email: 'wellness.seimbang@malang.silk.local',
    name: 'Rumah Sehat Seimbang',
    type: 'WELLNESS',
    description: 'Pusat kebugaran dan relaksasi: yoga, akupresur, dan konsultasi gizi.',
    address: 'Jl. Galunggung No. 12, Gading Kasri, Kec. Klojen, Kota Malang, Jawa Timur 65115',
    phone: '0341560108',
    latitude: -7.979,
    longitude: 112.6205,
    hours: 'extended',
    details: {
      whatsapp: '081233560108',
      website: 'https://rumah-sehat-seimbang.example.com',
      serviceCategories: ['Yoga', 'Akupresur', 'Konsultasi gizi', 'Meditasi'],
      reservationRequired: true
    },
    internalDetails: { licenseNumber: 'DEMO-MLG-WEL-001' },
    services: [
      {
        slug: 'rumah-sehat-seimbang-kelas-yoga',
        name: 'Kelas yoga',
        description: 'Kelas yoga kelompok kecil untuk pemula dan menengah.',
        priceMin: 75000,
        priceMax: null,
        durationMinutes: 60
      },
      {
        slug: 'rumah-sehat-seimbang-akupresur',
        name: 'Akupresur',
        description: 'Terapi titik tekan untuk pegal dan sulit tidur.',
        priceMin: 120000,
        priceMax: null,
        durationMinutes: 60
      },
      {
        slug: 'rumah-sehat-seimbang-konsultasi-gizi',
        name: 'Konsultasi gizi',
        description: 'Konsultasi pola makan dengan ahli gizi.',
        priceMin: 100000,
        priceMax: null,
        durationMinutes: 45
      }
    ]
  },
  {
    slug: 'pijat-sehat-mergan',
    email: 'pijat.mergan@malang.silk.local',
    name: 'Pijat Sehat Mergan',
    type: 'MASSAGE',
    description:
      'Pijat tradisional dan refleksi dengan terapis bersertifikat, bisa panggilan ke rumah.',
    address: `Jl. Mergan Raya No. 40, ${area}`,
    phone: '0341560109',
    latitude: -7.9873,
    longitude: 112.6181,
    hours: 'extended',
    details: {
      whatsapp: '081233560109',
      massageTypes: ['Pijat tradisional', 'Refleksi kaki', 'Pijat bayi', 'Totok wajah'],
      therapistGender: ['MALE', 'FEMALE'],
      homeService: true,
      reservationRequired: false
    },
    internalDetails: { licenseNumber: 'DEMO-MLG-PJT-001' },
    services: [
      {
        slug: 'pijat-mergan-tradisional',
        name: 'Pijat tradisional',
        description: 'Pijat seluruh badan dengan minyak urut.',
        priceMin: 90000,
        priceMax: 130000,
        durationMinutes: 60
      },
      {
        slug: 'pijat-mergan-refleksi',
        name: 'Refleksi kaki',
        description: 'Pijat titik refleksi pada telapak kaki.',
        priceMin: 70000,
        priceMax: null,
        durationMinutes: 45
      },
      {
        slug: 'pijat-mergan-pijat-bayi',
        name: 'Pijat bayi',
        description: 'Pijat lembut untuk bayi usia 1-12 bulan.',
        priceMin: 80000,
        priceMax: null,
        durationMinutes: 30
      }
    ]
  },
  {
    slug: 'ambulans-siaga-sukun',
    email: 'ambulans.sukun@malang.silk.local',
    name: 'Ambulans Siaga Sukun',
    type: 'AMBULANCE',
    description:
      'Layanan ambulans 24 jam untuk gawat darurat, antar pasien, dan jenazah di Malang Raya.',
    address: `Jl. Raya Tanjungrejo No. 101, ${area}`,
    phone: '0341560110',
    latitude: -7.9905,
    longitude: 112.6252,
    hours: 'always',
    details: {
      whatsapp: '081233560110',
      fleetTypes: ['TRANSPORT', 'EMERGENCY', 'MORTUARY'],
      open24h: true,
      emergencyPhone: '081233560119',
      serviceAreas: ['Kota Malang', 'Kota Batu', 'Kabupaten Malang'],
      fleetSize: 6
    },
    internalDetails: { licenseNumber: 'DEMO-MLG-AMB-001' },
    services: [
      {
        slug: 'ambulans-sukun-gawat-darurat',
        name: 'Ambulans gawat darurat',
        description: 'Ambulans dengan perawat dan peralatan bantuan hidup dasar.',
        priceMin: 350000,
        priceMax: 750000,
        durationMinutes: 60
      },
      {
        slug: 'ambulans-sukun-antar-pasien',
        name: 'Antar pasien',
        description: 'Antar jemput pasien kontrol atau pulang rawat inap.',
        priceMin: 250000,
        priceMax: 500000,
        durationMinutes: 60
      },
      {
        slug: 'ambulans-sukun-jenazah',
        name: 'Ambulans jenazah',
        description: 'Antar jenazah dalam dan luar kota.',
        priceMin: 500000,
        priceMax: 2500000,
        durationMinutes: 120
      }
    ]
  }
];

const doctors: MalangDoctor[] = [
  {
    slug: 'dr-raka-pratama',
    email: 'raka@malang.silk.local',
    name: 'dr. Raka Pratama',
    specialty: 'Dokter umum',
    bio: 'Dokter umum di Klinik Pratama Tanjungrejo Sehat; fokus pada penyakit harian, hipertensi, dan diabetes.',
    experienceYears: 7,
    consultationFee: 75000,
    address: `Jl. Mergan Lori No. 15, ${area}`,
    phone: '081233560201',
    latitude: -7.9881,
    longitude: 112.6211,
    details: {
      phone: '081233560201',
      whatsapp: '081233560201',
      title: 'dr.',
      practicePlaces: ['Klinik Pratama Tanjungrejo Sehat'],
      education: ['S1 Kedokteran Universitas Brawijaya'],
      languages: ['Indonesia', 'Jawa', 'Inggris']
    },
    internalDetails: { strNumber: 'DEMO-STR-MLG-001' }
  },
  {
    slug: 'dr-nadia-kirana-sp-a',
    email: 'nadia@malang.silk.local',
    name: 'dr. Nadia Kirana, Sp.A',
    specialty: 'Spesialis anak',
    bio: 'Dokter spesialis anak di RS Sejahtera Mergan; menangani tumbuh kembang, imunisasi, dan alergi anak.',
    experienceYears: 11,
    consultationFee: 175000,
    address: `Jl. Mergan Raya No. 88, ${area}`,
    phone: '081233560202',
    latitude: -7.9866,
    longitude: 112.6192,
    details: {
      phone: '081233560202',
      whatsapp: '081233560202',
      title: 'dr., Sp.A',
      practicePlaces: ['RS Sejahtera Mergan'],
      education: ['S1 Kedokteran Universitas Brawijaya', 'Spesialis Anak Universitas Airlangga'],
      languages: ['Indonesia', 'Jawa']
    },
    internalDetails: { strNumber: 'DEMO-STR-MLG-002' }
  },
  {
    slug: 'drg-bima-santoso',
    email: 'bima@malang.silk.local',
    name: 'drg. Bima Santoso',
    specialty: 'Dokter gigi',
    bio: 'Dokter gigi praktik mandiri dekat Mergan: tambal, scaling, cabut gigi, dan perawatan gigi anak.',
    experienceYears: 9,
    consultationFee: 100000,
    address: `Jl. Mergan Raya No. 12, ${area}`,
    phone: '081233560203',
    latitude: -7.9861,
    longitude: 112.6197,
    details: {
      phone: '081233560203',
      whatsapp: '081233560203',
      title: 'drg.',
      practicePlaces: ['Praktik Gigi drg. Bima Santoso'],
      education: ['Kedokteran Gigi Universitas Airlangga'],
      languages: ['Indonesia', 'Jawa', 'Inggris']
    },
    internalDetails: { strNumber: 'DEMO-STR-MLG-003' }
  }
];

const hoursByProfile: Record<Hours, [string | null, string | null][]> = {
  // Indeks 0 = Senin (dayOfWeek 1) ... 6 = Minggu (dayOfWeek 7).
  regular: [...Array(5).fill(['08:00', '17:00']), ['08:00', '13:00'], [null, null]],
  extended: [...Array(6).fill(['08:00', '21:00']), ['09:00', '15:00']],
  always: Array(7).fill(['00:00', '23:59'])
};

const doctorSlots: [number, string, string][] = [
  [1, '08:00', '12:00'],
  [1, '16:00', '20:00'],
  [2, '16:00', '20:00'],
  [3, '08:00', '12:00'],
  [3, '16:00', '20:00'],
  [4, '16:00', '20:00'],
  [5, '08:00', '12:00'],
  [6, '09:00', '13:00']
];

const reviewComments = [
  'Pelayanannya ramah dan tidak lama menunggu.',
  'Lokasinya dekat dari Mergan, tempatnya bersih.',
  'Penjelasannya jelas, harga sesuai.',
  'Respons cepat lewat WhatsApp, sangat membantu.'
];

const facilityRole = (type: FacilityType) => (type === 'PHARMACY' ? 'PHARMACY' : 'FACILITY');
const userId = (email: string) => `(SELECT "id" FROM "User" WHERE "email" = ${sqlString(email)})`;
const facilityId = (slug: string) =>
  `(SELECT "id" FROM "Facility" WHERE "slug" = ${sqlString(slug)})`;
const doctorId = (slug: string) =>
  `(SELECT "id" FROM "DoctorProfile" WHERE "slug" = ${sqlString(slug)})`;
const json = (value: object) => `${sqlString(JSON.stringify(value))}::jsonb`;

function userSql(
  email: string,
  name: string,
  role: string,
  phone: string,
  image: string,
  hash: string
) {
  return `
INSERT INTO "User" ("id", "email", "passwordHash", "name", "phone", "image", "role", "emailVerified", "createdAt", "updatedAt")
VALUES (gen_random_uuid()::text, ${sqlString(email)}, ${sqlString(hash)}, ${sqlString(name)}, ${sqlString(phone)}, ${sqlString(image)}, ${sqlString(role)}, NOW(), NOW(), NOW())
ON CONFLICT ("email") DO UPDATE SET
  "passwordHash" = EXCLUDED."passwordHash", "name" = EXCLUDED."name", "phone" = EXCLUDED."phone",
  "image" = EXCLUDED."image", "role" = EXCLUDED."role", "emailVerified" = EXCLUDED."emailVerified",
  "deletedAt" = NULL, "updatedAt" = NOW();`;
}

// Sama dengan alur pendaftaran: trial 6 bulan sejak seed dijalankan.
function subscriptionSql(email: string) {
  return `
INSERT INTO "Subscription" ("id", "userId", "plan", "endsAt", "createdAt", "updatedAt")
VALUES (gen_random_uuid()::text, ${userId(email)}, 'FREE_TRIAL', NOW() + interval '6 months', NOW(), NOW())
ON CONFLICT ("userId") DO UPDATE SET "plan" = 'FREE_TRIAL', "endsAt" = NOW() + interval '6 months', "updatedAt" = NOW();`;
}

function facilitySql(f: MalangFacility, index: number, hash: string) {
  const hours = hoursByProfile[f.hours]
    .map(
      ([open, close], day) => `
INSERT INTO "FacilityOperatingHour" ("id", "facilityId", "dayOfWeek", "openTime", "closeTime", "isClosed", "createdAt", "updatedAt")
VALUES (gen_random_uuid()::text, ${facilityId(f.slug)}, ${day + 1}, ${sqlNullableString(open)}, ${sqlNullableString(close)}, ${open ? 'FALSE' : 'TRUE'}, NOW(), NOW());`
    )
    .join('');

  const services = (f.services ?? [])
    .map(
      (s) => `
INSERT INTO "FacilityService" ("id", "facilityId", "slug", "name", "description", "priceMin", "priceMax", "durationMinutes", "active", "createdAt", "updatedAt")
VALUES (gen_random_uuid()::text, ${facilityId(f.slug)}, ${sqlString(s.slug)}, ${sqlString(s.name)}, ${sqlString(s.description)}, ${s.priceMin}, ${s.priceMax ?? 'NULL'}, ${s.durationMinutes}, TRUE, NOW(), NOW())
ON CONFLICT ("slug") DO UPDATE SET
  "facilityId" = EXCLUDED."facilityId", "name" = EXCLUDED."name", "description" = EXCLUDED."description",
  "priceMin" = EXCLUDED."priceMin", "priceMax" = EXCLUDED."priceMax", "durationMinutes" = EXCLUDED."durationMinutes",
  "active" = TRUE, "deletedAt" = NULL, "updatedAt" = NOW();`
    )
    .join('');

  const products = (f.products ?? [])
    .map(
      (p) => `
INSERT INTO "Product" ("id", "slug", "name", "description", "price", "stock", "image", "category", "active", "facilityId", "createdAt", "updatedAt")
VALUES (gen_random_uuid()::text, ${sqlString(p.slug)}, ${sqlString(p.name)}, ${sqlString(p.description)}, ${p.price}, ${p.stock}, ${sqlString(photo(p.slug))}, ${sqlString(p.category)}, TRUE, ${facilityId(f.slug)}, NOW(), NOW())
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name", "description" = EXCLUDED."description", "price" = EXCLUDED."price",
  "stock" = EXCLUDED."stock", "image" = EXCLUDED."image", "category" = EXCLUDED."category",
  "active" = TRUE, "facilityId" = EXCLUDED."facilityId", "deletedAt" = NULL, "updatedAt" = NOW();`
    )
    .join('');

  return `${userSql(f.email, f.name, facilityRole(f.type), f.phone, photo(f.slug), hash)}
INSERT INTO "Facility" ("id", "slug", "userId", "name", "type", "description", "address", "city", "phone", "latitude", "longitude", "photoUrl", "videoUrl", "details", "internalDetails", "verificationStatus", "createdAt", "updatedAt")
VALUES (gen_random_uuid()::text, ${sqlString(f.slug)}, ${userId(f.email)}, ${sqlString(f.name)}, ${sqlString(f.type)}, ${sqlString(f.description)}, ${sqlString(f.address)}, ${sqlString(city)}, ${sqlString(f.phone)}, ${f.latitude}, ${f.longitude}, ${sqlString(photo(f.slug))}, ${sqlString(video(index))}, ${json(f.details)}, ${json(f.internalDetails)}, 'VERIFIED', NOW(), NOW())
ON CONFLICT ("slug") DO UPDATE SET
  "userId" = EXCLUDED."userId", "name" = EXCLUDED."name", "type" = EXCLUDED."type", "description" = EXCLUDED."description",
  "address" = EXCLUDED."address", "city" = EXCLUDED."city", "phone" = EXCLUDED."phone",
  "latitude" = EXCLUDED."latitude", "longitude" = EXCLUDED."longitude",
  "photoUrl" = EXCLUDED."photoUrl", "photoPublicId" = NULL, "videoUrl" = EXCLUDED."videoUrl", "videoPublicId" = NULL,
  "details" = EXCLUDED."details", "internalDetails" = EXCLUDED."internalDetails",
  "verificationStatus" = 'VERIFIED', "updatedAt" = NOW();
${subscriptionSql(f.email)}
DELETE FROM "FacilityOperatingHour" WHERE "facilityId" = ${facilityId(f.slug)};${hours}${services}${products}`;
}

function doctorSql(d: MalangDoctor, index: number, hash: string) {
  const slots = doctorSlots
    .map(
      ([day, start, end]) => `
INSERT INTO "DoctorSchedule" ("id", "doctorProfileId", "dayOfWeek", "startTime", "endTime", "isActive", "createdAt", "updatedAt")
VALUES (gen_random_uuid()::text, ${doctorId(d.slug)}, ${day}, ${sqlString(start)}, ${sqlString(end)}, TRUE, NOW(), NOW());`
    )
    .join('');

  return `${userSql(d.email, d.name, 'DOCTOR', d.phone, avatar(d.slug), hash)}
INSERT INTO "DoctorProfile" ("id", "slug", "userId", "specialty", "bio", "experienceYears", "consultationFee", "city", "address", "latitude", "longitude", "photoUrl", "videoUrl", "details", "internalDetails", "verificationStatus", "createdAt", "updatedAt")
VALUES (gen_random_uuid()::text, ${sqlString(d.slug)}, ${userId(d.email)}, ${sqlString(d.specialty)}, ${sqlString(d.bio)}, ${d.experienceYears}, ${d.consultationFee}, ${sqlString(city)}, ${sqlString(d.address)}, ${d.latitude}, ${d.longitude}, ${sqlString(avatar(d.slug))}, ${sqlString(video(index + facilities.length))}, ${json(d.details)}, ${json(d.internalDetails)}, 'VERIFIED', NOW(), NOW())
ON CONFLICT ("slug") DO UPDATE SET
  "userId" = EXCLUDED."userId", "specialty" = EXCLUDED."specialty", "bio" = EXCLUDED."bio",
  "experienceYears" = EXCLUDED."experienceYears", "consultationFee" = EXCLUDED."consultationFee",
  "city" = EXCLUDED."city", "address" = EXCLUDED."address", "latitude" = EXCLUDED."latitude", "longitude" = EXCLUDED."longitude",
  "photoUrl" = EXCLUDED."photoUrl", "photoPublicId" = NULL, "videoUrl" = EXCLUDED."videoUrl", "videoPublicId" = NULL,
  "details" = EXCLUDED."details", "internalDetails" = EXCLUDED."internalDetails",
  "verificationStatus" = 'VERIFIED', "updatedAt" = NOW();
${subscriptionSql(d.email)}
DELETE FROM "DoctorSchedule" WHERE "doctorProfileId" = ${doctorId(d.slug)};${slots}`;
}

const reelCaptions = [
  'Selamat datang! Kenalan dulu dengan kami dan layanan yang tersedia di sini. #SILK #Malang',
  'Tips singkat hari ini: jaga hidrasi dan istirahat cukup, terutama saat cuaca panas. 💧',
  'Intip suasana tempat kami, bersih dan nyaman untuk Anda dan keluarga.',
  'Pertanyaan yang sering ditanyakan pasien, kami jawab di sini. Simpan videonya ya!',
  'Jadwal layanan minggu ini sudah tersedia. Yuk reservasi lewat SILK.',
  'Terima kasih atas kepercayaan warga Sukun dan sekitarnya. Sehat selalu! 🙏'
];

// Reels dummy: video dari daftar link, sampul dari picsum. Diganti penuh tiap seed dijalankan.
function reelsSql(
  owner: { column: 'facilityId' | 'doctorProfileId'; idSql: string; slug: string },
  offset: number
) {
  const rows = reelCaptions
    .map(
      (caption, i) => `
INSERT INTO "Reel" ("id", "${owner.column}", "videoUrl", "thumbnailUrl", "caption", "createdAt", "updatedAt")
VALUES (${sqlString(`malang-reel-${owner.slug}-${i + 1}`)}, ${owner.idSql}, ${sqlString(video(offset + i))}, ${sqlString(photo(`${owner.slug}-reel-${i + 1}`))}, ${sqlString(caption)}, NOW() - interval '${i * 3 + 1} days', NOW());`
    )
    .join('');
  return `
DELETE FROM "Reel" WHERE "${owner.column}" = ${owner.idSql};${rows}`;
}

function reviewSql() {
  const targets = [
    ...doctors.map((d) => ({ slug: d.slug, doctor: doctorId(d.slug), facility: 'NULL' })),
    ...facilities.map((f) => ({ slug: f.slug, doctor: 'NULL', facility: facilityId(f.slug) }))
  ];
  const rows = targets
    .map(
      (t, i) => `
INSERT INTO "Review" ("id", "rating", "comment", "authorId", "doctorProfileId", "facilityId", "productId", "status", "createdAt", "updatedAt")
VALUES (${sqlString(`malang-review-${t.slug}`)}, ${i % 3 === 2 ? 4 : 5}, ${sqlString(reviewComments[i % reviewComments.length])}, ${userId(patientEmail)}, ${t.doctor}, ${t.facility}, NULL, 'APPROVED', NOW(), NOW())
ON CONFLICT ("id") DO UPDATE SET "rating" = EXCLUDED."rating", "comment" = EXCLUDED."comment", "status" = 'APPROVED', "updatedAt" = NOW();`
    )
    .join('');

  // Agregat rating denormalisasi, sama dengan seed-demo.
  return `${rows}
UPDATE "DoctorProfile" AS d SET "ratingAverage" = s.avg, "reviewCount" = s.cnt, "updatedAt" = NOW()
FROM (SELECT "doctorProfileId" AS id, ROUND(AVG("rating")::numeric, 2)::double precision AS avg, COUNT(*)::int AS cnt
      FROM "Review" WHERE "status" = 'APPROVED' AND "doctorProfileId" IS NOT NULL GROUP BY "doctorProfileId") AS s
WHERE d."id" = s.id;
UPDATE "Facility" AS f SET "ratingAverage" = s.avg, "reviewCount" = s.cnt, "updatedAt" = NOW()
FROM (SELECT "facilityId" AS id, ROUND(AVG("rating")::numeric, 2)::double precision AS avg, COUNT(*)::int AS cnt
      FROM "Review" WHERE "status" = 'APPROVED' AND "facilityId" IS NOT NULL GROUP BY "facilityId") AS s
WHERE f."id" = s.id;`;
}

async function main() {
  const hash = await bcrypt.hash(password, 12);

  runSql(
    [
      userSql(
        patientEmail,
        'Pasien Malang',
        'PATIENT',
        '081233560300',
        avatar('pasien-malang'),
        hash
      ),
      ...facilities.map((f, i) => facilitySql(f, i, hash)),
      ...doctors.map((d, i) => doctorSql(d, i, hash)),
      ...facilities.map((f, i) =>
        reelsSql({ column: 'facilityId', idSql: facilityId(f.slug), slug: f.slug }, i)
      ),
      ...doctors.map((d, i) =>
        reelsSql({ column: 'doctorProfileId', idSql: doctorId(d.slug), slug: d.slug }, i + 2)
      ),
      reviewSql()
    ].join('\n')
  );

  console.log(`Data mitra Malang siap: ${facilities.length} fasilitas, ${doctors.length} dokter.`);
  console.log(`Semua akun memakai password: ${password}`);
  for (const p of [...facilities, ...doctors]) console.log(`- ${p.email}`);
  console.log(`- ${patientEmail} (pasien, penulis ulasan)`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
