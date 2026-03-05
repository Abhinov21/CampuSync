const express = require('express');
const dotenv = require('dotenv');
const cors =  require('cors');
const {PrismaClient} = require('@prisma/client');

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

//Root route
app.get('/',(req,res)=>{
    res.json({
        message :'CampuSync API',
        version : '1.0.0',
        database : 'connected'
    });
});

//health
app.get('/health',async (req,res)=>{
    try{
        await prisma.$queryRaw`SELECT 1`;

        res.json({
        status:'OK',
        timestamp: new Date().toISOString()
    });
    }catch(error){
        res.status(500).json({
            status: 'ERROR',
            database: 'Disconnected',
            error: error.message
        });
    }
});

process.on('SIGNINT', async ()=>{
    await prisma.$disconnect();
    process.exit(0);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT,()=>{
    console.log(`Server Running on port: ${PORT}`);
    console.log(`Database: ${prisma ? 'Connected' : 'Disconnected'}`);
});
