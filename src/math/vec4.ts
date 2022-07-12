import { Epsilon } from "./constants";
import { Vec3 } from "./vec3";

export class Vec4 {
    private _value: [number, number, number, number];

    constructor(x: number, y: number, z: number, w: number) {
        this._value = [x, y, z, w];
    }

    public get x(): number { return this._value[0]; }
    public get y(): number { return this._value[1]; }
    public get z(): number { return this._value[2]; }
    public get w(): number { return this._value[3]; }
    public set x(x: number) { this._value[0] = x; }
    public set y(y: number) { this._value[1] = y; }
    public set z(z: number) { this._value[2] = z; }
    public set w(w: number) { this._value[3] = w; }
    public get gl(): Array<number> {
        return [this.x, this.y, this.z, this.w];
    }

    public get value(): Array<number> {
        return this._value;
    }

    public get xyz(): Vec3 {
        return new Vec3(this.x, this.y, this.z);
    }

    public get lengthSq(): number {
        return Vec4.dot(this, this);
    }

    public get length(): number {
        return Math.sqrt(this.lengthSq);
    }

    public static add(a: Vec4, b: Vec4): Vec4 {
        return new Vec4(a.x + b.x, a.y + b.y, a.z + b.z, a.w + b.w);
    }

    public static sub(a: Vec4, b: Vec4): Vec4 {
        return new Vec4(a.x - b.x, a.y - b.y, a.z - b.z, a.w - b.w);
    }

    public static mul(a: Vec4, scalar: number): Vec4 {
        return new Vec4(a.x * scalar, a.y * scalar, a.z * scalar, a.w * scalar);
    }

    public static div(a: Vec4, scalar: number): Vec4 {
        return new Vec4(a.x / scalar, a.y / scalar, a.z / scalar, a.w / scalar);
    }

    public static dot(a: Vec4, b: Vec4): number {
        return a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w;
    }

    public static normalize(a: Vec4): Vec4 {
        return Vec4.div(a, a.length);
    }

    public static lerp(a: Vec4, b: Vec4, t: number): Vec4 {
        return Vec4.add(Vec4.mul(a, 1 - t), Vec4.mul(b, t));
    }

    public add(b: Vec4): Vec4 {
        this.x += b.x; this.y += b.y; this.z += b.z; this.w += b.w;
        return this;
    }

    public sub(b: Vec4): Vec4 {
        this.x -= b.x; this.y -= b.y; this.z -= b.z; this.w -= b.w;
        return this;
    }

    public mul(scalar: number): Vec4 {
        this.x *= scalar; this.y *= scalar; this.z *= scalar; this.w *= scalar;
        return this;
    }

    public div(scalar: number): Vec4 {
        this.x /= scalar; this.y /= scalar; this.z /= scalar; this.w /= scalar;
        return this;
    }

    public copy(): Vec4 {
        return new Vec4(this.x, this.y, this.z, this.w);
    }

    public equals(b: Vec4): boolean {
        const diff = Vec4.sub(this, b);
        return Math.abs(diff.x) < Epsilon &&
                Math.abs(diff.y) < Epsilon &&
                Math.abs(diff.z) < Epsilon &&
                Math.abs(diff.w) < Epsilon;
    }

}