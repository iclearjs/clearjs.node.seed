'use strict';

const crypto = require('crypto');

const Controller = require('egg').Controller;

class authority extends Controller {
  constructor(ctx) {
    super(ctx);
  }

  async login() {
    const error = {
      code: '0',
    };
    if (!this.ctx.request.body.userCode) {
      error.code = '20201';
      error.message = 'param userCode missing';
    }
    if (!this.ctx.request.body.userPwd) {
      error.code = '20202';
      error.message = 'param userPwd missing';
    }
    const record = await this.ctx.model.SysUser.findOne({ userCode: this.ctx.request.body.userCode })
      .catch(e => {
        if (e) {
          error.code = '700';
        }
        console.info(e);
      });
    if (!record) {
      error.code = '800';
      error.message = '抱歉，该用户不存在，请联系管理员！';
    } else if (record.userPwd !== crypto.createHash('md5')
      .update(this.ctx.request.body.userPwd)
      .digest('base64')) {
      error.code = '801';
      error.message = '抱歉！密码错误！';
    } else if (record.__s === 0) {
      error.code = '802';
      error.message = '抱歉，该用户已停用，请联系管理员！';
    }

    this.ctx.body = error.code === '0' ? {
      error,
      record,
    } : {
      error,
    };
  }

  async register() {
    const error = {
      code: '0',
    };
    let record;
    const existsUser = await this.ctx.model.SysUser.find({ userCode: this.ctx.request.body.userCode })
      .catch(e => {
        if (e) {
          error.code = '700';
        }
        console.info(e);
      });
    if (existsUser.length > 0) {
      error.code = '900';
      error.message = '用户已注册，请更换手机号重新注册！';
    } else {
      record = await this.ctx.model.SysUser.create({
        userCode: this.ctx.request.body.userCode,
        userName: this.ctx.request.body.userName,
        userPwd: crypto.createHash('md5')
          .update(this.ctx.request.body.userPwd)
          .digest('base64'),
      })
        .catch(e => {
          if (e) {
            error.code = '700';
          }
          console.info(e);
        });
    }

    this.ctx.body = error.code === '0' ? {
      error,
      record,
    } : {
      error,
    };
  }

  async changePwd() {
    const error = {
      code: '0',
    };
    const rows = await this.ctx.model.SysUser.update({ userCode: this.ctx.request.body.userCode }, {
      userPwd: crypto.createHash('md5')
        .update(this.ctx.request.body.userPwdNew)
        .digest('base64'),
    })
      .catch(e => {
        if (e) {
          error.code = '700';
        }
        console.info(e);
      });

    this.ctx.body = error.code === '0' ? {
      error,
      rows,
    } : {
      error,
    };
  }

  async getUserApplication() {
    const error = {
      code: '0',
    };
    const records = [];
    if (!this.ctx.request.query.access_token) {
      error.code = '20201';
      error.message = 'param access_token missing';
    }
    let filter = {};
    if (error.code === '0') {
      const user = await this.getUserAuthority(this.ctx.request.query.access_token)
        .catch(e => {
          if (e) {
            error.code = '700';
          }
          console.info(e);
        });
      if (user.userType === 'User') { // 用户
        // 根据角色、组件分组获取用户拥有的功能权限
        const aggregate = await this.ctx.model.SysDutyMenu.aggregate([
          {
            $match: {
              idDuty: {
                $in: user.duties,
              },
            },
          }, {
            $group: {
              _id: '$idApplication',
            },
          },
        ]);
        const $in = [];
        for (const agg of aggregate) {
          $in.push(agg._id);
        }
        filter = { idApplication: { $in }, idOrgan: user.idOrgan.idGroupOrgan };
      } else if (user.userType === 'Admin') {
        filter = { idOrgan: user.idOrgan };
      }
      const applications = await this.ctx.model.OrgApplication.find(filter).populate('idApplication');
      for (const application of applications) {
        records.push(application);
      }
    }

    this.ctx.body = error.code === '0' ? {
      error,
      records,
    } : {
      error,
    };
  }

