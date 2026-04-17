import { createRouteHandler } from "uploadthing/express";
import { uploadRouter } from "../uploadthing.js"; // Use correct export
export default createRouteHandler({ router: uploadRouter });
