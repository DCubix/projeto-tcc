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

    public applyToShader(index: number, shader: Shader) {
        const name = `lights[${index}]`;
        shader.setUniform3f(`${name}.position`, this.position);
        shader.setUniform3f(`${name}.color`, this.color);
        shader.setUniform1f(`${name}.intensity`, this.intensity);
        shader.setUniform1f(`${name}.radius`, this.radius);
        shader.setUniform1i(`${name}.type`, this.type as number);
    }
}