/// <reference types="@webgpu/types" />
/// <reference types="@types/node" />
/// <reference types="vite/client" />

declare module '*.wgsl' {
  const shader: string;
  export default shader;
}