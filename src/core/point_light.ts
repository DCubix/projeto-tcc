import { Light, LightType } from "../graphics/light";
import { Renderer } from "../graphics/renderer";
import { Vec3 } from "../math/vec3";
import { GameObject } from "./game_object";

export class PointLight extends GameObject {

    public color: Vec3;
    public intensity: number;
    public radius: number;

    constructor(intensity: number, radius: number, color: Vec3 = Vec3.one) {
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