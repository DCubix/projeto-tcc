import { Matrix3, Matrix4, Vector2, Vector3, Vector4 } from "@math.gl/core";
import { Renderer } from "./renderer";

export class Shader {
    private _program: WebGLProgram;

    private _uniforms: { [key: string]: WebGLUniformLocation } = {};
    private _attributes: { [key: string]: number } = {};

    constructor(vertexShaderSource: string, fragmentShaderSource: string) {
        const gl = Renderer.gl;

        const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
        gl.shaderSource(vertexShader, vertexShaderSource);
        gl.compileShader(vertexShader);
        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            throw new Error(gl.getShaderInfoLog(vertexShader)!);
        }

        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
        gl.shaderSource(fragmentShader, fragmentShaderSource);
        gl.compileShader(fragmentShader);
        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
            throw new Error(gl.getShaderInfoLog(fragmentShader)!);
        }

        this._program = gl.createProgram()!;
        gl.attachShader(this._program, vertexShader);
        gl.attachShader(this._program, fragmentShader);
        gl.linkProgram(this._program);
        if (!gl.getProgramParameter(this._program, gl.LINK_STATUS)) {
            throw new Error(gl.getProgramInfoLog(this._program)!);
        } else {
            gl.deleteShader(vertexShader);
            gl.deleteShader(fragmentShader);
        }
    }

    public bind(): void {
        const gl = Renderer.gl;
        gl.useProgram(this._program);
    }

    public unbind(): void {
        const gl = Renderer.gl;
        gl.useProgram(null);
    }

    public getUniformLocation(name: string): WebGLUniformLocation | null {
        const gl = Renderer.gl;
        if (!this._uniforms[name]) {
            const loc = gl.getUniformLocation(this._program, name);
            if (loc == null) {
                return null;
            }
            this._uniforms[name] = loc;
        }
        return this._uniforms[name];
    }

    public getAttributeLocation(name: string): number {
        const gl = Renderer.gl;
        if (!this._attributes[name]) {
            const loc = gl.getAttribLocation(this._program, name);
            if (loc == -1) {
                throw new Error(`Attribute ${name} not found`);
            }
            this._attributes[name] = loc;
        }
        return this._attributes[name];
    }

    public setUniformInt(name: string, value: number): void {
        const gl = Renderer.gl;
        let loc = this.getUniformLocation(name);
        if (loc != null) gl.uniform1i(loc, value);
    }

    public setUniformFloat(name: string, value: number): void {
        const gl = Renderer.gl;
        let loc = this.getUniformLocation(name);
        if (loc != null) gl.uniform1f(loc, value);
    }

    public setUniform(name: string, value: Vector2 | Vector3 | Vector4 | Matrix4): void {
        const gl = Renderer.gl;
        let loc = this.getUniformLocation(name);
        if (loc == null) return;

        if (value instanceof Vector2) {
            gl.uniform2fv(loc, value);
        } else if (value instanceof Vector3) {
            gl.uniform3fv(loc, value);
        } else if (value instanceof Vector4) {
            gl.uniform4fv(loc, value);
        } else if (value instanceof Matrix4) {
            gl.uniformMatrix4fv(loc, false, value);
        } else {
            throw new Error(`Unsupported uniform type ${value}`);
        }
    }

}