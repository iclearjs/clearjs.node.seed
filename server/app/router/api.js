'use strict';

module.exports = app => {

  const { router, controller } = app;

  // 数据模型API
  router.get('/api/model/:model', controller.api.model.get);
  router.get('/api/model/:model/:id', controller.api.model.getById);
  router.post('/api/model/:model', controller.api.model.post);
  router.put('/api/model/:model/:id', controller.api.model.update);
  router.patch('/api/model/:model/:id', controller.api.model.update);
  router.delete('/api/model/:model/:id', controller.api.model.destroy);
  router.post('/api/getByPost/:model', controller.api.model.getByPost);
  router.post('/api/getByAggregate/:model', controller.api.model.getByAggregate);

  // 认证系统API

  router.post('/api/authority/login', controller.api.authority.login);
  router.post('/api/authority/register', controller.api.authority.register);
  router.post('/api/authority/changePwd', controller.api.authority.changePwd);

  // 文件系统API
  router.get('/api/file/preview/:id', controller.api.file.preview);
  router.get('/api/file/download/:id', controller.api.file.download);
  router.post('/api/file/upload', controller.api.file.upload);
  router.post('/api/file/uploadByBase64', controller.api.file.uploadByBase64);
  router.delete('/api/file/remove/:id', controller.api.file.remove);
};
