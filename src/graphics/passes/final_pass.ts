import { RenderPass } from "../pass";
import { Renderer } from "../renderer";
import { Shader } from "../shader";

import fullScreen_vert from "../../shaders/fullScreen.vs";
import combine_frag from "../../shaders/combine.fs";
import { GBufferPass } from "./gbuffer_pass";
import { LightingPass } from "./lighting_pass";
import { Mesh } from "../mesh";
import { BlurPass } from "./blur_pass";

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
        const blur = renderer.getPass("blur")! as BlurPass;

        gbuffer.target.color(0).bind(0);
        lighting.target.color(0).bind(1);
        lighting.target.color(1).bind(2); // specular
        blur.finalTexture.bind(3);

        this._shader.setUniformInt("u_colorTexture", 0);
        this._shader.setUniformInt("u_lightingTexture", 1);
        this._shader.setUniformInt("u_specularTexture", 2);
        this._shader.setUniformInt("u_blurTexture", 3);

        Mesh.defaultQuad.bind();
        gl.drawElements(gl.TRIANGLES, Mesh.defaultQuad.indexCount, gl.UNSIGNED_SHORT, 0);

        gl.bindTexture(gl.TEXTURE_2D, null);

        this.restore(gl);

        this._shader.unbind();
    }

}