require('dotenv').config()
const { MongoClient, ServerApiVersion} = require('mongodb');

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
const dbName = process.env.DB_NAME;

const Reservation = {

    async createNewReservation(tickedResources, startingDateA, endingDateA, user){
        await client.connect();
        const db = client.db(dbName);

        const reservationsCollection = db.collection('reservations');

        // Checking that all resources are available
        for(let i = 0; i<tickedResources.length; i++){
            const resourceReservations = await reservationsCollection.find({resourceName: tickedResources[i]}).toArray();

            for(let j = 0; j<resourceReservations.length; j++){
                if((startingDateA < resourceReservations[j].endingDate && resourceReservations[j].startingDate < endingDateA)){
                    return({operation:"Periods overlaping", problematicResource : tickedResources[i] });
                }
            }
        }

        // If we are here, it means that yes, so we create the reservation with a line for each resource
        let reservations = [];

        for(let i = 0; i<tickedResources.length; i++){
            let reservationCreated = await reservationsCollection.insertOne({resourceName: tickedResources[i], startingDate:startingDateA, endingDate:endingDateA, user:user});
            reservations.push(reservationCreated);
        }

        await client.close();

        return reservations;
    },

    async getAllReservationsForUser(name) {

        await client.connect();
        const db = client.db(dbName);

        const reservationsCollection = db.collection('reservations');

        const reservations = await reservationsCollection.find({user: name}).toArray();

        await client.close();

        return reservations;
    },

    async getAll(){
        await client.connect();
        const db = client.db(dbName);

        const reservationsCollection = db.collection('reservations');

        const reservations = await reservationsCollection.find().toArray();

        await client.close();

        return reservations;
    }
}

module.exports = Reservation;
