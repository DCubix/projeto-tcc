import { Renderer } from "./renderer";

export class Texture2D {

    private _id: WebGLTexture;

    private _width: number;
    private _height: number;

    constructor(width: number, height: number) {
        const gl = Renderer.gl;
        this._width = width;
        this._height = height;

        this._id = gl.createTexture()!;
        gl.bindTexture(gl.TEXTURE_2D, this._id);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

        // mipmaps
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.generateMipmap(gl.TEXTURE_2D);
        
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    public get id(): WebGLTexture { return this._id; }
    public get width(): number { return this._width; }
    public get height(): number { return this._height; }

    public bind(unit: number): void {
        const gl = Renderer.gl;
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, this._id);
    }

    public unbind(): void {
        const gl = Renderer.gl;
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    public update(data: Uint8Array): void {
        const gl = Renderer.gl;
        gl.bindTexture(gl.TEXTURE_2D, this._id);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, this._width, this._height, gl.RGBA, gl.UNSIGNED_BYTE, data);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    public updateSub(data: Uint8Array, x: number, y: number, width: number, height: number): void {
        const gl = Renderer.gl;
        gl.bindTexture(gl.TEXTURE_2D, this._id);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, x, y, width, height, gl.RGBA, gl.UNSIGNED_BYTE, data);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    private static _default: Texture2D;
    public static get default(): Texture2D {
        if (Texture2D._default == null) {
            Texture2D._default = new Texture2D(1, 1);
            Texture2D._default.update(new Uint8Array([255, 255, 255, 255]));
        }
        return Texture2D._default;
    }

}