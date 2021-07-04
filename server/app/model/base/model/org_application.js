'use strict';

module.exports = app => {

    const collection = require('path').basename(__filename, '.js');

    const attributes = {
        idApplication: {
            name: 'idApplication',
            type: app.mongoose.Schema.ObjectId,
            ref: 'cdp_application'
        },
        license: {
            name: 'license',
            type: Date
        },
        clientHost: {
            name: 'clientHost',
            type: String
        },
        serverHost: {
            name: 'serverHost',
            type: String
        },
        clientDevHost: {
            name: 'clientDevHost',
            type: String
        },
        serverDevHost: {
            name: 'serverDevHost',
            type: String
        },
        version: {
            name: 'String',
            type: String
        },
        order: {
            name: '排序',
            type: Number,
            default: 999
        },
    };

    const schema = app.MongooseSchema(collection, attributes, true, true, false);

    return app.mongooseDB.get('default').model(collection, require('fs').existsSync(require('path').resolve(__dirname, '../middleware/' + collection + '.js')) ? require('../middleware/' + collection)(app, schema) : schema, collection);

};