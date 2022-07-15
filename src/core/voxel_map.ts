import { Vector2, Vector3 } from "@math.gl/core";
import { Mesh, MeshBuilder, Vertex } from "../graphics/mesh";
import { Material, Renderer } from "../graphics/renderer";
import { GameObject } from "./game_object";
import { BlockFace, SpriteBlock } from "./sprite_block";

// This is just a fixed-size 3d array. It's not a fancy system where there are multiple chunks
export const MaxSize = 128; // 128x128
export const MaxHeight = 16;

export class Voxel {
    public id: number;
    public collider: boolean;
    public emissionIntensity: number;

    constructor(id: number, collider: boolean, emissionIntensity: number) {
        this.id = id;
        this.collider = collider;
        this.emissionIntensity = emissionIntensity;
    }
}

export class VoxelMap extends GameObject {

    private _map: Voxel[][][];

    private _mesh: Mesh;

    public material: Material | null = null;
    public spriteFaces: [number, number, number, number, number, number][];

    constructor() {
        super();
        this._map = new Array(MaxSize * MaxSize * MaxHeight);
        for (let z = 0; z < MaxHeight; z++) {
            this._map[z] = new Array(MaxSize * MaxSize);
            for (let y = 0; y < MaxSize; y++) {
                this._map[z][y] = new Array(MaxSize);
                for (let x = 0; x < MaxSize; x++) {
                    this._map[z][y][x] = new Voxel(0, false, 0); // 0 = Air
                }
            }
        }
        this._mesh = new Mesh();

        this.spriteFaces = new Array(256);
        for (let i = 0; i < this.spriteFaces.length; i++) {
            this.spriteFaces[i] = [0, 0, 0, 0, 0, 0];
        }
    }

    public setID(x: number, y: number, z: number, id: number): void {
        this._map[z][y][x].id = id;
    }

    public getID(x: number, y: number, z: number): number {
        return this._map[z][y][x].id;
    }

    public setCollider(x: number, y: number, z: number, collider: boolean): void {
        this._map[z][y][x].collider = collider;
    }

    public isCollider(x: number, y: number, z: number): boolean {
        return this._map[z][y][x].collider;
    }

    public setEmissionIntensity(x: number, y: number, z: number, emissionIntensity: number): void {
        this._map[z][y][x].emissionIntensity = emissionIntensity;
    }

    public getEmissionIntensity(x: number, y: number, z: number): number {
        return this._map[z][y][x].emissionIntensity;
    }

    private getVoxel(x: number, y: number, z: number): Voxel | null {
        if (x < 0 || x >= MaxSize || y < 0 || y >= MaxSize || z < 0 || z >= MaxHeight)
            return null;
        return this._map[z][y][x];
    }

    private hasVoxel(x: number, y: number, z: number): boolean {
        const voxel = this.getVoxel(x, y, z);
        return voxel !== null && voxel.id !== 0;
    }

