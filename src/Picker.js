export class Picker {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.enabled = false;
    }

    draw(ctx, img, camera) {
        if(this.enabled) {
            let x = this.x * 64 - 32 - camera.x;
            let y = this.y * 64 - 32 - camera.y;
            ctx.drawImage(img, Math.floor(x), Math.floor(y));
        }
    }

    place(x, y) {
        this.x = x;
        this.y = y;
        this.enabled = true;
    }

    disable() {
        this.enabled = false;
    }
}