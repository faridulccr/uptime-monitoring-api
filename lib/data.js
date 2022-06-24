// Dependencies
const fs = require("fs");
const path = require("path");

// module scaffolding
const data = {};

// base directory to write data
data.basedir = path.join(__dirname, "/../.data/");

// at first Create Data to file
data.create = (dir, filename, dataObj, callback) => {
    // open file for writing
    fs.open(
        `${data.basedir + dir}/${filename}.json`,
        "wx",
        (openErr, fileDescriptor) => {
            if (!openErr && fileDescriptor) {
                // convert dataObj to string
                const stringData = JSON.stringify(dataObj);
                // write data in file
                fs.writeFile(fileDescriptor, stringData, (writeErr) => {
                    if (!writeErr) {
                        // after writing data completely to close it
                        fs.close(fileDescriptor, (closeErr) => {
                            if (!closeErr) {
                                callback(false);
                            } else callback("Error closing the file.");
                        });
                    } else callback("Error writing to new file!");
                });
            } else
                callback("Could not create new file, it may already exists!");
        }
    );
};

// Read data from file
data.read = (dir, filename, callback) => {
    // to read data from file
    fs.readFile(
        `${data.basedir + dir}/${filename}.json`,
        "utf-8",
        (err, result) => {
            callback(err, result);
        }
    );
};

// Update existing file
data.update = (dir, filename, dataObj, callback) => {
    // open file for updating
    fs.open(
        `${data.basedir + dir}/${filename}.json`,
        "r+",
        (openErr, fileDescriptor) => {
            if (!openErr && fileDescriptor) {
                // truncate data after open the file
                fs.ftruncate(fileDescriptor, (truncateErr) => {
                    if (!truncateErr) {
                        // convert dataObj to string
                        const stringData = JSON.stringify(dataObj);
                        // write data in file
                        fs.writeFile(fileDescriptor, stringData, (writeErr) => {
                            if (!writeErr) {
                                // close the file after writing completely
                                fs.close(fileDescriptor, (closeErr) => {
                                    if (!closeErr) {
                                        callback(false);
                                    } else callback("Error closing the file.");
                                });
                            } else callback("Error updating the file");
                        });
                    } else callback("Error truncating the file");
                });
            } else callback("Could not update the file, it may not exists!");
        }
    );
};

// Delete file
data.delete = (dir, filename, callback) => {
    // for delete any file
    fs.unlink(`${data.basedir + dir}/${filename}.json`, (deleteErr) => {
        if (!deleteErr) {
            callback(false);
        } else callback("Error deleting the file, it is server side error.");
    });
};

// get all the items from a directory
data.getList = (dir, callback) => {
    // lookup the directory
    fs.readdir(`${data.basedir + dir}/`, (err, filesArr) => {
        if (!err && filesArr && filesArr.length > 0) {
            const fileNamesArr = [];
            // create a fileNames Arr without .json ext
            filesArr.forEach((fileName) => {
                fileNamesArr.push(fileName.replace(".json", ""));
            });
            callback(false, fileNamesArr);
        } else callback("error reading Directory.");
    });
};

module.exports = data;
