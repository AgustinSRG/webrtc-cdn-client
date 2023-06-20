// Test server

"use strict";

const port = parseInt(process.env.TEST_PORT || "8080");

require("http").createServer((req, res) => {
    if (req.url === "/" || req.url === "/index.html") {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(require("fs").readFileSync(require("path").resolve(__dirname, "index.html")).toString());
    } else if (req.url === "/js/webrtc-cdn-client.js") {
        res.writeHead(200, { "Content-Type": "text/javascript" });
        res.end(require("fs").readFileSync(require("path").resolve(__dirname, "..", "dist.webpack", "webrtc-cdn-client.js")).toString());
    } else {
        res.writeHead(404);
        res.end("Not found.");
    }
}).listen(port, "127.0.0.1", () => {
    console.log(`Test server listening at http://127.0.0.1:${port}/`);
});


