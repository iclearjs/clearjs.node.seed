'use strict';

module.exports = app => {

    const collection = require('path').basename(__filename, '.js');

    const attributes = {
        fileCode: {
            name: '文件编码',
            type: String
        },
        fileName: {
            name: '文件名称',
            type: String
        },
        fileType: {
            name: '文件类型',
            type: String
        },
        fileSize: {
            name: '文件大小',
            type: String
        },
        filePath: {
            name: '文件路径',
            type: String
        },
    };

    const schema = app.MongooseSchema(collection, attributes, true, true, false);

    return app.mongooseDB.get('default').model(collection, require('fs').existsSync(require('path').resolve(__dirname, '../middleware/' + collection + '.js')) ? require('../middleware/' + collection)(app, schema) : schema, collection);

};