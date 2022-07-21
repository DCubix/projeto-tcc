import { Vector3 } from "@math.gl/core";
import { GameObject } from "../core/game_object";
import { Axis, Input } from "../core/input";
import { Actor } from "./actor";

export class Player extends Actor {

    constructor() {
        super();
    }

    public onUpdate(owner: GameObject, deltaTime: number): void {
        const inp = Input.instance;
        let axisX = 0.0, axisY = 0.0;
        if (inp.isGamepadConnected(0)) {
            axisX = inp.getGamepadAxis(0, Axis.XAxis1);
            axisY = inp.getGamepadAxis(0, Axis.YAxis1);
        } else {
            if (inp.isKeyHeld("ArrowLeft") || inp.isKeyHeld("a")) {
                axisX -= 1;
            } else if (inp.isKeyHeld("ArrowRight") || inp.isKeyHeld("d")) {
                axisX += 1;
            }

            if (inp.isKeyHeld("ArrowUp") || inp.isKeyHeld("w")) {
                axisY += 1;
            } else if (inp.isKeyHeld("ArrowDown") || inp.isKeyHeld("s")) {
                axisY -= 1;
            }
        }

        this._direction.z = axisX;
        this._direction.x = -axisY;

        if (this._direction.lengthSquared() > 0.1) {
            this._direction.normalize();
            this._fsm.setState("walk");
        } else {
            this._fsm.setState("idle", true);
        }

        super.onUpdate(owner, deltaTime);
    }

}