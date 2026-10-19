import { AfghanDatepicker } from './datepicker.js';
import * as calendar from './core.js';

/**
 * Script-tag entry point; esbuild bundles this as an IIFE. No global is
 * created by the ESM and CommonJS package entrypoints.
 */
Object.assign(window, {
  AfghanDatepicker,
  AfghanCalendar: calendar
});
