import fetch from "node-fetch";

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
            return (!!result.chain_id)
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


export function validateAccountName(account: string): boolean {
    let regex = new RegExp('^[a-z1-5\.]{0,12}$')
    let match = regex.test(account)
    let lastChar = account.at(-1)
    if(lastChar === '.' || !match){
        console.log('- Account name can contain letters "a-z" and numbers betwen "1-5" and "." \n- Account name cannot end with a "." \n- Account name can contain a max of 12 characters')
    }
    return (match && lastChar != '.')
}

