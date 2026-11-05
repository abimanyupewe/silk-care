'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode
} from 'react';
import { LocateFixed, X } from 'lucide-react';
import { fetchApi, ApiError } from '@/lib/api-client';

type Fix = { lat: number; lng: number; accuracy: number; at: number };

type Snapshot = {
  fix: Fix | null;
  // Label pendek (jalan + area) untuk navbar; null = belum terbaca.
  address: string | null;
  // Pesan galat pembacaan alamat (kuota penuh, layanan gagal); terpisah dari galat pelacak.
  addressError: string | null;
};

type CurrentLocationState = {
  // starting = dialog izin peramban masih terbuka; locating = izin OK, menunggu fix
  // pertama; watching = posisi sudah mengalir.
  status: 'off' | 'starting' | 'locating' | 'watching';
  error: string;
  fix: Fix | null;
  address: string | null;
  addressError: string | null;
  start: () => void;
  stop: () => void;
};

const CurrentLocationContext = createContext<CurrentLocationState | null>(null);

// Penanda sesi: pengguna yang sengaja menekan "berhenti" tidak perlu diprompt ulang saat
// berpindah halaman. Izin tetap diurus peramban, bukan di sini.
const SESSION_OFF_KEY = 'silk-location-off';

// Pengambilan alamat dijarangkan (aturan Nominatim: 1 req/detik global, tanpa
// autocomplete): hanya refetch saat sel ~110 m (3 desimal) berubah DAN minimal 8 detik
// sejak permintaan terakhir. Server juga mengcache 24 jam, jadi pin yang diam murah.
const FETCH_MIN_INTERVAL_MS = 8000;
const CELL_SIZE = 3; // desimal: ~110 m

// ---- Store di luar React ----
// Peta (LeafletMap) berada di luar Navbar sehingga tidak bisa lewat context; alamat juga
// harus ikut tersimpan supaya permintaan sekali-baca dari tombol peta tetap memperbarui
// label navbar dari satu sumber yang sama.
let snapshot: Snapshot = { fix: null, address: null, addressError: null };
const snapshotListeners = new Set<() => void>();
let lastFetch = { key: '', at: 0 };
let fetching = false;
let fetchAbort: AbortController | null = null;

function emitSnapshot() {
  for (const listener of snapshotListeners) {
    listener();
  }
}

function setSnapshot(next: Partial<Snapshot>) {
  snapshot = { ...snapshot, ...next };
  emitSnapshot();
}

export function useCurrentLocationSnapshot(): Snapshot {
  return useSyncExternalStore(
    (listener) => {
      snapshotListeners.add(listener);

      return () => snapshotListeners.delete(listener);
    },
    () => snapshot,
    () => snapshot
  );
}

export function useCurrentFix(): Fix | null {
  return useCurrentLocationSnapshot().fix;
}

function shortLabel(fullLabel: string) {
  const parts = fullLabel.split(',').map((part) => part.trim());

  return parts.slice(0, 2).join(', ');
}

async function fetchAddress(next: Fix) {
  const key = `${next.lat.toFixed(CELL_SIZE)},${next.lng.toFixed(CELL_SIZE)}`;
  const movedCell = key !== lastFetch.key;
  const enoughTime = Date.now() - lastFetch.at >= FETCH_MIN_INTERVAL_MS;

  // Belum pernah terbaca: langsung cari; setelah itu hanya saat pindah sel + waktu cukup.
  if (snapshot.address && !(movedCell && enoughTime)) {
    return;
  }

  if (fetching) {
    return;
  }

  fetching = true;
  fetchAbort?.abort();
  fetchAbort = new AbortController();

  try {
    const result = await fetchApi<{ label: string }>(`/geocode?lat=${next.lat}&lon=${next.lng}`, {
      signal: fetchAbort.signal
    });

    if (typeof result?.data?.label !== 'string') {
      throw new Error('Bentuk jawaban geocode tidak dikenal.');
    }

    lastFetch = { key, at: Date.now() };
    setSnapshot({ address: shortLabel(result.data.label), addressError: null });
  } catch (fetchError) {
    // Label lama tetap dipakai; berikutnya dicoba lagi di fix berikutnya.
    if (fetchError instanceof ApiError && fetchError.status === 429) {
      setSnapshot({ addressError: 'Kuota alamat sesaat penuh; posisi tetap diperbarui.' });
    } else if (!(fetchError instanceof DOMException && fetchError.name === 'AbortError')) {
      setSnapshot({ addressError: 'Alamat gagal dibaca; akan dicoba lagi di posisi berikutnya.' });
    }
  } finally {
    fetching = false;
  }
}

