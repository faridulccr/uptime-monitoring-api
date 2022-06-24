/**
 * Title: Token Handler,
 * Description: Handler to handleToken route,
 * Date: 19/06/22
 */

// Dependencies
const data = require("../../lib/data");
const {
    hash,
    parseJSON,
    createRandomString,
} = require("../../helpers/utilities");

// module scaffolding
const handler = {};

handler.tokenHandler = (requestProperties, callback) => {
    const { method } = requestProperties;
    const acceptedMethod = ["get", "post", "put", "delete"];

    if (acceptedMethod.indexOf(method) > -1) {
        // call the incoming requested method
        handler._token[method](requestProperties, callback);
    } else
        callback(405, {
            error: "You can only request using get, post, put and delete method.",
        });
};

// module scaffolding for _token object
handler._token = {};

// at first I have to create a token when user will sign up/in
handler._token.post = (requestProperties, callback) => {
    const { body } = requestProperties;
    const phone =
        typeof body.phone === "string" && body.phone.trim().length === 11
            ? body.phone
            : false;
    const password =
        typeof body.password === "string" && body.password.trim().length > 0
            ? body.password
            : false;

    if (phone && password) {
        // finding the user
        data.read("users", phone, (readErr, userData) => {
            if (!readErr && userData) {
                // checking to match password
                if (hash(password) === parseJSON(userData).password) {
                    const tokenId = createRandomString(20);
                    const expires = Date.now() + 3600 * 1000;

                    const tokenObject = {
                        phone,
                        id: tokenId,
                        expires,
                    };

                    if (tokenId) {
                        // create a token
                        data.create(
                            "tokens",
                            tokenId,
                            tokenObject,
                            (createErr) => {
                                if (!createErr) {
                                    callback(200, tokenObject);
                                } else callback(500, { error: createErr });
                            }
                        );
                    } else
                        callback(500, {
                            error: "failed to create a token id.",
                        });
                } else callback(400, { error: "Invalid password." });
            } else callback(400, { error: "Invalid phone." });
        });
    } else callback(400, { error: "There was a problem in your request." });
};

// for read the token when user will request using get, put and delete
handler._token.get = (requestProperties, callback) => {
    const { id } = requestProperties.queryStringObj;
    // check validation of id
    const tokenId =
        typeof id === "string" && id.trim().length === 20 ? id : false;

    if (tokenId) {
        data.read("tokens", tokenId, (err, tokenData) => {
            // convert JSONToken to valid obj then clone
            const tokenObj = { ...parseJSON(tokenData) };
            if (!err && tokenObj) {
                callback(200, tokenObj);
            } else callback(404, { error: "Requested token was not found." });
        });
    } else callback(400, { error: "There was a problem in your request." });
};

// for update the token
handler._token.put = (requestProperties, callback) => {
    const { body } = requestProperties;
    const tokenId =
        typeof body.id === "string" && body.id.trim().length === 20
            ? body.id
            : false;
    const extend = typeof body.extend === "boolean" ? body.extend : false;

    if (tokenId && extend) {
        // finding token object
        data.read("tokens", tokenId, (readErr, tokenData) => {
            const tokenObj = { ...parseJSON(tokenData) };

            if (!readErr && tokenObj) {
                if (Date.now() < tokenObj.expires) {
                    tokenObj.expires = Date.now() + 3600 * 1000;
                    // update the token
                    data.update("tokens", tokenId, tokenObj, (updateErr) => {
                        if (!updateErr) {
                            callback(200, tokenObj);
                        } else callback(500, { error: updateErr });
                    });
                } else callback(400, { error: "token has already expired." });
            } else callback(404, { error: "Requested token was not found." });
        });
    } else callback(400, { error: "there was a error in your request." });
};

// for delete the token when user will log out
handler._token.delete = (requestProperties, callback) => {
    const { id } = requestProperties.queryStringObj;
    // check validation of id
    const tokenId =
        typeof id === "string" && id.trim().length === 20 ? id : false;

    if (tokenId) {
        // finding the token
        data.read("tokens", tokenId, (err, tokenData) => {
            if (!err && tokenData) {
                data.delete("tokens", tokenId, (deleteErr) => {
                    if (!deleteErr) {
                        callback(200, {
                            message: "token was successfully deleted.",
                        });
                    } else callback(500, { error: deleteErr });
                });
            } else callback(404, { error: "Requested token was not found." });
        });
    } else callback(400, { error: "Invalid token. Please try again." });
};

handler._token.verify = (tokenId, phone, callback) => {
    // find user's token
    data.read("tokens", tokenId, (err, tokenData) => {
        if (!err && tokenData) {
            const tokenObj = { ...parseJSON(tokenData) };

            // check phone and expiration
            if (phone === tokenObj.phone && Date.now() < tokenObj.expires) {
                callback(true);
            } else callback(false);
        } else callback(false);
    });
};

// export module
module.exports = handler;
