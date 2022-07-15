import { Vector3 } from "@math.gl/core";
import { Camera } from "./core/camera";
import { DirectionalLight } from "./core/directional_light";
import { Engine } from "./core/engine";
import { Scene } from "./core/scene";
import { SpriteBlock } from "./core/sprite_block";
import { Material } from "./graphics/renderer";
import { Util } from "./core/util";
import { PointLight } from "./core/point_light";
import { VoxelMap } from "./core/voxel_map";

class TestScene extends Scene {
    
    // private _block: SpriteBlock | undefined;

    public async onSetup() {
        console.log("TestScene.onSetup");

        const cam = new Camera();
        cam.tag = "camera";
        cam.localPosition.z = 18.0;
        cam.localPosition.y = 18.0;
        cam.localPosition.x = 18.0;
        cam.localRotation.rotateX(Math.PI / 6);
        cam.localRotation.rotateY(-Math.PI / 4);
        // cam.lookAt(new Vector3(0, 0, 0));
        this.add(cam);

        // this._block = new SpriteBlock();
        // this._block.material = new Material();
        // this._block.material.diffuseTexture = await Util.loadTexture("block.png");
        // this._block.horizontalSpriteCount = 6;
        // this._block.spriteFaces = [0, 1, 2, 3, 4, 5];
        // this.add(this._block);

        const map = new VoxelMap();
        map.tag = "map";
        map.material = new Material();
        map.material.diffuseTexture = await Util.loadTexture("voxels.png");
        this.add(map);

        const light = new DirectionalLight();
        light.localPosition.set(0, 0, 1);
        light.lookAt(new Vector3(0, 0, 0));
        light.tag = "light";
        this.add(light);

        this.backgroundColor = new Vector3(0.0, 0.1, 0.3);
    }

    public onUpdate(deltaTime: number): void {
        // const cam = this.findByTag("camera")[0] as Camera;

        // cam.localRotation.rotateY(deltaTime);

        // const map = this.findByTag("map")[0] as VoxelMap;
        // map.localRotation.rotateY(deltaTime*0.2);

        // this.findByTag("light")[0].localRotation.rotateY(deltaTime*0.3);
    }
    
}

const eng = new Engine(document.getElementById("game") as HTMLCanvasElement);
eng.setScene(new TestScene());
eng.start();