  async getUserMenu() {
    const error = {
      code: '0',
    };
    let records = [];
    if (!this.ctx.request.query.access_token) {
      error.code = '20201';
      error.message = 'param access_token missing';
    }
    if (!this.ctx.request.query.application) {
      error.code = '20202';
      error.message = 'param application missing';
    }

    if (error.code === '0') {
      const user = await this.getUserAuthority(this.ctx.request.query.access_token)
        .catch(e => {
          if (e) {
            error.code = '700';
          }
          console.info(e);
        });

      if (user.userType === 'Admin') {
        records = await this.ctx.model.CdpMenu.find({ idApplication: this.ctx.request.query.application })
          .sort('order')
          .catch(e => {
            if (e) {
              error.code = '700';
            }
            console.info(e);
          });
      } else if (user.userType === 'User') {
        // 根据角色、组件分组获取用户拥有的功能权限
        const aggregate = await this.ctx.model.SysDutyMenu.aggregate([
          {
            $match: {
              idDuty: {
                $in: user.duties,
              },
              idApplication: new this.ctx.app.mongoose.Types.ObjectId(this.ctx.request.query.application),
            },
          }, {
            $group: {
              _id: '$idMenu',
            },
          },
        ]);

        const UserMenu = await this.ctx.model.CdpMenu.populate(aggregate, { path: '_id' })
          .catch(e => {
            if (e) {
              error.code = '700';
            }
            console.info(e);
          });// 获取用户组件列表

        const menu = JSON.parse(JSON.stringify(await this.ctx.model.CdpMenu.find({ idApplication: this.ctx.request.query.application })
          .catch(e => {
            if (e) {
              error.code = '700';
            }
            console.info(e);
          })));// 获取所有组件列表

        const menuIds = [];// 组件id集合
        const pMenuIds = [];// 父组件id集合

        for (const sc of UserMenu) {
          if (sc._id) {
            menuIds.push(sc._id._id.toString());// 将Objectid转化为String再比较；
            records.push(sc._id);
          }
        }
        // 获得父组件集合
        for (const um of UserMenu) {
          if (um._id) {
            const parents = this.ctx.helper.getParent(menu, um._id.p_id);
            if (parents) {
              for (const p of parents.split(',')) {
                pMenuIds.push(p);
              }
            }
          }
        }

        for (const pm of Array.from(new Set(pMenuIds))) {
          for (const m of menu) {
            if (m.id === pm) {
              if (menuIds.indexOf(pm) < 0) {
                records.push(m);
              }
            }
          }
        }
        for (const m of menu) {
          if (m.type === 'R' && m.idApplication.toString() === this.ctx.request.query.application) {
            records.push(m);
          }
        }

        for (let j = 0; j < records.length - 1; j++) {
          // 两两比较，如果前一个比后一个大，则交换位置。
          for (let i = 0; i < records.length - 1 - j; i++) {
            if (records[i].order > records[i + 1].order) {
              const temp = records[i];
              records[i] = records[i + 1];
              records[i + 1] = temp;
            }
          }
        }
        // 根据order属性进行排序号
      }

    }

    this.ctx.body = error.code === '0' ? {
      error,
      records,
    } : {
      error,
    };
  }

  async getUserButton() {
    const error = {
      code: '0',
    };
    const record = {};
    if (!this.ctx.request.query.access_token) {
      error.code = '20401';
      error.message = 'param access_token missing';
    }
    if (!this.ctx.request.query.menu) {
      error.code = '20403';
      error.message = 'param menu missing';
    }
    if (error.code === '0') {
      const user = await this.getUserAuthority(this.ctx.request.query.access_token, this.ctx.request.query.organ)
        .catch(e => {
          if (e) {
            error.code = '700';
          }
          console.info(e);
        });
      // 根据当前路由以及权限获取按钮权限
      const rolesButton = await this.ctx.model.SysDutyButton.find({
        idMenu: this.ctx.request.query.menu,
        idDuty: {
          $in: user.duties,
        },
      }).catch(e => {
        if (e) {
          error.code = '700';
        }
        console.info(e);
      });
      const aggregate = await this.ctx.model.CdpMenuButton.aggregate([
        {
          $match: {
            idMenu: new this.ctx.app.mongoose.Types.ObjectId(this.ctx.request.query.menu),
          },
        },
        {
          $group: {
            _id: '$location',
            buttons: { $push: '$_id' },
          },
        },
      ]);
      for (const location of aggregate) {
        let buttons = [];
        if (user.userType === 'Admin') {
          buttons = Array.from(new Set(location.buttons));
        } else {
          for (const button of Array.from(new Set(location.buttons))) {
            if (rolesButton.map(item => {
              return item.idMenuButton.toString();
            }).indexOf(button.toString()) > -1) {
              buttons.push(button);
            }
          }
        }
        record[location._id] = buttons[0] ? await this.ctx.model.CdpMenuButton.find({ _id: { $in: buttons } }) : [];
      }

      // 根据order属性进行排序号
      for (const r in record) {
        if (record[r][0]) {
          for (let j = 0; j < record[r].length - 1; j++) {
            // 两两比较，如果前一个比后一个大，则交换位置。
            for (let i = 0; i < record[r].length - 1 - j; i++) {
              if (record[r][i].order > record[r][i + 1].order) {
                const temp = record[r][i];
                record[r][i] = record[r][i + 1];
                record[r][i + 1] = temp;
              }
            }
          }
        }
      }
    }
    this.ctx.body = error.code === '0' ? {
      error,
      record,
    } : {
      error,
    };
  }

