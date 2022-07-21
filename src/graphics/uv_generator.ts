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

export const GridSize = 4;

export class UVGenerator {

    private _uvRegions: { [name: string]: Region };
    private _textureWidth: number;
    private _textureHeight: number;

    constructor(textureWidth: number, textureHeight: number) {
        this._uvRegions = {};
        this._textureWidth = textureWidth;
        this._textureHeight = textureHeight;
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

        const self = this;
        function norm(v: Vector2): Vector2 {
            v.divide(new Vector2(self._textureWidth, self._textureHeight));
            return v;
        }
        
        this._uvRegions[name] = [
            norm(uvRegion[rot[0]]), norm(uvRegion[rot[1]]), norm(uvRegion[rot[2]]), norm(uvRegion[rot[3]])
        ];
    }

    addRegion(name: string, x: number, y: number, width: number, height: number, rotation: Rotation = Rotation.Normal) {
        x *= GridSize;
        y *= GridSize;
        width *= GridSize;
        height *= GridSize;

        x = Math.floor(x);
        y = Math.floor(y);
        width = Math.floor(width);
        height = Math.floor(height);

        this.addRawRegion(name, [
            new Vector2(x, y),
            new Vector2(x + width, y),
            new Vector2(x + width, y + height),
            new Vector2(x, y + height)
        ], rotation);
    }

    public getRegion(name: string): Region {
        return this._uvRegions[name];
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