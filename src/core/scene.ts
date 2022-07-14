import { Vector3 } from "@math.gl/core";
import { Renderer } from "../graphics/renderer";
import { GameObject } from "./game_object";

export abstract class Scene {

    private _gameObjects: GameObject[] = [];

    private _gameObjectsToAdd: GameObject[] = [];
    private _gameObjectsToRemove: GameObject[] = [];

    public backgroundColor: Vector3 = new Vector3(0, 0, 0);

    public get gameObjects(): GameObject[] { return this._gameObjects; }

    public abstract onSetup(): void;
    public abstract onUpdate(deltaTime: number): void;

    public add(gameObject: GameObject): void {
        this._gameObjectsToAdd.push(gameObject);
    }

    public update(deltaTime: number): void {
        this.onUpdate(deltaTime);

        for (let ob of this._gameObjectsToRemove) {
            this._gameObjects.splice(this._gameObjects.indexOf(ob), 1);
        }

        for (let ob of this._gameObjectsToAdd) {
            this._gameObjects.push(ob);
        }

        this._gameObjectsToAdd = [];
        this._gameObjectsToRemove = [];

        for (let ob of this._gameObjects) {
            ob.onUpdate(deltaTime);
            if (ob.dead) {
                this._gameObjectsToRemove.push(ob);
            }
        }
    }

    public render(renderer: Renderer): void {
        for (let ob of this._gameObjects) {
            ob.onRender(renderer);
        }
    }

}