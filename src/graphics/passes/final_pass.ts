import { RenderPass } from "../pass";
import { Renderer } from "../renderer";
import { Shader } from "../shader";

import fullScreen_vert from "../../shaders/fullscreen.vs";
import combine_frag from "../../shaders/combine.fs";
import { GBufferPass } from "./gbuffer_pass";
import { LightingPass } from "./lighting_pass";
import { Mesh } from "../mesh";

export class FinalPass extends RenderPass {

    private _shader: Shader;

    public constructor() {
        super();
        this._shader = new Shader(fullScreen_vert, combine_frag);
    }

    public render(renderer: Renderer): void {
        const gl = Renderer.gl;

        this.disableAll(gl, gl.DEPTH_TEST, gl.CULL_FACE, gl.BLEND);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, renderer.canvas.width, renderer.canvas.height);

        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        this._shader.bind();

        const gbuffer = renderer.getPass("gbuffer")! as GBufferPass;
        const lighting = renderer.getPass("lighting")! as LightingPass;

        gbuffer.target.color(0).bind(0);
        lighting.target.color(0).bind(1);

        this._shader.setUniformInt("u_colorTexture", 0);
        this._shader.setUniformInt("u_lightingTexture", 1);

        Mesh.defaultQuad.bind();
        gl.drawElements(gl.TRIANGLES, Mesh.defaultQuad.indexCount, gl.UNSIGNED_SHORT, 0);

        gl.bindTexture(gl.TEXTURE_2D, null);

        this.restore(gl);

        this._shader.unbind();
    }

}