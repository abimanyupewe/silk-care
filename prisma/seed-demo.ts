import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { runSql, sqlNullableString, sqlString } from './run-sql';

type DemoUser = {
  email: string;
  name: string;
  role: 'DOCTOR' | 'FACILITY' | 'PHARMACY' | 'PATIENT';
  phone: string | null;
  image: string | null;
};

type DemoDoctor = {
  slug: string;
  email: string;
  specialty: string;
  bio: string;
  experienceYears: number;
  consultationFee: number;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
};

type DemoFacility = {
  slug: string;
  email: string;
  name: string;
  type: 'CLINIC' | 'PHARMACY';
  description: string;
  address: string;
  city: string;
  phone: string;
  latitude: number;
  longitude: number;
};

type DemoArticle = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
};

type DemoProduct = {
  slug: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image: string;
  category: string;
  facilitySlug: string;
};

type DemoReview = {
  id: string;
  rating: number;
  comment: string;
  authorEmail: string;
  doctorSlug: string | null;
  facilitySlug: string | null;
  productSlug: string | null;
};

const demoPassword = process.env.SEED_DEMO_PASSWORD || 'Demo12345!';

const users: DemoUser[] = [
  {
    email: 'clara@silk.local',
    name: 'dr. Clara Anindita',
    role: 'DOCTOR',
    phone: '081200000001',
    image: '/assets/doctor/clara.png'
  },
  {
    email: 'santika@silk.local',
    name: 'dr. Santika Dewi',
    role: 'DOCTOR',
    phone: '081200000002',
    image: '/assets/doctor/santika.png'
  },
  {
    email: 'klinik@silk.local',
    name: 'Klinik Sehat Senja',
    role: 'FACILITY',
    phone: '0215550101',
    image: '/assets/home/rumah-sakit/rs1.png'
  },
  {
    email: 'aposilk@silk.local',
    name: 'Aposilk',
    role: 'PHARMACY',
    phone: '0215550102',
    image: '/assets/apotek/Drugs.png'
  },
  {
    email: 'pasien@silk.local',
    name: 'Pasien Demo',
    role: 'PATIENT',
    phone: '081200000005',
    image: '/assets/home/review/user.png'
  }
];

const doctors: DemoDoctor[] = [
  {
    slug: 'dr-clara-anindita',
    email: 'clara@silk.local',
    specialty: 'Dokter umum',
    bio: 'Dokter umum yang berfokus pada layanan kesehatan keluarga, pencegahan penyakit, dan konsultasi harian.',
    experienceYears: 8,
    consultationFee: 75000,
    city: 'Jakarta',
    address: 'Jl. Senja Raya No. 12, Jakarta Barat',
    latitude: -6.1754,
    longitude: 106.8272
  },
  {
    slug: 'dr-santika-dewi',
    email: 'santika@silk.local',
    specialty: 'Spesialis anak',
    bio: 'Spesialis anak dengan pengalaman menangani tumbuh kembang, imunisasi, dan kesehatan anak.',
    experienceYears: 12,
    consultationFee: 125000,
    city: 'Bandung',
    address: 'Jl. Asia Afrika No. 8, Bandung',
    latitude: -6.9175,
    longitude: 107.6191
  }
];

const facilities: DemoFacility[] = [
  {
    slug: 'klinik-sehat-senja',
    email: 'klinik@silk.local',
    name: 'Klinik Sehat Senja',
    type: 'CLINIC',
    description:
      'Klinik keluarga dengan layanan konsultasi umum, pemeriksaan dasar, dan vaksinasi.',
    address: 'Jl. Senja Raya No. 20, Jakarta Barat',
    city: 'Jakarta',
    phone: '0215550101',
    latitude: -6.168,
    longitude: 106.79
  },
  {
    slug: 'aposilk',
    email: 'aposilk@silk.local',
    name: 'Aposilk',
    type: 'PHARMACY',
    description: 'Apotek mitra SILK untuk kebutuhan obat, vitamin, dan alat kesehatan harian.',
    address: 'Jl. Kemang Raya No. 5, Jakarta Selatan',
    city: 'Jakarta',
    phone: '0215550102',
    latitude: -6.2607,
    longitude: 106.813
  }
];

