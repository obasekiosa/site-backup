class Picture {
    constructor(width, height, pixels) {
        this.width = width;
        this.height = height;
        this.pixels = pixels;
    }

    static empty(width, height, color) {
        let pixels = new Array(width * height).fill(color);
        return new Picture(width, height, pixels);
    }

    pixel(x, y) {
        return this.pixels[x + y * this.width];
    }

    draw(pixels) {
        let copy = this.pixels.slice();
        for (let {x, y, color} of pixels) {
            copy[x + y * this.width] = color;
        }
        return new Picture(this.width, this.height, copy);
    }
}

function elt(type, props, ...childern) {
    let node = document.createElement(type);
    if (props) Object.assign(node, props);
    for (const child of childern) {
        if (typeof child != "string") node.appendChild(child);
        else node.appendChild(document.createTextNode(child));
    }

    return node
}

const scale = 10;

class PictureCanvas {
    constructor(picture, pointerDown) {
        this.domElement = elt("canvas", {
            onmousedown: event => this.mouse(event, pointerDown),
            ontouchstart: event => this.touch(event, pointerDown),
        });
        this.syncState(picture);
    }

    syncState(picture) {
        if(this.picture == picture) return;
        this.picture = picture;
        drawPicture(this.picture, this.domElement, scale);
    }
}
PictureCanvas.prototype.mouse = function(downEvent, onDown) {
    if (downEvent.button != 0) return;

    let pos = pointerPosition(downEvent, this.domElement);
    let onMove = onDown(pos);
    if (!onMove) return;
    let move = moveEvent => {
        if (moveEvent.buttons == 0) {
            this.domElement.removeEventListener("mousemove", move);
        } else {
            let newPos = pointerPosition(moveEvent, this.domElement);
            if (newPos.x == pos.x && newPos.y == pos.y) return;
            pos = newPos;
            onMove(newPos);
        }
    };

    // let end = () => {
    //     this.domElement.removeEventListener("mousemove", move);
    //     this.domElement.removeEventListener("mouseup", end);
    // }
    this.domElement.addEventListener("mousemove", move);
    // this.domElement.addEventListener("mouseup", end);
}

PictureCanvas.prototype.touch = function(startEvent, onDown) {
    let pos = pointerPosition(startEvent.touchs[0], this.domElement);
    let onMove = onDown(pos);
    startEvent.preventDefault();
    if (!onMove) return;
    let move = moveEvent => {
        let newPos = pointerPosition(moveEvent.touches[0], this.domElement);
        if (newPos.x == pos.x && newPos.y == pos.y) return;
        pos = newPos;
        onMove(newPos);
    };

    let end = () => {
        this.domElement.removeEventListener("touchmove", move);
        this.domElement.removeEventListener("touchend", end);
    };

    this.domElement.addEventListener("touchmove", move);
    this.domElement.addEventListener("touchend", end);
}

function pointerPosition(pos, domNode) {
    let rect = domNode.getBoundingClientRect();
    return {
        x: Math.floor((pos.clientX - rect.left) / scale),
        y: Math.floor((pos.clientY - rect.top) / scale)
    };
}



function drawPicture(picture, canvas, scale) {
    canvas.width = picture.width * scale;
    canvas.height = picture.height * scale;
    let cx = canvas.getContext("2d");

    for(let y = 0; y < picture.height; y++) {
        for (let x = 0; x < picture.width; x++) {
            cx.fillStyle = picture.pixel(x, y);
            cx.fillRect(x * scale, y * scale, scale, scale);
        }
    }
}

class PixelEditor {
    constructor(state, config) {
        let {tools, controls, dispatch} = config;
        this.state = state;

        this.canvas = new PictureCanvas(state.picture, pos => {
            let tool = tools[this.state.tool];
            let onMove = tool(pos, this.state, dispatch);
            if (onMove) return pos => onMove(pos, this.state);
        });
        this.controls = controls.map(
            Control => new Control(state, config));
        this.domElement = elt("div", {}, this.canvas.domElement, elt("br"),
            ...this.controls.reduce((a, c) => a.concat(" ", c.domElement), []));
    }
    syncState(state) {
        this.state = state;
        this.canvas.syncState(state.picture);
        for(const ctrl of this.controls) ctrl.syncState(state);
    }
}

