import { GameObject } from "./game_object";

export abstract class Component {

    public owner?: GameObject;

    public abstract onCreate(): void;
    public abstract onUpdate(deltaTime: number): void;
    public abstract onDestroy(): void;

}