const articles: DemoArticle[] = [
  {
    slug: 'kelelahan-berlebihan-meski-sudah-tidur',
    title: 'Kelelahan Berlebihan Meski Sudah Tidur',
    excerpt:
      'Tidur cukup belum tentu membuat tubuh segar. Kenali penyebab kelelahan yang sering terlewat.',
    content:
      'Kelelahan yang terus muncul meski durasi tidur cukup bisa berkaitan dengan kualitas tidur, pola makan, tingkat stres, atau kondisi kesehatan tertentu. Catat pola tidur dan tingkat energi harian Anda. Jika keluhan berlangsung lama atau disertai gejala lain, konsultasikan dengan dokter untuk pemeriksaan lebih lanjut.',
    coverImage: '/assets/home/article/blog1.png'
  },
  {
    slug: 'tips-menjaga-kesehatan-mental-di-era-digital',
    title: 'Tips Menjaga Kesehatan Mental di Era Digital',
    excerpt:
      'Batasi paparan layar, atur ritme istirahat, dan bangun kebiasaan kecil yang menjaga kesehatan mental.',
    content:
      'Teknologi memudahkan banyak hal, tetapi paparan layar yang berlebihan dapat memengaruhi kualitas tidur dan suasana hati. Coba tetapkan waktu bebas layar, lakukan jeda singkat setiap jam, dan luangkan waktu untuk aktivitas yang menenangkan. Dukungan profesional tetap diperlukan bila keluhan berlanjut.',
    coverImage: '/assets/home/article/blog2.png'
  },
  {
    slug: 'pentingnya-sarapan-pagi-untuk-produktivitas',
    title: 'Pentingnya Sarapan Pagi untuk Produktivitas',
    excerpt:
      'Sarapan yang seimbang membantu menjaga energi dan konsentrasi sebelum memulai aktivitas.',
    content:
      'Sarapan memberi tubuh energi awal untuk beraktivitas. Pilih kombinasi karbohidrat kompleks, protein, dan serat agar rasa kenyang bertahan lebih lama. Menu sederhana seperti telur, buah, dan roti gandum bisa menjadi pilihan. Sesuaikan porsi dengan kebutuhan dan kondisi tubuh Anda.',
    coverImage: '/assets/home/article/blog3.png'
  },
  {
    slug: 'panduan-sederhana-menjaga-hidrasi-harian',
    title: 'Panduan Sederhana Menjaga Hidrasi Harian',
    excerpt:
      'Minum cukup air membantu tubuh bekerja optimal, terutama saat cuaca panas atau banyak beraktivitas.',
    content:
      'Kebutuhan cairan setiap orang berbeda, dipengaruhi usia, aktivitas, dan kondisi kesehatan. Jadikan minum air sebagai kebiasaan rutin, misalnya setelah bangun tidur dan sebelum makan. Warna urine yang terang bisa menjadi salah satu tanda hidrasi cukup. Konsultasikan kebutuhan khusus bila memiliki kondisi medis tertentu.',
    coverImage: '/assets/article/blog4.png'
  }
];

const products: DemoProduct[] = [
  {
    slug: 'vitamin-harian-keluarga',
    name: 'Vitamin Harian Keluarga',
    description: 'Suplemen vitamin untuk membantu memenuhi kebutuhan nutrisi harian keluarga.',
    price: 35000,
    stock: 18,
    image: '/assets/apotek/Drugs.png',
    category: 'Vitamin',
    facilitySlug: 'aposilk'
  },
  {
    slug: 'susu-nutrisi-ibu-dan-anak',
    name: 'Susu Nutrisi Ibu dan Anak',
    description: 'Susu nutrisi dengan kandungan protein dan kalsium untuk ibu dan anak.',
    price: 85000,
    stock: 12,
    image: '/assets/apotek/Mother.png',
    category: 'Ibu dan anak',
    facilitySlug: 'aposilk'
  },
  {
    slug: 'perawatan-kulit-sensitif',
    name: 'Perawatan Kulit Sensitif',
    description: 'Rangkaian perawatan kulit yang lembut untuk kulit sensitif.',
    price: 62000,
    stock: 20,
    image: '/assets/apotek/Self love.png',
    category: 'Perawatan diri',
    facilitySlug: 'aposilk'
  },
  {
    slug: 'tensimeter-digital',
    name: 'Tensimeter Digital',
    description: 'Alat pengukur tekanan darah digital untuk pemantauan kesehatan di rumah.',
    price: 285000,
    stock: 7,
    image: '/assets/apotek/alat1.png',
    category: 'Alat kesehatan',
    facilitySlug: 'aposilk'
  }
];

