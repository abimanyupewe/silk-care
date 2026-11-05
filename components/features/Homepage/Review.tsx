import { Star } from 'lucide-react';
import { Avatar } from '@/components/shared/Avatar';
import { formatLongDate, formatRatingId } from '@/lib/format';
import type { HomeReview, HomeReviewSummary } from '@/lib/home/types';

const ReviewCard = ({ review }: { review: HomeReview }) => (
  <div className="flex h-full flex-col rounded-xl border border-border bg-white p-5">
    <div className="mb-3 flex items-center gap-1">
      <Star className="h-4 w-4 fill-amber text-amber" aria-hidden="true" />
      <span className="text-sm font-bold text-ink">{formatRatingId(review.rating)}</span>
      <span className="text-sm text-ink-muted">dari 5</span>
    </div>

    <p className="flex-grow text-base leading-relaxed text-ink-muted">“{review.comment}”</p>

    <div className="mt-6 flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar src={null} name={review.authorName} size={40} />
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{review.authorName}</p>
          <p className="truncate text-sm text-ink-muted">Ulasan untuk {review.targetName}</p>
        </div>
      </div>
      <time dateTime={review.createdAt} className="shrink-0 text-sm text-ink-muted">
        {formatLongDate(review.createdAt)}
      </time>
    </div>
  </div>
);

// Bagian tanpa data disembunyikan, bukan menampilkan kartu kosong.
export const Review = ({
  reviews,
  summary
}: {
  reviews: HomeReview[];
  summary: HomeReviewSummary;
}) => {
  if (reviews.length === 0) return null;

  return (
    <section className="w-full bg-surface py-12 md:py-16">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-ink md:text-[28px]">Ulasan SILK</h2>
          {summary.average !== null ? (
            <div className="mt-2 flex items-center gap-2 text-sm">
              <Star className="h-4 w-4 fill-amber text-amber" aria-hidden="true" />
              <span className="font-semibold text-ink">
                {formatRatingId(summary.average)} dari 5
              </span>
              <span className="text-ink-muted">· {summary.count} ulasan</span>
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      </div>
    </section>
  );
};
