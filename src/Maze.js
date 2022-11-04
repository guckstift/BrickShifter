import {randi} from "./utils.js";

export class Maze {
    constructor(width, height) {
        let maze = Array(height);    // maze (0=wall, 1=free)
        let corners = Array(height); // corner ids > 0
        let distmap = Array(height); // best distance traveled so far
        let pathmap = Array(height); // come-from map
        let goal = [width - 1, height - 1];
        let [gx, gy] = goal;

        this.maze = maze;
        this.corners = corners;
        this.width = width;
        this.height = height;

        // init maps
        for(let y=0; y < height; y++) {
            maze[y] = [];
            corners[y] = [];
            distmap[y] = [];
            pathmap[y] = [];

            for(let x=0; x < width; x++) {
                maze[y].push(0);
                corners[y].push(0);
                distmap[y].push(Infinity);
                pathmap[y].push(null);
            }
        }

        // generate maze
        let stack = [[0,0]];
        maze[0][0] = 1;
        while(stack.length) {
            let cur = stack.pop();
            let [cx, cy] = cur;

            let adjs = [
                [cx + 2, cy],
                [cx - 2, cy],
                [cx, cy + 2],
                [cx, cy - 2],
            ];

            adjs = adjs.filter(adj => {
                let [ax, ay] = adj;
                return ax >= 0 && ay >= 0 && ax < width && ay < height &&
                    maze[ay][ax] === 0;
            });

            if(adjs.length) {
                stack.push(cur);
                let adj = adjs[randi() % adjs.length];
                let [ax, ay] = adj;
                maze[ay][ax] = 1;
                maze[(ay+cy)/2][(ax+cx)/2] = 1;
                stack.push(adj);
            }
        }

        // mark corners
        let next_corner_id = 1;
        for(let y=0; y < height; y++) {
            for(let x=0; x < width; x++) {
                let cur = this.get_at(x, y);
                let left = this.get_at(x-1, y);
                let right = this.get_at(x+1, y);
                let up = this.get_at(x, y-1);
                let down = this.get_at(x, y+1);

                if(cur === 1) {
                    if(left !== right || up !== down) {
                        corners[y][x] = next_corner_id;
                        next_corner_id ++;
                    }
                }
            }
        }

        // find way through maze
        let frontier = [[0,0]];
        distmap[0][0] = 0;
        while(frontier.length) {
            let cur = frontier.shift();
            let [cx, cy] = cur;

            if(cx === gx && cy === gy) {
                break;
            }

            let adjs = [
                [cx + 1, cy],
                [cx - 1, cy],
                [cx, cy + 1],
                [cx, cy - 1],
            ];

            adjs = adjs.filter(adj => this.get_at(...adj) === 1);

            adjs.forEach(adj => {
                let [ax, ay] = adj;
                let distold = distmap[ay][ax];
                let distnew = distmap[cy][cx] + 1;

                if(distnew < distold) {
                    frontier.push(adj);
                    distmap[ay][ax] = distnew;
                    pathmap[ay][ax] = cur;
                }
            });
        }

        // retrace path
        let path = [goal];
        let cur = goal;
        let [cx,cy] = cur;
        while(cx !== 0 || cy !== 0) {
            cur = pathmap[cy][cx];
            [cx,cy] = cur;
            path.unshift(cur);
        }

        // record waypoints
        let waypoints = [];
        path.forEach(([px,py]) => {
            if((px > 0 || py > 0) && corners[py][px] > 0) {
                waypoints.push([px,py]);
            }
        });
        this.unreached_waypoints = waypoints;
    }

    reach_waypoint_at(x, y) {
        let index = this.unreached_waypoints.findIndex(([wpx, wpy]) => {
            return wpx === x && wpy === y;
        });

        if(index > -1) {
            this.unreached_waypoints.splice(0, index + 1);
            return true;
        }

        return false;
    }

    get_at(x, y) {
        if(x < 0 || y < 0 || x >= this.width || y >= this.height) {
            return 0;
        }

        return this.maze[y][x];
    }
}