const reviews: DemoReview[] = [
  {
    id: 'demo-review-doctor-clara',
    rating: 5,
    comment: 'Penjelasannya jelas dan ramah.',
    authorEmail: 'pasien@silk.local',
    doctorSlug: 'dr-clara-anindita',
    facilitySlug: null,
    productSlug: null
  },
  {
    id: 'demo-review-doctor-santika',
    rating: 5,
    comment: 'Sangat membantu saat konsultasi tentang kesehatan anak.',
    authorEmail: 'pasien@silk.local',
    doctorSlug: 'dr-santika-dewi',
    facilitySlug: null,
    productSlug: null
  },
  {
    id: 'demo-review-facility-klinik',
    rating: 4,
    comment: 'Tempatnya bersih dan pelayanannya cepat.',
    authorEmail: 'pasien@silk.local',
    doctorSlug: null,
    facilitySlug: 'klinik-sehat-senja',
    productSlug: null
  },
  {
    id: 'demo-review-facility-aposilk',
    rating: 5,
    comment: 'Produk lengkap dan pengiriman cepat.',
    authorEmail: 'pasien@silk.local',
    doctorSlug: null,
    facilitySlug: 'aposilk',
    productSlug: null
  },
  {
    id: 'demo-review-product-vitamin',
    rating: 5,
    comment: 'Vitaminnya cocok untuk kebutuhan harian.',
    authorEmail: 'pasien@silk.local',
    doctorSlug: null,
    facilitySlug: null,
    productSlug: 'vitamin-harian-keluarga'
  }
];

function buildUserSql(passwordHash: string) {
  return users
    .map(
      (user) => `
INSERT INTO "User" ("id", "email", "passwordHash", "name", "phone", "image", "role", "emailVerified", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  ${sqlString(user.email)},
  ${sqlString(passwordHash)},
  ${sqlString(user.name)},
  ${sqlNullableString(user.phone)},
  ${sqlNullableString(user.image)},
  ${sqlString(user.role)},
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT ("email") DO UPDATE SET
  "passwordHash" = EXCLUDED."passwordHash",
  "name" = EXCLUDED."name",
  "phone" = EXCLUDED."phone",
  "image" = EXCLUDED."image",
  "role" = EXCLUDED."role",
  "emailVerified" = EXCLUDED."emailVerified",
  "deletedAt" = NULL,
  "updatedAt" = NOW();`
    )
    .join('\n');
}

function buildDoctorSql() {
  return doctors
    .map(
      (doctor) => `
INSERT INTO "DoctorProfile" ("id", "slug", "userId", "specialty", "bio", "experienceYears", "consultationFee", "city", "address", "latitude", "longitude", "verificationStatus", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  ${sqlString(doctor.slug)},
  (SELECT "id" FROM "User" WHERE "email" = ${sqlString(doctor.email)}),
  ${sqlString(doctor.specialty)},
  ${sqlString(doctor.bio)},
  ${doctor.experienceYears},
  ${doctor.consultationFee},
  ${sqlString(doctor.city)},
  ${sqlString(doctor.address)},
  ${doctor.latitude},
  ${doctor.longitude},
  'VERIFIED',
  NOW(),
  NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "userId" = EXCLUDED."userId",
  "specialty" = EXCLUDED."specialty",
  "bio" = EXCLUDED."bio",
  "experienceYears" = EXCLUDED."experienceYears",
  "consultationFee" = EXCLUDED."consultationFee",
  "city" = EXCLUDED."city",
  "address" = EXCLUDED."address",
  "latitude" = EXCLUDED."latitude",
  "longitude" = EXCLUDED."longitude",
  "verificationStatus" = 'VERIFIED',
  "updatedAt" = NOW();`
    )
    .join('\n');
}

function buildFacilitySql() {
  return facilities
    .map(
      (facility) => `
INSERT INTO "Facility" ("id", "slug", "userId", "name", "type", "description", "address", "city", "phone", "latitude", "longitude", "verificationStatus", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  ${sqlString(facility.slug)},
  (SELECT "id" FROM "User" WHERE "email" = ${sqlString(facility.email)}),
  ${sqlString(facility.name)},
  ${sqlString(facility.type)},
  ${sqlString(facility.description)},
  ${sqlString(facility.address)},
  ${sqlString(facility.city)},
  ${sqlString(facility.phone)},
  ${facility.latitude},
  ${facility.longitude},
  'VERIFIED',
  NOW(),
  NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "userId" = EXCLUDED."userId",
  "name" = EXCLUDED."name",
  "type" = EXCLUDED."type",
  "description" = EXCLUDED."description",
  "address" = EXCLUDED."address",
  "city" = EXCLUDED."city",
  "phone" = EXCLUDED."phone",
  "latitude" = EXCLUDED."latitude",
  "longitude" = EXCLUDED."longitude",
  "verificationStatus" = 'VERIFIED',
  "updatedAt" = NOW();`
    )
    .join('\n');
}

