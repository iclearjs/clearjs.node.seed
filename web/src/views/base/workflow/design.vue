<template>
    <a-card :bordered="false">
        <a-button-group slot="extra">
            <a-button type="primary" @click="$emit('input','design')" v-if="value!=='design'">
                <a-icon type="eye"/>
                设计
            </a-button>
            <a-button type="primary" @click="showPreWorkflow">
                <a-icon type="eye"/>
                预览
            </a-button>
            <a-button type="primary" @click="publish">
                <a-icon type="save"/>
                保存
            </a-button>
            <a-button type="danger" @click="$emit('input','list')">
                <a-icon type="rollback"/>
                返回
            </a-button>
        </a-button-group>
        <a-row type="flex" justify="start">
            <a-col :span="4">
                <a-card title="编辑模式" :bodyStyle="{background: '#F7F9FB',padding:'0px'}" :headStyle="{background: '#F7F9FB'}" v-if="value==='design'">
                    <a-card-grid style="width:33%;text-align:center" :class="model === 'select'?'grid-select':'grid' " @click="handleModelChange('select')">选取</a-card-grid>
                    <a-card-grid style="width:33%;text-align:center" :class="model === 'edit'?'grid-select':''" @click="handleModelChange('edit')">转移</a-card-grid>
                    <a-card-grid style="width:33%;text-align:center" :class="model === 'remove'?'grid-select':''" @click="handleModelChange('remove')">删除</a-card-grid>
                </a-card>
                <a-card title="元图" style="margin-top: 24px" :bodyStyle="{background: '#F7F9FB'}" v-if="value==='design'" :headStyle="{background: '#F7F9FB'}">
                    <a-card-grid style="width:50%;text-align:center" draggable="true" @dragstart.stop="dragDomType = 'common'">
                        人工活动
                    </a-card-grid>
                    <a-card-grid style="width:50%;text-align:center" draggable="true" @dragstart.stop="dragDomType = 'virtual'">
                        虚拟活动
                    </a-card-grid>
                </a-card>
                <workflow-preview :uid="uid" :bill-code="billCode" v-model="preVisible"></workflow-preview>
            </a-col>
            <a-col :span="12">
                <div id="mountNode" @drop="dropAddNode"></div>
            </a-col>
        </a-row>
        <a-drawer title="属性编辑" placement="right" :closable="true" :maskClosable="true" :width="360" :visible="form.visible" @close="onClose">
            <a-form v-if="form.data.currentType === 'node'" :form="form.data" layout="horizontal">
                <a-form-item label="节点名称">
                    <a-input v-model="form.data.label" placeholder="节点名称" :disabled="value!=='design'"/>
                </a-form-item>
                <a-form-item label="节点描述" v-if="form.data.type === 'modelRect'">
                    <a-input v-model="form.data.description" placeholder="节点描述" :disabled="value!=='design'"/>
                </a-form-item>
                <a-form-item label="操作员设置" v-if="form.data.nodeType !== 'virtual'">
                    <workflow-owner v-model="form.data.owners" :disabled="value!=='design'"></workflow-owner>
                </a-form-item>
                <a-form-item label="消息提醒">
                    <a-checkbox v-model="form.data.isSendMessage" :disabled="value!=='design'">系统通知</a-checkbox>
                    <a-checkbox v-model="form.data.isSendShortMessage" :disabled="value!=='design'">短信通知</a-checkbox>
                </a-form-item>
                <a-form-item label="逾期天数" v-if="form.data.nodeType !== 'virtual'">
                    <a-input-number v-model="form.data.overdueDays" style="width: 100%" :disabled="value!=='design'" placeholder="在工作项产生后，到该天数仍未处理，视为逾期"/>
                </a-form-item>
                <a-form-item label="逾期提醒天数" v-if="form.data.nodeType !== 'virtual'">
                    <a-input-number v-model="form.data.overdueNoticeDays" style="width: 100%" :disabled="value!=='design'" placeholder="在工作项产生后，到该天数仍未处理，系统将发送催办邮件"/>
                </a-form-item>
                <a-form-item label="流程操作" v-if="form.data.nodeType === 'common'">
                    <a-checkbox v-model="form.data.isAllowCounterSig" :disabled="value!=='design'">是否允许加签</a-checkbox>
                    <a-checkbox v-model="form.data.isAllowChangeSig" :disabled="value!=='design'">是否允许改派</a-checkbox>
                    <a-checkbox v-model="form.data.isAllowPointSig" :disabled="value!=='design' ||form.data.preemptType==='countersign'">是否允许指派</a-checkbox>
                </a-form-item>
                <a-form-item label="抢占模式">
                    <a-select v-model="form.data.preemptType" :disabled="value !=='design'" @change="(val)=>{form.data.countersignValue = val === 'countersign'? 100:50;form.data.isAllowPointSig = val !== 'countersign';}">
                        <a-select-option value="countersign">会签</a-select-option>
                        <a-select-option value="preempt">抢占</a-select-option>
                    </a-select>
                </a-form-item>
                <a-form-item label="会签阈值" v-if="form.data.preemptType && form.data.preemptType === 'countersign'">
                    <a-input-number :disabled="value!=='design'" v-model="form.data.countersignValue" :min="0" :max="100" :formatter="value => `${value}%`" :parser="value => value.replace('%', '')"/>
                </a-form-item>
                <a-form-item label="驳回处理方式" v-if="form.data.nodeType !== 'virtual'">
                    <a-select v-model="form.data.rejectType" :disabled="value!=='design'">
                        <a-select-option value="stop">提交至驳回环节</a-select-option>
                        <a-select-option value="next">提交至下一环节</a-select-option>
                    </a-select>
                </a-form-item>
                <a-form-item label="合并方式">
                    <a-select v-model="form.data.mergeType" :disabled="value!=='design'">
                        <a-select-option value="or">或</a-select-option>
                        <a-select-option value="and">与</a-select-option>
                    </a-select>
                </a-form-item>
                <a-form-item label="分支方式">
                    <a-select v-model="form.data.branchType" :disabled="value!=='design'">
                        <a-select-option value="or">或</a-select-option>
                        <a-select-option value="and">与</a-select-option>
                    </a-select>
                </a-form-item>
            </a-form>
            <a-form v-else :form="form.data">
                <a-form-item label="名称">
                    <a-input v-model="form.data.label" placeholder="节点名称" :disabled="value!=='design'"/>
                </a-form-item>
                <a-form-item label="条件类型">
                    <a-select v-model="form.data.condType">
                        <a-select-option value="null">无</a-select-option>
                        <a-select-option value="cond">条件</a-select-option>
                        <a-select-option value="other">否则</a-select-option>
                        <a-select-option value="defaultError">缺省异常</a-select-option>
                        <a-select-option value="error">异常</a-select-option>
                    </a-select>
                </a-form-item>
                <a-form-item label="条件设置">
                    <CFilters style="display: inline-block;margin-left: 6px" :uid="workflow.idPage" v-model="form.data.filter"></CFilters>
                </a-form-item>
                <a-form-item label="审批结果">
                    <a-select v-model="form.data.resultType" :disabled="value!=='design'">
                        <a-select-option value="NULL">无</a-select-option>
                        <a-select-option value="YES">通过</a-select-option>
                        <a-select-option value="NO">不通过</a-select-option>
                    </a-select>
                </a-form-item>
                <a-form-item label="优先级">
                    <a-input-number v-model="form.data.order" placeholder="优先级" :disabled="value!=='design'"/>
                </a-form-item>
            </a-form>
        </a-drawer>
        <a-modal title="另存为" v-model="saveForm.visible" :width="1024" :maskClosable="false" destroyOnClose @ok="saveData(saveForm.model)" @cancel="resetForm">
            <a-form-model ref="form" :model="saveForm.model" labelAlign="left" :label-col="saveForm.labelCol" :wrapper-col="saveForm.wrapperCol">
                <a-row :gutter="12">
                    <a-col span="10">
                        <a-form-model-item label="流程编码" prop="code">
                            <a-input v-model="saveForm.model.code"/>
                        </a-form-model-item>
                    </a-col>
                    <a-col span="10">
                        <a-form-model-item label="流程名称" prop="name">
                            <a-input v-model="saveForm.model.name"/>
                        </a-form-model-item>
                    </a-col>
                    <a-col span="10">
                        <a-form-model-item label="流程版本">
                            <a-input v-model="saveForm.model.version"/>
                        </a-form-model-item>
                    </a-col>
                </a-row>
            </a-form-model>
        </a-modal>
    </a-card>
