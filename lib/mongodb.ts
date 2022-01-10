import { ClientSession, Db, MongoClient, ServerSession } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI as string;
const MONGODB_DB = process.env.MONGODB_DB;

// check the MongoDB URI
if (!MONGODB_URI) {
  throw new Error("Define the MONGODB_URI environmental variable");
}

// check the MongoDB DB
if (!MONGODB_DB) {
  throw new Error("Define the MONGODB_DB environmental variable");
}

let cachedDb: Db | null = null;
let cachedClient: MongoClient | null = null;

export function startSession(): ClientSession {
  if (!cachedClient) {
    cachedClient = new MongoClient(MONGODB_URI);
  }
  return cachedClient.startSession();
}

export async function connect(): Promise<Db> {
  if (cachedDb) {
    return cachedDb;
  }
  if (!cachedClient) {
    cachedClient = new MongoClient(MONGODB_URI);
  }

  cachedDb = (await cachedClient.connect()).db(MONGODB_DB);
  return cachedDb;
}
