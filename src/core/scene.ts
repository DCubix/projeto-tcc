import { Vector3 } from "@math.gl/core";
import { Renderer } from "../graphics/renderer";
import { GameObject } from "./game_object";

export abstract class Scene {

    private _gameObjects: GameObject[] = [];

    private _gameObjectsToAdd: GameObject[] = [];
    private _gameObjectsToRemove: GameObject[] = [];

    public backgroundColor: Vector3 = new Vector3(0, 0, 0);
    public ambientColor: Vector3 = new Vector3(0, 0, 0);

    public get gameObjects(): GameObject[] { return this._gameObjects; }

    public abstract onSetup(): Promise<void>;
    public abstract onUpdate(deltaTime: number): void;
    public onRender(renderer: Renderer): void {}

    public add(gameObject: GameObject): void {
        this._gameObjectsToAdd.push(gameObject);
    }

    public findByTag(tag: string): GameObject[] {
        return this._gameObjects.filter(ob => ob.tag === tag);
    }

    public update(deltaTime: number): void {
        for (let ob of this._gameObjectsToRemove) {
            this._gameObjects.splice(this._gameObjects.indexOf(ob), 1);
        }

        for (let ob of this._gameObjectsToAdd) {
            this._gameObjects.push(ob);
        }

        this._gameObjectsToAdd = [];
        this._gameObjectsToRemove = [];

        for (let ob of this._gameObjects) {
            ob.update(this, deltaTime);
            if (ob.dead) {
                this._gameObjectsToRemove.push(ob);
            }
        }

        this.onUpdate(deltaTime);
    }

    public render(renderer: Renderer): void {
        renderer.ambientColor.set(this.ambientColor.x, this.ambientColor.y, this.ambientColor.z);
        for (let ob of this._gameObjects) {
            ob.onRender(renderer);
        }
        this.onRender(renderer);
    }

}