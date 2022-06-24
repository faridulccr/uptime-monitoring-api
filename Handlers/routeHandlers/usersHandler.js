/**
 * Title: User Handler,
 * Description: Handler to handle user route,
 * Date: 17/06/22
 */

// Dependencies
const data = require("../../lib/data");
const { hash, parseJSON } = require("../../helpers/utilities");
const { _token } = require("./tokenHandler");

// module scaffolding
const handler = {};

handler.userHandler = (requestProperties, callback) => {
    const { method } = requestProperties;
    const acceptedMethod = ["get", "post", "put", "delete"];

    if (acceptedMethod.indexOf(method) > -1) {
        // call the incoming requested method
        handler._users[method](requestProperties, callback);
    } else
        callback(405, {
            error: "You can only request using get, post, put and delete method.",
        });
};

// module scaffolding for _user object
handler._users = {};

// at first I have to create the user
handler._users.post = (requestProperties, callback) => {
    const { body } = requestProperties;

    // check validation of all properties
    const firstName =
        typeof body.firstName === "string" && body.firstName.trim().length > 0
            ? body.firstName
            : false;
    const lastName =
        typeof body.lastName === "string" && body.lastName.trim().length > 0
            ? body.lastName
            : false;
    const phone =
        typeof body.phone === "string" && body.phone.trim().length === 11
            ? body.phone
            : false;
    const password =
        typeof body.password === "string" && body.password.trim().length > 0
            ? body.password
            : false;
    const toAgrement =
        typeof body.toAgrement === "boolean" ? body.toAgrement : false;

    if (firstName && lastName && phone && password && toAgrement) {
        const userObject = {
            firstName,
            lastName,
            phone,
            password: hash(password),
            toAgrement,
        };

        // create new user if it dosen't already exists
        data.create("users", phone, userObject, (error) => {
            if (!error) {
                callback(200, {
                    message: `${phone} file created seccessfully.`,
                });
            } else callback(400, { error });
        });
    } else callback(400, { error: "You have a problem in your request." });
};

// for read the user information
handler._users.get = (requestProperties, callback) => {
    const { queryStringObj, headerObj } = requestProperties;
    // check validation of phone
    const phone =
        typeof queryStringObj.phone === "string" &&
        queryStringObj.phone.trim().length === 11
            ? queryStringObj.phone
            : false;

    if (phone) {
        const tokenId =
            typeof headerObj.token === "string" &&
            headerObj.token.trim().length === 20
                ? headerObj.token
                : false;

        // check Authentication
        _token.verify(tokenId, phone, (isTrue) => {
            if (isTrue) {
                data.read("users", phone, (err, userData) => {
                    // convert JSONString to valid obj then clone
                    const user = { ...parseJSON(userData) };

                    if (!err && user) {
                        // remove the password before sent information to user
                        delete user.password;
                        callback(200, user);
                    } else
                        callback(404, {
                            error: "Not Found, Requested user may not exists!",
                        });
                });
            } else callback(403, { error: "Authenticaton failure." });
        });
    } else callback(400, { error: "There was a problem in your request." });
};

// for update the user information
handler._users.put = (requestProperties, callback) => {
    const { body, headerObj } = requestProperties;

    // check validation of all properties
    const phone =
        typeof body.phone === "string" && body.phone.trim().length === 11
            ? body.phone
            : false;
    const firstName =
        typeof body.firstName === "string" && body.firstName.trim().length > 0
            ? body.firstName
            : false;
    const lastName =
        typeof body.lastName === "string" && body.lastName.trim().length > 0
            ? body.lastName
            : false;
    const password =
        typeof body.password === "string" && body.password.trim().length > 0
            ? body.password
            : false;

    if (phone) {
        if (firstName || lastName || password) {
            const tokenId =
                typeof headerObj.token === "string" &&
                headerObj.token.trim().length === 20
                    ? headerObj.token
                    : false;
            // check Authentication
            _token.verify(tokenId, phone, (isTrue) => {
                if (isTrue) {
                    // finding the user
                    data.read("users", phone, (readErr, userData) => {
                        // converting JSONstring to valid object then clone
                        const user = { ...parseJSON(userData) };

                        if (!readErr && user) {
                            if (firstName) {
                                user.firstName = firstName;
                            }
                            if (lastName) {
                                user.lastName = lastName;
                            }
                            if (password) {
                                user.password = hash(password);
                            }

                            // update the user data in specific file
                            data.update("users", phone, user, (updateErr) => {
                                if (!updateErr) {
                                    callback(200, {
                                        message:
                                            "user was updated successfully.",
                                    });
                                } else callback(500, { error: updateErr });
                            });
                        } else
                            callback(404, {
                                error: "Requested user is not found.",
                            });
                    });
                } else callback(403, { error: "Authenticaton failure." });
            });
        } else callback(400, { error: "There was a problem in your request." });
    } else callback(400, { error: "Invalid phone. Please try again!" });
};

// for delete the user
handler._users.delete = (requestProperties, callback) => {
    const { queryStringObj, headerObj } = requestProperties;
    // check validation of phone
    const phone =
        typeof queryStringObj.phone === "string" &&
        queryStringObj.phone.trim().length === 11
            ? queryStringObj.phone
            : false;
    if (phone) {
        const tokenId =
            typeof headerObj.token === "string" &&
            headerObj.token.trim().length === 20
                ? headerObj.token
                : false;
        // check Authentication
        _token.verify(tokenId, phone, (isTrue) => {
            if (isTrue) {
                // finding the user
                data.read("users", phone, (err, userData) => {
                    if (!err && userData) {
                        // delete user
                        data.delete("users", phone, (error) => {
                            if (!error) {
                                callback(200, {
                                    message: "user was successfully deleted.",
                                });
                            } else callback(500, { error });
                        });
                    } else
                        callback(404, {
                            error: "Not found, the user may not exists!",
                        });
                });
            } else callback(403, { error: "Authentication failure." });
        });
    } else callback(400, { error: "Invalid phone. Please try again!" });
};

// export module
module.exports = handler;