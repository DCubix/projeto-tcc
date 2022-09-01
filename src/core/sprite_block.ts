import { Vector2, Vector3 } from "@math.gl/core";
import { Mesh, MeshBuilder, Vertex } from "../graphics/mesh";
import { Material, Renderer } from "../graphics/renderer";
import { GameObject } from "./game_object";

export enum BlockFace {
    Top,
    Bottom,
    Left,
    Right,
    Front,
    Back,
    Count
}

export class SpriteBlock extends GameObject {

    public material: Material | null = null;
    public spriteFaces: number[];
    public horizontalSpriteCount: number = 1;
    public verticalSpriteCount: number = 1;

    private _mesh: Mesh;

    private _previousSpriteFaces: number[];

    private _vertices: Vertex[] = [];
    private _indices: number[] = [];

    constructor() {
        super();
        this.spriteFaces = new Array<number>(BlockFace.Count);
        this.spriteFaces.fill(0);

        this._previousSpriteFaces = new Array<number>(BlockFace.Count);
        this._previousSpriteFaces.fill(1);

        this._mesh = new Mesh();
    }

    public onCreate(): void {
        const mb = new MeshBuilder();
        const faceNormals = [
            new Vector3(0, 1, 0),
            new Vector3(0, -1, 0),
            new Vector3(-1, 0, 0),
            new Vector3(1, 0, 0),
            new Vector3(0, 0, 1),
            new Vector3(0, 0, -1)
        ];

        let offset = 0;
        for (let i = 0; i < BlockFace.Count; i++) {
            const n = faceNormals[i];

            const uvs = SpriteBlock.getUVs(i, this.spriteFaces, this.horizontalSpriteCount, this.verticalSpriteCount);
            
            const positions = SpriteBlock.getPositions(i);

            mb.addTriangleOffset(offset, 0, 1, 2);
            mb.addTriangleOffset(offset, 2, 3, 0);

            offset += mb.addVertices([
                new Vertex(positions[3].multiplyByScalar(0.5).add(n.clone().multiplyByScalar(0.5)), n.clone(), uvs[3]),
                new Vertex(positions[2].multiplyByScalar(0.5).add(n.clone().multiplyByScalar(0.5)), n.clone(), uvs[2]),
                new Vertex(positions[1].multiplyByScalar(0.5).add(n.clone().multiplyByScalar(0.5)), n.clone(), uvs[1]),
                new Vertex(positions[0].multiplyByScalar(0.5).add(n.clone().multiplyByScalar(0.5)), n.clone(), uvs[0]),
            ]);
        }

        const [vertices, indices] = mb.recalculateNormals().buildData();
        this._vertices = vertices;
        this._indices = indices;

        this._mesh.update(this._vertices, this._indices);
    }

    public onDestroy(): void {
    }

    public onRender(renderer: Renderer): void {
        let facesChanged = false;
        for (let i = 0; i < BlockFace.Count; i++) {
            if (this.spriteFaces[i] !== this._previousSpriteFaces[i]) {
                facesChanged = true;
                break;
            }
        }

        if (facesChanged) {
            for (let j = 0; j < this.spriteFaces.length; j++) {
                // if (this.spriteFaces[j] === this._previousSpriteFaces[j]) {
                //     continue;
                // }
                const uvs = SpriteBlock.getUVs(j, this.spriteFaces, this.horizontalSpriteCount, this.verticalSpriteCount);
                for (let i = 0; i < 4; i++) {
                    this._vertices[i + (j*4)].uv.set(uvs[i].x, uvs[i].y);
                }
            }

            this._previousSpriteFaces = this.spriteFaces.slice();
            this._mesh.update(this._vertices, this._indices);
        }

        renderer.queueRenderable(this._mesh, this.modelMatrix, this.material);
    }

