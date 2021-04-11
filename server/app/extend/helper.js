'use strict';

module.exports = {
  get humps() {
    return require('humps');
  },

  toObjectIDs(obj) {
    const WhiteList = [ 'idOrganVisible' ];
    for (const key in obj) {
      // 如果对象类型为object类型且数组长度大于0 或者 是对象 ，继续递归解析
      if (obj.hasOwnProperty(key) && ![ 'scopes' ].includes(key)) {
        const element = obj[key];
        if (WhiteList.indexOf(key) < 0) {
          if (element && element.length > 0 && typeof (element) === 'object' || typeof (element) === 'object') {
            this.toObjectIDs(element);
          } else { // 不是对象或数组、直接输出
            if (/^[a-fA-F0-9]{24}$/.test(obj[key])) {
              obj[key] = new this.app.mongoose.Types.ObjectId(obj[key]);
            }
          }
        }
      }
    }
    return obj;
  },

  toObjectID(str) {
    return new this.app.mongoose.Types.ObjectId(str);
  },

  getTreeChildren(data, id) {
    let result = '';
    for (let i = 0; i < data.length; i++) {
      if (id == data[i].p_id) {
        result += (this.getTreeChildren(data, data[i].id));
        result += ',' + data[i].id;
      }
    }
    return result;
  },

  getTreeParent(data, pid) {
    let result = '';
    for (let i = 0; i < data.length; i++) {
      if (data[i].id == pid) {
        if (data[i].p_id != '0') {
          result += (this.getTreeParent(data, data[i].p_id));
        }
        if (data[i].p_id == '0') {
          result = data[i].id;
        } else {
          result += ',' + data[i].id;
        }
      }
    }
    return result;
  },
};
