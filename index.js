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
        const productCollection = client.db('usedPhones').collection('products')

        // add product database
        app.post('/products', async (req, res) => {
            const product = req.body;


            const query = { email: product.email }
            const user = await userCollection.findOne(query);
            if (user.role === 'Seller') {
                const result = await productCollection.insertOne(product);
                return res.send(result)
            }
            res.status(401).send({ message: 'unauthorized access' });
        })
        // add user database 
        app.post('/users', async (req, res) => {
            const newUser = req.body;
            const query = { email: newUser.email }
            const user = await userCollection.findOne(query);
            if (!user) {
                const result = await userCollection.insertOne(newUser)
                return res.send(result)
            }
            res.send('already store data')
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