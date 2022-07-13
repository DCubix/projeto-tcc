import { Renderer } from "../graphics/renderer";
import { Mat4 } from "../math/mat4";
import { Vec3 } from "../math/vec3";

export abstract class GameObject {
    public localPosition: Vec3;
    public localRotation: Vec3;
    public localScale: Vec3;

    private _previousPosition: Vec3;
    private _previousRotation: Vec3;
    private _previousScale: Vec3;

    private _parent: GameObject | null;

    // Compare the local transformation with the previous local transformation
    // recalculate the model matrix if the local transformation has changed
    private _modelMatrix: Mat4;

    private _life: number; // Life time in seconds
    private _lifeTime: number; // Max life time in seconds
    private _dead: boolean = false;
    private _created: boolean = false;

    constructor() {
        this.localPosition = new Vec3(0, 0, 0);
        this.localRotation = new Vec3(0, 0, 0);
        this.localScale = new Vec3(1, 1, 1);
        this._previousPosition = new Vec3(0, 0, 0);
        this._previousRotation = new Vec3(0, 0, 0);
        this._previousScale = new Vec3(1, 1, 1);
        this._modelMatrix = Mat4.identity();
        this._parent = null;
        this._life = 0;
        this._lifeTime = -1;
    }

    public get modelMatrix(): Mat4 {
        if (this._parent) {
            return Mat4.mul(this._parent.modelMatrix, this._modelMatrix);
        }
        return this._modelMatrix;
    }

    public get globalPosition(): Vec3 {
        return Mat4.mulVec3(this.modelMatrix, new Vec3(0, 0, 0), 1);
    }

    public get globalRotation(): Vec3 {
        return Mat4.mulVec3(this.modelMatrix, new Vec3(0, 0, 0), 0);
    }

    public get dead(): boolean { return this._dead; }

    public setParent(parent: GameObject | null, maintainTransformation: boolean = true): void {
        if (parent === null && maintainTransformation && this._parent !== null) {
            this.localPosition = this._parent.globalPosition;
            this.localRotation = this._parent.globalRotation;
        } 
        
        if (parent !== null) {
            this.localPosition.sub(parent.globalPosition);
            this.localRotation.sub(parent.globalRotation);
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
            this._modelMatrix = Mat4.identity();
            this._modelMatrix = Mat4.mul(this._modelMatrix, Mat4.translation(position));
            this._modelMatrix = Mat4.mul(this._modelMatrix, Mat4.eulerRotation(rotation));
            this._modelMatrix = Mat4.mul(this._modelMatrix, Mat4.scale(scale));
            this._previousPosition = position.copy();
            this._previousRotation = rotation.copy();
            this._previousScale = scale.copy();
        }
    }
    
}