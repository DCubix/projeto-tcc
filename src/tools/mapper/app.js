let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');

let zoom = 8;

let drawing = false;
let firstPoint = { x: 0, y: 0 };
let mouse = { x: 0, y: 0 };
let image = null;

let rects = [];

function redraw() {
    ctx.imageSmoothingEnabled = false;
    ctx.imageSmoothingQuality = 'high';

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (image) {
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    }

    // draw grid
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += zoom) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += zoom) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
    }

    for (let i = 0; i < rects.length; i++) {
        let rect = rects[i];
        ctx.strokeStyle = 'rgb(0,255,0)';
        ctx.lineWidth = 1;
        ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
        ctx.beginPath();
        ctx.rect(rect[0] * zoom, rect[1] * zoom, rect[2] * zoom, rect[3] * zoom);
        ctx.stroke();
        ctx.fill();

        ctx.fillStyle = 'white';
        ctx.font = '14px Arial';
        ctx.fillText(`${rect[4]}`, rect[0] * zoom + 3, rect[1] * zoom + 16);
    }

    if (drawing) {
        let rx = Math.min(firstPoint.x, mouse.x);
        let ry = Math.min(firstPoint.y, mouse.y);
        let rw = Math.abs(firstPoint.x - mouse.x);
        let rh = Math.abs(firstPoint.y - mouse.y);

        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.rect(rx * zoom, ry * zoom, rw * zoom, rh * zoom);
        ctx.stroke();
        ctx.fill();
    }
}

canvas.addEventListener('mousedown', function(e) {
    let rect = canvas.getBoundingClientRect();
    drawing = true;
    mouse.x = ~~((e.clientX - rect.left + zoom/2) / zoom);
    mouse.y = ~~((e.clientY - rect.top + zoom/2) / zoom);
    firstPoint.x = mouse.x;
    firstPoint.y = mouse.y;

    // check if we right-cliocked on a rect
    if (e.button === 2) {
        for (let i = 0; i < rects.length; i++) {
            let r = rects[i];
            if (mouse.x >= r[0] && mouse.x <= r[0] + r[2] && mouse.y >= r[1] && mouse.y <= r[1] + r[3]) {
                rects.splice(i, 1);
                redraw();
                return;
            }
        }
    } else if (e.button === 0) { // change rect rotation
        for (let i = 0; i < rects.length; i++) {
            let r = rects[i];
            if (mouse.x >= r[0] && mouse.x <= r[0] + r[2] && mouse.y >= r[1] && mouse.y <= r[1] + r[3]) {
                r[4] = (r[4] + 1) % 4;
                redraw();
                return;
            }
        }
    }
});

canvas.addEventListener('mouseup', function(e) {
    drawing = false;

    if (image) {
        let rx = Math.min(firstPoint.x, mouse.x);
        let ry = Math.min(firstPoint.y, mouse.y);
        let rw = Math.abs(firstPoint.x - mouse.x);
        let rh = Math.abs(firstPoint.y - mouse.y);
        if (rw * rh > 0) {
            rects.push([rx, ry, rw, rh, 0]);
        }
    }
    
});

canvas.addEventListener('mousemove', function(e) {
    let rect = canvas.getBoundingClientRect();
    mouse.x = ~~((e.clientX - rect.left + zoom/2) / zoom);
    mouse.y = ~~((e.clientY - rect.top + zoom/2) / zoom);
    redraw();
});

document.getElementById('file').addEventListener('change', function(e) {
    image = new Image();
    image.src = URL.createObjectURL(e.target.files[0]);
    image.onload = function() {
        canvas.width = image.width * zoom;
        canvas.height = image.height * zoom;
        redraw();
    };
});

document.getElementById('get').addEventListener('click', function(e) {
    let out = document.getElementById('data');
    let nrects = [];
    for (let i = 0; i < rects.length; i++) {
        let rect = rects[i];
        let rc = [rect[0] / image.width, rect[1] / image.height, rect[2] / image.width, rect[3] / image.height];
        switch (rect[4]) {
            case 0:
                nrects.push([
                    [ rc[0], rc[1] ],
                    [ rc[0] + rc[2], rc[1] ],
                    [ rc[0] + rc[2], rc[1] + rc[3] ],
                    [ rc[0], rc[1] + rc[3] ]
                ]);
            break;
            case 1:
                nrects.push([
                    [ rc[0] + rc[2], rc[1] ],
                    [ rc[0] + rc[2], rc[1] + rc[3] ],
                    [ rc[0], rc[1] + rc[3] ],
                    [ rc[0], rc[1] ]
                ]);
            break;
            case 2:
                nrects.push([
                    [ rc[0] + rc[2], rc[1] + rc[3] ],
                    [ rc[0], rc[1] + rc[3] ],
                    [ rc[0], rc[1] ],
                    [ rc[0] + rc[2], rc[1] ]
                ]);
            break;
            case 3:
                nrects.push([
                    [ rc[0], rc[1] + rc[3] ],
                    [ rc[0], rc[1] ],
                    [ rc[0] + rc[2], rc[1] ],
                    [ rc[0] + rc[2], rc[1] + rc[3] ]
                ]);
            break;
        }
    }
    out.innerText = JSON.stringify(nrects);
});