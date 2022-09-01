import { Renderer } from "../graphics/renderer";
import { Light, LightType } from "../graphics/light";
import { GameObject } from "./game_object";
import { Vector3 } from "@math.gl/core";

export class DirectionalLight extends GameObject {
    
    public color: Vector3;
    public intensity: number;

    constructor(intensity: number = 1.0, color: Vector3 = new Vector3(1, 1, 1)) {
        super();
        this.color = color;
        this.intensity = intensity;
    }

    public onCreate(): void {
    }

    public onDestroy(): void {
    }

    public onRender(renderer: Renderer): void {
        const dir = this.localPosition.clone().normalize();
        renderer.queueLight(new Light(dir, this.color, this.intensity, 0, LightType.Directional));
    }

}