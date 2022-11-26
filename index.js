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
        //send category products client
        app.get('/category/:category', async (req, res) => {
            const category = req.params.category;
            const query = { category }
            const allProducts = await productCollection.find(query).toArray();
            const products = allProducts.filter(product => !product.booked)
            res.send(products);
        })
        // send advertise product database to client
        app.get('/products/advertise', async (req, res) => {
            const query = { advertise: true }
            const allAdvertiseProducts = await productCollection.find(query).toArray();
            const advertiseProducts = allAdvertiseProducts.filter(product => !product.booked)
            res.send(advertiseProducts)
        })
        //add advertise client to database
        app.put('/products/advertise/:id', async (req, res) => {
            const id = req.params.id;
            const advertise = req.body;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updatedDoc = {
                $set: advertise
            }
            const result = await productCollection.updateOne(filter, updatedDoc, options);
            res.send(result)
        })

        //send my product client
        app.get('/products', async (req, res) => {
            const email = req.query.email;
            const query = { email: email }
            const products = await productCollection.find(query).toArray();
            res.send(products);
        })

        // add product database
        app.post('/products', async (req, res) => {
            const product = req.body;
            //call users
            const query = { email: product.email }
            const user = await userCollection.findOne(query);
            //check user 
            if (user.role === 'Seller') {
                const result = await productCollection.insertOne(product);
                return res.send(result)
            }
            res.status(401).send({ message: 'unauthorized access' });
        })
        // delete product database
        app.delete('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await productCollection.deleteOne(query);
            res.send(result);
        })

        app.get('/users', async (req, res) => {
            const query = {};
            const users = await userCollection.find(query).toArray()
            res.send(users)
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