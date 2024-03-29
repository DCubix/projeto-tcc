import { Matrix4, Quaternion, Vector3 } from "@math.gl/core";

function orthoNormalize(normal: Vector3, tangent: Vector3) {
    normal.normalize();
    tangent.normalize();
    return tangent.cross(normal);
}

export class Transform {

    public localPosition: Vector3;
    public localRotation: Quaternion;
    public localScale: Vector3;

    private _previousPosition: Vector3;
    private _previousRotation: Quaternion;
    private _previousScale: Vector3;

    private _parent: Transform | null;

    // Compare the local transformation with the previous local transformation
    // recalculate the model matrix if the local transformation has changed
    private _modelMatrix: Matrix4;

    constructor() {
        this.localPosition = new Vector3(0, 0, 0);
        this.localRotation = new Quaternion(0, 0, 0, 1);
        this.localScale = new Vector3(1, 1, 1);
        this._previousPosition = new Vector3(0, 0, 0);
        this._previousRotation = new Quaternion(0, 0, 0, 1);
        this._previousScale = new Vector3(1, 1, 1);
        this._modelMatrix = new Matrix4().identity();
        this._parent = null;
    }

    public get modelMatrix(): Matrix4 {
        if (this._parent) {
            return this._parent.modelMatrix.clone().multiplyRight(this._modelMatrix);
        }
        return this._modelMatrix;
    }

    public get globalPosition(): Vector3 {
        return new Vector3(this.modelMatrix.transformAsPoint(new Vector3(0, 0, 0)));
    }

    public get forward(): Vector3 {
        return new Vector3(this.modelMatrix.transformAsVector(new Vector3(0, 0, 1)));
    }

    public get right(): Vector3 {
        return new Vector3(this.modelMatrix.transformAsVector(new Vector3(1, 0, 0)));
    }

    public get up(): Vector3 {
        return new Vector3(this.modelMatrix.transformAsVector(new Vector3(0, 1, 0)));
    }

    public lookAt(forward: Vector3, up: Vector3, factor: number = 1.0): void {
        this.updateModelMatrix();
        forward.normalize();
		const right = up.clone().cross(forward).normalize();
		up = forward.clone().cross(right).normalize();

        const ret = new Quaternion();
        ret.w = Math.sqrt(1.0 + right.x + up.y + forward.z) * 0.5;
        const w4_recip = 1.0 / (4.0 * ret.w);
        ret.x = (up.z - forward.y) * w4_recip;
        ret.y = (forward.x - right.z) * w4_recip;
        ret.z = (right.y - up.x) * w4_recip;
        if (factor >= 1.0) {
            this.localRotation = ret;
        } else {
            this.localRotation.slerp(ret, factor);
        }
    }

    public fromToRotation(from: Vector3, to: Vector3): void {
        this.updateModelMatrix();

        function clamp(value: number, min: number, max: number): number {
            return Math.min(Math.max(value, min), max);
        }

        const axis = from.clone().cross(to).normalize();

        const denom = Math.sqrt(from.lengthSq() * to.lengthSq());
        const dot = clamp(from.dot(to) / denom, -1, 1);
        const angle = denom < 1e-15 ? 0.0 : Math.acos(dot);

        this.localRotation.setFromAxisAngle(axis, angle);
    }

    public setParent(parent: Transform | null, maintainTransformation: boolean = true): void {
        if (this._parent == parent) {
            return;
        }

        if (parent === null && maintainTransformation && this._parent !== null) {
            this.localPosition = this._parent.globalPosition;
        } 
        
        if (parent !== null) {
            this.localPosition.subtract(parent.globalPosition);
        }
        this._parent = parent;
    }

    protected updateModelMatrix(): void {
        const position = this.localPosition;
        const rotation = this.localRotation;
        const scale = this.localScale;

        if (
            !position.equals(this._previousPosition) ||
            !rotation.equals(this._previousRotation) ||
            !scale.equals(this._previousScale)
        ) {
            this._modelMatrix = new Matrix4().identity();
            this._modelMatrix.multiplyRight(new Matrix4().translate(this.localPosition));
            this._modelMatrix.multiplyRight(new Matrix4().fromQuaternion(this.localRotation));
            this._modelMatrix.multiplyRight(new Matrix4().scale(this.localScale));
            this._previousPosition = position.clone();
            this._previousRotation = rotation.clone();
            this._previousScale = scale.clone();
        }
    }

}