function elt(type, attrs, props, ...childern) {
    let node = document.createElement(type);
    if (props) Object.assign(node, props);

    if (attrs) {
        for (const [attr, value] of Object.entries(attrs)) {
            node.setAttribute(attr, value);
        }
    }

    for (const child of childern) {
        if (typeof child != "string") node.appendChild(child);
        else node.appendChild(document.createTextNode(child));
    }

    return node
}


class Conway {
    constructor(width, height, scale, state) {
        this.width = width;
        this.height = height;
        this.scale = scale;
        this.grid = [];
        const stateGrid = state ? state.grid ? true : false : false;
        for(let i = 0; i < this.height; i++) {
            for (let j = 0; j < this.width; j++) {
                const cell = elt("input", null, {
                    checked: (stateGrid ? state.grid[i * this.width + j] : false),
                    type: "checkbox",
                    onclick: state ?  (e) => {
                        state.grid[i * this.width + j] = e.target.checked;
                    } : null,                   
                });
                cell.style.width = `${scale}px`;
                cell.style.height = `${scale}px`;
                this.grid.push(cell);
            }
        }
        this.domElement = elt("div", null, null, ...this.grid);
        this.domElement.style.width = `${scale * this.width}px`;
        this.domElement.style.setProperty("line-height", "0");
    }

    syncState(state) {
        for (let i = 0; i < this.height; i++) {
            for (let j = 0; j < this.width; j++) {
                const index = i * this.width + j;
                this.grid[index].checked = state.grid[index]
            }
        }
    }
}

function showGrid(grid) {
    const main = document.querySelector("main");
    main.appendChild(grid.domElement);
}


const directions = [
    [-1, -1],
    [0, -1],
    [1, -1],
    [-1, 0],
    [1, 0],
    [-1, 1],
    [0, 1],
    [1, 1],
];

function getStats(grid, x, y, w, h) {
    const stats = {
        cell: grid[y * w + x],
        dead: 0,
        alive: 0,
    };

    for (const [dx, dy] of directions) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < w && ny < h) {
            const nCell = grid[ny * w + nx];
            if (nCell) {
                stats.alive += 1;
            } else {
                stats.dead += 1;
            }
        }
    }
    return stats;
}

function crowding({cell, alive}) {
    if (cell && (alive < 2 || alive > 3)) {
        return false;
    }
    return null;
}

function live({cell, alive}) {
    if (cell && (alive === 2 || alive == 3)) {
        return true;
    }

    return null;
}

function resurrect({cell, alive}) {
    if (!cell && alive === 3) {
        return true;
    }

    return null;
}

function none({cell}) {
    return cell;
}


const rules = [crowding, live, resurrect, none];

const state = {
    grid: null,
    config: null,
    rules: rules,
    automaton: null,
    interval: null,
    initial: null,
};

function updateState(conway) {
    const config = state.config;
    const grid = Array(config.w * config.h);
    for (let i = 0; i < config.h; i++) {
        for (let j = 0; j < config.w; j++) {
            const stats = getStats(state.grid, j, i, config.w, config.h);
            for (const rule of state.rules) {
                const result = rule(stats); 
                if (result !== null) {
                    grid[i * config.h + j] = result;
                    break;
                }
            }
        }
    }
    state.grid = grid;
    conway.syncState(state);
}

function setupInterface(state) {

    const enrotpyDisplay =  elt("span", null, null, `Entropy: ${state.config.entropy}`);
    
    const controls = elt("div", null, null, 
        elt("button", {
            class: "pause"
        }, {
            onclick: ()=> {
                clearInterval(state.interval);
                state.interval = null
            }
        }, "Pause"),
        elt("button", {
            class: "play"
        }, {
            onclick: () => {
                if (state.interval === null) {
                    state.interval = setInterval(() => 
                    updateState(state.automaton), state.config.secPerFrame);
                }
            }
        }, "Play"),
        elt("button", {
            class: "random"
        }, {
            onclick: () => {
                clearInterval(state.interval);
                state.interval = null;
                init(state);
                state.automaton.syncState(state);
            }
        }, "Random"),
        elt("input", null, {
            type: "range",
            min: "0",
            max: "100",
            value: `${state.config.entropy}`,
            onchange: (event) => {
                state.config.entropy = event.target.value / 100;
                enrotpyDisplay.innerText = `Entropy: ${state.config.entropy}`;
            }
        }),
       enrotpyDisplay,
        elt("button", {
            class: "clear",
        }, {
            onclick: () => {
                clearInterval(state.interval);
                state.interval = null;
                init(state, true);
                state.automaton.syncState(state);
            }
        }, "Clear"),
        elt("button", {
            class: "reset",
        }, {
            onclick: () => {
                state.grid = Array.from(state.initial);
                state.automaton.syncState(state);
            }
        }, "Reset")
    );
    controls.style.setProperty("display", "flex");
    controls.style.setProperty("flex-direction", "column");

    document.querySelector("main").appendChild(controls);
}

function init(state, clear) {
    const config = state.config;
    for (let i = 0; i < config.h; i++) {
        for (let j = 0; j < config.w; j++) {
            state.grid[i * config.h + j] = clear ? false : Math.random() < state.config.entropy;
        }
    }

    state.initial = Array.from(state.grid);
}

window.addEventListener("load", () => {
    const config = {
        w: 50,
        h: 50,
        scale: 10,
        secPerFrame: 37.33,
        entropy: 0.5,
    };
    
    state.grid = Array(config.w * config.h);//.fill(false);
    
    state.config = config;

    init(state);

    const conway = new Conway(config.w, config.h, config.scale, state);
    state.automaton = conway;
 

    showGrid(conway);
    state.interval = setInterval(() => updateState(conway), state.config.secPerFrame);
    setupInterface(state);
});