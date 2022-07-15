import { Renderer } from "../graphics/renderer";
import { Scene } from "./scene";

export class Engine {

    public static timeStep: number = 0.016;

    private _renderer: Renderer;

    private _currentScene: Scene | undefined;
    private _nextScene: Scene | undefined;

    private _lastTime: number = 0;
    private _accumulator: number = 0;

    private _loading: boolean = false;

    constructor(canvas: HTMLCanvasElement) {
        this._renderer = new Renderer(canvas);
    }

    public setScene(scene: Scene): void {
        this._nextScene = scene;
    }

    public start(): void {
        this._lastTime = performance.now();
        this._loop();
    }

    private _loop() {
        const now = performance.now();
        const deltaTime = (now - this._lastTime) / 1000;
        this._lastTime = now;

        this._accumulator += deltaTime;

        while (this._accumulator >= Engine.timeStep) {
            this._accumulator -= Engine.timeStep;

            if (this._nextScene) {
                this._loading = true;
                this._currentScene = this._nextScene;
                this._currentScene.onSetup().then(() => {
                    this._loading = false;
                });
                this._nextScene = undefined;
            }

            if (this._currentScene && !this._loading) {
                this._currentScene.update(Engine.timeStep);
            }
        }

        if (this._currentScene && !this._loading) {
            this._currentScene.render(this._renderer);
            this._renderer.render(this._currentScene.backgroundColor, this._currentScene.ambientColor);
        }

        window.requestAnimationFrame(this._loop.bind(this));
    }

}