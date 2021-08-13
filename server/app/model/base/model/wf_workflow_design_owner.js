'use strict';

module.exports = app => {

  const collection = require('path').basename(__filename, '.js');

  const attributes = {
    idWorkflowMember: {
      name: 'idWorkflowMember',
      type: app.mongoose.Schema.ObjectId,
      ref: 'wf_workflow_design',
    },
    ownerType: {
      name: 'ownerType',
      type: String,
    },
    idRole: {
      name: 'idRole',
      type: app.mongoose.Schema.ObjectId,
      ref: 'sys_role',
    },
    idDuty: {
      name: 'idDuty',
      type: app.mongoose.Schema.ObjectId,
      ref: 'sys_duty',
    },
    idUser: {
      name: 'idUser',
      type: app.mongoose.Schema.ObjectId,
      ref: 'org_organ_user',
    },
    order: {
      name: '排序',
      type: Number,
      default: 999,
    },
  };

  const schema = app.MongooseSchema(collection, attributes, true, true, false);

  return app.mongooseDB.get('default').model(collection, require('fs').existsSync(require('path').resolve(__dirname, '../middleware/' + collection + '.js')) ? require('../middleware/' + collection)(app, schema) : schema, collection);

};
