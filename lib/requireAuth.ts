import { NextApiRequest } from "next";
import { getSession } from "next-auth/react";

export async function requireAuth(request: NextApiRequest) {
  const session = await getSession({ req: request });
  if (!session) {
    return false;
  } else {
    return true;
  }
}
