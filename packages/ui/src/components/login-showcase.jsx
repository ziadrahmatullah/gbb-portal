import * as React from 'react';
import { cn } from '../lib/utils.js';

// Konten showcase program GBB di panel kiri halaman login (materi publik
// baikberdampak.org). Gambar diserve dari public/assets/login tiap app.
const DEFAULT_SLIDES = [
    {
        image: '/assets/login/booklet.png',
        href: 'https://drive.google.com/file/d/1_hnaX0YQZWeQOXA9O46sabUT2Dxe-HDx/view?usp=sharing',
        title: 'Booklet Beasiswa Baik Berdampak',
        description:
            'Semua informasi tentang program, alur seleksi, manfaat beasiswa, hingga agenda pembinaan tersedia lengkap dalam satu file yang bisa kamu baca kapan saja.',
    },
    {
        image: '/assets/login/donatur.png',
        href: 'https://baikberdampak.org/wp-content/uploads/2026/08/New-Flyer-Donatur-2026.png',
        title: 'Detail Informasi Untuk Calon Donatur',
        description:
            'Semua yang perlu kamu tahu sebelum mulai berdonasi — tersedia dalam satu tampilan ringkas dan jelas.',
    },
    {
        image: '/assets/login/laporan.png',
        href: 'https://drive.google.com/file/d/14X5BcR-yC9vwdCNFMba-t23T23L03pjV/view?usp=drive_link',
        title: 'Laporan Beasiswa Baik Berdampak #2',
        description:
            'Rangkuman menyeluruh mengenai pelaksanaan program, proses seleksi, manfaat beasiswa, serta kegiatan pembinaan dalam satu laporan yang mudah dipahami.',
    },
];

// Panel kiri login: carousel auto-play (gambar + judul + deskripsi) di atas
// bidang biru brand (secondary #0675ee), dengan dot navigasi di bawah.
function LoginShowcase({ slides = DEFAULT_SLIDES, interval = 6000, className }) {
    const [active, setActive] = React.useState(0);

    React.useEffect(() => {
        if (slides.length <= 1) return;
        const timer = setInterval(() => setActive((i) => (i + 1) % slides.length), interval);
        return () => clearInterval(timer);
    }, [slides.length, interval]);

    return (
        <div className={cn('relative flex h-full flex-col overflow-hidden rounded-2xl bg-secondary text-secondary-foreground ring-4 ring-secondary/25', className)}>
            {/* Latar artistik: gradasi dasar + sapuan gelombang SVG (terang/gelap)
                ala panel referensi — nada gelap memakai #001b3e (on-secondary-container) */}
            <div className='pointer-events-none absolute inset-0 bg-gradient-to-br from-white/12 via-transparent to-black/15' />
            <svg className='pointer-events-none absolute inset-0 h-full w-full' viewBox='0 0 960 960' preserveAspectRatio='xMidYMid slice' aria-hidden='true'>
                <defs>
                    <linearGradient id='ls-light' x1='0' y1='0' x2='1' y2='1'>
                        <stop offset='0%' stopColor='#ffffff' stopOpacity='0.22' />
                        <stop offset='100%' stopColor='#ffffff' stopOpacity='0' />
                    </linearGradient>
                    <linearGradient id='ls-dark' x1='1' y1='0' x2='0' y2='1'>
                        <stop offset='0%' stopColor='#001b3e' stopOpacity='0.4' />
                        <stop offset='100%' stopColor='#001b3e' stopOpacity='0' />
                    </linearGradient>
                    <radialGradient id='ls-glow' cx='0.2' cy='0.1' r='0.9'>
                        <stop offset='0%' stopColor='#ffffff' stopOpacity='0.16' />
                        <stop offset='60%' stopColor='#ffffff' stopOpacity='0' />
                    </radialGradient>
                </defs>
                {/* glow lembut kiri-atas */}
                <rect width='960' height='960' fill='url(#ls-glow)' />
                {/* pita gelombang gelap menyapu dari kanan-atas ke kiri-bawah */}
                <path d='M960 0 C 700 140, 780 420, 520 570 C 320 690, 110 650, 0 790 L 0 960 L 960 960 Z' fill='url(#ls-dark)' />
                {/* pita terang di pojok kiri-atas */}
                <path d='M0 0 L 460 0 C 330 190, 150 280, 0 320 Z' fill='url(#ls-light)' />
                {/* pita terang diagonal bawah */}
                <path d='M960 320 C 770 480, 560 500, 430 660 C 330 790, 330 890, 390 960 L 960 960 Z' fill='url(#ls-light)' opacity='0.55' />
                {/* garis rambut lengkung */}
                <path d='M960 90 C 640 230, 700 530, 420 690 C 240 790, 80 770, 0 870' fill='none' stroke='#ffffff' strokeOpacity='0.18' strokeWidth='1.5' />
                <path d='M960 210 C 680 350, 720 610, 460 750 C 300 840, 160 830, 60 960' fill='none' stroke='#001b3e' strokeOpacity='0.25' strokeWidth='1.5' />
                <path d='M700 0 C 560 160, 300 200, 140 120' fill='none' stroke='#ffffff' strokeOpacity='0.12' strokeWidth='1.5' />
            </svg>

            <div className='relative flex-1'>
                {slides.map((slide, i) => (
                    <div key={i} aria-hidden={i !== active} className={cn('absolute inset-0 flex flex-col items-center justify-center gap-8 px-10 py-12 text-center transition-opacity duration-500', i === active ? 'opacity-100' : 'pointer-events-none opacity-0')}>
                        {/* Gambar klik-able ke materi aslinya (booklet/flyer/laporan) */}
                        <a href={slide.href} target='_blank' rel='noopener noreferrer' tabIndex={i === active ? 0 : -1} title={slide.title} className='w-full max-w-lg transition-transform duration-300 hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-white'>
                            <img src={slide.image} alt={slide.title} className='w-full rounded-xl object-contain drop-shadow-2xl' />
                        </a>
                        <div className='space-y-3'>
                            <h2 className='text-2xl font-bold leading-snug lg:text-3xl'>{slide.title}</h2>
                            <p className='mx-auto max-w-md text-sm leading-relaxed text-secondary-foreground/85 lg:text-base'>{slide.description}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Dot navigasi */}
            <div className='relative flex items-center justify-center gap-2 pb-8'>
                {slides.map((_, i) => (
                    <button key={i} type='button' aria-label={`Slide ${i + 1}`} onClick={() => setActive(i)} className={cn('h-2 rounded-full transition-all duration-300', i === active ? 'w-6 bg-white' : 'w-2 bg-white/40 hover:bg-white/60')} />
                ))}
            </div>
        </div>
    );
}

export { LoginShowcase };
