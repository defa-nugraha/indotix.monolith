import { Head, router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Sparkles, Zap, SlidersHorizontal, ShieldCheck, MonitorCheck, Megaphone, Wallet } from 'lucide-react';
import { parseCurrencyToDigits } from '@/lib/currency';

type ProgramSummary = {
    id: number;
    name: string;
    program_type: string;
    status: string;
    is_active: boolean;
    starts_at?: string | null;
    ends_at?: string | null;
    priority?: number | null;
    highlight_level?: string | null;
};

type ProgramDetail = ProgramSummary & {
    description_internal?: string | null;
    scope?: {
        mode?: string;
        categories?: string[];
        locations?: string[];
        partners?: string[];
        events?: string[];
    };
    rules?: {
        min_transaction?: number;
        max_quota?: number;
        per_user_limit?: number;
        stackable?: boolean;
        used_quota?: number;
    };
    discount?: {
        type?: string;
        value?: number;
        platform_subsidy?: number;
        partner_subsidy?: number;
        max_cap?: number;
    };
    visibility?: {
        placements?: string[];
        priority?: number;
        highlight_level?: string;
        push_enabled?: boolean;
        tag_label?: string;
    };
    budget?: {
        limit?: number;
        used?: number;
    };
    compliance?: {
        partner_notification?: string;
        partner_approval_required?: boolean;
        legal_note?: string;
    };
    terms?: string | null;
};

type Props = {
    section: string;
    programs: ProgramSummary[];
    selectedProgram?: ProgramDetail | null;
    typeOptions: string[];
    statusOptions: string[];
    highlightOptions: string[];
};

const sectionLinks = [
    { id: 'programs', label: 'Manajemen Program', href: '/admin/special-programs', icon: Sparkles },
    { id: 'scope', label: 'Cakupan & Aturan', href: '/admin/special-programs/scope', icon: SlidersHorizontal },
    { id: 'benefits', label: 'Diskon & Benefit', href: '/admin/special-programs/benefits', icon: Zap },
    { id: 'visibility', label: 'Distribusi & Visibilitas', href: '/admin/special-programs/visibility', icon: Megaphone },
    { id: 'monitoring', label: 'Monitoring Real-time', href: '/admin/special-programs/monitoring', icon: MonitorCheck },
    { id: 'finance', label: 'Keuangan & Audit', href: '/admin/special-programs/finance', icon: Wallet },
    { id: 'compliance', label: 'Komunikasi & Kepatuhan', href: '/admin/special-programs/compliance', icon: ShieldCheck },
];

const formatNumber = (value: string) => parseCurrencyToDigits(value);
const formatCurrency = (value?: number | string | null) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return '-';
    return `Rp ${numeric.toLocaleString('id-ID')}`;
};
const parseList = (value: string) =>
    value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

