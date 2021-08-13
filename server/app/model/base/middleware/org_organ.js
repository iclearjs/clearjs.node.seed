'use strict';
module.exports = (app, schema) => {
  /** https://mongoosejs.com/docs/middleware.html*/

  schema.post('validate', async (value, next) => {
    if (!value.organCode) {
      value.organCode = await app.AutoGenerateCode('O', 'OrgOrgan');
    }
    next();
  });

  return schema;
};
