const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

'use strict'

module.exports = async function (fastify, opts) {
  
  fastify.get('/:factionID',{
    schema: {
      params: {
        type: 'object',
        properties: {
          factionID: { type: 'number' }
        }
      }
    }
  }, async function (request, reply) {
    const { factionID } = request.params
    const faction = await prisma.factions.findFirst({
      select:{
        id: true,
        name: true,
        tag: true,
        tag_image: true,
        last_updated: true,
        isAlly: true,
        players:{
          select:{
            id: true,
            name: true,
            level: true,
            last_updated: true,
            latest_snapshot: true
          }
        }
      },
      where: {
        id: factionID
      }
    })     
    
    const snapshots = await prisma.snapshot.groupBy({
      by: 'snapshot_date',
      _sum:{
        defendslost: true,
        defendslost: true,
        attackswon: true,
        attackslost: true,
        attacksassisted: true,
        useractivity: true,
        energydrinkused: true,
        traveltime: true,
        drugsused: true,
        territoryjoins: true,
        territoryclears: true,
      },
      where: {
        players: {
          faction_id: factionID
        }
      },
      orderBy: {
        snapshot_date: 'asc'
      }
    })

    faction.snapshots = snapshots

    reply.send(faction)
  })
  
}
