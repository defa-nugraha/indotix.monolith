<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\NotificationTemplate;
use App\Models\NotificationTrigger;
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
}
