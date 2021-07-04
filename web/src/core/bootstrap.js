import Vue from 'vue'
import store from '@/store/'
import config from '@/config/config.default'

export default function Initializer() {
    if(Vue.ls.get('MENU')){
        store.dispatch('ToggleModule', Vue.ls.get('MENU').idApplication);
        store.commit('TOGGLE_MENU', Vue.ls.get('MENU'))
    }else{
        store.dispatch('ToggleModule', Vue.ls.get('MODULE',config.module))
    }
    store.dispatch('ToggleLayout', Vue.ls.get('LAYOUT', config.layout))
    store.dispatch('ToggleColor', Vue.ls.get('COLOR', config.primaryColor))
    store.dispatch('ToggleLang', Vue.ls.get('LANG', config.lang))
    store.dispatch('ToggleMultiTab', Vue.ls.get('MULTI_TAB', config.multiTab))

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

