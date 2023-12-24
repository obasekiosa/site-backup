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




class Map {
    constructor(width, height, points) {
        this.points = points;
        this.width = width;
        this.height = height;
        this.domElement = elt("canvas", null, {
            width: this.width,
            height: this.height
        });
        this.domElement.style.setProperty("border", "1px orange solid");
        this.draw(points);
    }

    syncState(state) {
        this.domElement.setAttribute("width", state.mapData.width);
        this.domElement.setAttribute("height", state.mapData.height);
        this.draw(state.mapData.locations);
    }

    draw(locations) {
        let ctx = this.domElement.getContext("2d");
        console.log("treid")
        ctx.beginPath();
        ctx.strokeStyle = "red";

        function drawPolygon(i) {
            if ( i >= locations.length) return;
            const location = locations[i];
            let vertex = location.vertices[0]
            ctx.moveTo(vertex[0], vertex[1]);
            for(let i = 1; i < location.vertices.length; i++) {
                vertex = location.vertices[i]; 
                ctx.lineTo(vertex[0], vertex[1]);
                ctx.stroke();
            }
            ctx.lineTo(location.vertices[0][0], location.vertices[0][1]);
            ctx.stroke()

            setTimeout(() => drawPolygon(++i), 100);
        }
        drawPolygon(0);

        // for (const location of locations) {
        //     let vertex = location.vertices[0]
        //     ctx.moveTo(vertex[0], vertex[1]);
        //     for(let i = 1; i < location.vertices.length; i++) {
        //         vertex = location.vertices[i]; 
        //         ctx.lineTo(vertex[0], vertex[1]);
        //         ctx.stroke();
        //     }
        //     ctx.lineTo(location.vertices[0][0], location.vertices[0][1]);
        // }

        // ctx.stroke();

    }
}

class Control {
    constructor(state) {
        this.domElement = elt("input", null, {
            type: 'file',
            onchange: (event) => {
                const file = event.target.files[0];
                if (!file.type.startsWith("text")) {
                    console.log(file.type);
                    console.log("not a text file");
                    return;
                }
                const fr = new FileReader();
                fr.onload = () => {
                    state.mapData = processFile(fr.result);
                    state.display.syncState(state);
                };

                fr.readAsText(file);
            }
        });
    }

    syncState(state) {

    }
}

class FetchControl {
    constructor(state) {
        this.domElement = elt("button", null, {
            
            onclick: (event) => {

                fetch("./square.txt").then((response) => {
                    if (response.ok) {
                        response.text().then(text => {
                            let worker = new Worker("./worker.js");
                            worker.addEventListener("message", (msg) => {
                                console.log(msg);
                                state.mapData = msg.data;
                                state.display.syncState(state);
                            });

                            worker.postMessage(text);
                        })
                    }
                }).catch(err => {
                    console.log("err");
                });
            }
        }, "World map from server");
    }

    syncState(state) {

    }
}

function processFile(content) {
    const result = {
        width: null,
        height: null,
        locations: [],
    };

    /**
     * a location is a map
     * {name: string, vertices: [2d-points]}
     */

    const lines = content.split("\n");

    if (lines == 0) return;

    let first = lines[0].split(" ");
    result.width = +first[0];
    result.height = +first[1];

    let i = 2; // line space
    let location = null;
    let vCount = null;
    let vertices = null;
    
    while (i < lines.length - 1) {
        location = lines[i++];
        vCount = +lines[i++];
        vertices = []
        for (const stop = i + vCount; i < stop;) {
            let point = lines[i++].split(" ");
            vertices.push([+point[0], result.height - (+point[1])]);
        }
        result.locations.push({
            name: location,
            vertices
        });
        i++; // skip separating new line
    }

    return result;
}


class MainDisplay {
    constructor(map, controls, state) {
        this.state = state;
        this.map = map;
        this.controls = controls
        this.map.domElement.style.setProperty("margin-bottom", "10px");
        this.domElement = elt("div", null, null,
            this.map.domElement,
            ...this.controls.map(ctrl => ctrl.domElement),
            );
    }

    syncState(state) {
        this.state = state;
        this.map.syncState(this.state);
        this.controls.forEach(ctrl => ctrl.syncState(this.state));
    }
}

const state = {
    mapData: null,
    display: null,
}



window.addEventListener("load", () => {
    const map = new Map(400, 400, []);
    const control = new Control(state);
    const fectControl = new FetchControl(state);
    const display = new MainDisplay(map, [control, fectControl], state);

    state.display = display;
    document.querySelector("main").appendChild(display.domElement);
});