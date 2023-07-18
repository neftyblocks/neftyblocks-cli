import { readFileSync, writeFileSync, unlinkSync, existsSync} from 'fs';
import { join } from 'path';

const neftyConfFileName = 'nefty-keystore'

export = {

    writeFile(path:string, data:string, fileName?:string) {
        fileName = fileName != null ? fileName : neftyConfFileName
        writeFileSync(join(path, fileName), data, {
            flag: 'w',
        });
    },

    readFile(path:string, fileName?:string): string{
        fileName = fileName != null ? fileName : neftyConfFileName
        const contents = readFileSync(join(path, fileName), 'utf-8');
        return contents
    }, 

    removeConfiFile(path:string, fileName?:string) {
        fileName = fileName != null ? fileName : neftyConfFileName
        unlinkSync(join(path, fileName))
    }, 

    configFileExists(path:string, fileName?: string): boolean{
        fileName = fileName != null ? fileName : neftyConfFileName
        return existsSync(join(path, fileName))
    }


}