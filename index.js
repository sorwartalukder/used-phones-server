const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()

const port = process.env.PORT || 5000;

const app = express();

//middleware
app.use(cors())
app.use(express.json())




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.89tmjbq.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
    try {
        const userCollection = client.db('usedPhones').collection('users')
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await userCollection.insertOne(user)
            res.send(result)
        })

    }
    finally {

    }
}
run().catch(e => console.error(e))

app.get('/', async (req, res) => {
    res.send('Used phones server is running')
})

app.listen(port, () => {
    console.log(`Used phones server running on port: ${port}`)
})