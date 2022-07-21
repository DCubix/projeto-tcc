import { Matrix4, Vector3, Vector4 } from "@math.gl/core";
import { Light } from "./light";
import { Mesh } from "./mesh";
import { Shader } from "./shader";
import { Texture2D } from "./texture";

export class Material {
    public diffuseColor: Vector4 = new Vector4(1, 1, 1, 1);

    public diffuseTexture: Texture2D | null = null;
    public emissionTexture: Texture2D | null = null;
    public emissionIntensity: number = 0;

    public get hasDiffuseTexture(): boolean { return this.diffuseTexture !== null; }
    public get hasEmissionTexture(): boolean { return this.emissionTexture !== null; }
    
    private static _default: Material;
    public static get default(): Material {
        if (Material._default === undefined) {
            Material._default = new Material();
        }
        return Material._default;
    }
}

class Renderable {
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
        shader.setUniform("modelMatrix", this._modelMatrix);

        // material
        shader.setUniform("diffuseColor", this.material.diffuseColor);
        if (this.material.hasDiffuseTexture) {
            shader.setUniformInt("diffuseTexture", 0);
            shader.setUniformFloat("diffuseIntensity", 1);
            this.material.diffuseTexture!.bind(0);
        } else {
            shader.setUniformFloat("diffuseIntensity", 0);
        }

        if (this.material.hasEmissionTexture) {
            shader.setUniformInt("emissionTexture", 1);
            shader.setUniformFloat("emissionIntensity", this.material.emissionIntensity);
            this.material.emissionTexture!.bind(1);
        } else {
            shader.setUniformFloat("emissionIntensity", 0);
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

    private _materialShader: Shader | undefined;

    constructor(canvas: HTMLCanvasElement) {
        this._canvas = canvas;

        const gl = this._canvas.getContext("webgl2") as WebGL2RenderingContext;
        if (gl === null) {
            throw new Error("WebGL2 is not supported");
        }
        Renderer._gl = gl;

        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.cullFace(gl.BACK);
        gl.frontFace(gl.CW);
        gl.clearColor(0, 0, 0, 1);
        gl.clearDepth(1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        this._viewMatrix = new Matrix4().identity();
        this._projectionMatrix = new Matrix4().identity();
        
        this._initMaterialShader();
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

    public render(backColor: Vector3, ambientColor: Vector3 = new Vector3(0.1, 0.34, 0.7)): void {
        const gl = Renderer.gl;
        gl.clearColor(backColor.x, backColor.y, backColor.z, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        this._materialShader?.bind();

        this._materialShader?.setUniform("viewMatrix", this._viewMatrix);
        this._materialShader?.setUniform("projectionMatrix", this._projectionMatrix);

        this._materialShader?.setUniform("ambientColor", ambientColor);
        for (const light of this._lights) {
            light.applyToShader(this._lights.indexOf(light), this._materialShader!);
        }
        this._materialShader?.setUniformInt("numLights", this._lights.length);

        for (const ren of this._renderables) {
            ren.applyToShader(this._materialShader!);
            
            ren.mesh.bind();
            gl.drawElements(gl.TRIANGLES, ren.mesh.indexCount, gl.UNSIGNED_SHORT, 0);
        }

        this._materialShader?.unbind();
        this._renderables = [];
        this._lights = [];
    }

    private _initMaterialShader(): void {
        const vs = `#version 300 es
        precision mediump float;

        layout (location=0) in vec3 a_position;
        layout (location=1) in vec3 a_normal;
        layout (location=2) in vec2 a_uv;

        uniform mat4 modelMatrix;
        uniform mat4 viewMatrix;
        uniform mat4 projectionMatrix;

        out vec3 v_normal;
        out vec3 v_position;
        out vec2 v_uv;

        void main() {
            mat4 modelViewMatrix = viewMatrix * modelMatrix;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(a_position, 1.0);
            v_normal = mat3(transpose(inverse(modelViewMatrix))) * a_normal;
            v_position = vec3(modelMatrix * vec4(a_position, 1.0));
            v_uv = a_uv;
        }
        `;

        const fs = `#version 300 es
        precision highp float;

        out vec4 fragColor;

        struct Light {
            vec3 position;
            vec3 color;
            float intensity;
            float radius; // in world units
            int type; // 0: directional, 1: point
        };

        uniform vec4 diffuseColor;
        uniform sampler2D diffuseTexture;
        uniform sampler2D emissionTexture;
        
        uniform float diffuseIntensity;
        uniform float emissionIntensity;

        // max 32 lights
        uniform Light lights[32];
        uniform int numLights;

        uniform vec3 ambientColor;

        in vec3 v_normal;
        in vec3 v_position;
        in vec2 v_uv;

        float sqr2(float x) {
            return x * x;
        }

        void main() {
            vec4 diffuse = diffuseColor;
            vec3 emission = vec3(0, 0, 0);

            vec2 dx = dFdx(v_uv);
            vec2 dy = dFdy(v_uv);

            if (diffuseIntensity > 0.0) {
                diffuse *= textureGrad(diffuseTexture, fract(v_uv), dx, dy);
            }

            if (emissionIntensity > 0.0) {
                emission = textureGrad(emissionTexture, fract(v_uv), dx, dy).rgb;
            }

            // skip lighting if emission luma is equals or greater than 1.0
            if (dot(emission, vec3(0.2126, 0.7152, 0.0722)) >= 1.0) {
                fragColor = diffuse;
                return;
            }

            vec3 N = normalize(v_normal);

            vec3 lighting = ambientColor;
            for (int i = 0; i < numLights; i++) {
                Light light = lights[i];
                if (light.intensity <= 0.0) {
                    continue;
                }

                vec3 L = vec3(0.0);
                float att = 1.0;
                vec3 Lp = light.position;

                if (light.type == 0) {
                    L = normalize(-light.position);
                } else if (light.type == 1) {
                    L = light.position - v_position;
                    float dist = length(L);
                    L = normalize(L);

                    if (dist < light.radius) {
                        att = sqr2(clamp(1.0 - dist / light.radius, 0.0, 1.0));
                    } else {
                        att = 0.0;
                    }
                }

                float NoL = max(dot(N, L), 0.0);
                if (att > 0.0) {
                    float fact = NoL * att;
                    lighting += light.color * light.intensity * fact;
                }
            }

            fragColor = (diffuse * vec4(lighting, 1.0)) + vec4(emission, 0.0);
        }
        `;

        this._materialShader = new Shader(vs, fs);
    }

}