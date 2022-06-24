/**
 * Title: Handle server
 * Description: Handler to handle server related works
 * Date: 22/06/2022
 */

//Dependencies
const http = require("http");
const { handleReqRes } = require("../helpers/handleReqRes");
const { port } = require("../helpers/environment");

// server object - Module scaffolding
const server = {};

// create server
server.createServer = () => {
    const httSserver = http.createServer(server.handleReqRes);
    httSserver.listen(port, () => {
        console.log(`Server is running at http://localhost:${port}`);
    });
};

// handle handleReqRes
server.handleReqRes = handleReqRes;

// initialize the server
server.init = () => {
    server.createServer();
};

module.exports = server;
