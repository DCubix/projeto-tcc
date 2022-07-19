import { Vector3 } from "@math.gl/core";
import { AnimationPlayMode } from "../core/animation_engine";
import { Component } from "../core/component";
import { FSM } from "../core/fsm";
import { GameObject } from "../core/game_object";
import { Person } from "../core/person";

export class Actor extends Component<Person> {

    protected _fsm: FSM<Person>;
    private _moving: boolean = false;

    constructor() {
        super();
        this._fsm = new FSM<Person>();

        this._fsm.addState("idle", (owner: Person, deltaTime?: number) => {
            owner.animator.play("idle", AnimationPlayMode.Loop, 1.0);
        });

        this._fsm.addState("walk", (owner: Person, deltaTime?: number) => {
            owner.animator.play("walk", AnimationPlayMode.Loop, 1.5);
        });
    }

    public onCreate(owner: GameObject): void {
        
    }

    public onUpdate(owner: GameObject, deltaTime: number): void {
        if (!this._moving) {
            this._fsm.setState("idle", true);
        }
        this._fsm.update(owner as Person, deltaTime);
    }

    public onDestroy(owner: GameObject): void {
        
    }

    public moveTowards(owner: GameObject, to: Vector3, deltaTime: number): void {
        const own = owner as Person;
        own.alignToVector(owner.globalPosition, to);
        this._fsm.setState("walk", true);
        this._moving = true;

        const dir = own.forward;
        own.localPosition.add(dir.scale(deltaTime * 10.0));
    }

}