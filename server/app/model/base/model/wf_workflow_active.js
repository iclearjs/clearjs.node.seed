'use strict';

module.exports = app => {

    const collection = require('path').basename(__filename, '.js');

    const attributes = {
        idBill: {
            name: 'idBill',
            type: app.mongoose.Schema.ObjectId
        },
        workId: {
            name: 'workId',
            type: String
        },
        idPage: {
            name: 'idPage',
            type: app.mongoose.Schema.ObjectId,
            ref: 'cdp_page'
        },
        idWorkflow: {
            name: 'idWorkflow',
            type: app.mongoose.Schema.ObjectId,
            ref: 'wf_workflow'
        },
    };

    const schema = app.MongooseSchema(collection, attributes, true, false, false);

    return app.mongooseDB.get('default').model(collection, require('fs').existsSync(require('path').resolve(__dirname, '../middleware/' + collection + '.js')) ? require('../middleware/' + collection)(app, schema) : schema, collection);

};