<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\NotificationTemplate;
use App\Models\NotificationTrigger;
use App\Services\AdminNotificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class NotificationControlController extends Controller
{
    private const EVENTS = [
        'booking_created',
        'booking_paid',
        'booking_cancelled',
        'booking_expired',
        'payout_approved',
    ];
    private const ROLE_OPTIONS = [
        ['value' => 'user', 'label' => 'User'],
        ['value' => 'mitra', 'label' => 'Mitra'],
        ['value' => 'admin', 'label' => 'Admin Utama'],
        ['value' => 'admin_academy', 'label' => 'Admin Academy'],
        ['value' => 'admin_retail', 'label' => 'Admin Retail Shop'],
        ['value' => 'admin_special_program', 'label' => 'Admin Special Program'],
    ];

    public function index(): Response
    {
        foreach (self::EVENTS as $event) {
            NotificationTrigger::query()->firstOrCreate(
                ['event_key' => $event],
                ['is_active' => true]
            );
        }

        $templates = NotificationTemplate::query()
            ->latest()
            ->get()
            ->map(fn (NotificationTemplate $template) => [
                'id' => $template->id,
                'key' => $template->key,
                'channel' => $template->channel,
                'subject' => $template->subject,
                'body' => $template->body,
                'is_active' => $template->is_active,
            ]);

        $triggers = NotificationTrigger::query()
            ->with('template')
            ->get()
            ->map(fn (NotificationTrigger $trigger) => [
                'id' => $trigger->id,
                'event_key' => $trigger->event_key,
                'template_id' => $trigger->template_id,
                'template_key' => $trigger->template?->key,
                'is_active' => $trigger->is_active,
            ]);

        return Inertia::render('admin/system/notifications/index', [
            'templates' => $templates,
            'triggers' => $triggers,
            'eventOptions' => self::EVENTS,
            'roleOptions' => self::ROLE_OPTIONS,
        ]);
    }

    public function storeTemplate(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'key' => ['required', 'string', 'max:100', 'unique:notification_templates,key'],
            'channel' => ['required', Rule::in(['email'])],
            'subject' => ['nullable', 'string', 'max:255'],
            'body' => ['nullable', 'string'],
            'is_active' => ['boolean'],
        ]);

        NotificationTemplate::create($data);

        return back()->with('status', 'template-created');
    }

    public function updateTemplate(Request $request, NotificationTemplate $template): RedirectResponse
    {
        $data = $request->validate([
            'key' => ['required', 'string', 'max:100', Rule::unique('notification_templates', 'key')->ignore($template->id)],
            'channel' => ['required', Rule::in(['email'])],
            'subject' => ['nullable', 'string', 'max:255'],
            'body' => ['nullable', 'string'],
            'is_active' => ['boolean'],
        ]);

        $template->update($data);

        return back()->with('status', 'template-updated');
    }

    public function destroyTemplate(NotificationTemplate $template): RedirectResponse
    {
        $template->delete();

        return back()->with('status', 'template-deleted');
    }

    public function updateTrigger(Request $request, NotificationTrigger $trigger): RedirectResponse
    {
        $data = $request->validate([
            'template_id' => ['nullable', 'integer', 'exists:notification_templates,id'],
            'is_active' => ['boolean'],
        ]);

        $trigger->update($data);

        return back()->with('status', 'trigger-updated');
    }

    public function broadcast(Request $request): RedirectResponse
    {
        $roles = collect(self::ROLE_OPTIONS)->pluck('value')->all();

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:1000'],
            'type' => ['required', 'string', 'max:50'],
            'target' => ['nullable', Rule::in(['all', 'roles', 'users'])],
            'roles' => ['nullable', 'array'],
            'roles.*' => ['string', Rule::in($roles)],
            'user_ids' => ['nullable', 'array'],
            'user_ids.*' => ['integer', 'exists:users,id'],
        ]);

        $target = $data['target'] ?? null;
        $selectedRoles = $data['roles'] ?? [];
        $userIds = $data['user_ids'] ?? [];

        if (! $target) {
            if ($userIds) {
                $target = 'users';
            } elseif ($selectedRoles) {
                $target = 'roles';
            } else {
                $target = 'roles';
                $selectedRoles = ['user'];
            }
        }

        if ($target === 'roles' && ! $selectedRoles) {
            return back()->withErrors([
                'roles' => 'Roles wajib diisi.',
            ]);
        }

        if ($target === 'users' && ! $userIds) {
            return back()->withErrors([
                'user_ids' => 'User ids wajib diisi.',
            ]);
        }

        app(AdminNotificationService::class)->broadcast(
            $data['title'],
            $data['message'],
            $data['type'],
            $target,
            $selectedRoles,
            $userIds
        );

        return back()->with('status', 'broadcast-sent');
    }
}
