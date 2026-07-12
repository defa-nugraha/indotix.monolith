import {
    type CSSProperties,
    type HTMLAttributes,
    useEffect,
    useRef,
    useState,
} from 'react';
import { cn } from '@/lib/utils';

type ProductDescriptionProps = HTMLAttributes<HTMLParagraphElement> & {
    text?: string | null;
    fallback?: string;
    lines?: number;
};

export function ProductDescription({
    text,
    fallback,
    lines = 4,
    className,
    ...props
}: ProductDescriptionProps) {
    const content = text?.trim() || fallback || '';
    const textRef = useRef<HTMLParagraphElement>(null);
    const [expanded, setExpanded] = useState(false);
    const [canExpand, setCanExpand] = useState(false);

    useEffect(() => {
        const element = textRef.current;
        if (!element) return;

        const checkOverflow = () => {
            if (expanded) {
                setCanExpand(true);
                return;
            }

            setCanExpand(element.scrollHeight > element.clientHeight + 1);
        };

        checkOverflow();

        if (typeof ResizeObserver === 'undefined') {
            window.addEventListener('resize', checkOverflow);

            return () => window.removeEventListener('resize', checkOverflow);
        }

        const observer = new ResizeObserver(checkOverflow);
        observer.observe(element);

        return () => observer.disconnect();
    }, [content, lines, expanded]);

    if (!content) return null;

    return (
        <div>
            <p
                ref={textRef}
                className={cn(
                    !expanded && 'product-description-ellipsis',
                    className,
                )}
                style={
                    {
                        '--product-description-lines': lines,
                    } as CSSProperties
                }
                {...props}
            >
                {content}
            </p>
            {canExpand && (
                <button
                    type="button"
                    className="mt-1 text-sm font-semibold text-sky-600 hover:text-sky-700"
                    onClick={() => setExpanded((value) => !value)}
                >
                    {expanded ? 'Tutup' : 'Selengkapnya'}
                </button>
            )}
        </div>
    );
}
