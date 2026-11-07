import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IPracticeSession extends Document {
  title: string;
  sport: string;
  date: Date;
  status: "open" | "closed";
  attendeePlayerIds: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const PracticeSessionSchema = new Schema<IPracticeSession>(
  {
    title: {
      type: String,
      required: [true, "Session title is required"],
      trim: true,
    },
    sport: {
      type: String,
      required: true,
      trim: true,
      default: "Football",
    },
    date: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open",
      index: true,
    },
    attendeePlayerIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Player",
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const PracticeSession: Model<IPracticeSession> =
  mongoose.models.PracticeSession ||
  mongoose.model<IPracticeSession>("PracticeSession", PracticeSessionSchema);

