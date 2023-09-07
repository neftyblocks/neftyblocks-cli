import fetch from "node-fetch";


export async function validateRpcUrl(rpcUrl: string): Promise<boolean>{
    const rpc = rpcUrl + '/v1/chain/get_info'
    try{
        const response = await fetch(rpc, {
            method: 'GET',
        });
        return response.ok
    }catch (error) {
        console.log('Invalid URL, please enter a valid URL as https://wax.neftyblocks.com')
    }
    return false
}

export async function validateBloksUrl(bloksUrl: string): Promise<boolean>{
    try{
        const response = await fetch(bloksUrl, {
            method: 'GET',
        });
        return response.ok
    }catch (error) {
        console.log('Invalid URL, please enter a valid URL as https://waxblock.io')
    }
    return false
}

export async function validateAtomicUrl(atomicUrl: string): Promise<boolean>{
    let aa = atomicUrl + '/health'
    try{
        const response = await fetch(aa, {
            method: 'GET',
        });
        return response.ok
    }catch (error) {
        console.log('Invalid URL, please enter a valid URL as https://aa.neftyblocks.com')
    }
    return false
}

