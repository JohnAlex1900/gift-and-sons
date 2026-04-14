import { getServerApp } from "../server/app";

export default async function handler(req: any, res: any) {
  const app = await getServerApp();
  return app(req, res);
}
