import ua from 'universal-analytics'
import { machineIdSync } from 'node-machine-id'
import fetch, { HeadersInit } from 'node-fetch'

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
    path = 'https://apinew.juejin.im' + path
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
  })
}

export const sendPv = (path: string) => {
  if (process.env.NODE_ENV === 'production') {
    visitor.pageview(path).send()
  }
}
