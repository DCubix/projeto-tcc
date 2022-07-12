import { Epsilon } from "./constants";

export class Vec3 {
    private _value: [number, number, number];

    constructor(x: number, y: number, z: number) {
        this._value = [x, y, z];
    }

    public get x(): number { return this._value[0]; }
    public get y(): number { return this._value[1]; }
    public get z(): number { return this._value[2]; }
    public set x(x: number) { this._value[0] = x; }
    public set y(y: number) { this._value[1] = y; }
    public set z(z: number) { this._value[2] = z; }
    public get gl(): Array<number> {
        return [this.x, this.y, this.z];
    }

    public get lengthSq(): number {
        return Vec3.dot(this, this);
    }

    public get length(): number {
        return Math.sqrt(this.lengthSq);
    }

    public static add(a: Vec3, b: Vec3): Vec3 {
        return new Vec3(a.x + b.x, a.y + b.y, a.z + b.z);
    }

    public static sub(a: Vec3, b: Vec3): Vec3 {
        return new Vec3(a.x - b.x, a.y - b.y, a.z - b.z);
    }

    public static mul(a: Vec3, scalar: number): Vec3 {
        return new Vec3(a.x * scalar, a.y * scalar, a.z * scalar);
    }

    public static div(a: Vec3, scalar: number): Vec3 {
        return new Vec3(a.x / scalar, a.y / scalar, a.z / scalar);
    }

    public static dot(a: Vec3, b: Vec3): number {
        return a.x * b.x + a.y * b.y + a.z * b.z;
    }

    public static normalize(a: Vec3): Vec3 {
        return Vec3.div(a, a.length);
    }

    public static distance(a: Vec3, b: Vec3): number {
        return Vec3.sub(a, b).length;
    }

    public static cross(a: Vec3, b: Vec3): Vec3 {
        return new Vec3(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
    }

    public static lerp(a: Vec3, b: Vec3, t: number): Vec3 {
        return Vec3.add(Vec3.mul(a, 1 - t), Vec3.mul(b, t));
    }

    public add(b: Vec3): Vec3 {
        this.x += b.x; this.y += b.y; this.z += b.z;
        return this;
    }

    public sub(b: Vec3): Vec3 {
        this.x -= b.x; this.y -= b.y; this.z -= b.z;
        return this;
    }

    public mul(scalar: number): Vec3 {
        this.x *= scalar; this.y *= scalar; this.z *= scalar;
        return this;
    }

    public div(scalar: number): Vec3 {
        this.x /= scalar; this.y /= scalar; this.z /= scalar;
        return this;
    }

    public copy(): Vec3 {
        return new Vec3(this.x, this.y, this.z);
    }

    public equals(b: Vec3): boolean {
        const diff = Vec3.sub(this, b);
        return Math.abs(diff.x) < Epsilon &&
                Math.abs(diff.y) < Epsilon &&
                Math.abs(diff.z) < Epsilon;
    }

}