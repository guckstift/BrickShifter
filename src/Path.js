import {PrioQueue} from "./PrioQueue.js";
import {Checkpoint} from "./Checkpoint.js";
import {get_adjs} from "./utils.js";

export class Path {
    constructor(map) {
        this.map = map;
        this.segmap = Array(map.height);
        this.best_pos = this.map.start;
        this.reached_checkpoints = [];
        this.new_checkpoint = null;

        for(let i=0; i<map.height; i++) {
            this.segmap[i] = Array(map.width).fill(false);
        }

        this.segmap[map.start[1]][map.start[0]] = 0;
    }

    manhatten() {
        return (
            Math.abs(this.best_pos[0] - this.map.goal[0]) +
            Math.abs(this.best_pos[1] - this.map.goal[1])
        );
    }

    draw(ctx, img, camera) {
        for(let ty=0; ty < this.map.height; ty++) {
            for(let tx=0; tx < this.map.width; tx++) {
                if(this.segmap[ty][tx] !== false) {
                    let x = Math.floor(tx * 64 - camera.x);
                    let y = Math.floor(ty * 64 - camera.y);

                    if(
                        x + 64 >= 0 && y + 64 >= 0 &&
                        x < ctx.canvas.width && y < ctx.canvas.height
                    ) {
                        let segment = this.segmap[ty][tx];
                        let vx = segment & 0b11;
                        let vy = segment >> 2;

                        ctx.drawImage(
                            img,
                            vx * 64, vy * 64, 64, 64,
                            x, y, 64, 64
                        );
                    }
                }
            }
        }
    }

    update() {
        let start = this.best_pos;
        // let start = this.map.start;
        let [sx, sy] = start;
        let [gx, gy] = this.map.next_goal;
        let costmap = Array(this.map.height);
        let pathmap = Array(this.map.height);
        let frontier = new PrioQueue();
        let best_dist = Math.abs(gx - sx) + Math.abs(gy - sy);
        let best_pos = start;
        let reached_goal = false;

        // init maps
        for(let y=0; y < this.map.height; y++) {
            costmap[y] = Array(this.map.width).fill(Infinity);
            pathmap[y] = Array(this.map.width).fill(null);
        }

        // find path towards next goal
        costmap[sy][sx] = 0;
        frontier.push(start, 0);
        while(frontier.items.length) {
            let cur = frontier.pop();
            let [cx, cy] = cur;

            if(cx === gx && cy === gy) {
                reached_goal = true;
                break;
            }

            for(let adj of get_adjs(cx, cy)) {
                let [ax, ay] = adj;
                let tile = this.map.get_tile(ax, ay);

                if(tile === 0) {
                    let old_cost = costmap[ay][ax];
                    let new_cost = costmap[cy][cx] + 1;

                    if(new_cost < old_cost) {
                        let dist = this.map.get_heuristic_dist(ax,ay,gx,gy);
                        let prio = new_cost + dist;
                        frontier.push(adj, prio);
                        costmap[ay][ax] = new_cost;
                        pathmap[ay][ax] = cur;

                        if(dist < best_dist) {
                            best_dist = dist;
                            best_pos = adj;
                        }
                    }
                }
            }
        }

        // retrace path
        let path = [best_pos];
        let [cx, cy] = best_pos;
        while(cx !== sx || cy !== sy) {
            [cx, cy] = pathmap[cy][cx];
            path.unshift([cx, cy]);
        }

        if(this.new_checkpoint) {
            let checkpoint = this.new_checkpoint;
            this.new_checkpoint = null;
            this.reached_checkpoints.push(checkpoint);
        }

        this.best_pos = best_pos;
        let new_waypoint = null;

        for(let i=0; i < path.length; i++) {
            let [sx,sy] = path[i];
            let [lx,ly] = path[i-1] || [sx,sy];
            let [nx,ny] = path[i+1] || [sx,sy];
            let waypoint = this.map.reach_waypoint_at(sx, sy);
            let segment = this.segmap[sy][sx];

            if(lx > sx || nx > sx) {
                segment |= 1;
            }
            if(lx < sx || nx < sx) {
                segment |= 2;
            }
            if(ly > sy || ny > sy) {
                segment |= 4;
            }
            if(ly < sy || ny < sy) {
                segment |= 8;
            }

            this.segmap[sy][sx] = segment;

            if(waypoint) {
                new_waypoint = waypoint;
            }
        }

        if(new_waypoint) {
            this.new_checkpoint = new Checkpoint(this, new_waypoint);
        }

        return (
            reached_goal && gx === this.map.goal[0] && gy === this.map.goal[1]
        );
    }
}