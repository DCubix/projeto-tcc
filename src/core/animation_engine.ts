import { Matrix4, Quaternion, Vector2, Vector3, Vector4 } from "@math.gl/core";
import { Transform } from "./transform";

export abstract class Keyframe<T> {
    
    private _value: T;

    public constructor(value: T) {
        this._value = value;
    }

    public get value(): T { return this._value; }

    public abstract lerp(other: Keyframe<T>, t: number): T;
}

export class Interpolator<T> {

    private _keyframes: { [time: number]: Keyframe<T> } = {};

    public addKeyframe(time: number, value: Keyframe<T>): void {
        time = ~~Math.max(0, time);
        this._keyframes[time] = value;
    }

    public get keyframes(): { [time: number]: Keyframe<T> } {
        return this._keyframes;
    }
    public get maxTime(): number { return Object.keys(this._keyframes).map(parseFloat).reduce((a, b) => Math.max(a, b), 0); }

    public interpolate(time: number): T {
        const keys = Object.keys(this._keyframes).sort().map((e) => parseFloat(e));

        if (time < keys[0]) {
            return this.keyframes[keys[0]].value;
        } else if (time > keys[keys.length - 1]) {
            return this.keyframes[keys[keys.length - 1]].value;
        }

        for (let i = 0; i < keys.length - 1; i++) {
            if (time >= keys[i] && time <= keys[i + 1]) {
                const t = (time - keys[i]) / (keys[i + 1] - keys[i]);
                return this.keyframes[keys[i]].lerp(this.keyframes[keys[i + 1]], t);
            }
        }

        return this.keyframes[keys[keys.length - 1]].value;
    }

}

export class ScalarKeyframe extends Keyframe<number> {

    constructor(value: number) {
        super(value);
    }

    public lerp(other: Keyframe<number>, t: number): number {
        return (1 - t) * this.value + t * other.value;
    }

}

export class Vector2Keyframe extends Keyframe<Vector2> {
    
    constructor(value: Vector2) {
        super(value);
    }

    public lerp(other: Keyframe<Vector2>, t: number): Vector2 {
        return this.value.clone().lerp(other.value, t);
    }

}

export class Vector3Keyframe extends Keyframe<Vector3> {

    constructor(value: Vector3) {
        super(value);
    }

    public lerp(other: Keyframe<Vector3>, t: number): Vector3 {
        return this.value.clone().lerp(other.value, t);
    }

}

export class Vector4Keyframe extends Keyframe<Vector4> {

    constructor(value: Vector4) {
        super(value);
    }

    public lerp(other: Keyframe<Vector4>, t: number): Vector4 {
        return this.value.clone().lerp(other.value, t);
    }

}

export class QuaternionKeyframe extends Keyframe<Quaternion> {

    constructor(value: Quaternion) {
        super(value);
    }

    public lerp(other: Keyframe<Quaternion>, t: number): Quaternion {
        return this.value.clone().slerp(other.value, t);
    }

}

export class Transform3D {
    public position: Vector3 | null;
    public rotation: Quaternion | null;
    public scale: Vector3 | null;

    constructor(position?: Vector3, rotation?: Quaternion, scale?: Vector3) {
        this.position = position || null;
        this.rotation = rotation || null;
        this.scale = scale || null;
    }

    public get modelMatrix(): Matrix4 {
        const matrix = new Matrix4();
        matrix.multiplyRight(new Matrix4().translate(this.position || new Vector3(0, 0, 0)));
        matrix.multiplyRight(new Matrix4().fromQuaternion(this.rotation || new Quaternion()));
        matrix.multiplyRight(new Matrix4().scale(this.scale || new Vector3(1, 1, 1)));
        return matrix;
    }

    public lerp(other: Transform3D, t: number): Transform3D {
        const result = new Transform3D();
        result.position = this.position?.clone().lerp(other.position || new Vector3(0, 0, 0), t) || null;
        result.rotation = this.rotation?.clone().slerp(other.rotation || new Quaternion(), t) || null;
        result.scale = this.scale?.clone().lerp(other.scale || new Vector3(1, 1, 1), t) || null;
        return result;
    }
}

export class Transform3DKeyframe extends Keyframe<Transform3D> {

    constructor(value: Transform3D) {
        super(value);
    }

    public lerp(other: Keyframe<Transform3D>, t: number): Transform3D {
        return this.value.lerp(other.value, t);
    }

}

export enum AnimationPlayMode {
    Once = 0,
    Loop = 1
}

class Animation {
    private _tracks: { [name: string]: Interpolator<Transform3D> } = {};

    public mode: AnimationPlayMode = AnimationPlayMode.Loop;
    public speed: number = 1;

    constructor(tracks: Array<string>) {
        tracks.forEach(track => {
            this._tracks[track] = new Interpolator<Transform3D>();
        });
    }

    public getTrack(name: string): Interpolator<Transform3D> {
        return this._tracks[name];
    }

    public get tracks(): Array<Interpolator<Transform3D>> {
        return Object.values(this._tracks);
    }

    public get maxTime(): number {
        return Object.values(this._tracks).map((e) => e.maxTime).reduce((a, b) => Math.max(a, b), 0);
    }

}

enum AnimatorState {
    Stopped = 0,
    Playing = 1,
    Blending = 2
}

export class TransformAnimator {

    private _animations: { [name: string]: Animation } = {};
    private _tracks: string[] = [];

