const { copyFileSync, readdirSync, readFileSync } = require('node:fs')

const clone = [ 
  'config.json',
  'config.*.json',
  'ctrl.*.js'
]

const files = readdirSync('.')
const config = JSON.parse(readFileSync('package.json', { encoding: 'utf-8' }))
const target = config.pkg.outputPath

for (const file of files) {
  for (const pattern of clone) {
    if (file.match(RegExp(pattern.replaceAll('.', '\.').replaceAll('*', '.+')))) {
      console.log(`copying ${file} to ${target}`)
      copyFileSync(file, `${target}/${file}`)
    }
  }
}