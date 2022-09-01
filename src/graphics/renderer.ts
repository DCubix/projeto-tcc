import { Matrix4, Vector3 } from "@math.gl/core";
import { Light } from "./light";
import { Mesh } from "./mesh";
import { RenderPass } from "./pass";
import { BlurPass } from "./passes/blur_pass";
import { FinalPass } from "./passes/final_pass";
import { GBufferPass } from "./passes/gbuffer_pass";
import { LightingPass } from "./passes/lighting_pass";
import { Renderer2D } from "./renderer_2d";
import { Shader } from "./shader";
import { Texture2D } from "./texture";

export class Material {
    public diffuseColor: Vector3 = new Vector3(1, 1, 1);

    public diffuseTexture: Texture2D | null = null;
    public emissionTexture: Texture2D | null = null;
    public normalTexture: Texture2D | null = null;
    public emissionIntensity: number = 0;

    public get hasDiffuseTexture(): boolean { return this.diffuseTexture !== null; }
    public get hasEmissionTexture(): boolean { return this.emissionTexture !== null; }
    public get hasNormalTexture(): boolean { return this.normalTexture !== null; }
    
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
            shader.setUniformFloat("u_useEmissionTexture", this.material.emissionIntensity);
            this.material.emissionTexture!.bind(1);
        } else {
            shader.setUniformFloat("u_useEmissionTexture", 0);
        }

        if (this.material.hasNormalTexture) {
            shader.setUniformInt("u_normalTexture", 2);
            shader.setUniformInt("u_useNormalMap", 1);
            this.material.normalTexture!.bind(2);
        } else {
            shader.setUniformInt("u_useNormalMap", 0);
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

    private _renderer2d: Renderer2D;

    public ambientColor: Vector3 = new Vector3(0, 0, 0);

    public get viewMatrix(): Matrix4 { return this._viewMatrix; }
    public get projectionMatrix(): Matrix4 { return this._projectionMatrix; }

    public get renderables(): Renderable[] { return this._renderables; }
    public get lights(): Light[] { return this._lights; }

    public get renderer2d(): Renderer2D { return this._renderer2d; }

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
        this._renderer2d = new Renderer2D(this.canvas.width/2, this.canvas.height/2);

        this.addPass("gbuffer", new GBufferPass(this.canvas.width/2, this.canvas.height/2));
        this.addPass("lighting", new LightingPass(this.canvas.width/2, this.canvas.height/2));
        this.addPass("blur", new BlurPass(this.canvas.width/2, this.canvas.height/2, 10));
        this.addPass("final", new FinalPass());
    }

    public get canvas(): HTMLCanvasElement { return this._canvas; }
    public get aspectRatio(): number { return this._canvas.width / this._canvas.height; }

    public queueRenderable(mesh: Mesh, modelMatrix: Matrix4, material?: Material | null): void {
        this._renderables.push(new Renderable(mesh, modelMatrix, material));
    }

    public queueLight(light: Light): void {
        if (this._lights.length >= 64) {
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

        this._renderer2d.render();
    }

}