/*
 * Planets
 *   - Made by Abigail Sokol
 *   - Last updated 5/1/2022 (d/m/y)
*/

// libraries
import * as gx from "https://threejs.org/build/three.module.js";
import { OrbitControls } from 'https://threejs.org/examples/jsm/controls/OrbitControls.js';

// basic setup
const canv = document.getElementById("main");

const scene = new gx.Scene();
const cam = new gx.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);

cam.position.z = -80;
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

        this.spin = spin / 100;

        this.cx = ix;
        this.cy = iy;
        this.cz = iz;

        m = m * 80000000;

        this.m = m;

        rad = (rad <= 0) ? m * 2 : rad;

        this.r = rad;
        
        const geometry = new gx.SphereGeometry(rad, res, res);
        const material = new gx.MeshBasicMaterial({map: texture, color: 0xCCCCFF});
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
            this.vx += (this.vx > 0) ? -0.0001 : 0.0001;
        }
        if(Math.abs(this.vy) > 0.01){
            this.vy += (this.vy > 0) ? -0.0001 : 0.0001;
        }
        if(Math.abs(this.vz) > 0.01){
            this.vz += (this.vz > 0) ? -0.0001 : 0.0001;
        }

        this.x = this.cx + this.vx;
        this.y = this.cy + this.vy;
        this.z = this.cz + this.vz;

        this.shape.rotation.x += this.spin;
        this.shape.rotation.y -= this.spin;
    }

    dist(ex, ey, ez, r){
        const v = Math.sqrt((this.cx - ex) ** 2 + (this.cy - ey) ** 2 + (this.cz - ez) ** 2);
        return (v > this.r + r) ? v : -1;
    }
}

class World {
    planets = [];

    create(n = 0){
        this.planets = [];
        for(var i = 0; i < n; i++){
            this.planets.push(new Planet(rand(-40, 40), rand(-40, 40), rand(-40, 40), 20, undefined, 0x8888FF, 1));
        }
    }

    clear(){
        for(var i = 0; i < this.planets.length; i++){
            scene.remove(this.planets[i].shape);
        }
        this.planets = [];
    }

    add(item){
        if(!item){
            this.planets.push(new Planet(rand(-40, 40), rand(-40, 40), rand(-40, 40), 20, undefined, 0x8888FF, 1));
        } else {
            this.planets.push(item);
        }
    }

    constructor(n = 0){
        this.create(n);
    }

    update(){
        for(var i = 0; i < this.planets.length; i++){
            var p = this.planets[i];

            for(var j = i + 1; j < this.planets.length; j++){
                var ex = this.planets[j];
                
                const r3 = p.dist(ex.cx, ex.cy, ex.cz, ex.r) ** 3;

                if(r3 == -1){
                    var svx = p.vx, svy = p.vy, svz = p.vz;
                    const mr = ex.m / (p.m + ex.m);
                    p.vx = ex.vx * mr;
                    p.vy = ex.vy * mr;
                    p.vz = ex.vz * mr;
                    p.m += ex.m;
                    
                    // I know this is not how this works
                    // however, close enough for now
                    p.shape.scale.x += ex.shape.scale.x;
                    p.shape.scale.y += ex.shape.scale.y;
                    p.shape.scale.z += ex.shape.scale.z;
                    p.r += ex.r;

                    scene.remove(ex.shape);

                    this.planets.splice(j, 1);

                    p.x = (p.cx + ex.cx) / 2;
                    p.y = (p.cy + ex.cy) / 2;
                    p.z = (p.cz + ex.cz) / 2;
                    
                    continue;
                }

                const f = (G * p.m * ex.m) / r3;

                const fx = f * (ex.cx - p.cx);
                const fy = f * (ex.cy - p.cy);
                const fz = f * (ex.cz - p.cz);
                
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

const world = new World(10);

// reset
document.onkeydown = (event) => {
    switch(event.key){
        case 'r':
            world.clear();
            world.create(10);
            break;
        
        case 'a':
            world.add();
            break;
    }
}

// controls
const controls = new OrbitControls(cam, renderer.domElement);

// render loop
setInterval(() => {
    world.update();

    controls.update();

    renderer.render(scene, cam);
}, 10);
