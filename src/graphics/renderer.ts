import { Matrix4, Vector3 } from "@math.gl/core";
import { Light } from "./light";
import { Mesh } from "./mesh";
import { RenderPass } from "./pass";
import { FinalPass } from "./passes/final_pass";
import { GBufferPass } from "./passes/gbuffer_pass";
import { LightingPass } from "./passes/lighting_pass";
import { Shader } from "./shader";
import { Texture2D } from "./texture";

export class Material {
    public diffuseColor: Vector3 = new Vector3(1, 1, 1);

    public diffuseTexture: Texture2D | null = null;
    public emissionTexture: Texture2D | null = null;
    public emissionIntensity: number = 0;

    public get hasDiffuseTexture(): boolean { return this.diffuseTexture !== null; }
    public get hasEmissionTexture(): boolean { return this.emissionTexture !== null; }
    
    private static _default?: Material;
    public static get default(): Material {
        if (Material._default === undefined) {
            Material._default = new Material();
        }
        return Material._default;
    }
}

export class Renderable {
    private _mesh: Mesh;
    private _modelMatrix: Matrix4;
    private _material: Material | null = null;

    public constructor(mesh: Mesh, modelMatrix: Matrix4, material?: Material | null) {
        this._mesh = mesh;
        this._modelMatrix = modelMatrix;
        this._material = material || Material.default;
    }

    public get mesh(): Mesh { return this._mesh; }
    public get modelMatrix(): Matrix4 { return this._modelMatrix; }
    public get material(): Material { return this._material || Material.default; }

    public applyToShader(shader: Shader): void {
        shader.setUniform("u_modelMatrix", this._modelMatrix);

        // material
        shader.setUniform("u_diffuseColor", this.material.diffuseColor);
        if (this.material.hasDiffuseTexture) {
            shader.setUniformInt("u_diffuseTexture", 0);
            shader.setUniformInt("u_useDiffuseTexture", 1);
            this.material.diffuseTexture!.bind(0);
        } else {
            shader.setUniformInt("u_useDiffuseTexture", 0);
        }

        if (this.material.hasEmissionTexture) {
            shader.setUniformInt("u_emissionTexture", 1);
            shader.setUniformInt("u_useEmissionTexture", this.material.emissionIntensity);
            this.material.emissionTexture!.bind(1);
        } else {
            shader.setUniformInt("u_useEmissionTexture", 0);
        }
    }
}

export class Renderer {

    private static _gl: WebGL2RenderingContext;
    public static get gl(): WebGL2RenderingContext { return Renderer._gl; }

    private _canvas: HTMLCanvasElement;

    private _renderables: Renderable[] = [];
    private _lights: Light[] = [];

    private _viewMatrix: Matrix4;
    private _projectionMatrix: Matrix4;

    private _passes: { [key: string]: RenderPass } = {};

    public ambientColor: Vector3 = new Vector3(0, 0, 0);

    public get viewMatrix(): Matrix4 { return this._viewMatrix; }
    public get projectionMatrix(): Matrix4 { return this._projectionMatrix; }

    public get renderables(): Renderable[] { return this._renderables; }
    public get lights(): Light[] { return this._lights; }

    constructor(canvas: HTMLCanvasElement) {
        this._canvas = canvas;

        const gl = this._canvas.getContext("webgl2", {
            antialias: false,
            depth: true,
            stencil: true,
            alpha: false,
            premultipliedAlpha: false,
        }) as WebGL2RenderingContext;
        if (gl === null) {
            throw new Error("WebGL2 is not supported");
        }
        Renderer._gl = gl;

        // try to enable EXT_color_buffer_float
        gl.getExtension("EXT_color_buffer_float");

        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.cullFace(gl.BACK);
        gl.frontFace(gl.CW);
        gl.clearColor(0, 0, 0, 1);
        gl.clearDepth(1);
        gl.depthFunc(gl.LEQUAL);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        this._viewMatrix = new Matrix4().identity();
        this._projectionMatrix = new Matrix4().identity();

        this.addPass("gbuffer", new GBufferPass(this.canvas.width/2, this.canvas.height/2));
        this.addPass("lighting", new LightingPass(this.canvas.width/2, this.canvas.height/2));
        this.addPass("final", new FinalPass());
    }

    public get canvas(): HTMLCanvasElement { return this._canvas; }
    public get aspectRatio(): number { return this._canvas.width / this._canvas.height; }

    public queueRenderable(mesh: Mesh, modelMatrix: Matrix4, material?: Material | null): void {
        this._renderables.push(new Renderable(mesh, modelMatrix, material));
    }

    public queueLight(light: Light): void {
        if (this._lights.length >= 32) {
            this._lights.shift();
        }
        this._lights.push(light);
    }

