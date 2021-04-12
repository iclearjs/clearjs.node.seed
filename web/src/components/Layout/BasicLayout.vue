<template>
    <a-layout id="basic-layout">
        <a-layout-sider v-model="collapsed" :trigger="null" collapsible>
            <img src="../../assets/logo_white.png" height="64" width="200" v-if="!collapsed"/>
            <img src="../../assets/logo_mini.png" height="64" width="80" v-else/>
            <Menu theme="dark" mode="inline" :menus="menus" :inlineCollapsed="collapsed" @menuSelect="menuSelect"
                  :selectedKeys="[menu.key]" :openKeys.sync="menu.keyPath"></Menu>
        </a-layout-sider>
        <a-layout>
            <a-layout-header style="background: #fff; padding: 0">
                <a-icon class="trigger" :type="collapsed ? 'menu-unfold' : 'menu-fold'"
                        @click="() => (collapsed = !collapsed)"/>
                <toggle-app></toggle-app>
                <layout-header></layout-header>
            </a-layout-header>
            <multi-tab v-if="multiTab" :style="{ margin: '2px 12px' }"></multi-tab>
            <a-layout-content :style="{ margin: '0  12px 2px 12px', background: '#fff', minHeight: '280px' }">
                <keep-alive v-if="multiTab">
                    <router-view/>
                </keep-alive>
                <router-view v-else/>
            </a-layout-content>
        </a-layout>
    </a-layout>
</template>

<script>
    import Menu from "@/components/Menu"
    import LayoutHeader from "@/components/LayoutHeader";
    import MultiTab from "@/components/MultiTab";
    import {mapGetters, mapActions} from 'vuex'
    import ToggleApp from "../ToggleApp/ToggleApp";

    export default {
        name: "basic",
        components: {ToggleApp, MultiTab, LayoutHeader, Menu},
        data() {
            return {
                collapsed: false,
                menus: [],
            };
        },
        created() {
            this.loadMenu(this.uid)
        },
        computed: {
            ...mapGetters(["multiTab","menu","uid"]),
        },
        watch:{
            uid(value){
                this.loadMenu(value)
            }
        },
        methods: {
            ...mapActions(['ToggleMenu']),
            async loadMenu(application){
                const menusArray=(await this.$http.get('/v1/authority/menu',{params:{application}})).data.records;
                this.menus=this.$helper.listToTree(menusArray,0)
            },
            async menuSelect(menu) {
                const activeMenu = this.$helper.getTreeNode(this.menus, menu.key);
                activeMenu.keyPath = menu.keyPath;
                activeMenu.buttons=(await this.$http.get('/v1/authority/button',{params:{menu:menu.key}})).data.record;
                this.ToggleMenu(activeMenu);
            },
        }
    }
</script>

<style scoped lang="less">
    #basic-layout {
        height: 100%;
    }

    #basic-layout .trigger {
        font-size: 18px;
        line-height: 64px;
        padding: 0 24px;
        cursor: pointer;
        transition: color 0.3s;
    }

    #basic-layout .trigger:hover {
        color: #1890ff;
    }
</style>


