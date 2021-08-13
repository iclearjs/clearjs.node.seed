<template>
    <a-layout id="basic-layout">
        <a-layout-sider collapsed :trigger="null" v-if="layout==='left'">
            <img src="../../assets/logo_mini.png" height="64" width="80"/>
            <Menu theme="dark" mode="inline" :menus="applications" inlineCollapsed @menuSelect="({key})=>applicationSelect(key)" :selectedKeys="[module]" :openKeys="[module]"></Menu>
        </a-layout-sider>
        <a-layout-header style="background: #fff; padding: 0;" v-else>
            <a-page-header :title="application.name" :sub-title="application.description" @backIcon="false" style="float: left"/>
            <Menu style="float: right"  theme="light" mode="horizontal" :menus="applications" @menuSelect="({key})=>applicationSelect(key)" :selectedKeys="[module]" :openKeys="[module]"></Menu>
        </a-layout-header>
        <a-layout>
            <a-layout-header style="background: #fff; padding: 0;" v-if="layout==='left'">
                <a-page-header :title="application.name" :sub-title="application.description" @backIcon="false" style="float: left"/>
                <c-layout-header></c-layout-header>
            </a-layout-header>
            <a-layout>
                <a-layout-sider theme="light" v-model="collapsed"  collapsible>
                    <Menu theme="light" mode="inline" :menus="menus" :inlineCollapsed="collapsed" @menuSelect="(selected)=>{selected.key!==menu.key &&menuSelect(selected)}" :selectedKeys="[menu.key]" :openKeys.sync="menu.keyPath"></Menu>
                </a-layout-sider>
                <a-layout>
                    <multi-tab v-if="multiTab" :style="{ margin: '2px 12px' }"></multi-tab>
                    <a-layout-content :style="{ margin: '0  12px 2px 12px', background: '#fff', minHeight: '280px' }">
                        <keep-alive v-if="multiTab">
                            <router-view/>
                        </keep-alive>
                        <router-view v-else/>
                    </a-layout-content>
                </a-layout>
            </a-layout>
        </a-layout>
    </a-layout>
</template>

<script>
    import Menu from "@/components/Menu"
    import CLayoutHeader from "@/components/CLayoutHeader";
    import MultiTab from "@/components/MultiTab";
    import {mapGetters, mapActions} from 'vuex'
    export default {
        name: "basic",
        components: {MultiTab, CLayoutHeader, Menu},
        data() {
            return {
                collapsed: false,
                applications:[],
                application:{},
                menus: [],
            };
        },
        created() {
            this.loadApplications();
            this.applicationSelect(this.module);
            this.ToggleMenu(this.menu);
        },
        computed: {
            ...mapGetters(["layout","module","menu","multiTab"]),
        },
        watch:{
            async module(value){
                await this.loadApplication(value);
                await this.loadMenu(value);
            }
        },
        methods: {
            ...mapActions(['ToggleModule','ToggleMenu']),
            async loadApplication(module){
                this.application=await this.$core.model('cdp_application').getByID(module).then(res=>res.records[0])
            },
            async loadApplications(){
                this.applications=(await this.$http.get('/core/authority/application')).data.records.map(item=>{item.idApplication.title=item.idApplication.name;item.idApplication.key=item.idApplication._id;item.idApplication.icon='appstore';return item.idApplication});
            },
            async applicationSelect(application) {
                await this.ToggleModule(application);
                await this.loadApplication(application)
                await this.loadMenu(application)
            },
            async loadMenu(module){
                const menusArray=(await this.$http.get('/core/authority/menu',{params:{application:module}})).data.records.map(item=>{item.title=item.name;item.key=item._id;return item});
                this.menus=this.$core.helper.listToTree(menusArray,0)
            },
            async menuSelect(menu) {

                const activeMenu = this.$core.helper.getTreeNode(this.menus, menu.key);
                activeMenu.keyPath = menu.keyPath;
                activeMenu.buttons=(await this.$http.get('/core/authority/button',{params:{menu:menu.key}})).data.record;
                activeMenu.organs=this.$core.helper.listToTree((await this.$http.get('/core/authority/organ',{params:{menu:menu.key}})).data.records.map(item=>{item.title=item.organName;item.key=item._id;item.value=item._id;return item}),0);
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
        padding: 0 32px;
        cursor: pointer;
        transition: color 0.3s;
    }

    #basic-layout .trigger:hover {
        color: #1890ff;
    }
</style>


