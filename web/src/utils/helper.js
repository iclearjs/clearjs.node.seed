import axios from './axios'
import urlConfig from "../config/config.url"
import 'viewerjs/dist/viewer.css'
import Viewer from "viewerjs"

export function getQueryString(name) {
    let reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i');
    let r = window.location.search.substr(1).match(reg);
    if (r != null) {
        return unescape(r[2]);
    }
    return null;
}

/****
 * 树操作
 */

export function listToTree(data, pId, options) {
    options = options ? options : {};
    options.idKey = options.idKey ? options.idKey : '_id';
    options.pIdKey = options.pIdKey ? options.pIdKey : 'p_id';
    options.childKey = options.childKey ? options.childKey : 'children';
    let result = [];
    let temp = [];
    for (let i = 0; i < data.length; i++) {
        if (data[i][options.pIdKey] == pId) {
            let obj = data[i];
            if (options.replaceFields) {
                if (options.replaceFields.key) obj['key'] = data[i][options.replaceFields.key];
                if (options.replaceFields.value) obj['value'] = data[i][options.replaceFields.value];
                if (options.replaceFields.title) obj['title'] = data[i][options.replaceFields.title]
            }
            temp = listToTree(data, data[i][options.idKey], options);
            if (temp.length > 0) {
                obj[options.childKey] = temp;
            }
            result.push(obj);
        }
    }
    return result;
}

export function getTreeNode(treeData, value, options) {
    let node;
    options = options ? options : {};
    options.key = options.key ? options.key : 'key';
    options.childKey = options.childKey ? options.childKey : 'children';
    for (let data of treeData) {
        if (data[options.key] === value) {
            node = data
        }
        if (data[options.childKey]) {
            let result = getTreeNode(data[options.childKey], value, options);
            if (result) {
                node = result
            }
        }
    }
    return node;
}

export function getTreeParents(data, pid,options={}) {
    const findTreeParents = function(data, pid,options){
        let result = '';
        options.idKey = options.idKey ? options.idKey : '_id';
        options.pIdKey = options.pIdKey ? options.pIdKey : 'p_id';
        for (let i = 0; i < data.length; i++) {
            if (data[i][options.idKey] == pid) {
                if (data[i][options.pIdKey] != 0) {
                    result += (findTreeParents(data, data[i][options.pIdKey]),options);
                }
                if (data[i][options.pIdKey] == 0) {
                    result = data[i][options.idKey]
                } else {
                    result += ',' + data[i][options.idKey];
                }
            }
        }
        return result
    };
    const result = findTreeParents(data, pid,options);
    return result.split(',').filter(el=>el!== void(0));
}

export function model(name) {
    const url = '/api/model';
    return {
        get: async (params) => {
            return (await axios.get([url, name].join('/'), params)).data;
        },
        getByID: async (id, params) => {
            if (!id) {
                return {
                    error: {
                        code: '9999',
                        message: 'param id missing'
                    }
                }
            }
            return (await axios.get([url, name, id].join('/'), params)).data;
        },
        getByPost: async (params) => {
            return (await axios.post([url.replace(new RegExp('/api/model', "g"), '/api/getByPost'), name].join('/'), params)).data;
        },
        post: async (data) => {
            return (await axios.post([url, name].join('/'), data)).data;
        },
        patch: async (id, data) => {
            if (!id || (Array.isArray(id) && id.length === 0)) {
                return {
                    error: {
                        code: '9999',
                        message: 'param id missing'
                    }
                }
            }
            return (await axios.patch([url, name, id].join('/'), data)).data;
        },
        put: async (id, data) => {
            if (!id || (Array.isArray(id) && id.length === 0)) {
                return {
                    error: {
                        code: '9999',
                        message: 'param id missing'
                    }
                }
            }
            return (await axios.put([url, name, id].join('/'), data)).data;
        },
        delete: async (id) => {
            if (!id || (Array.isArray(id) && id.length === 0)) {
                return {
                    error: {
                        code: '9999',
                        message: 'param id missing'
                    }
                }
            }
            return (await axios.delete([url, name, id].join('/'))).data;
        }
    }
}

export async function getPageConfig(page) {
    if(!page) return {};
    const PageConfig = await this.model('cdp_page').get({
        params: {
            filter: /^[a-fA-F0-9]{24}$/.test(page)?{_id: page}: {code: page},
            populate: 'idEntityList,idEntityCard,idEnum'
        }
    }).then(res => res.records[0]);

    PageConfig.widgets = PageConfig._id ? await this.model('cdp_page_widget').get({params: {filter: {idPage: PageConfig._id},order:'order',populate: 'idEnum'}}).then(res => res.records) : []
    PageConfig.populate = [];
    for (let widget of PageConfig.widgets.filter(item => item.mode === 'listCard')) {
        if ('RadioRefer' === widget.widget) {
            const parent = PageConfig.widgets.filter(item => item._id === widget.p_id)[0];
            PageConfig.populate.push(parent.widget === 'Table' ? parent.field + '.' + widget.field : widget.field);
        } else if ('CheckboxRefer' === widget.widget) {
            const parent = PageConfig.widgets.filter(item => item._id === widget.p_id)[0];
            PageConfig.populate.push(parent.widget === 'Table' ? parent.field + '.' + widget.field + '.idObject' : widget.field + '.idObject');
        }
    }
    return new Promise(function (resolve, reject) {
        resolve(PageConfig);
    });
}

export async function getImageBase64(src) {
    let canvas = document.createElement("canvas");
    let image = new Image();
    image.setAttribute('crossOrigin', 'Anonymous');
    image.src = src;
    return new Promise(function (resolve, reject) {
        image.onerror = function () {
            reject({code: 401, message: '图片路径有误，无法解析图片，请检查！'});
        };
        image.onload = function () {
            let interval = setInterval(async () => {
                if (image.complete) {
                    canvas.setAttribute('width', image.width);
                    canvas.setAttribute('height', image.height);
                    canvas.getContext('2d').drawImage(image, 0, 0);
                    resolve(canvas.toDataURL('image/png'));
                    clearInterval(interval);
                }
            }, 100);
        };
    });
}

export async function readFileSync(file) {
    return new Promise(function (resolve, reject) {
        let reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onerror = function () {
            reject({code: 401, message: '文件路径有误，无法解析文件，请检查！'});
        };
        reader.onload = function (event) {
            resolve(event.target.result);
        };
    });
}
export async function showImage(idFiles) {
    let dom = document.querySelector("#app");
    if (document.querySelector("#viewer")) {
        document.querySelector("#viewer").remove()
    }
    let div = document.createElement('div');
    div.setAttribute('id', 'viewer');
    for(let idFile of idFiles){
        div.innerHTML = div.innerHTML+"<img src='" + urlConfig.file.preview+idFile + "' style='display: none'>";
    }
    dom.appendChild(div);
    const viewer = new Viewer(document.querySelector("#viewer"), {});
    viewer.show();
}
