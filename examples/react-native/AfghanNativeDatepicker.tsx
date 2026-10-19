import React, { useMemo, useState } from 'react';
import {
  Modal, Pressable, ScrollView, StyleSheet, Text, View
} from 'react-native';
import {
  digits, fromCalendar, getMonthName, locales, monthLength, shiftMonth,
  toCalendar, todayISO, weekday
} from '@fidatech/afghan-datepicker/core';
import type { Locale, CalendarDate } from '@fidatech/afghan-datepicker/core';

/**
 * Native React Native / Expo modal calendar: uses the DOM-free JavaScript core,
 * not the browser widget. Selected values are Gregorian ISO YYYY-MM-DD.
 * Example implementation; requires native-device testing before production.
 */
type Props = {
  value: string | null;
  onChange: (iso: string | null) => void;
  locale?: Locale;
};

export function AfghanNativeDatepicker({
  value, onChange, locale = 'ps-AF'
}: Props) {
  const [open, setOpen] = useState(false);
  const initial = useMemo(() => toCalendar(value ?? todayISO()), [value]);
  const [view, setView] = useState(initial);
  const [mode, setMode] = useState<'days' | 'months' | 'years'>('days');
  const [yearPage, setYearPage] = useState(Math.floor(initial.year / 12) * 12);
  const rtl = locale !== 'en';
  const rowDirection = rtl ? 'row-reverse' as const : 'row' as const;
  const words = locales[locale];
  const local = (n: number) => digits(n, locale === 'en' ? 'latin' : 'persian');

  function navigate(amount: number) {
    try {
      if (mode === 'days') setView(shiftMonth(view, amount));
      if (mode === 'months') setView({ ...view, year: view.year + amount });
      if (mode === 'years') setYearPage(yearPage + amount * 12);
    } catch { /* Stop at calendar boundaries. */ }
  }

  function chooseDay(day: number) {
    try {
      const iso = fromCalendar({ ...view, day });
      onChange(iso);
      setOpen(false);
    } catch { /* Ignore dates outside supported calendar range. */ }
  }

  function selectYear(year: number) {
    setView({ ...view, year });
    setMode('months');
  }

  function dayCells() {
    let firstWeekday = 6;
    let length = 0;
    try {
      firstWeekday = weekday(fromCalendar({ ...view, day: 1 }));
      length = monthLength(view.year, view.month);
    } catch { return []; }
    const blanks = (firstWeekday + 1) % 7; // Saturday first
    const cells: Array<number | null> = [
      ...Array.from({ length: blanks }, () => null),
      ...Array.from({ length }, (_, i) => i + 1)
    ];
    return cells;
  }

  const dateLabel = value
    ? (() => {
        const d: CalendarDate = toCalendar(value);
        return local(d.day) + ' ' + getMonthName(d.month, 'jalali', locale) + ' ' + local(d.year);
      })()
    : words.chooseDate;

  return <>
    <Pressable style={s.input} onPress={() => {
      const current = toCalendar(value ?? todayISO());
      setView(current);
      setYearPage(Math.floor(current.year / 12) * 12);
      setMode('days');
      setOpen(true);
    }} accessibilityRole="button" accessibilityLabel={words.chooseDate}>
      <Text style={[s.inputText, { textAlign: rtl ? 'right' : 'left' }]}>{dateLabel}</Text>
    </Pressable>
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
      <View style={s.overlay}>
        <View style={s.sheet}>
          <View style={[s.header, { flexDirection: rowDirection }]}>
            <Pressable style={s.chevron} onPress={() => navigate(-1)} accessibilityRole="button"
              accessibilityLabel={words.previousMonth}><Text>‹</Text></Pressable>
            <Pressable onPress={() => setMode('months')} accessibilityRole="button">
              <Text style={s.title}>{getMonthName(view.month, 'jalali', locale)}</Text>
            </Pressable>
            <Pressable onPress={() => {
              setYearPage(Math.floor(view.year / 12) * 12);
              setMode('years');
            }} accessibilityRole="button"><Text style={s.title}>{local(view.year)}</Text></Pressable>
            <Pressable style={s.chevron} onPress={() => navigate(1)} accessibilityRole="button"
              accessibilityLabel={words.nextMonth}><Text>›</Text></Pressable>
          </View>
          <ScrollView style={s.body}>
            {mode === 'days' && <>
              <View style={[s.row, { flexDirection: rowDirection }]}>
                {Array.from({ length: 7 }, (_, i) => {
                  const index = (6 + i) % 7;
                  return <View style={s.dayCell} key={i}>
                    <Text style={s.weekday}>{words.weekdays[index]}</Text>
                  </View>;
                })}
              </View>
              <View style={[s.wrap, { flexDirection: rowDirection }]}>
                {dayCells().map((day, i) => {
                  if (day === null) return <View key={i} style={s.dayCell} />;
                  const iso = fromCalendar({ ...view, day });
                  return <Pressable key={i}
                    onPress={() => chooseDay(day)}
                    style={[s.dayCell, s.day, iso === value && s.selected]}
                    accessibilityRole="button"
                    accessibilityLabel={local(day) + ' ' + getMonthName(view.month, 'jalali', locale)}>
                    <Text style={[s.dayText, iso === value && s.selectedText]}>{local(day)}</Text>
                  </Pressable>;
                })}
              </View>
            </>}
            {mode === 'months' && <View style={[s.wrap, { flexDirection: rowDirection }]}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m =>
                <Pressable key={m} style={s.option} onPress={() => {
                  setView({ ...view, month: m });
                  setMode('days');
                }}>
                  <Text style={s.optionText}>{getMonthName(m, 'jalali', locale)}</Text>
                </Pressable>)}
            </View>}
            {mode === 'years' && <View style={[s.wrap, { flexDirection: rowDirection }]}>
              {Array.from({ length: 12 }, (_, i) => yearPage + i).map(y =>
                <Pressable key={y} style={s.option} onPress={() => selectYear(y)}>
                  <Text style={s.optionText}>{local(y)}</Text>
                </Pressable>)}
            </View>}
          </ScrollView>
          <View style={[s.footer, { flexDirection: rowDirection }]}>
            <Pressable onPress={() => { onChange(null); setOpen(false); }}>
              <Text style={s.action}>{words.clear}</Text>
            </Pressable>
            <Pressable onPress={() => { onChange(todayISO()); setOpen(false); }}>
              <Text style={s.action}>{words.today}</Text>
            </Pressable>
            <Pressable onPress={() => setOpen(false)}>
              <Text style={s.dismiss}>{locale === 'en' ? 'Close' : '×'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  </>;
}

