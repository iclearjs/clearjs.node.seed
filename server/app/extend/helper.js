'use strict';
const { toObjectID,toObjectIDs } = require('@clearjs/node').mongodb;
const getTreeChildren=(data, id) =>{
  let result = '';
  for (let i = 0; i < data.length; i++) {
    if (id == data[i].p_id) {
      result += (this.getTreeChildren(data, data[i].id));
      result += ',' + data[i].id;
    }
  }
  return result;
}
const getTreeParent=(data, pid)=> {
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
}
module.exports = {
  toObjectIDs,
  toObjectID,
  getTreeChildren,
  getTreeParent,
  get moment() {return require('moment');},
  get humps() {return require('humps');},
  get numeral(){return require('numeral');}
};
