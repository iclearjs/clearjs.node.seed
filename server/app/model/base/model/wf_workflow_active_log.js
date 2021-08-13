'use strict';

module.exports = app => {

  const collection = require('path').basename(__filename, '.js');

  const attributes = {
    idBill: {
      name: 'idBill',
      type: app.mongoose.Schema.ObjectId,
    },
    workId: {
      name: 'workId',
      type: String,
    },
    idPage: {
      name: 'idPage',
      type: app.mongoose.Schema.ObjectId,
      ref: 'cdp_page',
    },
    description: {
      name: 'description',
      type: String,
    },
    source: {
      name: 'source',
      type: String,
    },
    target: {
      name: 'target',
      type: String,
    },
    label: {
      name: 'label',
      type: String,
    },
    idWorkflowMember: {
      name: 'idWorkflowMember',
      type: app.mongoose.Schema.ObjectId,
      ref: 'wf_workflow_design',
    },
    operationType: {
      name: '操作类型',
      type: String,
    },
    operationAt: {
      name: '操作时间',
      type: Date,
    },
    pointSigUser: {
      name: '指派人',
      type: app.mongoose.Schema.ObjectId,
      ref: 'sys_user',
    },
    idUser: {
      name: '操作人',
      type: app.mongoose.Schema.ObjectId,
      ref: 'sys_user',
    },
    memo: {
      name: '加签或改派备注',
      type: String,
    },
  };

  const schema = app.MongooseSchema(collection, attributes, true, true, false);

  return app.mongooseDB.get('default').model(collection, require('fs').existsSync(require('path').resolve(__dirname, '../middleware/' + collection + '.js')) ? require('../middleware/' + collection)(app, schema) : schema, collection);

};
