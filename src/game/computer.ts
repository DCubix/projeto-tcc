import { Vector4 } from "@math.gl/core";
import { opCodeToString, Parser } from "../gpcd/assembler";
import { VirtualMachine, OpCode, ComparisonOpCode, Register, DataType, MaxProgramSize, Value } from "../gpcd/vm";
import { Font } from "../graphics/font";
import { Renderer2D } from "../graphics/renderer_2d";
import { SpriteSheet } from "../graphics/sprite_sheet";

const screenWidth = 320;
const screenHeight = 240;
const textColor = new Vector4(0.0, 1.0, 0.5, 1.0);
const textColorSecondary = new Vector4(0.0, 0.0, 0.0, 1.0);
const textColorWhite = new Vector4(1.0, 1.0, 1.0, 1.0);
const smallText = 0.25;
const mediumText = 0.3;
const bigText = 0.5;

class Layout {

    private _x: number;
    private _y: number;
    private _width: number;
    private _height: number;

    private _currentX: number;
    private _lastRowHeight: number;
    private _lastRowPadding: number;

    public get x(): number { return this._currentX; }
    public get y(): number { return this._y; }

    constructor(x: number, y: number, width: number, height: number) {
        this._x = x;
        this._y = y;
        this._width = width;
        this._height = height;
        this._currentX = x;
        this._lastRowHeight = 1;
        this._lastRowPadding = 0;
    }

    beginRow(height: number, padding: number = 0) {
        this._lastRowHeight = height - padding * 2;
    }

    endRow() {
        this._y += this._lastRowHeight + this._lastRowPadding;
        this._currentX = this._x;
    }

    cell(width: number, padding: number = 0): number {
        this._currentX += width + padding;
        if (this._currentX >= this._width) {
            this.endRow();
        }
        return width - padding * 2;
    }

}

const opcodeSpriteMappings: { [key: string]: [number, number, number, number] } = {
    'mov': [6, 0, 4, 2],
    'jmp': [6, 2, 4, 2],
    'cal': [6, 4, 4, 2],
    'ret': [6, 6, 4, 2],
    'cmp': [6, 8, 4, 2],
    'jmc': [6, 10, 4, 2],
    'add': [6, 12, 4, 2],
    'sub': [6, 14, 4, 2],
    'not': [6, 16, 4, 2],
    'and': [6, 18, 4, 2],
    'or': [6, 20, 4, 2],
    'xor': [6, 22, 4, 2],
    'wro': [6, 24, 4, 2],
    'rdi': [6, 26, 4, 2],
    'rst': [6, 28, 4, 2],
    'hlt': [6, 30, 4, 2],
    'str': [6, 34, 4, 2]
};

const compOpcodeSpriteMappings = [
    [13, 2, 3, 2],
    [16, 2, 3, 2],
    [13, 4, 3, 2],
    [13, 6, 3, 2],
    [16, 4, 3, 2],
    [16, 6, 3, 2]
];

const registerXSpriteMapping = [13, 0, 3, 2];
const registerYSpriteMapping = [16, 0, 3, 2];

export class Computer {

    private _gui?: SpriteSheet;
    private _font?: Font;

    private _vm?: VirtualMachine;
    private _program: Value[] = [];

    public get vm(): VirtualMachine { return this._vm!; }

    public async load() {
        this._gui = await SpriteSheet.fromFile('computer.png', 22, 40);
        this._font = await Font.fromFile('term-font.png', 'term-font-data.json');
        this._vm = new VirtualMachine();

        const testScript = `
            mov 10, #X
        _loop:
            sub 1, #X
            cmp #X, 4
            jmc _loop

            hlt
        `;
        const pr = new Parser(testScript);
        pr.parseAll();
        // this._vm.loadProgram(pr.programOutput);

        this._program = pr.programOutput;
    }

