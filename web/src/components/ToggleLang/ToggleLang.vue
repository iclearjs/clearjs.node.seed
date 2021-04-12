<template>
    <a-dropdown>
        <a-icon type="global" style="padding: 20px 0" />
        <a-menu slot="overlay" @click="handleMenuClick" :selectedKeys="[lang]">
            <a-menu-item key="zh-CN">
                简体中文
            </a-menu-item>
            <a-menu-item key="en-US">
                英文
            </a-menu-item>
        </a-menu>
    </a-dropdown>
</template>

<script>
    import {mapGetters,mapActions} from 'vuex'
    export default {
        name: "SwitchLang",
        computed: {
            ...mapGetters(["lang"]),
        },
        methods:{
            ...mapActions(['ToggleLang']),
            handleMenuClick(e) {
                this.ToggleLang(e.key);
            },
        }
    }
</script>

<style scoped>

</style>
