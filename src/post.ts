import type { Element } from 'hast'
import * as vscode from 'vscode'
import * as path from 'path'
import { getProcessor } from 'bytemd'
import frontmatter from '@bytemd/plugin-frontmatter'
import math from '@bytemd/plugin-math-ssr'
import highlight from '@bytemd/plugin-highlight-ssr'
import visit from 'unist-util-visit'
import { myFetch, PayloadItem, sendPv, PayloadType } from './utils'
import { URL } from 'url'

const processor = getProcessor({
  plugins: [
    frontmatter(),
    math(),
    highlight(),
    {
      rehype: (p) =>
        p.use(() => {
          return (tree) => {
            visit<Element>(tree, 'element', (node) => {
              if (node.tagName === 'img') {
                const p = node.properties
                if (typeof p?.src === 'string' && p.src.startsWith('//')) {
                  p.src = 'https:' + p.src
                }
              }

              if (node.tagName === 'a') {
                const p = node.properties

                try {
                  if (typeof p?.href === 'string') {
                    const url = new URL(p.href)
                    if (url.host === 'juejin.im') {
                      url.searchParams.set('utm_source', 'vscode')
                    }
                    p.href = url.toString()
                  }
                } catch (err) {
                  console.error(err)
                }
              }
            })
          }
        }),
    },
  ],
})

export interface PostItem {
  item_type: number
  item_info: {
    article_id: string
    article_info: {
      title: string
      digg_count: number
    }
  }
}

export function openExternal(item: PostItem) {
  vscode.env.openExternal(
    vscode.Uri.parse(
      'https://juejin.im/post/' +
        item.item_info.article_id +
        '?utm_source=vscode'
    )
  )
}

export function createPostHandler(context: vscode.ExtensionContext) {
  return async (id: string, title: string) => {
    sendPv(`/post/${id}`)

    const panel = vscode.window.createWebviewPanel(
      id, // Identifies the type of the webview. Used internally
      title, // Title of the panel displayed to the user
      vscode.ViewColumn.One, // Editor column to show the new webview panel in.
      {} // Webview options. More on these later.
    )
    const json = await myFetch({
      path: '/content_api/v1/article/detail',
      method: 'POST',
      body: { article_id: id },
    })
    const getStyleSrc = (name: string) => {
      const href = panel.webview
        .asWebviewUri(
          vscode.Uri.file(
            path.join(context.extensionPath, `assets/${name}.css`)
          )
        )
        .toString()
      return `<link rel="stylesheet" href="${href}">`
    }

    const result = await processor.process(json.data.article_info.mark_content)
    const html = result.toString()

    panel.webview.html = `<head>
    ${getStyleSrc('highlight')}
    ${getStyleSrc('markdown')}
    ${getStyleSrc('app')}
    </head>${html}`
  }
}

export class PostProvider implements vscode.TreeDataProvider<PayloadItem> {
  private ee = new vscode.EventEmitter<PayloadItem | void>()
  readonly onDidChangeTreeData = this.ee.event

  refresh() {
    this.ee.fire()
  }

  getTreeItem(p: PayloadItem): vscode.TreeItem {
    switch (p.type) {
      case PayloadType.category:
        return {
          label: p.payload.category_name,
          tooltip: p.payload.category_name,
          collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
        }
      case PayloadType.article:
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
      default:
        return {}
    }
  }

  async getChildren(element?: PayloadItem) {
    if (element) {
      if (element.type === PayloadType.category) {
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
            type: PayloadType.article,
            payload: v.article_info,
          }
        })
      } else {
        return []
      }
    } else {
      const json = await myFetch({
        path: '/tag_api/v1/query_category_briefs',
      })
      return (json.data as any[]).map((v) => {
        return {
          type: PayloadType.category,
          payload: v,
        }
      })
    }
  }
}
