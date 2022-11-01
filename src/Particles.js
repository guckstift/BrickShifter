import {rand_int_range, rand_range} from "./utils.js";

export class Particles {
    constructor(count, lifetime) {
        this.count = count;
        this.lifetime = lifetime;
        this.items = [];
        this.last_time = performance.now();
    }

    start(variant, ox, oy) {
        for(let i=0; i < this.count; i++) {
            let x = ox + rand_int_range(-32, +32);
            let y = oy + rand_int_range(-32, +32);
            let vx = rand_range(-16, +16);
            let vy = rand_range(-16, +16);
            let age = 0;
            let alpha = 1;
            let scale = rand_range(0.5, 1);
            let angle = rand_range(0, 360);
            let fade = rand_range(1, 2);

            this.items.push({
                x, y, vx, vy,
                variant, age, alpha, scale, angle, fade
            });
        }
    }

    draw(ctx, img, camera) {
        let now = performance.now();
        let delta = now - this.last_time;
        let delta_secs = delta / 1000;

        this.items.forEach(item => {
            item.vy += 128 * delta_secs;
            item.x += item.vx * delta_secs;
            item.y += item.vy * delta_secs;
            item.age += delta;
            item.alpha -= delta / this.lifetime * item.fade;

            if(item.age < this.lifetime) {
                let tx = item.variant % 4;
                let ty = Math.floor(item.variant / 4);
                let sx = tx * 16;
                let sy = ty * 16;
                let w = 16 * item.scale;
                let h = 16 * item.scale;

                ctx.globalAlpha = Math.max(item.alpha, 0);
                ctx.translate(item.x - camera.x, item.y - camera.y);
                ctx.rotate(item.angle * Math.PI / 180);
                ctx.translate(-w/2, -h/2);
                ctx.drawImage(img, sx, sy, 16, 16, 0, 0, w, h);
                ctx.globalAlpha = 1;
                ctx.setTransform(1, 0, 0, 1, 0, 0);
            }
        });

        this.items = this.items.filter(item =>
            item.age < this.lifetime && item.alpha > 0
        );

        this.last_time = now;
    }
}