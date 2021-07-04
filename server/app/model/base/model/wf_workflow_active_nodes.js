'use strict';

module.exports = app => {

    const collection = require('path').basename(__filename, '.js');

    const attributes = {
        workId: {
            name: 'workId',
            type: String
        },
        label: {
            name: 'label',
            type: String
        },
        idWorkflowMember: {
            name: 'idWorkflowMember',
            type: app.mongoose.Schema.ObjectId,
            ref: 'wf_workflow_design'
        },
    };

    const schema = app.MongooseSchema(collection, attributes, true, false, false);

    return app.mongooseDB.get('default').model(collection, require('fs').existsSync(require('path').resolve(__dirname, '../middleware/' + collection + '.js')) ? require('../middleware/' + collection)(app, schema) : schema, collection);

};