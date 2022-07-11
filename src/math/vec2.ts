export class Vec2 {
    public x: number;
    public y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    add(other: Vec2): Vec2 {
        return new Vec2(this.x + other.x, this.y + other.y);
    }

    sub(other: Vec2): Vec2 {
        return new Vec2(this.x - other.x, this.y - other.y);
    }

    mul(scalar: number): Vec2 {
        return new Vec2(this.x * scalar, this.y * scalar);
    }

    div(scalar: number): Vec2 {
        return new Vec2(this.x / scalar, this.y / scalar);
    }

    dot(other: Vec2): number {
        return this.x * other.x + this.y * other.y;
    }

    lerp(other: Vec2, t: number): Vec2 {
        return this.add(other.sub(this).mul(t));
    }

    length(): number {
        return Math.sqrt(this.dot(this));
    }

    normalize(): Vec2 {
        return this.div(this.length());
    }

    static zero(): Vec2 {
        return new Vec2(0, 0);
    }

    static one(): Vec2 {
        return new Vec2(1, 1);
    }

    static up(): Vec2 {
        return new Vec2(0, 1);
    }

    static down(): Vec2 {
        return new Vec2(0, -1);
    }

    static left(): Vec2 {
        return new Vec2(-1, 0);
    }

    static right(): Vec2 {
        return new Vec2(1, 0);
    }

    static fromAngle(angle: number): Vec2 {
        return new Vec2(Math.cos(angle), Math.sin(angle));
    }

}