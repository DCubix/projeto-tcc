import { Renderer } from "./renderer";
import { Texture2D, TextureFormat, TextureType } from "./texture";

export class RenderTarget {

    private _colorAttachments: Texture2D[] = [];
    private _depthAttachment?: Texture2D;

    private _fbo?: WebGLFramebuffer;

    private _readOnly: boolean = false;

    private _width: number;
    private _height: number;

    public get width(): number { return this._width; }
    public get height(): number { return this._height; }

    constructor(width: number, height: number) {
        this._width = width;
        this._height = height;

        this.initialize();
    }

    public addColor(format: TextureFormat): RenderTarget {
        const textureType = TextureType[format];
        const texture = new Texture2D(this._width, this._height, textureType);

        if (format < 4) {
            texture.generateMipmap();
        }

        this._colorAttachments.push(texture);
        return this;
    }

    public addDepth(): RenderTarget {
        const texture = new Texture2D(this._width, this._height, TextureType[TextureFormat.Depth]);
        this._depthAttachment = texture;
        return this;
    }

    public build(): RenderTarget {
        const gl = Renderer.gl;

        gl.bindFramebuffer(gl.FRAMEBUFFER, this._fbo!);

        const drawBuffers = this._colorAttachments.map((_, i) => gl.COLOR_ATTACHMENT0 + i);
        gl.drawBuffers(drawBuffers);

        let i = 0;
        for (let tex of this._colorAttachments) {
            const attachment = gl.COLOR_ATTACHMENT0 + (i++);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, attachment, gl.TEXTURE_2D, tex.id, 0);
        }

        if (this._depthAttachment) {
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this._depthAttachment.id, 0);
        }

        const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        if (status !== gl.FRAMEBUFFER_COMPLETE) {
            this._check(status);
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        return this;
    }

    public color(attachment: number): Texture2D { return this._colorAttachments[attachment]; }
    public depth(): Texture2D | undefined { return this._depthAttachment; }

    protected initialize() {
        const gl = Renderer.gl;

        this._fbo = gl.createFramebuffer()!;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this._fbo);
        gl.readBuffer(gl.NONE);
        gl.drawBuffers([gl.NONE]);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    public setDrawBuffers(buffers?: boolean[]) {
        const gl = Renderer.gl;

        gl.bindFramebuffer(gl.FRAMEBUFFER, this._fbo!);
        if (buffers === undefined) {
            const drawBuffers = this._colorAttachments.map((_, i) => gl.COLOR_ATTACHMENT0 + i);
            gl.drawBuffers(drawBuffers);
        } else {
            gl.drawBuffers(buffers!.map((v, i) => v ? gl.COLOR_ATTACHMENT0 + i : gl.NONE));
        }
    }

    public bind(readOnly: boolean = false, readBuffer: number = -1) {
        this._readOnly = readOnly;
        const gl = Renderer.gl;
        gl.bindFramebuffer(readOnly ? gl.READ_FRAMEBUFFER : gl.FRAMEBUFFER, this._fbo!);
        if (readBuffer >= 0) gl.readBuffer(gl.COLOR_ATTACHMENT0 + readBuffer);
        else gl.readBuffer(gl.NONE);
    }

    public unbind() {
        const gl = Renderer.gl;
        gl.bindFramebuffer(this._readOnly ? gl.READ_FRAMEBUFFER : gl.FRAMEBUFFER, null);
    }

    private _check(status: number) {
        const gl = Renderer.gl;
        switch (status) {
            case gl.FRAMEBUFFER_COMPLETE: return;
            case gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT: throw new Error("Incomplete attachment");
            case gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT: throw new Error("Missing attachment");
            case gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS: throw new Error("Incomlpete dimensions");
            case gl.FRAMEBUFFER_UNSUPPORTED: throw new Error("Unsupported");
            default: throw new Error("Unknown error");
        }
    }

}