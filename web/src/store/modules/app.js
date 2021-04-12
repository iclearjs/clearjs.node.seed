import Vue from 'vue'
import {updateTheme} from "@/components/ToggleColor";
import {loadLanguageAsync} from '@/i18n'
import router from '../../router'

const app = {
    state: {
        uid: '',
        theme: '',
        color: '',
        menu: {
            key: 'dash'
        },
        multiTab: true,
        lang: 'zh-CN'
    },
    mutations: {
        TOGGLE_LANG: (state, color) => {
            Vue.ls.set('LANG', color);
            state.lang = color;
        },
        TOGGLE_THEME: (state, theme) => {
            Vue.ls.set('THEME', theme);
            state.theme = theme
        },
        TOGGLE_COLOR: (state, color) => {
            Vue.ls.set('COLOR', color);
            state.color = color;
        },
        TOGGLE_MULTI_TAB: (state, bool) => {
            Vue.ls.set('MULTI_TAB', bool);
            state.multiTab = bool
        },
        TOGGLE_APP: (state, uid) => {
            Vue.ls.set('UID', uid);
            state.uid = uid
        },
        TOGGLE_MENU: (state, menu) => {
            Vue.ls.set('MENU', menu);
            state.menu = menu
        }
    },
    actions: {
        ToggleApp({commit,dispatch}, app) {
            return new Promise((resolve, reject) => {
                commit('TOGGLE_APP', app);
                router.loadDynamicRoutes(app).then(() => {
                    if (Vue.$cookies.get('access_token')) {
                        Vue.ls.get('MENU') && dispatch('ToggleMenu', Vue.ls.get('MENU'))
                    }
                    resolve()
                }).catch((e) => {
                    reject(e)
                })
            })
        },
        ToggleTheme({commit}, theme) {
            commit('TOGGLE_THEME', theme)
        },
        ToggleColor({commit}, color) {
            commit('TOGGLE_COLOR', color);
            updateTheme(color);
        },
        ToggleMultiTab({commit}, bool) {
            commit('TOGGLE_MULTI_TAB', bool)
        },
        ToggleMenu({commit}, menu) {
            if(menu){
                commit('TOGGLE_MENU', menu);
                document.title = 'iclear.js 深度可定制的低代码平台-'+ menu.title
                router.push({
                    name: menu.routeName
                });
            }
        },
        ToggleLang({commit}, lang) {
            return new Promise((resolve, reject) => {
                commit('TOGGLE_LANG', lang)
                loadLanguageAsync(lang).then(() => {
                    resolve()
                }).catch((e) => {
                    reject(e)
                })
            })
        },
    }
};

export default app
