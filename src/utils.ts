import vscode from 'vscode'
import ua from 'universal-analytics'
import { machineIdSync } from 'node-machine-id'
import fetch, { HeadersInit } from 'node-fetch'
import { URL } from 'url'

const visitor = ua('UA-161443856-5', machineIdSync(), {
  strictCidFormat: false,
})

export const myFetch = ({
  method,
  path,
  body,
}: {
  method?: 'GET' | 'POST'
  path: string
  body?: Record<string, any>
}) => {
  if (!path.startsWith('http')) {
    path = 'https://api.juejin.cn' + path
  }

  let headers = {} as HeadersInit
  if (method === 'POST') {
    headers = {
      'content-type': 'application/json',
    }
  }
  return fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  }).then((res) => res.json())
}

export const sendPv = (path: string) => {
  if (process.env.NODE_ENV === 'production') {
    visitor.pageview(path).send()
  }
}

export enum PayloadType {
  postCategory,
  post,
  pinCategory,
  pin,
}

export interface PostCategory {
  type: PayloadType.postCategory
  payload: {
    category_id: string
    category_name: string
  }
}

export interface Post {
  type: PayloadType.post
  payload: {
    article_id: string
    title: string
    digg_count: number
  }
}

export interface PinCategory {
  type: PayloadType.pinCategory
  payload: {
    topic_id: string
    title: string
  }
}

export interface Pin {
  type: PayloadType.pin
  payload: {
    msg_id: string
    content: string
    digg_count: number
  }
}

export type PayloadItem = Post | PostCategory | Pin | PinCategory

export function openExternal(path: string) {
  const url = new URL('https://juejin.cn' + path)
  url.searchParams.append('utm_source', 'vscode')
  vscode.env.openExternal(vscode.Uri.parse(url.toString()))
}
