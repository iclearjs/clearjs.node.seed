'use strict';

module.exports = app => {

    const collection = require('path').basename(__filename, '.js');

    const attributes = {
        idRole: {
            name: 'idRole',
            type: app.mongoose.Schema.ObjectId,
            ref: 'sys_role'
        },
        idDuty: {
            name: 'idDuty',
            type: app.mongoose.Schema.ObjectId,
            ref: 'sys_duty'
        },
    };

    const schema = app.MongooseSchema(collection, attributes, true, true, false);

    return app.mongooseDB.get('default').model(collection, schema, collection);

};