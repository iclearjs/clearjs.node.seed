'use strict';

module.exports = app => {

    const collection = require('path').basename(__filename, '.js');

    const attributes = {
        idApplication: {
            name: 'idApplication',
            type: app.mongoose.Schema.ObjectId,
            ref: 'cdp_application'
        },
        idApplicationParams: {
            name: 'idApplicationParams',
            type: app.mongoose.Schema.ObjectId,
            ref: 'cdp_application_params'
        },
        value: {
            name: 'value',
            type: String
        },
    };

    const schema = app.MongooseSchema(collection, attributes, true, true, false);

    return app.mongooseDB.get('default').model(collection, schema, collection);

};