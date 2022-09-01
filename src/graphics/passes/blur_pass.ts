import { RenderPass } from "../pass";
import { Renderer } from "../renderer";
import { Shader } from "../shader";

import fullScreen_vert from "../../shaders/fullscreen.vs";
import blur_frag from "../../shaders/emit_blur.fs";
import { GBufferPass } from "./gbuffer_pass";
import { LightingPass } from "./lighting_pass";
import { Mesh } from "../mesh";
import { RenderTarget } from "../render_target";
import { Texture2D, TextureFormat } from "../texture";
import { Vector2 } from "@math.gl/core";

export class BlurPass extends RenderPass {

    private _target1: RenderTarget;
    private _target2: RenderTarget;
    private _shader: Shader;
    private _repeatCount: number;

    private _finalTexture?: Texture2D;

    public get finalTexture(): Texture2D { return this._finalTexture!; }

    public constructor(width: number, height: number, repeat: number = 2) {
        super();
        this._target1 = new RenderTarget(width, height)
                .addColor(TextureFormat.Rgb8)
                .build();
        this._target2 = new RenderTarget(width, height)
                .addColor(TextureFormat.Rgb8)
                .build();

        this._shader = new Shader(fullScreen_vert, blur_frag);
        this._repeatCount = repeat > 0 ? repeat : 1;
    }

    public render(renderer: Renderer): void {
        const gl = Renderer.gl;

        const directions = [
            new Vector2(1, 0),
            new Vector2(0, 1),
        ];

        this.disableAll(gl, gl.DEPTH_TEST, gl.CULL_FACE, gl.BLEND);
        
        gl.viewport(0, 0, this._target1.width, this._target1.height);

        let count = this._repeatCount;

        this._shader.bind();

        this._shader.setUniformInt("u_inputTexture", 0);
        this._shader.setUniform("u_resolution", new Vector2(this._target1.width, this._target1.height));
        
        const gbuffer = renderer.getPass("gbuffer")! as GBufferPass;
        Mesh.defaultQuad.bind();

        let index = 0;
        let fbos = [this._target1, this._target2];

        for (let i = 0; i < count; i++) {
            this._shader.setUniform("u_direction", directions[i % 2]);

            const src = index;
            const dst = 1 - index;

            fbos[dst].bind();
            gl.clear(gl.COLOR_BUFFER_BIT);

            const tex = (i == 0) ? gbuffer.target.color(0) : fbos[src].color(0);
            tex.bind(0);

            gl.drawElements(gl.TRIANGLES, Mesh.defaultQuad.indexCount, gl.UNSIGNED_SHORT, 0);

            tex.unbind();
            fbos[dst].color(0).generateMipmap();

            index = 1 - index;
        }

        this._finalTexture = fbos[1 - index].color(0);

        this._shader.unbind();
        this.restore(gl);
        
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

}