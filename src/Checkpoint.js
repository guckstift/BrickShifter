import {lerp, lerp3, round_rect, smoother_lerp} from "./utils.js";

export class Checkpoint {
    constructor(path, waypoint) {
        this.path = path;
        this.waypoint = waypoint;
        this.map = path.map;
        this.maze = this.map.maze;
        this.map_tiles = JSON.stringify(this.map.tiles);
        this.path_segmmap = JSON.stringify(this.path.segmap);
        this.best_pos = [...this.path.best_pos];
        this.unreached_waypoints = [...this.maze.unreached_waypoints];
        this.reached_checkpoints = [...this.path.reached_checkpoints];
        this.start_time = performance.now();
    }

    restore() {
        this.map.tiles = JSON.parse(this.map_tiles);
        this.path.segmap = JSON.parse(this.path_segmmap);
        this.path.best_pos = [...this.best_pos];
        this.map.maze.unreached_waypoints = [...this.unreached_waypoints];
        this.path.reached_checkpoints = [...this.reached_checkpoints];
        this.path.new_checkpoint = this;
    }

    draw(ctx, camera, isnew) {
        let now = performance.now();
        let elapsed = now - this.start_time;
        let way = smoother_lerp(0, 1, Math.min(elapsed / 1000, 1));
        let scale = 7 * way;
        let w = 64 * scale;
        let h = 64 * scale;
        let radius = lerp(w / 2, 16, way);
        let x = (this.waypoint[0] * 7 + 4) * 64 - camera.x + 32 - w/2;
        let y = (this.waypoint[1] * 7 + 4) * 64 - camera.y + 32 - h/2;
        let color = lerp3([255,0,0], [128,255,128], way);

        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgb(" + color.join(",") + ")";
        ctx.setLineDash([8, 8]);
        if(!isnew) ctx.globalAlpha = 0.5;
        round_rect(ctx, radius, x, y, w, h);
        ctx.globalAlpha = 1;
    }
}