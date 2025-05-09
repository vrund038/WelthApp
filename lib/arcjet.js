import arcjet, { tokenBucket } from "@arcjet/next";

const aj = arcjet({
    key : process.env.ARCJET_KEY,
    characteristics: ["userId"],
    rules:[
        tokenBucket({
            mode:"LIVE",
            refillRate:10,
            interval:3600,  //In 1 hour user can make 10 request
            capacity:10,
        }) 
    ]
})

export default aj;