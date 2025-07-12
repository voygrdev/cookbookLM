import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

const MONGODB_URI =
  process.env.MONGODB_URL || "mongodb://localhost:27017/cookbookLM";

if (mongoose.connection.readyState === 0) {
  mongoose
    .connect(MONGODB_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("MongoDB connection error:", err));
}

const NotebookSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  uuid: {
    type: String,
    required: true,
    unique: true,
  },
  userEmail: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  content: {
    type: String,
    default: "",
  },
});

const Notebook =
  mongoose.models.Notebook || mongoose.model("Notebook", NotebookSchema);

const NotebookInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validationResult = NotebookInputSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    const { name, email } = validationResult.data;

    const uuid = uuidv4();

    const newNotebook = new Notebook({
      name,
      uuid,
      userEmail: email,
    });

    await newNotebook.save();

    return NextResponse.json(
      {
        success: true,
        data: {
          name,
          uuid,
          userEmail: email,
          createdAt: newNotebook.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating notebook:", error);
    return NextResponse.json(
      { error: "Failed to create notebook", details: (error as Error).message },
      { status: 500 }
    );
  }
}
