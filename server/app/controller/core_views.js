'use strict';

const Controller = require('egg').Controller;

class CoreViewsCtrl extends Controller {
  async index() {
    return this.ctx.redirect('/index.html');
    // await this.ctx.render('index.html', {title: '首页',intro:'欢迎使用iClearJS开发平台'});
  }
  async notfound() {
    await this.ctx.render('404.html', { title: '404' });
  }
  async swagger() {
    await this.ctx.redirect('/swagger-ui.html');
  }
}

module.exports = CoreViewsCtrl;
