import { Vector3 } from "@math.gl/core";
import { Camera } from "./core/camera";
import { DirectionalLight } from "./core/directional_light";
import { Engine } from "./core/engine";
import { Scene } from "./core/scene";
import { SpriteBlock } from "./core/sprite_block";

class TestScene extends Scene {
    
    private _block: SpriteBlock | undefined;

    public onSetup(): void {
        console.log("TestScene.onSetup");

        const cam = new Camera();
        cam.localPosition.z = 8.0;
        this.add(cam);

        this._block = new SpriteBlock();
        this.add(this._block);

        const light = new DirectionalLight();
        light.localPosition.set(1, 0, 1);
        this.add(light);

        this.backgroundColor = new Vector3(0.0, 0.1, 0.3);
    }

    public onUpdate(deltaTime: number): void {
        const blk = this._block!;

        blk.localRotation.y += deltaTime;
        blk.localRotation.x += deltaTime;
    }
    
}

const eng = new Engine(document.getElementById("game") as HTMLCanvasElement);
eng.setScene(new TestScene());
eng.start();
