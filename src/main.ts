import { Vector3, Vector4 } from "@math.gl/core";
import { Camera } from "./core/camera";
import { Engine } from "./core/engine";
import { Scene } from "./core/scene";
import { Material, Renderer } from "./graphics/renderer";
import { Util } from "./core/util";
import { PointLight } from "./core/point_light";
import { VoxelMap } from "./game/voxel_map";
import { Player } from "./game/player";
import { Font } from "./graphics/font";
import { Person } from "./core/person";

function hsvToRgb(h: number, s: number, v: number): Vector3 {
    let r, g, b, i, f, p, q, t;
    
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);

    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }

    return new Vector3(r, g, b);
}

class TestScene extends Scene {
    
    private _time: number = 0;
    private _fps: number = 0;
    private _font?: Font;

    public async onSetup() {
        this._font = await Font.fromFile('game-font.png', 'game-font-data.json');

        const map = new VoxelMap();
        map.tag = "map";
        map.material = new Material();
        map.material.diffuseTexture = await Util.loadTexture("voxels.png");
        map.material.normalTexture = await Util.loadTexture("voxels_normal.png");
        map.material.emissionTexture = await Util.loadTexture("voxels_emit.png");
        map.material.emissionIntensity = 1.0;
        const playerPos = map.loadLevel(0, this);
        this.add(map);

        const person = new Person();
        person.tag = "person";
        person.localPosition.y = 2.4;
        person.localPosition.x = playerPos.x;
        person.localPosition.z = playerPos.y;
        person.material = new Material();
        person.material.diffuseTexture = await Util.loadTexture("person.png");
        person.addComponent(new Player());

        this.add(person);

        const cam = new Camera();
        cam.tag = "camera";
        cam.localPosition.z = 8.0;
        cam.localPosition.y = 8.0;
        cam.localPosition.x = 8.0;
        cam.localRotation.rotateY(Math.radians(45.0));
        cam.localRotation.rotateX(-Math.radians(35.0));
        cam.orthoSize = 2.5;
        
        this.add(cam);

        const light = new PointLight(0.9, 3.0, hsvToRgb(0.11, 0.3, 0.98));
        light.tag = "light";
        light.localPosition.y = 0.5;
        light.localPosition.z = 0.4;
        this.add(light);

        light.setParent(person);

        this.ambientColor = new Vector3(0.03, 0.025, 0.1);
    }

    public onUpdate(deltaTime: number): void {
        this._time += deltaTime;
        this._fps = 1.0 / deltaTime;
        const cam = this.findByTag("camera")[0] as Camera;

        // rotate person
        const person = this.findByTag("person")[0] as Person;

        // camera follow person
        const personPos = person.localPosition;
        const camDistance = 6.0;

        cam.localPosition = personPos.clone().add(new Vector3(camDistance, camDistance, camDistance));
    }

    public onRender(renderer: Renderer): void {
        
    }
    
}

const eng = new Engine(document.getElementById("game") as HTMLCanvasElement);
eng.setScene(new TestScene());
eng.start();
