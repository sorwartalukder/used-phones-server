const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const jwt = require('jsonwebtoken')

const port = process.env.PORT || 5000;

const app = express();

//middleware
app.use(cors())
app.use(express.json())




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.wt5ksu8.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// jwt 
function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next()
    })

}

async function run() {
    try {
        const categoryCollection = client.db('usedPhones').collection('category')
        const userCollection = client.db('usedPhones').collection('users')
        const productCollection = client.db('usedPhones').collection('products')
        const bookingCollection = client.db('usedPhones').collection('booking')
        //jwt
        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email }
            const user = await userCollection.findOne(query)
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '3d' })
                return res.send({ accessToken: token })
            }
            res.status(403).send({ accessToken: '' })
        })
        //send category name client
        app.get('/category/:category', async (req, res) => {
            const category = req.params.category;
            const query = { category }
            const categoryName = await categoryCollection.findOne(query)
            res.send(categoryName);
        })
        //send category products client
        app.get('/category/products/:category', verifyJWT, async (req, res) => {
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

        //send reported products client
        app.get('/reported/products', verifyJWT, async (req, res) => {
            const query = { report: true }
            const ReportedProducts = await productCollection.find(query).toArray();
            res.send(ReportedProducts);
        })

        //verified user products
        app.put('/products', async (req, res) => {
            const email = req.query.email;
            const verify = req.body;
            const filter = { email };
            const options = { upsert: true };
            const updatedDoc = {
                $set: verify
            }
            const result = await productCollection.updateMany(filter, updatedDoc, options);
            res.send(result)
        })
        // add advertise product client to database
        app.put('/products/:id', async (req, res) => {
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
        app.get('/products', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;
            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            const query = { email: email }
            const products = await productCollection.find(query).toArray();
            res.send(products);
        })

        // add product database
        app.post('/products', async (req, res) => {
            const product = req.body;
            console.log(product)
            //call users
            const query = { email: product.email }
            const user = await userCollection.findOne(query);
            // set user verify status
            if (user.verify) {
                product.userVerify = user.verify
            }
            else {
                product.userVerify = false
            }
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
        //add booking 
        app.post('/booking', async (req, res) => {
            const booking = req.body;
            const result = await bookingCollection.insertOne(booking)
            res.send(result)
        })
        //send booking my order 
        app.get('/my-orders/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            const decodedEmail = req.decoded.email;
            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'forbidden access' })
            }

            const query = { buyerEmail: email }
            const myOrders = await bookingCollection.find(query).toArray()
            res.send(myOrders)
        })
        //send booking my buyer 
        app.get('/my-buyer/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            const decodedEmail = req.decoded.email;
            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            const query = { sellerEmail: email }
            const myBuyer = await bookingCollection.find(query).toArray()
            res.send(myBuyer)
        })
        //check user role
        app.get('/user', async (req, res) => {
            const email = req.query.email;
            const query = { email };
            const users = await userCollection.findOne(query)
            res.send(users)
        })
        //send all users
        app.get('/users', verifyJWT, async (req, res) => {
            const query = {};
            const users = await userCollection.find(query).toArray()
            res.send(users)
        })
        //send all seller
        app.get('/all-seller', verifyJWT, async (req, res) => {
            const query = { role: 'Seller' };
            const allSeller = await userCollection.find(query).toArray()
            res.send(allSeller)
        })
        //send all buyer
        app.get('/all-buyer', verifyJWT, async (req, res) => {
            const query = { role: 'Buyer' };
            const allSeller = await userCollection.find(query).toArray()
            res.send(allSeller)
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
            res.send({ message: 'already store data' })
        })
        //update user role and user verify
        app.put('/users/:id', async (req, res) => {
            const id = req.params.id;
            const role = req.body;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updatedDoc = {
                $set: role
            }
            const result = await userCollection.updateOne(filter, updatedDoc, options);
            res.send(result)
        })
        //delete user 
        app.delete('/users/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await userCollection.deleteOne(query);
            res.send(result);
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