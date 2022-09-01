import { Util } from "../core/util";
import { Texture2D } from "./texture";

export type CharData = {
    char: string
    charCode: number
    advance: number,
    descent: number,
    bounds: number[],
    boundsNormalized: number[]
}

export class Font {

    private _charData: { [ key: number ]: CharData };
    private _texture: Texture2D;

    public get texture(): Texture2D { return this._texture; }

    private constructor(texture: Texture2D, data: { [ key: number ]: CharData }) {
        this._charData = data;
        this._texture = texture;
    }

    public getChar(char: string): CharData | undefined {
        const code = char.charCodeAt(0);
        return this._charData[code];
    }

    public static async fromFile(textureFile: string, dataFile: string): Promise<Font | undefined> {
        const tex = await Util.loadTexture(textureFile);
        const res = await fetch(dataFile);
        if (res.ok) {
            const ob = await res.json() as Array<any>;
            const dat: { [ key: number ]: CharData } = {};
            for (let entry of ob) {
                dat[entry['charCode']] = entry as CharData;
            }
            return new Font(tex, dat);
        }
        return undefined;
    }

}