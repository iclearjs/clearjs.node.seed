<template>
    <div style="padding: 16px;">
        <a-upload action="http://127.0.0.1:7100/clearui/testApi" :data="{idOrgan:'1000',}">
          <a-button>测试</a-button>
        </a-upload>
        <a-card :bordered="false">
            <a-list item-layout="horizontal" :data-source="orgUser">
                <a-list-item slot="renderItem" slot-scope="item, index">
                    <a-list-item-meta>
                        <a slot="title" >{{ $moment(new Date()).format('a')+'好，'+item.name+'，祝你开心每一天！' }}</a>
                        <p slot="description" href="https://www.antdv.com/">{{item.workNo?item.workNo:'未知工号'}} |
                            {{item.idOrgan.organName}}－{{item.idBranch?item.idBranch.branchName:'未知部门'}}－{{item.job?item.job:'未来之星'}}</p>
                        <a-avatar size="large"
                                slot="avatar"
                                src="https://gw.alipayobjects.com/zos/antfincdn/XAosXuNZyF/BiazfanxmamNRoxxVxka.png"
                        />
                    </a-list-item-meta>
                </a-list-item>
            </a-list>
        </a-card>
        <div >
            <a-row :gutter="16">
                <a-col :span="16">
                    <a-card title="系统公告" :bordered="false" :body-style="{height:'350px',overflow:'auto'}">
                        <a-list itemLayout="horizontal" :dataSource="listNotice.data.records">
                            <a-list-item slot="renderItem" slot-scope="item, index">
                                <a-list-item-meta>
                                    <a slot="title" @click="showNoticeDetail(item)">
                                        <a-icon type="notification" style="color:#ff9900;font-size:20px;margin-right: 6px" />
                                        {{item.noticeTitle}}</a>
                                </a-list-item-meta>
                                <div style="font-size:6px;margin-right: 6px">{{$moment(dataNotice.form.createdAt).format("LLL")}}</div>
                            </a-list-item>
                        </a-list>
                        <a-pagination v-if="listNotice.data.count>0" @change="(page)=>{listNotice.query.page=page;getNotice()}" style="float: right" :defaultCurrent="1" :defaultPageSize="5" :total="listNotice.data.count" />
                    </a-card>
                </a-col>
                <a-col :span="8">
                    <a-card title="更新日志" :bordered="false" :body-style="{height:'350px',overflow:'auto'}">
                        <Timeline>
                            <TimelineItem>
                                <p class="time">V4.0.0</p>
                                <ul class="content">
                                    <li>版本初始</li>
                                </ul>
                            </TimelineItem>
                        </Timeline>
                    </a-card>
                </a-col>
            </a-row>
        </div>
    </div>

</template>

<script>
    import {mapGetters} from "vuex";

    export default {
        name: "dash",
        data() {
            return {
                orgUser: [],
                listNotice: {
                    data:{records:[],count:0},
                    query:{
                        page:1,
                        limit:5,
                        order:'-createdAt',
                        filter:{}
                    }
                },
            }
        },
        computed: {
            ...mapGetters(["user"]),
        },
        async mounted() {
            this.orgUser = await this.$clear.model('org_organ_user').getByID(this.$cookies.get('access_token'), {params: {populate: 'idOrgan,idBranch'}}).then(el => el.records)
        },
    }
</script>

<style scoped>

</style>