    public setCamera(viewMatrix: Matrix4, projectionMatrix: Matrix4): void {
        this._viewMatrix = viewMatrix;
        this._projectionMatrix = projectionMatrix;
    }

    public addPass(name: string, pass: RenderPass): void {
        this._passes[name] = pass;
    }

    public getPass(name: string): RenderPass | undefined {
        return this._passes[name];
    }

    public render(): void {
        for (const pass of Object.values(this._passes)) {
            pass.render(this);
        }
    }

    // private passDrawGBuffer(backColor: Vector3): void {
    //     const gl = Renderer.gl;

    //     this._rtScreen.bind();
    //     gl.viewport(0, 0, this._rtScreen.width, this._rtScreen.height);

    //     gl.clearColor(backColor.x, backColor.y, backColor.z, 1);
    //     gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //     this._materialShader?.bind();

    //     this._materialShader?.setUniform("viewMatrix", this._viewMatrix);
    //     this._materialShader?.setUniform("projectionMatrix", this._projectionMatrix);

    //     this._materialShader?.setUniform("ambientColor", ambientColor);
    //     for (const light of this._lights) {
    //         light.applyToShader(this._lights.indexOf(light), this._materialShader!);
    //     }
    //     this._materialShader?.setUniformInt("numLights", this._lights.length);

    //     for (const ren of this._renderables) {
    //         ren.applyToShader(this._materialShader!);
            
    //         ren.mesh.bind();
    //         gl.drawElements(gl.TRIANGLES, ren.mesh.indexCount, gl.UNSIGNED_SHORT, 0);
    //     }

    //     this._materialShader?.unbind();
    //     this._renderables = [];
    //     this._lights = [];

    //     this._rtScreen.unbind();
    // }

    // private _initMaterialShader(): void {
    //     const vs = `#version 300 es
    //     precision mediump float;

    //     layout (location=0) in vec3 a_position;
    //     layout (location=1) in vec3 a_normal;
    //     layout (location=2) in vec2 a_uv;

    //     uniform mat4 modelMatrix;
    //     uniform mat4 viewMatrix;
    //     uniform mat4 projectionMatrix;

    //     out vec3 v_normal;
    //     out vec3 v_position;
    //     out vec2 v_uv;

    //     void main() {
    //         mat4 modelViewMatrix = viewMatrix * modelMatrix;
    //         gl_Position = projectionMatrix * modelViewMatrix * vec4(a_position, 1.0);
    //         v_normal = normalize((modelMatrix * vec4(a_normal, 0.0)).xyz);
    //         v_position = vec3(modelMatrix * vec4(a_position, 1.0));
    //         v_uv = a_uv;
    //     }
    //     `;

    //     const fs = `#version 300 es
    //     precision highp float;

    //     out vec4 fragColor;

    //     struct Light {
    //         vec3 position;
    //         vec3 color;
    //         float intensity;
    //         float radius; // in world units
    //         int type; // 0: directional, 1: point
    //     };

    //     uniform vec4 diffuseColor;
    //     uniform sampler2D diffuseTexture;
    //     uniform sampler2D emissionTexture;
        
    //     uniform float diffuseIntensity;
    //     uniform float emissionIntensity;

    //     // max 32 lights
    //     uniform Light lights[32];
    //     uniform int numLights;

    //     uniform vec3 ambientColor;

    //     in vec3 v_normal;
    //     in vec3 v_position;
    //     in vec2 v_uv;

    //     float sqr2(float x) {
    //         return x * x;
    //     }

    //     void main() {
    //         vec4 diffuse = diffuseColor;
    //         vec3 emission = vec3(0, 0, 0);

    //         if (diffuseIntensity > 0.0) {
    //             diffuse *= texture(diffuseTexture, v_uv);
    //         }

    //         if (emissionIntensity > 0.0) {
    //             emission = texture(emissionTexture, v_uv).rgb;
    //         }

    //         // skip lighting if emission luma is equals or greater than 1.0
    //         if (dot(emission, vec3(0.2126, 0.7152, 0.0722)) >= 1.0) {
    //             fragColor = diffuse;
    //             return;
    //         }

    //         vec3 N = normalize(v_normal);

    //         vec3 lighting = ambientColor;
    //         for (int i = 0; i < numLights; i++) {
    //             Light light = lights[i];
    //             if (light.intensity <= 0.0) {
    //                 continue;
    //             }

    //             vec3 L = vec3(0.0);
    //             float att = 1.0;
    //             vec3 Lp = light.position;

    //             if (light.type == 0) {
    //                 L = normalize(-light.position);
    //             } else if (light.type == 1) {
    //                 L = light.position - v_position;
    //                 float dist = length(L);
    //                 L = normalize(L);

    //                 if (dist < light.radius) {
    //                     att = sqr2(clamp(1.0 - dist / light.radius, 0.0, 1.0));
    //                 } else {
    //                     att = 0.0;
    //                 }
    //             }

