import { Epsilon } from "./constants";

export class Vec2 {
    private _value: [number, number];

    constructor(x: number, y: number) {
        this._value = [x, y];
    }

    public get x(): number { return this._value[0]; }
    public get y(): number { return this._value[1]; }
    public set x(x: number) { this._value[0] = x; }
    public set y(y: number) { this._value[1] = y; }
    public get gl(): Array<number> {
        return [this.x, this.y];
    }

    public get lengthSq(): number {
        return Vec2.dot(this, this);
    }

    public get length(): number {
        return Math.sqrt(this.lengthSq);
    }

    public static add(a: Vec2, b: Vec2): Vec2 {
        return new Vec2(a.x + b.x, a.y + b.y);
    }

    public static sub(a: Vec2, b: Vec2): Vec2 {
        return new Vec2(a.x - b.x, a.y - b.y);
    }

    public static mul(a: Vec2, scalar: number): Vec2 {
        return new Vec2(a.x * scalar, a.y * scalar);
    }

    public static div(a: Vec2, scalar: number): Vec2 {
        return new Vec2(a.x / scalar, a.y / scalar);
    }

    public static dot(a: Vec2, b: Vec2): number {
        return a.x * b.x + a.y * b.y;
    }

    public static normalize(a: Vec2): Vec2 {
        return Vec2.div(a, a.length);
    }

    public static distance(a: Vec2, b: Vec2): number {
        return Vec2.sub(a, b).length;
    }

    public static rotation(angle: number): Vec2 {
        let c = Math.cos(angle);
        let s = Math.sin(angle);
        return new Vec2(c, s);
    }

    public static lerp(a: Vec2, b: Vec2, t: number): Vec2 {
        return Vec2.add(Vec2.mul(a, 1 - t), Vec2.mul(b, t));
    }

    public add(b: Vec2): Vec2 {
        this.x += b.x; this.y += b.y;
        return this;
    }

    public sub(b: Vec2): Vec2 {
        this.x -= b.x; this.y -= b.y;
        return this;
    }

    public mul(scalar: number): Vec2 {
        this.x *= scalar; this.y *= scalar;
        return this;
    }

    public div(scalar: number): Vec2 {
        this.x /= scalar; this.y /= scalar;
        return this;
    }

    public copy(): Vec2 {
        return new Vec2(this.x, this.y);
    }

    public equals(b: Vec2): boolean {
        const diff = Vec2.sub(this, b);
        return Math.abs(diff.x) < Epsilon &&
                Math.abs(diff.y) < Epsilon;
    }

}