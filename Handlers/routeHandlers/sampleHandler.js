/**
 * Title: Sample Handler
 * Description: Sample route Handler
 * Date: 14/06/22
 */

// module scaffolding
const handler = {};

handler.sampleHandler = (requestProperties, callback) => {
  callback(200, {
    message: "this is sample url",
  });
};

module.exports = handler;