</template>

<script>
    import G6 from '@antv/g6';
    import {v4} from 'uuid';
    import WorkflowOwner from "./owner";
    import WorkflowPreview from "./preview";
    const selectNodeStroke = '#40f657'; /*节点 选中样式*/
    const selectEdgeStroke = '#40f657'; /*边   选中样式*/
    export default {
        name: "workflow-design",
        components: {WorkflowPreview, WorkflowOwner},
        data() {
            return {
                billCode:'TEST20200901',
                contentHeight: window.innerHeight - 200,
                contentWidth: window.innerWidth - 300,
                workflow: {},
                preVisible: false,
                form: {
                    visible: false,
                    data: {},
                },
                saveForm: {
                    visible: false,
                    labelCol: {span: 5},
                    wrapperCol: {span: 19},
                    model: {},
                },
                model: 'select',
                graph: '',
                dragDomType: 'start',
                data: {
                    nodes: [
                        {
                            id: v4(),
                            x: 600,
                            y: 60,
                            type: 'modelRect',
                            description: '开始节点',
                            label: '开始节点',
                            nodeType: 'start',
                            anchorPoints: [[0.5, 1]],
                            stack: true,
                            linkPoints: {
                                bottom: true
                            }
                        },
                        {
                            id: v4(),
                            x: 600,
                            y: 800,
                            type: 'modelRect',
                            description: '结束节点',
                            nodeType: 'end',
                            label: '结束节点',
                            anchorPoints: [[0.5, 0]],
                            linkPoints: {
                                top: true
                            }
                        }
                    ],
                    edges: [],
                }
            }
        },
        props: {
            uid: String,
            value: String,
        },
        mounted() {
            this.registerBehavior();

            this.loadData()
        },
        methods: {


            async showPreWorkflow() {
                await this.$http.get('/v1/workflow/deleteTestWorkflowMember', {
                    params: {
                        idWorkflow: this.uid,
                        billCode:this.billCode
                    }
                });
                await this.$http.post('/v1/workflow/enter', {idWorkflow: this.uid, billCode:this.billCode});
                this.preVisible = true
            },

            async loadData() {
                if (this.uid) {
                    this.$clear.model('wf_workflow').getByID(this.uid).then(res => {
                        this.workflow = res.records[0]
                    });
                    this.data = await this.$http.get('/v1/workflow/design/members', {params: {idWorkflow: this.uid}}).then(res => res.data.records);
                    if (this.data.nodes.length === 0) {
                        this.data = {
                            nodes: [
                                {
                                    id: v4(),
                                    x: this.contentWidth / 3,
                                    y: 60,
                                    type: 'modelRect',
                                    description: '开始节点',
                                    label: '开始节点',
                                    nodeType: 'start',
                                    anchorPoints: [[0.5, 1]],
                                    stack: true,
                                    linkPoints: {
                                        bottom: true
                                    }
                                },
                                {
                                    id: v4(),
                                    x: this.contentWidth / 3,
                                    y: this.contentHeight - 60,
                                    type: 'modelRect',
                                    description: '结束节点',
                                    nodeType: 'end',
                                    label: '结束节点',
                                    anchorPoints: [[0.5, 0]],
                                    linkPoints: {
                                        top: true
                                    }
                                }
                            ],
                            edges: [],
                        }
                    }

                    this.init(this.data)

                }

            },


            /* g6 流程 处理*/

            /* 初始化 流程*/
            init(data) {
                if (this.graph) {
                    this.graph.changeData(data);
                    return;
                }
                const grid = new G6.Grid();
                const ToolBar = new G6.ToolBar({});
                this.graph = new G6.Graph({
                    container: 'mountNode', // 指定图画布的容器 id，与第 9 行的容器对应
                    plugins: [grid, ToolBar],
                    // fitCenter:true,
                    // 画布宽高
                    width: 2000,
                    height: this.contentHeight,
                    defaultNode: {
                        type: 'modelRect',
                        size: [200, 48],
                        stateIcon: {
                            show: true,
                            /* warning */
                            img: 'https://gw.alipayobjects.com/zos/basement_prod/c781088a-c635-452a-940c-0173663456d4.svg',
                            /* success */
                            // img: 'https://gw.alipayobjects.com/zos/basement_prod/300a2523-67e0-4cbf-9d4a-67c077b40395.svg',
                        },
                        // 其他配置
                    },
                    defaultEdge: {
                        stack: true,
                        style: {
                            stroke: '#628ec1',
                            lineWidth: 3,
                            endArrow: true,
                        }
                    },
                    enabledStack: true,
                    modes: {
                        // 支持的 behavior 'zoom-canvas'
                        default: ['drag-node', 'zoom-canvas'],
                        select: ['click-select', 'drag-node'],
                        edit: ['click-add-edge', 'click-select', 'drag-node',],
                        remove: ['click-remove'],
                    },
                    nodeStateStyles: {
                        // 鼠标 hover 上节点，即 hover 状态为 true 时的样式
                        hover: {
                            fill: 'lightsteelblue',
                        },
                        // 鼠标点击节点，即 click 状态为 true 时的样式
                        click: {
                            stroke: selectNodeStroke,
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
                            stroke: selectEdgeStroke,
                        },
                    },
                });
                this.graph.setMode('select');
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
                    const nodeItem = e.item; // 获取被点击的节点元素对象
                    this.openDrawer({...nodeItem.get('model'), currentType: 'node'});
                    this.graph.setItemState(nodeItem, 'click', true); // 设置当前节点的 click 状态为 true
                });

// 点击边
                this.graph.on('edge:click', e => {
                    // 先将所有当前是 click 状态的边置为非 click 状态
                    const clickEdges = this.graph.findAllByState('edge', 'click');
                    clickEdges.forEach(ce => {
                        this.graph.setItemState(ce, 'click', false);
                    });
                    const edgeItem = e.item; // 获取被点击的边元素对象
                    console.log('edgeItem.get(\'model\')', edgeItem.get('model'))
                    this.openDrawer({...edgeItem.get('model'), currentType: 'edge'});
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
                this.graph.data(data);
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

            /* 切换流程 编辑模式 */
            handleModelChange(val) {
                this.model = val;
                this.graph.setMode(val);
            },
            /* 生成节点 */
            dropAddNode(event) {
                /* 坐标转换 */
                const {x, y} = this.graph.getPointByClient(event.x, event.y);
                let model = {
                    id: v4(),
                    x,
                    y,
                    type: 'modelRect',
                    description: '人工活动',
                    label: '人工活动',
                    anchorPoints: [[0.5, 0], [0.5, 1]],
                    linkPoints: {
                        bottom: true,
                        top: true
                    },
                    isSendMessage:false,
                    isSendShortMessage:false,
                    isAllowCounterSig:false,
                    isAllowChangeSig:false,
                    isAllowPointSig:false,
                    preemptType:'preempt',
                    countersignValue:100,
                    rejectType:'stop',
                    mergeType:'or',
                    branchType:'or',
                    overdueDays:7,
                    overdueNoticeDays:1,
                    owners:[],

                };

                switch (this.dragDomType) {
                    case 'virtual':
                        model = {
                            ...model,
                            nodeType: this.dragDomType,
                            type: 'rect',
                            description: '虚拟活动',
                            label: '虚拟活动',
                            anchorPoints: [[0.5, 0], [0.5, 1]],
                            linkPoints: {
                                bottom: true,
                                top: true
                            }
                        };
                        break;
                    case 'common':
                        model = {
                            ...model,
                            nodeType: this.dragDomType,
                            type: 'modelRect',
                            description: '人工活动',
                            label: '人工活动',
                            anchorPoints: [[0.5, 0], [0.5, 1], [1, 0.5], [0, 0.5]],
                            linkPoints: {
                                bottom: true,
                                top: true,
                                right: true,
                                left: true
                            }

                        };
                        break;
                    default:
                        model.nodeType = this.dragDomType;
                        break;
                }

                /* 判断 是否存在 提交节点 */
                const submitNode = this.graph.find('node', (node) => {
                    return node.get('model').nodeType === 'submit';
                });
                if (this.dragDomType === 'common' && !submitNode) {
                    model.description = '人工活动-提交';
                    model.label = '人工活动-提交';
                    model.nodeType = 'submit';
                    const {_cfg: startNode} = this.graph.find('node', (node) => {
                        return node.get('model').nodeType === 'start';
                    });
                    this.graph.addItem("node", model, true);
                    this.addEdges(startNode.id, model.id)
                } else {
                    this.graph.addItem("node", model, true);
                }

                this.data.nodes.push(model);

            },

            /* 生成连线 */
            addEdges(source, target) {
                let model = {
                    source,
                    target,
                };
                if(source === target){
                    return
                }
                this.graph.addItem("edge", model, true);
                this.data.edges.push(model)
            },

            /*删除 节点 线*/
            async remove(type, model) {

                if (model.nodeType === 'start') {
                    this.$message.error('开始节点无法删除！');
                    return
                }
                if (model.nodeType === 'end') {
                    this.$message.error('结束节点无法删除！');
                    return
                }
                this.$confirm({
                    title: '节点删除',
                    content: `是否删除${type === 'edge' ? '连线' : '节点及相关连线'}${model.label},删除后无法恢复?`,
                    onOk: () => {
                        const item = this.graph.findById(model.id);
                        if (type === 'node') {
                            let edges = [];
                            this.graph.find('edge', (edge) => {
                                if (edge.get('model').source === model.id || edge.get('model').target === model.id)
                                    edges.push(edge.get('model').id);
                                return edge.get('model').source === model.id
                            });
                            edges.forEach(row => {
                                this.graph.removeItem(row, true);
                            })
                        }
                        this.graph.removeItem(item, true);

                    },
                })
            },

            /* 注册处理事件*/
            registerBehavior() {
                const that = this;
                /* 连接节点 */
                G6.registerBehavior('click-add-edge', {
                    // Set the events and the corresponding responsing function for this behavior
                    addingEdge: false,
                    edge: null,
                    judgeNodesConnect(source, target) {
                        const {nodeType: sourceNodeType,id:sourceId} = this.graph.findById(source).get('model');
                        const {nodeType: targetNodeType,id:targetId} = this.graph.findById(target).get('model');
                        if(sourceId === targetId){
                           return false
                        }
                        const notAllowConnect = [
                            ['common', 'end', '请连接虚拟活动节点以结束流程。'],
                            ['start', 'virtual', '起始节点只能与人工活动-提交相连。'],
                            ['start', 'end', '起始节点只能与人工活动-提交相连。'],
                            ['start', 'common', '起始节点只能与人工活动-提交相连。'],
                        ];
                        let notAllow = notAllowConnect.filter(item => item[0] === sourceNodeType && item[1] === targetNodeType);
                        if (notAllow[0]) {
                            that.$message.error(notAllow[0][2])
                        }
                        return notAllow.length <= 0;
                    },
                    defaultEdgeParams(source, target) {
                        const {nodeType: sourceNodeType} = this.graph.findById(source).get('model');
                        const {nodeType: targetNodeType} = this.graph.findById(target).get('model');
                        let defaut = {
                            condType: 'cond',
                            filter: [],
                        };
                        /* 连接开始节点 与 结束节点的 连线无条件 */
                        if (sourceNodeType === 'start' || targetNodeType === 'end') {
                            defaut.condType = 'null';
                            defaut.label = sourceNodeType === 'start' ? '流程开始' : '流程结束'
                        }
                        return defaut
                    },
                    getEvents() {
                        return {
                            'node:click': 'onClick', // The event is canvas:click, the responsing function is onClick
                            mousemove: 'onMousemove', // The event is mousemove, the responsing function is onMousemove
                            'edge:click': 'onEdgeClick', // The event is edge:click, the responsing function is onEdgeClick
                        };
                    },
                    // The responsing function for node:click defined in getEvents
                    onClick(ev) {
                        const node = ev.item;
                        const graph = this.graph;
                        // The position where the mouse clicks

                        const model = node.getModel();
                        if (this.addingEdge && this.edge) {
                            let message = ``;
                            /* 判断 两节点间 是否存在 连线*/
                            const toEdge = this.graph.find('edge', (edge) => {
                                return edge.get('model').source === this.edge.get('model').source && edge.get('model').target === model.id;
                            });
                            if (toEdge) {
                                message += `两节点间不允许出现两条同向连线`
                            }
                            /* 判断两节点是否能连接 */
                            const allowConnect = this.judgeNodesConnect(this.edge.get('model').source, model.id);

                            /* 当连接节点为结束节点时 不允许 来源节点拥有其余子节点 */
                            if (model.nodeType === 'end') {
                                const targetEdge = this.graph.find('edge', (edge) => {
                                    return edge.get('model').source === this.edge.get('model').source && edge.get('model').id !== this.edge.get('model').id;
                                });

                                if (targetEdge) {
                                    message += `最后一个节点不允许存在除结束节点外的转出`
                                }
                            }
                            if (message) {
                                that.$message.error(message);
                                this.graph.removeItem(this.edge);
                            } else if (allowConnect) {
                                const twoWay = this.graph.find('edge', (edge) => {
                                    return edge.get('model').source === model.id && edge.get('model').target === this.edge.get('model').source;
                                });
                                if (twoWay) {
                                    graph.updateItem(this.edge, {
                                        ...this.defaultEdgeParams(this.edge.get('model').source, model.id),
                                        type: 'arc',
                                        curveOffset: 20,
                                        target: model.id,
                                    });
                                } else {
                                    graph.updateItem(this.edge, {
                                        ...this.defaultEdgeParams(this.edge.get('model').source, model.id),
                                        target: model.id,
                                    });
                                }
                            } else {
                                this.graph.removeItem(this.edge);
                            }
                            this.edge = null;
                            this.addingEdge = false;
                        } else {
                            // Add anew edge, the end node is the current node user clicks
                            this.edge = graph.addItem('edge', {
                                id: v4(),
                                source: model.id,
                                target: model.id,
                            });
                            this.addingEdge = true;
                        }
                    },
                    // The responsing function for mousemove defined in getEvents
                    onMousemove(ev) {
                        // The current position the mouse clicks
                        const point = {x: ev.x, y: ev.y};
                        if (this.addingEdge && this.edge) {
                            // Update the end node to the current node the mouse clicks
                            this.graph.updateItem(this.edge, {
                                target: point,
                            });
                        }
                    },
                    // The responsing function for edge:click defined in getEvents
                    onEdgeClick(ev) {
                        const currentEdge = ev.item;
                        if (this.addingEdge && this.edge === currentEdge) {
                            this.graph.removeItem(this.edge);
                            this.edge = null;
                            this.addingEdge = false;
                        }
                    },
                });
                /* 删除 节点 线 */
                G6.registerBehavior('click-remove', {
                    // Set the events and the corresponding responsing function for this behavior
                    addingEdge: false,
                    edge: null,
                    getEvents() {
                        return {
                            'node:click': 'onClick', // The event is canvas:click, the responsing function is onClick
                            'edge:click': 'onEdgeClick', // The event is edge:click, the responsing function is onEdgeClick
                        };
                    },
                    // The responsing function for node:click defined in getEvents
                    onClick(ev) {
                        const node = ev.item;
                        const model = node.getModel();
                        that.remove('node', model)
                    },
                    // The responsing function for edge:click defined in getEvents
                    onEdgeClick(ev) {
                        const currentEdge = ev.item;
                        const model = currentEdge.getModel();
                        that.remove('edge', model)
                    },
                });

            },


            /* 数据 保存*/

            async publish() {
                function updateVersion(version, index) {
                    const array = version.split('.');

                    index = index || index === 0 ? index : array.length - 1;
                    if (!isNaN(Number(array[index]))) {
                        array[index] = Number(array[index]) + 1
                    } else {
                        array[index] = array[index] + 1
                    }
                    return array.join('.')
                }

                const workflow = await this.$http.get('/v1/workflow/design/state/', {params: {idWorkflow: this.uid}}).then(res => res.data.record);
                if (workflow.state === 'in') {
                    this.$message.info('该流程模板存在单据流转，请修改版本号后另存');
                    let version = workflow.version ? updateVersion(workflow.version) : '1.0.0';
                    this.saveForm.model = {
                        ...workflow,
                        version
                    };
                    this.saveForm.visible = true;
                } else {
                    this.saveData()
                }


            },

            /* 数据 保存  另存*/
            async saveData(record) {
                let {nodes, edges: res} = this.graph.save();
                const edges = JSON.parse(JSON.stringify(res));
                let virtual = true;
                nodes.forEach(node=>{
                    if(node.nodeType === 'common' &&(!node.owners || node.owners.length <1)){
                        this.$message.error(`节点${node.label}未设置审核人员，请检查。`);
                        virtual = false
                    }
                    if(node.rejectType === 'next' && edges.filter(el=>el.source === node.id && el.resultType ==='NO').length === 0){
                        this.$message.error(`节点${node.label}未设置驳回提交节点，请检查。`);
                        virtual = false
                    }
                });

                if(virtual){
                    if (record) {
                        // owners
                        await this.$http.post('/v1/workflow/design/save/', {nodes, edges, record});
                        this.$emit('input', 'list')
                    } else {
                        await this.$http.post('/v1/workflow/design/members/', {nodes, edges, idWorkflow: this.uid});
                        this.loadData()
                    }
                }
            },

            resetForm() {
                this.$refs.form.resetFields();
                this.saveForm.visible = false;
            },

            /* 侧边栏 函数*/
            onClose() {
                /* 更新数据 */
                let node = this.graph.findById(this.form.data.id);
                this.graph.updateItem(node, this.form.data, false);
                this.form.visible = false;
                this.graph.findAllByState('edge', 'click').forEach(cn => {
                    this.graph.setItemState(cn, 'click', false);
                });
                this.graph.findAllByState('node', 'click').forEach(cn => {
                    this.graph.setItemState(cn, 'click', false);
                });
                // this.saveData();
            },
            openDrawer(model) {
                if (this.model === 'select' && !['start', 'end'].includes(model.nodeType)) {
                    this.form.data = model;
                    if (!this.form.data.filter || !this.form.data.filter[0] || !this.form.data.filter[0]) {
                        this.form.data.filter = [[{key: '', symbol: '$eq', value: ''}]]
                    }
                    console.log('this.form.data',this.form.data);
                    this.form.visible = true;
                }
            }


        }
    }
</script>

<style scoped>
    .grid-select {
        position: relative;
        z-index: 1;
        background: #fff;
        border-radius: #d9d9d9;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);;
    }

    .grid {
        position: relative;
        z-index: 1;
        background: #f3f3f3;
        border-radius: #d9d9d9;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);;
    }
</style>

<style>
    .g6-component-toolbar {
        left: 100px;
    }

    /*.g6-component-contextmenu {*/
    /*    display: none;*/
    /*}*/
</style>
