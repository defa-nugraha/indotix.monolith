type CommissionInfo = {
    title: string;
    summary: string;
    description: string;
    type?: string | null;
    value?: number | null;
    is_forever?: boolean;
    starts_at?: string | null;
    ends_at?: string | null;
};

export default function CommissionInfoCard({
    info,
}: {
    info?: CommissionInfo | null;
}) {
    if (!info) return null;

    return (
        <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4 text-sm text-slate-700">
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                    <p className="text-xs font-semibold text-sky-600 uppercase">
                        Informasi Komisi Platform
                    </p>
                    <h3 className="mt-1 font-semibold text-slate-900">
                        {info.title}
                    </h3>
                    <p className="mt-1 text-slate-700">{info.summary}</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
                        {info.description}
                    </p>
                </div>
                <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-semibold text-sky-700 shadow-sm">
                    {info.is_forever
                        ? 'Berlaku selamanya'
                        : `${info.starts_at ?? '-'} - ${info.ends_at ?? '-'}`}
                </span>
            </div>
        </div>
    );
}

export type { CommissionInfo };
