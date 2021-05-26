'use strict';

module.exports = app => {
    const collection = require('path').basename(__filename, '.js');
    const attributes = {
        name: {
            type: String,
        },
        description:{
            type: String,
        },
        order: {
            type: Number,
            default: 999,
        },
    };

    const schema = app.MongooseSchema(collection, attributes);

    return app.mongooseDB.get('default').model(collection, schema, collection);
};
