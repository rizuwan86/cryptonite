const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

'use strict'

BigInt.prototype.toJSON = function () {
  const int = Number.parseInt(this.toString());
  return int ?? this.toString();
};

module.exports = async function (fastify, opts) {
  
  fastify.get('/:playerID',{
    schema: {
      params: {
        type: 'object',
        properties: {
          playerID: { type: 'number' }
        }
      }
    }
  }, async function (request, reply) {
    const { playerID } = request.params
    const player = await prisma.players.findFirst({
      select:{
        id: true,
        name: true,
        level: true,
        factions:{
          select:{
            id: true,
            name: true
          }
        },
        snapshot:{
          select:{
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
            snapshot_date: true
          }
        }
      },
      where: {
        id: playerID
      }
    })     

    reply.send(player)
  })
  
}
