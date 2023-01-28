require('dotenv').config()
const { MongoClient, ServerApiVersion} = require('mongodb');

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
const dbName = process.env.DB_NAME;

const Resource = {

    async createNewResource(name, architecture){
        await client.connect();
        const db = client.db(dbName);

        const resourcesCollection = db.collection('resources');

        const resourceCreated = await resourcesCollection.insertOne({name: name, architecture:architecture});

        await client.close();

        return resourceCreated;
    },

    async getResource(name) {

        await client.connect();
        const db = client.db(dbName);

        const resourcesCollection = db.collection('users');

        const resource = await resourcesCollection.findOne({_id: name});

        await client.close();

        return resource;
    }
}

module.exports = Resource;
