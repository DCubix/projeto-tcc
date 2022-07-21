import { Renderer } from "./renderer";
import { Vector2, Vector3, Matrix4, Matrix3, Quaternion } from "@math.gl/core";
import { Region, UVGenerator } from "./uv_generator";

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

    private _vertexCount: number = 0;
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

        const vertData = new Float32Array(vertices.map(v => v.toArray()).flat());
        const idxData = new Uint16Array(indices);

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

    // public addTube(radius: number, length: number): MeshBuilder {
    //     return this;
    // }

    // public eval(expr: string): MeshBuilder {
    //     /**
    //      * Expression parser
    //      * <function> <param> <param> ..., ...
    //      * Functions:
    //      * C = cube
    //      * T = tube
    //      * S = stick
    //      * tp = taper
    //      * tr = translate
    //      * sc = scale
    //      * F = flip winding
    //      * N = recalculate normals
    //      * O = origin to center
    //      */
    //     let cursorPosition = new Vector3(0, 0, 0);
    //     let cursorScale = new Vector3(1, 1, 1);

    //     const statements = expr.split(/[,;]/);
    //     for (let stmt of statements) {
    //         let spl = stmt.split(/\s+/);
    //         // from 1 to end = args
    //         let args = spl.slice(1);
    //         let cmd = spl[0];

    //         switch (cmd) {

    //         }
    //     }

    //     return this;
    // }

    public flipWinding(): MeshBuilder {
        const indices = this._indices.slice();
        this._indices = [];
        for (let i = 0; i < indices.length; i += 3) {
            this._indices.push(indices[i + 2], indices[i + 1], indices[i + 0]);
        }
        return this;
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