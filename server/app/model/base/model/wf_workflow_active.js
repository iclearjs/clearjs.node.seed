'use strict';



module.exports = app => {
    const model = require('path').basename(__filename, '.js');
    let workflowKey = {
        idBill:{
            type: app.mongoose.Types.ObjectId,
        },
        workId:{
            type: String,
        },
        idPage: {
            type: app.mongoose.Types.ObjectId,
            ref:'cdp_page'
        },
    };
    const attributes = {
        ...workflowKey,
        /* 流程 字段 */
        idWorkflow: {
            type: app.mongoose.Types.ObjectId,
            ref:'wf_workflow'
        },

    };

    const schema = app.MongooseSchema(model, attributes);

    return app.mongooseDB.get('default').model(model, schema, model);
};
