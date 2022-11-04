import {Map} from "./Map.js";
import {Camera} from "./Camera.js";
import {Picker} from "./Picker.js";
import {Swapper} from "./Swapper.js";
import {rand_range, load_image, sleep} from "./utils.js";
import {Particles} from "./Particles.js";
import {Arrows} from "./Arrows.js";
import {Path} from "./Path.js";
import {levels} from "./levels.js";

let level_number = 8;
let audio = new AudioContext();
let canvas = document.querySelector("#canvas");
let level_label = document.querySelector("#level_label");
let dist_label = document.querySelector("#dist_label");
let level_complete_label = document.querySelector("#level_complete_label");
let next_button = document.querySelector("#next_button");
let retry_button = document.querySelector("#retry_button");
let goback_button = document.querySelector("#goback_button");
let ctx = canvas.getContext("2d");
let img_blocks = await load_image("./gfx/blocks.png");
let img_picker = await load_image("./gfx/picker.png");
let img_selector = await load_image("./gfx/selector.png");
let img_particles = await load_image("./gfx/particles.png");
let img_arrows = await load_image("./gfx/arrows.png");
let img_vines = await load_image("./gfx/vines.png");
let snd_blop = await load_sound("./sfx/blop.ogg");
let snd_click = await load_sound("./sfx/click.ogg");
let snd_move1 = await load_sound("./sfx/move1.ogg");
let snd_move2 = await load_sound("./sfx/move2.ogg");
let snd_nope = await load_sound("./sfx/nope.ogg");
let camera = new Camera();
let picker = new Picker();
let selector = new Picker();
let swapper = new Swapper();
let particles = new Particles(16, 2000);
let arrows = new Arrows();
let map = null;
let path = null;
let mouse_start_x = 0;
let mouse_start_y = 0;
let panning = false;
let level_completed = false;

canvas.onmousedown = mousedown;
window.onmouseup = mouseup;
window.onmousemove = mousemove;
next_button.onclick = nextclick;
retry_button.onclick = retryclick;
goback_button.onclick = gobackclick;
start_level();
requestAnimationFrame(frame);

function start_level() {
    let level_data = levels[level_number - 1];

    map = new Map(
        level_data.seed,
        level_data.width, level_data.height, level_data.tiles,
        level_data.dither, level_data.maze
    );

    path = new Path(map);
    window.path = path;
    level_label.innerHTML = "Level: " + level_number;
    level_label.style.setProperty("--text-color", level_data.text_color);
    level_label.style.setProperty("--shadow-color", level_data.shadow_color);
    update_dist_label();
    camera.target = [map.start[0] * 64 - 256, map.start[1] * 64 - 256];
}

async function complete_level() {
    level_complete_label.classList.add("visible");
    level_completed = true;
    selector.disable();
    picker.disable();
    arrows.disable();
}

function nextclick(e) {
    level_completed = false;
    e.stopPropagation();
    next_level();
}

function retryclick(e) {
    e.stopPropagation();

    if(level_completed === false) {
        start_level();
    }
}

function gobackclick(e) {
    e.stopPropagation();

    if(path.reached_checkpoints.length) {
        path.reached_checkpoints.pop().restore();
    }
}

function next_level() {
    level_complete_label.classList.remove("visible");
    level_number ++;
    start_level();
}

function update_dist_label() {
    let dist = path.manhatten();

    if(dist === 0) {
        dist_label.innerHTML = "Goal reached!";
    }
    else {
        dist_label.innerHTML = "Distance to goal: " + path.manhatten();
    }
}

function frame() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    camera.update();
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    map.draw(ctx, img_blocks, camera);
    path.draw(ctx, img_vines, camera);
    swapper.draw(ctx, img_blocks, camera);
    path.reached_checkpoints.forEach(cp => cp.draw(ctx, camera, false));
    if(path.new_checkpoint) path.new_checkpoint.draw(ctx, camera, true);
    particles.draw(ctx, img_particles, camera);
    selector.draw(ctx, img_selector, camera);
    picker.draw(ctx, img_picker, camera);
    arrows.draw(ctx, img_arrows, camera);
    requestAnimationFrame(frame);
}

