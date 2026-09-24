<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PublicContactItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PublicContactItemController extends Controller
{
    private const ALLOWED_ICONS = [
        'Phone', 'PhoneCall', 'PhoneIncoming', 'Mail', 'MessageCircle', 'MessageSquare',
        'MessagesSquare', 'Send', 'AtSign', 'Globe', 'MapPin', 'MapPinned', 'Building2',
        'Store', 'Headphones', 'LifeBuoy', 'CircleHelp', 'Info', 'Instagram', 'Facebook',
        'Youtube', 'Bot', 'Users', 'BriefcaseBusiness', 'Clock3', 'CalendarDays', 'Link',
        'ExternalLink', 'QrCode', 'ShieldCheck', 'Ticket', 'Smartphone', 'Wifi',
    ];

    public function index(): Response
    {
        return Inertia::render('admin/public/contact-us/index', [
            'contacts' => PublicContactItem::query()
                ->orderBy('sort_order')
                ->orderBy('id')
                ->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        PublicContactItem::create($this->validated($request));

        return back()->with('status', 'contact-us-created');
    }

    public function update(Request $request, PublicContactItem $contact): RedirectResponse
    {
        $contact->update($this->validated($request));

        return back()->with('status', 'contact-us-updated');
    }

    public function destroy(PublicContactItem $contact): RedirectResponse
    {
        $contact->delete();

        return back()->with('status', 'contact-us-deleted');
    }

    private function validated(Request $request): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'contact' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:255'],
            'icon' => ['required', 'string', 'max:80', 'in:'.implode(',', self::ALLOWED_ICONS)],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        return [
            'name' => $data['name'],
            'contact' => $data['contact'],
            'description' => $data['description'] ?? null,
            'icon' => $data['icon'],
            'sort_order' => $data['sort_order'] ?? 0,
            'is_active' => (bool) ($data['is_active'] ?? true),
        ];
    }
}
