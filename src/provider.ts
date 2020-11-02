import * as vscode from 'vscode'
import { myFetch, PayloadItem, PayloadType } from './utils'

export class DataProvider implements vscode.TreeDataProvider<PayloadItem> {
  private type: PayloadType

  constructor(type: PayloadType) {
    this.type = type
  }

  private ee = new vscode.EventEmitter<PayloadItem | void>()
  readonly onDidChangeTreeData = this.ee.event

  refresh() {
    this.ee.fire()
  }

  getTreeItem(p: PayloadItem): vscode.TreeItem {
    switch (p.type) {
      case PayloadType.postCategory:
        return {
          label: p.payload.category_name,
          tooltip: p.payload.category_name,
          collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
        }
      case PayloadType.pinCategory:
        return {
          label: p.payload.title,
          tooltip: p.payload.title,
          collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
        }
      case PayloadType.post:
        return {
          label: p.payload.title,
          tooltip: p.payload.title,
          iconPath: vscode.ThemeIcon.File,
          description: p.payload.digg_count.toString(),
          command: {
            command: 'juejin.post.open',
            title: '',
            arguments: [p.payload.article_id, p.payload.title],
          },
        }
      case PayloadType.pin:
        return {
          label: p.payload.content,
          tooltip: p.payload.content,
          iconPath: vscode.ThemeIcon.File,
          description: p.payload.digg_count.toString(),
          command: {
            command: 'juejin.pin.open',
            title: '',
            arguments: [p.payload.msg_id, p.payload.content],
          },
        }
      default:
        return {}
    }
  }

  async getChildren(element?: PayloadItem) {
    if (element) {
      switch (element.type) {
        case PayloadType.postCategory: {
          const json = await myFetch({
            method: 'POST',
            path: '/recommend_api/v1/article/recommend_cate_feed',
            body: {
              cursor: '0',
              cate_id: element.payload.category_id,
              id_type: 2,
              sort_type: 300,
            },
          })
          return (json.data as any[]).map((v) => {
            return {
              type: PayloadType.post,
              payload: v.article_info,
            }
          })
        }
        case PayloadType.pinCategory: {
          const json = await myFetch({
            method: 'POST',
            path: '/recommend_api/v1/short_msg/topic',
            body: {
              cursor: '0',
              topic_id: element.payload.topic_id,
              id_type: 4,
              sort_type: 200,
              limit: 20,
            },
          })
          return (json.data as any[]).map((v) => {
            return {
              type: PayloadType.pin,
              payload: v.msg_Info,
            }
          })
        }
        default:
          return []
      }
    } else {
      switch (this.type) {
        case PayloadType.post: {
          const json = await myFetch({
            path: '/tag_api/v1/query_category_briefs',
          })
          return (json.data as any[]).map((v) => {
            return {
              type: PayloadType.postCategory,
              payload: v,
            }
          })
        }
        case PayloadType.pin: {
          const json = await myFetch({
            path: '/recommend_api/v1/tag/recommend_topic_list',
            method: 'POST',
            body: { id_type: 11, limit: 7 },
          })
          return (json.data as any[]).map((v) => {
            return {
              type: PayloadType.pinCategory,
              payload: v,
            }
          })
        }
      }
    }
  }
}
