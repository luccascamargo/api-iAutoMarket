import express, { Request, Response, NextFunction } from "express";

import { router } from "./routes";

const app = express();

const port = process.env.PORT || 3000;

app.use((req: Request, res: Response, next: NextFunction): void => {
  if (req.originalUrl === "/stripe_webhooks") {
    next();
  } else {
    express.json()(req, res, next);
  }
});
app.use(router);

app.listen(Number(port), () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
