/**
 * Title: Routes
 * Description: Application routes
 * Date: 14/06/2022
 */

// dependencies
const { sampleHandler } = require("../Handlers/routeHandlers/sampleHandler");
const { userHandler } = require("../Handlers/routeHandlers/usersHandler");
const { tokenHandler } = require("../Handlers/routeHandlers/tokenHandler");
const { checkHandler } = require("../Handlers/routeHandlers/checkHandler");


const routes = {
    sample: sampleHandler,
    user: userHandler,
    token: tokenHandler,
    check : checkHandler,
};

module.exports = routes;
