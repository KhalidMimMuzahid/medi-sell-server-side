const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const Realm = require("realm");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");

const app = express();
const port = process.env.port || 5000;
app.use(cors());
app.use(express.json());
const user = process.env.DB_USER;
const password = process.env.DB_PASSWORD;

const uri = `mongodb+srv://${user}:${password}@cluster0.q8e2cvk.mongodb.net/?retryWrites=true&w=majority`;
// console.log("uri", uri);
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
app.get("/", (req, res) => {
  res.send({ message: "hello world" });
});

async function run() {
  try {
    const users = client.db("Users").collection("Users");
    const sellingMedicineCollection = client
      .db("medicineCollection")
      .collection("sellingMedicine");
    const donatingMedicineCollection = client
      .db("medicineCollection")
      .collection("donatingMedicine");
    const volunteersCollection = client
      .db("volunteersCollection")
      .collection("volunteers");

    app.post("/insertusertodb", async (req, res) => {
      const userInfo = req.body;
      console.log(userInfo);
      const result = await users.insertOne(userInfo);
      res.send(result);
    });
    app.get("/checkuseralreadyindatabase", async (req, res) => {
      const uid = req?.query?.uid;

      const query = { uid: uid };
      const result = await users.findOne(query);
      //   console.log(result);
      if (result) {
        res.send({ isUserAlreadyExists: true });
      } else {
        res.send({ isUserAlreadyExists: false });
      }
    });
    app.get("/checkrole", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await users.findOne(query);
      res.send(result);
    });
    app.post("/sellmedicine", async (req, res) => {
      const sellingMedicineInfo = req.body;
      // console.log(sellingMedicineInfo);

      const result = await sellingMedicineCollection.insertOne(
        sellingMedicineInfo
      );
      console.log(result);
      res.send(result);
    });
    app.post("/donatemedicine", async (req, res) => {
      const donatingMedicineInfo = req.body;
      // console.log(donatingMedicineInfo);

      const result = await donatingMedicineCollection.insertOne(
        donatingMedicineInfo
      );
      // console.log(result);
      res.send(result);
    });
    app.post("/assignvolunteer", async (req, res) => {
      const volunteerInfo = req.body;
      // console.log(volunteerInfo);

      const result = await volunteersCollection.insertOne(volunteerInfo);
      // console.log(result);
      res.send(result);
    });

    app.get("/searchsellingmedicine", async (req, res) => {
      const queryKey = req.query.queryKey;
      console.log("queryKey:", queryKey);
      const REALM_APP_ID = "medicines-dujph";
      const app = new Realm.App({ id: REALM_APP_ID });
      const credentials = Realm.Credentials.anonymous();
      try {
        const user = await app.logIn(credentials);
        console.log("user:", user);
        const allSellingMedicine =
          await user.functions.searchSellingMedicineName(queryKey);
        console.log("allSellingMedicine:-", allSellingMedicine);
        res.send(allSellingMedicine);
      } catch (err) {
        console.error("Failed to log in", err);
      }
    });
  } finally {
  }
}
run().catch(console.log());

app.listen(port, () => {
  console.log("listening on port", port);
});
