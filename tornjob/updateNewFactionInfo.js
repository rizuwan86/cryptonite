'use strict' 
 module.exports = function(fastify, opts, next) { 

    async function updateNewFactionInfo() {
        
        const factions = await fastify.prisma.factions.findMany({
            select:{
                id: true
            },
            where:{
                OR:[
                    {
                        name: null
                    },
                    {
                        last_updated:{
                            lt: fastify.moment.utc().subtract(30,'minutes').toISOString()
                        }
                    }
                ]
            }
        })

        fastify.tcvar.runningIndex = 0;
        const maxRequest = fastify.tcvar.apikeys.length * fastify.tcvar.usageLimit;
        const currentTime = fastify.moment.utc().toISOString()

        fastify.axios.all( factions.map( m => fastify.api.get('faction/'+m.id, { params: { key: fastify.apikey(), comment: 'crypto' } })).slice(0, maxRequest) )
        .then( data => {
            data.forEach( async r => {
                if(r.data.error) {
                    await fastify.prisma.apikeys.update({
                        where:{
                            apikey: r.config.params.key
                        },
                        data:{
                            isActive: false,
                            error: r.data.error.code
                        }
                    })
                }
                else {
                    const {ID, name, tag, tag_image, leader, "co-leader": coleader, members} = r.data
                    await fastify.prisma.factions.update({
                        where:{
                            id: ID
                        },
                        data:{
                            name,
                            tag,
                            tag_image,
                            leader,
                            coleader,
                            last_updated: currentTime
                        }
                    })

                    Object.entries(members)
                    .forEach( async member => { 
                        const { level, name, last_action, status } = member[1]
                        const player_id = Number(member[0])
                        
                        await fastify.prisma.players.upsert({
                            where: {
                                id: player_id
                            },
                            create: {
                                id: player_id,
                                name,
                                level,
                                last_action_status: last_action.status,
                                last_action_timestamp: last_action.timestamp,
                                status_state: status.state,
                                status_until: status.until,
                                faction_id: ID
                            },
                            update: {
                                name,
                                level,
                                last_action_status: last_action.status,
                                last_action_timestamp: last_action.timestamp,
                                status_state: status.state,
                                status_until: status.until,
                                faction_id: ID
                            }
                        })
                    })
                        
                }
            });
        }) 
    }
    
    updateNewFactionInfo() 
    setInterval(() => {         
        updateNewFactionInfo() 
    }, 300000); // 5 minutes checking
    
    next()
}
