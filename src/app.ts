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
import { LimbType, Person } from "./core/person";
import { Player } from "./game/player";

class TestScene extends Scene {
    
    // private _block: SpriteBlock | undefined;
    private _time: number = 0;

    public async onSetup() {
        console.log("TestScene.onSetup");

        const cam = new Camera();
        cam.tag = "camera";
        cam.localPosition.z = 8.0;
        cam.localPosition.y = 8.0;
        cam.localPosition.x = 8.0;
        cam.localRotation.rotateX(Math.PI / 6);
        cam.localRotation.rotateY(-Math.PI / 4);
        cam.orthoSize = 2.5;
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
        map.localPosition.y = -1;
        this.add(map);

        const person = new Person();
        person.tag = "person";
        person.material = new Material();
        person.material.diffuseTexture = await Util.loadTexture("person.png");

        person.addComponent(new Player());

        this.add(person);

        const light = new DirectionalLight();
        light.tag = "light";
        light.localPosition.y = 2.0;
        light.localPosition.z = 2.0;
        light.localPosition.x = 2.0;
        light.fromToRotation(light.localPosition, new Vector3(0, 0, 0));
        this.add(light);

        // const light = new PointLight(2.0, 10.0);
        // light.localPosition.set(0, 0, 0);
        // light.tag = "light";
        // this.add(light);

        // light.setParent(person);
    }

    public onUpdate(deltaTime: number): void {
        this._time += deltaTime;
        const cam = this.findByTag("camera")[0] as Camera;

        // const light = this.findByTag("light")[0] as PointLight;
        // light.localPosition.x = Math.cos(this._time) * 2.0;
        // light.localPosition.z = Math.sin(this._time) * 2.0;
        // light.localPosition.y = 0.5;

        // cam.localRotation.rotateY(deltaTime);

        // const map = this.findByTag("map")[0] as VoxelMap;
        // map.localRotation.rotateY(deltaTime*0.2);

        // this.findByTag("light")[0].localRotation.rotateY(deltaTime*0.3);

        // rotate person
        const person = this.findByTag("person")[0] as Person;

        // camera follow person
        const camPos = cam.localPosition;
        const personPos = person.localPosition;

        const camDistance = 6.0;

        // smooth camera follow person
        const vec = camPos.clone().subtract(personPos).normalize();
        cam.lookAt(vec, new Vector3(0, 1, 0), 2);

        cam.localPosition = camPos.clone().lerp(personPos.clone().add(new Vector3(camDistance, camDistance, camDistance)), 0.15);
    }
    
}

const eng = new Engine(document.getElementById("game") as HTMLCanvasElement);
eng.setScene(new TestScene());
eng.start();
