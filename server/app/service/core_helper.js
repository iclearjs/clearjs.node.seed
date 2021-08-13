'use strict';


const Service = require('egg').Service;
const path = require('path');
const fs = require('fs');
const BigNumber = require('bignumber.js');
class CoreHelper extends Service {


  /** @组织权限相关 */

  /**
   * @summary 拉取拥有某个页面 按钮权限（数据）人员
   * @description
   * @param  { String } event 事件编码
   * @param {  String || ObjectId } idPage  来源数据 或 主键 或 查询方案
   * @param {  Object } params  数据范围参数 如 idBranch
   * */

  async getPageAuthUsers(idPage, event, params) {
    const { ctx } = this;
    const idMenu = await ctx.model.CdpMenu.findOne({ idPage }).lean().then(el => el._id);
    const { idOrgan } = params;
    if (idMenu) {
      return await ctx.model.SysRoleDuty.aggregate([
        {
          $match: {
            idOrgan: ctx.service.coreHelper.toObjectID(idOrgan),
          },
        },
        {
          $lookup: {
            from: 'sys_duty_menu',
            localField: 'idDuty',
            foreignField: 'idDuty',
            as: 'dutyMenu',
          },
        },
        {
          $unwind: { path: '$dutyMenu' },
        },
        {
          $match: {
            idMenu: ctx.service.coreHelper.toObjectID(idMenu),
          },
        },
        {
          $lookup: {
            from: 'cdp_menu_button',
            localField: 'dutyMenu.idMenu',
            foreignField: 'idMenu',
            as: 'dutyMenuButton',
          },
        },
        {
          $unwind: { path: '$dutyMenuButton' },
        },
        {
          $match: {
            'dutyMenuButton.event': event,
          },
        },
        {
          $lookup: {
            from: 'sys_user_role',
            localField: 'idRole',
            foreignField: 'idRole',
            as: 'roleUser',
          },
        },
        {
          $unwind: { path: '$roleUser' },
        },
      ]).then(el => {
        return el.map(el => el.roleUser.idUser);
      });
    }
    return [];

  }

  /**
   * @summary 根据类型拉取人员
   * @description
   * @param  { Object } filter 数据筛选条件
   * @param {  String  } type 人员类型
   * @return {  Object } map
   * */

  async getUsersMapByType(filter={},type='User') {
    let keyMap = {};
    const orgUsers = await this.ctx.model.OrgOrganUser.find({...filter,idUser:{$exists:true}}).lean().then(el=>{
      return JSON.parse(JSON.stringify(el))
    })
    switch (type){
      case 'User':
        keyMap = orgUsers.reduce((sum,item)=>{
          return {...sum,[item._id]:item.idUser}
        },keyMap)
        break;
      case 'Supplier':
        keyMap = orgUsers.reduce((sum,item)=>{
          return {...sum,[item.idSupplier]:item.idUser}
        },keyMap)
        break;
      case 'Customer':
        keyMap = orgUsers.reduce((sum,item)=>{
          return {...sum,[item.idCustomer]:item.idUser}
        },keyMap)
        break;
      default:
        keyMap = orgUsers.reduce((sum,item)=>{
          return {...sum,[item['id' + type]]:item.idUser}
        },keyMap)
        break;
    }
    return keyMap;
  }

  /**
   * @summary 获取某组织的上级组织
   * @description
   * @param  { String } idOrgan 事件编码
   * @return { Array } 上级组织ID 数组
   * */

  async getOrganParents(idOrgan) {
    const { ctx } = this;
    const { idGroupOrgan } = await ctx.model.OrgOrgan.findOne({ _id: idOrgan }).lean();
    const Organs = await ctx.model.OrgOrgan.find({ idGroupOrgan }).lean();
    const parents = ctx.service.coreHelper.getTreeParent(Organs, idOrgan);
    return parents ? parents.split(',').filter(el => el) : [];
  }

  /**
   * @summary 获取某人员 对某模型 查询条件
   * @description
   * @param  { Object } filter 基础筛选条件
   * @param  { String } model 查询模型
   * @return { Object } 人员完整查询
   * */

