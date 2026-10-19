import test from 'node:test';
import assert from 'node:assert/strict';
import { addDays, digits, fromCalendar, getMonthName, isoDate,
  monthLength, parseISO, shiftMonth, toCalendar, weekday } from '../dist/index.js';

test('known Jalali/Gregorian conversion', () => {
  assert.deepEqual(toCalendar('2016-04-11'), {year:1395,month:1,day:23});
  assert.equal(fromCalendar({year:1395,month:1,day:23}), '2016-04-11');
});
test('round trips across month/year boundaries', () => {
  for (const iso of ['2024-02-29','2024-03-20','2025-12-31','2026-10-19']) {
    assert.equal(fromCalendar(toCalendar(iso)),iso);
  }
});
test('strict ISO parsing includes early years', () => {
  assert.deepEqual(parseISO('0099-01-01'), {year:99,month:1,day:1});
  assert.equal(isoDate(99,1,1),'0099-01-01');
  assert.throws(() => parseISO('2025-02-29'),RangeError);
  assert.throws(() => parseISO('2024-2-09'),RangeError);
  assert.throws(() => parseISO('2024-02-31'),RangeError);
});
test('Jalali leap years and invalid dates', () => {
  assert.equal(monthLength(1395,12),30);
  assert.equal(monthLength(1394,12),29);
  assert.throws(() => fromCalendar({year:1394,month:12,day:30}),RangeError);
  assert.equal(monthLength(2024,2,'gregorian'),29);
});
test('UTC weekday and day arithmetic', () => {
  assert.equal(weekday('2024-03-20'),3);
  assert.equal(addDays('2024-02-28',1),'2024-02-29');
  assert.equal(addDays('2024-03-01',-1),'2024-02-29');
  assert.deepEqual(shiftMonth({year:1405,month:1},-1),{year:1404,month:12});
});
test('Pashto/Dari/Iranian Persian month names and digits', () => {
  assert.equal(getMonthName(1,'jalali','ps-AF'),'وری');
  assert.equal(getMonthName(1,'jalali','fa-AF'),'حمل');
  assert.equal(getMonthName(1,'jalali','fa-IR'),'فروردین');
  assert.equal(digits('1405-07-27','persian'),'۱۴۰۵-۰۷-۲۷');
});
