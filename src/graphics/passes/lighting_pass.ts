import { RenderPass } from "../pass";
import { Renderer } from "../renderer";
import { RenderTarget } from "../render_target";
import { Shader } from "../shader";
import { TextureFormat } from "../texture";

import fullScreen_vert from "../../shaders/fullscreen.vs";
import lighting_frag from "../../shaders/lighting.fs";

import { Vector2, Vector3 } from "@math.gl/core";
import { GBufferPass } from "./gbuffer_pass";
import { Mesh } from "../mesh";

export class LightingPass extends RenderPass {

    private _target: RenderTarget;
    private _shader: Shader;

    public get target(): RenderTarget {
        return this._target;
    }

    public constructor(width: number, height: number) {
        super();
        this._target = new RenderTarget(width, height)
                .addColor(TextureFormat.Rgb8) // color
                .addColor(TextureFormat.SingleComponent) // specular
                .build();

        this._shader = new Shader(fullScreen_vert, lighting_frag);
    }

    public render(renderer: Renderer): void {
        // we need additive blending here
        const gl = Renderer.gl;

        this.enable(gl, gl.BLEND);
        this.disableAll(gl, gl.DEPTH_TEST, gl.CULL_FACE);
        gl.blendFunc(gl.ONE, gl.ONE);

        this._target.bind();
        
        gl.viewport(0, 0, this._target.width, this._target.height);
        gl.clear(gl.COLOR_BUFFER_BIT);

        this._shader.bind();

        this._shader.setUniform("u_ambientColor", renderer.ambientColor);
        this._shader.setUniform("u_eyePosition", new Vector3(renderer.viewMatrix.getTranslation()));

        // this._shader.setUniform("u_resolution", new Vector2(this._target.width, this._target.height));
        
        this._shader.setUniformInt("u_positionTexture", 0);
        this._shader.setUniformInt("u_normalTexture", 1);

        const gbufferPass = renderer.getPass("gbuffer")! as GBufferPass;
        gbufferPass.target.color(2).bind(0);
        gbufferPass.target.color(1).bind(1);

        Mesh.defaultQuad.bind();

        this._shader.setUniformFloat("u_light.intensity", 0.0);
        gl.drawElements(gl.TRIANGLES, Mesh.defaultQuad.indexCount, gl.UNSIGNED_SHORT, 0);
        this._shader.setUniform("u_ambientColor", new Vector3(0, 0, 0));

        for (let light of renderer.lights) {
            light.applyToShader("u_light", this._shader);
            gl.drawElements(gl.TRIANGLES, Mesh.defaultQuad.indexCount, gl.UNSIGNED_SHORT, 0);
        }
        
        this._shader.unbind();
        this._target.unbind();
        gl.bindTexture(gl.TEXTURE_2D, null);

        this.restore(gl);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        renderer.lights.length = 0;

        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
        gl.viewport(0, 0, renderer.canvas.width, renderer.canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        this._target.bind(true, 0);

        gl.readBuffer(gl.COLOR_ATTACHMENT0);
        gl.blitFramebuffer(
            0, 0, this._target.width, this._target.height,
            0, 0, renderer.canvas.width, renderer.canvas.height,
            gl.COLOR_BUFFER_BIT, gl.NEAREST
        );
    }

}