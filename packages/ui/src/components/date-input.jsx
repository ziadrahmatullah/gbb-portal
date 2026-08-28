import * as React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '../lib/utils.js';
import { Input } from './input.jsx';
import { Button } from './button.jsx';

// Input tanggal native + tombol kalender eksplisit. Ikon picker bawaan webkit
// disembunyikan (tak terlihat dengan styling Input v4); tombol memanggil
// showPicker() — butuh user gesture, fallback focus untuk browser lama.
function DateInput({ className, disabled, ...props }) {
    const ref = React.useRef(null);
    const openPicker = () => {
        const el = ref.current;
        if (!el) return;
        if (typeof el.showPicker === 'function') {
            try {
                el.showPicker();
            } catch {
                el.focus();
            }
        } else {
            el.focus();
        }
    };
    return (<div className='relative'>
      <Input ref={ref} type='date' disabled={disabled} className={cn('pe-9 [&::-webkit-calendar-picker-indicator]:hidden', className)} {...props}/>
      <Button type='button' variant='ghost' size='icon' tabIndex={-1} disabled={disabled} onClick={openPicker} className='absolute end-1 top-1/2 size-7 -translate-y-1/2 text-muted-foreground hover:text-foreground'>
        <CalendarIcon className='size-4'/>
        <span className='sr-only'>Buka kalender</span>
      </Button>
    </div>);
}
export { DateInput };
