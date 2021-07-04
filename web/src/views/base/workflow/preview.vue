<template>
    <a-modal title="审批" v-model="currentValue" :width="1024" :maskClosable="false" @ok="ok" @cancel="onclose" :centered="true"
             destroyOnClose>
        <a-row :gutter="12">
            <a-col span="14">
                <div style="border: 2px 8px rgba(0, 0, 0, 0.15)">
                    <div id="workflow-pre"></div>
                </div>
            </a-col>
            <a-col span="10">
                <a-tabs v-model="activeTab" size="small" style="height:650px;overflow-y:scroll;" tab-position="left">
                    <a-tab-pane key="1" tab="审批操作">
                        <a-form :model="form" v-if="activeNodes.length>0">

                            <a-row :gutter="12">
                                <a-form-item label="操作员">
                                    <a-select style="width: 200px" v-model="form.idUser">
                                        <a-select-option :value="item.id" v-for="(item,index) in AbleUsers()" :key="index">
                                            {{item.label}}
                                        </a-select-option>
                                    </a-select>
                                </a-form-item>
                                <a-form-item label="活动节点" v-if="form.idUser">
                                    <a-radio-group button-style="solid" v-model="form.node">
                                        <a-radio-button :value="item.id" v-for="item in ActiveNodes()" :key="item.id">
                                            {{item.label}}
                                        </a-radio-button>
                                    </a-radio-group>
                                </a-form-item>
                                <a-form-item label="审核备注">
                                    <a-textarea style="width: 200px" v-model="form.memo">
                                    </a-textarea>
                                </a-form-item>
                                <a-form-item label="操作">
                                    <a-button-group>
                                        <a-button @click="accept" :disabled="!(!!form.idUser && !!form.node)">
                                            通过
                                        </a-button>
                                        <a-button @click="rejectWorkflow(data,form.node)" :disabled="!(!!form.idUser && !!form.node)">
                                            驳回
                                        </a-button>
                                        <a-button @click="counterSigWorkflow" :disabled="!(!!form.idUser && !!form.node)">
                                            加签
                                        </a-button>
                                        <a-button @click="changeSigWorkflow" :disabled="!(!!form.idUser && !!form.node)">
                                            改派
                                        </a-button>
                                    </a-button-group>
                                </a-form-item>
                            </a-row>
                        </a-form>
                        <a-empty v-else description="流程已结束"></a-empty>
                    </a-tab-pane>
                    <a-tab-pane key="2" tab="节点信息">
                        <a-form v-if="memberDetail.currentType === 'node'"
                                :form="memberDetail">
                            <a-form-item label="节点名称">
                                <a-input v-model="memberDetail.label" placeholder="节点名称"/>
                            </a-form-item>
                            <a-form-item label="操作员设置" v-if="memberDetail.nodeType !== 'virtual'">
                                <workflow-owner v-model="memberDetail.owners" :disabled="true"></workflow-owner>
                                <!--                    <a-input placeholder="操作员设置"/>-->
                            </a-form-item>
                            <a-form-item label="合并方式">
                                <a-select v-model="memberDetail.mergeType">
                                    <a-select-option value="or">
                                        或
                                    </a-select-option>
                                    <a-select-option value="and">
                                        与
                                    </a-select-option>
                                </a-select>
                            </a-form-item>
                            <a-form-item label="分支方式">
                                <a-select v-model="memberDetail.branchType">
                                    <a-select-option value="or">
                                        或
                                    </a-select-option>
                                    <a-select-option value="and">
                                        与
                                    </a-select-option>
                                </a-select>
                            </a-form-item>
                        </a-form>
                        <a-form v-else :form="memberDetail">
                            <a-form-item label="名称">
                                <a-input v-model="memberDetail.label" placeholder="节点名称"/>
                            </a-form-item>
                            <a-form-item label="条件类型">
                                <a-select v-model="memberDetail.condType">
                                    <a-select-option value="null">
                                        无
                                    </a-select-option>
                                    <a-select-option value="cond">
                                        条件
                                    </a-select-option>
                                    <a-select-option value="other">
                                        否则
                                    </a-select-option>
                                    <a-select-option value="defaultError">
                                        缺省异常
                                    </a-select-option>
                                    <a-select-option value="error">
                                        异常
                                    </a-select-option>
                                </a-select>
                            </a-form-item>
                            <a-form-item label="条件设置">
                                <a-input></a-input>
                            </a-form-item>
                        </a-form>
                    </a-tab-pane>
                    <a-tab-pane key="3" tab="流程历史">
                        <a-list item-layout="horizontal" :data-source="workflowLog">
                            <a-list-item slot="renderItem" slot-scope="item, index">
                                <a-list-item-meta :description="item.description" >
                                    <a slot="title" >{{item.title}}</a>
                                </a-list-item-meta>
                                {{item.memo}}
                            </a-list-item>
                        </a-list>
                    </a-tab-pane>
                </a-tabs>

            </a-col>
        </a-row>

    </a-modal>
