import {
    AdditiveBlending,
    BufferGeometry,
    Color,
    Float32BufferAttribute,
    Mesh, MeshBasicMaterial,
    Path, PerspectiveCamera,
    PlaneGeometry,
    Points,
    Raycaster,
    Scene,
    ShaderMaterial,
    Shape,
    ShapeGeometry,
    Texture,
    Vector2,
    Vector3,
    WebGLRenderer,
    SRGBColorSpace,
} from "three";
import { Font } from "three/examples/jsm/loaders/FontLoader.js";

interface Data {
    text: string;
    amount: number;
    particleSize: number;
    particleColor: number;
    textSize: number;
    area: number;
    ease: number,
}

export class Environment {

    constructor(font: Font, particle: Texture) {

        this.font = font;
        this.particle = particle;
        this.container = document.querySelector('#magic')!;
        this.scene = new Scene();
        this.createCamera();
        this.createRenderer();
        this.setup()
        this.bindEvents();
    }

    private font: Font;
    private particle: Texture;
    private container: HTMLElement;
    private scene: Scene;
    private createParticles: CreateParticles
    private renderer: WebGLRenderer
    private camera: PerspectiveCamera

    bindEvents() {

        window.addEventListener('resize', this.onWindowResize.bind(this));

    }

    setup() {
        // this.scene.background = new Color(0xffffff) // set background-color
        this.createParticles = new CreateParticles(this.scene, this.font, this.particle, this.camera, this.renderer);
    }

    render() {

        this.createParticles.render()
        this.renderer.render(this.scene, this.camera)
    }

    createCamera() {

        this.camera = new PerspectiveCamera(65, this.container.clientWidth / this.container.clientHeight, 1, 10000);
        this.camera.position.set(0, 0, 100);

    }

    createRenderer() {

        this.renderer = new WebGLRenderer();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);

        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        this.renderer.outputColorSpace = SRGBColorSpace;
        this.container.appendChild(this.renderer.domElement);

        this.renderer.setAnimationLoop(() => { this.render() })
    }

    onWindowResize() {

        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);

    }
}

class CreateParticles {

    constructor(scene: Scene, font: Font, particleImg: Texture, camera: PerspectiveCamera, renderer: WebGLRenderer) {

        this.scene = scene;
        this.font = font;
        this.particleImg = particleImg;
        this.camera = camera;
        this.renderer = renderer;

        this.raycaster = new Raycaster();
        this.mouse = new Vector2(-200, 200);

        this.colorChange = new Color();

        this.button = false;

        this.data = {
            text: "WELCOME I'M SONNY",
            amount: 500,
            particleSize: 1,
            particleColor: 0xfffff,
            textSize: 16,
            area: 250,
            ease: .05,
        }

        this.setup();
        this.bindEvents();

    }

    private scene: Scene
    private font: Font
    private particleImg: Texture
    private camera: PerspectiveCamera
    private renderer: WebGLRenderer
    private raycaster: Raycaster
    private mouse: Vector2
    private colorChange: Color
    private button: boolean
    private data: Data
    private planeArea: Mesh
    private currentPosition: Vector3
    private particles: Points
    private geometryCopy: BufferGeometry



    setup() {
        const geometry = new PlaneGeometry(this.visibleWidthAtZDepth(10, this.camera), this.visibleHeightAtZDepth(5, this.camera));
        const material = new MeshBasicMaterial({ color: 0xffffff, transparent: true });
        this.planeArea = new Mesh(geometry, material);
        this.planeArea.visible = false;
        this.createText();
    }

    bindEvents() {
        document.addEventListener('mousedown', this.onMouseDown.bind(this));
        document.addEventListener('mousemove', this.onMouseMove.bind(this));
        document.addEventListener('mouseup', this.onMouseUp.bind(this));
    }

    onMouseDown(event: MouseEvent) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

        const vector = new Vector3(this.mouse.x, this.mouse.y, 0.5);
        vector.unproject(this.camera);
        const dir = vector.sub(this.camera.position).normalize();
        const distance = - this.camera.position.z / dir.z;
        this.currentPosition = this.camera.position.clone().add(dir.multiplyScalar(distance));

