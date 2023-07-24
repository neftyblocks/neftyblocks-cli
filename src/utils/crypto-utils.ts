import crypto from 'crypto';
import fileUtils from './file-utils';
import CliConfig from '../types/cli-config'



const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH: number = 16; // For AES, this is always 16
const neftyPadding = Buffer.from("neftyblocks-cli padding").toString("base64") 

export = {

    encrypt(text: string, encryptionKey: string): string {
        const key = this.paddingPassword(encryptionKey) //must be 32
        let iv = Buffer.from(crypto.randomBytes(IV_LENGTH)).toString('hex').slice(0, IV_LENGTH)
        let cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(key), iv)
        let encrypted = cipher.update(text)
        encrypted = Buffer.concat([encrypted, cipher.final()])
        return iv + ':' + encrypted.toString('hex')
    },

    decrypt(text: string, encryptionKey: string) {
        try{
            const key = this.paddingPassword(encryptionKey)
            let textParts: string[] = text.includes(':') ? text.split(':') : []
            let iv = Buffer.from(textParts.shift() || '', 'binary')
            let encryptedText = Buffer.from(textParts.join(':'), 'hex')
            let decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(key), iv)
            let decrypted = decipher.update(encryptedText)
            decrypted = Buffer.concat([decrypted, decipher.final()])
            return decrypted.toString()
        }catch(error){
            return undefined
        }
    }, 

    paddingPassword(text:string): string{
        let key = text
        if(key.length < 32){
            key = key + (neftyPadding.substring(0, 32 - key.length))
        }
        return key
    }, 

    decryptConfigurationFile(password:string, configPath:string){
        const contents = fileUtils.readFile(configPath)
        const decrypted = this.decrypt(contents, password)
        if(decrypted == null){
            return null
        }
        const jsonObject = JSON.parse(decrypted) as CliConfig
        return jsonObject 
    }



}