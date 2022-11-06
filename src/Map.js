import {is_vec_in_array, rand, srand} from "./utils.js";
import {Maze} from "./Maze.js";

export class Map {
    constructor(seed, width, height, tiles, dither, maze) {
        this.width = width + 2;
        this.height = height + 2;
        this.tiles = Array(height);
        this.start = [3,3];
        this.goal = [this.width - 4, this.height - 4];
        this.maze = null;
        this.next_goal = this.goal;

        for(let x=1; x < width + 1; x++) {
            this.set_tile(x, 0, 15);
            this.set_tile(x, height + 1, 15);
        }

        for(let y=1; y < height + 1; y++) {
            this.set_tile(0, y, 15);
            this.set_tile(width + 1, y, 15);
        }

        srand(seed);

        for(let y=1; y < height + 1; y++) {
            for(let x=1; x < width + 1; x++) {
                let tile = Math.floor(rand() * tiles) + 1;
                let way = 1 - this.euclidean_dist(x,y)/this.euclidean_total();

                if(dither === 2 || dither === 1 && rand() <= way) {
                    let left = this.get_tile(x-1, y);
                    let top = this.get_tile(x, y-1);

                    if(left && left === tile || top && top === tile) {
                        tile = Math.floor(rand() * tiles) + 1;
                    }
                }

                this.set_tile(x, y, tile);
            }
        }

        if(maze) {
            this.start = [4,4];
            this.goal = [this.width - 5, this.height - 5];
            this.maze = new Maze(Math.floor(width/7), Math.floor(height/7));
            this.update_next_goal();
        }

        for(let y = -1; y <= +1; y++) {
            for(let x = -1; x <= +1; x++) {
                this.set_tile(this.start[0]+x, this.start[1]+y, 0);
                this.set_tile(this.goal[0]+x, this.goal[1]+y, 0);
            }
        }

        if(maze) {
            for(let y=0; y < this.maze.height; y++) {
                for(let x=0; x < this.maze.width; x++) {
                    if(this.maze.maze[y][x] === 0) {
                        this.fill_rect(1+x*7, 1+y*7, 7, 7, 0);

                        for(let dx=0; dx<7; dx++) {
                            if(y > 0 && this.maze.maze[y-1][x] > 0) {
                                this.set_tile(1+x*7+dx, 1+y*7, 15);
                            }
                            if(
                                y < this.maze.height-1 &&
                                this.maze.maze[y+1][x] > 0
                            ) {
                                this.set_tile(1+x*7+dx, 7+y*7, 15);
                            }
                        }

                        for(let dy=0; dy<7; dy++) {
                            if(x > 0 && this.maze.maze[y][x-1] > 0) {
                                this.set_tile(1+x*7, 1+y*7+dy, 15);
                            }
                            if(
                                x < this.maze.width-1 &&
                                this.maze.maze[y][x+1] > 0
                            ) {
                                this.set_tile(7+x*7, 1+y*7+dy, 15);
                            }
                        }
                    }
                }
            }
        }
    }

    update_next_goal() {
        if(this.maze && this.maze.unreached_waypoints.length) {
            let [wpx, wpy] = this.maze.unreached_waypoints[0];
            this.next_goal = [wpx * 7 + 4, wpy * 7 + 4];
        }
        else {
            this.next_goal = this.goal;
        }
    }

    reach_waypoint_at(x, y) {
        if(this.maze && this.tilepos_in_map(x, y)) {
            let cx = Math.floor((x - 1) / 7);
            let cy = Math.floor((y - 1) / 7);
            let waypoint = [cx,cy];

            if(this.maze.reach_waypoint_at(cx, cy)) {
                this.update_next_goal();
                return waypoint;
            }
        }

        return null;
    }

    get_heuristic_dist(sx, sy, gx, gy) {
        if(this.maze) {
            return this.maze.get_travel_dist(sx, sy, gx, gy);
        }
        else {
            return Math.abs(gx - sx) + Math.abs(gy - sy);
        }
    }

    euclidean_dist(fromx, fromy) {
        return Math.sqrt(
            (fromx - this.goal[0]) ** 2 +
            (fromy - this.goal[1]) ** 2
        );
    }

    euclidean_total() {
        return Math.sqrt(
            (this.start[0] - this.goal[0]) ** 2 +
            (this.start[1] - this.goal[1]) ** 2
        );
    }

    tilepos_in_map(x, y) {
        return x >= 0 & y >= 0 && x < this.width && y < this.height;
    }

    fill_rect(x, y, w, h, t) {
        for(let dy=0; dy<w; dy++) {
            for(let dx=0; dx<h; dx++) {
                this.set_tile(x+dx, y+dy, t);
            }
        }
    }

    set_tile(x, y, t) {
        if(this.tilepos_in_map(x, y)) {
            this.tiles[y] = this.tiles[y] || [];
            this.tiles[y][x] = t;
        }
    }

    get_tile(x, y) {
        if(this.tilepos_in_map(x, y)) {
            this.tiles[y] = this.tiles[y] || [];
            return this.tiles[y][x];
        }
    }

    is_selectable(x, y) {
        let tile = this.get_tile(x, y);
        return tile >= 1 && tile <= 6;
    }

    flood_test(x, y, start_tile = null, visited = null) {
        let tile = this.get_tile(x, y);

        if(start_tile === null) {
            start_tile = tile;
        }

        if(visited === null) {
            visited = [];
        }

        if(tile !== start_tile) {
            return visited;
        }

        visited.push([x,y]);

        let left  = [x - 1, y];
        let right = [x + 1, y];
        let up    = [x, y - 1];
        let down  = [x, y + 1];

        if(!is_vec_in_array(visited, left)) {
            this.flood_test(...left, start_tile, visited);
        }
        if(!is_vec_in_array(visited, right)) {
            this.flood_test(...right, start_tile, visited);
        }
        if(!is_vec_in_array(visited, up)) {
            this.flood_test(...up, start_tile, visited);
        }
        if(!is_vec_in_array(visited, down)) {
            this.flood_test(...down, start_tile, visited);
        }

        return visited
    }

    draw(ctx, img, camera) {
        for(let y=0; y < this.height; y++) {
            for(let x=0; x < this.width; x++) {
                let tile = this.get_tile(x,y);

                if(!tile) {
                    continue;
                }

                let tx = tile % 4;
                let ty = Math.floor(tile / 4);
                let sx = tx * 64;
                let sy = ty * 64;
                let dx = x * 64 - camera.x;
                let dy = y * 64 - camera.y;

                if(
                    dx + 64 < 0 || dy + 64 < 0 ||
                    dx >= ctx.canvas.width || dy >= ctx.canvas.height
                ) {
                    continue;
                }

                ctx.drawImage(
                    img,
                    sx, sy, 64, 64,
                    Math.floor(dx), Math.floor(dy), 64, 64,
                );
            }
        }
    }
}