        const pos = this.particles.geometry.attributes.position;
        this.button = true;
        this.data.ease = .01;

    }

    onMouseUp() {
        this.button = false;
        this.data.ease = .05;
    }

    onMouseMove(event: MouseEvent) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
    }

    render() {
        const time = ((.001 * performance.now()) % 12) / 12;
        const zigzagTime = (1 + (Math.sin(time * 2 * Math.PI))) / 6;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        const intersects = this.raycaster.intersectObject(this.planeArea);

        if (intersects.length > 0) {

            const pos = this.particles.geometry.attributes.position;
            const copy = this.geometryCopy.attributes.position;
            const colors = this.particles.geometry.attributes.customColor;
            const size = this.particles.geometry.attributes.size;

            const mx = intersects[0].point.x;
            const my = intersects[0].point.y;
            const mz = intersects[0].point.z;

            for (var i = 0, l = pos.count; i < l; i++) {

                const initX = copy.getX(i);
                const initY = copy.getY(i);
                const initZ = copy.getZ(i);

                let px = pos.getX(i);
                let py = pos.getY(i);
                let pz = pos.getZ(i);

                this.colorChange.setHSL(.5, 1, 1)
                colors.setXYZ(i, this.colorChange.r, this.colorChange.g, this.colorChange.b)
                colors.needsUpdate = true;

                size.array[i] = this.data.particleSize;
                size.needsUpdate = true;

                let dx = mx - px;
                let dy = my - py;
                const dz = mz - pz;

                const mouseDistance = this.distance(mx, my, px, py)
                let d = (dx = mx - px) * dx + (dy = my - py) * dy;
                const f = - this.data.area / d;

                if (this.button) {

                    const t = Math.atan2(dy, dx);
                    px -= f * Math.cos(t);
                    py -= f * Math.sin(t);

                    this.colorChange.setHSL(.5 + zigzagTime, 1.0, .5)
                    colors.setXYZ(i, this.colorChange.r, this.colorChange.g, this.colorChange.b)
                    colors.needsUpdate = true;

                    if ((px > (initX + 70)) || (px < (initX - 70)) || (py > (initY + 70) || (py < (initY - 70)))) {

                        this.colorChange.setHSL(.15, 1.0, .5)
                        colors.setXYZ(i, this.colorChange.r, this.colorChange.g, this.colorChange.b)
                        colors.needsUpdate = true;

                    }

                } else {

                    if (mouseDistance < this.data.area) {

                        if (i % 5 == 0) {

                            const t = Math.atan2(dy, dx);
                            px -= .03 * Math.cos(t);
                            py -= .03 * Math.sin(t);

                            this.colorChange.setHSL(.15, 1.0, .5)
                            colors.setXYZ(i, this.colorChange.r, this.colorChange.g, this.colorChange.b)
                            colors.needsUpdate = true;

                            size.array[i] = this.data.particleSize / 1.2;
                            size.needsUpdate = true;

                        } else {

                            const t = Math.atan2(dy, dx);
                            px += f * Math.cos(t);
                            py += f * Math.sin(t);

                            pos.setXYZ(i, px, py, pz);
                            pos.needsUpdate = true;

                            size.array[i] = this.data.particleSize * 1.3;
                            size.needsUpdate = true;
                        }

                        if ((px > (initX + 10)) || (px < (initX - 10)) || (py > (initY + 10) || (py < (initY - 10)))) {

                            this.colorChange.setHSL(.15, 1.0, .5)
                            colors.setXYZ(i, this.colorChange.r, this.colorChange.g, this.colorChange.b)
                            colors.needsUpdate = true;

                            size.array[i] = this.data.particleSize / 1.8;
                            size.needsUpdate = true;

                        }
                    }

                }

                px += (initX - px) * this.data.ease;
                py += (initY - py) * this.data.ease;
                pz += (initZ - pz) * this.data.ease;

                pos.setXYZ(i, px, py, pz);
                pos.needsUpdate = true;

            }
        }
    }

    createText() {

        let thePoints: Vector3[] = [];

        let shapes = this.font.generateShapes(this.data.text, this.data.textSize);
        let geometry = new ShapeGeometry(shapes);
        geometry.computeBoundingBox();

        const xMid = - 0.5 * (geometry.boundingBox!.max.x - geometry.boundingBox!.min.x);
        const yMid = (geometry.boundingBox!.max.y - geometry.boundingBox!.min.y) / 2.85;

        geometry.center();

        let holeShapes: Path[] = [];

        for (let q = 0; q < shapes.length; q++) {

            let shape = shapes[q];

            if (shape.holes && shape.holes.length > 0) {

                for (let j = 0; j < shape.holes.length; j++) {

                    let hole = shape.holes[j];
                    holeShapes.push(hole);
                }
            }

        }
        shapes.push.apply(shapes, holeShapes as Shape[]);

        let colors: number[] = [];
        let sizes: number[] = [];

        for (let x = 0; x < shapes.length; x++) {

            let shape = shapes[x];

            const amountPoints = (shape.type == 'Path') ? this.data.amount / 2 : this.data.amount;

            let points = shape.getSpacedPoints(amountPoints);

            points.forEach((element: Vector2, z: number) => {

                const a = new Vector3(element.x, element.y, 0);
                thePoints.push(a);
                colors.push(this.colorChange.r, this.colorChange.g, this.colorChange.b);
                sizes.push(1)

            });
        }

        let geoParticles = new BufferGeometry().setFromPoints(thePoints);
        geoParticles.translate(xMid, yMid, 0);

        geoParticles.setAttribute('customColor', new Float32BufferAttribute(colors, 3));
        geoParticles.setAttribute('size', new Float32BufferAttribute(sizes, 1));

        const material = new ShaderMaterial({

            uniforms: {
                color: { value: new Color(0xfffff) },
                pointTexture: { value: this.particleImg }
            },
            vertexShader: require("@/components/shader/vertex-shader.vert"),
            fragmentShader: require("@/components/shader/fragment-shader.frag"),
            blending: AdditiveBlending,
            depthTest: false,
            transparent: true,
        });

        // const material = new MeshBasicMaterial({
        // 	color: new Color(0x000),
        // 	map: this.particleImg
        // })

        this.particles = new Points(geoParticles, material);
        this.scene.add(this.particles);

        this.geometryCopy = new BufferGeometry();
        this.geometryCopy.copy(this.particles.geometry);

    }

    visibleHeightAtZDepth(depth: number, camera: PerspectiveCamera) {
        const cameraOffset = camera.position.z;
        if (depth < cameraOffset) depth -= cameraOffset;
        else depth += cameraOffset;

        const vFOV = camera.fov * Math.PI / 180;

        return 2 * Math.tan(vFOV / 2) * Math.abs(depth);
    }

    visibleWidthAtZDepth(depth: number, camera: PerspectiveCamera) {
        const height = this.visibleHeightAtZDepth(depth, camera);
        return height * camera.aspect;
    }

    distance(x1: number, y1: number, x2: number, y2: number) {
        return Math.sqrt(Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2));
    }
}