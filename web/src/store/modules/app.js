import Vue from 'vue'
import {updateTheme} from "@/components/ToggleColor";
import {loadLanguageAsync} from '@/i18n'
import router from '../../router'
import config from '@/config/config.default'

const app = {
    state: {
        module: '',
        menu: {
            key: 'dash',
            title: '首页',
            routeName: 'dash',
            idApplication:config.module,
            closable: false
        },
        layout:'',
        color: '',
        multiTab: true,
        lang: 'zh-CN'
    },
    mutations: {
        TOGGLE_LAYOUT: (state, layout) => {
            Vue.ls.set('LAYOUT', layout);
            state.layout = layout;
        },
        TOGGLE_MODULE: (state, module) => {
            Vue.ls.set('MODULE', module);
            state.module = module
        },
        TOGGLE_MENU: (state, menu) => {
            Vue.ls.set('MENU', menu);
            state.menu = menu
        },
        TOGGLE_LANG: (state, color) => {
            Vue.ls.set('LANG', color);
            state.lang = color;
        },
        TOGGLE_COLOR: (state, color) => {
            Vue.ls.set('COLOR', color);
            state.color = color;
        },
        TOGGLE_MULTI_TAB: (state, bool) => {
            Vue.ls.set('MULTI_TAB', bool);
            state.multiTab = bool
        }
    },
    actions: {
        ToggleLayout({commit}, layout) {
            commit('TOGGLE_LAYOUT', layout)
        },
        ToggleModule({commit,dispatch}, module) {
            return new Promise((resolve, reject) => {
                commit('TOGGLE_MODULE', module);
                router.loadDynamicRoutes(module).then(() => {
                    resolve()
                }).catch((e) => {
                    reject(e)
                })
            })
        },
        ToggleMenu({commit}, menu) {
            if(menu){
                commit('TOGGLE_MENU', menu);
                document.title = menu.title;
                router.push({
                    name: menu.routeName
                });
            }
        },
        ToggleColor({commit}, color) {
            commit('TOGGLE_COLOR', color);
            updateTheme(color);
        },
        ToggleMultiTab({commit}, bool) {
            commit('TOGGLE_MULTI_TAB', bool)
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
