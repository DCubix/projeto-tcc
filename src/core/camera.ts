import { Matrix4 } from "@math.gl/core";
import { Renderer } from "../graphics/renderer";
import { GameObject } from "./game_object";

export class Camera extends GameObject {

    public fov: number = Math.PI / 4;

    public onCreate(): void {
    }

    public onDestroy(): void {
    }

    public onRender(renderer: Renderer): void {
        const projectionMatrix = new Matrix4().perspective({ fovy: this.fov, aspect: renderer.aspectRatio, near: 0.01, far: 1000 });
        renderer.setCamera(this.viewMatrix, projectionMatrix);
    }

    public get viewMatrix(): Matrix4 {
        const rot = new Matrix4().fromQuaternion(this.localRotation.clone().conjugate());
        const loc = new Matrix4().translate(this.globalPosition.clone().negate());
        return rot.multiplyRight(loc);
    }

}