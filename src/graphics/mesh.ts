import { Renderer } from "./renderer";
import { Vector2, Vector3, Matrix3, Vector4 } from "@math.gl/core";
import { Region, UVGenerator } from "./uv_generator";

export class Vertex {
    public position: Vector3;
    public normal: Vector3;
    public tangent: Vector3;
    public uv: Vector2;
    public color: Vector4;
    
    constructor(position: Vector3, normal: Vector3, uv: Vector2, tangent?: Vector3, color?: Vector4) {
        this.position = position;
        this.normal = normal;
        this.uv = uv;
        this.tangent = tangent || new Vector3(1, 0, 0);
        this.color = color || new Vector4(1, 1, 1, 1);
    }

    public static Size(): number { return (3 + 3 + 2 + 3 + 4) * 4; }

    public copy(): Vertex {
        return new Vertex(this.position.clone(), this.normal.clone(), this.uv.clone(), this.tangent.clone(), this.color.clone());
    }

    public toArray(): number[] {
        return [
            this.position.x, this.position.y, this.position.z,
            this.normal.x, this.normal.y, this.normal.z,
            this.uv.x, this.uv.y,
            this.tangent.x, this.tangent.y, this.tangent.z,
            this.color.x, this.color.y, this.color.z, this.color.w
        ];
    }
}

export class Mesh {

    private _vbo: WebGLBuffer;
    private _ibo: WebGLBuffer;
    private _vao: WebGLVertexArrayObject;

    private _vertexCount: number = 0;
    private _indexCount: number = 0;

    constructor() {
        const gl = Renderer.gl;

        this._vbo = gl.createBuffer()!;
        this._ibo = gl.createBuffer()!;
        this._vao = gl.createVertexArray()!;

        gl.bindVertexArray(this._vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, this._vbo);

        gl.enableVertexAttribArray(0);
        gl.enableVertexAttribArray(1);
        gl.enableVertexAttribArray(2);
        gl.enableVertexAttribArray(3);
        gl.enableVertexAttribArray(4);
        
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, Vertex.Size(), 0);
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, Vertex.Size(), 12);
        gl.vertexAttribPointer(2, 2, gl.FLOAT, false, Vertex.Size(), 24);
        gl.vertexAttribPointer(3, 3, gl.FLOAT, false, Vertex.Size(), 32);
        gl.vertexAttribPointer(4, 4, gl.FLOAT, false, Vertex.Size(), 44);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._ibo);

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

        const vertData = new Float32Array(vertices.map(v => v.toArray()).flat());
        const idxData = new Uint16Array(indices);

        if (this._vertexCount <= 0) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this._vbo);
            gl.bufferData(gl.ARRAY_BUFFER, vertData, gl.DYNAMIC_DRAW);
            
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._ibo);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idxData, gl.DYNAMIC_DRAW);

            this._vertexCount = vertices.length;
            this._indexCount = indices.length;
        } else {
            gl.bindBuffer(gl.ARRAY_BUFFER, this._vbo);
            if (this._vertexCount != vertices.length) {
                gl.bufferData(gl.ARRAY_BUFFER, vertData, gl.DYNAMIC_DRAW);
                this._vertexCount = vertices.length;
            } else {
                gl.bufferSubData(gl.ARRAY_BUFFER, 0, vertData);
            }

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._ibo);
            if (this._indexCount != indices.length) {
                gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idxData, gl.DYNAMIC_DRAW);
                this._indexCount = indices.length;
            } else {
                gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0, idxData);
            }
        }
    }

    public get indexCount(): number {
        return this._indexCount;
    }

    private static _defaultQuad?: Mesh;
    public static get defaultQuad(): Mesh {
        if (Mesh._defaultQuad == null) {
            Mesh._defaultQuad = new Mesh();
            Mesh._defaultQuad.update([
                new Vertex(new Vector3(-1, -1, 0), new Vector3(0, 0, 1), new Vector2(0, 0), new Vector3(0, 0, 1)),
                new Vertex(new Vector3(1, -1, 0), new Vector3(0, 0, 1), new Vector2(1, 0), new Vector3(0, 0, 1)),
                new Vertex(new Vector3(1, 1, 0), new Vector3(0, 0, 1), new Vector2(1, 1), new Vector3(0, 0, 1)),
                new Vertex(new Vector3(-1, 1, 0), new Vector3(0, 0, 1), new Vector2(0, 1), new Vector3(0, 0, 1)),
            ], [0, 1, 2, 0, 2, 3]);
        }
        return Mesh._defaultQuad;
    }

}

