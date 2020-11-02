import * as vscode from 'vscode'
import * as path from 'path'
import fetch from 'node-fetch'
import { getProcessor } from 'bytemd'
import frontmatter from '@bytemd/plugin-frontmatter'
import math from '@bytemd/plugin-math-ssr'
import highlight from '@bytemd/plugin-highlight-ssr'
import visit from 'unist-util-visit'
import { sendPv } from './utils'
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
            visit(tree, 'element', (node) => {
              try {
                if (node.tagName === 'a') {
                  const p = node.properties as any
                  const url = new URL(p.href)
                  if (url.host === 'juejin.im') {
                    url.searchParams.set('utm_source', 'vscode')
                  }
                  p.href = url.toString()
                }
              } catch (err) {
                console.error(err)
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
    const res = await fetch(
      'https://apinew.juejin.im/content_api/v1/article/detail',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ article_id: id }),
      }
    )
    const json = await res.json()

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

export class PostProvider implements vscode.TreeDataProvider<PostItem> {
  private ee = new vscode.EventEmitter<PostItem | void>()
  readonly onDidChangeTreeData = this.ee.event

  refresh() {
    this.ee.fire()
  }

  getTreeItem({
    item_info: { article_id, article_info },
  }: PostItem): vscode.TreeItem {
    return {
      label: article_info.title,
      tooltip: article_info.title,
      iconPath: vscode.ThemeIcon.File,
      description: article_info.digg_count.toString(),
      command: {
        command: 'juejin.post.open',
        title: '',
        arguments: [article_id, article_info.title],
      },
    }
  }

  async getChildren(element?: PostItem) {
    if (element) return []

    const res = await fetch(
      'https://apinew.juejin.im/recommend_api/v1/article/recommend_all_feed',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          cursor: '0',
          id_type: 2,
          sort_type: 300,
        }),
      }
    )
    const json = await res.json()
    return (json.data as PostItem[]).filter((v) => v.item_type === 2)
  }
}
