import { Vec3, Vec4 } from './math';

export class Mat4 {
    public values: Float32Array;

    constructor(values: number[] = [1, 0, 0, 0, 0, 1 ,0 ,0, 0, 0, 1, 0, 0, 0, 0, 1]) {
        this.values = new Float32Array(values);
    }

    public static identity(): Mat4 {
        return new Mat4();
    }

    public static translation(x: number, y: number, z: number): Mat4 {
        return new Mat4([
            1, 0, 0, x,
            0, 1, 0, y,
            0, 0, 1, z,
            0, 0, 0, 1
        ]);
    }

    public static scaling(x: number, y: number, z: number): Mat4 {
        return new Mat4([
            x, 0, 0, 0,
            0, y, 0, 0,
            0, 0, z, 0,
            0, 0, 0, 1
        ]);
    }

    public static rotationX(angle: number): Mat4 {
        const c = Math.cos(angle);
        const s = Math.sin(angle);

        return new Mat4([
            1, 0, 0, 0,
            0, c, -s, 0,
            0, s, c, 0,
            0, 0, 0, 1
        ]);
    }

    public static rotationY(angle: number): Mat4 {
        const c = Math.cos(angle);
        const s = Math.sin(angle);

        return new Mat4([
            c, 0, s, 0,
            0, 1, 0, 0,
            -s, 0, c, 0,
            0, 0, 0, 1
        ]);
    }

    public static rotationZ(angle: number): Mat4 {
        const c = Math.cos(angle);
        const s = Math.sin(angle);

        return new Mat4([
            c, -s, 0, 0,
            s, c, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
    }

    public static perspective(fieldOfView: number, aspectRatio: number, near: number, far: number): Mat4 {
        const f = 1 / Math.tan(fieldOfView / 2);

        return new Mat4([
            f / aspectRatio, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (far + near) / (near - far), (2 * far * near) / (near - far),
            0, 0, -1, 0
        ]);
    }

    public static orthographic(left: number, right: number, bottom: number, top: number, near: number, far: number): Mat4 {
        return new Mat4([
            2 / (right - left), 0, 0, (right + left) / (left - right),
            0, 2 / (top - bottom), 0, (top + bottom) / (bottom - top),
            0, 0, 2 / (far - near), (far + near) / (near - far),
            0, 0, 0, 1
        ]);
    }

    public static lookAt(position: Vec3, target: Vec3, up: Vec3): Mat4 {
        const z = position.sub(target).normalize();
        const x = up.normalize().cross(z).normalize();
        const y = z.cross(x).normalize();

        return new Mat4([
            x.x, x.y, x.z, -x.dot(position),
            y.x, y.y, y.z, -y.dot(position),
            z.x, z.y, z.z, -z.dot(position),
            0, 0, 0, 1
        ]);
    }

    mul(other: Mat4): Mat4 {
        const result = new Array(16);

        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                let sum = 0;

                for (let k = 0; k < 4; k++) {
                    sum += this.values[i * 4 + k] * other.values[k * 4 + j];
                }

                result[i * 4 + j] = sum;
            }
        }

        return new Mat4(result);
    }

    mulScalar(scalar: number): Mat4 {
        const result = new Array(16);

        for (let i = 0; i < 16; i++) {
            result[i] = this.values[i] * scalar;
        }

        return new Mat4(result);
    }

    mulVec3(vec: Vec3): Vec3 {
        const x = vec.x;
        const y = vec.y;
        const z = vec.z;

        return new Vec3(
            this.values[0] * x + this.values[4] * y + this.values[8] * z + this.values[12],
            this.values[1] * x + this.values[5] * y + this.values[9] * z + this.values[13],
            this.values[2] * x + this.values[6] * y + this.values[10] * z + this.values[14]
        );
    }

    mulVec4(vec: Vec4): Vec4 {
        const x = vec.x;
        const y = vec.y;
        const z = vec.z;
        const w = vec.w;

        return new Vec4(
            this.values[0] * x + this.values[4] * y + this.values[8] * z + this.values[12] * w,
            this.values[1] * x + this.values[5] * y + this.values[9] * z + this.values[13] * w,
            this.values[2] * x + this.values[6] * y + this.values[10] * z + this.values[14] * w,
            this.values[3] * x + this.values[7] * y + this.values[11] * z + this.values[15] * w
        );
    }

    transpose(): Mat4 {
        const result = new Array(16);

        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                result[i * 4 + j] = this.values[j * 4 + i];
            }
        }

        return new Mat4(result);
    }

    determinant(): number {
        const a = this.values[0] * this.values[5] - this.values[4] * this.values[1];
        const b = this.values[0] * this.values[6] - this.values[4] * this.values[2];
        const c = this.values[0] * this.values[7] - this.values[4] * this.values[3];
        const d = this.values[1] * this.values[6] - this.values[5] * this.values[2];
        const e = this.values[1] * this.values[7] - this.values[5] * this.values[3];
        const f = this.values[2] * this.values[7] - this.values[6] * this.values[3];

        return a * this.values[10] * this.values[15] +
                b * this.values[11] * this.values[14] +
                c * this.values[9] * this.values[15] +
                d * this.values[11] * this.values[13] +
                e * this.values[9] * this.values[14] +
                f * this.values[10] * this.values[13] -
                a * this.values[11] * this.values[12] -
                b * this.values[9] * this.values[15] -
                c * this.values[10] * this.values[14] -
                d * this.values[8] * this.values[15] -
                e * this.values[11] * this.values[12] -
                f * this.values[9] * this.values[13];
    }

    inverse(): Mat4 {
        const determinant = this.determinant();

        if (!determinant) {
            return new Mat4();
        }

        const result = new Array(16);

        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                let sum = 0;

                for (let k = 0; k < 4; k++) {
                    sum += (i === k ? 1 : 0) * (j === k ? 1 : 0) * this.values[k * 4 + (j + 1) % 4] +
                            (i === k ? 1 : 0) * (j === (k + 1) % 4 ? 1 : 0) * this.values[k * 4 + j] +
                            (i === (k + 1) % 4 ? 1 : 0) * (j === k ? 1 : 0) * this.values[(k + 1) * 4 + j];
                }

                result[i * 4 + j] = sum / determinant;
            }
        }

        return new Mat4(result);
    }

}