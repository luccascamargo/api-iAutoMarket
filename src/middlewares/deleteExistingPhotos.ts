import { Request, Response, NextFunction } from "express";
import { deleteFiles } from "./cloudS3";

export async function deletePhotos(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { photos } = req.body;

  const arrayPhotos: any = [];

  if (photos.length < 0) {
    return res.status(404).json({ error: "Invalid photos" });
  }

  photos.map((photo: any) => {
    arrayPhotos.push({
      Key: photo.field_name,
      VersionId: photo.version_id,
    });
  });

  const params = {
    Bucket: process.env.BUCKET,
    Delete: {
      Objects: arrayPhotos,
    },
  };

  const { success } = await deleteFiles(params);

  if (!success) {
    return res
      .json({ error: "Erro ao tentar deletar fotos que nao existem" })
      .sendStatus(500);
  }

  next();
  return;
}
