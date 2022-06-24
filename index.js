/**
 * Title: Uptime Monitoring Application
 * Description: A RESTFul API to monitor up or down time of user defined links
 * Date: 14/06/2022
 */

//Dependencies
const server = require('./lib/server');
const worker = require('./lib/worker');

// app object - Module scaffolding
const app = {};

// create server
app.createServer = () => {
	// start the server
	server.init();

	// start the worker
	worker.init();
};

app.createServer();

module.exports = app;