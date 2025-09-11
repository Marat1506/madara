import { RequestHandler } from "express";
import { DemoResponse } from "../../../shared/api";
import { SchoolModel } from "../models";

export const handleDemo: RequestHandler = (req, res) => {
  const response: DemoResponse = {
    message: "Hello from Express server",
  };
  res.status(200).json(response);
};

// Simple unauthenticated test insert to verify MongoDB persistence via Postman
export const handleDemoSave: RequestHandler = async (req, res, next) => {
  try {
    const {
      name = `Test School ${new Date().toISOString()}`,
      type = "madrasa",
      foundedYear = new Date().getFullYear(),
      languages = ["ar"],
      address = "",
      phone = "",
      email = ""
    } = req.body ?? {};

    const school = new SchoolModel({
      name,
      type,
      foundedYear,
      languages,
      address,
      phone,
      email
    });

    const saved = await school.save();
    res.status(201).json({ success: true, data: saved.toJSON() });
  } catch (error) {
    next(error);
  }
};
