'use strict';

module.exports = app => {

    const collection = require('path').basename(__filename, '.js');

    const attributes = {
        idPackage: {
            name: 'idPackage',
            type: app.mongoose.Schema.ObjectId,
            ref: 'cdp_package'
        },
        keyword: {
            name: 'keyword',
            type: String
        },
        name: {
            name: 'name',
            type: String
        },
        icon: {
            name: 'icon',
            type: String
        },
        routePrefix: {
            name: 'routePrefix',
            type: String
        },
        description: {
            name: 'description',
            type: String
        },
        pathModel: {
            name: 'pathModel',
            type: String
        },
        pathView: {
            name: 'pathView',
            type: String
        },
        version: {
            name: 'version',
            type: String,
            default: '0.0.1'
        },
        order: {
            name: 'order',
            type: Number,
            default: '999'
        },
    };

    const schema = app.MongooseSchema(collection, attributes, false, false, false);

    return app.mongooseDB.get('default').model(collection, require('../middleware/'+collection)(app,schema), collection);

};
