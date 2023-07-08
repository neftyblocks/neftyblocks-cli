// eslint-disable-next-line no-path-concat
process.env.NODE_CONFIG_DIR = __dirname + '/../config/'

import config = require('config')

module.exports = {
  eosUrl: config.get('eosUrl'),
  atomicUrl: config.get('atomicUrl'),
  account: config.get('account'),
  permission: config.get('permission'),
  privateKey: config.get('privateKey'),
  cpuPrivateKey: config.get('cpuPrivateKey'),
  cpuAccount: config.get('cpuAccount'),
  cpuPermission: config.get('cpuPermission'),
  proposerPrivateKey: config.has('proposerPrivateKey') ? config.get('proposerPrivateKey') : '',
  proposerAccount: config.has('proposerAccount') ? config.get('proposerAccount') : 'nefty',
  proposerPermission: config.has('proposerPermission') ? config.get('proposerPermission') : 'propose',
  ipfsUrl: config.get('ipfsUrl'),
  bloksUrl: config.get('bloksUrl'),
  atomicHubUrl: config.get('atomicHubUrl'),
  packsContract: config.get('packsContract'),
  pinataUrl: config.get('pinataUrl'),
  pinataApiKey: config.get('pinataApiKey'),
  pinataSecretApiKey: config.get('pinataSecretApiKey'),
  blendsContract: config.get('blendsContract'),
  hyperionUrl: config.get('hyperionUrl'),
  lightApiUrl: config.get('lightApiUrl'),
  fireflyToken: config.get('fireflyToken'),
}