export default function SpecialProgramIndex({
    section,
    programs,
    selectedProgram,
    typeOptions,
    statusOptions,
    highlightOptions,
}: Props) {
    const currentLink = sectionLinks.find((item) => item.id === section) ?? sectionLinks[0];
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Special Program', href: '/admin/special-programs' },
        { title: currentLink.label, href: currentLink.href },
    ];

    const [selectedId, setSelectedId] = useState<string>(selectedProgram?.id ? String(selectedProgram.id) : '');
    const [createForm, setCreateForm] = useState({
        name: '',
        program_type: typeOptions[0] ?? 'diskon',
        description_internal: '',
        starts_at: '',
        ends_at: '',
        status: 'draft',
        is_active: false,
    });

    const [programForm, setProgramForm] = useState({
        name: selectedProgram?.name ?? '',
        program_type: selectedProgram?.program_type ?? typeOptions[0] ?? 'diskon',
        description_internal: selectedProgram?.description_internal ?? '',
        starts_at: selectedProgram?.starts_at ?? '',
        ends_at: selectedProgram?.ends_at ?? '',
        status: selectedProgram?.status ?? 'draft',
        is_active: selectedProgram?.is_active ?? false,
        priority: String(selectedProgram?.priority ?? 0),
        highlight_level: selectedProgram?.highlight_level ?? 'low',
    });

    const [scopeForm, setScopeForm] = useState({
        mode: selectedProgram?.scope?.mode ?? 'all',
        categories: (selectedProgram?.scope?.categories ?? []).join(', '),
        locations: (selectedProgram?.scope?.locations ?? []).join(', '),
        partners: (selectedProgram?.scope?.partners ?? []).join(', '),
        events: (selectedProgram?.scope?.events ?? []).join(', '),
        min_transaction: String(selectedProgram?.rules?.min_transaction ?? ''),
        max_quota: String(selectedProgram?.rules?.max_quota ?? ''),
        per_user_limit: String(selectedProgram?.rules?.per_user_limit ?? ''),
        stackable: selectedProgram?.rules?.stackable ?? false,
    });

    const [discountForm, setDiscountForm] = useState({
        type: selectedProgram?.discount?.type ?? selectedProgram?.program_type ?? 'diskon',
        value: String(selectedProgram?.discount?.value ?? ''),
        platform_subsidy: String(selectedProgram?.discount?.platform_subsidy ?? ''),
        partner_subsidy: String(selectedProgram?.discount?.partner_subsidy ?? ''),
        max_cap: String(selectedProgram?.discount?.max_cap ?? ''),
        simulation_base: '250000',
    });

    const [visibilityForm, setVisibilityForm] = useState({
        placements: selectedProgram?.visibility?.placements ?? ['special_section'],
        priority: String(selectedProgram?.visibility?.priority ?? 0),
        highlight_level: selectedProgram?.visibility?.highlight_level ?? selectedProgram?.highlight_level ?? 'low',
        push_enabled: selectedProgram?.visibility?.push_enabled ?? false,
        tag_label: selectedProgram?.visibility?.tag_label ?? 'Special Program',
    });

    const [budgetForm, setBudgetForm] = useState({
        limit: String(selectedProgram?.budget?.limit ?? ''),
        used: String(selectedProgram?.budget?.used ?? ''),
    });

    const [complianceForm, setComplianceForm] = useState({
        partner_notification: selectedProgram?.compliance?.partner_notification ?? '',
        partner_approval_required: selectedProgram?.compliance?.partner_approval_required ?? false,
        legal_note: selectedProgram?.compliance?.legal_note ?? '',
        terms: selectedProgram?.terms ?? '',
    });

    useEffect(() => {
        setSelectedId(selectedProgram?.id ? String(selectedProgram.id) : '');
        setProgramForm({
            name: selectedProgram?.name ?? '',
            program_type: selectedProgram?.program_type ?? typeOptions[0] ?? 'diskon',
            description_internal: selectedProgram?.description_internal ?? '',
            starts_at: selectedProgram?.starts_at ?? '',
            ends_at: selectedProgram?.ends_at ?? '',
            status: selectedProgram?.status ?? 'draft',
            is_active: selectedProgram?.is_active ?? false,
            priority: String(selectedProgram?.priority ?? 0),
            highlight_level: selectedProgram?.highlight_level ?? 'low',
        });
        setScopeForm({
            mode: selectedProgram?.scope?.mode ?? 'all',
            categories: (selectedProgram?.scope?.categories ?? []).join(', '),
            locations: (selectedProgram?.scope?.locations ?? []).join(', '),
            partners: (selectedProgram?.scope?.partners ?? []).join(', '),
            events: (selectedProgram?.scope?.events ?? []).join(', '),
            min_transaction: String(selectedProgram?.rules?.min_transaction ?? ''),
            max_quota: String(selectedProgram?.rules?.max_quota ?? ''),
            per_user_limit: String(selectedProgram?.rules?.per_user_limit ?? ''),
            stackable: selectedProgram?.rules?.stackable ?? false,
        });
        setDiscountForm((prev) => ({
            ...prev,
            type: selectedProgram?.discount?.type ?? selectedProgram?.program_type ?? 'diskon',
            value: String(selectedProgram?.discount?.value ?? ''),
            platform_subsidy: String(selectedProgram?.discount?.platform_subsidy ?? ''),
            partner_subsidy: String(selectedProgram?.discount?.partner_subsidy ?? ''),
            max_cap: String(selectedProgram?.discount?.max_cap ?? ''),
        }));
        setVisibilityForm({
            placements: selectedProgram?.visibility?.placements ?? ['special_section'],
            priority: String(selectedProgram?.visibility?.priority ?? 0),
            highlight_level: selectedProgram?.visibility?.highlight_level ?? selectedProgram?.highlight_level ?? 'low',
            push_enabled: selectedProgram?.visibility?.push_enabled ?? false,
            tag_label: selectedProgram?.visibility?.tag_label ?? 'Special Program',
        });
        setBudgetForm({
            limit: String(selectedProgram?.budget?.limit ?? ''),
            used: String(selectedProgram?.budget?.used ?? ''),
        });
        setComplianceForm({
            partner_notification: selectedProgram?.compliance?.partner_notification ?? '',
            partner_approval_required: selectedProgram?.compliance?.partner_approval_required ?? false,
            legal_note: selectedProgram?.compliance?.legal_note ?? '',
            terms: selectedProgram?.terms ?? '',
        });
    }, [selectedProgram, typeOptions]);

    const selectProgram = (id: string) => {
        setSelectedId(id);
        router.get(currentLink.href, { program: id }, { preserveScroll: true, preserveState: true });
    };

    const handleCreate = (event: React.FormEvent) => {
        event.preventDefault();
        router.post('/admin/special-programs', createForm, {
            onSuccess: () => {
                Swal.fire({ title: 'Berhasil', text: 'Special program dibuat.', icon: 'success' });
                setCreateForm({
                    name: '',
                    program_type: typeOptions[0] ?? 'diskon',
                    description_internal: '',
                    starts_at: '',
                    ends_at: '',
                    status: 'draft',
                    is_active: false,
                });
            },
            onError: () => Swal.fire({ title: 'Gagal', text: 'Special program gagal dibuat.', icon: 'error' }),
        });
    };

    const updateProgram = (payload: Record<string, any>, successText: string) => {
        if (!selectedProgram) return;
        router.put(`/admin/special-programs/${selectedProgram.id}`, payload, {
            onSuccess: () => Swal.fire({ title: 'Berhasil', text: successText, icon: 'success' }),
            onError: () => Swal.fire({ title: 'Gagal', text: 'Perubahan tidak tersimpan.', icon: 'error' }),
        });
    };

    const handleDuplicate = async () => {
        if (!selectedProgram) return;
        const result = await Swal.fire({
            title: 'Duplikat program?',
            text: 'Program akan disalin menjadi draft baru.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Duplikat',
            cancelButtonText: 'Batal',
        });
        if (!result.isConfirmed) return;
        router.post(`/admin/special-programs/${selectedProgram.id}/duplicate`, {}, {
            onSuccess: () => Swal.fire({ title: 'Berhasil', text: 'Program diduplikasi.', icon: 'success' }),
            onError: () => Swal.fire({ title: 'Gagal', text: 'Duplikasi gagal.', icon: 'error' }),
        });
    };

    const handleStatusAction = async (action: 'activate' | 'deactivate' | 'suspend' | 'resume' | 'expire') => {
        if (!selectedProgram) return;
        const result = await Swal.fire({
            title: 'Konfirmasi aksi',
            text: 'Perubahan status akan langsung berlaku.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Lanjutkan',
            cancelButtonText: 'Batal',
        });
        if (!result.isConfirmed) return;
        router.post(`/admin/special-programs/${selectedProgram.id}/status`, { action }, {
            onSuccess: () => Swal.fire({ title: 'Berhasil', text: 'Status diperbarui.', icon: 'success' }),
            onError: () => Swal.fire({ title: 'Gagal', text: 'Status gagal diperbarui.', icon: 'error' }),
        });
    };

    const handleDelete = async () => {
        if (!selectedProgram) return;
        const result = await Swal.fire({
            title: 'Hapus program?',
            text: 'Program akan dihapus permanen.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Hapus',
            cancelButtonText: 'Batal',
        });
        if (!result.isConfirmed) return;
        router.delete(`/admin/special-programs/${selectedProgram.id}`, {
            onSuccess: () => Swal.fire({ title: 'Berhasil', text: 'Program dihapus.', icon: 'success' }),
            onError: () => Swal.fire({ title: 'Gagal', text: 'Program gagal dihapus.', icon: 'error' }),
        });
    };

    const monitoring = useMemo(() => {
        const maxQuota = Number(selectedProgram?.rules?.max_quota ?? 0);
        const usedQuota = Number(selectedProgram?.rules?.used_quota ?? 0);
        const remainingQuota = maxQuota > 0 ? Math.max(0, maxQuota - usedQuota) : 0;
        const totalSubsidy = Number(selectedProgram?.budget?.used ?? 0);
        return {
            totalTransactions: usedQuota,
            conversionRate: 0,
            totalSubsidy,
            remainingQuota,
        };
    }, [selectedProgram]);

    const simulation = useMemo(() => {
        const base = Number(discountForm.simulation_base || 0);
        const value = Number(discountForm.value || 0);
        const cap = Number(discountForm.max_cap || 0);
        let discountAmount = 0;
        if (discountForm.type === 'percentage') {
            discountAmount = Math.round(base * (value / 100));
        } else {
            discountAmount = value;
        }
        if (cap > 0) discountAmount = Math.min(cap, discountAmount);
        const finalPrice = Math.max(0, base - discountAmount);
        return { base, discountAmount, finalPrice };
    }, [discountForm]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Special Program" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8 text-slate-900">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">Special Program</p>
                            <h1 className="text-2xl font-semibold text-slate-900">Orkestrasi campaign tematik & benefit lintas produk</h1>
                            <p className="text-sm text-slate-500">Kelola program diskon, subsidi, bundling, hingga highlight produk secara terstruktur.</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                            <span>Total Program</span>
                            <span className="font-semibold text-slate-800">{programs.length}</span>
                        </div>
                    </div>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="flex flex-wrap items-center gap-2">
                        {sectionLinks.map((item) => (
                            <a
                                key={item.id}
                                href={item.href}
                                className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold ${
                                    item.id === section ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600'
                                }`}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.label}
                            </a>
                        ))}
                    </div>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">Pilih Program</h2>
                            <p className="text-sm text-slate-500">Setiap modul di bawah akan mengubah program yang dipilih.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <select
                                value={selectedId}
                                onChange={(event) => selectProgram(event.target.value)}
                                className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                            >
                                <option value="">Pilih program</option>
                                {programs.map((program) => (
                                    <option key={program.id} value={program.id}>
                                        {program.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {section === 'programs' && (
                        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
                            <div className="rounded-2xl border border-slate-100 p-4">
                                <div className="text-sm font-semibold text-slate-900">Daftar Program</div>
                                <div className="mt-4 space-y-3">
                                    {programs.length === 0 && (
                                        <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                                            Belum ada program. Buat program pertama di sisi kanan.
                                        </div>
                                    )}
                                    {programs.map((program) => (
                                        <button
                                            key={program.id}
                                            type="button"
                                            onClick={() => selectProgram(String(program.id))}
                                            className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition ${
                                                String(program.id) === selectedId
                                                    ? 'border-sky-300 bg-sky-50 text-sky-700'
                                                    : 'border-slate-100 bg-white text-slate-600'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="font-semibold text-slate-900">{program.name}</div>
                                                    <div className="text-xs text-slate-500">{program.program_type} · {program.status}</div>
                                                </div>
                                                <span className={`text-xs font-semibold ${program.is_active ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                    {program.is_active ? 'Aktif' : 'Nonaktif'}
                                                </span>
                                            </div>
                                            <div className="mt-2 text-xs text-slate-500">{program.starts_at ?? '-'} → {program.ends_at ?? '-'}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-100 p-4">
                                <div className="text-sm font-semibold text-slate-900">Buat Program Baru</div>
                                <form className="mt-4 grid gap-3" onSubmit={handleCreate}>
                                    <input
                                        value={createForm.name}
                                        onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
                                        className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                                        placeholder="Nama program"
                                        required
                                    />
                                    <select
                                        value={createForm.program_type}
                                        onChange={(event) => setCreateForm((prev) => ({ ...prev, program_type: event.target.value }))}
                                        className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                                    >
                                        {typeOptions.map((type) => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                    <textarea
                                        value={createForm.description_internal}
                                        onChange={(event) => setCreateForm((prev) => ({ ...prev, description_internal: event.target.value }))}
                                        className="min-h-[80px] rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                        placeholder="Deskripsi internal"
                                    />
                                    <div className="grid gap-3 md:grid-cols-2">
                                        <input
                                            type="date"
                                            value={createForm.starts_at}
                                            onChange={(event) => setCreateForm((prev) => ({ ...prev, starts_at: event.target.value }))}
                                            className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                                        />
                                        <input
                                            type="date"
                                            value={createForm.ends_at}
                                            onChange={(event) => setCreateForm((prev) => ({ ...prev, ends_at: event.target.value }))}
                                            className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                                        />
                                    </div>
                                    <select
                                        value={createForm.status}
                                        onChange={(event) => setCreateForm((prev) => ({ ...prev, status: event.target.value }))}
                                        className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                                    >
                                        {statusOptions.map((status) => (
                                            <option key={status} value={status}>{status}</option>
                                        ))}
                                    </select>
                                    <label className="flex items-center gap-2 text-xs text-slate-600">
                                        <input
                                            type="checkbox"
                                            checked={createForm.is_active}
                                            onChange={(event) => setCreateForm((prev) => ({ ...prev, is_active: event.target.checked }))}
                                        />
                                        Aktifkan setelah dibuat
                                    </label>
                                    <button className="h-10 rounded-lg bg-sky-600 text-sm font-semibold text-white">Simpan Program</button>
                                </form>
                            </div>
                        </div>
                    )}
                </section>

                {selectedProgram && section === 'programs' && (
                    <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">Detail Program</h2>
                                <p className="text-sm text-slate-500">Update informasi inti, status, dan kill switch.</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold" onClick={handleDuplicate}>Duplikat</button>
                                <button className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold" onClick={handleDelete}>Hapus</button>
                            </div>
                        </div>
                        <form
                            className="mt-4 grid gap-4 md:grid-cols-2"
                            onSubmit={(event) => {
                                event.preventDefault();
                                updateProgram(
                                    {
                                        name: programForm.name,
                                        program_type: programForm.program_type,
                                        description_internal: programForm.description_internal,
                                        starts_at: programForm.starts_at || null,
                                        ends_at: programForm.ends_at || null,
                                        status: programForm.status,
                                        is_active: programForm.is_active ? 1 : 0,
                                        priority: Number(formatNumber(programForm.priority)),
                                        highlight_level: programForm.highlight_level,
                                    },
                                    'Program diperbarui.'
                                );
                            }}
                        >
                            <input
                                value={programForm.name}
                                onChange={(event) => setProgramForm((prev) => ({ ...prev, name: event.target.value }))}
                                className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                                placeholder="Nama program"
                                required
                            />
                            <select
                                value={programForm.program_type}
                                onChange={(event) => setProgramForm((prev) => ({ ...prev, program_type: event.target.value }))}
                                className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                            >
                                {typeOptions.map((type) => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                            <textarea
                                value={programForm.description_internal}
                                onChange={(event) => setProgramForm((prev) => ({ ...prev, description_internal: event.target.value }))}
                                className="min-h-[90px] rounded-lg border border-slate-200 px-3 py-2 text-sm md:col-span-2"
                            />
                            <input
                                type="date"
                                value={programForm.starts_at}
                                onChange={(event) => setProgramForm((prev) => ({ ...prev, starts_at: event.target.value }))}
                                className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                            />
                            <input
                                type="date"
                                value={programForm.ends_at}
                                onChange={(event) => setProgramForm((prev) => ({ ...prev, ends_at: event.target.value }))}
                                className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                            />
                            <select
                                value={programForm.status}
                                onChange={(event) => setProgramForm((prev) => ({ ...prev, status: event.target.value }))}
                                className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                            >
                                {statusOptions.map((status) => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                            <select
                                value={programForm.highlight_level}
                                onChange={(event) => setProgramForm((prev) => ({ ...prev, highlight_level: event.target.value }))}
                                className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                            >
                                {highlightOptions.map((level) => (
                                    <option key={level} value={level}>{level}</option>
                                ))}
                            </select>
                            <input
                                value={programForm.priority}
                                onChange={(event) => setProgramForm((prev) => ({ ...prev, priority: event.target.value }))}
                                className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                                placeholder="Priority"
                            />
                            <label className="flex items-center gap-2 text-xs text-slate-600">
                                <input
                                    type="checkbox"
                                    checked={programForm.is_active}
                                    onChange={(event) => setProgramForm((prev) => ({ ...prev, is_active: event.target.checked }))}
                                />
                                Program aktif
                            </label>
                            <button className="h-10 rounded-lg bg-sky-600 text-sm font-semibold text-white md:col-span-2">Simpan Perubahan</button>
                        </form>
                        <div className="mt-4 flex flex-wrap gap-2">
                            <button className="rounded-lg border border-emerald-200 px-4 py-2 text-xs font-semibold text-emerald-600" onClick={() => handleStatusAction('activate')}>Aktifkan</button>
                            <button className="rounded-lg border border-amber-200 px-4 py-2 text-xs font-semibold text-amber-600" onClick={() => handleStatusAction('deactivate')}>Nonaktifkan</button>
                            <button className="rounded-lg border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-600" onClick={() => handleStatusAction('suspend')}>Pause (Kill Switch)</button>
                            <button className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600" onClick={() => handleStatusAction('expire')}>Stop Program</button>
                        </div>
                    </section>
                )}

                {selectedProgram && section === 'scope' && (
                    <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-900">Cakupan Program & Aturan</h2>
                        <p className="text-sm text-slate-500">Tentukan target produk, aturan minimum transaksi, dan kuota.</p>
                        <form
                            className="mt-4 grid gap-4 md:grid-cols-2"
                            onSubmit={(event) => {
                                event.preventDefault();
                                updateProgram(
                                    {
                                        scope: {
                                            mode: scopeForm.mode,
                                            categories: parseList(scopeForm.categories),
                                            locations: parseList(scopeForm.locations),
                                            partners: parseList(scopeForm.partners),
                                            events: parseList(scopeForm.events),
                                        },
                                        rules: {
                                            min_transaction: Number(formatNumber(scopeForm.min_transaction)) || 0,
                                            max_quota: Number(formatNumber(scopeForm.max_quota)) || 0,
                                            per_user_limit: Number(formatNumber(scopeForm.per_user_limit)) || 0,
                                            stackable: scopeForm.stackable,
                                            used_quota: selectedProgram.rules?.used_quota ?? 0,
                                        },
                                    },
                                    'Cakupan & aturan diperbarui.'
                                );
                            }}
                        >
                            <select
                                value={scopeForm.mode}
                                onChange={(event) => setScopeForm((prev) => ({ ...prev, mode: event.target.value }))}
                                className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                            >
                                <option value="all">Semua produk</option>
                                <option value="selected">Produk tertentu</option>
                            </select>
                            <input
                                value={scopeForm.categories}
                                onChange={(event) => setScopeForm((prev) => ({ ...prev, categories: event.target.value }))}
                                className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                                placeholder="Kategori (pisahkan dengan koma)"
                            />
                            <input
                                value={scopeForm.locations}
                                onChange={(event) => setScopeForm((prev) => ({ ...prev, locations: event.target.value }))}
                                className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                                placeholder="Lokasi (kota/daerah)"
                            />
                            <input
                                value={scopeForm.partners}
                                onChange={(event) => setScopeForm((prev) => ({ ...prev, partners: event.target.value }))}
                                className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                                placeholder="Mitra tertentu"
                            />
                            <input
                                value={scopeForm.events}
                                onChange={(event) => setScopeForm((prev) => ({ ...prev, events: event.target.value }))}
                                className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                                placeholder="Event tertentu"
                            />
                            <input
                                value={scopeForm.min_transaction}
                                onChange={(event) => setScopeForm((prev) => ({ ...prev, min_transaction: event.target.value }))}
                                className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                                placeholder="Minimum transaksi"
                            />
                            <input
                                value={scopeForm.max_quota}
                                onChange={(event) => setScopeForm((prev) => ({ ...prev, max_quota: event.target.value }))}
                                className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                                placeholder="Maksimum kuota"
                            />
                            <input
                                value={scopeForm.per_user_limit}
                                onChange={(event) => setScopeForm((prev) => ({ ...prev, per_user_limit: event.target.value }))}
                                className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                                placeholder="Limit per user"
                            />
                            <label className="flex items-center gap-2 text-xs text-slate-600">
                                <input
                                    type="checkbox"
                                    checked={scopeForm.stackable}
                                    onChange={(event) => setScopeForm((prev) => ({ ...prev, stackable: event.target.checked }))}
                                />
                                Bisa digabung promo lain
                            </label>
                            <button className="h-10 rounded-lg bg-sky-600 text-sm font-semibold text-white md:col-span-2">Simpan Aturan</button>
                        </form>
                    </section>
                )}

                {selectedProgram && section === 'benefits' && (
                    <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-900">Skema Diskon & Benefit</h2>
                        <p className="text-sm text-slate-500">Atur persentase/nominal, subsidi, dan cap maksimal.</p>
                        <form
                            className="mt-4 grid gap-4 md:grid-cols-2"
                            onSubmit={(event) => {
                                event.preventDefault();
                                updateProgram(
                                    {
                                        discount: {
                                            type: discountForm.type,
                                            value: Number(formatNumber(discountForm.value)) || 0,
                                            platform_subsidy: Number(formatNumber(discountForm.platform_subsidy)) || 0,
                                            partner_subsidy: Number(formatNumber(discountForm.partner_subsidy)) || 0,
                                            max_cap: Number(formatNumber(discountForm.max_cap)) || 0,
                                        },
                                    },
                                    'Skema diskon diperbarui.'
                                );
                            }}
                        >
                            <select
                                value={discountForm.type}
                                onChange={(event) => setDiscountForm((prev) => ({ ...prev, type: event.target.value }))}
                                className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                            >
                                {typeOptions.map((type) => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                            <input
                                value={discountForm.value}
                                onChange={(event) => setDiscountForm((prev) => ({ ...prev, value: event.target.value }))}
                                className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                                placeholder="Nilai diskon"
                            />
                            <input
                                value={discountForm.platform_subsidy}
                                onChange={(event) => setDiscountForm((prev) => ({ ...prev, platform_subsidy: event.target.value }))}
                                className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                                placeholder="Subsidi platform"
                            />
                            <input
                                value={discountForm.partner_subsidy}
                                onChange={(event) => setDiscountForm((prev) => ({ ...prev, partner_subsidy: event.target.value }))}
                                className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                                placeholder="Subsidi mitra"
                            />
                            <input
                                value={discountForm.max_cap}
                                onChange={(event) => setDiscountForm((prev) => ({ ...prev, max_cap: event.target.value }))}
                                className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                                placeholder="Maximum cap"
                            />
                            <div className="rounded-2xl border border-slate-100 p-4 text-sm text-slate-600 md:col-span-2">
                                <div className="font-semibold text-slate-800">Simulasi Dampak Harga</div>
                                <div className="mt-2 flex flex-wrap items-center gap-3">
                                    <input
                                        value={discountForm.simulation_base}
                                        onChange={(event) => setDiscountForm((prev) => ({ ...prev, simulation_base: event.target.value }))}
                                        className="h-9 rounded-lg border border-slate-200 px-3 text-sm"
                                        placeholder="Harga dasar"
                                    />
                                    <span className="text-xs text-slate-500">Harga akhir: {formatCurrency(simulation.finalPrice)}</span>
                                    <span className="text-xs text-slate-500">Diskon: {formatCurrency(simulation.discountAmount)}</span>
                                </div>
                            </div>
                            <button className="h-10 rounded-lg bg-sky-600 text-sm font-semibold text-white md:col-span-2">Simpan Skema</button>
                        </form>
                    </section>
                )}

                {selectedProgram && section === 'visibility' && (
                    <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-900">Distribusi & Visibilitas</h2>
                        <p className="text-sm text-slate-500">Atur penempatan, prioritas, dan highlight level.</p>
                        <form
                            className="mt-4 grid gap-4 md:grid-cols-2"
                            onSubmit={(event) => {
                                event.preventDefault();
                                updateProgram(
                                    {
                                        visibility: {
                                            placements: visibilityForm.placements,
                                            priority: Number(formatNumber(visibilityForm.priority)) || 0,
                                            highlight_level: visibilityForm.highlight_level,
                                            push_enabled: visibilityForm.push_enabled,
                                            tag_label: visibilityForm.tag_label,
                                        },
                                        priority: Number(formatNumber(visibilityForm.priority)) || 0,
                                        highlight_level: visibilityForm.highlight_level,
                                    },
                                    'Visibilitas diperbarui.'
                                );
                            }}
                        >
                            <div className="flex flex-wrap gap-3 text-sm">
                                {['homepage_banner', 'special_section', 'tag_special'].map((placement) => (
                                    <label key={placement} className="flex items-center gap-2 text-xs text-slate-600">
                                        <input
                                            type="checkbox"
                                            checked={visibilityForm.placements.includes(placement)}
                                            onChange={(event) => {
                                                const next = event.target.checked
                                                    ? [...visibilityForm.placements, placement]
                                                    : visibilityForm.placements.filter((item) => item !== placement);
                                                setVisibilityForm((prev) => ({ ...prev, placements: next }));
                                            }}
                                        />
                                        {placement}
                                    </label>
                                ))}
                            </div>
                            <label className="flex items-center gap-2 text-xs text-slate-600">
                                <input
                                    type="checkbox"
                                    checked={visibilityForm.push_enabled}
                                    onChange={(event) => setVisibilityForm((prev) => ({ ...prev, push_enabled: event.target.checked }))}
                                />
                                Trigger push notification
                            </label>
                            <input
                                value={visibilityForm.priority}
                                onChange={(event) => setVisibilityForm((prev) => ({ ...prev, priority: event.target.value }))}
                                className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                                placeholder="Priority"
                            />
                            <select
                                value={visibilityForm.highlight_level}
                                onChange={(event) => setVisibilityForm((prev) => ({ ...prev, highlight_level: event.target.value }))}
                                className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                            >
                                {highlightOptions.map((level) => (
                                    <option key={level} value={level}>{level}</option>
                                ))}
                            </select>
                            <input
                                value={visibilityForm.tag_label}
                                onChange={(event) => setVisibilityForm((prev) => ({ ...prev, tag_label: event.target.value }))}
                                className="h-10 rounded-lg border border-slate-200 px-3 text-sm md:col-span-2"
                                placeholder="Label tag"
                            />
                            <button className="h-10 rounded-lg bg-sky-600 text-sm font-semibold text-white md:col-span-2">Simpan Visibilitas</button>
                        </form>
                    </section>
                )}

                {selectedProgram && section === 'monitoring' && (
                    <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">Dashboard Program</h2>
                                <p className="text-sm text-slate-500">Pantau performa real-time dan lakukan aksi darurat.</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button className="rounded-lg border border-amber-200 px-4 py-2 text-xs font-semibold text-amber-600" onClick={() => handleStatusAction('suspend')}>Pause Program</button>
                                <button className="rounded-lg border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-600" onClick={() => handleStatusAction('expire')}>Stop Program</button>
                            </div>
                        </div>
                        <div className="mt-6 grid gap-4 md:grid-cols-4">
                            <div className="rounded-2xl border border-slate-100 p-4">
                                <div className="text-xs text-slate-500">Total Transaksi</div>
                                <div className="text-lg font-semibold text-slate-900">{monitoring.totalTransactions}</div>
                            </div>
                            <div className="rounded-2xl border border-slate-100 p-4">
                                <div className="text-xs text-slate-500">Conversion Rate</div>
                                <div className="text-lg font-semibold text-slate-900">{monitoring.conversionRate}%</div>
                            </div>
                            <div className="rounded-2xl border border-slate-100 p-4">
                                <div className="text-xs text-slate-500">Total Subsidi</div>
                                <div className="text-lg font-semibold text-slate-900">{formatCurrency(monitoring.totalSubsidy)}</div>
                            </div>
                            <div className="rounded-2xl border border-slate-100 p-4">
                                <div className="text-xs text-slate-500">Sisa Kuota</div>
                                <div className="text-lg font-semibold text-slate-900">{monitoring.remainingQuota}</div>
                            </div>
                        </div>
                    </section>
                )}

                {selectedProgram && section === 'finance' && (
                    <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-900">Budget & Audit</h2>
                        <p className="text-sm text-slate-500">Kontrol subsidi dan limit anggaran program.</p>
                        <form
                            className="mt-4 grid gap-4 md:grid-cols-2"
                            onSubmit={(event) => {
                                event.preventDefault();
                                updateProgram(
                                    {
                                        budget: {
                                            limit: Number(formatNumber(budgetForm.limit)) || 0,
                                            used: Number(formatNumber(budgetForm.used)) || 0,
                                        },
                                    },
                                    'Budget diperbarui.'
                                );
                            }}
                        >
                            <input
                                value={budgetForm.limit}
                                onChange={(event) => setBudgetForm((prev) => ({ ...prev, limit: event.target.value }))}
                                className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                                placeholder="Budget maksimal"
                            />
                            <input
                                value={budgetForm.used}
                                onChange={(event) => setBudgetForm((prev) => ({ ...prev, used: event.target.value }))}
                                className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                                placeholder="Realisasi subsidi"
                            />
                            <button className="h-10 rounded-lg bg-sky-600 text-sm font-semibold text-white md:col-span-2">Simpan Budget</button>
                        </form>
                    </section>
                )}

                {selectedProgram && section === 'compliance' && (
                    <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-900">Komunikasi & Kepatuhan</h2>
                        <p className="text-sm text-slate-500">Atur notifikasi mitra, persetujuan, dan catatan legal.</p>
                        <form
                            className="mt-4 grid gap-4"
                            onSubmit={(event) => {
                                event.preventDefault();
                                updateProgram(
                                    {
                                        compliance: {
                                            partner_notification: complianceForm.partner_notification,
                                            partner_approval_required: complianceForm.partner_approval_required,
                                            legal_note: complianceForm.legal_note,
                                        },
                                        terms: complianceForm.terms,
                                    },
                                    'Kepatuhan diperbarui.'
                                );
                            }}
                        >
                            <textarea
                                value={complianceForm.partner_notification}
                                onChange={(event) => setComplianceForm((prev) => ({ ...prev, partner_notification: event.target.value }))}
                                className="min-h-[90px] rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                placeholder="Notifikasi untuk mitra"
                            />
                            <label className="flex items-center gap-2 text-xs text-slate-600">
                                <input
                                    type="checkbox"
                                    checked={complianceForm.partner_approval_required}
                                    onChange={(event) => setComplianceForm((prev) => ({ ...prev, partner_approval_required: event.target.checked }))}
                                />
                                Butuh persetujuan mitra sebelum live
                            </label>
                            <textarea
                                value={complianceForm.terms}
                                onChange={(event) => setComplianceForm((prev) => ({ ...prev, terms: event.target.value }))}
                                className="min-h-[90px] rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                placeholder="Syarat & ketentuan program"
                            />
                            <textarea
                                value={complianceForm.legal_note}
                                onChange={(event) => setComplianceForm((prev) => ({ ...prev, legal_note: event.target.value }))}
                                className="min-h-[90px] rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                placeholder="Catatan legal internal"
                            />
                            <button className="h-10 rounded-lg bg-sky-600 text-sm font-semibold text-white">Simpan Kepatuhan</button>
                        </form>
                    </section>
                )}
            </div>
        </AppLayout>
    );
}
