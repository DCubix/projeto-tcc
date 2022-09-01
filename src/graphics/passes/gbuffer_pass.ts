import { RenderPass } from "../pass";
import { RenderTarget } from "../render_target";
import { Shader } from "../shader";
import { TextureFormat } from "../texture";

// import gbuffer shader
import gbuffer_vert from "../../shaders/gbuffer.vs";
import gbuffer_frag from "../../shaders/gbuffer.fs";
import { Renderer } from "../renderer";

export class GBufferPass extends RenderPass {

    private _target: RenderTarget;
    private _shader: Shader;

    public get target(): RenderTarget {
        return this._target;
    }

    public constructor(width: number, height: number) {
        super();
        this._target = new RenderTarget(width, height)
                .addColor(TextureFormat.Rgba8) // color
                .addColor(TextureFormat.Rgb8) // normal
                .addColor(TextureFormat.RgbaF) // position
                .addDepth()
                .build();

        this._shader = new Shader(gbuffer_vert, gbuffer_frag);
    }

    public render(renderer: Renderer): void {
        const gl = Renderer.gl;

        // we need depth testing, culling, and blending
        this.enableAll(gl, gl.DEPTH_TEST, gl.CULL_FACE);
        this.disable(gl, gl.BLEND);

        this._target.bind();
        gl.viewport(0, 0, this._target.width, this._target.height);

        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        this._shader.bind();

        this._shader.setUniform("u_viewMatrix", renderer.viewMatrix);
        this._shader.setUniform("u_projectionMatrix", renderer.projectionMatrix);

        for (const ren of renderer.renderables) {
            ren.applyToShader(this._shader);
            
            ren.mesh.bind();
            gl.drawElements(gl.TRIANGLES, ren.mesh.indexCount, gl.UNSIGNED_SHORT, 0);
            ren.mesh.unbind();
        }

        this._shader?.unbind();
        this._target.unbind();
       
        renderer.renderables.length = 0;

        this.restore(gl);

        // generate mips
        this._target.color(0).generateMipmap();

        // temp: copy _target to framebuffer 0
        // gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
        // gl.viewport(0, 0, renderer.canvas.width, renderer.canvas.height);
        // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // const w = renderer.canvas.width / 2;
        // const h = renderer.canvas.height / 2;

        // this._target.bind(true, 0);

        // gl.readBuffer(gl.COLOR_ATTACHMENT0);
        // gl.blitFramebuffer(
        //     0, 0, this._target.width, this._target.height,
        //     0, 0, w, h,
        //     gl.COLOR_BUFFER_BIT, gl.NEAREST
        // );

        // gl.readBuffer(gl.COLOR_ATTACHMENT1);
        // gl.blitFramebuffer(
        //     0, 0, this._target.width, this._target.height,
        //     w, 0, w * 2, h,
        //     gl.COLOR_BUFFER_BIT, gl.NEAREST
        // );

        // gl.readBuffer(gl.COLOR_ATTACHMENT2);
        // gl.blitFramebuffer(
        //     0, 0, this._target.width, this._target.height,
        //     0, h, w, h * 2,
        //     gl.COLOR_BUFFER_BIT, gl.NEAREST
        // );

    }

}