    public update(): void {
        const mb = new MeshBuilder();

        let offset = 0;
        for (let x = 0; x < MaxSize; x++) {
            for (let y = 0; y < MaxSize; y++) {
                for (let z = 0; z < MaxHeight; z++) {
                    const voxel = this.getVoxel(x, y, z);
                    if (voxel === null || (voxel !== null && voxel.id === 0)) continue;

                    // gernerate top face
                    // if there are no voxels above, then we need to generate a top face
                    if (!this.hasVoxel(x, y, z + 1)) {
                        const pos = SpriteBlock.getPositionsUnit(BlockFace.Top);
                        const uv = SpriteBlock.getUVs(BlockFace.Top, this.spriteFaces[voxel.id], 16, 16);
                        
                        mb.addTriangleOffset(offset, 0, 1, 2);
                        mb.addTriangleOffset(offset, 2, 3, 0);

                        const vertexPos = new Vector3(x, z + 1, y);

                        offset += mb.addVertices([
                            new Vertex(vertexPos.clone().add(pos[0]), new Vector3(0, 1, 0), uv[0]),
                            new Vertex(vertexPos.clone().add(pos[1]), new Vector3(0, 1, 0), uv[1]),
                            new Vertex(vertexPos.clone().add(pos[2]), new Vector3(0, 1, 0), uv[2]),
                            new Vertex(vertexPos.clone().add(pos[3]), new Vector3(0, 1, 0), uv[3])
                        ]);
                    }

                    // generate bottom face
                    if (!this.hasVoxel(x, y, z - 1)) {
                        const pos = SpriteBlock.getPositionsUnit(BlockFace.Bottom);
                        const uv = SpriteBlock.getUVs(BlockFace.Bottom, this.spriteFaces[voxel.id], 16, 16);
                        
                        mb.addTriangleOffset(offset, 0, 1, 2);
                        mb.addTriangleOffset(offset, 2, 3, 0);

                        const vertexPos = new Vector3(x, z, y);

                        offset += mb.addVertices([
                            new Vertex(vertexPos.clone().add(pos[0]), new Vector3(0, -1, 0), uv[0]),
                            new Vertex(vertexPos.clone().add(pos[1]), new Vector3(0, -1, 0), uv[1]),
                            new Vertex(vertexPos.clone().add(pos[2]), new Vector3(0, -1, 0), uv[2]),
                            new Vertex(vertexPos.clone().add(pos[3]), new Vector3(0, -1, 0), uv[3])
                        ]);
                    }

                    // generate back face
                    if (!this.hasVoxel(x, y - 1, z)) {
                        const pos = SpriteBlock.getPositionsUnit(BlockFace.Back);
                        const uv = SpriteBlock.getUVs(BlockFace.Back, this.spriteFaces[voxel.id], 16, 16);
                        
                        mb.addTriangleOffset(offset, 0, 1, 2);
                        mb.addTriangleOffset(offset, 2, 3, 0);

                        const vertexPos = new Vector3(x, z, y);

                        offset += mb.addVertices([
                            new Vertex(vertexPos.clone().add(pos[0]), new Vector3(0, 0, -1), uv[0]),
                            new Vertex(vertexPos.clone().add(pos[1]), new Vector3(0, 0, -1), uv[1]),
                            new Vertex(vertexPos.clone().add(pos[2]), new Vector3(0, 0, -1), uv[2]),
                            new Vertex(vertexPos.clone().add(pos[3]), new Vector3(0, 0, -1), uv[3])
                        ]);
                    }

                    // generate front face
                    if (!this.hasVoxel(x, y + 1, z)) {
                        const pos = SpriteBlock.getPositionsUnit(BlockFace.Front);
                        const uv = SpriteBlock.getUVs(BlockFace.Front, this.spriteFaces[voxel.id], 16, 16);
                        
                        mb.addTriangleOffset(offset, 0, 1, 2);
                        mb.addTriangleOffset(offset, 2, 3, 0);

                        const vertexPos = new Vector3(x, z, y + 1);

                        offset += mb.addVertices([
                            new Vertex(vertexPos.clone().add(pos[0]), new Vector3(0, 0, 1), uv[0]),
                            new Vertex(vertexPos.clone().add(pos[1]), new Vector3(0, 0, 1), uv[1]),
                            new Vertex(vertexPos.clone().add(pos[2]), new Vector3(0, 0, 1), uv[2]),
                            new Vertex(vertexPos.clone().add(pos[3]), new Vector3(0, 0, 1), uv[3])
                        ]);
                    }

                    // generate left face
                    if (!this.hasVoxel(x - 1, y, z)) {
                        const pos = SpriteBlock.getPositionsUnit(BlockFace.Left);
                        const uv = SpriteBlock.getUVs(BlockFace.Left, this.spriteFaces[voxel.id], 16, 16);
                        
                        mb.addTriangleOffset(offset, 0, 1, 2);
                        mb.addTriangleOffset(offset, 2, 3, 0);

                        const vertexPos = new Vector3(x, z, y);

                        offset += mb.addVertices([
                            new Vertex(vertexPos.clone().add(pos[0]), new Vector3(0, 0, 1), uv[0]),
                            new Vertex(vertexPos.clone().add(pos[1]), new Vector3(0, 0, 1), uv[1]),
                            new Vertex(vertexPos.clone().add(pos[2]), new Vector3(0, 0, 1), uv[2]),
                            new Vertex(vertexPos.clone().add(pos[3]), new Vector3(0, 0, 1), uv[3])
                        ]);
                    }

                    // generate right face
                    if (!this.hasVoxel(x + 1, y, z)) {
                        const pos = SpriteBlock.getPositionsUnit(BlockFace.Right);
                        const uv = SpriteBlock.getUVs(BlockFace.Right, this.spriteFaces[voxel.id], 16, 16);
                        
                        mb.addTriangleOffset(offset, 0, 1, 2);
                        mb.addTriangleOffset(offset, 2, 3, 0);

                        const vertexPos = new Vector3(x + 1, z, y);

                        offset += mb.addVertices([
                            new Vertex(vertexPos.clone().add(pos[0]), new Vector3(0, 0, -1), uv[0]),
                            new Vertex(vertexPos.clone().add(pos[1]), new Vector3(0, 0, -1), uv[1]),
                            new Vertex(vertexPos.clone().add(pos[2]), new Vector3(0, 0, -1), uv[2]),
                            new Vertex(vertexPos.clone().add(pos[3]), new Vector3(0, 0, -1), uv[3])
                        ]);
                    }
                }
            }
        }

        const [vertices, indices] = mb.originToGeometry().recalculateNormals().buildData();
        this._mesh.update(vertices, indices);
    }

    public onCreate(): void {
        // TEST: Generate a terrain
        this.spriteFaces[1] = [16, 17, 18, 19, 20, 21];

        for (let x = 0; x < 32; x++) {
            for (let y = 0; y < 32; y++) {
                let v = Math.abs(Math.sin((x / 32) * Math.PI * 2.0)) * Math.abs(Math.sin((y / 32) * Math.PI * 2.0));
                let h = ~~(v * 12);
                for (let z = 0; z < h; z++) {
                    this.setID(x, y, z, 1);
                }
            }
        }

        this.update();
    }

    public onDestroy(): void {
    }

    public onRender(renderer: Renderer): void {
        renderer.queueRenderable(this._mesh, this.modelMatrix, this.material);
    }

}