  async _setUserAuthFilter(filter, model) {
    const { ctx } = this;
    if (ctx.locals.pages && ctx.locals.pages.filter(el => el.type === 'bill' && el.isWorkflow && el.idEntityCard && el.idEntityCard.code === model).length > 0) {
      const result = filter;
      const {
        _id: idPage,
        idEntityCard,
      } = ctx.locals.pages.filter(el => el.type === 'bill' && el.isWorkflow && el.idEntityCard && el.idEntityCard.code === model)[0];
      const access_token = decodeURIComponent(ctx.cookies.get('access_token', { signed: false }));
      if (!access_token || !/^[a-fA-F0-9]{24}$/.test(access_token)) {
        return model.indexOf('view_') < 0 ? result : ctx.service.coreHelper.toObjectIDs(result);
      }
      const user = await ctx.model.OrgOrganUser.findOne({ _id: access_token }).lean();

      function addFilterInField(defKeyValue, reqKeyRange) {
        if (defKeyValue && typeof defKeyValue === 'object') {
          let newFilter;
          switch (Object.keys(defKeyValue)[0]) {
            case '$in':
              newFilter = { $in: defKeyValue.$in.filter(el => reqKeyRange.includes(el.toString())) };
              break;
            case '$nin':
              newFilter = { $in: reqKeyRange.filter(el => defKeyValue.$nin.map(el => el.toString()).includes(el.toString())) };
              break;
            case '$ne':
              newFilter = { $in: reqKeyRange.filter(el => defKeyValue.$ne.toString() !== el) };
              break;
            case '$exists':
              newFilter = defKeyValue.$exists ? { $in: reqKeyRange } : { $in: [] };
              break;
            default:
              newFilter = reqKeyRange.includes(defKeyValue.toString()) ? { $in: [ defKeyValue ] } : { $in: [] };
              break;
          }
          return newFilter;
        }
        return defKeyValue && reqKeyRange.includes(defKeyValue.toString()) ? { $in: [ defKeyValue ] } : (!defKeyValue ? { $in: reqKeyRange } : { $in: [] });

      }

      if (user.userType === 'User') {
        const idBranchs = [],
          authFilters = [];
        const userRole = await ctx.model.SysUserRole.find({ idUser: user.idUser }).populate([ 'idRole' ]).lean();
        if (userRole.map(el => el.idRole.roleCode).includes('js02') || userRole.map(el => el.idRole.roleCode).includes('js03') || userRole.map(el => el.idRole.roleCode).includes('js04') || userRole.map(el => el.idRole.roleCode).includes('js05')) {
          const userAuth = await ctx.model.SysUserAuth.find({ _id: user.idUser }).lean();
          userAuth.forEach(el => {
            if (el.userBranch && el.userBranch.length > 0) {
              idBranchs.push(...el.userBranch.map(l => l.idBranch));
            }
          });
          /* 普通用户 加载自己创建的单据 */
          /* 普通用户 加载部门单据 */
          if (idBranchs.length > 0) {
            authFilters.push({ createdUser: addFilterInField(result.createdUser, [ user.idUser ]) });
            authFilters.push({ idBranch: addFilterInField(result.idBranch, idBranchs) });
            if (result.$or) {
              const defaultOr = JSON.parse(JSON.stringify(result.$or));
              result.$or = [];
              for (const afs of authFilters) {
                for (const dr of defaultOr) {
                  const orf = JSON.parse(JSON.stringify(dr));
                  Object.keys(afs).forEach(key => {
                    orf[key] = dr[key] ? addFilterInField(dr[key], afs[key].$in) : afs[key];
                  });
                  result.$or.push(orf);
                }
              }
            } else {
              result.$or = authFilters;
            }
          } else {
            result.createdUser = addFilterInField(result.createdUser, [ user.idUser ]);
          }
        } else {
          result.createdUser = addFilterInField(result.createdUser, [ user.idUser ]);
        }
      }
      return model.indexOf('view_') < 0 ? result : ctx.service.coreHelper.toObjectIDs(result);
    }
    return model.indexOf('view_') < 0 ? filter : ctx.service.coreHelper.toObjectIDs(filter);

  }


  /** @model */

  /**
   * @summary 分页 Aggregate Pipeline
   * @description
   * @param { String||Object } pageConfigOrIdPage 排序字段
   * @return ｛ Object ｝ {pipeline:数据翻译管道, fields：列表字段}
   * */