function buildArticleSql() {
  return articles
    .map(
      (article) => `
INSERT INTO "Article" ("id", "slug", "title", "excerpt", "content", "coverImage", "status", "authorId", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  ${sqlString(article.slug)},
  ${sqlString(article.title)},
  ${sqlString(article.excerpt)},
  ${sqlString(article.content)},
  ${sqlString(article.coverImage)},
  'PUBLISHED',
  (SELECT "id" FROM "User" WHERE "email" = 'clara@silk.local'),
  NOW(),
  NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "title" = EXCLUDED."title",
  "excerpt" = EXCLUDED."excerpt",
  "content" = EXCLUDED."content",
  "coverImage" = EXCLUDED."coverImage",
  "status" = 'PUBLISHED',
  "authorId" = EXCLUDED."authorId",
  "deletedAt" = NULL,
  "updatedAt" = NOW();`
    )
    .join('\n');
}

function buildProductSql() {
  return products
    .map(
      (product) => `
INSERT INTO "Product" ("id", "slug", "name", "description", "price", "stock", "image", "category", "active", "facilityId", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  ${sqlString(product.slug)},
  ${sqlString(product.name)},
  ${sqlString(product.description)},
  ${product.price},
  ${product.stock},
  ${sqlString(product.image)},
  ${sqlString(product.category)},
  TRUE,
  (SELECT "id" FROM "Facility" WHERE "slug" = ${sqlString(product.facilitySlug)}),
  NOW(),
  NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "price" = EXCLUDED."price",
  "stock" = EXCLUDED."stock",
  "image" = EXCLUDED."image",
  "category" = EXCLUDED."category",
  "active" = TRUE,
  "facilityId" = EXCLUDED."facilityId",
  "deletedAt" = NULL,
  "updatedAt" = NOW();`
    )
    .join('\n');
}

function buildReviewSql() {
  return reviews
    .map((review) => {
      const doctorId = review.doctorSlug
        ? `(SELECT "id" FROM "DoctorProfile" WHERE "slug" = ${sqlString(review.doctorSlug)})`
        : 'NULL';
      const facilityId = review.facilitySlug
        ? `(SELECT "id" FROM "Facility" WHERE "slug" = ${sqlString(review.facilitySlug)})`
        : 'NULL';
      const productId = review.productSlug
        ? `(SELECT "id" FROM "Product" WHERE "slug" = ${sqlString(review.productSlug)})`
        : 'NULL';

      return `
INSERT INTO "Review" ("id", "rating", "comment", "authorId", "doctorProfileId", "facilityId", "productId", "status", "createdAt", "updatedAt")
VALUES (
  ${sqlString(review.id)},
  ${review.rating},
  ${sqlString(review.comment)},
  (SELECT "id" FROM "User" WHERE "email" = ${sqlString(review.authorEmail)}),
  ${doctorId},
  ${facilityId},
  ${productId},
  'APPROVED',
  NOW(),
  NOW()
)
ON CONFLICT ("id") DO UPDATE SET
  "rating" = EXCLUDED."rating",
  "comment" = EXCLUDED."comment",
  "authorId" = EXCLUDED."authorId",
  "doctorProfileId" = EXCLUDED."doctorProfileId",
  "facilityId" = EXCLUDED."facilityId",
  "productId" = EXCLUDED."productId",
  "status" = 'APPROVED',
  "updatedAt" = NOW();`;
    })
    .join('\n');
}

async function main() {
  const passwordHash = await bcrypt.hash(demoPassword, 12);

  const sql = [
    buildUserSql(passwordHash),
    buildDoctorSql(),
    buildFacilitySql(),
    buildArticleSql(),
    buildProductSql(),
    buildReviewSql()
  ].join('\n');

  runSql(sql);

  console.log('Data demo siap.');
  console.log(`Akun demo memakai password: ${demoPassword}`);
  console.log('Dokter: clara@silk.local, santika@silk.local');
  console.log('Fasilitas: klinik@silk.local, aposilk@silk.local');
  console.log('Pasien: pasien@silk.local');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
