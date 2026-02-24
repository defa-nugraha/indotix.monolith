<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BlogTag;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class BlogTagController extends Controller
{
    public function index(): Response
    {
        $tags = BlogTag::query()
            ->withCount('posts')
            ->orderBy('name')
            ->get();

        return Inertia::render('admin/blog/tags/index', [
            'tags' => $tags,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'slug' => ['nullable', 'string', 'max:150'],
        ]);

        $slug = $this->uniqueSlug($data['slug'] ?? Str::slug($data['name']));

        BlogTag::create([
            'name' => $data['name'],
            'slug' => $slug,
        ]);

        return back()->with('status', 'tag-created');
    }

    public function update(Request $request, BlogTag $tag): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'slug' => ['nullable', 'string', 'max:150'],
        ]);

        $slug = $this->uniqueSlug($data['slug'] ?? Str::slug($data['name']), $tag->id);

        $tag->update([
            'name' => $data['name'],
            'slug' => $slug,
        ]);

        return back()->with('status', 'tag-updated');
    }

    public function destroy(BlogTag $tag): RedirectResponse
    {
        $tag->posts()->detach();
        $tag->delete();

        return back()->with('status', 'tag-deleted');
    }

    private function uniqueSlug(string $slug, ?int $ignoreId = null): string
    {
        $base = Str::slug($slug);
        $candidate = $base;
        $suffix = 1;

        while (
            BlogTag::query()
                ->where('slug', $candidate)
                ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $suffix++;
            $candidate = $base.'-'.$suffix;
        }

        return $candidate;
    }
}