  async getUserSecurity() {
    const error = {
      code: '0',
    };
    let code;
    let records = [];
    if (!this.ctx.request.query.access_token) {
      error.code = '20401';
      error.message = 'param access_token missing';
    }
    if (!this.ctx.request.query.menu) {
      error.code = '20403';
      error.message = 'param menu missing';
    }
    if (!this.ctx.request.query.organ) {
      error.code = '20403';
      error.message = 'param organ missing';
    }
    if (error.code === '0') {
      const user = await this.getUserAuthority(this.ctx.request.query.access_token, this.ctx.request.query.organ)
        .catch(e => {
          if (e) {
            error.code = '700';
          }
          console.info(e);
        });
      if (user.userType === 'User') {
        // 根据当前用户获取用户角色集合
        const authData = await this.ctx.model.SysDutyScope.find({
          idDuty: {
            $in: user.duties,
          },
          idMenu: this.ctx.request.query.menu,
        })
          .sort('-scope');
        code = authData[0] ? authData[0].dataAuth : 1;
      }
      if (user.userType === 'Admin') {
        code = 4;
      }
      if (parseInt(code) !== 4) {
        // records = await this.ctx.service.engine.dataAuthFilter(code, user);
      } else {
        records = [];
      }
    }

    this.ctx.body = error.code === '0' ? {
      error,
      records,
      code,
    } : {
      error,
    };
  }

  async getUserOrgan() {
    const error = {
      code: '0',
    };
    let records = [];
    if (!this.ctx.request.query.access_token) {
      error.code = '20401';
      error.message = 'param access_token missing';
    }
    if (!this.ctx.request.query.menu) {
      error.code = '20403';
      error.message = 'param menu missing';
    }
    if (error.code === '0') {
      const user = await this.getUserAuthority(this.ctx.request.query.access_token)
        .catch(e => {
          if (e) {
            error.code = '700';
          }
          console.info(e);
        });
      if (user.userType === 'User') {
        const aggregate = await this.ctx.model.SysRoleDuty.aggregate([
          {
            $lookup: {
              from: 'sys_duty_menu',
              localField: 'idDuty',
              foreignField: 'idDuty',
              as: 'dutyMenu',
            },
          },
          {
            $unwind: { path: '$dutyMenu', preserveNullAndEmptyArrays: false },
          },
          {
            $match: {
              idRole: {
                $in: user.roles,
              },
              'dutyMenu.idMenu': this.ctx.helper.toObjectID(this.ctx.request.query.menu),
            },
          }, {
            $group: {
              _id: '$idOrgan',
            },
          },
        ]);
        const organs = await this.ctx.model.OrgOrgan.populate(aggregate, { path: '_id' })
          .catch(e => {
            if (e) {
              error.code = '700';
            }
            console.info(e);
          });// 获取组织详细信息

        const wholeOrgans = await this.ctx.model.OrgOrgan.find().lean()
          .catch(e => {
            if (e) {
              error.code = '700';
            }
            console.info(e);
          });// 获取组织列表

        records = organs.map(item => { return item._id; });

        const pOrganIds = [];// 上级组织id集合

        // 判断每一个组织的父节点是否在已有权限组织集合当中，如果没有添加到父组织集合吗，并将其设为disabled以便前端不能选择
        for (const organ of organs) {
          const parents = this.ctx.helper.getParent(wholeOrgans.map(e => { return { ...e, id: e._id.toString() }; }), organ._id.p_id).split(',');
          for (const parent of parents) {
            if (pOrganIds.indexOf(parent) < 0 && organs.map(item => { return item._id._id.toString(); }).indexOf(parent) < 0) {
              pOrganIds.push(parent);
            }
          }
        }

        for (const po of Array.from(new Set(pOrganIds))) {
          for (const o of wholeOrgans.map(e => { return { ...e, id: e._id.toString() }; })) {
            if (o.id === po) {
              o.disabled = true;
              records.push(o);
            }
          }
        }
        // 根据order属性进行排序号

        for (let j = 0; j < records.length - 1; j++) {
          // 两两比较，如果前一个比后一个大，则交换位置。
          for (let i = 0; i < records.length - 1 - j; i++) {
            if (records[i].order > records[i + 1].order) {
              const temp = records[i];
              records[i] = records[i + 1];
              records[i + 1] = temp;
            }
          }
        }
      } else if (user.userType === 'Admin') {
        records = user.groupOrgan;
      }

    }

    // 响应结果数据
    this.ctx.body = error.code === '0' ? {
      error,
      records,
    } : {
      error,
    };
  }

