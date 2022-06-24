/**
 * Title: Check/Link Handler,
 * Description: Handler to handle user defined check/link,
 * Date: 20/06/22
 */

// Dependencies
const data = require("../../lib/data");
const { parseJSON, createRandomString } = require("../../helpers/utilities");
const { _token } = require("./tokenHandler");
const { maxChecks } = require("../../helpers/environment");

// module scaffolding
const handler = {};

handler.checkHandler = (requestProperties, callback) => {
    const { method } = requestProperties;
    const acceptedMethod = ["get", "post", "put", "delete"];

    if (acceptedMethod.indexOf(method) > -1) {
        // call the incoming requested method
        handler._checks[method](requestProperties, callback);
    } else
        callback(405, {
            error: "You can only request using get, post, put and delete method.",
        });
};

// module scaffolding for _checks object
handler._checks = {};

// at first I have to create the check/link
handler._checks.post = (requestProperties, callback) => {
    const { body, headerObj } = requestProperties;
    const protocol =
        typeof body.protocol === "string" &&
        ["http", "https"].indexOf(body.protocol) > -1
            ? body.protocol
            : false;
    const url =
        typeof body.url === "string" && body.url.trim().length > 0
            ? body.url
            : false;
    const method =
        typeof body.method === "string" &&
        ["get", "post", "put", "delete"].indexOf(body.method.toLowerCase()) > -1
            ? body.method
            : false;
    const successCodes =
        typeof body.successCodes === "object" &&
        body.successCodes instanceof Array
            ? body.successCodes
            : false;
    const timeoutSeconds =
        typeof body.timeoutSeconds === "number" &&
        Number.isInteger(body.timeoutSeconds) && // body.timeoutSeconds % 1 === 0
        body.timeoutSeconds >= 1 &&
        body.timeoutSeconds <= 5
            ? body.timeoutSeconds
            : false;

    if (protocol && url && method && successCodes && timeoutSeconds) {
        const tokenId =
            typeof headerObj.token === "string" &&
            headerObj.token.trim().length === 20
                ? headerObj.token
                : false;
        // find out the user phone by reading token
        data.read("tokens", tokenId, (readErr, tokenData) => {
            if (!readErr && tokenData) {
                const tokenPhone = parseJSON(tokenData).phone;
                // find the user
                data.read("users", tokenPhone, (userErr, userData) => {
                    const userObj = parseJSON(userData);

                    if (!userErr && userObj) {
                        // check Authentication
                        _token.verify(tokenId, userObj.phone, (isTrue) => {
                            if (isTrue) {
                                const checksArr =
                                    typeof userObj.checks === "object" &&
                                    userObj.checks instanceof Array
                                        ? userObj.checks
                                        : [];
                                if (checksArr.length < maxChecks) {
                                    const checkId = createRandomString(20);
                                    const checkObj = {
                                        id: checkId,
                                        phone: userObj.phone,
                                        protocol,
                                        url,
                                        method,
                                        successCodes,
                                        timeoutSeconds,
                                    };

                                    // save the checkObj
                                    data.create("checks", checkId, checkObj, (createErr) => {
                                        if (!createErr) {
                                            // add check id to the user's object
                                            userObj.checks = checksArr;
                                            userObj.checks.push(checkId);

                                            // update the user after adding the check id
                                            data.update("users", userObj.phone, userObj, (updateErr) => {
                                                if (!updateErr) {
                                                    callback(200, checkObj );
                                                } else callback(500, { error: updateErr });
                                            });
                                        } else callback(500, { error: createErr });
                                    });
                                } else callback(401, {
                                        error: "user has already reached maximum check limit.",
                                    });
                            } else callback(403, { error: "Authentication failure." });
                        });
                    } else callback(404, { error: "Not found the user." });
                });
            } else callback(404, { error: "Not found user token." });
        });
    } else callback(400, { error: "You have a problem in your inputs." });
};

// for read the check/link information
handler._checks.get = (requestProperties, callback) => {
    const { queryStringObj, headerObj } = requestProperties;
    // check validation of check id
    const checkId =
        typeof queryStringObj.id === "string" &&
        queryStringObj.id.trim().length === 20
            ? queryStringObj.id
            : false;

    if (checkId) {
        // find out the check/link data
        data.read("checks", checkId, (err, checkData) => {
            // convert JSONString to valid object
            const checkObj = parseJSON(checkData);

            if (!err && checkObj) {
                const tokenId =
                    typeof headerObj.token === "string" &&
                    headerObj.token.trim().length === 20
                        ? headerObj.token
                        : false;

                // check Authentication
                _token.verify(tokenId, checkObj.phone, (isTrue) => {
                    if (isTrue) {
                        callback(200, checkObj);
                    } else callback(403, { error: "Authenticaton failure." });
                });
            } else callback(404, {
                    error: "Not Found, Requested check may not exists!",
                });
        });
    } else callback(400, { error: "There was a problem in your request." });
};

