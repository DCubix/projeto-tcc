import { Vec3 } from "./vec3";
import { Vec4 } from "./vec4";

export class Mat4 {
    private _value: Float32Array;

    constructor(values?: Array<number>) {
        this._value = new Float32Array(16);
        if (values) {
            for (let i = 0; i < 16; i++) {
                this._value[i] = values[i];
            }
        }
    }

    public get gl(): Float32Array {
        return this._value;
    }

    public static identity(): Mat4 {
        return new Mat4([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
    }

    public static translation(pos: Vec3): Mat4 {
        const x = pos.x, y = pos.y, z = pos.z;
        return new Mat4([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            x, y, z, 1
        ]);
    }

    public static rotationX(angle: number): Mat4 {
        let c = Math.cos(angle);
        let s = Math.sin(angle);
        return new Mat4([
            1, 0, 0, 0,
            0, c, s, 0,
            0, -s, c, 0,
            0, 0, 0, 1
        ]);
    }

    public static rotationY(angle: number): Mat4 {
        let c = Math.cos(angle);
        let s = Math.sin(angle);
        return new Mat4([
            c, 0, -s, 0,
            0, 1, 0, 0,
            s, 0, c, 0,
            0, 0, 0, 1
        ]);
    }

    public static rotationZ(angle: number): Mat4 {
        let c = Math.cos(angle);
        let s = Math.sin(angle);
        return new Mat4([
            c, s, 0, 0,
            -s, c, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
    }

    public static scale(scale: Vec3): Mat4 {
        const x = scale.x, y = scale.y, z = scale.z;
        return new Mat4([
            x, 0, 0, 0,
            0, y, 0, 0,
            0, 0, z, 0,
            0, 0, 0, 1
        ]);
    }

    public static perspective(fov: number, aspect: number, near: number, far: number): Mat4 {
        let f = 1 / Math.tan(fov / 2);
        return new Mat4([
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (far + near) / (near - far), -1,
            0, 0, (2 * far * near) / (near - far), 0
        ]);
    }

    public static orthographic(left: number, right: number, bottom: number, top: number, near: number, far: number): Mat4 {
        return new Mat4([
            2 / (right - left), 0, 0, 0,
            0, 2 / (top - bottom), 0, 0,
            0, 0, -2 / (far - near), 0,
            -(right + left) / (right - left), -(top + bottom) / (top - bottom), -(far + near) / (far - near), 1
        ]);
    }

    public static lookAt(eye: Vec3, center: Vec3, up: Vec3): Mat4 {
        let f = Vec3.normalize(Vec3.sub(center, eye));
        let s = Vec3.normalize(Vec3.cross(f, up));
        let u = Vec3.cross(s, f);
        return new Mat4([
            s.x, u.x, -f.x, 0,
            s.y, u.y, -f.y, 0,
            s.z, u.z, -f.z, 0,
            -Vec3.dot(s, eye), -Vec3.dot(u, eye), Vec3.dot(f, eye), 1
        ]);
    }

    public static axisAngle(axis: Vec3, angle: number): Mat4 {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        const t = 1 - c;
        const x = axis.x, y = axis.y, z = axis.z;
        return new Mat4([
            t * x * x + c, t * x * y + s * z, t * x * z - s * y, 0,
            t * x * y - s * z, t * y * y + c, t * y * z + s * x, 0,
            t * x * z + s * y, t * y * z - s * x, t * z * z + c, 0,
            0, 0, 0, 1
        ]);
    }

    public static eulerRotation(rot: Vec3): Mat4 {
        return Mat4.mul(Mat4.mul(Mat4.rotationX(rot.x), Mat4.rotationY(rot.y)), Mat4.rotationZ(rot.z));
    }

    public static transpose(a: Mat4): Mat4 {
        return new Mat4([
            a._value[0], a._value[4], a._value[8], a._value[12],
            a._value[1], a._value[5], a._value[9], a._value[13],
            a._value[2], a._value[6], a._value[10], a._value[14],
            a._value[3], a._value[7], a._value[11], a._value[15]
        ]);
    }

    public static invert(a: Mat4): Mat4 {
        let a00 = a._value[0], a01 = a._value[1], a02 = a._value[2], a03 = a._value[3],
            a10 = a._value[4], a11 = a._value[5], a12 = a._value[6], a13 = a._value[7],
            a20 = a._value[8], a21 = a._value[9], a22 = a._value[10], a23 = a._value[11],
            a30 = a._value[12], a31 = a._value[13], a32 = a._value[14], a33 = a._value[15],

            b00 = a00 * a11 - a01 * a10,
            b01 = a00 * a12 - a02 * a10,
            b02 = a00 * a13 - a03 * a10,
            b03 = a01 * a12 - a02 * a11,
            b04 = a01 * a13 - a03 * a11,
            b05 = a02 * a13 - a03 * a12,
            b06 = a20 * a31 - a21 * a30,
            b07 = a20 * a32 - a22 * a30,
            b08 = a20 * a33 - a23 * a30,
            b09 = a21 * a32 - a22 * a31,
            b10 = a21 * a33 - a23 * a31,
            b11 = a22 * a33 - a23 * a32,

            // Calculate the inversion
            det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
        if (!det) {
            return Mat4.identity();
        }
        det = 1.0 / det;
        return new Mat4([
            (a11 * b11 - a12 * b10 + a13 * b09) * det,
            (a02 * b10 - a01 * b11 - a03 * b09) * det,
            (a31 * b05 - a32 * b04 + a33 * b03) * det,
            (a22 * b04 - a21 * b05 - a23 * b03) * det,
            (a12 * b08 - a10 * b11 - a13 * b07) * det,
            (a00 * b11 - a02 * b08 + a03 * b07) * det,
            (a32 * b02 - a30 * b05 - a33 * b01) * det,
            (a20 * b05 - a22 * b02 + a23 * b01) * det,
            (a10 * b10 - a11 * b08 + a13 * b06) * det,
            (a01 * b08 - a00 * b10 - a03 * b06) * det,
            (a30 * b04 - a31 * b02 + a33 * b00) * det,
            (a21 * b02 - a20 * b04 - a23 * b00) * det,
            (a11 * b07 - a10 * b09 - a12 * b06) * det,
            (a00 * b09 - a01 * b07 + a02 * b06) * det
        ]);
    }

    public static mul(a: Mat4, b: Mat4): Mat4 {
        let a00 = a._value[0 * 4 + 0];
        let a01 = a._value[0 * 4 + 1];
        let a02 = a._value[0 * 4 + 2];
        let a03 = a._value[0 * 4 + 3];
        let a10 = a._value[1 * 4 + 0];
        let a11 = a._value[1 * 4 + 1];
        let a12 = a._value[1 * 4 + 2];
        let a13 = a._value[1 * 4 + 3];
        let a20 = a._value[2 * 4 + 0];
        let a21 = a._value[2 * 4 + 1];
        let a22 = a._value[2 * 4 + 2];
        let a23 = a._value[2 * 4 + 3];
        let a30 = a._value[3 * 4 + 0];
        let a31 = a._value[3 * 4 + 1];
        let a32 = a._value[3 * 4 + 2];
        let a33 = a._value[3 * 4 + 3];
        let b00 = b._value[0 * 4 + 0];
        let b01 = b._value[0 * 4 + 1];
        let b02 = b._value[0 * 4 + 2];
        let b03 = b._value[0 * 4 + 3];
        let b10 = b._value[1 * 4 + 0];
        let b11 = b._value[1 * 4 + 1];
        let b12 = b._value[1 * 4 + 2];
        let b13 = b._value[1 * 4 + 3];
        let b20 = b._value[2 * 4 + 0];
        let b21 = b._value[2 * 4 + 1];
        let b22 = b._value[2 * 4 + 2];
        let b23 = b._value[2 * 4 + 3];
        let b30 = b._value[3 * 4 + 0];
        let b31 = b._value[3 * 4 + 1];
        let b32 = b._value[3 * 4 + 2];
        let b33 = b._value[3 * 4 + 3];
        return new Mat4([
            a00 * b00 + a01 * b10 + a02 * b20 + a03 * b30,
            a00 * b01 + a01 * b11 + a02 * b21 + a03 * b31,
            a00 * b02 + a01 * b12 + a02 * b22 + a03 * b32,
            a00 * b03 + a01 * b13 + a02 * b23 + a03 * b33,
            a10 * b00 + a11 * b10 + a12 * b20 + a13 * b30,
            a10 * b01 + a11 * b11 + a12 * b21 + a13 * b31,
            a10 * b02 + a11 * b12 + a12 * b22 + a13 * b32,
            a10 * b03 + a11 * b13 + a12 * b23 + a13 * b33,
            a20 * b00 + a21 * b10 + a22 * b20 + a23 * b30,
            a20 * b01 + a21 * b11 + a22 * b21 + a23 * b31,
            a20 * b02 + a21 * b12 + a22 * b22 + a23 * b32,
            a20 * b03 + a21 * b13 + a22 * b23 + a23 * b33,
            a30 * b00 + a31 * b10 + a32 * b20 + a33 * b30,
            a30 * b01 + a31 * b11 + a32 * b21 + a33 * b31,
            a30 * b02 + a31 * b12 + a32 * b22 + a33 * b32,
            a30 * b03 + a31 * b13 + a32 * b23 + a33 * b33
        ]);
    }

    public static mulVec4(a: Mat4, b: Vec4): Vec4 {
        let a00 = a._value[0 * 4 + 0];
        let a01 = a._value[0 * 4 + 1];
        let a02 = a._value[0 * 4 + 2];
        let a03 = a._value[0 * 4 + 3];
        let a10 = a._value[1 * 4 + 0];
        let a11 = a._value[1 * 4 + 1];
        let a12 = a._value[1 * 4 + 2];
        let a13 = a._value[1 * 4 + 3];
        let a20 = a._value[2 * 4 + 0];
        let a21 = a._value[2 * 4 + 1];
        let a22 = a._value[2 * 4 + 2];
        let a23 = a._value[2 * 4 + 3];
        let a30 = a._value[3 * 4 + 0];
        let a31 = a._value[3 * 4 + 1];
        let a32 = a._value[3 * 4 + 2];
        let a33 = a._value[3 * 4 + 3];
        let b0 = b.value[0];
        let b1 = b.value[1];
        let b2 = b.value[2];
        let b3 = b.value[3];
        return new Vec4(
            a00 * b0 + a01 * b1 + a02 * b2 + a03 * b3,
            a10 * b0 + a11 * b1 + a12 * b2 + a13 * b3,
            a20 * b0 + a21 * b1 + a22 * b2 + a23 * b3,
            a30 * b0 + a31 * b1 + a32 * b2 + a33 * b3
        );
    }

    public static mulVec3(a: Mat4, b: Vec3, w: number = 1): Vec3 {
        return this.mulVec4(a, new Vec4(b.x, b.y, b.z, w)).xyz;
    }

}