    //             float NoL = max(dot(N, L), 0.0);
    //             if (att > 0.0) {
    //                 float fact = NoL * att;
    //                 lighting += light.color * light.intensity * fact;
    //             }
    //         }

    //         fragColor = ((diffuse * vec4(lighting, 1.0)) + vec4(emission, 0.0));// * 0.0 + vec4(N * 0.5 + 0.5, 1.0);
    //     }
    //     `;

    //     this._materialShader = new Shader(vs, fs);
    // }

    // private _initPostFXPalettizeShader(): void {
    //     const vs = `#version 300 es
    //     precision mediump float;

    //     layout (location=0) in vec3 a_position;
    //     layout (location=1) in vec3 a_normal;
    //     layout (location=2) in vec2 a_uv;

    //     out vec2 v_uv;

    //     void main() {
    //         gl_Position = vec4(a_position, 1.0);
    //         v_uv = a_uv;
    //     }`;

    //     const fs = `#version 300 es
    //     precision mediump float;

    //     in vec2 v_uv;
    //     out vec4 fragColor;

    //     const vec3 palette[16] = vec3[16](
    //         vec3(0.027, 0.027, 0.031),
    //         vec3(0.2, 0.133, 0.133),
    //         vec3(0.467, 0.267, 0.2),
    //         vec3(0.8, 0.533, 0.333),
    //         vec3(0.6, 0.2, 0.067),
    //         vec3(0.867, 0.467, 0.067),
    //         vec3(1.0, 0.867, 0.333),
    //         vec3(1.0, 1.0, 0.2),
    //         vec3(0.333, 0.667, 0.267),
    //         vec3(0.067, 0.333, 0.133),
    //         vec3(0.267, 0.933, 0.733),
    //         vec3(0.2, 0.533, 0.867),
    //         vec3(0.333, 0.267, 0.667),
    //         vec3(0.333, 0.333, 0.467),
    //         vec3(0.667, 0.733, 0.733),
    //         vec3(1.0, 1.0, 1.0)
    //     );

    //     float luma(vec3 c) {
    //         return dot(c, vec3(0.2126, 0.7152, 0.0722));
    //     }

    //     float dither4x4(vec2 position, float brightness) {
    //         int x = int(mod(position.x, 4.0));
    //         int y = int(mod(position.y, 4.0));
    //         int index = x + y * 4;
    //         float limit = 0.0;
            
    //         if (x < 8) {
    //             if (index == 0) limit = 0.0625;
    //             if (index == 1) limit = 0.5625;
    //             if (index == 2) limit = 0.1875;
    //             if (index == 3) limit = 0.6875;
    //             if (index == 4) limit = 0.8125;
    //             if (index == 5) limit = 0.3125;
    //             if (index == 6) limit = 0.9375;
    //             if (index == 7) limit = 0.4375;
    //             if (index == 8) limit = 0.25;
    //             if (index == 9) limit = 0.75;
    //             if (index == 10) limit = 0.125;
    //             if (index == 11) limit = 0.625;
    //             if (index == 12) limit = 1.0;
    //             if (index == 13) limit = 0.5;
    //             if (index == 14) limit = 0.875;
    //             if (index == 15) limit = 0.375;
    //         }
            
    //         return brightness < limit ? 0.0 : 1.0;
    //     }
            
    //     vec3 dither4x4(vec2 position, vec3 color) {
    //         return color * dither4x4(position, luma(color));
    //     }

    //     uniform sampler2D sourceTexture;
    //     uniform vec2 resolution;

    //     vec3 nearestColor(vec3 color) {
    //         float minDist = 9.0;
    //         vec3 nearestColor = vec3(0.0);
    //         for (int i = 0; i < 16; i++) {
    //             float dist = distance(color, palette[i]);
    //             if (dist < minDist) {
    //                 minDist = dist;
    //                 nearestColor = palette[i];
    //             }
    //         }
    //         return nearestColor;
    //     }

    //     const float inv255 = 1.0 / 255.0;
        
    //     void main() {
    //         vec2 fragCoord = v_uv * resolution;
    //         vec4 source = texture(sourceTexture, v_uv);

    //         ivec3 rgb565 = ivec3(floor(source.rgb * 255.0));
    //         rgb565.rb = (rgb565.rb >> 3) << 3;
    //         rgb565.g = (rgb565.g >> 2) << 2;

    //         source.rgb = vec3(rgb565) * inv255;
            
    //         dither4x4(fragCoord, source.rgb);
    //         //vec3 dsource = dither4x4(fragCoord, source.rgb);
    //         //dsource.rgb = nearestColor(dsource.rgb);

    //         fragColor = vec4(source.rgb, 1.0);
    //     }
    //     `;

    //     this._postfxPalettize = new Shader(vs, fs);
    // }

}