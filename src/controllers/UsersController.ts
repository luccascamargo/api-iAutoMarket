import { Request, Response } from "express";
import { prisma } from "../utils/prisma";

export class UsersController {
  async index(req: Request, res: Response) {
    try {
      const users = await prisma.users.findMany();

      return res.status(200).json(users);
    } catch (err) {
      console.log(err);

      return res.status(400).json({ message: "Nenhum usuário encontrado" });
    }
  }

  async findUserPerId(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = await prisma.users.findFirst({
        where: {
          id,
        },
        include: {
          adverts: {
            include: {
              photos: true,
            },
          },
        },
      });

      return res.status(200).json(user);
    } catch (err) {
      console.log(err);

      return res.status(400).json({ message: "Nenhum usuário encontrado" });
    }
  }

  async updateUSer(req: Request, res: Response) {
    try {
      const { email, phone } = req.body.data;
      const user = await prisma.users.update({
        where: {
          email,
        },
        data: {
          phone,
        },
      });

      return res.status(200).json(user);
    } catch (err) {
      console.log(err);
      return res.status(400).json({ message: "Usuario nao econtrado" });
    }
  }
}
