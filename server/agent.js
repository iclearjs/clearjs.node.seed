'use strict';
class AppBootHook {
  constructor(agent) {
    this.agent = agent;
  }
  async didLoad() {
    // 所有的配置已经加载完毕
    // 可以用来加载应用自定义的文件，启动自定义的服务
  }
}

module.exports = AppBootHook;