</template>

<script>
    import G6 from '@antv/g6';

    const selectStrokeColor = '#FAAD14';
    const nodeColor = {
        active: '#2F54EB',
        accept: '#52C41A',
        reject: '#F5222D',
        disabled: '#c1c1c1'
    };
    const defaultEdge = {
        stack: true,
        style: {
            stroke: nodeColor.disabled,
            lineWidth: 3,
            endArrow: true,
        }
    };
    const defaultNode = {
        type: 'modelRect',
        size: [200, 48],
        style: {
            fill: nodeColor.disabled,
            stroke: nodeColor.disabled,
            lineWidth: 2,
        },
        stateIcon: {
            show: true,
            /* warning */
            img: 'https://gw.alipayobjects.com/zos/basement_prod/c781088a-c635-452a-940c-0173663456d4.svg',
            /* success */
            // img: 'https://gw.alipayobjects.com/zos/basement_prod/300a2523-67e0-4cbf-9d4a-67c077b40395.svg',
        },
        // 其他配置
    };

    /* 流程逻辑*/
    /*
    * activeNodes 当前活动节点
    * activeEdges 当前活动路径（审批结果类型为‘不通过’的路径除外） 计算：Sum（成立条件 * 人员）
    * workflowLog 活动路径历史 (储存每一条 流程已执行路径) 操作类型 （通过、驳回、改派、加签）
    * workflowCSigLog 会签历史 操作类型 （改派、加签）
    * */


    export default {
        name: "workflow-preview",
        data() {
            return {
                currentValue: false,
                activeTab: '1',
                memberDetail: {},
                model: 'select',
                graph: '',
                activeNodes: [],
                activeEdges: [],
                dragDomType: 'start',
                data: {
                    nodes: [],
                    edges: [],
                },
                form: {
                    idUser:'',
                    node:'',
                },
                workflowLog: [],
                workflowCSigLog: [],
            }
        },
        props: {
            uid: {type: String},
            billCode: {type: String},
            value: {
                type: Boolean,
                default: false
            }
        },
        watch: {
            'currentValue'(val) {
                val && this.loadData()
            },
            value(val) {
                this.currentValue = val
            }
        },
        mounted() {
        },
        methods: {

            async accept() {
                /* /v1/workflow/accept */
                const {idUser, memo, node: source} = this.form;
                if (!this.form.node || !this.form.idUser) {
                    this.$message.error('请先选择操作节点及路线')
                }
                await this.$http.post('/v1/workflow/accept', {idUser, memo, billCode: this.billCode, source});
                this.loadData();
            },


            /* 审核 驳回*/

            async rejectWorkflow() {
                /* /v1/workflow/reject */
                const {idUser, memo, node: source} = this.form;
                if (!this.form.node || !this.form.idUser) {
                    this.$message.error('请先选择操作节点及路线')
                }
                await this.$http.post('/v1/workflow/reject', {idUser, memo, billCode: this.billCode, source});
                this.loadData();
            },

            /* 加签  设置加签人员 */
            counterSigWorkflow() {
                /* /v1/workflow/counterSig */
                const { idUser, node: source,memo} = this.form;
                let users = ['5e77032439fb132348423bdb','5f0b13d254f6200873dff0b2'];
                this.$confirm({
                    title: '设置加签人员',
                    content: (h) => {
                        return h('a-input', {
                            on: {
                                change({target}) {
                                    console.log(target.value)
                                }
                            }
                        })
                    },
                    onOk: async () => {
                        /* 加入加签人 */
                        await this.$http.post('/v1/workflow/counterSig',{idUser,source,memo,billCode:this.billCode,users});
                        this.loadData()
                    }
                })
            },

            /* 改派 */
            changeSigWorkflow() {
                /* /v1/workflow/changeSig */
                const { idUser, node: source,memo} = this.form;
                let toUser ='5f0b13d254f6200873dff0b2';
                this.$confirm({
                    title: '设置改派人员',
                    content: (h) => {
                        return h('CInputRefer', {
                            props:{
                                value:toUser,
                                refer:'sys_user_refer',
                                display:'userName'
                            },
                            on: {
                                input(val) {
                                    toUser = val
                                },
                                change(val) {
                                    toUser = val
                                }
                            }
                        })
                    },
                    onOk: async () => {
                        /* 加入加签人 */
                        await this.$http.post('/v1/workflow/changeSig',{idUser,toUser,source,memo,billCode:this.billCode});
                        this.loadData()
                    }
                })
            },


            onclose() {
                this.currentValue = false;
                this.graph = '';
                this.$emit('input', false)
            },
            ActiveNode() {
                return this.form && this.form.node ? this.data.nodes.filter(row => this.form.node === row.id)[0] : {}
            },
            ActiveNodes() {
                 return this.data && this.form.idUser ? this.data.nodes.filter(row =>this.activeNodes.map(el=>el.id).includes(row.id) && this.activeEdges.filter(item=>item.idUser._id === this.form.idUser).map(r=>r.source).includes(row.id)) : []
            },
            AbleUsers() {
                return [...new Set(this.activeEdges.map(res =>res.idUser._id))].map(id => {
                    let res = this.activeEdges.filter(r => r.idUser._id === id)[0];
                    return {id: res.idUser._id, label: res.idUser.userName}
                })
            },
            /* 根据当前审批节点 进行布局 颜色调整*/
            handleNode({nodes, edges}) {
                let now = nodes.filter(item => {
                    return this.activeNodes.map(el=>el.id).includes(item.id) || this.activeNodes.map(el=>el.id).includes(item.nodeType)
                });
                // let beforeNodes = [];

                let acceptNode = this.workflowLog;

                /* 获取审批记录 节点 及相关连线 设为 accept */
                for (let item of acceptNode) {
                    item.source && this.graph.updateItem(this.graph.findById(item.source), {
                        style: {
                            fill: nodeColor.accept,
                            stroke: nodeColor.accept,
                        }
                    }, false);
                    item.id && this.graph.updateItem(this.graph.findById(item.id), {
                        style: {
                            stroke: nodeColor.accept,
                            endArrow: true,
                            lineWidth: 4,
                        }
                    }, false);
                }
                /* 颜色设为 active节点及连线  */
                for (let item of now) {
                    // beforeNodes.push(...this.getParentNodes({nodes, edges}, item.id).map(r => r.id));
                    this.graph.updateItem(this.graph.findById(item.id), {
                        style: {
                            fill: nodeColor.active,
                            stroke: nodeColor.active,
                        }
                    }, false);
                    this.graph.find('edge', (edge) => {
                        if (edge.get('model').target === item.id && acceptNode.map(r => r.id).includes(edge.get('model').source)) {
                            this.graph.updateItem(edge, {
                                style: {
                                    stroke: nodeColor.active,
                                    endArrow: true,
                                    lineWidth: 4,
                                }
                            }, false);
                        }
                        return edge.get('model').source === item.id;
                    });

                }
                // beforeNodes = [...new Set(beforeNodes)];
                // /* 获取 当前节点的所有 上级节点 将节点颜色设置为 disabled */
                // for (let id of beforeNodes) {
                //     this.graph.updateItem(this.graph.findById(id), {
                //         style: {
                //             fill: nodeColor.disabled,
                //             stroke: nodeColor.disabled,
                //         }
                //     }, false);
                //     /* 获取 当前节点的所有 连线 将节点颜色设置为 disabled */
                //     this.graph.find('edge', (edge) => {
                //         if (edge.get('model').source === id) {
                //             this.graph.updateItem(edge, {
                //                 style: {
                //                     stroke: nodeColor.disabled,
                //                     endArrow: true,
                //                     lineWidth: 2,
                //                 }
                //             }, false);
                //         }
                //         return edge.get('model').source === id;
                //     });
                // }


                /* 判断*/

            },

            async ok(){
                await this.$http.get('/v1/workflow/deleteTestWorkflowMember', {
                    params: {
                        idWorkflow: this.uid,
                        billCode:this.billCode
                    }
                });
                this.onclose()
            },

            /* org_workflow_log */

            async loadData() {
                if (this.uid && this.billCode) {
                    /* /v1/workflow/member */

                    this.data = await this.$http.get('/v1/workflow/member', {params: {billCode: this.billCode}}).then(res => res.data.record);
                    /* 对数据进行缩放*/
                    this.data.nodes = this.data.nodes.map(item => {
                        delete item.x;
                        delete item.y;
                        return item
                    });
                    this.data.edges = this.data.edges.map(item => {
                        delete item.x;
                        delete item.y;
                        return item
                    });

                    let activeData = await this.$http.get('/v1/workflow/activeMember', {params: {billCode: this.billCode}}).then(res => res.data.record);
                    this.activeEdges = activeData.activeEdges;
                    this.activeNodes = activeData.activeNodes;

                    this.workflowLog = await this.$http.get('/v1/workflow/log', {params: {billCode: this.billCode}}).then(res=>res.data.records);
                    if (this.graph) {
                        this.graph.changeData(this.data)
                    } else {
                        this.init()
                    }
                    this.handleNode(this.data);
                    this.handleNode(this.data, this.activeNodes);
                    this.form.idUser = '';
                    this.form.node = '';
                }
            },
            init() {
                const grid = new G6.Grid();
                const minimap = new G6.Minimap({
                    size: [100, 100],
                    className: 'minimap',
                    type: 'delegate',
                });
                this.graph = new G6.Graph({
                    container: 'workflow-pre', // 指定图画布的容器 id，与第 9 行的容器对应
                    plugins: [grid, minimap],
                    fitView: true,
                    layout: {
                        type: 'dagre',
                        rankdir: 'TB',
                        // align: 'UL'
                    },
                    // fitCenter:true,
                    // 画布宽高
                    width: 500,
                    height: 650,
                    defaultNode,
                    defaultEdge,
                    enabledStack: true,
                    modes: {
                        default: ['zoom-canvas', 'click-select'],
                    },
                    nodeStateStyles: {
                        // 鼠标 hover 上节点，即 hover 状态为 true 时的样式
                        hover: {
                            fill: 'lightsteelblue',
                        },
                        // 鼠标点击节点，即 click 状态为 true 时的样式
                        click: {
                            stroke: selectStrokeColor,
                            lineWidth: 3,
                        },
                        fill: '#f0f5ff',
                        stroke: '#adc6ff',
                        lineWidth: 2,
                    },
                    // 边不同状态下的样式集合
                    edgeStateStyles: {
                        // 鼠标点击边，即 click 状态为 true 时的样式
                        click: {
                            stroke: selectStrokeColor,
                        },
                    },
                });
                this.graph.addBehaviors(['drag-node'],
                    'edit',
                );

                this.graph.on('node:mouseenter', e => {
                    const nodeItem = e.item; // 获取鼠标进入的节点元素对象
                    this.graph.setItemState(nodeItem, 'hover', true); // 设置当前节点的 hover 状态为 true
                });

// 鼠标离开节点
                this.graph.on('node:mouseleave', e => {
                    const nodeItem = e.item; // 获取鼠标离开的节点元素对象
                    this.graph.setItemState(nodeItem, 'hover', false); // 设置当前节点的 hover 状态为 false
                });

// 点击节点
                this.graph.on('node:click', e => {
                    // 先将所有当前是 click 状态的节点置为非 click 状态
                    const clickNodes = this.graph.findAllByState('node', 'click');
                    clickNodes.forEach(cn => {
                        this.graph.setItemState(cn, 'click', false);
                    });
                    const clickEdges = this.graph.findAllByState('edge', 'click');
                    clickEdges.forEach(ce => {
                        this.graph.setItemState(ce, 'click', false);
                    });
                    const nodeItem = e.item; // 获取被点击的节点元素对象
                    this.showDetail({...nodeItem.get('model'), currentType: 'node'});
                    this.graph.setItemState(nodeItem, 'click', true); // 设置当前节点的 click 状态为 true
                });

// 点击边
                this.graph.on('edge:click', e => {
                    // 先将所有当前是 click 状态的边置为非 click 状态
                    const clickEdges = this.graph.findAllByState('edge', 'click');
                    clickEdges.forEach(ce => {
                        this.graph.setItemState(ce, 'click', false);
                    });
                    const clickNodes = this.graph.findAllByState('node', 'click');
                    clickNodes.forEach(cn => {
                        this.graph.setItemState(cn, 'click', false);
                    });
                    const edgeItem = e.item; // 获取被点击的边元素对象
                    this.showDetail({...edgeItem.get('model'), currentType: 'edge'});
                    this.graph.setItemState(edgeItem, 'click', true); // 设置当前边的 click 状态为 true
                });

                this.graph.on('nodeselectchange', e => {
                    // 当前操作的 item
                    // console.log(e.target);
                    // 当前操作后，所有被选中的 items 集合
                    // console.log(e.selectedItems);
                    // 当前操作时选中(true)还是取消选中(false)
                    // console.log(e.select);
                });

                // 读取数据
                this.graph.data(this.data);
                // 渲染图
                this.graph.render();
                // const graph = new G6.Graph({
                //     // ...                        // 其他配置项
                //     plugins: [ grid], // 将 grid 实例配置到图上
                //     modes:{
                //         default:[
                //             {
                //                 type: 'tooltip', // 提示框
                //                 formatText(model) {
                //                     // 提示框文本内容
                //                     const text = 'label: ' + model.label + '<br/> class: ' + model.class;
                //                     return text;
                //                 },
                //             },
                //         ]
                //     }
                // });
            },
            showDetail(model) {
                this.activeTab = '2';
                this.memberDetail = model
            },
        }
    }
</script>

<style scoped>

</style>
