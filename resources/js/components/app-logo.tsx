export default function AppLogo() {
    return (
        <>
            <div className="flex size-10 items-center justify-center rounded-md bg-white/80 p-1 shadow-xs">
                <img
                    src="/logo.png"
                    alt="Indotix"
                    className="h-7 w-auto"
                />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-semibold">
                    INDOTIX
                </span>
            </div>
        </>
    );
}
