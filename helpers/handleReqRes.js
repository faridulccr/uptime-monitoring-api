/**
 * Title: Handle Request Response
 * Description: Handle Request Response
 * Date: 14/06/2022
 */

// Dependencies
const url = require("url"); // for path
const { StringDecoder } = require("string_decoder"); // to Decode Buffers (StringDecoder Class)
const routes = require("../routes/routes");
const { noFoundHandler } = require("../Handlers/routeHandlers/notFoundHandler");
const { parseJSON } = require("../helpers/utilities");

// module scaffolding
const handler = {};

// to handle Request Response
handler.handleReqRes = (req, res) => {
    // get the url obj and parse it
    const parseUrl = url.parse(req.url, true); // true is for query parameter (?a=5&b=66)
    const path = parseUrl.pathname;
    const trimmedPath = path.replace(/^\/+|\/+$/g, ""); // a path without slash(\ or /)
    const queryStringObj = parseUrl.query; // => {a:3, b:6} query parameters obj
    const method = req.method.toLowerCase();
    const headerObj = req.headers;
    const requestProperties = {
        parseUrl,
        path,
        trimmedPath,
        queryStringObj,
        method,
        headerObj,
    };

    const decoder = new StringDecoder("utf-8");
    let realData = "";

    // choose which func will call
    const routingHandler = routes[trimmedPath]
        ? routes[trimmedPath]
        : noFoundHandler;

    // register a listener for data event to access body data
    req.on("data", (buffer) => {
        realData += decoder.write(buffer);
    });

    // register a listener for end event
    req.on("end", () => {
        // to end docoding buffer
        realData += decoder.end(); // come from users for that I can't beleive this 100%

        // including realData to request properties
        requestProperties.body = parseJSON(realData); // must be parse string to obj

        routingHandler(requestProperties, (statusCode, dataObj) => {
            statusCode = typeof statusCode === "number" ? statusCode : 500;
            dataObj = typeof dataObj === "object" ? dataObj : {};

            // to convert from dataObj into string
            const dataString = JSON.stringify(dataObj);

            // return the final response
            res.setHeader("Content-Type", "application/json"); // for type of data that is sent to client
            res.writeHead(statusCode); //res.writeHead(statusCode, statusMessage: string)
            res.end(dataString);
        });
        // res.end();
    });
};

module.exports = handler;
