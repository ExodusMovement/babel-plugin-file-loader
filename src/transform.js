const crypto = require('crypto')
const fs = require('fs-extra')
const path = require('path')
const mime = require('mime')

function hash (contents, maxLength) {
  maxLength = maxLength || 128

  const hasher = crypto.createHash('md5').update(contents)

  return hasher.digest('hex').substr(0, maxLength)
}

function transform (rootPath, filePath, opts) {
  let url = opts.name
  let ext = 'bin'
  let basename = 'file'
  let directory = ''
  const outputPath = opts.outputPath
  const publicPath = opts.publicPath.replace(/\/$/, '')
  const context =
    opts.context[0] === '/' ? opts.context.substr(1) : opts.context
  const limit = opts.limit
  const contextPath = path.resolve(rootPath, context)

  if (!fs.existsSync(filePath)) {
    throw new Error('File does not exist')
  }

  const parsed = path.parse(filePath)

  if (parsed.ext) {
    ext = parsed.ext.substr(1)
  }

  let basePath

  if (parsed.dir) {
    basename = parsed.name
    basePath = parsed.dir + path.sep
  }

  directory = path
    .relative(contextPath, basePath + '_')
    .replace(/\\/g, '/')
    .replace(/\.\.(\/)?/g, '_$1')
  directory = directory.substr(0, directory.length - 1)

  url = url
    .replace(/\[ext\]/gi, () => ext)
    .replace(/\[name\]/gi, () => basename)
    .replace(/\[path\]/gi, () => directory)

  const contents = fs.readFileSync(filePath)
  if (contents.length < limit) {
    const src = Buffer.from(contents)
    const mimetype = mime.getType(filePath) || ''
    return `data:${mimetype};base64,${src.toString('base64')}`
  }

  url = url.replace(/\[hash(?::(\d+))?\]/gi, (_, maxLength) =>
    hash(contents, parseInt(maxLength, 10))
  )

  if (outputPath !== null) {
    fs.copySync(filePath, path.join(rootPath, outputPath, url.split('?')[0]))
  }

  return publicPath + '/' + url
}

module.exports = transform
