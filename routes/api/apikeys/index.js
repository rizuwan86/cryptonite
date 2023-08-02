const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

'use strict'

module.exports = async function (fastify, opts) {
  fastify.get('/', async function (request, reply) {
    const apikeys = await prisma.apikeys.findMany({
        select:{
            id: true,
            apikey: true,
            isActive: true,
            error: true
        }
    })     
    reply.send(apikeys)
  })
  
}
