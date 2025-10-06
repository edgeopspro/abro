function log(msg, obj) {
  console.log(`[Abro:${new Date().toUTCString()}] ${msg} ${obj ? JSON.stringify(obj, null, 2) : ''}`)
}

function parse(req) {
  return {
    id: req.id,
    metod: req.method(),
    url: req.url(),
    headers: req.headers(),
    body: req.postData() || null
  }
}

function ts() {
  return new Date().getTime()
}

const reg = {}

page.on('frameattached', event => log(`${event._id} init`))
page.on('framedetached', async (event) => log(`${event._id} bye bye ${await event.url()}`))
page.on('framenavigated', frame => log(`${frame._id} changed url ${frame.url()}`))
page.on('pageerror', error => log('PAGE ERROR', error))
page.on('error', error => log('TOP-LEVEL ERROR', error))

page.on('request', req => {
  const data = parse(req)
  reg[data.id] = ts()
  log(page.mainFrame()._id, data)
  req.continue()
})

page.on('response', async res => {
  let payload = null
  const req = parse(res.request())
  
  try {
    payload = await res.text()
  } catch {
    // skip
  }

  const [ start, stop ] = [ reg[req.id], ts() ]
  const data = {
    req: req,
    res: {
      body: payload,
      headers: res.headers(),
      status: res.status()
    },
    time: {
      start,
      stop,
      value: stop - start
    }
  }

  delete reg[req.id]

  log(page.mainFrame()._id, data)
})