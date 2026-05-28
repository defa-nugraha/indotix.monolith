import { useForm, usePage } from '@inertiajs/react';
import { Star } from 'lucide-react';
import { useEffect, useState } from 'react';
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

type Props = {
    productType: string;
    productId: number;
    reviews: ReviewItem[];
    userReview?: UserReview | null;
    canReview?: boolean;
};

export default function ReviewSection({
    productType,
    productId,
    reviews,
    userReview,
    canReview = false,
}: Props) {
    const { auth } = usePage<SharedData>().props;
    const canSubmitReview =
        Boolean(auth?.user) && (canReview || Boolean(userReview));
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [videoFile, setVideoFile] = useState<File | null>(null);

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

    return (
        <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Ulasan</h2>
            {canSubmitReview ? (
                <form
                    onSubmit={handleSubmit}
                    className="mt-4 rounded-xl border border-slate-100 bg-slate-50/60 p-4"
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
                                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
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
                                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
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
                                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
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
                                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
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
                        className="mt-3 h-11 rounded-xl bg-sky-600 px-5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
                    >
                        {userReview ? 'Perbarui Ulasan' : 'Kirim Ulasan'}
                    </button>
                </form>
            ) : auth?.user ? (
                <div className="mt-3 text-sm text-slate-600">
                    Ulasan bisa dikirim setelah tiket digunakan atau pesanan
                    selesai.
                </div>
            ) : (
                <div className="mt-3 text-sm text-slate-600">
                    Silakan login untuk memberikan ulasan.
                </div>
            )}

            <div className="mt-4 space-y-4">
                {reviews.length === 0 && (
                    <div className="text-sm text-slate-600">
                        Belum ada ulasan untuk produk ini.
                    </div>
                )}
                {reviews.map((review) => (
                    <div
                        key={review.id}
                        className="rounded-xl border border-slate-100 bg-white p-4"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <p className="text-sm font-semibold text-slate-900">
                                    {review.user_name}
                                </p>
                                <p className="text-xs text-slate-400">
                                    {review.created_at ?? '-'}
                                </p>
                            </div>
                            <div className="flex items-center gap-1 text-amber-500">
                                {Array.from({ length: 5 }).map((_, idx) => (
                                    <Star
                                        key={idx}
                                        className={
                                            idx < review.rating
                                                ? 'h-4 w-4 fill-amber-400'
                                                : 'h-4 w-4 text-slate-200'
                                        }
                                    />
                                ))}
                            </div>
                        </div>
                        {review.comment && (
                            <p className="mt-3 text-sm text-slate-600">
                                {review.comment}
                            </p>
                        )}
                        {review.media && review.media.length > 0 && (
                            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                                {review.media.map((media) =>
                                    media.type === 'image' ? (
                                        <img
                                            key={media.id}
                                            src={media.url}
                                            alt="Review media"
                                            className="h-28 w-full rounded-lg object-cover"
                                        />
                                    ) : (
                                        <video
                                            key={media.id}
                                            src={media.url}
                                            controls
                                            className="h-28 w-full rounded-lg object-cover"
                                        />
                                    ),
                                )}
                            </div>
                        )}
                        {review.reply && (
                            <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                                <p className="font-semibold text-slate-800">
                                    Balasan
                                    {review.reply_by
                                        ? ` dari ${review.reply_by}`
                                        : ''}
                                </p>
                                <p className="mt-1">{review.reply}</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
}
