'use strict';
const APPROVAL_EVENT_DISPLAY = {SUBMIT: '提交', REVOKE: '撤回', VERIFY: '审核', ABANDON: '弃审',};
const WORKFLOW_EVENT_DISPLAY = {WORKFLOW_WAIT: '待审批', WORKFLOW_OVERDUE: '逾期提醒', WORKFLOW_END: '审核完成',};
const EXCHANGE_EVENT_DISPLAY = {EXCHANGE_01: '交换失败', EXCHANGE_02: '交换成功',};


const Service = require('egg').Service;

class CoreEvent extends Service {

  /**
     * @summary 发送推送
     * @description 根据 事件 进行推送;根据组织的配置 对相关事件进行 短信推送.
     * @param  { String } event 事件编码
     * @param {  Object } data  来源数据 或 主键 或 查询方案
     * @param {  Object } meta 其他参照数据
     * @param {  String || Array } sendTo 推送人 (登录人员 ID 或 ID数组 )
     * */

  async push(event, data, meta, sendTo) {
    const error = { code: '0' },
      { ctx } = this;
    if (!data) {
      error.code = 'PS01';
      error.message = 'param data missing';
    }

    const EventConfig = await this.ctx.model.CdpEvent.findOne({ code: event }).populate([ 'idEntity' ]).lean();
    const users = Array.isArray(sendTo) ? sendTo : [ sendTo ];
    let record = {};

    /** 获取数据信息 */
    if (Object.keys(APPROVAL_EVENT_DISPLAY).includes(event)) {
      record.meta.operateUserName = data.operateUserName;
      record.meta.createdUserName = data.createdUserName;
      record.title = data.name;
      record.meta.billCode = data.billCode;
      record.meta.idPage = data._id;
      record.meta._id = data._id;
      record.meta.idMenu = data.idMenu;
      record.content = `${data.operateUserName}${APPROVAL_EVENT_DISPLAY[event]}了${data.createdUserName}发起的${data.page ? data.page.name : ''}[${data.billCode}]`;

    } else if (Object.keys(WORKFLOW_EVENT_DISPLAY).includes(event)) {
      record.title = data.page.name;
      record.meta.billCode = data.billCode;
      record.meta.pageName = data.name;
      record.meta.idPage = data.page._id;
      record.meta.idMenu = data.idMenu;
      record.meta._id = data._id;
      switch (event) {
        case 'WORKFLOW_WAIT':
          record.content = `[待审核] 您有一条${data.page.name}待审核，单号：${data.billCode}`;
          record.users = data && data.users ? data.users : [];
          break;
        case 'WORKFLOW_END':
          record.content = `[已审核] 您有一条${data.page.name}审核完成，单号：${data.billCode}`;
          break;
        case 'WORKFLOW_OVERDUE':
          record.content = `[逾期提醒] 您有一条${data.page.name}的审核即将逾期，单号：${data.billCode}`;
          break;
        default:
          break;
      }
    } else if (Object.keys(EXCHANGE_EVENT_DISPLAY).includes(event)) {
      record.title = `${data.name}${APPROVAL_EVENT_DISPLAY[data.event]}数据${EXCHANGE_EVENT_DISPLAY[event]}`;
      record.meta.pageName = '数据交换记录';
      record.meta.idPage = 'log_exchange';
      record.meta.idMemu = 'log_exchange';
      record.meta._id = data._id;
      // let keyDisplay;
      // for(let key of ['billCode','supplierCode','customerCode','_id']){
      //     if(param.request[key]){
      //         keyDisplay = `单号：${param.billCode}`
      //     }
      //     break
      // }
      switch (event) {
        case 'EXCHANGE_01':
          record.content = `[${EXCHANGE_EVENT_DISPLAY[event]}] 数据交换失败，数据ID${data.request.billCode ? data.request.billCode : data.request._id},交换流水号:${data.exchangeNumber}`;
          break;
        case 'EXCHANGE_02':
          record.content = `[${EXCHANGE_EVENT_DISPLAY[event]}] 数据交换成功，数据ID${data.request.billCode ? data.request.billCode : data.request._id},交换流水号:${data.exchangeNumber}`;
          break;
        default:
          break;
      }

    } else {
      record = {
        idOrgan: data.idOrgan,
        title: EventConfig.name,
        idMenu: EventConfig.idMenu,
        meta: { _id: data._id },
      };
      for (const row of EventConfig.records) {
        record.meta[row.param] = eval(`${row.source ? 'data' : 'mate'}.${row.field}`);
      }
      record.content = (function(template, fields, meta) {
        for (const field of fields) {
          template = template.replace(new RegExp('\\$\\{' + field.param + '\\}', 'g'), `meta.${field.param}`);
        }
        return eval(template);
      })(EventConfig.template, EventConfig.template.records, record.meta);
    }


    /** 判断是否进行短信推送 */
    if (data.idOrgan) {
      const msgSetting = await ctx.model.OrgSettingSms.findOne({
        idEvent: EventConfig._id,
        idOrgan: data.idOrgan,
        value: true,
      });
      if (msgSetting) {
        // await this.sendAliSms({ PhoneNumbers, TemplateCode, TemplateParam, SignName }, { idOrgan: data.idOrgan });
      }
    }
    /** 消息推送 */
    if (data.users.length > 0) {

      const MsgMessageData = users.map(e => {
        return { ...record, idUser: e };
      });

      const records = await ctx.model.LogMessage.create(MsgMessageData);

      /** socket 推送 */
      // await ctx.service.socket.eventSocketExchange(record.users, {
      //   ...JSON.parse(JSON.stringify(records[0])),
      //   eventName: 'imBroadcastMessage',
      // });

    } else {
      error.code = '504';
      error.message = '推送失败，接收用户不存在';
    }


    return { error };
  }

  /**
     * 阿里云短信 推送接口
     * @param { Object } sendParams 短信推送参数 { PhoneNumbers:string 'xxx,xxx', TemplateCode:string, TemplateParam:object, SignName:string }
     * @param { Object } attach  附加信息 将保存在 MsgMessageShort 中 如短信推送组织 idOrgan
     * @return { Object } 返回 {error,result}
     */

  async sendAliSms({ PhoneNumbers, TemplateCode, TemplateParam, SignName }, attach) {
    const error = {
      code: '0',
    };
    let result;

    if (!PhoneNumbers) {
      error.code = '504';
      error.message = 'params PhoneNumbers missing ';
    }
    if (!TemplateCode) {
      error.code = '504';
      error.message = 'params TemplateCode missing ';
    }
    if (error.code === '0') {
      SignName = SignName ? SignName : '买伴云';
      // const messageReturn = await SMS.sendSMS({
      //     PhoneNumbers,
      //     SignName,
      //     TemplateCode,
      //     TemplateParam: JSON.stringify(TemplateParam),
      // }).catch(e => {
      //     if (e) {
      //         error.code = e.code;
      //         error.message = e.message;
      //         error.data = { PhoneNumbers, TemplateCode, TemplateParam, SignName };
      //     }
      // });
      const messageReturn = { message: '测试短信推送', Code: 'OK' };
      if (messageReturn && messageReturn.Code === 'OK') {
        result = await this.ctx.model.LogSms.create({
          telephone: PhoneNumbers,
          sendParams: {
            SignName, TemplateCode, TemplateParam, ...attach,
          },
          response: messageReturn,
        });
      }
    }
    return { error, result };
  }

  async sendTecentSms() {

  }

  async sendBaiduSms() {

  }
}

module.exports = CoreEvent;
