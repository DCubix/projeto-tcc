import { Renderer } from "../graphics/renderer";
import { Transform } from "./transform";

export abstract class GameObject extends Transform {

    private _life: number; // Life time in seconds
    private _lifeTime: number; // Max life time in seconds
    private _dead: boolean = false;
    private _created: boolean = false;

    public tag: string = "";

    constructor() {
        super();
        this._life = 0;
        this._lifeTime = -1;
    }

    public get dead(): boolean { return this._dead; }

    public destroy(lifeTime: number = 0): void {
        this._lifeTime = lifeTime;
    }

    public abstract onCreate(): void;
    public abstract onDestroy(): void;

    public onUpdate(deltaTime: number): void {
        this.updateModelMatrix();

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
    
}