<template>
    <a-dropdown placement="bottomRight">
        <span class="avatar">
            <a-avatar size="small" class="pre-avatar" :src="user.avatar" v-if="user.avatar">{{user.userName.slice(0,1)}}</a-avatar>
            <a-avatar size="small" class="pre-avatar" :style="{backgroundColor:user.avatarColor?user.avatarColor:'#1890ff'}" v-else>{{user.userName.slice(0,1)}}</a-avatar>
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
