import { Vector2, Vector3 } from "@math.gl/core";
import { levels } from "./levels";
import { Mesh, MeshBuilder, Vertex } from "../graphics/mesh";
import { Material, Renderer } from "../graphics/renderer";
import { GameObject } from "../core/game_object";
import { PointLight } from "../core/point_light";
import { Scene } from "../core/scene";
import { BlockFace, SpriteBlock } from "../core/sprite_block";

// This is just a fixed-size 3d array. It's not a fancy system where there are multiple chunks
export const MaxSize = 128; // 128x128
export const MaxHeight = 16;

export enum VoxelType {
    Air = 0,
    Wall,
    Floor,
    Door,
    Platform,
    Computer
}

export class Voxel {
    public id: number;
    public type: VoxelType;

    constructor(id: number, type: VoxelType) {
        this.id = id;
        this.type = type;
    }
}

export const Sprites = [
    [0, 0, 0, 0], // Air
    [1, 1, 0, 0, 0, 0], // wall
    [1, 1, 1, 1, 1, 1], // wall
    [1, 1, 3, 3, 3, 3], // wall
    [4, 4, 7, 7, 7, 7], // computer
    [4, 4, 5, 5, 5, 5], // door_closed
    [4, 4, 6, 6, 6, 6], // door_open
];

export class VoxelMap extends GameObject {

    private _map: Voxel[][][];

    private _mesh: Mesh;

    public material: Material | null = null;

    constructor() {
        super();
        this._map = new Array(MaxSize * MaxSize * MaxHeight);
        for (let z = 0; z < MaxHeight; z++) {
            this._map[z] = new Array(MaxSize * MaxSize);
            for (let y = 0; y < MaxSize; y++) {
                this._map[z][y] = new Array(MaxSize);
                for (let x = 0; x < MaxSize; x++) {
                    this._map[z][y][x] = new Voxel(0, VoxelType.Air); // 0 = Air
                }
            }
        }
        this._mesh = new Mesh();
    }

    public setID(x: number, y: number, z: number, id: number): void {
        this._map[z][y][x].id = id;
    }

    public getID(x: number, y: number, z: number): number {
        return this._map[z][y][x].id;
    }

    private getVoxel(x: number, y: number, z: number): Voxel | null {
        if (x < 0 || x >= MaxSize || y < 0 || y >= MaxSize || z < 0 || z >= MaxHeight)
            return null;
        return this._map[z][y][x];
    }

    public hasVoxel(x: number, y: number, z: number): boolean {
        const voxel = this.getVoxel(x, y, z);
        return voxel !== null && voxel.id !== 0;
    }

    public hasVoxelId(x: number, y: number, z: number, id: number): boolean {
        const voxel = this.getVoxel(x, y, z);
        return voxel !== null && voxel.id === id;
    }

    public hasVoxelType(x: number, y: number, z: number, ...type: VoxelType[]): boolean {
        const voxel = this.getVoxel(x, y, z);
        return voxel !== null && type.some(t => t === voxel.type);
    }

    public collided3D(position: Vector3, ...type: VoxelType[]): boolean {
        const x = Math.floor(position.x);
        const y = Math.floor(position.z);
        const z = Math.floor(position.y);
        return this.hasVoxelType(x, y, z, ...type);
    }

    public collided3DRadius(position: Vector3, radius: number, height: number, ...type: VoxelType[]): boolean {
        const hh = height / 2;
        let positions = [
            new Vector3(position.x - radius, position.y, position.z - radius),
            new Vector3(position.x + radius, position.y, position.z - radius),
            new Vector3(position.x - radius, position.y, position.z + radius),
            new Vector3(position.x + radius, position.y, position.z + radius),
            new Vector3(position.x, position.y + hh, position.z),
            new Vector3(position.x, position.y - hh, position.z)
        ];
        for (let i = 0; i < positions.length; i++) {
            if (this.collided3D(positions[i], ...type))
                return true;
        }
        return false;
    }

