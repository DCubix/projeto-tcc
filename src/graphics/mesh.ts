import { Mat4 } from "../math/mat4";
import { Vec2 } from "../math/vec2";
import { Vec3 } from "../math/vec3";
import { Renderer } from "./renderer";

export class Vertex {
    public position: Vec3;
    public normal: Vec3;
    public uv: Vec2;
    
    constructor(position: Vec3, normal: Vec3, uv: Vec2) {
        this.position = position;
        this.normal = normal;
        this.uv = uv;
    }

    public static Size(): number { return (3 + 3 + 2) * 4; }

    public copy(): Vertex {
        return new Vertex(this.position.copy(), this.normal.copy(), this.uv.copy());
    }

    public toArray(): number[] {
        return [this.position.x, this.position.y, this.position.z, this.normal.x, this.normal.y, this.normal.z, this.uv.x, this.uv.y];
    }
}

export class Mesh {

    private _vbo: WebGLBuffer;
    private _ibo: WebGLBuffer;
    private _vao: WebGLVertexArrayObject;

    private _dataSize: number = 0;
    private _indexCount: number = 0;

    constructor() {
        const gl = Renderer.gl;

        this._vbo = gl.createBuffer()!;
        this._ibo = gl.createBuffer()!;
        this._vao = gl.createVertexArray()!;

        gl.bindVertexArray(this._vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, this._vbo);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._ibo);
    }

    public bind(): void {
        const gl = Renderer.gl;
        gl.bindVertexArray(this._vao);
    }

    public unbind(): void {
        const gl = Renderer.gl;
        gl.bindVertexArray(null);
    }

    public update(vertices: Vertex[], indices: number[]): void {
        const gl = Renderer.gl;

        const sz = Vertex.Size() * vertices.length + indices.length * 4;
        const vertData = new Float32Array(vertices.map(v => v.toArray()).flat());
        const idxData = new Uint16Array(indices);

        gl.bindBuffer(gl.ARRAY_BUFFER, this._vbo);
        if (this._dataSize != sz) {
            gl.bufferData(gl.ARRAY_BUFFER, vertData, gl.DYNAMIC_DRAW);
        } else {
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, vertData);
        }

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._ibo);
        if (this._dataSize != sz) {
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idxData, gl.DYNAMIC_DRAW);
        } else {
            gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0, idxData);
        }

        this._indexCount = indices.length;
        this._dataSize = sz;
    }

    public get indexCount(): number {
        return this._indexCount;
    }

}

export class MeshBuilder {

    private _vertices: Vertex[] = [];
    private _indices: number[] = [];

    public addVertex(vertex: Vertex): void {
        this._vertices.push(vertex);
    }

    public addIndex(index: number): void {
        this._indices.push(index);
    }

    public addIndexRelative(index: number): void {
        this._indices.push(this._vertices.length + index);
    }

    public addQuad(a: number, b: number, c: number, d: number): void {
        this.addIndex(a);
        this.addIndex(b);
        this.addIndex(c);
        this.addIndex(a);
        this.addIndex(c);
        this.addIndex(d);
    }

    public addQuadRelative(a: number, b: number, c: number, d: number): void {
        this.addIndexRelative(a);
        this.addIndexRelative(b);
        this.addIndexRelative(c);
        this.addIndexRelative(a);
        this.addIndexRelative(c);
        this.addIndexRelative(d);
    }

    public addQuadVertices(size: number, up: Vec3, offset: number, uvs: Vec2[]): void {
        const normal = Vec3.normalize(up);
        const forward = Vec3.cross(normal, new Vec3(0, 1, 0));
        const lookat = Mat4.rotation(forward, normal);

        const positions = [
            Mat4.mulVec3(lookat, new Vec3(-size, -size, offset), 0),
            Mat4.mulVec3(lookat, new Vec3(size, -size, offset), 0),
            Mat4.mulVec3(lookat, new Vec3(size, size, offset), 0),
            Mat4.mulVec3(lookat, new Vec3(-size, size, offset), 0)
        ];

        for (let i = 0; i < 4; i++) {
            this.addVertex(new Vertex(positions[i], normal.copy(), uvs[i]));
        }
    }

    public buildData(): [Vertex[], number[]] {
        return [this._vertices, this._indices];
    }

    public build(): Mesh {
        const mesh = new Mesh();
        mesh.update(this._vertices, this._indices);
        return mesh;
    }

}