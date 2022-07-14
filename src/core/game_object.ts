import { Renderer } from "../graphics/renderer";
import { Matrix4, Vector3 } from "@math.gl/core";

export abstract class GameObject {
    public localPosition: Vector3;
    public localRotation: Vector3;
    public localScale: Vector3;

    private _previousPosition: Vector3;
    private _previousRotation: Vector3;
    private _previousScale: Vector3;

    private _parent: GameObject | null;

    // Compare the local transformation with the previous local transformation
    // recalculate the model matrix if the local transformation has changed
    private _modelMatrix: Matrix4;

    private _life: number; // Life time in seconds
    private _lifeTime: number; // Max life time in seconds
    private _dead: boolean = false;
    private _created: boolean = false;

    constructor() {
        this.localPosition = new Vector3(0, 0, 0);
        this.localRotation = new Vector3(0, 0, 0);
        this.localScale = new Vector3(1, 1, 1);
        this._previousPosition = new Vector3(0, 0, 0);
        this._previousRotation = new Vector3(0, 0, 0);
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
            this._modelMatrix.multiplyLeft(new Matrix4().translate(this.localPosition));
            this._modelMatrix.multiplyLeft(new Matrix4().rotateX(this.localRotation.x));
            this._modelMatrix.multiplyLeft(new Matrix4().rotateY(this.localRotation.y));
            this._modelMatrix.multiplyLeft(new Matrix4().rotateZ(this.localRotation.z));
            this._modelMatrix.multiplyLeft(new Matrix4().scale(this.localScale));
            this._previousPosition = position.clone();
            this._previousRotation = rotation.clone();
            this._previousScale = scale.clone();
        }
    }
    
}