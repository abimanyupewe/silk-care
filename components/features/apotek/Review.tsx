'use client';

import { useState } from 'react';
import { Star, ThumbsUp, MessageCircle, MoreHorizontal, Send } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils'; // Pastikan path ini benar

// Data dummy untuk ulasan
const reviewListData = [
  {
    author: 'Rizal Sadewa',
    avatar: '/assets/apotek/user.png', // Path diperbarui
    date: '11 / 11 / 2025',
    rating: 5.0,
    comment:
      'Lorem ipsum dolor sit amet consectetur. Amet enim porttitor elementum diam aliquet mi. Cras tellus viverra donec nunc. Cursus ornare elit sit sodales tristique purus consequat. Nibh',
    likes: 10,
    replies: 2
  },
  {
    author: 'Rizal Sadewa',
    avatar: '/assets/apotek/user.png', // Path diperbarui
    date: '11 / 11 / 2025',
    rating: 5.0,
    comment:
      'Lorem ipsum dolor sit amet consectetur. Amet enim porttitor elementum diam aliquet mi. Cras tellus viverra donec nunc. Cursus ornare elit sit sodales tristique purus consequat. Nibh',
    likes: 10,
    replies: 2
  }
];

// Sub-komponen untuk setiap item ulasan
const ReviewItem = ({ review }: { review: (typeof reviewListData)[0] }) => (
  <div className="py-6 border-b border-border">
    <div className="flex justify-between items-start">
      <div className="flex items-center gap-3">
        <Image
          src={review.avatar}
          alt={review.author}
          width={40}
          height={40}
          className="rounded-full object-cover"
        />
        <div>
          <p className="font-semibold text-gray-900">{review.author}</p>
          <p className="text-xs text-gray-500">{review.date}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 text-yellow-400 fill-current" />
          <span className="font-semibold text-sm">{review.rating.toFixed(1)}</span>
        </div>
        <button className="text-gray-500 hover:text-gray-800">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>
    </div>
    <p className="mt-3 text-sm text-gray-700 leading-relaxed">{review.comment}</p>
    <div className="mt-4 flex items-center gap-6 text-sm text-gray-600">
      <div className="flex items-center gap-2">
        <ThumbsUp className="w-4 h-4" />
        <span>{review.likes}</span>
      </div>
      <div className="flex items-center gap-2">
        <MessageCircle className="w-4 h-4" />
        <span>{review.replies}</span>
      </div>
      <button className="font-semibold hover:text-gray-900">Balas</button>
    </div>
  </div>
);

// Komponen untuk Rating Bintang yang bisa diklik
const StarRating = () => {
  const [rating, setRating] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          onClick={() => setRating(star)}
          className={cn(
            'w-5 h-5 cursor-pointer',
            rating >= star ? 'text-yellow-400 fill-current' : 'text-gray-300'
          )}
        />
      ))}
    </div>
  );
};

export const Review = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 2;

  return (
    <section className="bg-white py-12 w-full ">
      <div className="container  max-w-7xl px-4 mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Ulasan</h2>

        {/* Form Tulis Ulasan */}
        <div className="flex items-center gap-4 pb-6 border-b border-border max-w-4xl">
          <Image
            src="/assets/apotek/user.png" // Path diperbarui
            alt="Abimanyupw"
            width={40}
            height={40}
            className="rounded-full object-cover"
          />
          <div className="flex-grow">
            <p className="font-semibold text-gray-900">Abimanyupw</p>
            <div className="relative mt-2">
              <input
                type="text"
                placeholder="Ingin memberi tanggapan?"
                className="w-full bg-gray-100 rounded-full py-2 pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
              <Send className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            </div>
          </div>
          <StarRating />
        </div>

        {/* Daftar Ulasan */}
        <div className="max-w-4xl">
          {reviewListData.map((review, index) => (
            <ReviewItem key={index} review={review} />
          ))}
        </div>

        {/* Paginasi */}
        <div className="flex justify-center items-center gap-2 mt-8">
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index + 1)}
              className={cn('w-8 h-8 rounded-md text-sm font-medium transition-colors', {
                'bg-primary text-white': currentPage === index + 1,
                'bg-gray-100 text-gray-700 hover:bg-gray-200': currentPage !== index + 1
              })}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
