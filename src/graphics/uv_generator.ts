import { Vector2 } from "@math.gl/core";

//typedef uv
export type Region = [Vector2, Vector2, Vector2, Vector2];

export enum Rotation {
    Normal = 0,
    Rotate90,
    Rotate180,
    Rotate270,
    RotateNegative90,
    RotateNegative180,
    RotateNegative270
}

export class UVGenerator {

    private _uvRegions: { [name: string]: Region };
    private _textureWidth: number;
    private _textureHeight: number;
    private _gridSize: number;

    constructor(textureWidth: number, textureHeight: number, gridSize: number = 1) {
        this._uvRegions = {};
        this._textureWidth = textureWidth;
        this._textureHeight = textureHeight;
        this._gridSize = gridSize;
    }

    addRawRegion(name: string, uvRegion: Region, rotation: Rotation = Rotation.Normal) {
        const rotations = [
            [0, 1, 2, 3],
            [1, 2, 3, 0],
            [2, 3, 0, 1],
            [3, 0, 1, 2],
            [0, 3, 2, 1],
            [3, 2, 1, 0],
            [2, 1, 0, 3]
        ];
        const rot = rotations[rotation];

        this._uvRegions[name] = [
            uvRegion[rot[0]],
            uvRegion[rot[1]],
            uvRegion[rot[2]],
            uvRegion[rot[3]]
        ];
    }

    addRegion(name: string, x: number, y: number, width: number, height: number, rotation: Rotation = Rotation.Normal) {
        x *= this._gridSize;
        y *= this._gridSize;
        width *= this._gridSize;
        height *= this._gridSize;

        x = Math.floor(x) / this._textureWidth;
        y = Math.floor(y) / this._textureHeight;
        width = Math.floor(width) / this._textureWidth;
        height = Math.floor(height) / this._textureHeight;

        this.addRawRegion(name, [
            new Vector2(x, y),
            new Vector2(x + width, y),
            new Vector2(x + width, y + height),
            new Vector2(x, y + height)
        ], rotation);
    }

    public getRegion(name: string): Region {
        return this._uvRegions[name] || UVGenerator.defaultRegion;
    }

    public static get defaultRegion(): Region {
        return [
            new Vector2(0, 0),
            new Vector2(1, 0),
            new Vector2(1, 1),
            new Vector2(0, 1)
        ];
    }
}