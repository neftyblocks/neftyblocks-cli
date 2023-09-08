import fetch from "node-fetch";

const chainId = 'f16b1833c747c43682f4386fca9cbb327929334a762755ebec17f6f23c9b8a12'


export async function validateRpcUrl(rpcUrl: string): Promise<boolean>{
    const rpc = rpcUrl + '/v1/chain/get_info'
    try{
        const response = await fetch(rpc, {
            method: 'GET',
            headers: {
                Accept: 'application/json',
            }
        });
        if(response.ok){
            const result = await response.json()
            return (result.chain_id === chainId)
        }
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
            headers: {
                Accept: 'application/json',
            }
        });
        if(response.ok){
            const result = await response.json()
            return (result.data.chain.status === 'OK')
        }
    }catch (error) {
        console.log('Invalid URL, please enter a valid URL as https://aa.neftyblocks.com')
    }
    return false
}

