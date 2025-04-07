require('dotenv').config(); // Load environment variables
const express = require("express");
const mongoose = require("mongoose");
const cors = require('cors');

const { ObjectId } = require("mongodb");

const app = express();
app.use(express.json());
app.set("port", process.env.PORT || 3000);

// Enable CORS

app.use(cors());

// ✅ Connect to MongoDB Atlas using mongoose
mongoose.connect(process.env.MONGO_URI, {
  dbName: 'webstore', // Specify the database name
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB Atlas'))
.catch(err => console.error('❌ Connection error:', err));

const db = mongoose.connection;

// Define a generic function to get a collection
function getCollection(name) {
  return db.collection(name);
}

// ✅ API Routes
app.get("/", (req, res) => {
  res.send("Select a collection, e.g., /collection/messages");
});

// Fetch all documents from a collection
app.get("/collection/:collectionName", async (req, res, next) => {
  try {
    const collection = getCollection(req.params.collectionName);
    const results = await collection.find({}).toArray();
    res.send(results);
  } catch (e) {
    next(e);
  }
});

// Insert a new document into a collection
app.post("/collection/:collectionName", async (req, res, next) => {
  try {
    const collection = getCollection(req.params.collectionName);
    const result = await collection.insertOne(req.body);
    const insertedDoc = await collection.findOne({ _id: result.insertedId }); 
    res.send(insertedDoc);
  } catch (e) {
    next(e);
  }
});

// Fetch a single document by ID
app.get("/collection/:collectionName/:id", async (req, res, next) => {
  try {
    const collection = getCollection(req.params.collectionName);
    const result = await collection.findOne({ _id: new ObjectId(req.params.id) });
    res.send(result);
  } catch (e) {
    next(e);
  }
});

// Update a document by ID
app.put("/collection/:collectionName/:id", async (req, res, next) => {
  try {
    const collection = getCollection(req.params.collectionName);
    const result = await collection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: req.body }
    );
    res.send(result.matchedCount === 1 ? { msg: "Product Updated Successfully" } : { msg: "Error! Product Not Updated" });
  } catch (e) {
    next(e);
  }
});

// Delete a document by ID
app.delete("/collection/:collectionName/:id", async (req, res, next) => {
  try {
    const collection = getCollection(req.params.collectionName);
    const result = await collection.deleteOne({ _id: new ObjectId(req.params.id) });
    res.send(result.deletedCount === 1 ? { msg: "Product Deleted Successfully" } : { msg: "Error! Product Not Deleted" });
  } catch (e) {
    next(e);
  }
});

// ✅ Place Order API
app.post("/place-order", async (req, res) => {
  try {
    const ordersCollection = getCollection("orders");
    const order = req.body;

    if (
      !order.firstName || !order.lastName || !order.address || 
      !order.city || !order.state || !order.zip || 
      !order.phone || !order.cart || order.cart.length === 0
    ) {
      return res.status(400).send({ msg: "Invalid order data" });
    }

    order.date = new Date(); 

    const result = await ordersCollection.insertOne(order);
    res.send({ msg: "Successfully Placed The Order", orderId: result.insertedId });
  } catch (err) {
    console.error("Error placing order:", err);
    res.status(500).send({ msg: "Failed to place order" });
  }
});

// ✅ Start the Server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
