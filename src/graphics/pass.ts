import { Renderer } from "./renderer";

export abstract class RenderPass {

    private _disabled: number[] = [];
    private _enabled: number[] = [];

    public enable(gl: WebGL2RenderingContext, capability: number): void {
        this._enabled.push(capability);
        gl.enable(capability);
    }

    public enableAll(gl: WebGL2RenderingContext, ...capabilities: number[]): void {
        for (const capability of capabilities) {
            this.enable(gl, capability);
        }
    }

    public disable(gl: WebGL2RenderingContext, capability: number): void {
        this._disabled.push(capability);
        gl.disable(capability);
    }

    public disableAll(gl: WebGL2RenderingContext, ...capabilities: number[]): void {
        for (const capability of capabilities) {
            this.disable(gl, capability);
        }
    }

    public restore(gl: WebGL2RenderingContext): void {
        for (const capability of this._enabled) {
            gl.disable(capability);
        }
        for (const capability of this._disabled) {
            gl.enable(capability);
        }

        this._disabled.length = 0;
        this._enabled.length = 0;
    }

    public abstract render(renderer: Renderer): void;
}