class ToolSelect {
    constructor(state, {tools, dispatch}) {
        this.select = elt("select", {
            onchange: () => dispatch({tool: this.select.value})
        }, ... Object.keys(tools).map(name => elt("option", {
            selected: name == state.tool
        }, name)));
        this.domElement = elt("label", null, "🖌 Tool: ", this.select)
    }
    syncState(state) {
        this.select.value = state.tool;
    }
}

class ColorSelect {
    constructor(state, {dispatch}) {
        this.input = elt("input", {
            type: "color",
            value: state.color,
            onchange: () => dispatch({color: this.input.value })
        });
        this.domElement = elt("label", null, "🎨 Color: ", this.input);
    }
    syncState(state) {
        this.input.value = state.color;
    }
}

function draw(pos, state, dispatch) {
    function drawPixel(pos, state) {
        const picture = state.picture.draw([{...pos, color: state.color}])
        dispatch({ picture });
    }
    drawPixel(pos, state);
    return drawPixel;
}


function rectangle(startPos, state, dispatch) {
    // draws a filled in rectangle
    function drawRectangle(currPos) {
        // get top corner
        const xStart = Math.min(currPos.x, startPos.x);
        const yStart = Math.min(currPos.y, startPos.y);
        // get bottom corner
        const xEnd = Math.max(currPos.x, startPos.x);
        const yEnd = Math.max(currPos.y, startPos.y);
        
        // create pixels for those points
        const pixels = [];
        for (let y = yStart; y <= yEnd; y++) {
            for (let x = xStart; x <= xEnd; x++) {
                pixels.push({x, y, color: state.color });
            }
        }

        dispatch({ picture: state.picture.draw(pixels) });
    }
    drawRectangle(startPos);
    return drawRectangle;
}

function circle(startPos, state, dispatch) {
    // draws a filled in circle centered at startPos
    function drawCircle(currPos) {
        const radius_squared = Math.pow(currPos.x - startPos.x, 2) + Math.pow(currPos.y - startPos.y, 2);
        const radius = Math.ceil(Math.sqrt(radius_squared));
        const yStart = Math.max(0, startPos.y - radius);
        const yEnd = Math.min(state.picture.height - 1, startPos.y + radius);

        const pixels = []

        for (let y = yStart; y <= yEnd; y++) {
            const yDiff = startPos.y - y; // negative/positive value
            const xDiff = Math.ceil(Math.sqrt(radius_squared - Math.pow(yDiff, 2)));
            const xStart = Math.max(0, startPos.x - xDiff);
            const xEnd = Math.min(state.picture.width - 1, startPos.x + xDiff);

            for (let x = xStart; x <= xEnd; x++) {
                pixels.push({ x, y, color: state.color });
            }
        }

        dispatch({ picture: state.picture.draw(pixels) })
    }
    drawCircle(startPos); 
    return drawCircle;
}

function line(startPos, state, dispatch) {
    function drawLine(currPos) {

        let xStart = null;
        let yStart = null;
        let xEnd = null;
        let yEnd = null;

        if (currPos.x > startPos.x) {
            xStart = startPos.x;
            yStart = startPos.y;
            xEnd = currPos.x;
            yEnd = currPos.y;
        } else {
            xStart = currPos.x;
            yStart = currPos.y;
            xEnd = startPos.x;
            yEnd = startPos.y;
        }

        const slope = (yEnd - yStart) / (xEnd - xStart);

        const pixels = [];
        for (let x = xStart; x <= xEnd; x++) {
            const y = Math.ceil((x - xStart) * slope) + yStart;
            pixels.push({x, y, color: state.color});

            console.log(x, y);
        }

        dispatch({picture: state.picture.draw(pixels)});

    }

    drawLine(startPos);
    return drawLine;
}

const around = [
    { dx: -1, dy: 0},
    { dx: 1, dy: 0},
    { dx: 0, dy: -1},
    { dx: 0, dy: 1},
]

