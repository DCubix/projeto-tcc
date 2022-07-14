import { Matrix4 } from "@math.gl/core";
import { Renderer } from "../graphics/renderer";
import { GameObject } from "./game_object";

export class Camera extends GameObject {

    public onCreate(): void {
    }

    public onDestroy(): void {
    }

    public onRender(renderer: Renderer): void {
        const viewMatrix = this.modelMatrix.clone().invert();
        const projectionMatrix = new Matrix4().perspective({ fovy: Math.PI / 4, aspect: renderer.aspectRatio, near: 0.01, far: 1000 });
        renderer.setCamera(viewMatrix, projectionMatrix);
    }

}