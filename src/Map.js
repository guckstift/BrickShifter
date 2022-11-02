import {is_vec_in_array} from "./utils.js";

let rand_state = 0;

function randi()
{
    let x = rand_state + 1;
    x *= 3141592653; // scramble with 10 first digits of PI
    x ^= x >>> 2;    // xor with r-shift with 1. prime
    x ^= x << 5;     // xor with l-shift with 3. prime
    x ^= x >>> 11;   // xor with r-shift with 5. prime
    x ^= x << 17;    // xor with l-shift with 7. prime
    x ^= x >>> 23;   // xor with r-shift with 9. prime
    x ^= x << 31;    // xor with l-shift with 11. prime
    rand_state = x;
    return x >>> 0;
}

function rand()
{
    return randi() / 0xFFffFFff;
}

export class Map {
    constructor(seed, width, height, tiles, dither, maze) {
        this.width = width + 2;
        this.height = height + 2;
        this.start = maze ? [4,4] : [3,3];
        this.goal = maze ? [this.width - 5, this.height - 5] :
            [this.width - 4, this.height - 4];
        this.tiles = Array(height);

        for(let x=1; x < width + 1; x++) {
            this.set_tile(x, 0, 15);
            this.set_tile(x, height + 1, 15);
        }

        for(let y=1; y < height + 1; y++) {
            this.set_tile(0, y, 15);
            this.set_tile(width + 1, y, 15);
        }

        rand_state = seed;

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

        for(let y = -1; y <= +1; y++) {
            for(let x = -1; x <= +1; x++) {
                this.set_tile(this.start[0]+x, this.start[1]+y, 0);
                this.set_tile(this.goal[0]+x, this.goal[1]+y, 0);
            }
        }

        if(maze) {
            this.gen_maze(width, height);
        }
    }

    gen_maze(width, height) {
        let maze_width = Math.floor(width / 7);
        let maze_height = Math.floor(height / 7);
        let maze = Array(maze_height);
        let corners = Array(maze_height);

        for(let y=0; y < maze_height; y++) {
            maze[y] = [];
            corners[y] = [];

            for(let x=0; x < maze_width; x++) {
                maze[y].push(0);
                corners[y].push(0);
            }
        }

        let cur = [0, 0];
        let stack = [cur];
        let [cx, cy] = cur;
        maze[cy][cx] = 1;

        while(stack.length) {
            cur = stack.pop();
            [cx, cy] = cur;

            let adjs = [
                [cx + 2, cy],
                [cx - 2, cy],
                [cx, cy + 2],
                [cx, cy - 2],
            ];

            adjs = adjs.filter(adj => {
                let [ax, ay] = adj;
                return (
                    ax >= 0 && ay >= 0 &&
                    ax < maze_width && ay < maze_height &&
                    maze[ay][ax] === 0
                );
            })

            if(adjs.length) {
                stack.push(cur);
                let adj = adjs[randi() % adjs.length];
                let [ax, ay] = adj;
                maze[ay][ax] = 1;
                maze[(ay+cy)/2][(ax+cx)/2] = 1;
                stack.push(adj);
            }
        }

        let next_checkpoint = 1;

        // mark corners
        for(let y=0; y < maze_height; y++) {
            for(let x=0; x < maze_width; x++) {
                let cur = maze[y][x];
                let left = x-1 < 0 ? 0 : maze[y][x-1];
                let right = x+1 >= maze_width ? 0 : maze[y][x+1];
                let up = y-1 < 0 ? 0 : maze[y-1][x];
                let down = y+1 >= maze_width ? 0 : maze[y+1][x];

                if(cur === 1) {
                    if(left !== right || up !== down) {
                        corners[y][x] = next_checkpoint;
                        next_checkpoint ++;
                    }
                }
            }
        }

        this.corners = corners;

        for(let y=0; y < maze_height; y++) {
            for(let x=0; x < maze_width; x++) {
                if(maze[y][x] === 0) {
                    this.fill_rect(1+x*7, 1+y*7, 7, 7, 0);

                    for(let dx=0; dx<7; dx++) {
                        if(y > 0 && maze[y-1][x] > 0) {
                            this.set_tile(1+x*7+dx, 1+y*7, 15);
                        }
                        if(y < maze_height-1 && maze[y+1][x] > 0) {
                            this.set_tile(1+x*7+dx, 7+y*7, 15);
                        }
                    }

                    for(let dy=0; dy<7; dy++) {
                        if(x > 0 && maze[y][x-1] > 0) {
                            this.set_tile(1+x*7, 1+y*7+dy, 15);
                        }
                        if(x < maze_width-1 && maze[y][x+1] > 0) {
                            this.set_tile(7+x*7, 1+y*7+dy, 15);
                        }
                    }
                }
            }
        }
    }

    get_checkpoint_at(x, y) {
        if(this.corners && this.tilepos_in_map(x, y)) {
            let cx = Math.floor((x - 1) / 7);
            let cy = Math.floor((y - 1) / 7);
            return this.corners[cy][cx];
        }

        return 0;
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