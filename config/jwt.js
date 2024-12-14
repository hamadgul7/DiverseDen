const jwt = require('jsonwebtoken')

const secretKey = "DiverseDen";
function createToken(userId){
    return jwt.sign({id: userId}, secretKey, {expiresIn: "24h"})
}

module.exports = {createToken}