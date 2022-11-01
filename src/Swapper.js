const duration = 500;

function lerp(a, b, t) {
    return a + t * (b - a);
}

function smoother_lerp(a, b, t) {
    return lerp(a, b, 6 * t**5 - 15 * t**4 + 10 * t**3);
}

export class Swapper {
    constructor() {
        this.swapping = false;
    }

    swap(pos1, pos2, tile1, tile2) {
        this.pos1 = pos1;
        this.pos2 = pos2;
        this.tile1 = tile1;
        this.tile2 = tile2;
        this.start_time = performance.now();
        this.way = 0;
        this.swapping = true;

        return new Promise(resolve => {
            requestAnimationFrame(() => this.swap_step(resolve));
        });
    }

    swap_step(resolve) {
        this.way = (performance.now() - this.start_time) / duration;

        if(this.way >= 1) {
            this.swapping = false;
            resolve();
        }
        else {
            requestAnimationFrame(() => this.swap_step(resolve));
        }
    }

    draw(ctx, img, camera) {
        if(this.swapping) {
            {
                let tx = this.tile1 % 4;
                let ty = Math.floor(this.tile1 / 4);
                let sx = tx * 64;
                let sy = ty * 64;
                let x = smoother_lerp(this.pos1[0], this.pos2[0], this.way);
                let y = smoother_lerp(this.pos1[1], this.pos2[1], this.way);
                let dx = x * 64 - camera.x;
                let dy = y * 64 - camera.y;

                ctx.drawImage(
                    img, sx, sy, 64, 64, Math.floor(dx), Math.floor(dy), 64, 64
                );
            }
            {
                let tx = this.tile2 % 4;
                let ty = Math.floor(this.tile2 / 4);
                let sx = tx * 64;
                let sy = ty * 64;
                let x = smoother_lerp(this.pos1[0], this.pos2[0], 1 - this.way);
                let y = smoother_lerp(this.pos1[1], this.pos2[1], 1 - this.way);
                let dx = x * 64 - camera.x;
                let dy = y * 64 - camera.y;

                ctx.drawImage(
                    img, sx, sy, 64, 64, Math.floor(dx), Math.floor(dy), 64, 64
                );
            }
        }
    }
}