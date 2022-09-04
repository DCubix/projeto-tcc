import { Vector4 } from "@math.gl/core";
import { Font } from "../graphics/font";
import { Renderer2D } from "../graphics/renderer_2d";
import { SpriteSheet } from "../graphics/sprite_sheet";

const screenWidth = 320;
const screenHeight = 240;
const textColor = new Vector4(0.0, 1.0, 0.5, 1.0);
const smallText = 0.3;
const bigText = 0.45;

export class Computer {

    private _gui?: SpriteSheet;
    private _font?: Font;

    public async load() {
        this._gui = await SpriteSheet.fromFile('computer.png', 22, 40);
        this._font = await Font.fromFile('term-font.png', 'term-font-data.json');
    }

    public render(ctx: Renderer2D): void {
        const screenX = ctx.width / 2 - screenWidth / 2;
        const screenY = ctx.height / 2 - screenHeight / 2;
        
        this.drawDivider(ctx, screenX, screenY + 24, screenWidth, textColor);
        this.drawBigBox(ctx, screenX, screenY, screenWidth, screenHeight, textColor);
        
        ctx.drawText(this._font!, 'Terminal', screenX + 10, screenY + 20, textColor, bigText);
    }

    private drawDivider(ctx: Renderer2D, x: number, y: number, w: number, color?: Vector4) {
        ctx.sprite(this._gui!, 1, new Vector4(x + 4, y, w + 8, 8), 99, color);
    }

    private drawBox(ctx: Renderer2D, x: number, y: number, w: number, h: number, color?: Vector4) {
        const z = 99;
        ctx.sprite(this._gui!, 19, new Vector4(x, y, 8, 8), z, color);
        ctx.sprite(this._gui!, 20, new Vector4(x + 8, y, w, 8), z, color);
        ctx.sprite(this._gui!, 21, new Vector4(x + 8 + w, y, 8, 8), z, color);

        ctx.sprite(this._gui!, 41, new Vector4(x, y + 8, 8, h), z, color);
        ctx.sprite(this._gui!, 43, new Vector4(x + 8 + w, y + 8, 8, h), z, color);

        ctx.sprite(this._gui!, 63, new Vector4(x, y + 8 + h, 8, 8), z, color);
        ctx.sprite(this._gui!, 64, new Vector4(x + 8, y + 8 + h, w, 8), z, color);
        ctx.sprite(this._gui!, 65, new Vector4(x + 8 + w, y + 8 + h, 8, 8), z, color);
    }

    private drawBigBox(ctx: Renderer2D, x: number, y: number, w: number, h: number, color?: Vector4) {
        const z = 99;
        ctx.sprite(this._gui!, 0, new Vector4(x, y, 8, 8), z, color);
        ctx.sprite(this._gui!, 1, new Vector4(x + 8, y, w, 8), z, color);
        ctx.sprite(this._gui!, 5, new Vector4(x + 8 + w, y, 8, 8), z, color);

        ctx.sprite(this._gui!, 22, new Vector4(x, y + 8, 8, h), z, color);
        ctx.sprite(this._gui!, 27, new Vector4(x + 8 + w, y + 8, 8, h), z, color);

        ctx.sprite(this._gui!, 110, new Vector4(x, y + 8 + h, 8, 8), z, color);
        ctx.sprite(this._gui!, 111, new Vector4(x + 8, y + 8 + h, w, 8), z, color);
        ctx.sprite(this._gui!, 115, new Vector4(x + 8 + w, y + 8 + h, 8, 8), z, color);
    }

}