    private _currentAnimation: string | null = null;
    private _nextAnimation: string | null = null;

    private _state: AnimatorState = AnimatorState.Stopped;

    private _time: number = 0; // time in frames
    private _blendTime: number = 0; // time in frames

    private _transforms: { [name: string]: Transform3D } = {};

    constructor(tracks: string[]) {
        this._tracks = tracks;
    }

    public play(
        name: string,
        mode: AnimationPlayMode = AnimationPlayMode.Loop,
        speed: number = 1
    ): void {
        if (this._state === AnimatorState.Playing) {
            this._nextAnimation = name;
        } else {
            this._currentAnimation = name;
            this._state = AnimatorState.Playing;
        }

        const anim = this._animations[name];
        if (anim) {
            anim.mode = mode;
            anim.speed = speed;
        }
    }

    public getTransform(trackName: string): Transform3D {
        return this._transforms[trackName];
    }

    public addAnimation(
        name: string,
        keyframes: { [trackName: string]: { [time: number]: Transform3D } }
    ): void {
        this._animations[name] = new Animation(this._tracks);

        const tracks = Object.keys(keyframes);
        for (let trackName of tracks) {
            const times = Object.keys(keyframes[trackName]);
            for (let time of times) {
                const t = parseFloat(time);
                this._animations[name].getTrack(trackName).addKeyframe(t, new Transform3DKeyframe(keyframes[trackName][t]));
            }
        }
    }

    private updateAnimation(animation: Animation, t: number, blendWith?: Animation, t2?: number, blendTime?: number): void {
        this._tracks.forEach(trackName => {
            const track = animation.getTrack(trackName);
            let value = track.interpolate(t);

            if (blendWith) {
                const blendTrack = blendWith.getTrack(trackName);
                const blendValue = blendTrack.interpolate(t2!);
                value = value.lerp(blendValue, blendTime!);
            }

            this._transforms[trackName] = value;
        });
    }

    public update(): void {
        if (this._state === AnimatorState.Stopped) {
            return;
        }

        this._time++;

        if (this._state === AnimatorState.Playing) {
            if (this._currentAnimation !== null && this._nextAnimation === null) {
                const currentAnimation = this._animations[this._currentAnimation];
                const t = this._time * currentAnimation.speed;

                if (t >= currentAnimation.maxTime) {
                    switch (currentAnimation.mode) {
                        case AnimationPlayMode.Once: {
                            this._state = AnimatorState.Stopped;
                            this._time = 0;
                        } break;
                        case AnimationPlayMode.Loop: this._time = 0; break;
                    }
                }

                this.updateAnimation(currentAnimation, t);
            }

            // if (this._currentAnimation !== null && this._nextAnimation !== null) {
            //     this._state = AnimatorState.Blending;
            //     this._blendTime = 0;
            // }
        } else if (this._state === AnimatorState.Blending) {
            this._blendTime++;

            const currentAnimation = this._animations[this._currentAnimation!];
            const nextAnimation = this._animations[this._nextAnimation!];
            const t = this._time * currentAnimation.speed;
            const t2 = this._time * nextAnimation.speed;

            const blend = this._blendTime / 15; // TODO: Adjustable blend time, for now it's 15 frames
            this.updateAnimation(currentAnimation, t, nextAnimation, t2, blend);

            if (this._blendTime >= 15) {
                this._currentAnimation = this._nextAnimation;
                this._nextAnimation = null;
                this._state = AnimatorState.Playing;
            }
        }
    }

}

export class KeyframeGenerators {

    private static _pingPongFactors: number[] = [0.0, 0.5, 1.0, 0.5, 0.01];

    public static empty(durationInFrames: number): { [time: number]: Transform3D } {
        const result: { [time: number]: Transform3D } = {};
        result[0] = new Transform3D();
        result[durationInFrames] = new Transform3D();
        return result;
    }

    public static pingPongRotationX(start: number, end: number, durationInFrames: number): { [time: number]: Transform3D } {
        const result: { [time: number]: Transform3D } = {};
        const delta = end - start;
        const step = ~~(durationInFrames / KeyframeGenerators._pingPongFactors.length);
        let t = 0;
        for (let fac of KeyframeGenerators._pingPongFactors) {
            let quat = new Quaternion();
            quat.rotateX(start + delta * fac);
            result[~~t] = new Transform3D(undefined, quat);
            t += step;
        }
        return result;
    }

    public static pingPongRotationY(start: number, end: number, durationInFrames: number): { [time: number]: Transform3D } {
        const result: { [time: number]: Transform3D } = {};
        const delta = end - start;
        const step = ~~(durationInFrames / KeyframeGenerators._pingPongFactors.length);
        let t = 0;
        for (let fac of KeyframeGenerators._pingPongFactors) {
            let quat = new Quaternion();
            quat.rotateY(start + delta * fac);
            result[~~t] = new Transform3D(undefined, quat);
            t += step;
        }
        return result;
    }

    public static pingPongRotationZ(start: number, end: number, durationInFrames: number): { [time: number]: Transform3D } {
        const result: { [time: number]: Transform3D } = {};
        const delta = end - start;
        const step = ~~(durationInFrames / KeyframeGenerators._pingPongFactors.length);
        let t = 0;
        for (let fac of KeyframeGenerators._pingPongFactors) {
            let quat = new Quaternion();
            quat.rotateZ(start + delta * fac);
            result[~~t] = new Transform3D(undefined, quat);
            t += step;
        }
        return result;
    }

}