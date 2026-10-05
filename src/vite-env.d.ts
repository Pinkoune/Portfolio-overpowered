/// <reference types="vite/client" />

declare module 'virtual:content' {
  const content: import('./content/build.ts').Content;
  export default content;
}
