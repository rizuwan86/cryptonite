const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

'use strict'

module.exports = async function (fastify, opts) {
  fastify.get('/', async function (request, reply) {
    const factions = await prisma.factions.findMany()     
    reply.send(factions)
  })
  
}
