import {lerp, lerp3, round_rect, smoother_lerp} from "./utils.js";

export class Checkpoint {
    constructor(map, path, pos) {
        this.map = map;
        this.path = path;
        this.pos = pos;
        this.map_tiles = JSON.stringify(map.tiles);
        this.path_segments = JSON.stringify(path.segments);
        this.best_pos = [...path.best_pos];
        this.reached_checkpoints = [...path.reached_checkpoints];
        this.start_time = performance.now();
    }

    restore() {
        this.map.tiles = JSON.parse(this.map_tiles);
        this.path.segments = JSON.parse(this.path_segments);
        this.path.best_pos = [...this.best_pos];
        this.path.reached_checkpoints = [...this.reached_checkpoints];
    }

    draw(ctx, camera, isnew) {
        let now = performance.now();
        let elapsed = now - this.start_time;
        let way = smoother_lerp(0, 1, Math.min(elapsed / 1000, 1));
        let scale = 7 * way;
        let w = 64 * scale;
        let h = 64 * scale;
        let radius = lerp(w / 2, 16, way);
        let x = (Math.floor(this.pos[0]/7) * 7 + 4) * 64 - camera.x + 32 - w/2;
        let y = (Math.floor(this.pos[1]/7) * 7 + 4) * 64 - camera.y + 32 - h/2;
        let color = lerp3([255,0,0], [128,255,128], way);

        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgb(" + color.join(",") + ")";
        ctx.setLineDash([8, 8]);
        if(!isnew) ctx.globalAlpha = 0.5;
        round_rect(ctx, radius, x, y, w, h);
        ctx.globalAlpha = 1;
    }
}