export enum Axis {
    X,
    Y,
    Z
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

    public addIndices(indices: number[], offset: number = 0): void {
        this._indices.push(...indices.map(i => i + offset));
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

    public addStick(
        size: Vector2,
        length: number,
        rotation: number = 0,
        top?: Region,
        bottom?: Region,
        left?: Region,
        right?: Region,
        front?: Region,
        back?: Region
    ): MeshBuilder {
        const off = this._vertices.length;
        const hs = size.clone().multiplyByScalar(0.5);

        const topUVs = top ? top : UVGenerator.defaultRegion;
        const bottomUVs = bottom ? bottom : UVGenerator.defaultRegion;
        const leftUVs = left ? left : UVGenerator.defaultRegion;
        const rightUVs = right ? right : UVGenerator.defaultRegion;
        const frontUVs = front ? front : UVGenerator.defaultRegion;
        const backUVs = back ? back : UVGenerator.defaultRegion;

        const vertices: Vertex[] = [
            // bottom face
            new Vertex(new Vector3(-hs.x, 0, -hs.y), new Vector3(0, -1, 0), bottomUVs[0]),
            new Vertex(new Vector3(hs.x, 0, -hs.y), new Vector3(0, -1, 0), bottomUVs[1]),
            new Vertex(new Vector3(hs.x, 0, hs.y), new Vector3(0, -1, 0), bottomUVs[2]),
            new Vertex(new Vector3(-hs.x, 0, hs.y), new Vector3(0, -1, 0), bottomUVs[3]),

            // top face
            new Vertex(new Vector3(-hs.x, length, -hs.y), new Vector3(0, 1, 0), topUVs[0]),
            new Vertex(new Vector3(hs.x, length, -hs.y), new Vector3(0, 1, 0), topUVs[1]),
            new Vertex(new Vector3(hs.x, length, hs.y), new Vector3(0, 1, 0), topUVs[2]),
            new Vertex(new Vector3(-hs.x, length, hs.y), new Vector3(0, 1, 0), topUVs[3]),

            // front face
            new Vertex(new Vector3(-hs.x, length, hs.y), new Vector3(0, 0, 1), frontUVs[0]),
            new Vertex(new Vector3(hs.x, length, hs.y), new Vector3(0, 0, 1), frontUVs[1]),
            new Vertex(new Vector3(hs.x, 0, hs.y), new Vector3(0, 0, 1), frontUVs[2]),
            new Vertex(new Vector3(-hs.x, 0, hs.y), new Vector3(0, 0, 1), frontUVs[3]),

            // back face
            new Vertex(new Vector3(-hs.x, 0, -hs.y), new Vector3(0, 0, -1), backUVs[2]),
            new Vertex(new Vector3(hs.x, 0, -hs.y), new Vector3(0, 0, -1), backUVs[3]),
            new Vertex(new Vector3(hs.x, length, -hs.y), new Vector3(0, 0, -1), backUVs[0]),
            new Vertex(new Vector3(-hs.x, length, -hs.y), new Vector3(0, 0, -1), backUVs[1]),

            // left face
            new Vertex(new Vector3(-hs.x, length, -hs.y), new Vector3(-1, 0, 0), leftUVs[0]),
            new Vertex(new Vector3(-hs.x, length, hs.y), new Vector3(-1, 0, 0), leftUVs[1]),
            new Vertex(new Vector3(-hs.x, 0, hs.y), new Vector3(-1, 0, 0), leftUVs[2]),
            new Vertex(new Vector3(-hs.x, 0, -hs.y), new Vector3(-1, 0, 0), leftUVs[3]),

            // right face
            new Vertex(new Vector3(hs.x, length, hs.y), new Vector3(1, 0, 0), rightUVs[0]),
            new Vertex(new Vector3(hs.x, length, -hs.y), new Vector3(1, 0, 0), rightUVs[1]),
            new Vertex(new Vector3(hs.x, 0, -hs.y), new Vector3(1, 0, 0), rightUVs[2]),
            new Vertex(new Vector3(hs.x, 0, hs.y), new Vector3(1, 0, 0), rightUVs[3]),
        ];

        const indices: number[] = [
            2, 1, 0, 0, 3, 2, // bottom face
            4, 5, 6, 4, 6, 7, // top face
            8, 9, 10, 8, 10, 11, // front face
            12, 13, 14, 12, 14, 15, // back face
            16, 17, 18, 16, 18, 19, // left face
            20, 21, 22, 20, 22, 23, // right face
        ];

        const rot = new Matrix3().rotate(rotation);
        for (let i = 0; i < vertices.length; i++) {
            vertices[i].position.transformByMatrix3(rot);
        }

        this.addVertices(vertices);
        for (let i = 0; i < indices.length; i++) {
            indices[i] += off;
        }
        this._indices.push(...indices);

        return this;
    }

    public flipWinding(): MeshBuilder {
        const indices = this._indices.slice();
        this._indices = [];
        for (let i = 0; i < indices.length; i += 3) {
            this._indices.push(indices[i + 2], indices[i + 1], indices[i + 0]);
        }
        return this;
    }

    public recalculateNormals(): MeshBuilder {
        for (let i = 0; i < this._vertices.length; i++) {
            this._vertices[i].normal.set(0, 0, 0);
        }

        for (let i = 0; i < this._indices.length; i += 3) {
            const v1 = this._indices[i + 2];
            const v2 = this._indices[i + 1];
            const v3 = this._indices[i + 0];

            const e1 = this._vertices[v2].position.clone().subtract(this._vertices[v1].position);
            const e2 = this._vertices[v3].position.clone().subtract(this._vertices[v1].position);
            const normal = e1.clone().cross(e2);

            this._vertices[v1].normal.add(normal);
            this._vertices[v2].normal.add(normal);
            this._vertices[v3].normal.add(normal);
        }

        for (let i = 0; i < this._vertices.length; i++) {
            this._vertices[i].normal.normalize();
        }

        return this.recalculateTangents();
    }

    public recalculateTangents(): MeshBuilder {
        for (let i = 0; i < this._vertices.length; i++) {
            this._vertices[i].tangent.set(0, 0, 0);
        }

        for (let i = 0; i < this._indices.length; i += 3) {
            const i1 = this._indices[i + 0];
            const i2 = this._indices[i + 1];
            const i3 = this._indices[i + 2];

            const v0 = this._vertices[i1].position.clone();
            const v1 = this._vertices[i2].position.clone();
            const v2 = this._vertices[i3].position.clone();

            const t0 = this._vertices[i1].uv.clone();
            const t1 = this._vertices[i2].uv.clone();
            const t2 = this._vertices[i3].uv.clone();

            const e0 = v1.clone().subtract(v0);
            const e1 = v2.clone().subtract(v0);

            const dt1 = t1.clone().subtract(t0);
            const dt2 = t2.clone().subtract(t0);

            const dividend = dt1.x * dt2.y - dt1.y * dt2.x;
            const f = dividend === 0 ? 0 : 1 / dividend;

            const tangent = new Vector3(
                (dt2.y * e0.x - dt2.x * e0.y) * f,
                (dt2.y * e0.y - dt2.x * e0.z) * f,
                (dt2.y * e0.z - dt2.x * e0.x) * f
            );

            this._vertices[i1].tangent.add(tangent);
            this._vertices[i2].tangent.add(tangent);
            this._vertices[i3].tangent.add(tangent);
        }

        for (let i = 0; i < this._vertices.length; i++) {
            this._vertices[i].tangent.normalize();
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

    public clear() {
        this._indices = [];
        this._vertices = [];
    }

}