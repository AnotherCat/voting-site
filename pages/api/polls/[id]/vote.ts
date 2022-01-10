import { JTDSchemaType } from "ajv/dist/core";
import { BSONTypeError } from "bson";
import { Db, ObjectId } from "mongodb";
import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import { VoteItemWithCount } from "..";
import { connect, startSession } from "../../../../lib/mongodb";
import validateSchema from "../../../../lib/validateSchema";
interface PutVoteBodyType {
  option: number;
}

const putVoteBodySchema: JTDSchemaType<PutVoteBodyType> = {
  properties: {
    option: {
      type: "int32",
    },
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Get vote
  switch (req.method) {
    case "PUT":
      try {
        const session = await getSession({ req });
        if (!session) {
          res.status(401).json({ statusCode: 401, message: "Unauthorized" });
          return;
        }
        if (!validateSchema(putVoteBodySchema, req.body)) {
          res
            .status(400)
            .json({ statusCode: 400, message: "Invalid request body" });

          return;
        }
        const body = req.body as PutVoteBodyType;
        const id = req.query.id as string;

        const db = await connect();
        const pollsCollection = db.collection("polls");
        const pollResp = await pollsCollection.findOne({
          _id: new ObjectId(id),
        });
        if (!pollResp) {
          res.status(404).json({ statusCode: 404, message: "Poll not found" });
          return;
        }
        if (pollResp.endTime < Date.now() / 1000) {
          res.status(400).json({ statusCode: 400, message: "Poll closed" });
        }
        if (!pollResp.options[body.option]) {
          res
            .status(404)
            .json({ statusCode: 404, message: "Poll option not found" });
          return;
        }
        const votesCollection = db.collection("votes");
        const voteDocumentId = `${id}:${session.user.id}`;
        const voteResp = await votesCollection.findOne({
          voteId: voteDocumentId,
        });
        if (voteResp && voteResp.option === body.option) {
          res.status(204).end();
          return;
        }
        const dbSession = startSession();
        try {
          const transactionResults = await dbSession.withTransaction(
            async () => {
              if (voteResp) {
                const updateVoteResult = await votesCollection.updateOne(
                  { _id: voteResp._id },
                  { $set: { option: body.option } },
                  { session: dbSession }
                );
                const voteCountInc: Record<string, any> = {};
                voteCountInc[`options.${body.option}.count`] = 1;
                voteCountInc[`options.${voteResp.option}.count`] = -1;
                const voteCountUpdate = await pollsCollection.updateOne(
                  { _id: new ObjectId(id) },
                  { $inc: voteCountInc },
                  { session: dbSession }
                );
              } else {
                // New vote
                const setVoteResult = await votesCollection.insertOne(
                  {
                    voteId: voteDocumentId,
                    option: body.option,
                  },
                  { session: dbSession }
                );
                const voteCountInc: Record<string, any> = {};
                voteCountInc[`options.${body.option}.count`] = 1;

                const incrementPollResult = await pollsCollection.updateOne(
                  { _id: new ObjectId(id) },
                  { $inc: voteCountInc },
                  { session: dbSession }
                );
              }
            },
            {
              readConcern: { level: "local" },

              writeConcern: { w: "majority" },
            }
          );
        } finally {
          await dbSession.endSession();
        }
        res.status(204).end();
      } catch (e) {
        if (e instanceof BSONTypeError) {
          res.status(404).json({ statusCode: 404, message: "Poll not found" });
        } else {
          throw e;
        }
      }

      break;
    default:
      res.statusCode = 405;
      res.json({ statusCode: 405, message: "Method not allowed" });
  }
}