  async generatePageConfig(pageConfigOrIdPage) {
    if (!pageConfigOrIdPage.listConfig) {
      pageConfigOrIdPage = await this.ctx.model.CdpPage.findOne(/^[a-fA-F0-9]{24}$/.test(pageConfigOrIdPage) ? { _id: pageConfigOrIdPage } : { code: pageConfigOrIdPage }).populate([ 'idEntityList' ]);
    }
    const configPipeline = JSON.parse(pageConfigOrIdPage.listConfig.pipeline);
    let pipeline = [],
      prePipeline = [];
    for (const key in configPipeline) {
      if (configPipeline.hasOwnProperty(key)) {
        if (configPipeline[key][0] && Object.keys(configPipeline[key][0])[0] && Object.keys(configPipeline[key][0])[0] === '$unwind') {
          prePipeline = [ ...prePipeline, configPipeline[key][0] ];
          pipeline = [ ...pipeline, ...configPipeline[key].splice(1, configPipeline[key].length - 1) ];
        } else {
          pipeline = [ ...pipeline, ...configPipeline[key] ];
        }
      }
    }
    const fields = await this.ctx.model.CdpPageWidget.find({ idPage: pageConfigOrIdPage._id, mode: 'list' }).sort('order').lean();
    return { pipeline, fields };
  }

  /** @mongodb */

  /**
   * @summary 分页 Aggregate Pipeline
   * @description
   * @param { String } order 排序字段
   * @param { Number } skip  跳过数据长度
   * @param { Number } limit 排序字段
   * @return ｛ Array ｝ Pipeline
   * */

  getAggregatePaging({ order, skip, limit }) {
    const aggr = [];
    const sort = {};
    if (order && order.split(' ')[0]) {
      order.split(' ').forEach(e => {
        if (e && e[0] === '-') {
          sort[e.slice(1)] = -1;
        } else {
          sort[e] = 1;
        }
      });
      aggr.push({ $sort: sort });
    }
    skip = skip ? skip : 0;
    aggr.push({ $skip: skip });
    if (limit && limit !== 0) {
      aggr.push({ $limit: limit });
    }
    return aggr;
  }

  /**
   * @summary  Pipeline populate 生成
   * @description
   * @param { Array } fields 字段
   * @return ｛ Array ｝ Pipeline
   * */
  getAggregatePopulatePipeline(fields) {
    let pipeline = [];
    for(let field of fields){
      pipeline.push(...[
        {
          $lookup: {
            from: field.refer,
            localField: field.field,
            foreignField: field.foreignField||'_id',
            as: field.field,
          },
        },
        {
          $unwind: {
            path: '$' + (field.path||field.field),
            preserveNullAndEmptyArrays: field.allowEmpty=== void(0)?true:field.allowEmpty,
          },
        },
      ])
    }
    return pipeline;
  }

  /**
   * @summary 将普通查询 转化为 mongodb 查询
   * @description
   * @param { Object } obj 查询
   * @param { Array<string> } fields 字段类型数组
   * @returns { object }
   * */

