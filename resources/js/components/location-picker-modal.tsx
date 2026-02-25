import { useEffect, useRef, useState } from 'react';
import { MapPin, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

const DEFAULT_LOCATION = {
    lat: -6.200000,
    lng: 106.816666,
};

type SearchResult = {
    display_name: string;
    lat: string;
    lon: string;
};

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialLat?: number | null;
    initialLng?: number | null;
    onSelect: (lat: number, lng: number) => void;
};

export default function LocationPickerModal({
    open,
    onOpenChange,
    initialLat,
    initialLng,
    onSelect,
}: Props) {
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<any>(null);
    const markerRef = useRef<any>(null);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selected, setSelected] = useState<{ lat: number; lng: number } | null>(
        null,
    );
    const [leafletReady, setLeafletReady] = useState(false);

    const loadLeaflet = () => {
        if (typeof window === 'undefined') {
            return Promise.reject(new Error('Window is undefined'));
        }

        if ((window as any).L) {
            setLeafletReady(true);
            return Promise.resolve();
        }

        return new Promise<void>((resolve, reject) => {
            const existingScript = document.querySelector<HTMLScriptElement>(
                'script[data-leaflet]',
            );
            const existingStyle = document.querySelector<HTMLLinkElement>(
                'link[data-leaflet]',
            );

            const handleReady = () => {
                setLeafletReady(true);
                resolve();
            };

            if (!existingStyle) {
                const style = document.createElement('link');
                style.rel = 'stylesheet';
                style.href =
                    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
                style.crossOrigin = '';
                style.setAttribute('data-leaflet', 'true');
                document.head.appendChild(style);
            }

            if (existingScript) {
                existingScript.addEventListener('load', handleReady, {
                    once: true,
                });
                existingScript.addEventListener(
                    'error',
                    () => reject(new Error('Leaflet gagal dimuat')),
                    { once: true },
                );
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.async = true;
            script.defer = true;
            script.crossOrigin = '';
            script.setAttribute('data-leaflet', 'true');
            script.addEventListener('load', handleReady, { once: true });
            script.addEventListener(
                'error',
                () => reject(new Error('Leaflet gagal dimuat')),
                { once: true },
            );
            document.body.appendChild(script);
        });
    };

    const getInitialLocation = () => {
        if (typeof initialLat === 'number' && typeof initialLng === 'number') {
            return { lat: initialLat, lng: initialLng };
        }

        return DEFAULT_LOCATION;
    };

    const setMarker = (lat: number, lng: number) => {
        const L = (window as any).L;
        if (!mapRef.current || !L) {
            return;
        }

        if (!markerRef.current) {
            markerRef.current = L.marker([lat, lng]).addTo(mapRef.current);
        } else {
            markerRef.current.setLatLng([lat, lng]);
        }

        setSelected({ lat, lng });
    };

    useEffect(() => {
        if (!open) {
            return;
        }

        loadLeaflet().catch(() => {
            setError('Peta gagal dimuat. Cek koneksi internet Anda.');
        });
    }, [open]);

    useEffect(() => {
        if (!open || !leafletReady) {
            return;
        }

        const L = (window as any).L;
        if (!L || !mapContainerRef.current) {
            setError('Peta gagal dimuat. Leaflet tidak tersedia.');
            return;
        }

        if (!mapRef.current) {
            const { lat, lng } = getInitialLocation();
            mapRef.current = L.map(mapContainerRef.current).setView([lat, lng], 12);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors',
            }).addTo(mapRef.current);

            mapRef.current.on('click', (event: any) => {
                const { lat: clickLat, lng: clickLng } = event.latlng;
                setMarker(clickLat, clickLng);
            });

            setMarker(lat, lng);
        } else {
            const { lat, lng } = getInitialLocation();
            mapRef.current.setView([lat, lng], 12);
            setMarker(lat, lng);
        }

        setTimeout(() => {
            mapRef.current?.invalidateSize();
        }, 150);
    }, [open, leafletReady]);

    const handleSearch = async (event?: React.FormEvent) => {
        event?.preventDefault();
        if (!query.trim()) {
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                    query,
                )}&limit=5&addressdetails=1`,
            );

            if (!response.ok) {
                throw new Error('Gagal mencari lokasi');
            }

            const data = (await response.json()) as SearchResult[];
            setResults(data);
        } catch (err) {
            setError('Lokasi tidak ditemukan. Coba kata kunci lain.');
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePickResult = (result: SearchResult) => {
        const lat = Number(result.lat);
        const lng = Number(result.lon);

        if (Number.isNaN(lat) || Number.isNaN(lng)) {
            return;
        }

        mapRef.current?.setView([lat, lng], 14);
        setMarker(lat, lng);
    };

    const handleUseLocation = () => {
        if (!selected) {
            return;
        }

        onSelect(selected.lat, selected.lng);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Pilih lokasi hotel</DialogTitle>
                    <DialogDescription>
                        Cari wilayah pada peta, lalu pilih lokasi untuk mengisi
                        koordinat otomatis.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSearch} className="flex gap-2">
                    <Input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Cari wilayah, kota, atau alamat"
                    />
                    <Button type="submit" disabled={isLoading}>
                        <Search className="mr-2 size-4" />
                        Cari
                    </Button>
                </form>

                {error && (
                    <p className="text-sm text-red-600" role="alert">
                        {error}
                    </p>
                )}

                {results.length > 0 && (
                    <div className="grid gap-2 rounded-lg border border-slate-100 p-3 text-sm">
                        {results.map((result) => (
                            <button
                                key={`${result.lat}-${result.lon}`}
                                type="button"
                                onClick={() => handlePickResult(result)}
                                className="flex items-start gap-2 rounded-md px-2 py-2 text-left text-slate-600 transition hover:bg-slate-50"
                            >
                                <MapPin className="mt-1 size-4 text-sky-600" />
                                <span>{result.display_name}</span>
                            </button>
                        ))}
                    </div>
                )}

                <div className="h-[240px] w-full overflow-hidden rounded-xl border border-slate-200 sm:h-[320px] lg:h-[360px]">
                    <div ref={mapContainerRef} className="h-full w-full" />
                </div>

                <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                    <div>
                        <p className="text-xs uppercase tracking-wider text-slate-400">
                            Latitude
                        </p>
                        <p className="font-semibold text-slate-900">
                            {selected ? selected.lat.toFixed(6) : '-'}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wider text-slate-400">
                            Longitude
                        </p>
                        <p className="font-semibold text-slate-900">
                            {selected ? selected.lng.toFixed(6) : '-'}
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Batal
                    </Button>
                    <Button
                        type="button"
                        className="bg-sky-600 text-white hover:bg-sky-700"
                        onClick={handleUseLocation}
                    >
                        Gunakan lokasi
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
