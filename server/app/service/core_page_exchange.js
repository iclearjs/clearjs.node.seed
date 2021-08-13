'use strict';

const Service = require('egg').Service;
const http = require('axios');

class CorePageExchange extends Service {
  constructor(ctx) {
    super(ctx);
    this.http = http;
  }

  async translateCreateData(data) {
    const error = {
      code: '0',
    };
    if (!data) {
      error.code = 'PS01';
      error.message = 'param data missing';
    }
    return { error, data };
  }
  async translateModifyData(data) {
    const error = {
      code: '0',
    };
    if (!data) {
      error.code = 'PS01';
      error.message = 'param data missing';
    }
    return { error, data };
  }
  async translateRemoveData(data) {
    const error = {
      code: '0',
    };
    if (!data) {
      error.code = 'PS01';
      error.message = 'param data missing';
    }
    return { error, data };
  }

  async exchange(idPage, idOrgan, idData, event) {
    const error = { code: '0' };
    const SettingExchanges = await this.ctx.model.OrgSettingExchange.find({ idOrgan, idPage, event }).lean();
    const { PageModel } = await this.ctx.service.corePage.getPageConfig(idPage);
    const record = await PageModel.findOne({ _id: idData });
    if (SettingExchanges && SettingExchanges.length > 0) {
      const ExchangeRecord = await this['translate' + this.ctx.service.coreHelper.humps.pascalize(event) + 'Data'](record);
      for (const SettingExchange of SettingExchanges) {
        if (SettingExchange.url) {
          this.http.post(SettingExchange.url, { config: SettingExchange, data: ExchangeRecord }).catch(e => {
            if (e) {
              error.code = '904';
              error.message = '数据交换失败或超时,请检查同步服务器是否正常运行。';
            }
          }).then(async result => {
            // 创建同步回执
            delete SettingExchange.createdAt;
            delete SettingExchange.updatedAt;
            delete SettingExchange._id;
            const logExchange = await this.ctx.model.LogExchange.create({ ...SettingExchange, request: ExchangeRecord, response: result ? result.data : error, state: error.code === '0' && result.data.error.code === '0' ? 1 : 0 });
            if (result && result.data && result.data.error && result.data.error.code === '0') {
              this.ctx.service.coreEvent.push('EXCHANGE_02', JSON.parse(JSON.stringify(logExchange)), { message: error.message });
            } else {
              this.ctx.service.coreEvent.push('EXCHANGE_01', JSON.parse(JSON.stringify(logExchange)), { message: error.message });
              error.code = '900';
              error.message = '同步数据失败！';
            }
          });
        } else {
          error.code = '900';
          error.message = '数据交换配置有误,请检查数据交换配置。';
        }
      }
    }
    return error;
  }
}

module.exports = CorePageExchange;
