const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const axios = require('axios')
const api = axios.create({ baseURL: 'https://api.torn.com/' });

module.exports = {   

    getAPIkeys: async function() {
        const apikeys = await prisma.apikeys.findMany({
            select:{
                apikey: true,
                isActive: true,
                usage_times: true,
                error: true
            },
            where:{
                isActive: true
            }
        })     

        return apikeys
    },

    validateNewAPIkeys: async function() {
        const apikeys = (await prisma.apikeys.findMany({
            select:{
                apikey: true
            },
            where:{
                owner_id: null,
                error: null
            }
        }))

        axios.all( apikeys.map( m => api.get('user/', { params: { key: m.apikey } })) )
        .then( data => {
            data.forEach( async r => {
                if(r.data.error) {
                    await prisma.apikeys.update({
                        where:{
                            apikey: r.config.params.key
                        },
                        data:{
                            isActive: [2,8,10,13].includes(r.data.error.code) ? false : true,
                            error: r.data.error.code
                        }
                    })
                }
                else {
                    ({player_id:owner_id, name: owner_name} = r.data)
                    await prisma.apikeys.update({
                        where:{
                            apikey: r.config.params.key
                        },
                        data:{
                            owner_id,
                            owner_name,
                            isActive: true,
                            usage_times: 0
                        }
                    })
                }
            });
        })        
    }
}
