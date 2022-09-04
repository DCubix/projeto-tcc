import { Util } from "../core/util";
import { Texture2D } from "./texture";

export class SpriteSheet {

    private _texture: Texture2D;
    
    public horizontalCells: number = 1;
    public verticalCells: number = 1;

    public get texture(): Texture2D { return this._texture; }
    public get cellWidth(): number { return this._texture.width / this.horizontalCells; }
    public get cellHeight(): number { return this._texture.height / this.verticalCells; }

    private constructor(texture: Texture2D) {
        this._texture = texture;
    }

    public static async fromFile(filePath: string, hcells: number = 1, vcells: number = 1): Promise<SpriteSheet> {
        const tex = await Util.loadTexture(filePath);
        const spr = new SpriteSheet(tex);
        spr.horizontalCells = hcells;
        spr.verticalCells = vcells;
        return spr;
    }

}