    public render(ctx: Renderer2D): void {
        const screenX = ctx.width / 2 - screenWidth / 2;
        const screenY = ctx.height / 2 - screenHeight / 2;

        const ly = new Layout(screenX, screenY, screenWidth, screenHeight);

        this.drawBigBox(ctx, ly.x, ly.y, screenWidth, screenHeight, textColor);
        ly.beginRow(22);
        ctx.drawText(this._font!, 'Programmer', ly.x + 8, ly.y + 21, textColor, bigText);
        ly.endRow();

        ly.beginRow(10);
        this.drawDivider(ctx, ly.x, ly.y, screenWidth, textColor);
        ly.endRow();

        let i = 0;
        while (i < this._program.length) {
            const opcode = this._program[i++];
            if (opcode.type == DataType.OpCode) {
                const strOpCode = opCodeToString(opcode.value as OpCode);

                ly.beginRow(17);
                ly.cell(24);
                const opcodeSprite = opcodeSpriteMappings[strOpCode];
                ctx.multiSprite(this._gui!, ly.x, ly.y, opcodeSprite[0], opcodeSprite[1], opcodeSprite[2], opcodeSprite[3], 99, textColor);
                ly.cell(8);
                if (i < this._program.length) {
                    while (this._program[i].type != DataType.OpCode && this._program[i].type != DataType.Label) {
                        const param = this._program[i];
                        switch (param.type) {
                            case DataType.Register: {
                                ly.cell(24 - 3);
                                const spr = param.value == Register.X ? registerXSpriteMapping : registerYSpriteMapping;
                                ctx.multiSprite(this._gui!, ly.x, ly.y, spr[0], spr[1], spr[2], spr[3], 99, textColor);
                            } break;
                            case DataType.Immediate: {
                                if (opcode.value == OpCode.Cmp) {
                                    ly.cell(24 - 3);
                                    const spr = compOpcodeSpriteMappings[param.value];
                                    ctx.multiSprite(this._gui!, ly.x, ly.y, spr[0], spr[1], spr[2], spr[3], 99, textColor);
                                } else {
                                    const valueStr = param.name ? param.name : param.value + '';
                                    const tw = ctx.textWidth(this._font!, valueStr, smallText);
                                    const widthBlocks = Math.max(1, Math.floor(tw / 8));
                                    ly.cell(24 - 3);
                                    const x = ly.x, y = ly.y;
                                    ctx.sprite(this._gui!, 10, new Vector4(ly.x, ly.y, 8, 8), 99, textColor);
                                    ctx.sprite(this._gui!, 32, new Vector4(ly.x, ly.y + 8, 8, 8), 99, textColor);
                                    ctx.sprite(this._gui!, 12, new Vector4(ly.x + widthBlocks * 8 + 8, ly.y, 8, 8), 99, textColor);
                                    ctx.sprite(this._gui!, 34, new Vector4(ly.x + widthBlocks * 8 + 8, ly.y + 8, 8, 8), 99, textColor);
                                    for (let i = 0; i < widthBlocks; i++) {
                                        ctx.sprite(this._gui!, 11, new Vector4(ly.x + i * 8 + 8, ly.y, 8, 8), 99, textColor);
                                        ctx.sprite(this._gui!, 33, new Vector4(ly.x + i * 8 + 8, ly.y + 8, 8, 8), 99, textColor);
                                    }
                                    ctx.drawText(this._font!, valueStr, x + 5, y + 12, textColorSecondary, mediumText);
                                }
                            } break;
                        }
                        i++;
                    }
                }
                
                ly.endRow();
            } else if (opcode.type == DataType.Label) {
                const text = opcode.name ?? '???';
                const tw = ctx.textWidth(this._font!, text, mediumText);

                ly.beginRow(17);
                ly.cell(10);
                const x = ly.x, y = ly.y;
                this.drawBox(ctx, ly.x, ly.y, tw, 1, textColorWhite);
                ctx.drawText(this._font!, text, x + 8, y + 11, textColorWhite, mediumText);
                ly.endRow();
            }
        }
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