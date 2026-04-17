import runExpress from "../_expressProxy.js";

export default async function handler(req, res) {
  return runExpress(req, res, "/api/properties/featured");
}
