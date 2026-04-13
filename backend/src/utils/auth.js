const bcrypt=require('bcrypt');
const jwt = require('jsonwebtoken');

//no times to hash
const SALT_ROUNDS = 10

async function hashPassword(password) {
    try{
        const hashedPwd = await bcrypt.hash(password,SALT_ROUNDS);
        return hashedPwd;
    }
    catch(error){
        throw new Error('Error hashing password: '+error.message);
    }
}

async function comparePassword(password, hashedPassword) {
    try{

        const isMatch = await bcrypt.compare(password,hashedPassword);
        return isMatch;
    }
    catch(error){
        throw new Error('Error comparing password: '+error.message);
    }
}


function generateToken(payload){
    try{
        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            {expiresIn: process.env.JWT_EXPIRES_IN || '7d'}
        );
        return token;
    }
    catch(error){
        throw new Error('Error generating token: '+error.message);
    }
}

function verifyToken(token){
    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded;
    }
    catch(error){
        throw new Error('Invalid or expired token: '+error.message);
    }
}

module.exports = {
    hashPassword,
    comparePassword,
    generateToken,
    verifyToken
};