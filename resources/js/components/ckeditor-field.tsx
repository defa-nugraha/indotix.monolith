import { useEffect, useRef, useState } from 'react';
import { loadCkeditor } from '@/lib/ckeditor-loader';

type CkeditorFieldProps = {
    value: string;
    onChange: (value: string) => void;
    className?: string;
    minHeightClassName?: string;
};

export default function CkeditorField({ value, onChange, className, minHeightClassName }: CkeditorFieldProps) {
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const editorRef = useRef<any>(null);
    const updatingRef = useRef(false);
    const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
    const [retrySeed, setRetrySeed] = useState(0);

    useEffect(() => {
        let active = true;

        setStatus('loading');
        loadCkeditor()
            .then(() => {
                if (!active || !textareaRef.current || editorRef.current) return;
                const ClassicEditor = (window as any).ClassicEditor;
                return ClassicEditor.create(textareaRef.current, {
                    toolbar: ['heading', '|', 'bold', 'italic', 'link', 'bulletedList', 'numberedList', 'blockQuote', 'undo', 'redo'],
                }).then((editor: any) => {
                    if (!active) {
                        editor.destroy();
                        return;
                    }
                    editorRef.current = editor;
                    editor.setData(value || '');
                    editor.model.document.on('change:data', () => {
                        if (updatingRef.current) {
                            updatingRef.current = false;
                            return;
                        }
                        const data = editor.getData();
                        onChange(data);
                    });
                    setStatus('ready');
                });
            })
            .catch(() => {
                if (!active) return;
                editorRef.current = null;
                setStatus('error');
            });

        return () => {
            active = false;
            if (editorRef.current) {
                editorRef.current.destroy();
                editorRef.current = null;
            }
        };
    }, [retrySeed]);

    useEffect(() => {
        const editor = editorRef.current;
        if (!editor) return;
        const current = editor.getData();
        if (current !== value) {
            updatingRef.current = true;
            editor.setData(value || '');
        }
    }, [value]);

    return (
        <div className="space-y-2">
            <textarea
                ref={textareaRef}
                defaultValue={value}
                className={`w-full rounded-lg border border-slate-200 px-3 py-2 text-sm ${minHeightClassName ?? ''} ${className ?? ''}`}
            />
            {status === 'loading' && (
                <div className="text-xs text-slate-400">Memuat editor...</div>
            )}
            {status === 'error' && (
                <div className="flex items-center gap-2 text-xs text-rose-500">
                    <span>Editor gagal dimuat.</span>
                    <button
                        type="button"
                        className="font-semibold text-sky-600"
                        onClick={() => setRetrySeed((prev) => prev + 1)}
                    >
                        Coba lagi
                    </button>
                </div>
            )}
        </div>
    );
}
