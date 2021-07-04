import Vue from 'vue'
import Vuex from 'vuex'

import app from './modules/app'
import user from './modules/user'

Vue.use(Vuex);

export default new Vuex.Store({
  modules: {
    app,
    user
  },
  state: {

  },
  mutations: {

  },
  actions: {

  },
  getters:{
    layout: state => state.app.layout,
    module: state => state.app.module,

    menu: state => state.app.menu,
    color: state => state.app.color,
    multiTab: state => state.app.multiTab,
    lang: state => state.app.lang,

    user: state => state.user.user,
    token: state => state.user.token,
    group: state => state.user.group,
    organ: state => state.user.organ,
  }
})
