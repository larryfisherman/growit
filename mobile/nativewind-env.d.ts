/// <reference types="nativewind/types" />

// TypeScript 6 rejects a side-effect import it has no declaration for, and the Tailwind
// entry point (App.tsx -> './global.css') is consumed by Metro, not by tsc.
declare module '*.css';
