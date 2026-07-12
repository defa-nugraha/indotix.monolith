import { useForm, usePage } from '@inertiajs/react';
import { MessageSquare, Star } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { SharedData } from '@/types';

type ReviewMedia = {
    id: number;
    type: 'image' | 'video';
    url: string;
    thumbnail_url?: string | null;
};

type ReviewItem = {
    id: string | number;
    rating: number;
    comment?: string | null;
    user_name: string;
    created_at?: string | null;
    reply?: string | null;
    reply_by?: string | null;
    reply_at?: string | null;
    user_id?: number | null;
    media?: ReviewMedia[];
};

type UserReview = {
    id: string | number;
    rating: number;
    comment?: string | null;
    created_at?: string | null;
};

type ReviewSummary = {
    total: number;
    average: number;
    distribution: {
        stars: number;
        count: number;
        percentage: number;
    }[];
};

type Props = {
    productType: string;
    productId: number;
    reviews: ReviewItem[];
    reviewSummary?: ReviewSummary | null;
    userReview?: UserReview | null;
    canReview?: boolean;
};

const clampRating = (rating: number) => Math.min(5, Math.max(1, rating || 0));

export default function ReviewSection({
    productType,
    productId,
    reviews,
    reviewSummary,
    userReview,
    canReview = false,
}: Props) {
    const { auth } = usePage<SharedData>().props;
    const canSubmitReview =
        Boolean(auth?.user) && (canReview || Boolean(userReview));
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [allReviewsOpen, setAllReviewsOpen] = useState(false);
    const [allReviews, setAllReviews] = useState<ReviewItem[] | null>(null);
    const [allReviewsLoading, setAllReviewsLoading] = useState(false);
    const [allReviewsError, setAllReviewsError] = useState<string | null>(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        product_type: productType,
        product_id: productId,
        rating: userReview?.rating ?? 5,
        comment: userReview?.comment ?? '',
        images: [] as File[],
        video: null as File | null,
    });
    const reviewError = (errors as Record<string, string | undefined>).review;

    useEffect(() => {
        setData('product_type', productType);
        setData('product_id', productId);
        if (userReview) {
            setData('rating', userReview.rating);
            setData('comment', userReview.comment ?? '');
        }
    }, [productType, productId, userReview, setData]);

    const computedRatingSummary = useMemo(() => {
        const total = reviews.length;
        const average =
            total > 0
                ? reviews.reduce(
                      (sum, review) => sum + clampRating(review.rating),
                      0,
                  ) / total
                : 0;
        const distribution = [5, 4, 3, 2, 1].map((stars) => {
            const count = reviews.filter(
                (review) => Math.round(clampRating(review.rating)) === stars,
            ).length;

            return {
                stars,
                count,
                percentage: total > 0 ? Math.round((count / total) * 100) : 0,
            };
        });

        return { total, average, distribution };
    }, [reviews]);

    const ratingSummary = reviewSummary ?? computedRatingSummary;
    const visibleReviews = reviews.slice(0, 5);
    const hasMoreReviews = ratingSummary.total > visibleReviews.length;

    useEffect(() => {
        if (!allReviewsOpen || allReviews !== null) {
            return undefined;
        }

        const controller = new AbortController();
        setAllReviewsLoading(true);
        setAllReviewsError(null);

        const target = new URL('/reviews/public', window.location.origin);
        target.searchParams.set('product_type', productType);
        target.searchParams.set('product_id', String(productId));

        fetch(target.toString(), {
            headers: { Accept: 'application/json' },
            signal: controller.signal,
        })
            .then(async (response) => {
                if (!response.ok) {
                    throw new Error('Gagal memuat ulasan.');
                }

                return response.json();
            })
            .then((payload) => {
                setAllReviews(
                    Array.isArray(payload?.reviews) ? payload.reviews : [],
                );
            })
            .catch((error) => {
                if ((error as Error).name === 'AbortError') {
                    return;
                }

                setAllReviewsError(
                    'Ulasan belum bisa dimuat. Silakan coba lagi.',
                );
            })
            .finally(() => {
                setAllReviewsLoading(false);
            });

        return () => {
            controller.abort();
        };
    }, [
        allReviews,
        allReviewsOpen,
        productId,
        productType,
    ]);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post('/reviews', {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                if (!userReview) {
                    reset('comment');
                }
                setImageFiles([]);
                setVideoFile(null);
                setData('images', []);
                setData('video', null);
            },
        });
    };

    const handleImagesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files ?? []);
        const selected = files.slice(0, 5);
        setImageFiles(selected);
        setData('images', selected);
    };

    const handleVideoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files ?? []);
        const selected = files.length > 0 ? files[0] : null;
        setVideoFile(selected);
        setData('video', selected);
    };

    const renderStars = (rating: number, className = 'h-5 w-5') =>
        [1, 2, 3, 4, 5].map((star) => (
            <Star
                key={star}
                className={`${className} ${
                    star <= Math.round(rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-200'
                }`}
            />
        ));

    const renderReviewCard = (review: ReviewItem) => {
        const initial = review.user_name.trim().charAt(0).toUpperCase() || 'U';

        return (
            <article
                key={review.id}
                className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 transition-all duration-200 hover:bg-slate-50"
            >
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-black text-sky-700 ring-2 ring-white">
                            {initial}
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-slate-800">
                                {review.user_name}
                            </h4>
                            <p className="text-[10px] font-medium text-slate-400">
                                {review.created_at ?? '-'}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-0.5">
                        {renderStars(
                            clampRating(review.rating),
                            'h-3.5 w-3.5',
                        )}
                    </div>
                </div>

                {review.comment && (
                    <p className="mt-3.5 text-xs leading-relaxed font-normal text-slate-600">
                        “{review.comment}”
                    </p>
                )}

                {review.media && review.media.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {review.media.map((media) =>
                            media.type === 'image' ? (
                                <img
                                    key={media.id}
                                    src={media.url}
                                    alt="Media ulasan"
                                    className="h-28 w-full rounded-xl object-cover"
                                />
                            ) : (
                                <video
                                    key={media.id}
                                    src={media.url}
                                    controls
                                    className="h-28 w-full rounded-xl object-cover"
                                />
                            ),
                        )}
                    </div>
                )}

                {review.reply && (
                    <div className="mt-3 rounded-xl bg-white p-3 text-sm text-slate-600">
                        <p className="font-semibold text-slate-800">
                            Balasan
                            {review.reply_by ? ` dari ${review.reply_by}` : ''}
                        </p>
                        <p className="mt-1">{review.reply}</p>
                    </div>
                )}

                <div className="mt-4 flex items-center gap-4 border-t border-slate-100/60 pt-3 text-[10px] font-semibold text-slate-400">
                    <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        Ulasan pembeli
                    </span>
                </div>
            </article>
        );
    };

    return (
        <section
            className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xs sm:p-8"
            id="reviews-section"
        >
            <h2 className="mb-6 font-['Space_Grotesk'] text-xl font-bold text-slate-950">
                Ulasan dan Rating
            </h2>

            <div className="mb-8 grid grid-cols-1 items-center gap-8 border-b border-slate-100 pb-8 md:grid-cols-12">
                <div className="py-2 text-center md:col-span-4 md:border-r md:border-slate-100">
                    <div className="text-5xl leading-tight font-black text-slate-900">
                        {ratingSummary.average > 0
                            ? ratingSummary.average.toFixed(1)
                            : '0.0'}
                        <span className="text-xl font-normal text-slate-400">
                            /5
                        </span>
                    </div>
                    <div className="mt-2 flex justify-center gap-0.5">
                        {renderStars(ratingSummary.average)}
                    </div>
                    <p className="mt-2 text-xs font-medium text-slate-400">
                        Berdasarkan {ratingSummary.total} ulasan pembeli
                    </p>
                </div>

                <div className="space-y-2 md:col-span-8">
                    {ratingSummary.distribution.map((item) => (
                        <div
                            key={item.stars}
                            className="flex items-center gap-3 text-xs font-medium text-slate-600"
                        >
                            <span className="w-3 text-right">
                                {item.stars}
                            </span>
                            <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                                <div
                                    className="h-full rounded-full bg-sky-600"
                                    style={{ width: `${item.percentage}%` }}
                                />
                            </div>
                            <span className="w-10 text-right text-slate-400">
                                {item.percentage}%
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {canSubmitReview ? (
                <form
                    onSubmit={handleSubmit}
                    className="mb-6 rounded-2xl border border-slate-100 bg-slate-50/70 p-5"
                >
                    <div className="grid gap-3 md:grid-cols-2">
                        <label className="text-sm font-semibold text-slate-700">
                            Rating
                            <select
                                value={data.rating}
                                onChange={(event) =>
                                    setData(
                                        'rating',
                                        Number(event.target.value),
                                    )
                                }
                                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                            >
                                {[5, 4, 3, 2, 1].map((value) => (
                                    <option key={value} value={value}>
                                        {value} -{' '}
                                        {value === 5
                                            ? 'Sangat puas'
                                            : value === 4
                                              ? 'Bagus'
                                              : value === 3
                                                ? 'Cukup'
                                                : value === 2
                                                  ? 'Kurang'
                                                  : 'Buruk'}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="text-sm font-semibold text-slate-700">
                            Ulasan
                            <textarea
                                value={data.comment}
                                onChange={(event) =>
                                    setData('comment', event.target.value)
                                }
                                rows={3}
                                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                                placeholder="Ceritakan pengalaman kamu..."
                            />
                        </label>
                    </div>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <label className="text-sm font-semibold text-slate-700">
                            Foto (maks 5)
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImagesChange}
                                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                            />
                            {imageFiles.length > 0 && (
                                <p className="mt-1 text-xs text-slate-500">
                                    {imageFiles.length} foto dipilih
                                </p>
                            )}
                        </label>
                        <label className="text-sm font-semibold text-slate-700">
                            Video (maks 1)
                            <input
                                type="file"
                                accept="video/*"
                                onChange={handleVideoChange}
                                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                            />
                            {videoFile && (
                                <p className="mt-1 text-xs text-slate-500">
                                    {videoFile.name}
                                </p>
                            )}
                        </label>
                    </div>
                    {errors.rating && (
                        <p className="mt-2 text-xs text-rose-500">
                            {errors.rating}
                        </p>
                    )}
                    {errors.comment && (
                        <p className="mt-1 text-xs text-rose-500">
                            {errors.comment}
                        </p>
                    )}
                    {errors.images && (
                        <p className="mt-1 text-xs text-rose-500">
                            {errors.images}
                        </p>
                    )}
                    {errors.video && (
                        <p className="mt-1 text-xs text-rose-500">
                            {errors.video}
                        </p>
                    )}
                    {reviewError && (
                        <p className="mt-1 text-xs text-rose-500">
                            {reviewError}
                        </p>
                    )}
                    <button
                        type="submit"
                        disabled={processing}
                        className="mt-3 h-11 w-full rounded-xl bg-sky-600 px-5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-60 sm:w-auto"
                    >
                        {userReview ? 'Perbarui Ulasan' : 'Kirim Ulasan'}
                    </button>
                </form>
            ) : auth?.user ? (
                <div className="mb-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                    Ulasan bisa dikirim setelah tiket digunakan atau pesanan
                    selesai.
                </div>
            ) : (
                <div className="mb-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                    Silakan login untuk memberikan ulasan.
                </div>
            )}

            <div className="space-y-4">
                {visibleReviews.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-600">
                        Belum ada ulasan untuk produk ini.
                    </div>
                )}
                {visibleReviews.map((review) => renderReviewCard(review))}
            </div>

            {hasMoreReviews && (
                <button
                    type="button"
                    onClick={() => setAllReviewsOpen(true)}
                    className="mt-5 w-full rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-bold text-sky-700 transition hover:border-sky-300 hover:bg-sky-100"
                >
                    Lihat semua ulasan
                </button>
            )}

            <Dialog open={allReviewsOpen} onOpenChange={setAllReviewsOpen}>
                <DialogContent className="max-h-[86vh] max-w-[calc(100vw-1.5rem)] overflow-y-auto rounded-3xl sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Semua Ulasan</DialogTitle>
                    </DialogHeader>

                    {allReviewsLoading && (
                        <div className="rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm font-medium text-slate-500">
                            Memuat ulasan...
                        </div>
                    )}

                    {allReviewsError && (
                        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-4 text-sm text-rose-600">
                            {allReviewsError}
                        </div>
                    )}

                    {!allReviewsLoading && !allReviewsError && (
                        <div className="space-y-4">
                            {(allReviews ?? visibleReviews).length > 0 ? (
                                (allReviews ?? visibleReviews).map((review) =>
                                    renderReviewCard(review),
                                )
                            ) : (
                                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
                                    Belum ada ulasan untuk produk ini.
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </section>
    );
}
