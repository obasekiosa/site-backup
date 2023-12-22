

class Vector {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    add(other) {
        return new Vector(this.x + other.x, this.y + other.y, this.z + other.z);
    }

    subtract(other) {
        return new Vector(this.x - other.x, this.y - other.y, this.z - other.z); 
    }

    negate() {
        return new Vector(-this.x, -this.y, -this.z);
    }

    scale(a) {
        return new Vector( a * this.x, a * this.y, a * this.z);
    }


    static create2d(x, y) {
        return new Vector(x, y, 0);
    }
}


class Coin {

    constructor(pos, basePos, wobble) {
        this.pos = pos;
        this.basePos = basePos;
        this.wobble = wobble;
    }

    get type() {
        return "coin";
    }


    static create(pos) {
        const basePos = pos.add(Vector.create2d(0.2, 0.2));
        return new Coin(basePos, basePos, Math.round() * Math.PI * 2);    
    }
}
Coin.prototype.size = Vector.create2d(0.6, 0.6);

class Lava {
    
    constructor(pos, speed, reset) {
        this.pos = pos;
        this.speed = speed;
        this.reset = reset;
    }

    get type() {
        return "lava";
    }

    static create(pos, ch) {
        switch(ch) {
            case "=":
                return new Lava(pos, Vector.create2d(2, 0));
            case "|":
                return new Lava(pos, Vector.create2d(0, 2));
            case "v":
                return new Lava(pos, Vector.create2d(0, 3), pos);
        }        
    }
}
Lava.prototype.size = Vector.create2d(1, 1);

const GameState = {
    PLAYING: "playing"
}

class State {
    constructor(layout, actors, status) {
        this.layout = layout;
        this.actors = actors;
        this.status = status;
    }

    static start(layout) {
        return new State(layout, layout.startActors, GameState.PLAYING);
    }

    get player() {
        return this.actors.find(a => a.type === "player");
    }
}

class Player {

    constructor(pos, speed) {
        this.pos = pos;
        this.speed = speed;
    }

    get type() {
        return "player";
    }

    static create(pos) {
        return new Player(pos.add(Vector.create2d(0, -0.5)),
            Vector.create2d(0,0));
    }
}
Player.prototype.size = Vector.create2d(0.8, 1.5);

const SCALE = 20;

const levelChars = {
    ".": "empty",
    "#": "wall",
    "+": "lava",
    "@": Player,
    "o": Coin,
    "=": Lava,
    "|": Lava,
    "v": Lava
};

let simpleLevelPlan = `
......................
..#................#..
..#..............=.#..
..#.........o.o....#..
..#.@......#####...#..
..#####............#..
......#++++++++++++#..
......##############..
......................`;


class Level {
    constructor(layout) {
        let rows = layout.trim().split("\n").map(row => [...row]);
        this.height = rows.length;
        this.width = rows[0].length;
        this.startActors = [];

        this.rows = rows.map((row, y) => {
            return row.map((ch, x) => {
                let type = levelChars[ch];
                if (typeof type === "string") {
                    return type;
                }
                this.startActors.push(type.create(Vector.create2d(x, y), ch));
                return "empty";
            })
        })
    }
}

function elt(name, attrs, ...children) {
    const el = document.createElement(name);
    for (const att of Object.entries(attrs)) {
        el.setAttribute(att[0], att[1]);
    }

    for (const child of children) {
        el.appendChild(child);
    }
    return el;
}

class LayoutDisplay {
    constructor(parent, layout) {
        this.domDisplay = elt("div", {class: "game"}, drawLayout(layout));
        this.actorLayer = null;
        parent.appendChild(this.domDisplay);
    }

    clear() {
        this.domDisplay.remove();
    }
}

LayoutDisplay.prototype.syncState = function(state) {
    if (this.actorLayer) this.actorLayer.remove();
    this.actorLayer = drawActors(state.actors);
    this.domDisplay.appendChild(this.actorLayer);
    this.domDisplay.className = `game ${state.status}`;
    this.scrollPlayerIntoView(state);
};

LayoutDisplay.prototype.scrollPlayerIntoView = function(state, scale) {

    scale = scale ? scale : SCALE;

    let width = this.domDisplay.clientWidth;
    let height = this.domDisplay.clientHeight;
    let margin = width / 3;

    let left = this.domDisplay.scrollLeft, right = left + width;
    let top = this.domDisplay.scrollTop, bottom = top + height;

    let player = state.player;
    let center = player.pos.add(player.size.scale(0.5)).scale(scale)

    if (center.x < left + margin) {
        this.domDisplay.scrollLeft = center.x - margin;
    } else if (center.x > right - margin) {
        this.domDisplay.scrollLeft = center.x + margin - width;
    }

    if (center.y < top + margin) {
        this.domDisplay.scrollTop = center.y - margin;
    } else if (center.y > bottom - margin) {
        this.domDisplay.scrollTop = center.y + margin - height;
    }
};


function drawLayout(layout, scale) {
    scale = scale ? scale : SCALE;

    return elt("table", {
        class: "background",
        style: `width: ${layout.width * scale}px`
    }, ...layout.rows.map(row => 
        elt("tr", {style: `height: ${scale}px`},
            ...row.map(cellType => elt("td", {class: `${cellType} grid-cell`}))
        )
    ));
}

function drawActors(actors, scale) {
    scale = scale ? scale : SCALE;

    return elt("div", {}, ...actors.map(actor => {
        let rect = elt("div", {class: `actor ${actor.type}`})
        rect.style.width = `${actor.size.x * scale}px`;
        rect.style.height = `${actor.size.y * scale}px`;
        rect.style.left = `${actor.pos.x * scale}px`;
        rect.style.top = `${actor.pos.y * scale}px`;

        return rect;
    }))
}

let keyMap = Object.create(null);

function loadKeys(event) {
   let map = Object.create(null);
   map[event.key] = true; 
   keyMap = map;
}

window.addEventListener("keydown", loadKeys);

let level = null;
let display = null;
let state = null;

function runGame() {
    level = new Level(simpleLevelPlan);
    display = new LayoutDisplay(document.body, level);
    state = State.start(level);
    display.syncState(state);
    runLoop()
}
function runLoop() {

    const player = state.player;
    // check for inputs
    if (keyMap.ArrowLeft) {
       player.speed = Vector.create2d(-0.3, 0);
    } else if (keyMap.ArrowRight) {
       player.speed = Vector.create2d(0.3, 0);
    } else {
        player.speed = Vector.create2d(0, 0);
    }
    keyMap = Object.create(null);

    // update player
    player.pos = player.pos.add(player.speed);
    // redraw screen
    display.syncState(state)
    display.scrollPlayerIntoView(state);
    // setup next frame
    requestAnimationFrame(runLoop);
}

function start() {
    requestAnimationFrame(runGame);
}