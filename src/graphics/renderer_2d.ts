import { Matrix4, Vector2, Vector3, Vector4 } from "@math.gl/core";
import { Texture2D } from "./texture";
import { Mesh, MeshBuilder, Vertex } from "./mesh";
import { Shader } from "./shader";
import { Renderer } from "./renderer";

import default2d_vert from "../shaders/default2d.vs";
import default2d_frag from "../shaders/default2d.fs";
import { Font } from "./font";

type Batch = {
    offset: number
    indicesCount: number
    texture: Texture2D
};

type Shape = {
    vertices: Vertex[]
    indices: number[]
    texture: Texture2D
}

export class Renderer2D {

    private _mesh: Mesh;

    private _batches: Batch[] = [];
    private _shapes: Shape[] = [];

    private _width: number;
    private _height: number;

    private _shader: Shader;

    private _projectionMatrix: Matrix4;

    constructor(width: number, height: number) {
        this._width = width;
        this._height = height;
        this._mesh = new Mesh();
        this._shader = new Shader(default2d_vert, default2d_frag);
        this._projectionMatrix = new Matrix4().ortho({ left: 0, right: width, bottom: height, top: 0, near: -1, far: 1 });
    }

    public draw(texture: Texture2D, position: Vector2, scale: Vector2, uv: Vector4, zIndex: number = 0, color?: Vector4) {
        const dst = new Vector4(
            position.x, position.y,
            texture.width * scale.x * uv.z, texture.height * scale.y * uv.w
        );
        const shp = {
            vertices: [
                new Vertex(new Vector3(dst.x, dst.y, zIndex), new Vector3(0, 0, 1), new Vector2(uv.x, uv.y), undefined, color),
                new Vertex(new Vector3(dst.x + dst.z, dst.y, zIndex), new Vector3(0, 0, 1), new Vector2(uv.x + uv.z, uv.y), undefined, color),
                new Vertex(new Vector3(dst.x + dst.z, dst.y + dst.w, zIndex), new Vector3(0, 0, 1), new Vector2(uv.x + uv.z, uv.y + uv.w), undefined, color),
                new Vertex(new Vector3(dst.x, dst.y + dst.w, zIndex), new Vector3(0, 0, 1), new Vector2(uv.x, uv.y + uv.w), undefined, color)
            ],
            indices: [
                0, 1, 2,
                2, 3, 0
            ],
            texture: texture
        } as Shape;
        this._shapes.push(shp);
    }

    public drawChar(font: Font, char: string, x: number, y: number, color?: Vector4, scale?: number): number {
        const ch = font.getChar(char);
        const sc = (scale || 1.0);
        if (!ch) return 20 * sc;
        this.draw(font.texture, new Vector2(x, y - ((ch.bounds[3] - ch.descent) * sc)), new Vector2(sc, sc), new Vector4(ch.boundsNormalized), 0, color);
        return ch.advance * sc;
    }

    public drawText(font: Font, text: string, x: number, y: number, color?: Vector4, scale?: number) {
        let tx = x;
        let ty = y;
        for (let i = 0; i < text.length; i++) {
            const ch = text.charAt(i);
            if (ch == '\n') {
                ty += 42 * (scale ?? 1);
                tx = x;
            } else {
                tx += this.drawChar(font, ch, tx, ty, color, scale);
            }
        }
    }

    public render() {
        this.updateBuffer();

        const gl = Renderer.gl;
        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        this._shader.bind();
        this._shader.setUniform('u_projectionMatrix', this._projectionMatrix);
        
        this._mesh.bind();

        for (let b of this._batches) {
            b.texture.bind(0);
            this._shader.setUniformInt('u_tex', 0);

            gl.drawElements(gl.TRIANGLES, b.indicesCount, gl.UNSIGNED_SHORT, b.offset);

            b.texture.unbind();
        }

        this._mesh.unbind();
        this._shader.unbind();

        this._batches = [];
        this._shapes = [];

        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.disable(gl.BLEND);
    }

    private updateBuffer() {
        if (this._shapes.length === 0) return;

        const mb = new MeshBuilder();
        this._shapes.sort((a, b) => a.texture.id != b.texture.id ? -1 : 1);
        
        let vertexOffset = 0;
        const first = this._shapes[0];
        mb.addIndices(first.indices, 0);
        vertexOffset += mb.addVertices(first.vertices);
        
        this._batches.push({
            offset: 0,
            texture: first.texture,
            indicesCount: first.indices.length
        } as Batch);
        
        let offset = 0;
        for (let i = 1; i < this._shapes.length; i++) {
            let a = this._shapes[i];
            let b = this._shapes[i - 1];
            let za = a.vertices.length == 0 ? 0 : a.vertices[0].position.z;
            let zb = b.vertices.length == 0 ? 0 : b.vertices[0].position.z;
            if (a.texture.id != b.texture.id || za != zb) {
                offset += this._batches[this._batches.length - 1].indicesCount;
                this._batches.push({
                    offset: offset,
                    texture: a.texture,
                    indicesCount: a.indices.length
                } as Batch);
            } else {
                this._batches[this._batches.length - 1].indicesCount += a.indices.length;
            }

            mb.addIndices(a.indices, vertexOffset);
            vertexOffset += mb.addVertices(a.vertices);
        }

        const [ verts, inds ] = mb.buildData();
        this._mesh.update(verts, inds);
    }

}
