import { Camera } from "./core/camera";
import { Engine } from "./core/engine";
import { Scene } from "./core/scene";
import { SpriteBlock } from "./core/sprite_block";

class TestScene extends Scene {
    public onSetup(): void {
        console.log("TestScene.onSetup");

        const cam = new Camera();
        cam.localPosition.z = -8;
        this.add(cam);

        const obj = new SpriteBlock();
        this.add(obj);
    }
}

const eng = new Engine(document.getElementById("game") as HTMLCanvasElement);
eng.setScene(new TestScene());
eng.start();
