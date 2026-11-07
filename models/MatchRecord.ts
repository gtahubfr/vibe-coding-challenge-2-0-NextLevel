import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IMatchRecord extends Document {
  opponent: string;
  sport: string;
  date: Date;
  ourScore: number;
  opponentScore: number;
  playerIds: Types.ObjectId[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MatchRecordSchema = new Schema<IMatchRecord>(
  {
    opponent: {
      type: String,
      required: [true, "Opponent name is required"],
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
    ourScore: {
      type: Number,
      required: true,
      min: [0, "Score cannot be negative"],
    },
    opponentScore: {
      type: Number,
      required: true,
      min: [0, "Score cannot be negative"],
    },
    playerIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Player",
      },
    ],
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const MatchRecord: Model<IMatchRecord> =
  mongoose.models.MatchRecord ||
  mongoose.model<IMatchRecord>("MatchRecord", MatchRecordSchema);

