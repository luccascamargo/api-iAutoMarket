import { NextFunction, Request, Response } from "express";

import { prisma } from "../utils/prisma";

export async function getPhotosInAdvert(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { id } = req.body;
  try {
    const photos = await prisma.photos.findMany({
      where: {
        advert_id: id,
      },
    });

    req.body.photos = photos;

    next();
  } catch (err) {
    return res.status(404).send("Anuncio nao encontrado");
  }
}