  toAggregateFilters(obj, fields = []) {
    function testDateString(str) {
      if (!str || typeof str !== 'string') {
        return false;
      }
      if (!str.split('').some(item => /[0-9]/.test(item))) {
        return false;
      }
      let bol = false;
      bol = moment(str).isValid();
      return bol;
    }
    function toNumber(obj) {
      if (typeof obj === 'string') {
        obj = Number.isNaN(Number(obj[key])) ? obj[key] : Number(obj[key]);
      } else if (typeof (obj) === 'object') {
        for (const key in obj) {
          // 如果对象类型为object类型且数组长度大于0 或者 是对象 ，继续递归解析
          if (obj.hasOwnProperty(key)) {
            const element = obj[key];
            if (element && element.length > 0 && typeof (element) === 'object' || typeof (element) === 'object') {
              toNumber(element);
            } else { // 不是对象或数组、直接输出
              obj[key] = Number.isNaN(Number(obj[key])) ? obj[key] : Number(obj[key]);
            }
          }
        }
      }
      return obj;
    }
    function toDate(obj) {
      if (typeof obj === 'string') {
        obj = testDateString(obj) ? new Date(obj) : obj;
      } else if (typeof (obj) === 'object') {
        for (const key in obj) {
          // 如果对象类型为object类型且数组长度大于0 或者 是对象 ，继续递归解析
          if (obj.hasOwnProperty(key)) {
            const element = obj[key];
            if (element && element.length > 0 && typeof (element) === 'object' || typeof (element) === 'object') {
              toDate(element);
            } else { // 不是对象或数组、直接输出
              obj[key] = testDateString(obj[key]) ? new Date(obj[key]) : obj[key];
            }
          }
        }
      }
      return obj;
    }
    const NumberKeys = [ '__s', '__r', ...fields.filter(el => el.widget === 'Number').map(el => el.field) ];
    const DateKeys = [ 'billDate', 'createdAt', 'verifyAt', 'submitAt', 'updatedAt', ...fields.filter(el => el.widget === 'Date').map(el => el.field) ];
    for (const key in obj) {
      // 如果对象类型为object类型且数组长度大于0 或者 是对象 ，继续递归解析
      if (obj.hasOwnProperty(key)) {
        const element = obj[key];
        if (NumberKeys.includes(key)) {
          obj[key] = toNumber(obj[key]);
        }
        if (DateKeys.includes(key)) {
          obj[key] = toDate(obj[key]);
        }
        if (element && element.length > 0 && typeof (element) === 'object' || typeof (element) === 'object') {
          this.toAggregateFilters(element);
        } else { // 不是对象或数组、直接输出
          /* mongodb 主键转换 */
          if (/^[a-fA-F0-9]{24}$/.test(obj[key])) {
            obj[key] = new this.app.mongoose.Types.ObjectId(obj[key]);
          } else if (typeof obj[key] === 'string' && testDateString(obj[key])) {
            obj[key] = new Date(obj[key]);
          }
        }
      }
    }
    return obj;
  }

  /** @node-api */

  /**
   * @summary json 文件生成
   * @description
   * @param  { Object || Array } data 事件编码
   * @param {  Object } option 可选参数 如 后缀 suf、前缀 name、
   * */

  async createJsonFile(data, option = {}) {
    const { ctx } = this;
    const pre = (typeof option === 'object' ? option.name || '' : option) + ctx.app.mongoose.Types.ObjectId();
    const suf = option.suf ? option.suf : 'clearuilog';
    await fs.writeFileSync(path.join(ctx.app.config.fileDir, `${pre}.${suf}.json`), JSON.stringify(data));
    return path.join(ctx.app.config.fileDir, `${pre}.${suf}.json`);
  }

  /** @Money Tax  */

  /**
   * @summary 计价计数型计算
   * @description 根据不同的传值组合 进行计算 返回 无(含)税单价 无(含)税金额 税额(率)
   * @param { Object } params 相关
   * @returns { unitPrice, unitPriceTax, rate, quantity, money, moneyTax, tax } Or param
   * */

