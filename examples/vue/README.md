# Vue 3 + TypeScript + Vite

From repository root: npm install && npm run build

Then: cd examples/vue && npm install && npm run dev

The component initializes onMounted, uses a ref for the HTML input, and
destroys the picker onBeforeUnmount to prevent event listener leaks.

The file:../.. dependency references a local package build.
