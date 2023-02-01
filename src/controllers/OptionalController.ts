import { Request, Response } from "express";
import { prisma } from "../utils/prisma";

export class OptionalController {
  async index(req: Request, res: Response) {
    try {
      const optionals = await prisma.optional.findMany();

      res.status(200).json(optionals);
    } catch (err) {
      console.log(err);
      res
        .status(400)
        .json({ message: "Algo de errado aconteceu. (index optional)" });
    }
  }
  async store(req: Request, res: Response) {
    try {
      const { name } = req.body;

      const optional = await prisma.optional.create({
        data: {
          name,
        },
      });

      res.status(200).json(optional);
    } catch (err) {
      console.log(err);
      res
        .status(400)
        .json({ message: "Algo de errado aconteceu. (store optional)" });
    }
  }
}
