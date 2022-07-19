import { GameObject } from "./game_object";

export abstract class Component<OwnerType extends GameObject> {

    public abstract onCreate(owner: OwnerType): void;
    public abstract onUpdate(owner: OwnerType, deltaTime: number): void;
    public abstract onDestroy(owner: OwnerType): void;

}