  calcOrderTaxAndMoney(params) {
    if (!params) {
      return params;
    }
    const { unitPrice, unitPriceTax, rate, quantity, money, moneyTax, tax } = params;
    const isNum = function(val) {
      return !Number.isNaN(Number(val));
    };
    if (isNum(unitPriceTax) && !Number.isNaN(rate) && isNum(quantity)) {
      return {
        unitPriceTax, rate, quantity,
        unitPrice: BigNumber(unitPriceTax).times(100).div(BigNumber(100).plus(rate))
          .toNumber(),
        money: BigNumber(unitPriceTax).times(100).div(BigNumber(100).plus(rate))
          .times(quantity)
          .toNumber(),
        moneyTax: BigNumber(unitPriceTax).times(quantity).toNumber(),
        tax: BigNumber(unitPriceTax).times(rate).div(BigNumber(100).plus(rate))
          .times(quantity)
          .toNumber(),
      };
    }
    if (isNum(unitPrice) && !Number.isNaN(rate) && isNum(quantity)) {
      return {
        unitPrice, rate, quantity,
        unitPriceTax: BigNumber(unitPrice).times(BigNumber(100).plus(rate)).div(100)
          .toNumber(),
        money: BigNumber(unitPrice).times(quantity).toNumber(),
        moneyTax: BigNumber(unitPrice).times(BigNumber(100).plus(rate)).div(100)
          .times(quantity)
          .toNumber(),
        tax: BigNumber(unitPrice).times(rate).times(quantity)
          .div(100)
          .toNumber(),
      };
    }
    if (isNum(money) && !Number.isNaN(rate) && isNum(quantity)) {
      return {
        rate, quantity, money,
        unitPrice: BigNumber(money).div(quantity).toNumber(),
        unitPriceTax: BigNumber(money).div(quantity).times(BigNumber(100).plus(rate))
          .div(100)
          .toNumber(),
        moneyTax: BigNumber(money).times(BigNumber(100).plus(rate)).div(100)
          .toNumber(),
        tax: BigNumber(money).times(rate).div(100)
          .toNumber(),
      };
    }
    if (isNum(moneyTax) && !Number.isNaN(rate) && isNum(quantity)) {
      return {
        rate, quantity, moneyTax,
        unitPrice: BigNumber(moneyTax).div(quantity).times(100)
          .div(BigNumber(100).plus(rate))
          .toNumber(),
        unitPriceTax: BigNumber(moneyTax).div(quantity).toNumber(),
        money: BigNumber(moneyTax).times(100).div(BigNumber(100).plus(rate))
          .toNumber(),
        tax: BigNumber(moneyTax).times(rate).div(BigNumber(100).plus(rate))
          .toNumber(),
      };

    }
    if (isNum(tax) && !Number.isNaN(rate) && isNum(quantity)) {
      return {
        rate, quantity, tax,
        unitPrice: BigNumber(tax).times(100).div(rate)
          .div(quantity)
          .toNumber(),
        unitPriceTax: BigNumber(tax).times(BigNumber(100).plus(rate)).div(quantity)
          .toNumber(),
        money: BigNumber(tax).times(100).div(rate)
          .toNumber(),
        moneyTax: BigNumber(tax).times(100).div(rate)
          .plus(tax)
          .toNumber(),
      };
    }
    return params;
  }

  /** @bigNumber */

  /**
   * @summary 大数 精确计算
   * @description
   * @returns { object } 求和 add(array);求差:subtract(array);相乘 multiply(array);相除:divide(array) 精确：toFixed(num,length,type)
   * */

  get formatCalculation() {
    return {
      ...BigNumber,
      toFixed:(num,dot=2,type=4)=>{
        return  BigNumber(num).decimalPlaces(dot,4).toNumber()
      },
      add: (...arg) => {
        let sum = 0;
        arg.forEach(num => {
          sum = BigNumber(sum).plus(num);
        });
        return sum.toNumber();
      },
      subtract: (...arg) => {
        let result = arg[0];
        arg.forEach((num, index) => {
          if (index !== 0) {
            result = BigNumber(result).minus(num);
          }
        });
        return result.toNumber();
      },
      multiply: (...arg) => {
        let result = arg[0];
        arg.forEach((num, index) => {
          if (index !== 0) {
            result = BigNumber(result).times(num);
          }
        });
        return result.toNumber();
      },
      divide: (...arg) => {
        let result = arg[0];
        arg.forEach((num, index) => {
          if (index !== 0) {
            result = BigNumber(result).div(num);
          }
        });
        return result.toNumber();
      },
    };
  }


  /** @bill */

  /**
   * @summary 单据表头数据初始化
   * @description
   * @returns { object }
   * */

  initBillHead(data) {
    const Json = JSON.parse(JSON.stringify(data));
    delete Json._id;
    Json.__s = 1;
    Json.__r = 0;
    delete Json.billCode;
    delete Json.idWorkflow;
    delete Json.billDate;
    delete Json.createdAt;
    delete Json.createdUser;
    delete Json.submitAt;
    delete Json.submitUser;
    delete Json.verifyAt;
    delete Json.verifyUser;
    delete Json.abandonUser;
    delete Json.abandonAt;
    delete Json.revokeAt;
    delete Json.revokeUser;
    delete Json.closeAt;
    delete Json.closeUser;
    delete Json.openAt;
    delete Json.openUser;
    return Json;
  }

  /**
   * @summary 单据表体 详细明细数据初始化
   * @description
   * @returns { object }
   * */

