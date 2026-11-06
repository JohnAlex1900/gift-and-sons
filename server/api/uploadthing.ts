import { createRouteHandler } from "uploadthing/express";
import { uploadRouter } from "../uploadthing"; // Use correct export

export default createRouteHandler({ router: uploadRouter });
