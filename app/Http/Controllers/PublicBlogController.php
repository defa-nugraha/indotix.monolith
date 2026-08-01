<?php

namespace App\Http\Controllers;

use App\Models\BlogPost;
use App\Models\PublicContact;
use App\Support\HtmlSanitizer;
use App\Support\HomePageContent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class PublicBlogController extends Controller
{
    public function index(): Response
    {
        $posts = BlogPost::query()
            ->with(['category', 'author', 'tags'])
            ->where('status', 'published')
            ->where(function ($query) {
                $query->whereNull('published_at')
                    ->orWhere('published_at', '<=', now());
            })
            ->orderByDesc('published_at')
            ->orderByDesc('id')
            ->paginate(10)
            ->withQueryString()
            ->through(function (BlogPost $post) {
                return [
                    'id' => $post->id,
                    'title' => $post->title,
                    'slug' => $post->slug,
                    'excerpt' => $post->excerpt,
                    'label' => $post->label,
                    'category' => $post->category?->name,
                    'cover_image_url' => $post->cover_image_path ? Storage::url($post->cover_image_path) : null,
                    'published_at' => $post->published_at?->toDateString(),
                    'author' => $post->author?->name,
                    'tags' => $post->tags->pluck('name'),
                    'meta_title' => $post->meta_title,
                    'meta_description' => $post->meta_description,
                    'meta_keywords' => $post->meta_keywords,
                ];
            });

        return Inertia::render('public/blog/index', [
            'posts' => $posts,
            'homeContent' => HomePageContent::publicPayload(),
            'partners' => HomePageContent::publicPartners(),
            'contact' => PublicContact::query()->first(),
        ]);
    }

    public function show(Request $request, string $slug): Response
    {
        $post = BlogPost::query()
            ->with(['category', 'author', 'tags'])
            ->where('slug', $slug)
            ->where('status', 'published')
            ->where(function ($query) {
                $query->whereNull('published_at')
                    ->orWhere('published_at', '<=', now());
            })
            ->firstOrFail();

        $currentSort = $post->published_at ?? $post->created_at;
        $sortExpression = 'COALESCE(published_at, created_at)';

        $prevPost = BlogPost::query()
            ->where('status', 'published')
            ->where('id', '!=', $post->id)
            ->where(function ($query) {
                $query->whereNull('published_at')
                    ->orWhere('published_at', '<=', now());
            })
            ->where(function ($query) use ($sortExpression, $currentSort, $post) {
                $query->whereRaw("{$sortExpression} > ?", [$currentSort])
                    ->orWhere(function ($same) use ($sortExpression, $currentSort, $post) {
                        $same->whereRaw("{$sortExpression} = ?", [$currentSort])
                            ->where('id', '>', $post->id);
                    });
            })
            ->orderByRaw("{$sortExpression} asc")
            ->orderBy('id', 'asc')
            ->first();

        $nextPost = BlogPost::query()
            ->where('status', 'published')
            ->where('id', '!=', $post->id)
            ->where(function ($query) {
                $query->whereNull('published_at')
                    ->orWhere('published_at', '<=', now());
            })
            ->where(function ($query) use ($sortExpression, $currentSort, $post) {
                $query->whereRaw("{$sortExpression} < ?", [$currentSort])
                    ->orWhere(function ($same) use ($sortExpression, $currentSort, $post) {
                        $same->whereRaw("{$sortExpression} = ?", [$currentSort])
                            ->where('id', '<', $post->id);
                    });
            })
            ->orderByRaw("{$sortExpression} desc")
            ->orderBy('id', 'desc')
            ->first();

        $relatedPosts = BlogPost::query()
            ->with(['category', 'tags'])
            ->where('status', 'published')
            ->where('id', '!=', $post->id)
            ->when($post->category_id, fn ($query) => $query->where('category_id', $post->category_id))
            ->where(function ($query) {
                $query->whereNull('published_at')
                    ->orWhere('published_at', '<=', now());
            })
            ->orderByDesc('published_at')
            ->orderByDesc('id')
            ->take(4)
            ->get()
            ->map(fn (BlogPost $item) => [
                'id' => $item->id,
                'title' => $item->title,
                'slug' => $item->slug,
                'excerpt' => $item->excerpt,
                'label' => $item->label,
                'category' => $item->category?->name,
                'cover_image_url' => $item->cover_image_path ? Storage::url($item->cover_image_path) : null,
                'published_at' => $item->published_at?->toDateString(),
                'tags' => $item->tags->pluck('name'),
            ]);

        return Inertia::render('public/blog/show', [
            'post' => [
                'id' => $post->id,
                'title' => $post->title,
                'slug' => $post->slug,
                'excerpt' => $post->excerpt,
                'content' => HtmlSanitizer::clean($post->content),
                'label' => $post->label,
                'category' => $post->category?->name,
                'cover_image_url' => $post->cover_image_path ? Storage::url($post->cover_image_path) : null,
                'published_at' => $post->published_at?->toDateString(),
                'author' => $post->author?->name,
                'tags' => $post->tags->pluck('name'),
                'meta_title' => $post->meta_title,
                'meta_description' => $post->meta_description,
                'meta_keywords' => $post->meta_keywords,
            ],
            'prevPost' => $prevPost ? [
                'id' => $prevPost->id,
                'title' => $prevPost->title,
                'slug' => $prevPost->slug,
                'excerpt' => $prevPost->excerpt,
                'label' => $prevPost->label,
                'cover_image_url' => $prevPost->cover_image_path ? Storage::url($prevPost->cover_image_path) : null,
                'published_at' => $prevPost->published_at?->toDateString(),
            ] : null,
            'nextPost' => $nextPost ? [
                'id' => $nextPost->id,
                'title' => $nextPost->title,
                'slug' => $nextPost->slug,
                'excerpt' => $nextPost->excerpt,
                'label' => $nextPost->label,
                'cover_image_url' => $nextPost->cover_image_path ? Storage::url($nextPost->cover_image_path) : null,
                'published_at' => $nextPost->published_at?->toDateString(),
            ] : null,
            'relatedPosts' => $relatedPosts,
        ]);
    }
}
