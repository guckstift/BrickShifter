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