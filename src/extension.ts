// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import vscode from 'vscode'
import { createPostHandler } from './post'
import { DataProvider } from './provider'
import { PayloadType, Post, openExternal } from './utils'

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const postProvider = new DataProvider(PayloadType.post)
  const pinProvider = new DataProvider(PayloadType.pin)

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('juejin.post', postProvider),
    vscode.window.registerTreeDataProvider('juejin.pin', pinProvider),
    vscode.commands.registerCommand('juejin.post.refresh', () => {
      postProvider.refresh()
    }),
    vscode.commands.registerCommand('juejin.pin.refresh', () => {
      pinProvider.refresh()
    }),
    vscode.commands.registerCommand(
      'juejin.post.open',
      createPostHandler(context)
    ),
    vscode.commands.registerCommand('juejin.post.opent-external', (v: Post) => {
      openExternal('/post/' + v.payload.article_id)
    })
  )
}

// this method is called when your extension is deactivated
export function deactivate() {}
