import { Vector3 } from "@math.gl/core";
import { Shader } from "./shader";

export enum LightType {
    Directional = 0,
    Point
}

export class Light {
    public position: Vector3;
    public color: Vector3;
    public intensity: number;
    public radius: number;
    public type: LightType;

    public constructor(position: Vector3, color: Vector3, intensity: number, radius: number, type: LightType) {
        this.position = position;
        this.color = color;
        this.intensity = intensity;
        this.radius = radius;
        this.type = type;
    }

    public applyToShader(name: string, shader: Shader) {
        shader.setUniform(`${name}.position`, this.position);
        shader.setUniform(`${name}.color`, this.color);
        shader.setUniformFloat(`${name}.intensity`, this.intensity);
        shader.setUniformFloat(`${name}.radius`, this.radius);
        shader.setUniformInt(`${name}.type`, this.type as number);
    }
}