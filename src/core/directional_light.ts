import { Renderer } from "../graphics/renderer";
import { Light, LightType } from "../graphics/light";
import { GameObject } from "./game_object";
import { Vec3 } from "../math/vec3";

export class DirectionalLight extends GameObject {
    
    public color: Vec3;
    public intensity: number;

    constructor(intensity: number, color: Vec3 = Vec3.one) {
        super();
        this.color = color;
        this.intensity = intensity;
    }

    public onCreate(): void {
    }

    public onDestroy(): void {
    }

    public onRender(renderer: Renderer): void {
        const dir = this.globalPosition;
        renderer.queueLight(new Light(dir, this.color, this.intensity, 0, LightType.Directional));
    }

}