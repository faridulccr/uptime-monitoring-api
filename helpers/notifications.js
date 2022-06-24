/**
 * Title: Notifications Handler
 * Description: Handle SMS notifications related things
 * Date: 22/06/22
 */

// Dependencies
const https = require("https");
const querystring = require("querystring");
const { twilio } = require("./environment");

// Module scaffolding
const notifications = {};

// send sms to user using twilio api
notifications.sendTwilioSms = (phone, msg, callback) => {
    // input validation
    const userPhone =
        typeof phone === "string" && phone.trim().length === 11 ? phone : false;
    const userMsg =
        typeof msg === "string" &&
        msg.trim().length > 0 &&
        msg.trim().length <= 1600 // bcz twilio 1600 char er besi data nite pare na
            ? msg
            : false;

    if (userPhone && userMsg) {
        // configure the request payload
        const payload = {
            Body: userMsg,
            From: twilio.fromUser,
            // StatusCallback: "http://postb.in/1234abcd",
            To: `+88${userPhone}`,
        };

        // stringify the payload I can also use JSON.stringify()
        const stringifyPayload = querystring.stringify(payload);

        // configure the request details/options
        const options = {
            hostname: "api.twilio.com",
            path: `/2010-04-01/Accounts/${twilio.accountSid}/Messages.json`,
            method: "POST",
            auth: `${twilio.accountSid}:${twilio.authToken}`,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        };

        // instantiate/create the request Object
        const req = https.request(options, (res) => {
            // get the status of the sent request
            const status = res.statusCode;

            // callback successfully if the request went throug
            if (status === 200 || status === 201) {
                callback(false);
            } else
                callback(
                    `Status code reterned was ${status}, message:${res.statusMessage}`
                );
        });

        // if network error occurs then fire error event otherwise not
        req.on("error", (err) => {
            callback(err);
        });

        // send the request
        req.write(stringifyPayload);
        req.end();
    } else callback("Given parameters were missing or invalid!");
};

module.exports = notifications;
// free trial e j number diye account verification kora ace sei number dite hobe
// otherwise 400 status code diye error asbe
// sendTwilioSms("01838330708", "I am from twilio", (err) => {
//     console.log(`error: ${err}`);
// });
