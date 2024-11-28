// import triangleVertWGSL from "../shader/triangle.vert.wgsl"
// import triangleFragWGSL from "../shader/red.frag.wgsl"

// console.log(triangleVertWGSL);
// console.log(triangleFragWGSL);

// const canvas = document.querySelector('canvas') as HTMLCanvasElement;
// const adapter = await navigator.gpu.requestAdapter() as GPUAdapter;
// if(!adapter) {
//   throw new Error("GPU not supported");
// }
// const device = await adapter.requestDevice();

// const context = canvas.getContext("webgpu") as GPUCanvasContext;
// const format = navigator.gpu.getPreferredCanvasFormat();
// context.configure({ device, format });

// const code = `
//   @vertex fn vertexMain(@builtin(vertex_index) i : u32) ->
//     @builtin(position) vec4f {
//       const pos = array(vec2f(0, 1), vec2f(-1, -1), vec2f(1, -1));
//       return vec4f(pos[i], 0, 1);
//   }
//   @fragment fn fragmentMain() -> @location(0) vec4f {
//     return vec4f(1, 0, 0, 1);
//   }`;
// const shaderModule = device.createShaderModule({ code });
// const pipeline = device.createRenderPipeline({
//   layout: "auto",
//   vertex: {
//     module: shaderModule,
//     // module: device.createShaderModule({
//     //   code: triangleVertWGSL,
//     // }),
//     entryPoint: "vertexMain",
//   },
//   fragment: {
//     module: shaderModule,
//     // module: device.createShaderModule({
//     //   code: triangleFragWGSL,
//     // }),
//     entryPoint: "fragmentMain",
//     targets: [{ format }],
//   },
// });


import * as fs from 'fs';

function readFileToString(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
      fs.readFile(filePath, 'utf8', (err: any, data: string) => {
          if (err) {
              reject(err);
          } else {
              resolve(data);
          }
      });
  });
}


class WebGPUManager {
  public canvas!: HTMLCanvasElement | null;
  public adapter!: GPUAdapter | null;
  public device!: GPUDevice;
  public context!: GPUCanvasContext;
  public format!: GPUTextureFormat;
  public pipeline!: GPURenderPipeline;
  public is_init_finish: boolean = false;

  constructor() {
    this.init().then(() => {
      console.log('WebGPU initialization complete.');
      if(!this.check()) {
        throw new Error("WebGPU init failed.");
      } else {
        this.is_init_finish = true;
      }
    }).catch((error) => {
      console.error('WebGPU initialization failed:', error);
    });
  }

  private async init() {
    this.canvas = document.querySelector('canvas') as HTMLCanvasElement;
    this.adapter = await navigator.gpu.requestAdapter() as GPUAdapter;
    if(!this.adapter) {
      throw new Error("GPU not supported");
    }
    this.device = await this.adapter.requestDevice();

    this.context = this.canvas.getContext("webgpu") as GPUCanvasContext;
    this.format = navigator.gpu.getPreferredCanvasFormat();

    this.context.configure({ device: this.device, format: this.format });

    const triangleVertWGSL = await readFileToString('./src/shader/triangle.vert.wgsl');
    const triangleFragWGSL = await readFileToString('./src/shader/red.frag.wgsl');

    this.pipeline = this.device.createRenderPipeline({
      layout: 'auto',
      vertex: {
        module: this.device.createShaderModule({
          code: triangleVertWGSL,
        }),
      },
      fragment: {
        module: this.device.createShaderModule({
          code: triangleFragWGSL,
        }),
        targets: [
          {
            format: this.format,
          },
        ],
      },
      primitive: {
        topology: 'triangle-list',
      },
    });
  }

  public check() {
    if(!this.canvas) {
      throw new Error("Canvas not available");
    }
    if(!this.adapter) {
      throw new Error("GPU not supported");
    }
    if(!this.device) {
      throw new Error("GPU device not available");
    }
    if(!this.context) {
      throw new Error("GPU context not available");
    }
    if(!this.format) {
      throw new Error("GPU format not available");
    }
    if(!this.pipeline) {
      throw new Error("GPU pipeline not available");
    }
    return true;
  }
  async waitForInitFinish() {
    while (!this.is_init_finish) {
        await new Promise(resolve => setTimeout(resolve, 100)); // 每隔100毫秒检查一次
    }
  }
}

const webgpu = new WebGPUManager();

export async function render() {
  await webgpu.waitForInitFinish();
  const encoder = webgpu.device.createCommandEncoder({ label: 'our encoder' });
  const textureView = webgpu.context.getCurrentTexture().createView();
  const renderPassDescriptor: GPURenderPassDescriptor = {
    label: 'our basic canvas renderPass',
    colorAttachments: [
        {
            view: textureView,
            clearValue: [0.3, 0.3, 0.3, 1],
            loadOp: 'clear',
            storeOp: 'store',
        },
    ],
  };

  // make a render pass encoder to encode render specific commands
  const pass = encoder.beginRenderPass(renderPassDescriptor);
  pass.setPipeline(webgpu.pipeline);
  pass.draw(3); // call our vertex shader 3 times
  pass.end();

  const commandBuffer = encoder.finish();
  webgpu.device.queue.submit([commandBuffer]);
  // console.log("a frame");
  requestAnimationFrame(render);
}
