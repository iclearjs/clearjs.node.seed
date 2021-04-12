<template>
    <a-dropdown>
        <a-icon type="bg-colors" style="padding: 20px 0" />
        <a-menu slot="overlay" @click="handleMenuClick" :selectedKeys="[color]">
            <template v-for="item in colorList">
                <a-menu-item :key="item.color">
                    <a-tag :color="item.color" style="width: 100%">{{item.key}}</a-tag>
                </a-menu-item>
            </template>
        </a-menu>
    </a-dropdown>
</template>

<script>
    import {mapGetters,mapActions} from 'vuex'
    export default {
        name: "SwitchColor",
        data(){
            return {
                colorList:[
                    {
                        key: '薄暮', color: '#F5222D'
                    },
                    {
                        key: '火山', color: '#FA541C'
                    },
                    {
                        key: '日暮', color: '#FAAD14'
                    },
                    {
                        key: '明青', color: '#13C2C2'
                    },
                    {
                        key: '极光绿', color: '#52C41A'
                    },
                    {
                        key: '拂晓蓝（默认）', color: '#1890FF'
                    },
                    {
                        key: '极客蓝', color: '#2F54EB'
                    },
                    {
                        key: '酱紫', color: '#722ED1'
                    }
                ]
            }
        },
        computed: {
            ...mapGetters(["color"]),
        },
        methods:{
            ...mapActions(['ToggleColor']),
            handleMenuClick(e) {
                this.ToggleColor(e.key)
            },
        }
    }
</script>

<style scoped>

</style>
