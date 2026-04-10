const express = require('express');
const {PrismaClient}= require('@prisma/client');
const { hashPassword, comparePassword,generateToken} =require('../utils/auth');

const router = express.Router();
const primsa = new PrismaClient();

// /auth/register
router.post('/register', async (req,res)=>{
    try{
        const { email,password,role, name,rollNumber, employeeId, department, year}= req.body;

        if(!email || !password || !role || !name){
            return res.status(400).json({
                error: 'Missing required fields : email, password , role ,name'
            });
        }

        const existingUser = await Prisma.user.findUnique({
            where:{email}
        });

        if(existingUser){
            return res.status(409).json({
                error:'User with this email already exits '
            });
        }

        const hashedPassword = await hashPassword(password);

        if(role === 'STUDENT'){
            if(!rollNumber || !department || !year){
                return res.status(400).json({
                    error: 'Students require: rollNumber, department , year '
                });
            }

            
        }
    }
})