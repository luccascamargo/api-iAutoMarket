import AWS from "aws-sdk";
import multer from "multer";
import s3Storage from "multer-sharp-s3";

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: "sa-east-1",
});

const s3 = new AWS.S3();

export const upload = multer({
  storage: s3Storage({
    Bucket: process.env.BUCKET,
    multiple: true,
    s3,
    ACL: "public-read",
    resize: {
      width: 600,
      height: 600,
    },
  }),
  limits: {
    fileSize: 1024 * 1024 * 1024,
  },
  fileFilter: function (req, file, cb) {
    const type = file.mimetype;
    if (type === "image/jpeg" || type === "image/jpg" || type === "image/png") {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error("Invalid type"));
    }
  },
});

export const deleteFiles = async (object: any) => {
  try {
    await s3.deleteObjects(object).promise();
    return { success: true, data: "Arquivos deletados com sucesso" };
  } catch (error) {
    return { success: false, data: { message: "Falha na exclusão" } };
  }
};
