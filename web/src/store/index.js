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
    uid: state => state.app.uid,
    theme: state => state.app.theme,
    color: state => state.app.color,
    multiTab: state => state.app.multiTab,
    lang: state => state.app.lang,
    menu: state => state.app.menu,
    token: state => state.user.token,
    user: state => state.user.user,
  }
})
