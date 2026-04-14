import { DefaultTheme } from 'vitepress'
export const sidebarConfigZh: DefaultTheme.Sidebar = {
  '/zh-CN/': [
    {
      text: '指南',
      collapsed: false,
      base: '/zh-CN/guide/',
      items: [
        {
          text: '简介',
          link: 'introduction'
        },
        {
          text: '安装',
          link: 'installation'
        },
        {
          text: '快速开始',
          link: 'quick-start'
        },
        {
          text: '配置与插件',
          link: 'config'
        },
        {
          text: '全局组件事件',
          link: 'com-events'
        },
        {
          text: 'Breaking Changes',
          link: 'breaking-changes'
        },
        {
          text: 'FAQ',
          link: 'faq'
        }
      ]
    },
    {
      text: '基础组件',
      collapsed: false,
      items: [
        {
          text: 'BMap 地图',
          link: '/zh-CN/components/webrtc'
        }
      ]
    },
    {
      text: 'Hooks',
      collapsed: false,
      base: '/zh-CN/hooks/',
      items: [
        {
          text: 'usePoint 地图实例点',
          link: 'usePoint'
        },
      ]
    },
    {
      text: '扩展',
      collapsed: false,
      base: '/zh-CN/expand/',
      items: [
        {
          text: '离线地图',
          link: 'offline-map'
        },
        {
          text: 'mapv 可视化',
          link: 'mapv'
        },
        {
          text: 'bmap-draw 鼠标测量与绘制',
          link: 'bmap-draw'
        }
      ]
    }
  ]
}
