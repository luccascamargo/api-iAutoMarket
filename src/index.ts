import express, { Request, Response, NextFunction } from "express";
import cors from "cors";

import { router } from "./routes";

const app = express();

const port = process.env.PORT || 3000;

const allowedOrigins = [
  "capacitor://localhost",
  "ionic://localhost",
  "http://localhost",
  "http://localhost:8080",
  "http://localhost:8100",
];

// Reflect the origin if it's in the allowed list or not defined (cURL, Postman, etc.)
const corsOptions = {
  origin: ({ origin, callback }: any) => {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Origin not allowed by CORS"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  exposedHeaders: ["set-cookie"],
};

app.options("*", cors(corsOptions));

app.use((req: Request, res: Response, next: NextFunction): void => {
  if (req.originalUrl === "/webhook-stripe") {
    next();
  } else {
    express.json()(req, res, next);
  }
});
app.use(cors());
app.use(router);

app.listen(Number(port), "0.0.0.0", () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
