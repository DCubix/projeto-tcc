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
    private _material: Material;

    public constructor(mesh: Mesh, modelMatrix: Matrix4, material?: Material) {
        this._mesh = mesh;
        this._modelMatrix = modelMatrix;
        this._material = material || Material.default;
    }

    public get mesh(): Mesh { return this._mesh; }
    public get modelMatrix(): Matrix4 { return this._modelMatrix; }
    public get material(): Material { return this._material; }

    public applyToShader(shader: Shader): void {
        shader.setUniformMatrix4fv("modelMatrix", this._modelMatrix);

        // material
        shader.setUniform4f("diffuseColor", this._material.diffuseColor);
        if (this._material.hasDiffuseTexture) {
            shader.setUniform1i("diffuseTexture", 0);
            shader.setUniform1f("diffuseIntensity", 1);
            this._material.diffuseTexture!.bind(0);
        } else {
            shader.setUniform1f("diffuseIntensity", 0);
        }

        if (this._material.hasEmissionTexture) {
            shader.setUniform1i("emissionTexture", 1);
            shader.setUniform1f("emissionIntensity", this._material.emissionIntensity);
            this._material.emissionTexture!.bind(1);
        } else {
            shader.setUniform1f("emissionIntensity", 0);
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
        gl.cullFace(gl.BACK);
        gl.frontFace(gl.CCW);
        gl.clearColor(0, 0, 0, 1);
        gl.clearDepth(1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        this._viewMatrix = new Matrix4().identity();
        this._projectionMatrix = new Matrix4().identity();
        
        this._initMaterialShader();
    }

    public get canvas(): HTMLCanvasElement { return this._canvas; }
    public get aspectRatio(): number { return this._canvas.width / this._canvas.height; }

    public queueRenderable(mesh: Mesh, modelMatrix: Matrix4, material?: Material): void {
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

    public render(backColor: Vector3): void {
        const gl = Renderer.gl;
        gl.clearColor(backColor.x, backColor.y, backColor.z, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        this._materialShader?.bind();

        this._materialShader?.setUniformMatrix4fv("viewMatrix", this._viewMatrix);
        this._materialShader?.setUniformMatrix4fv("projectionMatrix", this._projectionMatrix);

        for (const light of this._lights) {
            light.applyToShader(this._lights.indexOf(light), this._materialShader!);
        }

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
            v_position = vec3(modelViewMatrix * vec4(a_position, 1.0));
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

        in vec3 v_normal;
        in vec3 v_position;
        in vec2 v_uv;

        void main() {
            vec4 diffuse = diffuseColor;
            vec3 emission = vec3(0, 0, 0);

            if (diffuseIntensity > 0.0) {
                diffuse *= texture(diffuseTexture, v_uv);
            }

            if (emissionIntensity > 0.0) {
                emission = texture(emissionTexture, v_uv).rgb * emissionIntensity;
            }

            // skip lighting if emission luma is equals or greater than 1.0
            if (dot(emission, vec3(0.2126, 0.7152, 0.0722)) >= 1.0) {
                fragColor = diffuse;
                return;
            }

            vec3 N = normalize(v_normal);

            vec3 lighting = vec3(0, 0, 0);
            for (int i = 0; i < numLights; i++) {
                Light light = lights[i];
                if (light.intensity <= 0.0) {
                    continue;
                }

                if (light.type == 0) {
                    vec3 L = normalize(light.position);
                    vec3 E = normalize(-v_position);

                    float diffuseFactor = max(dot(N, L), 0.0);
                    lighting += light.color * diffuseFactor * light.intensity;
                } else if (light.type == 1) {
                    vec3 Lv = light.position - v_position;
                    vec3 L = normalize(Lv);
                    vec3 E = normalize(-v_position);
                    float dist = length(Lv);

                    if (dist > light.radius) {
                        discard;
                    } else {
                        float diffuseFactor = max(dot(N, L), 0.0);
                        float attenuation = 1.0 / (light.radius * light.radius);
                        attenuation *= (light.radius * light.radius) / (dist * dist);
                        lighting += light.color * diffuseFactor * attenuation * light.intensity;
                    }
                }
            }

            fragColor = (diffuse * vec4(lighting, 1.0)) + vec4(emission, 0.0);
        }
        `;

        this._materialShader = new Shader(vs, fs);
    }

}