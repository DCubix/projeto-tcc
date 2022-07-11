export class Vec3 {
    public x: number;
    public y: number;
    public z: number;

    constructor(x: number, y: number, z: number) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    add(other: Vec3): Vec3 {
        return new Vec3(this.x + other.x, this.y + other.y, this.z + other.z);
    }

    sub(other: Vec3): Vec3 {
        return new Vec3(this.x - other.x, this.y - other.y, this.z - other.z);
    }

    mul(scalar: number): Vec3 {
        return new Vec3(this.x * scalar, this.y * scalar, this.z * scalar);
    }

    div(scalar: number): Vec3 {
        return new Vec3(this.x / scalar, this.y / scalar, this.z / scalar);
    }

    dot(other: Vec3): number {
        return this.x * other.x + this.y * other.y + this.z * other.z;
    }

    lerp(other: Vec3, t: number): Vec3 {
        return this.add(other.sub(this).mul(t));
    }

    length(): number {
        return Math.sqrt(this.dot(this));
    }

    normalize(): Vec3 {
        return this.div(this.length());
    }

    static zero(): Vec3 {
        return new Vec3(0, 0, 0);
    }

    static one(): Vec3 {
        return new Vec3(1, 1, 1);
    }

    static up(): Vec3 {
        return new Vec3(0, 1, 0);
    }

    static down(): Vec3 {
        return new Vec3(0, -1, 0);
    }

    static left(): Vec3 {
        return new Vec3(-1, 0, 0);
    }

    static right(): Vec3 {
        return new Vec3(1, 0, 0);
    }

    static forward(): Vec3 {
        return new Vec3(0, 0, 1);
    }

    static backward(): Vec3 {
        return new Vec3(0, 0, -1);
    }

    cross(other: Vec3): Vec3 {
        return new Vec3(
            this.y * other.z - this.z * other.y,
            this.z * other.x - this.x * other.z,
            this.x * other.y - this.y * other.x
        );
    }

    static distance(a: Vec3, b: Vec3): number {
        return a.sub(b).length();
    }

}