export class Vec4 {
    public x: number;
    public y: number;
    public z: number;
    public w: number;

    constructor(x: number, y: number, z: number, w: number) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }

    add(other: Vec4): Vec4 {
        return new Vec4(this.x + other.x, this.y + other.y, this.z + other.z, this.w + other.w);
    }

    sub(other: Vec4): Vec4 {
        return new Vec4(this.x - other.x, this.y - other.y, this.z - other.z, this.w - other.w);
    }

    mul(scalar: number): Vec4 {
        return new Vec4(this.x * scalar, this.y * scalar, this.z * scalar, this.w * scalar);
    }

    div(scalar: number): Vec4 {
        return new Vec4(this.x / scalar, this.y / scalar, this.z / scalar, this.w / scalar);
    }

    dot(other: Vec4): number {
        return this.x * other.x + this.y * other.y + this.z * other.z + this.w * other.w;
    }

    lerp(other: Vec4, t: number): Vec4 {
        return this.add(other.sub(this).mul(t));
    }

    length(): number {
        return Math.sqrt(this.dot(this));
    }

    normalize(): Vec4 {
        return this.div(this.length());
    }

    static zero(): Vec4 {
        return new Vec4(0, 0, 0, 0);
    }

    static one(): Vec4 {
        return new Vec4(1, 1, 1, 1);
    }

}