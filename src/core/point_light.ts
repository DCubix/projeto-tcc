import { Vector3 } from "@math.gl/core";
import { Light, LightType } from "../graphics/light";
import { Renderer } from "../graphics/renderer";
import { GameObject } from "./game_object";

export class PointLight extends GameObject {

    public color: Vector3;
    public intensity: number;
    public radius: number;

    constructor(intensity: number, radius: number, color: Vector3 = new Vector3(1, 1, 1)) {
        super();
        this.color = color;
        this.intensity = intensity;
        this.radius = radius;
    }

    public onCreate(): void {
    }

    public onDestroy(): void {
    }

    public onRender(renderer: Renderer): void {
        const pos = this.globalPosition;
        renderer.queueLight(new Light(pos, this.color, this.intensity, this.radius, LightType.Point));
    }

}