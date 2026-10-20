# React Native / Expo (experimental native example)

The browser datepicker cannot run in React Native because it requires the DOM.
This example is a **separate native calendar component** built from React
Native Modal, View, Pressable and Text. It imports only the DOM-free
date/locale helpers from @fidatech/afghan-datepicker/core.

Start from an existing React Native TypeScript or Expo TypeScript app.

1. Build this repository: npm install && npm run build && npm pack.
2. In your RN/Expo project, install the generated .tgz file:
   npm install /absolute/path/fidatech-afghan-datepicker-0.3.0-beta.1.tgz
3. Copy AfghanNativeDatepicker.tsx to your project's components directory.
4. Import and use it:

~~~tsx
import React, { useState } from 'react';
import { View } from 'react-native';
import { AfghanNativeDatepicker } from './components/AfghanNativeDatepicker';

export default function App() {
  const [date, setDate] = useState<string | null>(null);
  return <View style={{ padding: 20, paddingTop: 70 }}>
    <AfghanNativeDatepicker value={date} onChange={setDate} locale="ps-AF" />
  </View>;
}
~~~

Output is ISO Gregorian YYYY-MM-DD, identical to the web picker. The example
supports Jalali view, full weekday names, month/year selection and a native
modal on iOS/Android.

**Status:** prototype example, not an official npm React Native wrapper.
It has not been tested on an Android emulator or physical iOS device;
verify styling, accessibility, year bounds and mobile OS behaviors first.
For production, consider making a separately versioned, device-tested
@fidatech/afghan-datepicker-native package.

There is no need for react-native-webview; the native UI does not load HTML.
