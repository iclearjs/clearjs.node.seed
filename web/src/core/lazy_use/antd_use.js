/* eslint-disable */
/**
 * 该文件是为了按需加载，剔除掉了一些不需要的框架组件。
 * 减少了编译支持库包大小
 *
 * 当需要更多组件依赖时，在该文件加入即可
 */
import Vue from 'vue';
import {
    ConfigProvider,
    Layout,
    Input,
    InputNumber,
    Button,
    Switch,
    Radio,
    Checkbox,
    Select,
    Card,
    Form,
    FormModel,
    Row,
    Col,
    Modal,
    Table,
    Tabs,
    Icon,
    Badge,
    Popover,
    Dropdown,
    List,
    Avatar,
    Breadcrumb,
    Steps,
    Spin,
    Menu,
    Drawer,
    Tooltip,
    Alert,
    Tag,
    Divider,
    DatePicker,
    TimePicker,
    Upload,
    Progress,
    Skeleton,
    Popconfirm,
    Cascader,
    TreeSelect,
    Tree,
    Space,
    message,
    notification,
    Pagination,
    Collapse,
    Empty,
    Descriptions,
    Comment,
    Timeline,
    Calendar,
    PageHeader,
    Result

} from 'ant-design-vue'

Vue.use(ConfigProvider);
Vue.use(Layout);
Vue.use(Input);
Vue.use(InputNumber);
Vue.use(Button);
Vue.use(Switch);
Vue.use(Radio);
Vue.use(Checkbox);
Vue.use(Select);
Vue.use(Card);
Vue.use(Form);
Vue.use(FormModel);
Vue.use(Row);
Vue.use(Col);
Vue.use(Modal);
Vue.use(Table);
Vue.use(Tabs);
Vue.use(Icon);
Vue.use(Badge);
Vue.use(Popover);
Vue.use(Dropdown);
Vue.use(List);
Vue.use(Avatar);
Vue.use(Breadcrumb);
Vue.use(Steps);
Vue.use(Spin);
Vue.use(Menu);
Vue.use(Drawer);
Vue.use(Tooltip);
Vue.use(Alert);
Vue.use(Tag);
Vue.use(Divider);
Vue.use(DatePicker);
Vue.use(TimePicker);
Vue.use(Upload);
Vue.use(Progress);
Vue.use(Skeleton);
Vue.use(Popconfirm);
Vue.use(Cascader);
Vue.use(TreeSelect);
Vue.use(Space);
Vue.use(Tree);
Vue.use(Pagination);
Vue.use(Collapse);
Vue.use(Empty);
Vue.use(Descriptions);
Vue.use(Comment);
Vue.use(Timeline);
Vue.use(Calendar);
Vue.use(PageHeader);
Vue.use(Result);

Vue.prototype.$message = message
Vue.prototype.$confirm = Modal.confirm
Vue.prototype.$info = Modal.info
Vue.prototype.$success = Modal.success
Vue.prototype.$error = Modal.error
Vue.prototype.$warning = Modal.warning
Vue.prototype.$notification = notification

const CIcon = Icon.createFromIconfontCN({
    scriptUrl: 'https://at.alicdn.com/t/font_950760_30p8pd1te0k.js', // 在 iconfont.cn 上生成
});

Vue.component('c-icon',CIcon)



