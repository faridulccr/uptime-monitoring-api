/**
 * Title: Utilities
 * Description: Important utility function
 * Date: 17/06/22
 */

// Dependencies
const crypto = require("crypto"); // for convert string to hash
const { secretKey } = require("../helpers/environment");

// Module scaffolding
const utilities = {};

// parse JSON string to Object
utilities.parseJSON = (jsonSring) => {
    let validObj;

    try {
        validObj = JSON.parse(jsonSring);
    } catch {
        validObj = {};
    }

    return validObj;
};

// converting any string to hash format
utilities.hash = (string) => {
    if (typeof string === "string" && string.trim().length > 0) {
        // convert string to hash
        //HMAC => Hash-based Message Authentication Code
        // createHmac(algorithm, key) => suported algorithm is 'sha256' or 'sha512'
        let hashString = crypto
            .createHmac("sha256", secretKey)
            .update(string)
            .digest("hex");

        return hashString;
    } else return false;
};

// create a random string
utilities.createRandomString = (stringLength) => {
    const length =
        typeof stringLength === "number" && stringLength > 0
            ? stringLength
            : false;

    if (length) {
        const possibleChar = "abcdefghijklmnopqrstuvwxyz1234567890";
        let output = "";

        for (i = 1; i <= length; i++) {
            const randomChar = possibleChar.charAt(
                Math.floor(Math.random() * possibleChar.length)
            );
            output += randomChar;
        }
        return output;
    }
    return false;
};

// export utilities
module.exports = utilities;
