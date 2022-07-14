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

    public material: Material = Material.default;
    public spriteFaces: number[];
    public horizontalSpriteCount: number = 1;
    public verticalSpriteCount: number = 1;

    private _mesh: Mesh;

    private _previousSpriteFaces: number[];

    private _vertices: Vertex[];
    private _indices: number[];

    constructor() {
        super();
        this.spriteFaces = new Array<number>(BlockFace.Count);
        this.spriteFaces.fill(0);

        this._previousSpriteFaces = new Array<number>(BlockFace.Count);
        this._previousSpriteFaces.fill(0);

        this._mesh = new Mesh();

        const mb = new MeshBuilder();
        const faceNormals = [
            new Vector3(0, 1, 0),
            new Vector3(0, -1, 0),
            new Vector3(-1, 0, 0),
            new Vector3(1, 0, 0),
            new Vector3(0, 0, 1),
            new Vector3(0, 0, -1)
        ];

        const tw = 1.0 / Math.max(1, this.horizontalSpriteCount);
        const th = 1.0 / Math.max(1, this.verticalSpriteCount);

        let offset = 0;
        for (let i = 0; i < BlockFace.Count; i++) {
            const n = faceNormals[i];
            const tx = (this.spriteFaces[i] % this.horizontalSpriteCount) * tw;
            const ty = Math.floor(this.spriteFaces[i] / this.horizontalSpriteCount) * th;

            const uvs = [
                new Vector2(tx, ty),
                new Vector2(tx + tw, ty),
                new Vector2(tx + tw, ty + th),
                new Vector2(tx, ty + th)
            ];
            
            const positions = this.getPositions(i);
            mb.addVertices([
                new Vertex(positions[0].multiplyByScalar(0.5).add(n.clone().multiplyByScalar(0.5)), n.clone(), uvs[0]),
                new Vertex(positions[1].multiplyByScalar(0.5).add(n.clone().multiplyByScalar(0.5)), n.clone(), uvs[1]),
                new Vertex(positions[2].multiplyByScalar(0.5).add(n.clone().multiplyByScalar(0.5)), n.clone(), uvs[2]),
                new Vertex(positions[3].multiplyByScalar(0.5).add(n.clone().multiplyByScalar(0.5)), n.clone(), uvs[3])
            ]);

            mb.addTriangle(offset + 0, offset + 1, offset + 2);
            mb.addTriangle(offset + 0, offset + 2, offset + 3);

            offset += 4;
        }

        const [vertices, indices] = mb.buildData();
        this._vertices = vertices;
        this._indices = indices;

        this._mesh.update(this._vertices, this._indices);
    }

    public onCreate(): void {
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
            const tw = 1.0 / Math.max(1, this.horizontalSpriteCount);
            const th = 1.0 / Math.max(1, this.verticalSpriteCount);

            for (let j = 0; j < this.spriteFaces.length; j++) {
                if (this.spriteFaces[j] === this._previousSpriteFaces[j]) {
                    continue;
                }
                
                const spr = this.spriteFaces[j];
                const tx = (spr % this.horizontalSpriteCount) * tw;
                const ty = Math.floor(spr / this.horizontalSpriteCount) * th;

                const uvs = [
                    new Vector2(tx, ty),
                    new Vector2(tx + tw, ty),
                    new Vector2(tx + tw, ty + th),
                    new Vector2(tx, ty + th)
                ];

                for (let i = 0; i < 4; i++) {
                    this._vertices[i + (j*4)].uv = uvs[i];
                }
            }

            this._previousSpriteFaces = this.spriteFaces.slice();
            this._mesh.update(this._vertices, this._indices);
        }

        renderer.queueRenderable(this._mesh, this.modelMatrix, this.material);
    }

    private getPositions(face: BlockFace): Vector3[] {
        switch (face) {
            case BlockFace.Top:
                return [
                    new Vector3(-1, 0,  1),
                    new Vector3( 1, 0,  1),
                    new Vector3( 1, 0, -1),
                    new Vector3(-1, 0, -1)
                ];
            case BlockFace.Bottom:
                return [
                    new Vector3(-1, 0, -1),
                    new Vector3( 1, 0, -1),
                    new Vector3( 1, 0,  1),
                    new Vector3(-1, 0,  1)
                ];
            case BlockFace.Left:
                return [
                    new Vector3(0,  1,  1),
                    new Vector3(0,  1, -1),
                    new Vector3(0, -1, -1),
                    new Vector3(0, -1,  1)
                ];
            case BlockFace.Right:
                return [
                    new Vector3(0, -1,  1),
                    new Vector3(0, -1, -1),
                    new Vector3(0,  1, -1),
                    new Vector3(0,  1,  1)
                ];
            case BlockFace.Front:
                return [
                    new Vector3(-1, -1, 0),
                    new Vector3( 1, -1, 0),
                    new Vector3( 1,  1, 0),
                    new Vector3(-1,  1, 0)
                ];
            case BlockFace.Back:
                return [
                    new Vector3(-1,  1, 0),
                    new Vector3( 1,  1, 0),
                    new Vector3( 1, -1, 0),
                    new Vector3(-1, -1, 0)
                ];
            default: return [];
        }
    }

}