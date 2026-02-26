const express = require('express');
const dotenv = require('dotenv');
const cors =  require('cors');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

//health
app.get('/health',(req,res)=>{
    res.json({
        status:'OK',
        timestamp: new Date().toISOString()
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT,()=>{
    console.log(`Server Running on port: ${PORT}`);
});
