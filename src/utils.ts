import ua from 'universal-analytics'
import { machineIdSync } from 'node-machine-id'

const visitor = ua('UA-161443856-5', machineIdSync(), {
  strictCidFormat: false,
})

export const sendPv = (path: string) => {
  if (process.env.NODE_ENV === 'production') {
    visitor.pageview(path).send()
  }
}
