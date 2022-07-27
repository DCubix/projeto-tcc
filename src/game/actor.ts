import { Quaternion, Vector2, Vector3 } from "@math.gl/core";
import { AnimationPlayMode } from "../core/animation_engine";
import { Component } from "../core/component";
import { FSM } from "../core/fsm";
import { GameObject } from "../core/game_object";
import { Person } from "../core/person";

export class Actor extends Component {

    protected _fsm: FSM<Person>;
    protected _direction: Vector3 = new Vector3(0, 0, 1);

    constructor() {
        super();
        this._fsm = new FSM<Person>();

        this._fsm.addState("idle", (owner: Person, deltaTime?: number) => {
            owner.animator.play("idle", AnimationPlayMode.Loop, 1.0, 10.0);
        });

        this._fsm.addState("walk", (owner: Person, deltaTime?: number) => {
            owner.animator.play("walk", AnimationPlayMode.Loop, 1.5, 8.0);

            const angle = Math.atan2(this._direction.z, this._direction.x);

            const newRot = new Quaternion();
            newRot.setFromAxisAngle(new Vector3(0, 1, 0), angle);
            owner.localRotation.slerp(newRot, 0.12);

            const fwd = owner.forward;
            owner.localPosition.add(fwd.scale(deltaTime! * 3.0));
        });
    }

    public onCreate(): void {
        this._fsm.setState("idle", true);
    }

    public onUpdate(deltaTime: number): void {
        this._fsm.update(this.owner as Person, deltaTime);
    }

    public onDestroy(): void {
        
    }

}