// for update the check/link information
handler._checks.put = (requestProperties, callback) => {
    const { body, headerObj } = requestProperties;
    const checkId =
        typeof body.id === "string" && body.id.trim().length === 20
            ? body.id
            : false;
    const protocol =
        typeof body.protocol === "string" &&
        ["http", "https"].indexOf(body.protocol) > -1
            ? body.protocol
            : false;
    const url =
        typeof body.url === "string" && body.url.trim().length > 0
            ? body.url
            : false;
    const method =
        typeof body.method === "string" &&
        ["get", "post", "put", "delete"].indexOf(body.method.toLowerCase()) > -1
            ? body.method
            : false;
    const successCodes =
        typeof body.successCodes === "object" &&
        body.successCodes instanceof Array
            ? body.successCodes
            : false;
    const timeoutSeconds =
        typeof body.timeoutSeconds === "number" &&
        Number.isInteger(body.timeoutSeconds) &&
        body.timeoutSeconds >= 1 &&
        body.timeoutSeconds <= 5
            ? body.timeoutSeconds
            : false;
    if (checkId) {
        if (protocol || url || method || successCodes || timeoutSeconds) {
            // look up the user's check
            data.read("checks", checkId, (readErr, checkData) => {
                const checkObj = parseJSON(checkData);

                if (!readErr && checkObj) {
                    const tokenId =
                        typeof headerObj.token === "string" &&
                        headerObj.token.trim().length === 20
                            ? headerObj.token
                            : false;

                    // check Authentication
                    _token.verify(tokenId, checkObj.phone, (isTrue) => {
                        if (isTrue) {
                            if (protocol) {
                                checkObj.protocol = protocol;
                            }
                            if (url) {
                                checkObj.url = url;
                            }
                            if (method) {
                                checkObj.method = method;
                            }
                            if (successCodes) {
                                checkObj.successCodes = successCodes;
                            }
                            if (timeoutSeconds) {
                                checkObj.timeoutSeconds = timeoutSeconds;
                            }

                            // update the user
                            data.update( "checks", checkId, checkObj, (updateErr) => {
                                if (!updateErr) {
                                    callback(200, checkObj);
                                } else callback(500, { error: updateErr });
                            });
                        } else callback(403, { error: "Authenticaton failure." });
                    });
                } else callback(404, { error: "Not found the user's check" });
            });
        } else callback(400, {
                error: "You must provide at least one field to update.",
            });
    } else callback(400, { error: "There was a Error in your request." });
};

// for delete the check/link
handler._checks.delete = (requestProperties, callback) => {
    const { queryStringObj, headerObj } = requestProperties;
    // check validation of check id
    const checkId =
        typeof queryStringObj.id === "string" &&
        queryStringObj.id.trim().length === 20
            ? queryStringObj.id
            : false;

    if (checkId) {
        // find out the check/link data
        data.read("checks", checkId, (err, checkData) => {
            // convert JSONString to valid object
            const checkObj = parseJSON(checkData);

            if (!err && checkObj) {
                const tokenId =
                    typeof headerObj.token === "string" &&
                    headerObj.token.trim().length === 20
                        ? headerObj.token
                        : false;

                // check Authentication
                _token.verify(tokenId, checkObj.phone, (isTrue) => {
                    if (isTrue) {
                        // delete the user's check
                        data.delete("checks", checkId, (deleteErr) => {
                            if (!deleteErr) {
                                // look up the user to delete check id from checks Array
                                data.read( "users", checkObj.phone, (err, userData) => {
                                    const userObj = parseJSON(userData);

                                    if (!err && userObj) {
                                        const checksArr =
                                            typeof userObj.checks === "object" &&
                                            userObj.checks instanceof Array
                                                ? userObj.checks
                                                : [];

                                        // remove the deleted check id from user's list of checks
                                        const checkPosition = checksArr.indexOf(checkId);
                                        if ( checkPosition > -1) {                                                
                                            checksArr.splice(checkPosition, 1);
                                            userObj.checks = checksArr;

                                            // reupdate the user after deleting the check id
                                            data.update("users", userObj.phone, userObj, (updateErr) => {
                                                if (!updateErr) {
                                                    callback(200, {
                                                        error: "check was successfully deleted.",
                                                    });
                                                } else callback(500, { error: updateErr });
                                            });
                                        } else callback(400, {
                                                error: "Don't match the check id to the user's check",
                                            });
                                    } else callback(404, { error: "Not found the user's check list." });
                                });
                            } else callback(500, { error: deleteErr });
                        });
                    } else callback(403, { error: "Authenticaton failure." });
                });
            } else callback(404, { error: "Not Found, Requested check may not exists!" });
        });
    } else callback(400, { error: "There was a problem in your request." });
};

// export module
module.exports = handler;
