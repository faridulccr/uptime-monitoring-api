/**
 * Title: not Found Handler
 * Description: 404 not Found Handler
 * Date: 14/06/22
 */

// module scaffolding
const handler = {};

handler.noFoundHandler = (requestProperties, callback) => {
  callback(404, {
    message: "your requested url was not found!",
  });
};

module.exports = handler;
