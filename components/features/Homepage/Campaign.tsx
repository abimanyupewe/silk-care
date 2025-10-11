'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const campaignPages = [
  [
    { id: 1, color: 'bg-gray-200' },
    { id: 2, color: 'bg-gray-300' }
  ],
  [
    { id: 3, color: 'bg-slate-200' },
    { id: 4, color: 'bg-slate-300' }
  ],
  [
    { id: 5, color: 'bg-stone-200' },
    { id: 6, color: 'bg-stone-300' }
  ]
];

const totalPages = campaignPages.length;

export const Campaign = () => {
  const [activePage, setActivePage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActivePage((prevPage) => (prevPage + 1) % totalPages);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handlePageChange = (newPage: number) => {
    setActivePage(newPage);
  };

  return (
    <section className="w-full py-5">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="relative">
          <div className="overflow-hidden rounded-2xl">
            <motion.div
              key={activePage}
              className="flex"
              animate={{ x: `-${activePage * 100}%` }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
            >
              {campaignPages.map((page, pageIndex) => (
                <div
                  key={pageIndex}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full flex-shrink-0"
                >
                  {page.map((item) => (
                    <div key={item.id} className={`aspect-video ${item.color} rounded-2xl`}></div>
                  ))}
                </div>
              ))}
            </motion.div>
          </div>

          <div className="absolute -bottom-4 left-5 flex items-center gap-2">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                onClick={() => handlePageChange(index)}
                className={cn('rounded-full transition-all duration-300', {
                  'w-5 h-2 bg-[#00A991]': activePage === index,
                  'w-2 h-2 bg-[#99d9d1] hover:bg-[#5cc4b5]': activePage !== index
                })}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
