import AWS from "aws-sdk";
import { ImageAnnotatorClient } from "@google-cloud/vision";
import { User, Instance, Challan } from "../models/reqmodel.js";

const speedLimit = 80;
const helmetViolationChallanAmount = 500;
const speedViolationChallanAmount = 1000;

const uploadToS3 = async (imageData, bucketName, key) => {
  const params = {
    Bucket: bucketName,
    Key: key,
    Body: imageData,
  };
  AWS.config.update({
    accessKeyId: process.env.NEXT_PUBLIC_AWS_S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_S3_SECRET_ACCESS_KEY,
  });

  const s3 = new AWS.S3({
    params: {
      Bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME,
    },
    region: process.env.AWS_REGION,
  });

  try {
    const data = await s3.putObject(params).promise();
    return `https://${process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME}.s3.ap-south-1.amazonaws.com/${key}`;
  } catch (err) {
    console.error("Error uploading to S3:", err);
    throw new Error("Error uploading to S3");
  }
};

export const detectLabels = async (req, res) => {
  try {
    const uniqueKey = req.params.userUniqueKey;
    const user = await User.findOne({ uniqueKey });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (!req.files || !req.files.image) {
      return res.status(400).json({ error: "Image file is missing" });
    }
    const imageFile = req.files.image;
    const imageData = imageFile.data;
    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:.]/g, "").slice(0, 15);
    const bucketName = process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME;
    const key = `instances/${user.name}-${user._id}-${timestamp}.jpg`;
    const imageUrl = await uploadToS3(imageData, bucketName, key);
    const output = await labelAPI(imageUrl);

    const instance = new Instance({
      user: user._id,
      helmetStatus: output.result === "Helmet detected",
      latitude: req.body.latitude,
      longitude: req.body.longitude,
      speed: req.body.speed || null,
      bikeTilt: req.body.bikeTilt || null,
      speeding: req.body.speed > speedLimit ? true : false,
      trafficViolationStatus:
        output.result === "Helmet not detected" || req.body.speed > speedLimit
          ? true
          : false,
      imageUrl: imageUrl,
    });
    await instance.save();
    user.instances.push(instance._id);
    await user.save();

    // create challan instance if violation=true
    if (instance.trafficViolationStatus == true) {
      let challanAmount = 0;
      if (instance.helmetStatus === "Helmet not detected") {
        challanAmount += helmetViolationChallanAmount;
      }
      if (instance.speeding === true) {
        challanAmount += speedViolationChallanAmount;
      }
      const newChallan = new Challan({
        user: user._id,
        amount: challanAmount,
      });
      await newChallan.save();
      user.challans.push(newChallan._id);
      await user.save();
    }

    if (output.result == "Helmet detected") {
      return res.status(200).json({
        message: "Helmet detected",
        labels: output.allLabels,
        imageUrl,
      });
    } else {
      return res.status(200).json({
        message: "Helmet not detected",
        labels: output.allLabels,
        imageUrl,
      });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

async function labelAPI(imageUrl) {
  const credential = JSON.parse(
    Buffer.from(process.env.GOOGLE_SERVICE_KEY, "base64").toString()
  );

  const client = new ImageAnnotatorClient({
    projectId: "helmetdetection-420512",
    credentials: {
      client_email: credential.client_email,
      private_key: credential.private_key,
    },
  });

  const [labelResult] = await client.labelDetection(imageUrl);
  const [objectResult] = await client.objectLocalization(imageUrl);
  const labelLabels = labelResult.labelAnnotations.map(
    (label) => label.description
  );
  const objectLabels = objectResult.localizedObjectAnnotations.map(
    (obj) => obj.name
  );
  const allLabels = labelLabels.concat(objectLabels);
  if (allLabels.includes("Helmet")) {
    return { result: "Helmet detected", allLabels };
  } else {
    return { result: "Helmet not detected", allLabels };
  }
}
