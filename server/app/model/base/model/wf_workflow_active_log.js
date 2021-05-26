'use strict';


module.exports = app => {
    const model = require('path').basename(__filename, '.js');
    let workflowKey = {
        idBill: {
            type: app.mongoose.Types.ObjectId,
        },
        workId: {
            type: String,
        },
        idPage: {
            type: app.mongoose.Types.ObjectId,
            ref: 'cdp_page'
        },
    };
    let workflowDesignKey = {
        id: {
            type: String
        },
        description: {
            type: String
        },
        source: {
            type: String
        },
        target: {
            type: String
        },
        label: {
            type: String
        },
    };
    const attributes = {
        ...workflowKey,
        ...workflowDesignKey,
        /* 流程 字段 */

        idWorkflowMember: {
            type: app.mongoose.Types.ObjectId,
            ref: 'wf_workflow_design'
        }, /* target source id type*/

        /* 业务员操作 字段 */
        operationType: {
            name: '操作类型',
            type: String,
            enum: ['accept', 'reject', 'changeSig', 'counterSig', 'close', 'end', 'again'] /*通过 拒绝 改派 加签 关闭*/
        },
        operationAt: {
            name: '操作时间',
            type: Date,
        },
        pointSigUser: {
            name: '指派人',
            type: app.mongoose.Types.ObjectId,
            ref: 'sys_user'
        },


        idUser: {
            name: '操作人',
            type: app.mongoose.Types.ObjectId,
            ref: 'sys_user'
        },
        memo: {
            name: '加签或改派备注',
            type: String,
        }

    };

    const schema = app.MongooseSchema(model, attributes);

    return app.mongooseDB.get('default').model(model, schema, model);
};
