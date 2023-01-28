require('dotenv').config()
const { MongoClient, ServerApiVersion} = require('mongodb');

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
const dbName = process.env.DB_NAME;

const User = {

    async createNewUser(username, passwordHashed){
        await client.connect();
        const db = client.db(dbName);

        const usersCollection = db.collection('users');

        const userCreated = await usersCollection.insertOne({_id:username, password: passwordHashed, admin:false});

        await client.close();

        return userCreated;
    },

    async getUser(username) {

        await client.connect();
        const db = client.db(dbName);

        const usersCollection = db.collection('users');

        const user = await usersCollection.findOne({_id: username});

        await client.close();

        return user;
    }
}

module.exports = User;
