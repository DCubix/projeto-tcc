import { Vector3 } from "@math.gl/core";
import { Camera } from "./core/camera";
import { DirectionalLight } from "./core/directional_light";
import { Engine } from "./core/engine";
import { Scene } from "./core/scene";
import { SpriteBlock } from "./core/sprite_block";
import { Material } from "./graphics/renderer";
import { Util } from "./core/util";

class TestScene extends Scene {
    
    private _block: SpriteBlock | undefined;

    public async onSetup() {
        console.log("TestScene.onSetup");

        const cam = new Camera();
        cam.localPosition.z = 5.0;
        this.add(cam);

        this._block = new SpriteBlock();
        this._block.material = new Material();
        this._block.material.diffuseTexture = await Util.loadTexture("block.png");
        this._block.horizontalSpriteCount = 6;
        this._block.spriteFaces = [0, 1, 2, 3, 4, 5];
        this.add(this._block);

        const light = new DirectionalLight();
        light.localPosition.set(1, 0, 1);
        this.add(light);

        this.backgroundColor = new Vector3(0.0, 0.1, 0.3);
    }

    public onUpdate(deltaTime: number): void {
        const blk = this._block!;

        blk.localRotation.x += deltaTime;
        blk.localRotation.y += deltaTime * 0.5;
        blk.localRotation.z += deltaTime * -0.5;
    }
    
}

const eng = new Engine(document.getElementById("game") as HTMLCanvasElement);
eng.setScene(new TestScene());
eng.start();
