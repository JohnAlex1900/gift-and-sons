import runExpress from "../_expressProxy.js";

export default async function handler(req, res) {
  const id = Array.isArray(req.query?.id) ? req.query.id[0] : req.query?.id;

  if (typeof id !== "string" || !id) {
    return res.status(400).json({ message: "Invalid property id" });
  }

  return runExpress(req, res, `/api/properties/${id}`);
}
