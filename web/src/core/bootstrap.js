import Vue from 'vue'
import store from '@/store/'
import config from '@/config/config.default'

export default function Initializer() {
    store.dispatch('ToggleApp', Vue.ls.get('UID',config.uid))
    store.dispatch('ToggleColor', Vue.ls.get('COLOR', config.primaryColor))
    store.dispatch('ToggleLang', Vue.ls.get('LANG', config.lang))
    store.dispatch('ToggleMultiTab', Vue.ls.get('MULTI_TAB', config.multiTab))
    store.dispatch('ToggleMenu', Vue.ls.get('MENU'), undefined)

    if (Vue.prototype.$electron) {
        store.commit('SET_TOKEN', Vue.ls.get('ACCESS_TOKEN', undefined))
        store.commit('SET_USER', Vue.ls.get('LOGIN_USER', undefined))
        store.commit('SET_GROUP', Vue.ls.get('LOGIN_GROUP', undefined))
        store.commit('SET_ORGAN', Vue.ls.get('LOGIN_ORGAN', undefined))
    }
    if (Vue.prototype.$cookies) {
        store.commit('SET_TOKEN', Vue.$cookies.get('ACCESS_TOKEN'))
        store.commit('SET_USER', Vue.$cookies.get('LOGIN_USER'))
        store.commit('SET_GROUP', Vue.$cookies.get('LOGIN_GROUP'))
        store.commit('SET_ORGAN', Vue.$cookies.get('LOGIN_ORGAN'))
    }
}

