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

    constructor() {
        super();
        this.spriteFaces = new Array<number>(BlockFace.Count);
        this.spriteFaces.fill(0);

        this._previousSpriteFaces = new Array<number>(BlockFace.Count);
        this._previousSpriteFaces.fill(1);

        this._mesh = new Mesh();
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
            this._previousSpriteFaces = this.spriteFaces.slice();

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

            for (let i = 0; i < BlockFace.Count; i++) {
                const n = faceNormals[i].clone().multiplyByScalar(0.5);
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
                    new Vertex(positions[0].add(n), n, uvs[0]),
                    new Vertex(positions[1].add(n), n, uvs[1]),
                    new Vertex(positions[2].add(n), n, uvs[2]),
                    new Vertex(positions[3].add(n), n, uvs[3])
                ]);

                mb.addTriangle(0, 1, 2, true);
                mb.addTriangle(0, 2, 3, true);
            }

            const [vertices, indices] = mb.buildData();
            this._mesh.update(vertices, indices);
        }

        renderer.queueRenderable(this._mesh, this.modelMatrix, this.material);
    }

    private getPositions(face: BlockFace): Vector3[] {
        let positions = [
            new Vector3(-0.5, -0.5, 0.5),
            new Vector3(-0.5, 0.5, 0.5),
            new Vector3(0.5, 0.5, 0.5),
            new Vector3(0.5, -0.5, 0.5),
            new Vector3(-0.5, -0.5, -0.5),
            new Vector3(-0.5, 0.5, -0.5),
            new Vector3(0.5, 0.5, -0.5),
            new Vector3(0.5, -0.5, -0.5)
        ];

        switch (face) {
            case BlockFace.Top:
                return positions.slice(0, 4);
            case BlockFace.Bottom:
                return positions.slice(4, 8);
            case BlockFace.Left:
                return positions.slice(0, 2);
            case BlockFace.Right:
                return positions.slice(2, 4);
            case BlockFace.Front:
                return positions.slice(4, 6);
            case BlockFace.Back:
                return positions.slice(6, 8);
            default: return [];
        }
    }

}