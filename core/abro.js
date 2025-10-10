const { readFile } = require('node:fs/promises')
const { launch } = require('puppeteer')

async function eventify(browser, ctx, page) {
  function invoke(event) {
    if (event instanceof Function) {
      event(ctx, page)
    }
  }

  const events = ctx.controller(ctx, page)

  if (events) {
    await invoke(events.start)

    browser.on('disconnected', async () => {
      if ((await browser.pages()).length === 0) {
        await invoke(events.stop)
      }
    })
  }
}

async function load(profile) {
  function read(path) {
    return readFile(path, { encoding: 'utf-8' })
  }

  if (profile) {
    try {
      const config = JSON.parse(await read(profile))

      if (config && config.controller) {
        const controller = await read(config.controller)

        return { 
          config,
          console,
          controller: new Function('ctx', 'page', controller),
          require
        }
      } else {
        console.error(`invalid config file`)
      }
    } catch (error){
      console.error(`profile loading error (${profile})`)
    }
  } else {
    console.error('no automation profile was selected (should be the path to a valid json file)')
  }

  return null
}

async function run(ctx) {
  const { config } = ctx

  if (!config.browser) {
    return console.error('config file must specify a "browser" section')
  }

  try {
    const browser = await launch(config.browser)
    const page = await browser.newPage()

    browser.on('targetcreated', async target => { 
      const page = await target.page()
  
      if (page) {
        await eventify(browser, ctx, page)
      }
    })

    await eventify(browser, ctx, page)
    await page.goto(config.homepage || 'about:blank')
  } catch (error) {
    console.warn(error)
  } finally {
    
  }
}

(async() => {
  const ctx = await load(process.argv[2])

  if (ctx) {
    await run(ctx)
  }
})()