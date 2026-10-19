import { AfghanDatepicker } from '@fidatech/afghan-datepicker';
import '@fidatech/afghan-datepicker/styles.css';

const output = document.querySelector<HTMLOutputElement>('#selected')!;
new AfghanDatepicker('#date', {
  locale: 'ps-AF',
  calendar: 'jalali',
  theme: 'light',
  onChange: (iso) => { output.textContent = iso ?? '—'; }
});
