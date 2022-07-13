import { Mesh, MeshBuilder, Vertex } from "../graphics/mesh";
import { Material, Renderer } from "../graphics/renderer";
import { Texture2D } from "../graphics/texture";
import { Vec2 } from "../math/vec2";
import { Vec3 } from "../math/vec3";
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
                new Vec3(0, 1, 0),
                new Vec3(0, -1, 0),
                new Vec3(-1, 0, 0),
                new Vec3(1, 0, 0),
                new Vec3(0, 0, 1),
                new Vec3(0, 0, -1)
            ];

            const tw = 1.0 / Math.max(1, this.horizontalSpriteCount);
            const th = 1.0 / Math.max(1, this.verticalSpriteCount);

            for (let i = 0; i < BlockFace.Count; i++) {
                const n = faceNormals[i];
                const tx = (this.spriteFaces[i] % this.horizontalSpriteCount) * tw;
                const ty = Math.floor(this.spriteFaces[i] / this.horizontalSpriteCount) * th;
                const uvs = [
                    new Vec2(tx, ty),
                    new Vec2(tx + tw, ty),
                    new Vec2(tx + tw, ty + th),
                    new Vec2(tx, ty + th)
                ];
                mb.addQuadVertices(0.5, n, 0.5, uvs);
                mb.addQuadRelative(0, 1, 2, 3);
            }

            const [vertices, indices] = mb.buildData();
            this._mesh.update(vertices, indices);
        }

        renderer.queueRenderable(this._mesh, this.modelMatrix, this.material);
    }

}