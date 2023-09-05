import {readFileSync, writeFileSync, unlink, existsSync, mkdirSync} from 'node:fs'
import {join} from 'node:path'

const neftyConfFileName = 'nefty-keystore'

export = {

  writeFile(path:string, data:string, fileName?:string) {
    fileName = fileName ? fileName : neftyConfFileName
    writeFileSync(join(path, fileName), data, {
      flag: 'w',
    })
  },

  readFile(path:string, fileName?:string): string {
    fileName = fileName ? fileName : neftyConfFileName
    const contents = readFileSync(join(path, fileName), 'utf-8')
    return contents
  },

  removeConfiFile(path:string, fileName?:string) {
    fileName = fileName  ? fileName : neftyConfFileName
    unlink(join(path, fileName), function (err) {
      if (err) {
        console.log('Configuration file did not exist')
        console.log(err?.message)
      }
    })
  },

  fileExists(path:string): boolean {
    return existsSync(path)
  },

  configFileExists(path:string, fileName?: string): boolean {
    if (!existsSync(path)) {
      mkdirSync(path, {recursive: true})
      return false
    }

    fileName = fileName ? fileName : neftyConfFileName
    return existsSync(join(path, fileName))
  },

}
