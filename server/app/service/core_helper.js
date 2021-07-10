'use strict';

const Service = require('egg').Service;

class CoreEvent extends Service {

  /**
   * @summary 拉取拥有某个页面 按钮权限（数据）人员
   * @description
   * @param  { String } event 事件编码
   * @param {  String || ObjectId } idPage  来源数据 或 主键 或 查询方案
   * @param {  Object } params  数据范围参数 如 idBranch
   * */

  async getPageAuthUsers(idPage, event, params) {
    const { ctx } = this;
    const idMenu = await ctx.model.CdpMenu({ idPage }).lean();
    const { idOrgan } = params;
    if (idMenu) {
      return await ctx.model.CdpRoleDuty.aggregate([
        {
          $match: {
            idOrgan: ctx.helper.toObjectID(idOrgan),
          },
        },
        {
          $lookup: {
            form: 'sys_duty_menu',
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
            idMenu: ctx.helper.toObjectID(idMenu),
          },
        },
        {
          $lookup: {
            form: 'cdp_menu_button',
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
            form: 'sys_user_role',
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

}

module.exports = CoreEvent;
