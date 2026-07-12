export default function Heading({
    title,
    description,
    variant = 'default',
}: {
    title: string;
    description?: string;
    variant?: 'default' | 'small';
}) {
    return (
        <header className={variant === 'small' ? '' : 'mb-8 space-y-0.5'}>
            <h2
                className={
                    variant === 'small'
                        ? 'mb-0.5 text-base leading-6 font-semibold text-foreground'
                        : 'text-xl leading-7 font-semibold tracking-tight text-foreground'
                }
            >
                {title}
            </h2>
            {description && (
                <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                    {description}
                </p>
            )}
        </header>
    );
}
