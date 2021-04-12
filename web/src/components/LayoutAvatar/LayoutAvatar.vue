<template>
    <a-dropdown placement="bottomRight">
        <span class="avatar">
          <a-avatar size="small" src="https://gw.alipayobjects.com/zos/antfincdn/XAosXuNZyF/BiazfanxmamNRoxxVxka.png"
                    class="pre-avatar"/>
          <span>{{user.userName}}</span>
        </span>
        <template v-slot:overlay>
            <a-menu class="ant-pro-drop-down menu" :selected-keys="[]">
                <a-menu-item  key="center" @click="handleToCenter">
                    <a-icon type="user"/>
                    个人中心
                </a-menu-item>
                <a-menu-item key="settings" @click="handleToSettings">
                    <a-icon type="setting"/>
                    个人设置
                </a-menu-item>
                <a-menu-divider/>
                <a-menu-item key="logout" @click="Logout">
                    <a-icon type="logout"/>
                    退出登录
                </a-menu-item>
            </a-menu>
        </template>
    </a-dropdown>
</template>

<script>
    import {mapGetters,mapActions} from "vuex";

    export default {
        name: 'Avatar',
        props: {
            currentUser: {
                type: Object,
                default: () => null
            }
        },
        computed:{
          ...mapGetters(['user']),
        },
        methods: {
            ...mapActions(['Logout']),
            handleToCenter() {
              this.$message.warning('暂未开放');
                // this.$router.push({path: '/account/center'})
            },
            handleToSettings() {
              this.$message.warning('暂未开放');
                // this.$router.push({path: '/account/settings'})
            }
        }
    }
</script>

<style lang="less" scoped>
    .ant-pro-drop-down {
        /deep/ .action {
            margin-right: 8px;
        }

        /deep/ .ant-dropdown-menu-item {
            min-width: 160px;
        }
    }

    .avatar {
        padding: 20px 0;
        cursor: pointer;

        .pre-avatar {
            margin: 20px 0;
            margin-right: 8px;
            vertical-align: top;
            background: rgba(255, 255, 255, 0.85);
        }
    }

    .menu {
        .anticon {
            margin-right: 8px;
        }

        .ant-dropdown-menu-item {
            min-width: 100px;
        }
    }
</style>