function fill({x, y}, state, dispatch) {
    // change all pixels (including pixel x,y) with a similar color to pixel
    // at x,y to a new color of state.color i.e current selected color
    const targetColor = state.picture.pixel(x, y);
    const pixels = [];
    const visited = {};

    function key(x, y) {
        return `${x},${y}`;
    }

    function dfs({x, y}) {
        let posKey = key(x, y);
        if (visited[posKey]) {
            return;
        }

        visited[posKey] = true;
        pixels.push({x, y, color: state.color});

        for (const {dx, dy} of around) {
            const newX = x + dx;
            const newY = y + dy;
            posKey = key(newX, newY);

            if (newX >= 0 && newX < state.picture.width && newY >= 0
                 && newY < state.picture.height && !visited[posKey]
                 && state.picture.pixel(newX, newY) == targetColor) {
                dfs({x: newX, y: newY});
            }
        }
    }

    dfs({x, y});
    dispatch({picture: state.picture.draw(pixels)});
}

function pick({x, y}, state, dispatch) {
    dispatch({color: state.picture.pixel(x, y)});
}

class SaveButton {
    constructor(state) {
        this.picture = state.picture;
        this.domElement = elt("button", {
            onclick: () => this.save()
        }, "💾 Save");
    }

    save() {
        let canvas = elt("canvas");
        drawPicture(this.picture, canvas, 1);
        let link = elt("a", {
            href: canvas.toDataURL(),
            download: "pixelart.png"
        });
        document.body.appendChild(link);
        link.click();
        link.remove();
    }

    syncState(state) {
        this.picture = state.picture;
    }
}

class LoadButton {
    constructor(_, {dispatch}) {
        this.domElement = elt("button", {
            onclick: () => startLoad(dispatch)
        }, "📁 Load");
    }

    syncState() {

    }
}

function startLoad(dispatch) {
    const input = elt("input", {
        type: "file",
        onchange: () => finishLoad(input.files[0], dispatch)
    });
    document.body.appendChild(input);
    input.click();
    input.remove();
}

function finishLoad(file, dispatch) {
    if (file == null) return;
    const reader = new FileReader();
    reader.addEventListener("load", () => {
        let image = elt("img", {
            onload: () => dispatch({
                picture: pictureFromImage(image)
            }),
            src: reader.result
        });
    });

    reader.readAsDataURL(file)
}


function pictureFromImage(imageEl) {
    const width = Math.min(100, imageEl.width);
    const height = Math.min(100, imageEl.height);
    const canvas = elt("canvas", {width, height});
    const cx = canvas.getContext("2d");
    cx.drawImage(imageEl, 0, 0);
    const pixels = [];
    const {data} = cx.getImageData(0, 0, width, height);

    function hex(n) {
        return n.toString(16).padStart(2, "0");
    }

    for (let i = 0; i < data.length; i += 4) {
        let [r, g, b] = data.slice(i, i + 3);
        pixels.push(`#${hex(r)}${hex(g)}${hex(b)}`);
    }

    return new Picture(width, height, pixels);
}

function historyUpdateState(state, action) {
    if (action.undo == true ) {
        if (state.done.length == 0) return state;

        return Object.assign({}, state, {
            picture: state.done[0],
            done: state.done.slice(1),
            doneAt: 0
        });
    } else if (action.picture && state.doneAt < Date.now() - 1000) {
        return Object.assign({}, state, action, {
            done: [state.picture, ...state.done],
            doneAt: Date.now()
        });
    } else {
        return Object.assign({}, state, action);
    }
}

class UndoButton {
    constructor(state, {dispatch}) {
        this.domElement = elt("button", {
            onclick: () => dispatch({undo: true}),
            disabled: state.done.length == 0
        }, "⏪ Undo")
    }

    syncState(state) {
        this.domElement.disabled = state.done.length == 0;
    }
}

const startState = {
    tool: "draw",
    color: "#000000",
    picture: Picture.empty(60, 30, "#f0f0f0"),
    done: [],
    doneAt: 0
};

const baseTools = { draw, fill, rectangle, pick , circle, line };

const baseControls = [
    ToolSelect, ColorSelect, SaveButton, LoadButton, UndoButton
];

function startPixelEditor({
    state = startState,
    tools = baseTools,
    controls = baseControls}) {

    let app = new PixelEditor(state, {
        tools,
        controls,
        dispatch(action) {
            state = historyUpdateState(state, action);
            app.syncState(state);
        }
    });
    return app.domElement;
}

