<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BlogCategory;
use App\Models\BlogPost;
use App\Models\BlogTag;
use App\Services\MediaCompressionService;
use App\Support\HtmlSanitizer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class BlogPostController extends Controller
{
    public function index(Request $request): Response
    {
        $query = BlogPost::query()
            ->with(['category', 'tags', 'author'])
            ->latest('published_at')
            ->latest('id');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        $posts = $query->paginate(\App\Support\PaginationOptions::perPage())->withQueryString()->through(function (BlogPost $post) {
            return [
                'id' => $post->id,
                'title' => $post->title,
                'slug' => $post->slug,
                'status' => $post->status,
                'label' => $post->label,
                'category' => $post->category?->name,
                'tags' => $post->tags->pluck('name'),
                'cover_image_url' => $post->cover_image_path ? Storage::url($post->cover_image_path) : null,
                'published_at' => $post->published_at?->toDateTimeString(),
                'author' => $post->author?->name,
            ];
        });

        return Inertia::render('admin/blog/posts/index', [
            'posts' => $posts,
            'filters' => [
                'status' => $request->string('status')->toString(),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/blog/posts/create', [
            'categories' => BlogCategory::query()->where('is_active', true)->orderBy('name')->get(),
            'tags' => BlogTag::query()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(Request $request, MediaCompressionService $mediaCompression): RedirectResponse
    {
        $data = $this->validatePost($request);

        $slug = $this->uniqueSlug($data['slug'] ?? Str::slug($data['title']));
        $publishedAt = $this->resolvePublishedAt($data['status'] ?? 'draft', $data['published_at'] ?? null);

        $coverPath = null;
        if ($request->hasFile('cover_image')) {
            $coverPath = $mediaCompression->store($request->file('cover_image'), 'blog', 'public');
        }

        $post = BlogPost::create([
            'title' => $data['title'],
            'slug' => $slug,
            'excerpt' => $data['excerpt'] ?? null,
            'content' => HtmlSanitizer::clean($data['content']),
            'label' => $data['label'] ?? null,
            'category_id' => $data['category_id'] ?? null,
            'author_id' => $request->user()?->id,
            'cover_image_path' => $coverPath,
            'meta_title' => $data['meta_title'] ?? null,
            'meta_description' => $data['meta_description'] ?? null,
            'meta_keywords' => $data['meta_keywords'] ?? null,
            'status' => $data['status'] ?? 'draft',
            'published_at' => $publishedAt,
        ]);

        $this->syncTags($post, $data['tags'] ?? []);

        return redirect()->route('admin.blog.posts.index')->with('status', 'post-created');
    }

    public function edit(BlogPost $post): Response
    {
        $post->load('tags');

        return Inertia::render('admin/blog/posts/edit', [
            'post' => [
                'id' => $post->id,
                'title' => $post->title,
                'slug' => $post->slug,
                'excerpt' => $post->excerpt,
                'content' => $post->content,
                'label' => $post->label,
                'category_id' => $post->category_id,
                'cover_image_url' => $post->cover_image_path ? Storage::url($post->cover_image_path) : null,
                'meta_title' => $post->meta_title,
                'meta_description' => $post->meta_description,
                'meta_keywords' => $post->meta_keywords,
                'status' => $post->status,
                'published_at' => $post->published_at?->format('Y-m-d\TH:i'),
                'tags' => $post->tags->pluck('name'),
            ],
            'categories' => BlogCategory::query()->where('is_active', true)->orderBy('name')->get(),
            'tags' => BlogTag::query()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function update(Request $request, BlogPost $post, MediaCompressionService $mediaCompression): RedirectResponse
    {
        $data = $this->validatePost($request, $post->id);

        $slug = $this->uniqueSlug($data['slug'] ?? Str::slug($data['title']), $post->id);
        $publishedAt = $this->resolvePublishedAt($data['status'] ?? 'draft', $data['published_at'] ?? null);

        if ($request->hasFile('cover_image')) {
            if ($post->cover_image_path) {
                Storage::disk('public')->delete($post->cover_image_path);
            }
            $post->cover_image_path = $mediaCompression->store($request->file('cover_image'), 'blog', 'public');
        }

        $post->fill([
            'title' => $data['title'],
            'slug' => $slug,
            'excerpt' => $data['excerpt'] ?? null,
            'content' => HtmlSanitizer::clean($data['content']),
            'label' => $data['label'] ?? null,
            'category_id' => $data['category_id'] ?? null,
            'meta_title' => $data['meta_title'] ?? null,
            'meta_description' => $data['meta_description'] ?? null,
            'meta_keywords' => $data['meta_keywords'] ?? null,
            'status' => $data['status'] ?? 'draft',
            'published_at' => $publishedAt,
        ]);
        $post->save();

        $this->syncTags($post, $data['tags'] ?? []);

        return back()->with('status', 'post-updated');
    }

    public function destroy(BlogPost $post): RedirectResponse
    {
        if ($post->cover_image_path) {
            Storage::disk('public')->delete($post->cover_image_path);
        }

        $post->tags()->detach();
        $post->delete();

        return back()->with('status', 'post-deleted');
    }

    private function validatePost(Request $request, ?int $postId = null): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:180'],
            'slug' => ['nullable', 'string', 'max:200'],
            'excerpt' => ['nullable', 'string', 'max:800'],
            'content' => ['required', 'string'],
            'label' => ['nullable', 'string', 'max:80'],
            'category_id' => ['nullable', 'integer', 'exists:blog_categories,id'],
            'tags' => ['nullable'],
            'status' => ['required', 'in:draft,published'],
            'published_at' => ['nullable', 'date'],
            'meta_title' => ['nullable', 'string', 'max:180'],
            'meta_description' => ['nullable', 'string', 'max:255'],
            'meta_keywords' => ['nullable', 'string', 'max:255'],
            'cover_image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);
    }

    private function uniqueSlug(string $slug, ?int $ignoreId = null): string
    {
        $base = Str::slug($slug);
        $candidate = $base;
        $suffix = 1;

        while (
            BlogPost::query()
                ->where('slug', $candidate)
                ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $suffix++;
            $candidate = $base.'-'.$suffix;
        }

        return $candidate;
    }

    private function resolvePublishedAt(string $status, ?string $publishedAt): ?string
    {
        if ($status !== 'published') {
            return null;
        }

        return $publishedAt ?: now()->toDateTimeString();
    }

    private function syncTags(BlogPost $post, mixed $tags): void
    {
        $tagNames = collect(is_array($tags) ? $tags : explode(',', (string) $tags))
            ->map(fn ($item) => trim((string) $item))
            ->filter()
            ->unique();

        if ($tagNames->isEmpty()) {
            $post->tags()->sync([]);
            return;
        }

        $tagIds = $tagNames->map(function (string $name) {
            $slug = Str::slug($name);
            $tag = BlogTag::query()->firstOrCreate(
                ['slug' => $slug],
                ['name' => $name]
            );
            return $tag->id;
        });

        $post->tags()->sync($tagIds);
    }
}
