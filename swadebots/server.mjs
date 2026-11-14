import { createApp } from './src/app.mjs'

const app = await createApp()
console.log(`SWADEBOTS listening on ${app.url} enabled=${app.config.enabled}`)
