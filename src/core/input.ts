import { Vector2 } from "@math.gl/core";

export enum Axis {
    XAxis1 = 0,
    YAxis1,
    XAxis2,
    YAxis2
}

export class Input {
    
    private static _instance: Input;
    public static get instance(): Input {
        if (!Input._instance) {
            Input._instance = new Input();
        }
        return Input._instance;
    }

    private _keysPressed: { [key: string]: boolean } = {};
    private _keysReleased: { [key: string]: boolean } = {};
    private _keysHeld: { [key: string]: boolean } = {};

    private _mousePressed: { [button: number]: boolean } = {};
    private _mouseReleased: { [button: number]: boolean } = {};
    private _mouseHeld: { [button: number]: boolean } = {};

    private _mousePosition: Vector2 = new Vector2(0, 0);

    // Gamepads
    private _gamepads: Gamepad[] = [];

    private constructor() {}

    public get mousePosition(): Vector2 { return this._mousePosition; }

    public isKeyPressed(key: string): boolean {
        return this._keysPressed[key];
    }

    public isKeyReleased(key: string): boolean {
        return this._keysReleased[key];
    }

    public isKeyHeld(key: string): boolean {
        return this._keysHeld[key];
    }

    public isMousePressed(button: number): boolean {
        return this._mousePressed[button];
    }

    public isMouseReleased(button: number): boolean {
        return this._mouseReleased[button];
    }

    public isMouseHeld(button: number): boolean {
        return this._mouseHeld[button];
    }

    public getGamepad(index: number): Gamepad | null {
        let gp = null;
        for (let i = 0; i < this._gamepads.length; i++) {
            if (this._gamepads[i].index === index) {
                gp = this._gamepads[i];
                break;
            }
        }
        return gp;
    }

    public isGamepadButtonPressed(index: number, button: number): boolean {
        let gp = this.getGamepad(index);
        if (gp) {
            return gp.buttons[button].pressed;
        }
        return false;
    }

    public getGamepadAxis(index: number, axis: Axis): number {
        // [ index, subtraction ]
        const axisIndices = [
            [ 0, 0 ], // x1
            [ 1, 1 ], // y1
            [ 5, 0 ], // x2
            [ 2, 1 ]  // y2
        ];
        let gp = this.getGamepad(index);
        if (gp) {
            const idx = axisIndices[axis];
            return gp.axes[idx[1]] - (gp.axes[idx[0]] * 0.5 + 0.5);
        }
        return 0;
    }

    public install(canvas: HTMLCanvasElement): void {
        canvas.addEventListener("keydown", (event: KeyboardEvent) => {
            this._keysPressed[event.key] = true;
            this._keysHeld[event.key] = true;
        });
        canvas.addEventListener("keyup", (event: KeyboardEvent) => {
            this._keysReleased[event.key] = true;
            this._keysHeld[event.key] = false;
        });
        canvas.addEventListener("mousedown", (event: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            this._mousePosition.x = event.clientX - rect.left;
            this._mousePosition.y = event.clientY - rect.top;
            this._mousePressed[event.button] = true;
            this._mouseHeld[event.button] = true;
        });
        canvas.addEventListener("mouseup", (event: MouseEvent) => {
            this._mouseReleased[event.button] = true;
            this._mouseHeld[event.button] = false;
        });
        canvas.addEventListener("mousemove", (event: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            this._mousePosition.x = event.clientX - rect.left;
            this._mousePosition.y = event.clientY - rect.top;
        });

        // Gamepads
        window.addEventListener("gamepadconnected", (event: GamepadEvent) => {
            this._gamepads.push(event.gamepad);
            console.log(`Gamepad ${event.gamepad.index} connected.`);
        });

        window.addEventListener("gamepaddisconnected", (event: GamepadEvent) => {
            this._gamepads = this._gamepads.filter(gamepad => gamepad.index !== event.gamepad.index);
            console.log(`Gamepad ${event.gamepad.index} disconnected.`);
        });

        for (let gp of navigator.getGamepads()) {
            if (gp) {
                this._gamepads.push(gp);
            }
        }
    }

    public update(): void {
        for (let key in this._keysPressed) {
            this._keysPressed[key] = false;
        }
        for (let key in this._keysReleased) {
            this._keysReleased[key] = false;
        }
        for (let key in this._mousePressed) {
            this._mousePressed[key] = false;
        }
        for (let key in this._mouseReleased) {
            this._mouseReleased[key] = false;
        }
    }

}