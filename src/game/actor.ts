import { Quaternion, Vector2, Vector3 } from "@math.gl/core";
import { AnimationPlayMode } from "../core/animation_engine";
import { Component } from "../core/component";
import { FSM } from "../core/fsm";
import { GameObject } from "../core/game_object";
import { Person } from "../core/person";
import { VoxelMap, VoxelType } from "./voxel_map";

const gravity = -9.8;

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

            const map = owner.scene!.findByTag("map")[0] as VoxelMap;

            const angle = Math.atan2(this._direction.z, this._direction.x);

            const newRot = new Quaternion();
            newRot.setFromAxisAngle(new Vector3(0, 1, 0), angle);
            owner.localRotation.slerp(newRot, 0.12);

            const fwd = owner.forward;
            
            let oldPosition = owner.localPosition.clone();
            owner.localPosition.x += fwd.x * deltaTime! * 3.0;
            if (map.collided3DRadius(owner.localPosition, 0.35, 0.0, VoxelType.Wall, VoxelType.Door, VoxelType.Computer)) {
                owner.localPosition = oldPosition;
            }

            oldPosition = owner.localPosition.clone();
            owner.localPosition.z += fwd.z * deltaTime! * 3.0;
            if (map.collided3DRadius(owner.localPosition, 0.35, 0.0, VoxelType.Wall, VoxelType.Door, VoxelType.Computer)) {
                owner.localPosition = oldPosition;
            }
        });
    }

    public onCreate(): void {
        this._fsm.setState("idle", true);
    }

    public onUpdate(deltaTime: number): void {
        // gravity
        const map = this.owner!.scene!.findByTag("map")[0] as VoxelMap;
        let oldPosition = this.owner!.localPosition.clone();
        this.owner!.localPosition.y += gravity * deltaTime!;
        if (map.collided3DRadius(this.owner!.localPosition, 0.35, 1.0, VoxelType.Floor)) {
            this.owner!.localPosition = oldPosition;
        }

        this._fsm.update(this.owner as Person, deltaTime);
    }

    public onDestroy(): void {
        
    }

}