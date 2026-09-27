import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Headphones,
  Menu,
  Moon,
  Pause,
  Play,
  RotateCcw,
  Search,
  Sparkles,
  Sun,
  X,
} from 'lucide-react';

type Surah = {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
};

type Ayah = {
  number: number;
  numberInSurah: number;
  text: string;
  audio?: string;
};

type ApiEnvelope<T> = { code: number; status: string; data: T };
type SurahData = Surah & { ayahs: Ayah[] };

const API_ROOT = 'https://api.alquran.cloud/v1';
const ALLOWED_SURAH_NUMBERS = [1, 10, 11, 12, 13, 14, 15, 16, 17];

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Quran Cloud returned ${response.status}`);
  const payload = (await response.json()) as ApiEnvelope<T>;
  if (payload.code !== 200) throw new Error(payload.status || 'تعذر تحميل البيانات');
  return payload.data;
}

function getStoredTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.localStorage.getItem('quran-theme') === 'dark' ? 'dark' : 'light';
}

function formatRevelation(type: string) {
  return type.toLowerCase() === 'meccan' ? 'مكية' : 'مدنية';
}

function normalizeArabic(value: string) {
  return value
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[إأآ]/g, 'ا')
    .replace(/ة/g, 'ه');
}

function SurahList({
  surahs,
  selectedNumber,
  query,
  onQueryChange,
  onSelect,
  isLoading,
  error,
  onRetry,
}: {
  surahs: Surah[];
  selectedNumber: number;
  query: string;
  onQueryChange: (value: string) => void;
  onSelect: (number: number) => void;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  const filtered = useMemo(() => {
    const term = normalizeArabic(query.trim());
    if (!term) return surahs;
    return surahs.filter((surah) =>
      [surah.name, surah.englishName, surah.englishNameTranslation, String(surah.number)]
        .map(normalizeArabic)
        .some((value) => value.includes(term)),
    );
  }, [query, surahs]);

  return (
    <aside className="flex min-h-0 flex-col bg-card/55 lg:border-e" dir="rtl">
      <div className="border-b border-border/70 px-5 pb-4 pt-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/80">الفهرس</p>
            <h2 className="mt-1 font-[var(--app-font-serif)] text-2xl font-semibold">سور القرآن</h2>
          </div>
          <div className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
            {ALLOWED_SURAH_NUMBERS.length} سور
          </div>
        </div>
        <label className="relative block">
          <span className="sr-only">ابحث عن سورة</span>
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            data-testid="input-search-surahs"
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="ابحث باسم السورة أو رقمها"
            className="h-11 w-full rounded-xl border border-border/80 bg-background/75 pe-4 ps-10 text-sm text-foreground placeholder:text-muted-foreground/75"
            dir="rtl"
          />
          {query ? (
            <button
              data-testid="button-clear-search"
              type="button"
              aria-label="مسح البحث"
              onClick={() => onQueryChange('')}
              className="absolute end-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </label>
      </div>

      <div className="quiet-scrollbar min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {isLoading ? (
          <div className="space-y-2" data-testid="status-surahs-loading">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="skeleton h-[68px] rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <div className="px-4 py-10 text-center" data-testid="status-surahs-error">
            <AlertCircle className="mx-auto size-6 text-primary" />
            <p className="mt-3 text-sm font-semibold">لم نتمكن من فتح الفهرس</p>
            <p className="mt-1 text-xs leading-6 text-muted-foreground">{error}</p>
            <button
              data-testid="button-retry-surahs"
              type="button"
              onClick={onRetry}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:brightness-95"
            >
              <RotateCcw className="size-3.5" /> إعادة المحاولة
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-12 text-center" data-testid="status-surahs-empty">
            <Search className="mx-auto size-6 text-muted-foreground" />
            <p className="mt-3 text-sm font-semibold">لا توجد نتائج</p>
            <p className="mt-1 text-xs text-muted-foreground">جرّب اسمًا آخر أو رقم السورة</p>
          </div>
        ) : (
          <div className="space-y-1.5" data-testid="list-surahs">
            {filtered.map((surah) => {
              const selected = surah.number === selectedNumber;
              return (
                <button
                  data-testid={`button-surah-${surah.number}`}
                  key={surah.number}
                  type="button"
                  onClick={() => onSelect(surah.number)}
                  className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-start transition ${
                    selected
                      ? 'bg-primary text-primary-foreground shadow-[0_8px_24px_hsl(var(--primary)/0.22)]'
                      : 'hover:bg-secondary/75'
                  }`}
                  dir="rtl"
                >
                  <span
                    className={`flex size-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-semibold ${
                      selected ? 'bg-primary-foreground/15 text-primary-foreground' : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    {surah.number}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-[var(--app-font-serif)] text-lg leading-5">{surah.name}</span>
                    <span className={`mt-1 block truncate text-[10px] ${selected ? 'text-primary-foreground/75' : 'text-muted-foreground'}`}>
                      {surah.englishName} · {surah.numberOfAyahs} آية
                    </span>
                  </span>
                  {selected ? <Check className="size-4 shrink-0 opacity-80" /> : null}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}

function AyahRow({
  ayah,
  tafsir,
  isTafsirOpen,
  isPlaying,
  onToggleTafsir,
  onPlay,
}: {
  ayah: Ayah;
  tafsir?: Ayah;
  isTafsirOpen: boolean;
  isPlaying: boolean;
  onToggleTafsir: () => void;
  onPlay: () => void;
}) {
  return (
    <article
      data-testid={`card-ayah-${ayah.numberInSurah}`}
      className={`group relative border-b border-border/70 px-1 py-7 last:border-b-0 sm:px-4 sm:py-9 ${isPlaying ? 'bg-primary/[0.035]' : ''}`}
      dir="rtl"
    >
      <div className="flex items-start gap-3 sm:gap-5">
        <div className="flex shrink-0 flex-col items-center gap-3 pt-1">
          <span className="flex size-9 items-center justify-center rounded-full border border-primary/25 bg-secondary/50 text-xs font-semibold text-primary">
            {ayah.numberInSurah}
          </span>
          <button
            data-testid={`button-play-ayah-${ayah.numberInSurah}`}
            type="button"
            aria-label={isPlaying ? `إيقاف تلاوة الآية ${ayah.numberInSurah}` : `تشغيل تلاوة الآية ${ayah.numberInSurah}`}
            onClick={onPlay}
            className={`flex size-9 items-center justify-center rounded-full border transition ${
              isPlaying
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-primary hover:border-primary hover:bg-secondary'
            }`}
          >
            {isPlaying ? <Pause className="size-3.5 fill-current" /> : <Play className="size-3.5 fill-current" />}
          </button>
        </div>
        <div className="min-w-0 flex-1">
          <p data-testid={`text-ayah-${ayah.numberInSurah}`} className="arabic-reading text-right text-[29px] leading-[2.05] text-foreground sm:text-[34px]">
            {ayah.text}
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-start gap-2">
            <button
              data-testid={`button-tafsir-${ayah.numberInSurah}`}
              type="button"
              aria-expanded={isTafsirOpen}
              onClick={onToggleTafsir}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                isTafsirOpen ? 'border-primary/30 bg-secondary text-primary' : 'border-border text-muted-foreground hover:border-primary/40 hover:text-primary'
              }`}
            >
              <Sparkles className="size-3.5" />
              {isTafsirOpen ? 'إخفاء التفسير الميسر' : 'التفسير الميسر'}
              <ChevronDown className={`size-3.5 transition-transform ${isTafsirOpen ? 'rotate-180' : ''}`} />
            </button>
            {isPlaying ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] text-primary">
                <Headphones className="size-3.5" /> يتلى الآن
              </span>
            ) : null}
          </div>
          {isTafsirOpen ? (
            <div className="mt-4 rounded-2xl border border-accent/35 bg-accent/10 px-4 py-4 text-right text-[15px] leading-8 text-foreground/80 rise-in">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold text-primary">
                <Sparkles className="size-3.5" /> التفسير الميسر
              </div>
              <p data-testid={`text-tafsir-${ayah.numberInSurah}`}>{tafsir?.text || 'لا يتوفر التفسير لهذه الآية حاليًا.'}</p>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function ReaderSkeleton() {
  return (
    <div className="space-y-5" data-testid="status-reader-loading">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-border/60 bg-card/70 px-5 py-8">
          <div className="flex items-start gap-5">
            <div className="skeleton size-9 rounded-full" />
            <div className="flex-1 space-y-4">
              <div className="skeleton ms-auto h-10 w-11/12 rounded-lg" />
              <div className="skeleton ms-auto h-10 w-8/12 rounded-lg" />
              <div className="skeleton h-7 w-28 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function QuranReader() {
  const [theme, setTheme] = useState<'light' | 'dark'>(getStoredTheme);
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [surahsLoading, setSurahsLoading] = useState(true);
  const [surahsError, setSurahsError] = useState<string | null>(null);
  const [selectedNumber, setSelectedNumber] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedData, setSelectedData] = useState<SurahData | null>(null);
  const [tafsirData, setTafsirData] = useState<SurahData | null>(null);
  const [audioData, setAudioData] = useState<SurahData | null>(null);
  const [readerLoading, setReaderLoading] = useState(false);
  const [readerError, setReaderError] = useState<string | null>(null);
  const [readerAttempt, setReaderAttempt] = useState(0);
  const [openTafsir, setOpenTafsir] = useState<Set<number>>(new Set());
  const [playingAyah, setPlayingAyah] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentSurah = surahs.find((surah) => surah.number === selectedNumber);
  const currentSurahIndex = surahs.findIndex((surah) => surah.number === selectedNumber);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    window.localStorage.setItem('quran-theme', theme);
  }, [theme]);

  const loadSurahs = () => {
    setSurahsLoading(true);
    setSurahsError(null);
    getJson<Surah[]>(`${API_ROOT}/surah`)
      .then((data) => setSurahs(data.filter((surah) => ALLOWED_SURAH_NUMBERS.includes(surah.number))))
      .catch((error: Error) => setSurahsError(error.message || 'حدث خطأ غير متوقع'))
      .finally(() => setSurahsLoading(false));
  };

  useEffect(() => {
    loadSurahs();
  }, []);

  useEffect(() => {
    if (!surahs.length) return;
    const controller = new AbortController();
    setReaderLoading(true);
    setReaderError(null);
    setSelectedData(null);
    setTafsirData(null);
    setAudioData(null);
    setOpenTafsir(new Set());
    setPlayingAyah(null);
    Promise.all([
      getJson<SurahData>(`${API_ROOT}/surah/${selectedNumber}`, controller.signal),
      getJson<SurahData>(`${API_ROOT}/surah/${selectedNumber}/ar.muyassar`, controller.signal),
      getJson<SurahData>(`${API_ROOT}/surah/${selectedNumber}/ar.alafasy`, controller.signal),
    ])
      .then(([arabic, tafsir, audio]) => {
        setSelectedData(arabic);
        setTafsirData(tafsir);
        setAudioData(audio);
      })
      .catch((error: Error) => {
        if (error.name !== 'AbortError') setReaderError(error.message || 'تعذر تحميل السورة');
      })
      .finally(() => setReaderLoading(false));
    return () => controller.abort();
  }, [selectedNumber, surahs.length, readerAttempt]);

  useEffect(() => () => {
    audioRef.current?.pause();
  }, []);

  const selectSurah = (number: number) => {
    audioRef.current?.pause();
    setPlayingAyah(null);
    setSelectedNumber(number);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleAudio = (ayahNumber: number) => {
    const ayah = audioData?.ayahs.find((item) => item.numberInSurah === ayahNumber);
    if (!ayah?.audio) return;
    if (playingAyah === ayahNumber) {
      audioRef.current?.pause();
      setPlayingAyah(null);
      return;
    }
    audioRef.current?.pause();
    const audio = new Audio(ayah.audio);
    audioRef.current = audio;
    audio.onended = () => setPlayingAyah(null);
    audio.onerror = () => setPlayingAyah(null);
    setPlayingAyah(ayahNumber);
    void audio.play().catch(() => setPlayingAyah(null));
  };

  return (
    <div className="reading-shell min-h-[100dvh]">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1500px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3" dir="rtl">
            <button
              data-testid="button-mobile-menu"
              type="button"
              aria-label={mobileMenuOpen ? 'إخفاء قائمة السور' : 'عرض قائمة السور'}
              onClick={() => setMobileMenuOpen((value) => !value)}
              className="rounded-xl p-2.5 text-muted-foreground hover:bg-secondary hover:text-foreground lg:hidden"
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
            <div className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_8px_18px_hsl(var(--primary)/0.22)]">
              <BookOpen className="size-5" />
            </div>
            <div>
              <p className="font-[var(--app-font-serif)] text-xl font-semibold leading-none">ورد</p>
              <p className="mt-1 text-[10px] tracking-[0.18em] text-muted-foreground">QURAN READING</p>
            </div>
          </div>
          <div className="flex items-center gap-2" dir="rtl">
            <p className="hidden text-xs text-muted-foreground sm:block">مساحتك الهادئة مع القرآن</p>
            <button
              data-testid="button-toggle-theme"
              type="button"
              aria-label={theme === 'light' ? 'تفعيل الوضع الداكن' : 'تفعيل الوضع الفاتح'}
              onClick={() => setTheme((value) => (value === 'light' ? 'dark' : 'light'))}
              className="flex size-10 items-center justify-center rounded-xl border border-border/70 bg-card/50 text-muted-foreground transition hover:border-primary/40 hover:text-primary"
            >
              {theme === 'light' ? <Moon className="size-4" /> : <Sun className="size-4" />}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1500px] lg:grid-cols-[286px_minmax(0,1fr)]">
        <div className={`fixed inset-x-0 bottom-0 top-[73px] z-20 bg-background/95 backdrop-blur-sm lg:static lg:block lg:bg-transparent lg:backdrop-blur-none ${mobileMenuOpen ? 'block' : 'hidden'}`}>
          <SurahList
            surahs={surahs}
            selectedNumber={selectedNumber}
            query={search}
            onQueryChange={setSearch}
            onSelect={selectSurah}
            isLoading={surahsLoading}
            error={surahsError}
            onRetry={loadSurahs}
          />
        </div>

        <main className="min-w-0 px-4 pb-16 pt-7 sm:px-7 lg:px-12 lg:pt-12" dir="rtl">
          <div className="mx-auto max-w-[880px]">
            <div className="mb-9 flex items-end justify-between gap-4">
              <div>
                <p className="mb-2 text-xs font-semibold tracking-[0.2em] text-primary/80">سورة رقم {selectedNumber}</p>
                <h1 data-testid="text-selected-surah" className="font-[var(--app-font-serif)] text-5xl font-semibold tracking-tight sm:text-6xl">
                  {currentSurah?.name || 'القرآن الكريم'}
                </h1>
                {currentSurah ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{currentSurah.englishName}</span>
                    <span className="size-1 rounded-full bg-accent" />
                    <span>{formatRevelation(currentSurah.revelationType)}</span>
                    <span className="size-1 rounded-full bg-accent" />
                    <span>{currentSurah.numberOfAyahs} آية</span>
                  </div>
                ) : null}
              </div>
              <div className="hidden items-center gap-1 rounded-full border border-border/70 bg-card/60 p-1 sm:flex">
                <button
                  data-testid="button-previous-surah"
                  type="button"
                  aria-label="السورة السابقة"
                  disabled={currentSurahIndex <= 0}
                  onClick={() => selectSurah(surahs[currentSurahIndex - 1]?.number ?? selectedNumber)}
                  className="rounded-full p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:opacity-30"
                >
                  <ChevronRight className="size-4" />
                </button>
                <span className="px-1 text-[10px] text-muted-foreground">تنقّل</span>
                <button
                  data-testid="button-next-surah"
                  type="button"
                  aria-label="السورة التالية"
                  disabled={currentSurahIndex < 0 || currentSurahIndex >= surahs.length - 1}
                  onClick={() => selectSurah(surahs[currentSurahIndex + 1]?.number ?? selectedNumber)}
                  className="rounded-full p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:opacity-30"
                >
                  <ChevronLeft className="size-4" />
                </button>
              </div>
            </div>

            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-primary/15 bg-primary/[0.055] px-5 py-4 text-sm text-muted-foreground">
              <Headphones className="size-4 shrink-0 text-primary" />
              <span>اضغط على زر السماعة بجانب أي آية للاستماع إلى تلاوة الشيخ مشاري العفاسي.</span>
            </div>

            {readerLoading ? <ReaderSkeleton /> : readerError ? (
              <div className="rounded-2xl border border-destructive/25 bg-card px-6 py-14 text-center" data-testid="status-reader-error">
                <AlertCircle className="mx-auto size-8 text-destructive" />
                <h2 className="mt-4 font-[var(--app-font-serif)] text-2xl font-semibold">تعذر فتح السورة</h2>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-7 text-muted-foreground">{readerError}</p>
                <button
                  data-testid="button-retry-reader"
                  type="button"
                  onClick={() => setReaderAttempt((attempt) => attempt + 1)}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-95"
                >
                  <RotateCcw className="size-4" /> إعادة تحميل السورة
                </button>
              </div>
            ) : selectedData ? (
              <div className="overflow-hidden rounded-2xl border border-border/70 bg-card/55 px-4 shadow-[var(--shadow-card)] sm:px-7">
                <div className="flex items-center justify-between border-b border-border/70 py-5">
                  <span className="text-xs font-semibold text-muted-foreground">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</span>
                  <span className="text-[11px] text-muted-foreground">{selectedData.ayahs.length} آية</span>
                </div>
                {selectedData.ayahs.map((ayah) => (
                  <AyahRow
                    key={ayah.numberInSurah}
                    ayah={ayah}
                    tafsir={tafsirData?.ayahs.find((item) => item.numberInSurah === ayah.numberInSurah)}
                    isTafsirOpen={openTafsir.has(ayah.numberInSurah)}
                    isPlaying={playingAyah === ayah.numberInSurah}
                    onToggleTafsir={() =>
                      setOpenTafsir((current) => {
                        const next = new Set(current);
                        if (next.has(ayah.numberInSurah)) next.delete(ayah.numberInSurah);
                        else next.add(ayah.numberInSurah);
                        return next;
                      })
                    }
                    onPlay={() => toggleAudio(ayah.numberInSurah)}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-card px-6 py-14 text-center" data-testid="status-reader-empty">
                <BookOpen className="mx-auto size-8 text-primary" />
                <p className="mt-4 font-[var(--app-font-serif)] text-2xl">اختر سورة للبدء</p>
              </div>
            )}

            <footer className="mt-10 flex flex-wrap items-center justify-between gap-x-5 gap-y-3 border-t border-border/60 px-1 pt-5 text-xs leading-6 text-muted-foreground">
              <span className="flex items-center gap-2"><BookOpen className="size-3.5 text-primary" /> الآيات والتفسير والتلاوة عبر Quran Cloud</span>
              <span className="font-semibold text-foreground/75">إعداد وتطوير: وِرد</span>
              <span className="w-full text-[11px] text-muted-foreground/85">
                فريق العمل: هند النجدي، تاليا الزهراني، نرمين القارحي، غلا الجحدلي، حلا الثقفي، جود الزهراني، ماريه القرني، بشرى محمد
              </span>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}