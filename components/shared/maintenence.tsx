'use client';

import { motion, Variants } from 'framer-motion';
// import Image from 'next/image';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.3,
      delayChildren: 0.2,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
    },
  },
};

interface MaintenancePageProps {
  statusCode: number;
  title?: string;
}

export const MaintenancePage = ({ statusCode, title }: MaintenancePageProps) => {
  const isServerError = statusCode >= 500 && statusCode < 600;
  const isNotFoundError = statusCode === 404;

  let heading = title || 'Terjadi Kesalahan';
  let subheading = 'Silakan coba lagi nanti.';

  if (isServerError) {
    heading = 'Aplikasi Sedang Dalam Perbaikan';
    subheading = 'Kami akan segera kembali.';
  } else if (isNotFoundError) {
    heading = 'Halaman Tidak Ditemukan';
    subheading = 'Maaf, kami tidak dapat menemukan halaman yang Anda cari.';
  }

  return (
    // Main container that fills the screen and centers content
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="fixed inset-0 bg-white flex flex-col items-center justify-center z-[100] text-dark p-4"
    >
      {/* Logo */}
      {/* <motion.div variants={itemVariants}>
        <Image
          alt="Logo Pakun"
          src={'/assets/images/logo.svg'}
          width={100}
          height={100}
          priority
        />
      </motion.div> */}

      {/* Dynamic Title */}
      <motion.h1
        variants={itemVariants}
        className="mt-2 text-2xl md:text-4xl font-bold text-center"
      >
        {heading}
      </motion.h1>

      {/* Dynamic Subtitle */}
      <motion.p
        variants={itemVariants}
        className="mt-2 text-lg md:text-xl text-gray-600 text-center"
      >
        {subheading}
      </motion.p>
    </motion.div>
  );
};

export default MaintenancePage;