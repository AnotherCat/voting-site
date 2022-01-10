import { BSONTypeError } from "bson";
import { Db, ObjectId } from "mongodb";
import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import { connect } from "../../../../lib/mongodb";
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.status(405).json({ statusCode: 405, message: "Method not allowed" });
    return;
  }
  // Get vote
  try {
    const id = req.query.id as string;

    const db = await connect();
    const polls = db.collection("polls");
    const resp = await polls.findOne({
      _id: new ObjectId(id),
    });
    if (resp) {
      res.json(resp);
    } else {
      res.status(404).json({ statusCode: 404, message: "Poll not found" });
    }
  } catch (e) {
    if (e instanceof BSONTypeError) {
      res.status(404).json({ statusCode: 404, message: "Poll not found" });
    } else {
      throw e;
    }
  }
}
