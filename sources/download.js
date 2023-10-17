
const axios = require('axios');
const stream = require('stream');
const {promisify} = require('util');

const finished = promisify(stream.finished);

const downloadFile = (url, path) => {
    const writer = require('fs').createWriteStream(path);
    return axios({
        method: 'get',
        url: url,
        responseType: 'stream',
    }).then(response => {
        response.data.pipe(writer);
        return finished(writer); 
    });
}

module.exports = downloadFile;