import {Args, Command, Flags, ux} from '@oclif/core'
const readXlsxFile = require('read-excel-file/node')
import schemaService from '../atomichub/schema-service'
import arrayUtils from '../utils/array-utils'
import templateService from '../atomichub/template-service'
import { TransactResult } from 'eosjs/dist/eosjs-api-interfaces'
const {bloksUrl} = require('../config')


//Required headers
const schemaField = 'template_schema'
const maxSupplyField = 'template_max_supply'
const isBurnableField = 'template_is_burnable'
const isTransferableField = 'template_is_transferable'

const typeAliases: any = {
  image: 'string',
  ipfs: 'string',
}

export default class CreateTemplates extends Command {
  static description = 'Create templates in a collection'

  static examples = [
    '<%= config.bin %> <%= command.id %> -c 1 -f template.xls -s 111',
  ]

  static flags = {
    collection: Flags.string({char: 'c', description: 'Collection id', required: true}),
    file: Flags.string({char: 'f', description: 'Text file with list of addresses', required: true}),
    batchSize: Flags.integer({char: 's', description: 'Transactions batch size', required: false})
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(CreateTemplates)

    const collection = flags.collection ?? '1'
    const templatesFile = flags.file
    const batchSize:number = flags.batchSize ?? 10
    this.debug(`Collection ${collection}`)
    this.debug(`templatesFile ${templatesFile}`)
    this.debug(`batchSize ${batchSize}`)

    //Get Schemas
    ux.action.start('Getting collection schemas')
    let schemasMap:any = {}
    try {
      const schemas = await schemaService.getCollectionSchemas(collection)
      schemasMap = schemas.reduce((acc: any, row: { schema_name: any }) => ({
        ...acc, [row.schema_name]: row,
      }), {})
    } catch (error) {
      this.error(`Unable to obtain schemas for collection ${collection}`)
    }
    ux.action.stop()

    //Read XLS file
    ux.action.start('Reading xls file')
    let sheet = []
    try {
      sheet = await readXlsxFile(templatesFile)
    } catch (e:any) {
      this.warn('Unable to read templates file')
      this.error(e.message)
    }
    if (sheet.length < 2) {
      this.error('No entries in the file')
    } 
    
    const headersMap = sheet[0]
    .map((name: any, index: any) => ({name, index}))
    .reduce((acc: any, entry: { name: any; index: any }) => (
      {...acc, [entry.name]: entry.index}
    ), {})

    const isHeaderPresent = (text: string) => {
      return headersMap[text] >= 0
    }
    
    if (!isHeaderPresent(schemaField) || !isHeaderPresent(maxSupplyField) || !isHeaderPresent(isBurnableField) || !isHeaderPresent(isTransferableField)) {
      this.error(`Headers ${schemaField}, ${maxSupplyField}, ${isBurnableField}, ${isTransferableField} must be present`)
    }

    const schemaIndex = headersMap[schemaField]
    const maxSupplyIndex = headersMap[maxSupplyField]
    const isBurnableIndex = headersMap[isBurnableField]
    const isTransferableIndex = headersMap[isTransferableField]

    sheet.splice(0, 1)
    
    const templates = sheet.map((row: any) => {
      const schemaName:string = (row[schemaIndex] || '').toLowerCase()
      const schema = schemasMap[schemaName]
      if (!schema) {
        this.error(`Schema ${schemaName} doesn't exist`)
      }
      const maxSupply = row[maxSupplyIndex] || 0
      const isBurnable = Boolean(row[isBurnableIndex])
      const isTransferable = Boolean(row[isTransferableIndex])

      if (!isBurnable && !isTransferable) {
        console.error('Non-transferable and non-burnable templates are not supposed to be created')
      }
      const attributes:any[] = []
      schema.format.forEach((attr: { name: string; type: string }) => {
        const value = row[headersMap[attr.name]]

        // @TODO: do this warning for each schema, not foreach template
        if (headersMap[attr.name] === undefined) {
          this.warn(`The attribute: '${attr.name}' of schema: '${schemaName}' is not in any of the columns of the spreadsheet`)
        }

        if (value !== null && value !== undefined) {
          const type = typeAliases[attr.type] || attr.type
          attributes.push({
            key: attr.name,
            value: [type, value],
          })
        }
      })

      return {
        schema: schemaName,
        maxSupply,
        isBurnable,
        isTransferable,
        immutableAttributes: attributes,
      }

    })
    ux.action.stop()

    //Create Templates
    ux.action.start('Creating Templates...')
    let batches = arrayUtils.getBatchesFromArray(templates, batchSize)
    batches.forEach((templatesBatch: any[], index:number) => {
      ux.table(templatesBatch, {
        schema: {
          get: ({schema}) => schema,
        },
        maxSupply: {
          get: ({maxSupply}) => maxSupply,
        },
        isBurnable: {
          get: ({isBurnable}) => isBurnable,
        },
        isTransferable: {
          get: ({isTransferable}) => isTransferable,
        },
        attributes: {
          get: ({immutableAttributes}) => <[Map<string, any>]>immutableAttributes.map((map:any) => `${<Map<string, any>>map.key}: ${<Map<string, any>>map.value[1]}`).join('\n'),
        },
      })
    })

    let totalCreated = 0
    const proceed = await ux.confirm('Continue? y/n')
    if (proceed) {
      try {
        for (const templatesBatch of batches) {
          // eslint-disable-next-line no-await-in-loop
          const result = (await templateService.createTemplates(collection, templatesBatch, true)) as TransactResult
          
          const txId = result.transaction_id
          this.log(`${templatesBatch.length} Templates created successfully. Transaction: ${bloksUrl}transaction/${txId}`)
          totalCreated += templatesBatch.length
        }
      } catch (e:any) {
        this.warn(`Error after creating ~${totalCreated}`)
        this.error(e.message)
      }
      ux.action.stop()
      this.log('Done!')
      this.exit(0)
    }
    
    if (args.file && flags.force) {
      this.log(`you input --force and --file: ${args.file}`)
    }

    
  }
}
