import { Renderer } from "./renderer";
import { Texture2D, TextureType } from "./texture";

export enum AttachmentType {
    Color = 0,
    Depth
}

export class RenderTarget {

    private _texture?: Texture2D;
    private _fbo?: WebGLFramebuffer;

    private _readOnly: boolean = false;

    constructor(width: number, height: number, type: AttachmentType) {
        let textureType = null;
        switch (type) {
            case AttachmentType.Color: textureType = TextureType.ColorTexture; break;
            case AttachmentType.Depth: textureType = TextureType.DepthTexture; break;
        }

        this._texture = new Texture2D(width, height, textureType);
        this.initialize(type);
    }

    public get texture(): Texture2D { return this._texture!; }

    protected initialize(type: AttachmentType) {
        const gl = Renderer.gl;

        let attachment = 0;
        switch (type) {
            case AttachmentType.Color: attachment = gl.COLOR_ATTACHMENT0; break;
            case AttachmentType.Depth: attachment = gl.DEPTH_ATTACHMENT; break;
        }

        this._fbo = gl.createFramebuffer()!;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this._fbo);
        gl.readBuffer(attachment);
        gl.drawBuffers([attachment]);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, attachment, this._texture!.target, this._texture!.id, 0);
        
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
            throw new Error("Framebuffer is not complete");
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    public bind(readOnly: boolean = false) {
        this._readOnly = readOnly;
        const gl = Renderer.gl;
        gl.bindFramebuffer(readOnly ? gl.READ_FRAMEBUFFER : gl.FRAMEBUFFER, this._fbo!);
    }

    public unbind() {
        const gl = Renderer.gl;
        gl.bindFramebuffer(this._readOnly ? gl.READ_FRAMEBUFFER : gl.FRAMEBUFFER, null);
    }

}