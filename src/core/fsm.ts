// Finite state machine

import { GameObject } from "./game_object";

// State is a function type
export type State<OwnerType extends GameObject> = (owner: OwnerType, deltaTime?: number) => void;

export class FSM<OwnerType extends GameObject> {

    private _states: { [name: string]: State<OwnerType> } = {};
    private _currentState: string | null = null;

    private _stateExecuted: boolean = false;
    private _oneShot: boolean = false;

    public get currentState(): string | null {
        return this._currentState;
    }

    public getState(name: string): State<OwnerType> {
        return this._states[name];
    }

    public addState(name: string, state: State<OwnerType>): void {
        this._states[name] = state;
    }

    public setState(name: string, oneShot: boolean = false): void {
        if (this._currentState !== name) {
            this._stateExecuted = false;
        }
        this._currentState = name;
        this._oneShot = oneShot;
    }

    public update(owner: OwnerType, deltaTime: number): void {
        if (this._currentState) {
            if (this._oneShot && !this._stateExecuted) {
                this._states[this._currentState](owner, deltaTime);
                this._stateExecuted = true;
            } else {
                this._states[this._currentState](owner, deltaTime);
            }
        }
    }

}