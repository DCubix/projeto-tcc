import { Renderer } from "./renderer";
import { Texture2D, TextureType } from "./texture";

export enum AttachmentType {
    Color0 = WebGL2RenderingContext.COLOR_ATTACHMENT0,
    Color1 = WebGL2RenderingContext.COLOR_ATTACHMENT1,
    Color2 = WebGL2RenderingContext.COLOR_ATTACHMENT2,
    Color3 = WebGL2RenderingContext.COLOR_ATTACHMENT3,
    Color4 = WebGL2RenderingContext.COLOR_ATTACHMENT4,
    Depth = WebGL2RenderingContext.DEPTH_ATTACHMENT
}

export class RenderTarget {

    private _textures: { [type: number]: Texture2D };
    private _drawBuffers: number[] = [];

    private _fbo?: WebGLFramebuffer;

    private _readOnly: boolean = false;

    private _width: number;
    private _height: number;

    public get width(): number { return this._width; }
    public get height(): number { return this._height; }

    constructor(width: number, height: number) {
        this._textures = {};
        this._width = width;
        this._height = height;

        this.initialize();
    }

    public add(type: AttachmentType): RenderTarget {
        const gl = Renderer.gl;

        const textureType = type == AttachmentType.Depth ? TextureType.DepthTexture : TextureType.ColorTexture;
        const texture = new Texture2D(this._width, this._height, textureType);
        
        this._textures[type] = texture;

        gl.bindFramebuffer(gl.FRAMEBUFFER, this._fbo!);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, type, gl.TEXTURE_2D, texture.id, 0);

        if (type !== AttachmentType.Depth) {
            this._drawBuffers.push(type);
            gl.drawBuffers(this._drawBuffers);
        }

        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
            throw new Error("Framebuffer is not complete");
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        return this;
    }

    public texture(attachment: AttachmentType): Texture2D { return this._textures[attachment]; }

    protected initialize() {
        const gl = Renderer.gl;

        this._fbo = gl.createFramebuffer()!;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this._fbo);
        gl.readBuffer(gl.NONE);
        gl.drawBuffers([gl.NONE]);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    public bind(readOnly: boolean = false, readBuffer?: AttachmentType) {
        this._readOnly = readOnly;
        const gl = Renderer.gl;
        gl.bindFramebuffer(readOnly ? gl.READ_FRAMEBUFFER : gl.FRAMEBUFFER, this._fbo!);
        if (readBuffer) gl.readBuffer(readBuffer);
        else gl.readBuffer(gl.NONE);
    }

    public unbind() {
        const gl = Renderer.gl;
        gl.bindFramebuffer(this._readOnly ? gl.READ_FRAMEBUFFER : gl.FRAMEBUFFER, null);
    }

}