function applyFix(next: Fix) {
  setSnapshot({ fix: next, addressError: null });
  void fetchAddress(next);
}

// Permintaan sekali baca untuk komponen di luar Navbar (mis. tombol "Pusatkan lokasi" di
// peta): memakai izin peramban yang sama, alamat navbar ikut diperbarui lewat store.
export function requestCurrentFix() {
  if (!('geolocation' in navigator)) {
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      applyFix(toFix(position));
    },
    () => undefined, // Ditolak/gagal: peta tetap seperti semula; pesan diurus pelacak navbar.
    { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
  );
}

function toFix(position: GeolocationPosition): Fix {
  return {
    lat: Number(position.coords.latitude.toFixed(6)),
    lng: Number(position.coords.longitude.toFixed(6)),
    // Akurasi laporan peramban (meter); dipakai peta untuk menggambar lingkaran
    // keyakinan supaya posisi yang meleset terlihat jelas penyebabnya.
    accuracy: Math.max(10, Math.round(position.coords.accuracy || 0)),
    at: Date.now()
  };
}

export function CurrentLocationProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<CurrentLocationState['status']>('off');
  const [error, setError] = useState('');
  const watchIdRef = useRef<number | null>(null);
  const current = useCurrentLocationSnapshot();

  function start() {
    if (!('geolocation' in navigator)) {
      setError('Peramban ini tidak mendukung geolocation.');
      return;
    }

    try {
      sessionStorage.removeItem(SESSION_OFF_KEY);
    } catch {
      // Penyimpanan diblokir: abaikan.
    }

    // Tutup pelacak lama (bila tombol ditekan berulang) supaya tidak menumpuk watcher.
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    setStatus('starting');

    // Bedakan "dialog izin masih terbuka" dan "izin OK, sedang mencari sinyal": denyut
    // pencarian baru tampil setelah pengunjung menjawab dialog, bukan selama dialog.
    if (typeof navigator.permissions?.query === 'function') {
      void navigator.permissions
        .query({ name: 'geolocation' })
        .then((permission) => {
          const reflect = () => {
            if (permission.state === 'granted') {
              setStatus((prev) => (prev === 'starting' ? 'locating' : prev));
            }
          };

          permission.onchange = reflect;
          reflect();
        })
        .catch(() => undefined); // Permissions API tak tersedia: fallback ke alur biasa.
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        applyFix(toFix(position));
        setStatus('watching');
        setError('');
      },
      (positionError) => {
        if (positionError.code === positionError.PERMISSION_DENIED) {
          setStatus('watching');
          setError('Izin lokasi ditolak; aktifkan lewat ikon lokasi peramban.');
        } else if (positionError.code === positionError.POSITION_UNAVAILABLE) {
          setStatus('watching');
          setError('Posisi tidak tersedia sementara; periksa GPS/WiFi perangkat.');
        } else {
          // TIMEOUT: pelacak masih berjalan; denyut "Mencari posisi..." tetap tampil.
          setStatus('locating');
          setError('Sinyal lokasi lambat; masih mencari...');
        }
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
    );

    watchIdRef.current = watchId;
  }

  function stop() {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    try {
      sessionStorage.setItem(SESSION_OFF_KEY, '1');
    } catch {
      // Penyimpanan diblokir: pengaturan hanya berlaku sampai halaman ditutup.
    }

    fetchAbort?.abort();
    setError('');
    setStatus('off');
  }

  useEffect(() => {
    // Izin lokasi ditawari otomatis begitu halaman terbuka (dialog izinnya milik peramban;
    // web tidak bisa memaksa custom dialog). Pengguna yang pernah menekan "berhenti" tidak
    // diganggu lagi di sesi yang sama.
    let stopped = false;

    try {
      stopped = sessionStorage.getItem(SESSION_OFF_KEY) === '1';
    } catch {
      // Penyimpanan diblokir: tetap tawarkan izin.
    }

    if (!stopped) {
      start();
    }
  }, []);

  useEffect(
    () => () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }

      fetchAbort?.abort();
    },
    []
  );

  const value: CurrentLocationState = {
    status,
    error,
    fix: current.fix,
    address: current.address,
    addressError: current.addressError,
    start,
    stop
  };

  return (
    <CurrentLocationContext.Provider value={value}>{children}</CurrentLocationContext.Provider>
  );
}