  async getUserTemplate() {
    const error = {
      code: '0',
    };
    if (!this.ctx.request.query.access_token) {
      error.code = '20201';
      error.message = 'param access_token missing';
    }
    if (!this.ctx.request.query.menu) {
      error.code = '20203';
      error.message = 'param menu missing';
    }
    let records = [];
    if (error.code === '0') {
      const user = await this.getUserAuthority(this.ctx.request.query.access_token)
        .catch(e => {
          if (e) {
            error.code = '700';
          }
          console.info(e);
        });
      if (user.userType === 'User') {
        // 根据当前用户获取用户角色集合
        const templates = await this.ctx.model.OrgTemplate.find({
          idOrgan: user.idOrgan.idGroupOrgan,
          idMenu: this.ctx.request.query.menu,
        })
          .catch(e => {
            if (e) {
              error.code = '700';
            }
            console.info(e);
          });
        const auth = await this.ctx.model.OrgTemplateOwner.find({
          idTemplate: {
            $in: templates.map(item => {
              return item._id;
            }),
          }, $or: [{ idUser: user.idUser }, {
            idRole: user.roles,
          }, {
            idDuty: user.duties,
          }],
        });

        records = await this.ctx.model.OrgTemplate.find({
          _id: {
            $in: auth.map(item => {
              return item.idTemplet;
            }),
          },
        });
        if (records.length === 0) {
          records = await this.ctx.model.OrgTemplate.find({
            idOrgan: user.idOrgan.idGroupOrgan,
            idMenu: this.ctx.request.query.menu,
            下级可见ault: true,
          });
        }
      } else {
        records = await this.ctx.model.OrgTemplate.find({
          idOrgan: user.idOrgan.idGroupOrgan,
          idMenu: this.ctx.request.query.menu,
        });
      }
    }
    this.ctx.body = error.code === '0' ? {
      error,
      records,
    } : {
      error,
    };
  }

  async getApplicationParams() {
    const error = {
      code: '0',
    };
    const record = {};
    if (!this.ctx.request.query.access_token) {
      error.code = '20401';
      error.message = 'param access_token missing';
    }
    if (error.code === '0') {
      const user = await this.getUserAuthority(this.ctx.request.query.access_token)
        .catch(e => {
          if (e) {
            error.code = '700';
          }
          console.info(e);
        });
      const applicationParams = await this.ctx.model.CdpApplicationParams.find({})
        .catch(e => {
          if (e) {
            error.code = '700';
          }
          console.info(e);
        });
      const organApplicationParams = await this.ctx.model.OrgApplicationParams.find({ idOrgan: user.idOrgan.idGroupOrgan }).populate('idApplicationParams').catch(e => {
        if (e) {
          error.code = '700';
        }
        console.info(e);
      });

      for (const applicationParam of applicationParams) {
        record[applicationParam.code] = applicationParam.defaultValue;
      }

      for (const organApplicationParam of organApplicationParams) {
        record[organApplicationParam.idApplicationParams.code] = organApplicationParam.value;
      }
    }

    // 响应结果数据
    this.ctx.body = error.code === '0' ? {
      error,
      record,
    } : {
      error,
    };
  }

  async getUserAuthority(access_token, organ) {
    const user = await this.ctx.model.OrgOrganUser.findOne({ _id: access_token }, { idUser: 1, idOrgan: 1, userType: 1 })
      .populate('idOrgan')
      .lean()
      .catch(e => {
        console.info(e);
      });
    user.groupOrgan = await this.ctx.model.OrgOrgan.find({ idGroupOrgan: user.idOrgan.idGroupOrgan })
      .catch(e => {
        console.info(e);
      });
    const roles = await this.ctx.model.SysUserRole.find({ idUser: user.idUser, idOrgan: { $in: user.groupOrgan } })
      .catch(e => {
        console.info(e);
      });
    user.roles = roles.map(item => {
      return item.idRole;
    });
    const duties = await this.ctx.model.SysRoleDuty.find({ idRole: { $in: user.roles }, idOrgan: organ ? organ : { $in: user.groupOrgan } })
      .catch(e => {
        console.info(e);
      });
    user.duties = duties.map(item => {
      return item.idDuty;
    });

    return user;
  }
}

module.exports = authority;
