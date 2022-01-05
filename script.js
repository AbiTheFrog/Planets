/*
 * Planets
 *  Made by Abi
*/

// libraries
import * as gx from "https://threejs.org/build/three.module.js";
import { OrbitControls } from 'https://threejs.org/examples/jsm/controls/OrbitControls.js';

// basic setup
const canv = document.getElementById("main");

const scene = new gx.Scene();
const cam = new gx.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);

cam.position.z = -25;
cam.position.y = 5;

const renderer = new gx.WebGLRenderer({
    canvas: canv,
    antialias: true
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

renderer.render(scene, cam);

// resize handler
window.addEventListener("resize", () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    cam.aspect = window.innerWidth / window.innerHeight;
    cam.updateProjectionMatrix();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.render(scene, cam);
});

// constants, globals, and acronyms
const G = 6.67 * 10 ** -11;
const texture = new gx.TextureLoader().load( "texture.jpg" );

const rand = (min, max) => {
    return Math.random() * (max - min) + min;
}

class Planet {
    vx = 0;
    vy = 0;
    vz = 0;

    constructor(ix, iy, iz, m, res = 30, color = 0xFFFFFF, rad = -1, spin){
        if(!spin){
            spin = Math.random();
        }

        this.spin = spin / 10;

        this.cx = ix;
        this.cy = iy;
        this.cz = iz;

        m = m * 80000000;

        this.m = m;

        rad = (rad <= 0) ? m * 2 : rad;

        this.r = rad;
        
        const geometry = new gx.SphereGeometry(rad, res, res);
        const material = new gx.MeshBasicMaterial({map: texture});
        this.shape = new gx.Mesh(geometry, material);
        
        this.shape.position.set(ix, iy, iz);

        scene.add(this.shape);

        console.log("Created Planet {r: " + rad + ", x: " + this.cx + ", y: " + this.cy + ", z: " + this.cz + "}");
    }

    set x(v){
        this.cx = v;
        this.shape.position.x = v;
    }

    set y(v){
        this.cy = v;
        this.shape.position.y = v;
    }

    set z(v){
        this.cz = v;
        this.shape.position.z = v;
    }

    update(){
        // damp. (it helps... somehow)
        if(Math.abs(this.vx) > 0.01){
            this.vx += (this.vx > 0) ? -0.0008 : 0.0008;
        }
        if(Math.abs(this.vy) > 0.01){
            this.vy += (this.vy > 0) ? -0.0008 : 0.0008;
        }
        if(Math.abs(this.vz) > 0.01){
            this.vz += (this.vz > 0) ? -0.0008 : 0.0008;
        }

        this.x = this.cx + this.vx;
        this.y = this.cy + this.vy;
        this.z = this.cz + this.vz;

        this.shape.rotation.x += this.spin;
        this.shape.rotation.y -= this.spin;
    }

    dist(ex, ey, ez, r){
        const v = Math.sqrt((this.cx - ex) ** 2 + (this.cy - ey) ** 2 + (this.cz - ez) ** 2);
        return v;
    }
}

class World {
    planets = [];

    constructor(n = 0){
        for(var i = 0; i < n; i++){
            this.planets.push(new Planet(rand(-20, 20), rand(-20, 20), rand(-20, 20), 20, undefined, 0x8888FF, 1));
        }
    }

    update(){
        for(var i = 0; i < this.planets.length; i++){
            var p = this.planets[i];

            for(var j = i + 1; j < this.planets.length; j++){
                var ex = this.planets[j];
                
                const r3 = p.dist(ex.cx, ex.cy, ex.cz, ex.r) ** 3;

                const fx = (G * p.m * ex.m) / r3 * (ex.cx - p.cx);
                const fy = (G * p.m * ex.m) / r3 * (ex.cy - p.cy);
                const fz = (G * p.m * ex.m) / r3 * (ex.cz - p.cz);
                
                p.vx += fx / p.m;
                p.vy += fy / p.m;
                p.vz += fz / p.m;

                ex.vx -= fx / ex.m;
                ex.vy -= fy / ex.m;
                ex.vz -= fz / ex.m;
            }
        }

        for(var i = 0; i < this.planets.length; i++){
            this.planets[i].update();
        }
    }
}

const world = new World(5);

// controls
const controls = new OrbitControls(cam, renderer.domElement);

// render loop
setInterval(() => {
    world.update();

    controls.update();

    renderer.render(scene, cam);
}, 10);
