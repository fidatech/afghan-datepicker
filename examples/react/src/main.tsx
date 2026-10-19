import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AfghanDatepicker } from '@fidatech/afghan-datepicker';
import '@fidatech/afghan-datepicker/styles.css';

function DateField() {
  const input = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (!input.current) return;
    const picker = new AfghanDatepicker(input.current, {
      locale: 'fa-AF', calendar: 'jalali', theme: 'light',
      onChange: setSelected
    });
    return () => picker.destroy();
  }, []);

  return <main>
    <h1>Afghan Datepicker · React</h1>
    <label htmlFor="invoice_date">Invoice date</label>
    <p><input id="invoice_date" name="invoice_date" ref={input} /></p>
    <p>Gregorian ISO: <output>{selected ?? '—'}</output></p>
  </main>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><DateField /></React.StrictMode>);
