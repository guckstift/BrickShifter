import {PrioQueue} from "./PrioQueue.js";
import {Checkpoint} from "./Checkpoint.js";

export class Path {
    constructor(map) {
        this.map = map;
        this.segments = [this.map.start];
        this.best_pos = this.map.start;
        this.reached_checkpoints = [];
        this.new_checkpoint = null;
    }

    manhatten() {
        return (
            Math.abs(this.best_pos[0] - this.map.goal[0]) +
            Math.abs(this.best_pos[1] - this.map.goal[1])
        );
    }

    draw(ctx, img, camera) {
        let last = null;

        for(let i=0; i < this.segments.length; i++) {
            let [tx, ty] = this.segments[i];
            let x = Math.floor(tx * 64 - camera.x);
            let y = Math.floor(ty * 64 - camera.y);

            if(
                x + 64 < 0 || y + 64 < 0 ||
                x >= ctx.canvas.width || y >= ctx.canvas.height
            ) {
                last = [tx, ty];
                continue;
            }

            let j = 11;

            if(i === 0) {
                let next = this.segments[i + 1];
                let [nx, ny] = next || [0,0];

                if(i === this.segments.length - 1) {
                    j = 6;
                }
                else if(nx > tx) {
                    j = 7;
                }
                else if(nx < tx) {
                    j = 8;
                }
                else if(ny > ty) {
                    j = 9;
                }
                else if(ny < ty) {
                    j = 10;
                }
            }
            else if(i === this.segments.length - 1) {
                let [lx, ly] = last;

                if(lx > tx) {
                    j = 7;
                }
                else if(lx < tx) {
                    j = 8;
                }
                else if(ly > ty) {
                    j = 9;
                }
                else if(ly < ty) {
                    j = 10;
                }
            }
            else {
                let [lx, ly] = last;
                let next = this.segments[i + 1];
                let [nx, ny] = next || [0,0];

                if(lx === nx) {
                    j = 1;
                }
                else if(ly === ny) {
                    j = 0;
                }
                else if(tx < nx && ty < ly || tx < lx && ty < ny) {
                    j = 2; // right down
                }
                else if(lx < tx && ty < ny || nx < tx && ty < ly) {
                    j = 3; // left down
                }
                else if(tx < nx && ly < ty || tx < lx && ny < ty) {
                    j = 4; // right up
                }
                else if(lx < tx && ny < ty || nx < tx && ly < ty) {
                    j = 5; // left up
                }
            }

            let vx = j % 4;
            let vy = Math.floor(j / 4);

            ctx.drawImage(img, vx * 64, vy * 64, 64, 64, x, y, 64, 64);
            last = [tx, ty];
        }
    }

    update() {
        let [sx, sy] = this.map.start;
        let [gx, gy] = this.map.next_goal;
        let costmap = Array(this.map.height);
        let pathmap = Array(this.map.height);
        let frontier = new PrioQueue();
        let best_dist = Math.abs(gx - sx) + Math.abs(gy - sy);
        let best_pos = this.map.start;
        let reached_goal = false;

        // init maps
        for(let y=0; y < this.map.height; y++) {
            costmap[y] = Array(this.map.width).fill(Infinity);
            pathmap[y] = Array(this.map.width).fill(null);
        }

        // find path towards next goal
        costmap[sy][sx] = 0;
        frontier.push(this.map.start, 0);
        while(frontier.items.length) {
            let cur = frontier.pop();
            let [cx, cy] = cur;

            if(cx === gx && cy === gy) {
                reached_goal = true;
                break;
            }

            let adjs = [
                [cx + 1, cy],
                [cx - 1, cy],
                [cx, cy + 1],
                [cx, cy - 1],
            ];

            for(let adj of adjs) {
                let [ax, ay] = adj;

                if(this.map.get_tile(ax, ay) === 0) {
                    let old_cost = costmap[ay][ax];
                    let new_cost = costmap[cy][cx] + 1;

                    if(new_cost < old_cost) {
                        let dist = Math.abs(gx - ax) + Math.abs(gy - ay);
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

        this.segments = path;
        this.best_pos = best_pos;

        this.segments.forEach(segment => {
            let waypoint = this.map.reach_waypoint_at(...segment);

            if(waypoint) {
                this.new_checkpoint = new Checkpoint(this, waypoint);
            }
        });

        return (
            reached_goal && gx === this.map.goal[0] && gy === this.map.goal[1]
        );
    }
}