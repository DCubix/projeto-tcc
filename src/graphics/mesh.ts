import { Renderer } from "./renderer";
import { Vector2, Vector3, Matrix4 } from "@math.gl/core";

export class Vertex {
    public position: Vector3;
    public normal: Vector3;
    public uv: Vector2;
    
    constructor(position: Vector3, normal: Vector3, uv: Vector2) {
        this.position = position;
        this.normal = normal;
        this.uv = uv;
    }

    public static Size(): number { return (3 + 3 + 2) * 4; }

    public copy(): Vertex {
        return new Vertex(this.position.clone(), this.normal.clone(), this.uv.clone());
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
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(Vertex.Size() * 4), gl.DYNAMIC_DRAW);

        gl.enableVertexAttribArray(0);
        gl.enableVertexAttribArray(1);
        gl.enableVertexAttribArray(2);
        
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, Vertex.Size(), 0);
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, Vertex.Size(), 3 * 4);
        gl.vertexAttribPointer(2, 2, gl.FLOAT, false, Vertex.Size(), (3 + 3) * 4);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._ibo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([]), gl.DYNAMIC_DRAW);
        gl.bindVertexArray(null);
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

    public addVertices(vertices: Vertex[]): number {
        this._vertices.push(...vertices);
        return vertices.length;
    }

    public addIndex(index: number): void {
        this._indices.push(index);
    }

    public addTriangle(a: number, b: number, c: number): void {
        this.addIndex(a);
        this.addIndex(b);
        this.addIndex(c);
    }

    public addTriangleOffset(offset: number, a: number, b: number, c: number): void {
        this.addIndex(a + offset);
        this.addIndex(b + offset);
        this.addIndex(c + offset);
    }

    public recalculateNormals(): MeshBuilder {
        const normals: Vector3[] = [];
        for (let i = 0; i < this._vertices.length; i++) {
            normals.push(new Vector3(0, 0, 0));
        }

        for (let i = 0; i < this._indices.length; i += 3) {
            const a = this._indices[i];
            const b = this._indices[i + 1];
            const c = this._indices[i + 2];

            const v1 = this._vertices[b].position.clone().subtract(this._vertices[a].position);
            const v2 = this._vertices[c].position.clone().subtract(this._vertices[a].position);
            const normal = v1.cross(v2).normalize();

            normals[a].add(normal);
            normals[b].add(normal);
            normals[c].add(normal);
        }

        for (let i = 0; i < this._vertices.length; i++) {
            this._vertices[i].normal = normals[i].normalize();
        }

        return this;
    }

    public originToGeometry(): MeshBuilder {
        const origin = new Vector3(0, 0, 0);

        for (const vertex of this._vertices) {
            origin.add(vertex.position);
        }
        origin.multiplyByScalar(1 / this._vertices.length);

        for (const vertex of this._vertices) {
            vertex.position.subtract(origin);
        }

        return this;
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