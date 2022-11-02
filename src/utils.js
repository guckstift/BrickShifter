export function rand_range(min, max) {
    return min + (max - min) * Math.random();
}
export function rand_int_range(min, max) {
    return Math.floor(min + (max - min) * Math.random());
}

export function load_image(url) {
    return new Promise((res, rej) => {
        let img = document.createElement("img");
        img.onload = () => res(img);
        img.onerror = () => rej();
        img.src = url;
    });
}

export function sleep(ms) {
    return new Promise(res => setTimeout(res, ms));
}

export function is_vec_in_array(a, v) {
    return a.some(u => u[0] === v[0] && u[1] === v[1]);
}

export function lerp(a, b, t) {
    return a + t * (b - a);
}

export function lerp3(u, v, t) {
    return [
        lerp(u[0], v[0], t),
        lerp(u[1], v[1], t),
        lerp(u[2], v[2], t),
    ];
}

export function smoother_lerp(a, b, t) {
    return lerp(a, b, 6 * t**5 - 15 * t**4 + 10 * t**3);
}

export function round_rect(ctx, r, x, y, w, h) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
    ctx.stroke();
}