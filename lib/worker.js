/**
 * Title: Handle workers
 * Description: Handler to handle worker related works
 * Date: 22/06/2022
 */

//Dependencies
const http = require("http");
const https = require("https");
const url = require("url");
const data = require("./data");
const { parseJSON } = require("../helpers/utilities");
const { sendTwilioSms } = require("../helpers/notifications");

// server object - Module scaffolding
const worker = {};

// lookup/findout all the checks from database
worker.gatherAllChecks = () => {
    // get all the checks
    data.getList("checks", (err, checkListArr) => {
        if (!err && checkListArr && checkListArr.length > 0) {
            checkListArr.forEach((checkFile) => {
                // read the check
                data.read("checks", checkFile, (readErr, checkData) => {
                    if (!readErr && checkData) {
                        // pass the data to the check validator
                        worker.checkValidator(parseJSON(checkData));
                    } else console.log(readErr);
                });
            });
        } else console.log(err);
    });
};

// Validate individual check data
worker.checkValidator = (checkData) => {
    const checkObj = checkData;

    if (checkObj && checkObj.id) {
        // last checked time or false
        checkObj.lastChecked =
            typeof checkData.lastChecked === "number" &&
            checkData.lastChecked > 0
                ? checkData.lastChecked
                : false;
        // what state(up or down) after lastChecked
        checkObj.state =
            typeof checkData.state === "string" &&
            ["up", "down"].indexOf(checkData.state) > -1
                ? checkData.state
                : "down";

        // pass the next process
        worker.performCheck(checkObj);
    } else console.log("error: check was invalid or not properly formatted.");
};

// perform the individual check obj
worker.performCheck = (checkObj) => {
    // convert urlString into ulrObject from checkobj's full url
    const urlObj = url.parse(`${checkObj.protocol}://${checkObj.url}`, true);
    const { hostname, path } = urlObj;

    // make a request details to create a request
    const options = {
        protocol: checkObj.protocol + ":",
        hostname,
        path,
        method: checkObj.method.toUpperCase(),
        timeout: checkObj.timeoutSeconds * 1000, // mili seconds
    };

    // prepate the initial check outcome
    let checkOutcome = {
        error: false,
        responseCode: false,
    };

    // track the outcome has not been sent yet.
    let isOutcomeSent = false;

    // which type of protocol will use for request
    const protocolType = checkObj.protocol === "http" ? http : https;

    // create a request
    const req = protocolType.request(options, (res) => {
        checkOutcome.responseCode = res.statusCode;

        // sent to the next process to update check outcome
        if (!isOutcomeSent) {
            worker.processCheckOutcome(checkObj, checkOutcome);
            isOutcomeSent = true;
        }
    });

    // if error occurs fire error event
    req.on("error", (err) => {
        checkOutcome = {
            error: true,
            value: err,
        };

        // sent to the next process to update check outcome
        if (!isOutcomeSent) {
            worker.processCheckOutcome(checkObj, checkOutcome);
            isOutcomeSent = true;
        }
    });

    // since it has a timeout property so it will fire timeout event
    req.on("timeout", () => {
        checkOutcome = {
            error: true,
            value: "timeout",
        };

        // sent to the next process to update check outcome
        if (!isOutcomeSent) {
            worker.processCheckOutcome(checkObj, checkOutcome);
            isOutcomeSent = true;
        }
    });

    // send request
    req.end();
};

// process the check outcome
worker.processCheckOutcome = (checkObj, checkOutcome) => {
    // check if check outcome up or down
    const state =
        !checkOutcome.error &&
        checkOutcome.responseCode &&
        checkObj.successCodes.indexOf(checkOutcome.responseCode) > -1
            ? "up"
            : "down";

    // decide whether we should alert the user or not
    const alertWanted = !!(checkObj.lastChecked && checkObj.state !== state);
    // const alertWanted =!checkObj.lastChecked && checkObj.state !== state ? true : false;

    // assign new check data in check obj
    const newCheckObj = checkObj;
    newCheckObj.lastChecked = Date.now();
    newCheckObj.state = state;

    // update the check Obj in database without Authentication
    data.update("checks", newCheckObj.id, newCheckObj, (err) => {
        if (!err) {
            if (alertWanted) {
                // pass newCheckObj to the next process
                worker.alertUserToStatusChange(newCheckObj);
            } else
                console.log(
                    "Don't need to notify the user as there is no state change."
                );
        } else console.log(err);
    });
};

// sent SMS notification to the user phone
worker.alertUserToStatusChange = (newCheckObj) => {
    const { method, protocol, url, state, phone } = newCheckObj;
    // create msg that receive the user
    const msg = `Alert: Your check for ${method} ${protocol}://${url} is currently ${state}`;

    // sent sms to the user phone
    sendTwilioSms(phone, msg, (err2) => {
        if (!err2) {
            console.log(`sent msg to user ${phone} as message ${msg}`);
        } else console.log(err2);
    });
};

// timer to execute the worker process once per minute
worker.loop = () => {
    setInterval(() => {
        worker.gatherAllChecks();
    }, 60000);
};

// initialize the worker
worker.init = () => {
    // execute all the checks
    worker.gatherAllChecks();

    // call the loop that continue checks
    worker.loop();
};

module.exports = worker;
