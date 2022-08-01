import { Renderer } from "./renderer";

export class TextureTypeSpec {
    public readonly internalFormat: number;
    public readonly format: number;
    public readonly type: number;

    constructor(internalFormat: number, format: number, type: number) {
        this.internalFormat = internalFormat;
        this.format = format;
        this.type = type;
    }
}

export const TextureType = {
    ColorTexture: new TextureTypeSpec(WebGL2RenderingContext.RGBA, WebGL2RenderingContext.RGBA, WebGL2RenderingContext.UNSIGNED_BYTE),
    DepthTexture: new TextureTypeSpec(WebGL2RenderingContext.DEPTH_COMPONENT, WebGL2RenderingContext.DEPTH_COMPONENT, WebGL2RenderingContext.UNSIGNED_SHORT),
} as const;

export abstract class TextureBase {

    protected _target: number;
    protected _id: WebGLTexture;
    
    constructor(target: number) {
        this._target = target;
        this._id = Renderer.gl.createTexture()!;
    }

    public get id(): WebGLTexture { return this._id; }
    public get target(): number { return this._target; }

}

export class Texture2D extends TextureBase {
    
    private _width: number;
    private _height: number;
    private _type: TextureTypeSpec;

    constructor(width: number, height: number, type: TextureTypeSpec) {
        super(Renderer.gl.TEXTURE_2D);

        this._width = width;
        this._height = height;
        this._type = type;
        
        const gl = Renderer.gl;

        this._id = gl.createTexture()!;
        gl.bindTexture(this._target, this._id);
        gl.texImage2D(this._target, 0, type.internalFormat, this._width, this._width, 0, type.format, type.type, null);

        // mipmaps
        gl.texParameteri(this._target, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
        gl.texParameteri(this._target, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.generateMipmap(this._target);
        
        gl.texParameteri(this._target, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(this._target, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.bindTexture(this._target, null);
    }

    public get width(): number { return this._width; }
    public get height(): number { return this._height; }

    public bind(unit: number): void {
        const gl = Renderer.gl;
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(this._target, this._id);
    }

    public unbind(): void {
        const gl = Renderer.gl;
        gl.bindTexture(this._target, null);
    }

    public update(data: Uint8Array | Uint8ClampedArray): void {
        const gl = Renderer.gl;
        gl.bindTexture(this._target, this._id);
        gl.texSubImage2D(this._target, 0, 0, 0, this._width, this._height, this._type.format, this._type.type, data);
        gl.generateMipmap(this._target);
        gl.bindTexture(this._target, null);
    }

    public updateSub(data: Uint8Array | Uint8ClampedArray, x: number, y: number, width: number, height: number): void {
        const gl = Renderer.gl;
        gl.bindTexture(this._target, this._id);
        gl.texSubImage2D(this._target, 0, x, y, width, height, this._type.format, this._type.type, data);
        gl.generateMipmap(this._target);
        gl.bindTexture(this._target, null);
    }

    private static _default: Texture2D;
    public static get default(): Texture2D {
        if (Texture2D._default == null) {
            Texture2D._default = new Texture2D(1, 1, TextureType.ColorTexture);
            Texture2D._default.update(new Uint8Array([255, 255, 255, 255]));
        }
        return Texture2D._default;
    }

}