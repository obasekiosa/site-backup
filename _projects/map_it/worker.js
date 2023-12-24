
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

self.addEventListener("message", (msg) => {
    postMessage(processFile(msg.data));
});