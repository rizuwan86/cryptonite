'use strict' 
 module.exports = function(fastify, opts, next) { 

    async function snapshot() {
        
        const currentTime = fastify.moment.utc().toISOString()
        const maxRequest = fastify.tcvar.apikeys.length * fastify.tcvar.usageLimit;
        const today = fastify.moment(fastify.moment().utc().format('YYYY-MM-DD'), 'YYYY-MM-DD').utc()
        const calls = []

        const players = await fastify.prisma.players.findMany({
            select:{
                id: true,
                latest_snapshot: true,
            },
            where:{
                latest_snapshot:{
                    lt: today.toISOString()
                }
            },
            take: 800,
            orderBy: [
                {
                    faction_id: 'asc'
                },
                {
                    id: 'asc'
                }
            ]
        })
        
        fastify.axios.all( players.map( m => fastify.api.get('user/'+m.id, { params: { 
            selections: 'basic,personalstats',
            stat: 'defendslost,attackswon,attackslost,useractivity,energydrinkused,traveltime,drugsused,territoryjoins,territorytime,territoryclears',
            timestamp: fastify.moment.utc(m.latest_snapshot, 'YYYY-MM-DD').add(1, 'day').unix(),
            key: fastify.apikey(),
            comment: 'crypto' 
        } })).slice(0, maxRequest) )
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
                    const {player_id, personalstats: {defendslost, attackswon, attackslost, useractivity, energydrinkused, traveltime, drugsused, territoryjoins, territorytime, territoryclears}} = r.data
                    const snapshot_date = fastify.moment.unix(r.config.params.timestamp).toISOString()

                    await fastify.prisma.players.update({
                        where:{
                            id: player_id
                        },
                        data:{
                            latest_snapshot: snapshot_date,
                            last_updated: currentTime,
                            snapshot: {
                                create: [
                                    {
                                        defendslost,
                                        attackswon,
                                        attackslost,
                                        useractivity,
                                        energydrinkused,
                                        traveltime,
                                        drugsused,
                                        territoryjoins,
                                        territorytime,
                                        territoryclears,
                                        snapshot_date
                                    }
                                ]
                            }
                        }
                    })
                }
            })
        })
    }

    snapshot()
    setInterval(() => {         
        snapshot() 
    }, 120000); // 5 minutes checking

    next()
}   