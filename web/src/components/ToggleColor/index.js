import Vue from 'vue'
import client from 'webpack-theme-color-replacer/client'
import {generate} from '@ant-design/colors'
import ToggleColor from './ToggleColor'


const getAntdSerials = (color) => {
    // 淡化（即less的tint）
    const lightens = new Array(9).fill().map((t, i) => {
        return client.varyColor.lighten(color, i / 10)
    })
    // colorPalette变换得到颜色值
    const colorPalettes = generate(color)
    const rgb = client.varyColor.toNum3(color.replace('#', '')).join(',')
    return lightens.concat(colorPalettes).concat(rgb)
}

const changeColor = (newColor) => {
    var options = {
        newColors: getAntdSerials(newColor), // new colors array, one-to-one corresponde with `matchColors`
        changeUrl(cssUrl) {
            return `/${cssUrl}` // while router is not `hash` mode, it needs absolute path
        }
    }
    return client.changer.changeColor(options, Promise)
}

const updateTheme = newPrimaryColor => {
    const hideMessage = Vue.prototype.$message.loading('正在切换主题！', 0)
    changeColor(newPrimaryColor).finally(() => {
        setTimeout(() => {
            hideMessage()
        }, 10)
    })
}

const updateColorWeak = colorWeak => {
    colorWeak ? document.body.classList.add('colorWeak') : document.body.classList.remove('colorWeak')
}

export {updateTheme, updateColorWeak,ToggleColor}