async function pop_tiles(tiles) {
    for(let pos of tiles) {
        await sleep(rand_range(25, 75));
        let tile = map.get_tile(...pos);
        map.set_tile(...pos, 0);
        particles.start(tile, pos[0] * 64 + 32, pos[1] * 64 + 32);
        play_sound(snd_blop, rand_range(0.5, 2));
    }

    if(path.update()) {
        complete_level();
    }

    update_dist_label();
}

function pickers_adjacent() {
    let dx = Math.abs(picker.x - selector.x);
    let dy = Math.abs(picker.y - selector.y);
    return dx + dy === 1;
}

async function do_swap(pos1, pos2, tile1, tile2, reached1, reached2) {
    map.set_tile(...pos1, 0);
    map.set_tile(...pos2, 0);
    selector.disable();
    picker.disable();
    play_sound(Math.random() < 0.5 ? snd_move1 : snd_move2);
    await swapper.swap(pos1, pos2, tile1, tile2);
    map.set_tile(...pos1, tile2);
    map.set_tile(...pos2, tile1);
    let popping_tiles = [];

    if(reached1.length >= 3) {
        popping_tiles.push(...reached1);
    }

    if(reached2.length >= 3) {
        popping_tiles.push(...reached2);
    }

    await pop_tiles(popping_tiles);
}

function try_swap() {
    let pos1 = [picker.x, picker.y];
    let pos2 = [selector.x, selector.y];
    let tile1 = map.get_tile(...pos1);
    let tile2 = map.get_tile(...pos2);

    if(tile1 === tile2) {
        return false;
    }

    map.set_tile(...pos1, tile2);
    map.set_tile(...pos2, tile1);
    let reached1 = map.flood_test(...pos1)
    let reached2 = map.flood_test(...pos2)

    if(reached1.length < 3 && reached2.length < 3) {
        map.set_tile(...pos1, tile1);
        map.set_tile(...pos2, tile2);
        return false;
    }

    do_swap(pos1, pos2, tile1, tile2, reached1, reached2);
    return true;
}

function mousedown(e) {
    if(e.button === 0) {
        left_mousedown(e);
    }
    else if(e.button === 2) {
        right_mousedown(e);
    }
    else if(e.button === 1) {
        pop_tiles([[picker.x, picker.y]]);
    }
}

function left_mousedown(e) {
    if(picker.enabled) {
        if(selector.enabled && pickers_adjacent()) {
            if(try_swap()) {
                arrows.disable();
            }
            else {
                play_sound(snd_nope);
                arrows.set_invalid();
            }
        }
        else {
            selector.place(picker.x, picker.y);
            play_sound(snd_click);
            arrows.disable();
        }
    }
    else {
        selector.disable();
    }
}

function right_mousedown(e) {
    mouse_start_x = e.clientX;
    mouse_start_y = e.clientY;
    panning = true;
}

function mouseup(e) {
    panning = false;
}

function mousemove(e) {
    if(panning) {
        camera.target[0] -= e.clientX - mouse_start_x;
        camera.target[1] -= e.clientY - mouse_start_y;
        mouse_start_x = e.clientX;
        mouse_start_y = e.clientY;
    }
    else if(level_completed) {
        selector.disable();
        picker.disable();
        arrows.disable();
    }
    else {
        let x = e.clientX;
        let y = e.clientY;
        let wx = x + camera.x;
        let wy = y + camera.y;
        let tx = Math.floor(wx / 64);
        let ty = Math.floor(wy / 64);

        if(map.is_selectable(tx, ty)) {
            picker.place(tx, ty);
        }
        else {
            picker.disable();
        }

        if(picker.enabled && selector.enabled && pickers_adjacent()) {
            arrows.place_between(
                [picker.x, picker.y],
                [selector.x, selector.y]
            );
        }
        else {
            arrows.disable();
        }
    }
}

async function load_sound(url) {
    let response = await fetch(url);
    let buffer = await response.arrayBuffer();
    return await audio.decodeAudioData(buffer);
}

function play_sound(sound, rate = 1) {
    let source = audio.createBufferSource();
    source.buffer = sound;
    source.playbackRate.value = rate;
    source.connect(audio.destination);
    source.start();
}