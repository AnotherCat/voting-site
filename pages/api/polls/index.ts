import { JTDSchemaType } from "ajv/dist/core";
import { Db, ObjectID } from "mongodb";
import { NextApiRequest, NextApiResponse } from "next";
import { Session } from "next-auth";
import { getSession } from "next-auth/react";
import { string } from "prop-types";
import { connect } from "../../../lib/mongodb";
import validateSchema from "../../../lib/validateSchema";

interface VoteItem {
  name: string;
  description: string;
}

export interface VoteItemWithCount extends VoteItem {
  count: number;
}

interface CreateVoteBodyType {
  name: string;
  options: VoteItem[];
  endTime: number;
}

interface CreateVoteBodyWithCountType extends CreateVoteBodyType {
  options: VoteItemWithCount[];
}

const createVoteBody: JTDSchemaType<CreateVoteBodyType> = {
  properties: {
    name: {
      type: "string",
    },
    options: {
      elements: {
        properties: {
          name: {
            type: "string",
          },
          description: {
            type: "string",
          },
        },
      },
    },
    endTime: {
      type: "int32",
    },
  },
};
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  let db: Db;
  switch (req.method) {
    case "GET":
      // Get polls
      // Querystrings: `skip` and `limit`
      // Not locked

      let limit: number = 100;
      if (typeof req.query.limit === "string") {
        const num = parseFloat(req.query.limit);
        if (!Number.isNaN(num) && Number.isFinite(num)) {
          limit = num;
        }
      }
      let skip: number | undefined = undefined;
      if (typeof req.query.skip === "string") {
        const num = parseFloat(req.query.skip);
        if (!Number.isNaN(num) && Number.isFinite(num)) {
          skip = num;
        }
      }
      db = await connect();
      const polls = db.collection("polls");
      let cursor = polls
        .find({})
        .sort({ _id: -1 })
        .limit(limit)
        .project({ name: 1, endTime: 1 });
      if (skip) {
        cursor = cursor.skip(skip);
      }
      const result = await cursor.toArray();

      res.json(result);
      break;

    case "POST":
      // create new vote
      // Locked to "staff" only

      const session = await getSession({ req });
      if (!session) {
        res.status(401).json({ statusCode: 401, message: "Unauthorized" });
        return;
      }
      if (!process.env.STAFF_USER_IDS?.includes(session.user.id)) {
        res.status(403).json({ statusCode: 403, message: "Access Forbidden" });
        return;
      }

      if (!validateSchema(createVoteBody, req.body)) {
        res
          .status(400)
          .json({ statusCode: 400, message: "Invalid request body" });

        return;
      }
      const body = req.body as CreateVoteBodyType;
      if (body.options.length < 1 || body.options.length > 25) {
        res.status(400).json({
          statusCode: 400,
          message: `body.options has too ${
            body.options.length < 1 ? "little" : ""
          }${
            body.options.length > 25 ? "many" : ""
          } items. It must have between 1 and 25 items`,
        });

        return;
      }

      const doc: {
        name: string;
        options: Record<number, VoteItemWithCount>;
        endTime: number;
      } = {
        name: body.name,
        options: {},
        endTime: body.endTime,
      };

      body.options.forEach((option, index) => {
        doc.options[index] = {
          ...option,
          count: 0,
        };
      });
      db = await connect();

      const resp = await db.collection("polls").insertOne(doc);
      res.send({ id: resp.insertedId });
      break;
    default:
      res.statusCode = 405;
      res.json({ statusCode: 405, message: "Method not allowed" });
  }
}