    public updateData(): void {
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
                        const uv = SpriteBlock.getUVs(BlockFace.Top, Sprites[voxel.id], 8, 8);
                        
                        mb.addTriangleOffset(offset, 0, 1, 2);
                        mb.addTriangleOffset(offset, 2, 3, 0);

                        const vertexPos = new Vector3(x, z + 1, y);

                        offset += mb.addVertices([
                            new Vertex(vertexPos.clone().add(pos[3]), new Vector3(0, 1, 0), uv[3]),
                            new Vertex(vertexPos.clone().add(pos[2]), new Vector3(0, 1, 0), uv[2]),
                            new Vertex(vertexPos.clone().add(pos[1]), new Vector3(0, 1, 0), uv[1]),
                            new Vertex(vertexPos.clone().add(pos[0]), new Vector3(0, 1, 0), uv[0]),
                        ]);
                    }

                    // generate bottom face
                    if (!this.hasVoxel(x, y, z - 1)) {
                        const pos = SpriteBlock.getPositionsUnit(BlockFace.Bottom);
                        const uv = SpriteBlock.getUVs(BlockFace.Bottom, Sprites[voxel.id], 8, 8);
                        
                        mb.addTriangleOffset(offset, 0, 1, 2);
                        mb.addTriangleOffset(offset, 2, 3, 0);

                        const vertexPos = new Vector3(x, z, y);

                        offset += mb.addVertices([
                            new Vertex(vertexPos.clone().add(pos[3]), new Vector3(0, -1, 0), uv[3]),
                            new Vertex(vertexPos.clone().add(pos[2]), new Vector3(0, -1, 0), uv[2]),
                            new Vertex(vertexPos.clone().add(pos[1]), new Vector3(0, -1, 0), uv[1]),
                            new Vertex(vertexPos.clone().add(pos[0]), new Vector3(0, -1, 0), uv[0]),
                        ]);
                    }

                    // generate back face
                    if (!this.hasVoxel(x, y - 1, z)) {
                        const pos = SpriteBlock.getPositionsUnit(BlockFace.Back);
                        const uv = SpriteBlock.getUVs(BlockFace.Back, Sprites[voxel.id], 8, 8);
                        
                        mb.addTriangleOffset(offset, 0, 1, 2);
                        mb.addTriangleOffset(offset, 2, 3, 0);

                        const vertexPos = new Vector3(x, z, y);

                        offset += mb.addVertices([
                            new Vertex(vertexPos.clone().add(pos[3]), new Vector3(0, 0, -1), uv[3]),
                            new Vertex(vertexPos.clone().add(pos[2]), new Vector3(0, 0, -1), uv[2]),
                            new Vertex(vertexPos.clone().add(pos[1]), new Vector3(0, 0, -1), uv[1]),
                            new Vertex(vertexPos.clone().add(pos[0]), new Vector3(0, 0, -1), uv[0]),
                        ]);
                    }

                    // generate front face
                    if (!this.hasVoxel(x, y + 1, z)) {
                        const pos = SpriteBlock.getPositionsUnit(BlockFace.Front);
                        const uv = SpriteBlock.getUVs(BlockFace.Front, Sprites[voxel.id], 8, 8);
                        
                        mb.addTriangleOffset(offset, 0, 1, 2);
                        mb.addTriangleOffset(offset, 2, 3, 0);

                        const vertexPos = new Vector3(x, z, y + 1);

                        offset += mb.addVertices([
                            new Vertex(vertexPos.clone().add(pos[3]), new Vector3(0, 0, 1), uv[3]),
                            new Vertex(vertexPos.clone().add(pos[2]), new Vector3(0, 0, 1), uv[2]),
                            new Vertex(vertexPos.clone().add(pos[1]), new Vector3(0, 0, 1), uv[1]),
                            new Vertex(vertexPos.clone().add(pos[0]), new Vector3(0, 0, 1), uv[0]),
                        ]);
                    }

