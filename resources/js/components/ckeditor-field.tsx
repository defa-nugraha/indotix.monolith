import { useEffect, useRef } from 'react';
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

    useEffect(() => {
        let active = true;

        loadCkeditor()
            .then(() => {
                if (!active || !textareaRef.current || editorRef.current) return;
                const ClassicEditor = (window as any).ClassicEditor;
                return ClassicEditor.create(textareaRef.current).then((editor: any) => {
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
                });
            })
            .catch(() => {
                // Fallback: keep textarea visible if CKEditor fails
            });

        return () => {
            active = false;
            if (editorRef.current) {
                editorRef.current.destroy();
                editorRef.current = null;
            }
        };
    }, []);

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
        <textarea
            ref={textareaRef}
            defaultValue={value}
            className={`w-full rounded-lg border border-slate-200 px-3 py-2 text-sm ${minHeightClassName ?? ''} ${className ?? ''}`}
        />
    );
}
