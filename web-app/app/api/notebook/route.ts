import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email parameter is required" },
        { status: 400 }
      );
    }

    const notebooks = await Notebook.find({ userEmail: email })
      .sort({ updatedAt: -1 })
      .select("name uuid userEmail createdAt updatedAt")
      .lean();

    return NextResponse.json(
      {
        success: true,
        data: notebooks,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching notebooks:", error);
    return NextResponse.json(
      { error: "Failed to fetch notebooks", details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const notebookId = searchParams.get("notebookId");

    if (!email || !notebookId) {
      return NextResponse.json(
        { error: "Email and notebookId parameters are required" },
        { status: 400 }
      );
    }

    const result = await Notebook.deleteOne({ 
      uuid: notebookId, 
      userEmail: email 
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Notebook not found or not authorized to delete" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Notebook deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting notebook:", error);
    return NextResponse.json(
      { error: "Failed to delete notebook", details: (error as Error).message },
      { status: 500 }
    );
  }
}
