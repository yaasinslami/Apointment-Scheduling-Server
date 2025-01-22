const fs = require("fs");
const path = require('path');

exports.parseInteger = (value, fieldName, minValue = 0) => {
    const parsedValue = parseInt(value, 10);
    if (isNaN(parsedValue) || parsedValue < minValue) {
        throw new Error(`${fieldName} must be a number greater than or equal to ${minValue}.`);
    }
    return parsedValue;
};

exports.validateString = (value, fieldName) => {
    if (typeof value !== 'string' || value.trim() === '') {
        throw new Error(`${fieldName} is required and must be a non-empty string.`);
    }
};

exports.deleteOldImages = (paths) => {
    paths.forEach((path) => {
        fs.unlink(path, (err) => {
            if (err) {
                console.error(`Failed to delete image: ${path}`, err);
            }
        });
    });
};

exports.deleteUploadedFiles = (files) => {
    if (files && files.length > 0) {
        files.forEach((file) => {
            const filePath = path.resolve(file.path);
            fs.unlink(filePath, (err) => {
                if (err) console.error(`Failed to delete file: ${filePath}`, err);
            });
        });
    }
};
