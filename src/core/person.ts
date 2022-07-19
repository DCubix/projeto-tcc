import { Matrix3, Matrix4, Quaternion, Vector2, Vector3, Vector4 } from "@math.gl/core";
import { Mesh, MeshBuilder, Vertex } from "../graphics/mesh";
import { Material, Renderer } from "../graphics/renderer";
import { Rotation, UVGenerator } from "../graphics/uv_generator";
import { AnimationPlayMode, KeyframeGenerators, Transform3D, TransformAnimator } from "./animation_engine";
import { GameObject } from "./game_object";

export enum LimbType {
    LeftArm = 0,
    RightArm,
    LeftLeg,
    RightLeg,
    Head,
    Torso
}

export class Limb {
    public rotation: Quaternion;
    public position: Vector3;

    constructor(rotation: Quaternion, position: Vector3) {
        this.rotation = rotation;
        this.position = position;
    }
}

export class Person extends GameObject {

    public material: Material | null = null;

    private _limbs: Limb[] = [];

    private _vertices: Vertex[] = [];
    private _indices: number[] = [];
    private _verticesTransformed: Vertex[] = [];

    private _mesh: Mesh;

    private _animator: TransformAnimator;

    constructor() {
        super();
        this._limbs[LimbType.LeftArm] = new Limb(new Quaternion(), new Vector3(0.2, 0.35, 0));
        this._limbs[LimbType.RightArm] = new Limb(new Quaternion(), new Vector3(-0.2, 0.35, 0));
        this._limbs[LimbType.LeftLeg] = new Limb(new Quaternion(), new Vector3(-0.1, 0, 0));
        this._limbs[LimbType.RightLeg] = new Limb(new Quaternion(), new Vector3(0.1, 0, 0));
        this._limbs[LimbType.Head] = new Limb(new Quaternion(), new Vector3(0, 0.35, 0));
        this._limbs[LimbType.Torso] = new Limb(new Quaternion(), new Vector3(0, 0, 0));
        this._mesh = new Mesh();
        this._animator = new TransformAnimator([ 'left-arm', 'right-arm', 'left-leg', 'right-leg', 'head' ]);

        // walk animation
        const walkSpan = Math.PI / 4;
        const idleSpan = Math.PI / 12;
        this._animator.addAnimation('walk', {
            'left-arm': KeyframeGenerators.pingPongRotationX(-walkSpan, walkSpan, 50),
            'right-arm': KeyframeGenerators.pingPongRotationX(walkSpan, -walkSpan, 50),
            'left-leg': KeyframeGenerators.pingPongRotationX(-walkSpan, walkSpan, 50),
            'right-leg': KeyframeGenerators.pingPongRotationX(walkSpan, -walkSpan, 50),
            'head': KeyframeGenerators.pingPongRotationX(0, -0.08, 50)
        });

        this._animator.addAnimation('idle', {
            'left-arm': KeyframeGenerators.pingPongRotationZ(0, idleSpan, 50),
            'right-arm': KeyframeGenerators.pingPongRotationZ(0, -idleSpan, 50),
            'left-leg': KeyframeGenerators.empty(50),
            'right-leg': KeyframeGenerators.empty(50),
            'head': KeyframeGenerators.pingPongRotationX(0, -0.08, 50)
        });

        this._animator.play('idle', AnimationPlayMode.Loop, 1.5);
    }

    public get animator(): TransformAnimator {
        return this._animator;
    }

    public onUpdate(delta: number): void {
        super.onUpdate(delta);
        this.updateLimbs();
    }

