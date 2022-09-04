import { Renderer } from "./renderer";

let globalTextureID = 1;

export enum TextureFormat {
    SingleComponent = 0,
    Rg8,
    Rgb8,
    Rgba8,
    RgF,
    RgbF,
    RgbaF,
    Depth
}

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

export const TextureType = [
    new TextureTypeSpec(WebGL2RenderingContext.R8, WebGL2RenderingContext.RED, WebGL2RenderingContext.UNSIGNED_BYTE), // SingleComponent
    new TextureTypeSpec(WebGL2RenderingContext.RG8, WebGL2RenderingContext.RG, WebGL2RenderingContext.UNSIGNED_BYTE), // Rg8
    new TextureTypeSpec(WebGL2RenderingContext.RGB8, WebGL2RenderingContext.RGB, WebGL2RenderingContext.UNSIGNED_BYTE), // Rgb8
    new TextureTypeSpec(WebGL2RenderingContext.RGBA8, WebGL2RenderingContext.RGBA, WebGL2RenderingContext.UNSIGNED_BYTE), // Rgba8
    new TextureTypeSpec(WebGL2RenderingContext.RG16F, WebGL2RenderingContext.RG, WebGL2RenderingContext.HALF_FLOAT), // RgF
    new TextureTypeSpec(WebGL2RenderingContext.RGB16F, WebGL2RenderingContext.RGB, WebGL2RenderingContext.HALF_FLOAT), // RgbF
    new TextureTypeSpec(WebGL2RenderingContext.RGBA16F, WebGL2RenderingContext.RGBA, WebGL2RenderingContext.HALF_FLOAT), // RgbaF
    new TextureTypeSpec(WebGL2RenderingContext.DEPTH_COMPONENT16, WebGL2RenderingContext.DEPTH_COMPONENT, WebGL2RenderingContext.UNSIGNED_SHORT) // Depth
] as const;

export abstract class TextureBase {

    protected _target: number;
    protected _id: WebGLTexture;
    protected _internalId: number = 0;
    
    constructor(target: number) {
        this._target = target;
        this._id = Renderer.gl.createTexture()!;
        this._internalId = globalTextureID++;
    }

    public get id(): WebGLTexture { return this._id; }
    public get internalId(): number { return this._internalId; }
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
        
        // gl.texImage2D(this._target, 0, type.internalFormat, this._width, this._width, 0, type.format, type.type, null);
        
        gl.texParameteri(this._target, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(this._target, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        
        gl.texParameteri(this._target, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(this._target, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        
        gl.texStorage2D(this._target, 1, type.internalFormat, width, height);
        
        gl.bindTexture(this._target, null);
    }

    public get width(): number { return this._width; }
    public get height(): number { return this._height; }

    public generateMipmap(): Texture2D {
        const gl = Renderer.gl;
        gl.bindTexture(this._target, this._id);
        gl.texParameteri(this._target, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
        gl.texParameteri(this._target, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.generateMipmap(this._target);
        gl.bindTexture(this._target, null);
        return this;
    }

    public setRepeat(): Texture2D {
        const gl = Renderer.gl;
        gl.bindTexture(this._target, this._id);
        gl.texParameteri(this._target, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(this._target, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.bindTexture(this._target, null);
        return this;
    }

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
            Texture2D._default = new Texture2D(1, 1, TextureType[TextureFormat.Rgba8]).setRepeat();
            Texture2D._default.update(new Uint8Array([255, 255, 255, 255]));
        }
        return Texture2D._default;
    }

}