require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId} = require('mongodb');

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
const dbName = process.env.DB_NAME;

const User = {

    async createNewUser(username, passwordHashed){
        await client.connect();
        const db = client.db(dbName);

        const usersCollection = db.collection('users');

        const userCreated = await usersCollection.insertOne({username:username, password: passwordHashed, admin:false});

        await client.close();

        return userCreated;
    },

    async getUser(username) {

        await client.connect();
        const db = client.db(dbName);

        const usersCollection = db.collection('users');

        const user = await usersCollection.findOne({username: username});

        await client.close();

        return user;
    },
    //
    // getAll : async function () {
    //
    //     await client.connect();
    //     const db = client.db(dbName);
    //
    //     const productsCollection = db.collection('products');
    //
    //     return productsCollection.find().toArray();
    // },
    //
    // async getById(productId) {
    //
    //     const newId = new ObjectId(productId);
    //     const products =  await Product.getAll();
    //
    //     for (let i=0; i<products.length;i++){
    //         if(newId.equals(products[i]._id)){
    //             return products[i];
    //         }
    //     }
    //
    //     return null;
    // }

}

module.exports = User;