function useCurrentLocation() {
  const context = useContext(CurrentLocationContext);

  if (!context) {
    throw new Error('useCurrentLocation harus di dalam CurrentLocationProvider.');
  }

  return context;
}

// Pola UI: "Lokasi: {label}" — ikon + label selalu bersama (aturan tampilan SILK).
// Label hanya berisi teks yang berarti bagi pengunjung (jalan/desa); koordinat tidak
// pernah ditampilkan. Selama menunggu izin, pill tidak tampil — tombol "Lokasi saya"
// yang tetap terlihat, jadi tidak ada teks menggantung yang terpotong.
function useLabel(state: CurrentLocationState) {
  if (state.fix) {
    return state.address ?? state.addressError ?? 'Jalan/desa belum terbaca';
  }

  if (state.error) return state.error;
  // Izin sudah diberikan, GPS/WiFi masih mencari sinyal pertama.
  if (state.status === 'locating') return 'Mencari posisi...';

  return null;
}

// Versi inline untuk bar desktop. Tampil mulai xl (>=1280px): bar lg sempat meluber bila
// pill + pencarian + dua tombol akun tampil bersamaan.
export function CurrentLocationPill() {
  const state = useCurrentLocation();
  const label = useLabel(state);

  if (!label) {
    return (
      <button
        type="button"
        onClick={state.start}
        className="hidden h-11 items-center gap-2 rounded-md border border-border-strong px-3 text-sm text-ink-muted hover:border-primary hover:text-ink xl:flex"
        title="Tampilkan lokasi Anda saat ini"
      >
        <LocateFixed className="h-4 w-4 shrink-0" aria-hidden="true" />
        Lokasi saya
      </button>
    );
  }

  return (
    <div
      className="hidden h-11 max-w-56 items-center gap-2 rounded-md border border-border-strong px-3 text-sm xl:flex"
      title="Lokasi jalan/desa perangkat Anda"
    >
      <LocateFixed
        className={`h-4 w-4 shrink-0 text-primary-hover ${state.status === 'locating' ? 'animate-pulse' : ''}`}
        aria-hidden="true"
      />
      <span className="min-w-0 truncate font-semibold text-ink" aria-live="polite">
        {label}
      </span>
      <button
        type="button"
        onClick={state.stop}
        aria-label="Berhenti melacak lokasi"
        className="ml-auto shrink-0 text-ink-faint hover:text-destructive"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

// Versi strip untuk bar mobile: alamat tampil di baris bawah setelah diaktifkan.
export function CurrentLocationStrip() {
  const state = useCurrentLocation();
  const label = useLabel(state);

  if (!label) {
    return null;
  }

  return (
    <div className="border-t border-border bg-white px-4 py-2 lg:hidden">
      <p className="flex items-center gap-2 text-sm" aria-live="polite">
        <LocateFixed className="h-4 w-4 shrink-0 text-primary-hover" aria-hidden="true" />
        <span className="min-w-0">
          <span className="text-ink-faint">Lokasi: </span>
          <span className="truncate font-semibold text-ink">{label}</span>
        </span>
        <button
          type="button"
          onClick={state.stop}
          aria-label="Berhenti melacak lokasi"
          className="ml-auto shrink-0 text-ink-faint hover:text-destructive"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </p>
    </div>
  );
}

// Tombol kecil untuk bar mobile (sebelum pencarian) supaya strip bisa diaktifkan.
export function CurrentLocationToggle() {
  const state = useCurrentLocation();

  return (
    <button
      type="button"
      onClick={state.status === 'off' ? state.start : state.stop}
      aria-label={state.status === 'off' ? 'Tampilkan lokasi saya' : 'Berhenti melacak lokasi'}
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-border-strong ${
        state.status === 'off'
          ? 'text-ink-muted hover:border-primary hover:text-ink'
          : 'text-primary-deep'
      }`}
    >
      <LocateFixed className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}
