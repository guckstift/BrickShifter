export class Arrows {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.enabled = false;
        this.flip = false;
        this.invalid = false;
    }

    place_between(pos1, pos2) {
        this.x = (pos1[0] + pos2[0]) / 2;
        this.y = (pos1[1] + pos2[1]) / 2;
        this.flip = pos1[1] !== pos2[1];
        this.enabled = true;
        this.invalid = false;
    }

    set_invalid() {
        this.invalid = true;
    }

    disable() {
        this.enabled = false;
    }

    draw(ctx, img, camera) {
        if(this.enabled) {
            let sx = this.flip ? 64 : 0;
            let sy = this.invalid ? 64 : 0;
            ctx.drawImage(
                img,
                sx, sy, 64, 64,
                this.x * 64 - camera.x,
                this.y * 64 - camera.y,
                64, 64,
            );
        }
    }
}