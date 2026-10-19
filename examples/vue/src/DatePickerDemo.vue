<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { AfghanDatepicker } from '@fidatech/afghan-datepicker';

const input = ref<HTMLInputElement | null>(null);
const selected = ref<string | null>(null);
let picker: AfghanDatepicker | undefined;

onMounted(() => {
  if (!input.value) return;
  picker = new AfghanDatepicker(input.value, {
    locale: 'ps-AF', calendar: 'jalali', theme: 'light',
    onChange: (iso) => { selected.value = iso; }
  });
});
onBeforeUnmount(() => picker?.destroy());
</script>

<template>
  <main>
    <h1>Afghan Datepicker · Vue 3</h1>
    <label for="invoice_date">Invoice date</label>
    <p><input id="invoice_date" ref="input" name="invoice_date"></p>
    <p>Gregorian ISO: <output>{{ selected ?? '—' }}</output></p>
  </main>
</template>