  initBillRecord(record) {
    const Json = JSON.parse(JSON.stringify(record));
    delete Json._id;

    function judgeStringIncludes(key, field, type = 'end') {
      return type === 'end' ? key.indexOf(field) === key.length - field.length : key.indexOf(field) === 0;
    }
    for (const key of Object.keys(Json)) {
      if (key.indexOf('sum') === 0 && judgeStringIncludes(key, 'Quantity')) {
        delete Json[key];
      }
      if (key.indexOf('sum') === 0 && judgeStringIncludes(key, 'QuantityPre')) {
        delete Json[key];
      }
      if (key.indexOf('sum') === 0 && judgeStringIncludes(key, 'Money')) {
        delete Json[key];
      }
      if (key.indexOf('sum') === 0 && judgeStringIncludes(key, 'MoneyTax')) {
        delete Json[key];
      }
    }
    return Json;
  }

  /**
   * @summary 格式化 物料信息
   * @description
   * @returns { object }
   * */

  formatMaterielChildrenData(record) {
    if (record === void (0) || typeof record !== 'object') {
      return {};
    }
    function ObjToID(val) {
      return typeof val === 'object' && val !== void (0) ? val._id : val;
    }
    return {
      idMaterielChildren: ObjToID(record.idMaterielChildren) ? ObjToID(record.idMaterielChildren) : record._id,
      idMateriel: ObjToID(record.idMateriel),
      idMainUnit: ObjToID(record.idMainUnit) ? ObjToID(record.idMainUnit) : ObjToID(record.idMateriel ? record.idMateriel.idMainUnit : null),
      idAuxiliaryUnit: ObjToID(record.idAuxiliaryUnit) ? ObjToID(record.idAuxiliaryUnit) : ObjToID(record.idMateriel ? record.idMateriel.idAuxiliaryUnit : null),
      conversionRate: ObjToID(record.conversionRate) ? ObjToID(record.conversionRate) : ObjToID(record.idMateriel ? record.idMateriel.conversionRate : null),
    }
  }

  /**
   * @summary 主子单据表头 合计字段计算
   * @description
   * @param { Object } bill 单据数据
   * @param { String } model 单据数据
   * @param { Array<string> } attach  单据数据
   * @returns { object }
   * */

  calcBillTotal(bill, model = 'records', attach = []) {
    const bigNumberSum = (paramsArray, key) => {
      if (paramsArray.length <= 0) {
        return 0;
      }
      let total = 0;
      const toNum = val => {
        return val && !Number.isNaN(Number(val)) ? Number(val) : 0;
      };
      paramsArray.forEach(el => {
        total = BigNumber(total).plus(toNum(key ? el[key] : el)).toNumber();
      });
      return total;
    };
    return {
      totalTax: bigNumberSum(bill[model], 'tax'),
      totalNumber: bigNumberSum(bill[model], 'number'),
      totalQuantity: bigNumberSum(bill[model], 'quantity'),
      totalMoney: bigNumberSum(bill[model], 'money'),
      totalMoneyTax: bigNumberSum(bill[model], 'moneyTax'),
      ...attach.reduce((sum, key) => {
        return { ...sum, [this.ctx.helper.humps.camelize('total_' + attach)]: bigNumberSum(bill[model], key) };
      }, {}),

    };

  }

  /**
   * @summary 主子单据明细 金额 税额 重新计算
   * @description
   * @param { Object } data 单据数据
   * @returns { object }
   * */

  calculateBillRecords(data) {
    data.records = data.records.map(e => {
      const { unitPriceTax = 0, rate = 0, quantity = 0, conversionRate = 1 } = e;
      const PriceParams = this.calcOrderTaxAndMoney({ unitPriceTax, rate, quantity });
      return { ...e, ...PriceParams, number: quantity / (conversionRate && !Number.isNaN(Number(conversionRate)) ? conversionRate : 1) };
    });
    data.records.forEach(e => {
      e.unitPrice = e.unitPrice.toFixed(8);
      e.unitPriceTax = e.unitPriceTax.toFixed(8);
      e.money = e.money.toFixed(8);
      e.moneyTax = e.moneyTax.toFixed(8);
      e.tax = e.tax.toFixed(8);
    });
    return data;
  }


}

module.exports = CoreHelper;
