import Vue from 'vue'
import {Modal} from "ant-design-vue";
import i18n from '../../i18n'

const user = {
  state: {
    user:undefined,
    token: undefined,
    group:undefined,
    organ:undefined,
  },

  mutations: {
    SET_USER: (state, user) => {
      state.user = user
    },
    SET_TOKEN: (state, token) => {
      state.token = token
    },
    SET_GROUP: (state, group) => {
      state.group = group
    },
    SET_ORGAN: (state, organ) => {
      state.organ = organ
    },
  },
  actions:{
    Logout(){
      Modal.confirm({
        title: i18n.t('layouts.usermenu.dialog.title'),
        content: i18n.t('layouts.usermenu.dialog.content'),
        onOk: () => {
          Vue.ls.remove('MENU');
          if (Vue.prototype.$electron) {
            Vue.ls.remove('ACCESS_TOKEN')
            Vue.ls.remove('LOGIN_USER')
            Vue.ls.remove('LOGIN_GROUP')
            Vue.ls.remove('LOGIN_ORGAN')
          }
          if (Vue.prototype.$cookies) {
            Vue.$cookies.remove("ACCESS_TOKEN");
            Vue.$cookies.remove("LOGIN_USER");
            Vue.$cookies.remove("LOGIN_GROUP");
            Vue.$cookies.remove("LOGIN_ORGAN");
          }
          location.reload();
        }
      })
    },
    SetToken({commit}, token) {
      if (Vue.prototype.$electron) {
        Vue.ls.set('ACCESS_TOKEN', token, 24 * 60 * 60 * 1000)
      }
      if (Vue.prototype.$cookies) {
        Vue.$cookies.set('ACCESS_TOKEN', token);
      }
      commit('SET_TOKEN', token)
    },
    SetUser({commit}, user) {
      if (Vue.prototype.$electron) {
        Vue.ls.set('LOGIN_USER', user, 24 * 60 * 60 * 1000)
      }
      if (Vue.prototype.$cookies) {
        Vue.$cookies.set('LOGIN_USER', user);
      }
      commit('SET_USER', user)
    },
    SetGroup({commit}, group) {
      if (Vue.prototype.$electron) {
        Vue.ls.set('LOGIN_GROUP', group, 24 * 60 * 60 * 1000)
      }
      if (Vue.prototype.$cookies) {
        Vue.$cookies.set('LOGIN_GROUP', group);
      }
      commit('SET_GROUP', group)
    },
    SetOrgan({commit}, organ) {
      if (Vue.prototype.$electron) {
        Vue.ls.set('LOGIN_ORGAN', organ, 24 * 60 * 60 * 1000)
      }
      if (Vue.prototype.$cookies) {
        Vue.$cookies.set('LOGIN_ORGAN', organ);
      }
      commit('SET_ORGAN', organ)
    }
  }
};

export default user
