import { Renderer } from "../graphics/renderer";
import { Matrix3, Matrix4, Quaternion, Vector3 } from "@math.gl/core";

export abstract class GameObject {
    public localPosition: Vector3;
    public localRotation: Quaternion;
    public localScale: Vector3;

    private _previousPosition: Vector3;
    private _previousRotation: Quaternion;
    private _previousScale: Vector3;

    private _parent: GameObject | null;

    // Compare the local transformation with the previous local transformation
    // recalculate the model matrix if the local transformation has changed
    private _modelMatrix: Matrix4;

    private _life: number; // Life time in seconds
    private _lifeTime: number; // Max life time in seconds
    private _dead: boolean = false;
    private _created: boolean = false;

    public tag: string = "";

    constructor() {
        this.localPosition = new Vector3(0, 0, 0);
        this.localRotation = new Quaternion(0, 0, 0, 1);
        this.localScale = new Vector3(1, 1, 1);
        this._previousPosition = new Vector3(0, 0, 0);
        this._previousRotation = new Quaternion(0, 0, 0, 1);
        this._previousScale = new Vector3(1, 1, 1);
        this._modelMatrix = new Matrix4().identity();
        this._parent = null;
        this._life = 0;
        this._lifeTime = -1;
    }

    public get modelMatrix(): Matrix4 {
        if (this._parent) {
            return this._parent.modelMatrix.clone().multiplyLeft(this._modelMatrix);
        }
        return this._modelMatrix;
    }

    public get globalPosition(): Vector3 {
        return new Vector3(this.modelMatrix.transformAsPoint(new Vector3(0, 0, 0)));
    }

    public get dead(): boolean { return this._dead; }

    public get forward(): Vector3 {
        return new Vector3(this.modelMatrix.transformAsVector(new Vector3(0, 0, 1)));
    }

    public get right(): Vector3 {
        return new Vector3(this.modelMatrix.transformAsVector(new Vector3(1, 0, 0)));
    }

    public get up(): Vector3 {
        return new Vector3(this.modelMatrix.transformAsVector(new Vector3(0, 1, 0)));
    }

    public lookAt(at: Vector3): void {
        this._updateModelMatrix();
        
        const fwd = new Vector3(0, 0, 1);
        const forward = at.clone().subtract(this.globalPosition).normalize();
        const dot = fwd.dot(forward);
        if (Math.abs(dot + 1.0) < 1e-6) {
            this.localRotation.set(0.0, 1.0, 0.0, Math.PI);
            return;
        }
        
        if (Math.abs(dot - 1.0) < 1e-6) {
            this.localRotation.identity();
            return;
        }

        const rotAngle = Math.acos(dot);
        let rotAxis = fwd.clone().cross(forward).normalize();
        this.localRotation.setFromAxisAngle(rotAxis, rotAngle);
    }

    public alignToVector(from: Vector3, to: Vector3): void {
        this._updateModelMatrix();

        function clamp(value: number, min: number, max: number): number {
            return Math.min(Math.max(value, min), max);
        }

        const axis = from.clone().cross(to).normalize();

        const denom = Math.sqrt(from.lengthSq() * to.lengthSq());
        const dot = clamp(from.dot(to) / denom, -1, 1);
        const angle = denom < 1e-15 ? 0.0 : Math.acos(dot);

        this.localRotation.setFromAxisAngle(axis, angle);
    }

    public setParent(parent: GameObject | null, maintainTransformation: boolean = true): void {
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

    public destroy(lifeTime: number = 0): void {
        this._lifeTime = lifeTime;
    }

    public abstract onCreate(): void;
    public abstract onDestroy(): void;

    public onUpdate(deltaTime: number): void {
        this._updateModelMatrix();

        if (!this._created) {
            this.onCreate();
            this._created = true;
        }

        if (this._lifeTime > 0 && !this._dead) {
            this._life += deltaTime;
            if (this._life >= this._lifeTime) {
                this.onDestroy();
                this._dead = true;
            }
        }
    }

    public abstract onRender(renderer: Renderer): void;

    private _updateModelMatrix(): void {
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