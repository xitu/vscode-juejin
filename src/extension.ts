// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import vscode from 'vscode'
import { PostProvider, createPostHandler, openExternal } from './post'

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const postProvider = new PostProvider()

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('juejin.post', postProvider),
    // vscode.window.registerTreeDataProvider('pin', new PostProvider()),
    vscode.commands.registerCommand('juejin.post.refresh', () =>
      postProvider.refresh()
    ),
    vscode.commands.registerCommand(
      'juejin.post.open',
      createPostHandler(context)
    ),
    vscode.commands.registerCommand('juejin.post.open-external', openExternal)
  )
}

// this method is called when your extension is deactivated
export function deactivate() {}