                    // generate left face
                    if (!this.hasVoxel(x - 1, y, z)) {
                        const pos = SpriteBlock.getPositionsUnit(BlockFace.Left);
                        const uv = SpriteBlock.getUVs(BlockFace.Left, Sprites[voxel.id], 8, 8);
                        
                        mb.addTriangleOffset(offset, 0, 1, 2);
                        mb.addTriangleOffset(offset, 2, 3, 0);

                        const vertexPos = new Vector3(x, z, y);

                        offset += mb.addVertices([
                            new Vertex(vertexPos.clone().add(pos[3]), new Vector3(0, 0, 1), uv[3]),
                            new Vertex(vertexPos.clone().add(pos[2]), new Vector3(0, 0, 1), uv[2]),
                            new Vertex(vertexPos.clone().add(pos[1]), new Vector3(0, 0, 1), uv[1]),
                            new Vertex(vertexPos.clone().add(pos[0]), new Vector3(0, 0, 1), uv[0]),
                        ]);
                    }

                    // generate right face
                    if (!this.hasVoxel(x + 1, y, z)) {
                        const pos = SpriteBlock.getPositionsUnit(BlockFace.Right);
                        const uv = SpriteBlock.getUVs(BlockFace.Right, Sprites[voxel.id], 8, 8);
                        
                        mb.addTriangleOffset(offset, 0, 1, 2);
                        mb.addTriangleOffset(offset, 2, 3, 0);

                        const vertexPos = new Vector3(x + 1, z, y);

                        offset += mb.addVertices([
                            new Vertex(vertexPos.clone().add(pos[3]), new Vector3(0, 0, -1), uv[3]),
                            new Vertex(vertexPos.clone().add(pos[2]), new Vector3(0, 0, -1), uv[2]),
                            new Vertex(vertexPos.clone().add(pos[1]), new Vector3(0, 0, -1), uv[1]),
                            new Vertex(vertexPos.clone().add(pos[0]), new Vector3(0, 0, -1), uv[0]),
                        ]);
                    }
                }
            }
        }

        const [vertices, indices] = mb.recalculateNormals().buildData();
        this._mesh.update(vertices, indices);
    }

    public loadLevel(index: number, scene: Scene): Vector2 {
        const lvl = levels[index];

        let playerPos = new Vector2(0, 0);

        for (let y = 0; y < lvl.height; y++) {
            for (let x = 0; x < lvl.width; x++) {
                const chr = lvl.map[y].charAt(x);
                let z = 0;
                let spr = 0;
                let type = VoxelType.Air;
                let wallOnTop = false;
                switch (chr) {
                    case 'W': z = 1; spr = 1 + ~~(Math.random() * 2); type = VoxelType.Wall; wallOnTop = true; break;
                    case 'I': z = 1; spr = 0; type = VoxelType.Wall; break;
                    case 'D': {
                        z = 1; spr = 0; type = VoxelType.Door; wallOnTop = true;
                        
                        // add a door with half thichness
                        const sprite = Sprites[5];
                        const block = new SpriteBlock();
                        block.spriteFaces = sprite;
                        block.horizontalSpriteCount = 8;
                        block.verticalSpriteCount = 8;
                        block.material = this.material;

                        block.localPosition.set(x + 0.5, z + 0.5, y + 0.5);
                        
                        scene.add(block);
                    } break;
                    case 'P': playerPos.set(x, y);
                    case '_': z = 0; spr = 1; type = VoxelType.Floor; break;
                    case 'T': {
                        z = 1; spr = 4; wallOnTop = true;
                        const l0 = new PointLight(0.8, 3.0, new Vector3(0.0, 1.0, 0.494));
                        l0.localPosition.set(x + 0.5, z + 0.5, y + 0.5);
                        scene.add(l0);
                        type = VoxelType.Computer;
                    } break;
                    default: continue;
                }

                const vox = this.getVoxel(x, y, z)!;
                vox.id = spr;
                vox.type = type;
                
                if (wallOnTop) {
                    for (let h = 1; h < 9; h++) { 
                        spr = 1 + ~~(Math.random() * 2);
                        const vox = this.getVoxel(x, y, z + h)!;
                        vox.id = spr;
                        vox.type = VoxelType.Wall;
                    }
                }
            }
        }

        this.updateData();

        return playerPos;
    }

    public onCreate(): void {
    }

    public onDestroy(): void {
    }

    public onRender(renderer: Renderer): void {
        renderer.queueRenderable(this._mesh, this.modelMatrix, this.material);
    }

}