    public onCreate(): void {
        const tex = this.material?.diffuseTexture;
        let mb = new MeshBuilder();
        let uvg = new UVGenerator(tex?.width || 1, tex?.height || 1);

        uvg.addRegion('head:top', 6, 0, 8, 6);
        uvg.addRegion('head:bottom', 15, 0, 8, 6);
        uvg.addRegion('head:left', 0, 6, 6, 7);
        uvg.addRegion('head:right', 14, 6, 6, 7);
        uvg.addRegion('head:front', 6, 6, 8, 7);
        uvg.addRegion('head:back', 20, 6, 8, 7);

        uvg.addRegion('torso:top', 20, 13, 6, 4);
        uvg.addRegion('torso:bottom', 26, 13, 6, 4);
        uvg.addRegion('torso:left', 16, 17, 4, 7);
        uvg.addRegion('torso:right', 26, 17, 4, 7);
        uvg.addRegion('torso:front', 20, 17, 6, 7);
        uvg.addRegion('torso:back', 30, 17, 6, 7);

        uvg.addRegion('leg:top', 2, 13, 2, 2);
        uvg.addRegion('leg:bottom', 4, 13, 2, 2);
        uvg.addRegion('leg:left', 0, 15, 2, 6);
        uvg.addRegion('leg:front', 2, 15, 2, 6);
        uvg.addRegion('leg:right', 4, 15, 2, 6);
        uvg.addRegion('leg:back', 6, 15, 2, 6);

        uvg.addRegion('arm:top', 12, 13, 2, 2);
        uvg.addRegion('arm:bottom', 10, 13, 2, 2);
        uvg.addRegion('arm:left', 8, 15, 2, 6, Rotation.Rotate180);
        uvg.addRegion('arm:front', 10, 15, 2, 6, Rotation.Rotate180);
        uvg.addRegion('arm:right', 12, 15, 2, 6, Rotation.Rotate180);
        uvg.addRegion('arm:back', 14, 15, 2, 6, Rotation.Rotate180);
        
        // left arm region
        mb.addStick(
            new Vector2(0.1, 0.1), 0.3, Math.PI,
            uvg.getRegion('arm:top'),
            uvg.getRegion('arm:bottom'),
            uvg.getRegion('arm:left'),
            uvg.getRegion('arm:right'),
            uvg.getRegion('arm:front'),
            uvg.getRegion('arm:back')
        );

        // right arm region
        mb.addStick(
            new Vector2(0.1, 0.1), 0.3, Math.PI,
            uvg.getRegion('arm:top'),
            uvg.getRegion('arm:bottom'),
            uvg.getRegion('arm:left'),
            uvg.getRegion('arm:right'),
            uvg.getRegion('arm:front'),
            uvg.getRegion('arm:back')
        );

        // left leg region
        mb.addStick(
            new Vector2(0.1, 0.1), 0.3, Math.PI,
            uvg.getRegion('leg:top'),
            uvg.getRegion('leg:bottom'),
            uvg.getRegion('leg:left'),
            uvg.getRegion('leg:right'),
            uvg.getRegion('leg:front'),
            uvg.getRegion('leg:back')
        );

        // right leg region
        mb.addStick(
            new Vector2(0.1, 0.1), 0.3, Math.PI,
            uvg.getRegion('leg:top'),
            uvg.getRegion('leg:bottom'),
            uvg.getRegion('leg:left'),
            uvg.getRegion('leg:right'),
            uvg.getRegion('leg:front'),
            uvg.getRegion('leg:back')
        );

        // head region
        mb.addStick(
            new Vector2(0.4, 0.3), 0.35, 0,
            uvg.getRegion('head:top'),
            uvg.getRegion('head:bottom'),
            uvg.getRegion('head:left'),
            uvg.getRegion('head:right'),
            uvg.getRegion('head:front'),
            uvg.getRegion('head:back')
        );

        // torso region. Each region has 24 vertices.
        mb.addStick(
            new Vector2(0.3, 0.2), 0.35, 0,
            uvg.getRegion('torso:top'),
            uvg.getRegion('torso:bottom'),
            uvg.getRegion('torso:left'),
            uvg.getRegion('torso:right'),
            uvg.getRegion('torso:front'),
            uvg.getRegion('torso:back')
        );

        const [verts, inds] = mb.recalculateNormals().buildData();
        this._mesh.update(verts, inds);
        
        this._vertices = verts;
        this._indices = inds;
    }

    public onDestroy(): void {
    }

    public onRender(renderer: Renderer): void {
        renderer.queueRenderable(this._mesh, this.modelMatrix, this.material);
    }

    public getLimb(type: LimbType): Limb {
        return this._limbs[type];
    }

    private updateLimbs(): void {
        // UPDATE ANIMATIONS
        this._animator.update();

        this._limbs[LimbType.LeftArm].rotation = this._animator.getTransform('left-arm').rotation || new Quaternion();
        this._limbs[LimbType.RightArm].rotation = this._animator.getTransform('right-arm').rotation || new Quaternion();
        this._limbs[LimbType.LeftLeg].rotation = this._animator.getTransform('left-leg').rotation || new Quaternion();
        this._limbs[LimbType.RightLeg].rotation = this._animator.getTransform('right-leg').rotation || new Quaternion();
        this._limbs[LimbType.Head].rotation = this._animator.getTransform('head').rotation || new Quaternion();

        this._verticesTransformed = [];
        for (let i = 0; i < this._limbs.length; i++) {
            if (i === LimbType.Torso) continue;
            
            const limb = this._limbs[i];
            const translate = new Matrix4().translate(limb.position);
            const rotate = new Matrix4().fromQuaternion(limb.rotation);
            const transform = translate.multiplyRight(rotate);
            
            const limbVerticesIndex = this._limbs.indexOf(limb) * 24;
            for (let i = 0; i < 24; i++) {
                const vertex = this._vertices[limbVerticesIndex + i];
                const transformed = new Vertex(vertex.position.clone(), vertex.normal.clone(), vertex.uv.clone());
                transformed.position.transformAsPoint(transform);
                transformed.normal.transformAsVector(transform);

                this._verticesTransformed.push(transformed);
            }
        }

        this._mesh.update(this._verticesTransformed, this._indices);
    }

}