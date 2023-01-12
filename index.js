const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
// const Realm = require("realm");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

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
      let newSellingMedicineInfo = { ...sellingMedicineInfo };
      // console.log(sellingMedicineInfo);
      const { sellerEmail } = sellingMedicineInfo;

      const query = { email: sellerEmail };
      // User  Check For user-Verified
      const user = await users.findOne(query);
      if (user?.isVerified) {
        newSellingMedicineInfo.userVerified = true;
      }
      const result = await sellingMedicineCollection.insertOne(
        newSellingMedicineInfo
      );
      console.log(result);
      res.send(result);
    });
    app.post("/donatemedicine", async (req, res) => {
      const donatingMedicineInfo = req.body;
      let newDonatingMedicineInfo = { ...donatingMedicineInfo };
      // console.log(donatingMedicineInfo);
      const { sellerEmail } = donatingMedicineInfo;
      const query = { email: sellerEmail };
      // User  Check For user-Verified
      const user = await users.findOne(query);
      if (user?.isVerified) {
        newDonatingMedicineInfo.userVerified = true;
      }
      const result = await donatingMedicineCollection.insertOne(
        newDonatingMedicineInfo
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

    // app.get("/searchsellingmedicine", async (req, res) => {
    //   const queryKey = req.query.queryKey;
    //   console.log("queryKey:", queryKey);
    //   const REALM_APP_ID = "medicines-dujph";
    //   const app = new Realm.App({ id: REALM_APP_ID });
    //   const credentials = Realm.Credentials.anonymous();
    //   try {
    //     const user = await app.logIn(credentials);
    //     console.log("user:", user);
    //     const allSellingMedicine =
    //       await user.functions.searchSellingMedicineName(queryKey);
    //     console.log("allSellingMedicine:-", allSellingMedicine);
    //     res.send(allSellingMedicine);
    //   } catch (err) {
    //     console.error("Failed to log in", err);
    //   }
    // });
    app.get("/searchsellingmedicine", async (req, res) => {
      const queryKey = req.query.queryKey;
      let pipeline = [
        {
          $search: {
            index: "searchSellingMedicine",
            text: {
              query: queryKey,
              path: {
                wildcard: "*",
              },
              fuzzy: {},
            },
          },
        },
      ];
      const result = await sellingMedicineCollection
        .aggregate(pipeline)
        .toArray();
      res.send(result);
    });
    app.get("/sellingMedicineDetails", async (req, res) => {
      const _id = req.query._id;
      console.log("_id: ", _id);
      const query = { _id: ObjectId(_id) };

      const result = await sellingMedicineCollection.findOne(query);
      // console.log(result);
      res.send(result);
    });
    app.get("/searchdonatingmedicine", async (req, res) => {
      const queryKey = req.query.queryKey;
      const query = { medicineName: queryKey };
      const options = {};
      const result = await donatingMedicineCollection
        .find(query, options)
        .toArray();
      res.send(result);
    });
    app.get("/donatingMedicineDetails", async (req, res) => {
      const _id = req.query._id;
      // console.log("_id: ", _id);
      const query = { _id: ObjectId(_id) };
      const result = await donatingMedicineCollection.findOne(query);
      // console.log(result);
      res.send(result);
    });
    app.post("/reportsellingmedicine", async (req, res) => {
      const reportingStatusObject = req.body;
      const { reportingStatus } = reportingStatusObject;
      // console.log("OKKk", reportingStatus);

      const filter = { _id: ObjectId(reportingStatus._id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          reportingStatus: reportingStatus,
        },
      };

      const result = await sellingMedicineCollection.updateOne(
        filter,
        updateDoc,
        options
      );

      res.send(result);
    });
    app.post("/reportdonatingmedicine", async (req, res) => {
      const reportingStatusObject = req.body;
      const { reportingStatus } = reportingStatusObject;
      // console.log("OKKk", reportingStatus);

      const filter = { _id: ObjectId(reportingStatus._id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          reportingStatus: reportingStatus,
        },
      };

      const result = await donatingMedicineCollection.updateOne(
        filter,
        updateDoc,
        options
      );

      res.send(result);
    });
    app.put("/takedonatedmedicine", async (req, res) => {
      const _id = req.query._id;
      const medicineTakerNGOInfo = req.body;
      // console.log(
      //   "_id: " + _id,
      //   "\nmedicineTakerNGOInfo:",
      //   medicineTakerNGOInfo
      // );

      const filter = { _id: ObjectId(_id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          donatingStatus: "donated",
          recipientNGO: medicineTakerNGOInfo,
        },
      };

      const result = await donatingMedicineCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      console.log("xxxxxx", result);
      res.send(result);
    });
    app.get("/ourvolunteers", async (req, res) => {
      const query = {};
      const result = await volunteersCollection.find(query).toArray();
      res.send(result);
    });
    app.get("/volunteerdelet", async (req, res) => {
      const _id = req.query._id;
      const query = { _id: ObjectId(_id) };
      const result = await volunteersCollection.deleteOne(query);
      res.send(result);
    });
  } finally {
  }
}
run().catch(console.log());

app.listen(port, () => {
  console.log("listening on port", port);
});
