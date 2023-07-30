const { PrismaClient } = require('@prisma/client')
// const prisma = new PrismaClient()
const axios = require('axios')
const moment = require('moment')
const api = axios.create({ baseURL: 'https://api.torn.com/' });

'use strict'


module.exports = async function (fastify, opts) {
    fastify.decorate('prisma', await new PrismaClient())
    fastify.decorate('axios', require('axios'))
    fastify.decorate('api', api)
    fastify.decorate('moment', moment)
    fastify.decorate('torn',require('./_torn'))
    
    fastify.decorate('tcvar', {
        runningIndex: 0,
        usageLimit: 20,
        apikeys: await fastify.torn.getAPIkeys()
    })


    fastify.decorate('apikey', function () {  
        if(fastify.tcvar.runningIndex == fastify.tcvar.apikeys.length) {
            fastify.tcvar.runningIndex = 0;
        }

        return fastify.tcvar.apikeys[fastify.tcvar.runningIndex++].apikey
    })

    fastify.register(require('./updateNewFactionInfo'))
    fastify.register(require('./snapshot'))

}
