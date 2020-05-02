/**
 * @author wpatterson
 */
const C = require('./config.js')
const MongoClient = require('mongodb').MongoClient

const ItemProvider = function () { }

// Connection URL
const url = C.host

const errorResponse = { ok: false, error: 'Oops something went wrong!' }

const client = new MongoClient(url, { useUnifiedTopology: true });

// find items in collection
ItemProvider.prototype.findItems = async ({ collection, query, limit, sort, fields }) => {
  await client.connect();
  const db = client.db(C.name);
  let coll = db.collection(collection);
  try {
    const result = await coll.find(query).project(fields).sort(sort || { _id: -1 }).limit(limit || 0).toArray();
    return result;
  } catch (err) {
    console.log('error:', err.stack);
    return errorResponse;
  }
}

// find single item
ItemProvider.prototype.findOne = async ({ collection, query }) => {
  console.log(query);
  await client.connect();
  const db = client.db(C.name);
  let coll = db.collection(collection);
  try {
    const result = await coll.find(query).limit(1).toArray();
    return result[0];
  } catch (err) {
    console.log('error:', err.stack);
    return errorResponse;
  }
}

// save item or items
ItemProvider.prototype.saveItem = async ({ collection, student }) => {
  await client.connect();
  const db = client.db(C.name);
  let coll = db.collection(collection);
  try {
    const result = await coll.insertOne(student);
    if (result.result.ok && result.insertedCount > 0) {
      const savedItem = await coll.find({ _id: result.insertedId }).limit(1).toArray();
      return savedItem[0];
    } else {
      return errorResponse
    }
  } catch (err) {
    console.log('error:', err.stack);
    return errorResponse;
  }
}

// update item or items
ItemProvider.prototype.updateItem = async ({ collection, query, action }) => {
  await client.connect();
  const db = client.db(C.name);
  let coll = db.collection(collection);
  try {
    const result = await coll.findOneAndUpdate(query, action);
    if (result.ok) {
      const updatedItem = await coll.find(query).limit(1).toArray();
      return updatedItem[0];
    } else {
      return errorResponse
    }
  } catch (err) {
    console.log(err.stack);
    return errorResponse;
  }
}

// delete item or items
ItemProvider.prototype.deleteItem = async ({ collection, query }) => {
  await client.connect();
  const db = client.db(C.name);
  let coll = db.collection(collection);
  try {
    const result = await coll.deleteOne(query);
    console.log(result.result.ok, result.deletedCount);
    if (result.result.ok && result.deletedCount > 0) {
      return {
        ok: result.result.ok,
        deletedCount: result.deletedCount
      };
      return result;
    } else {
      return errorResponse
    }
  } catch (err) {
    console.log(err.stack);
    return errorResponse;
  }
}

exports.ItemProvider = ItemProvider;
