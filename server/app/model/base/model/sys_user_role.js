'use strict';

module.exports = app => {

  const collection = require('path').basename(__filename, '.js');

  const attributes = {
    idUser: {
      name: 'idUser',
      type: app.mongoose.Schema.ObjectId,
      ref: 'sys_user',
    },
    idRole: {
      name: 'idRole',
      type: app.mongoose.Schema.ObjectId,
      ref: 'sys_role',
    },
  };

  const schema = app.MongooseSchema(collection, attributes, true, false, false);

  return app.mongooseDB.get('default').model(collection, require('fs').existsSync(require('path').resolve(__dirname, '../middleware/' + collection + '.js')) ? require('../middleware/' + collection)(app, schema) : schema, collection);

};