    public static getUVs(face: BlockFace, spriteFaces: number[], horizontalSpriteCount: number, verticalSpriteCount: number): Vector2[] {
        const tw = 1.0 / Math.max(1, horizontalSpriteCount);
        const th = 1.0 / Math.max(1, verticalSpriteCount);

        const tx = (spriteFaces[face] % horizontalSpriteCount) * tw;
        const ty = Math.floor(spriteFaces[face] / horizontalSpriteCount) * th;

        switch (face) {
            case BlockFace.Top:
                return [
                    new Vector2(tx, ty + th),
                    new Vector2(tx + tw, ty + th),
                    new Vector2(tx + tw, ty),
                    new Vector2(tx, ty)
                ];
            case BlockFace.Bottom:
                return [
                    new Vector2(tx, ty + th),
                    new Vector2(tx + tw, ty + th),
                    new Vector2(tx + tw, ty),
                    new Vector2(tx, ty)
                ];
            case BlockFace.Left:
                return [
                    new Vector2(tx + tw, ty),
                    new Vector2(tx, ty),
                    new Vector2(tx, ty + th),
                    new Vector2(tx + tw, ty + th)
                ];
            case BlockFace.Right:
                return [
                    new Vector2(tx, ty + th),
                    new Vector2(tx + tw, ty + th),
                    new Vector2(tx + tw, ty),
                    new Vector2(tx, ty)
                ];
            case BlockFace.Front:
                return [
                    new Vector2(tx, ty + th),
                    new Vector2(tx + tw, ty + th),
                    new Vector2(tx + tw, ty),
                    new Vector2(tx, ty)
                ];
            case BlockFace.Back:
                return [
                    new Vector2(tx + tw, ty),
                    new Vector2(tx, ty),
                    new Vector2(tx, ty + th),
                    new Vector2(tx + tw, ty + th)
                ];
            default: return [];
        }
    }

    public static getPositions(face: BlockFace, s: number = 1): Vector3[] {
        switch (face) {
            case BlockFace.Top:
                return [
                    new Vector3(-s, 0,  s),
                    new Vector3( s, 0,  s),
                    new Vector3( s, 0, -s),
                    new Vector3(-s, 0, -s)
                ];
            case BlockFace.Bottom:
                return [
                    new Vector3(-s, 0, -s),
                    new Vector3( s, 0, -s),
                    new Vector3( s, 0,  s),
                    new Vector3(-s, 0,  s)
                ];
            case BlockFace.Left:
                return [
                    new Vector3(0,  s,  s),
                    new Vector3(0,  s, -s),
                    new Vector3(0, -s, -s),
                    new Vector3(0, -s,  s)
                ];
            case BlockFace.Right:
                return [
                    new Vector3(0, -s,  s),
                    new Vector3(0, -s, -s),
                    new Vector3(0,  s, -s),
                    new Vector3(0,  s,  s)
                ];
            case BlockFace.Front:
                return [
                    new Vector3(-s, -s, 0),
                    new Vector3( s, -s, 0),
                    new Vector3( s,  s, 0),
                    new Vector3(-s,  s, 0)
                ];
            case BlockFace.Back:
                return [
                    new Vector3(-s,  s, 0),
                    new Vector3( s,  s, 0),
                    new Vector3( s, -s, 0),
                    new Vector3(-s, -s, 0)
                ];
            default: return [];
        }
    }

    public static getPositionsUnit(face: BlockFace): Vector3[] {
        switch (face) {
            case BlockFace.Top:
                return [
                    new Vector3(0, 0, 1),
                    new Vector3(1, 0, 1),
                    new Vector3(1, 0, 0),
                    new Vector3(0, 0, 0)
                ];
            case BlockFace.Bottom:
                return [
                    new Vector3(0, 0, 0),
                    new Vector3(1, 0, 0),
                    new Vector3(1, 0, 1),
                    new Vector3(0, 0, 1)
                ];
            case BlockFace.Left:
                return [
                    new Vector3(0, 1, 1),
                    new Vector3(0, 1, 0),
                    new Vector3(0, 0, 0),
                    new Vector3(0, 0, 1)
                ];
            case BlockFace.Right:
                return [
                    new Vector3(0, 0, 1),
                    new Vector3(0, 0, 0),
                    new Vector3(0, 1, 0),
                    new Vector3(0, 1, 1)
                ];
            case BlockFace.Front:
                return [
                    new Vector3(0, 0, 0),
                    new Vector3(1, 0, 0),
                    new Vector3(1, 1, 0),
                    new Vector3(0, 1, 0)
                ];
            case BlockFace.Back:
                return [
                    new Vector3(0, 1, 0),
                    new Vector3(1, 1, 0),
                    new Vector3(1, 0, 0),
                    new Vector3(0, 0, 0)
                ];
            default: return [];
        }
    }

}