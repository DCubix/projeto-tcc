import { Renderer } from "../graphics/renderer";
import { Component } from "./component";
import { Transform } from "./transform";

export abstract class GameObject extends Transform {

    private _life: number; // Life time in seconds
    private _lifeTime: number; // Max life time in seconds
    private _dead: boolean = false;
    private _created: boolean = false;

    public tag: string = "";

    private _components: Component[] = [];

    constructor() {
        super();
        this._life = 0;
        this._lifeTime = -1;
    }

    public get dead(): boolean { return this._dead; }

    public addComponent(component: Component): void {
        component.owner = this;
        this._components.push(component);
    }

    public destroy(lifeTime: number = 0): void {
        this._lifeTime = lifeTime;
    }

    public abstract onCreate(): void;
    public abstract onDestroy(): void;

    public onUpdate(deltaTime: number): void {
        this.updateModelMatrix();

        if (!this._created) {
            this.createEvent();
            this._created = true;
        }

        if (this._lifeTime > 0 && !this._dead) {
            this._life += deltaTime;
            if (this._life >= this._lifeTime) {
                this.destroyEvent();
                this._dead = true;
            }
        }
    }

    public abstract onRender(renderer: Renderer): void;

    private createEvent() {
        this.onCreate();
        this._components.forEach(component => component.onCreate());
    }

    private destroyEvent() {
        this._components.forEach(component => component.onDestroy());
        this.onDestroy();
    }

    public update(deltaTime: number) {
        this.onUpdate(deltaTime);
        this._components.forEach(component => component.onUpdate(deltaTime));
    }
    
}