const s = StyleSheet.create({
  input: { minHeight: 48, borderRadius: 10, borderWidth: 1, borderColor: '#ccd8df', padding: 13 },
  inputText: { color: '#102b3f', fontSize: 15 },
  overlay: { flex: 1, backgroundColor: '#0008', justifyContent: 'center', padding: 16 },
  sheet: { backgroundColor: 'white', borderRadius: 16, padding: 16, maxWidth: 440, width: '100%', alignSelf: 'center' },
  header: { alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 8 },
  chevron: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f2f5f7', borderRadius: 8 },
  title: { color: '#102b3f', fontWeight: '700', fontSize: 15 },
  body: { maxHeight: 340 },
  row: { alignItems: 'center' },
  wrap: { flexWrap: 'wrap' },
  dayCell: { width: '14.2857%', alignItems: 'center', justifyContent: 'center', minHeight: 40 },
  weekday: { fontSize: 10, color: '#506475', textAlign: 'center', lineHeight: 13 },
  day: { borderRadius: 9 },
  dayText: { color: '#102b3f', fontSize: 13 },
  selected: { backgroundColor: '#102b3f' },
  selectedText: { color: 'white', fontWeight: '700' },
  option: { width: '33.3333%', minHeight: 52, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f4f7f8', borderWidth: 2, borderColor: 'white', borderRadius: 10 },
  optionText: { fontSize: 12, color: '#102b3f' },
  footer: { justifyContent: 'space-between', paddingTop: 13, gap: 12, borderTopWidth: 1, borderTopColor: '#e1e8ee' },
  action: { color: '#f77700', fontWeight: '700', fontSize: 14 },
  dismiss: { color: '#667783', fontSize: 16 }
});
