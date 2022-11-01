const inertia = 0.1;

export class Camera {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.target = [0, 0];
    }

    place(x, y) {
        this.x = x;
        this.y = y;
        this.target = [x, y];
    }

    update() {
        this.x = this.x * (1 - inertia) + this.target[0] * inertia;
        this.y = this.y * (1 - inertia) + this.target[1] * inertia;
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);
    }
}