function talksAbout(node, string) {
    if (node.nodeType === Node.ELEMENT_NODE) {
        for(let i = 0; i < node.childNodes.length; i++) {
            if (talksAbout(node.childNodes[i], string)) {
                return true;
            }
        }

        return false;
    } else if (node.nodeType === Node.TEXT_NODE) {
        return node.nodeValue.indexOf(string) > -1;
    } else {
        return false;
    }
}

function elt(type, ...childern) {
    let node = document.createElement(type);
    for (const child of childern) {
        if (typeof child != "string") node.appendChild(child);
        else node.appendChild(document.createTextNode(child));
    }

    return node
}

function time(name, action) {
    const start = Date.now();
    action()
    console.log(name, "took", Date.now() - start, "ms");
}

self.addEventListener("message", event => {
    let start = Date.now()
    const stop = 30 * 1_000;
    while(true) {
        if (Date.now() - start >= stop) {
            break;
        }
    }
    postMessage(event.data * event.data);
})