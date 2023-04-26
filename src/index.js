const express = require('express')
const app = express()
const bodyParser = require("body-parser");
const port = 8080

// Parse JSON bodies (as sent by API clients)
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
const { connection } = require('./connector')
app.get("/totalRecovered", (req, res) => {
    connection.aggregate([{ $group: { _id: 'total', recovered: { $sum: "$recovered" } } }]).then((ans) => { res.send(ans[0]) });
})
app.get("/totalActive", (req, res) => {

    connection.aggregate([{ $group: { _id: 'total', active: { $sum: { $subtract: ["$infected", "$recovered"] } } } }]).then((ans) => { res.send(ans[0]) });
})
app.get("/totalDeath", (req, res) => {
    connection.aggregate([{ $group: { _id: 'total', death: { $sum: "$death" } } }]).then((ans) => { res.send(ans[0]) });
})
app.get("/hotspotStates", (req, res) => {
    connection.aggregate([
        {
            $match:
            {
                $expr:

                    { $gt: [{ $round: [{ $divide: [{ $subtract: ["$infected", "$recovered"] }, "$recovered"] }, 5] }, 0.1] }
            }
        },
        {
            $addFields: { rate: { $round: [{ $divide: [{ $subtract: ["$infected", "$recovered"] }, "$recovered"] }, 5] } }
        }, { $project: { "_id": 0, "infected": 0, "recovered": 0, "death": 0, "__v": 0 } }]).then((ans) => { res.send(ans) })
})
app.get("/healthyStates", (req, res) => {
    connection.aggregate([
        {
            $match:
            {
                $expr:

                    { $lt: [{ $round: [{ $divide: ["$death", "$recovered"] }, 5] }, 0.005] }
            }
        },
        {
            $addFields: { mortality: { $round: [{ $divide: ["$death", "$recovered"] }, 5] } }
        }, { $project: { "_id": 0, "infected": 0, "recovered": 0, "death": 0, "__v": 0 } }]).then((ans) => {
            res.send(ans)
        })
})

app.listen(port, () => console.log(`App listening on port ${port}!`))

module.exports = app;