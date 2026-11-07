import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IPlayer extends Document {
  userId: Types.ObjectId;
  sport: string;
  position: string;
  dateOfBirth?: Date;
  jerseyNumber?: number;
  status: "active" | "injured" | "trial" | "inactive";
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PlayerSchema = new Schema<IPlayer>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Player must be linked to a User account"],
      unique: true,
      index: true,
    },
    sport: {
      type: String,
      required: [true, "Sport is required"],
      trim: true,
      default: "Football",
    },
    position: {
      type: String,
      trim: true,
      default: "Unassigned",
    },
    dateOfBirth: {
      type: Date,
    },
    jerseyNumber: {
      type: Number,
      min: [0, "Jersey number cannot be negative"],
      max: [999, "Jersey number cannot exceed 999"],
    },
    status: {
      type: String,
      enum: {
        values: ["active", "injured", "trial", "inactive"],
        message: "{VALUE} is not a valid player status",
      },
      default: "active",
      index: true,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [500, "Bio cannot exceed 500 characters"],
    },
  },
  {
    timestamps: true,
  }
);

PlayerSchema.index({ sport: 1, status: 1 });

// Prevent re-compilation of model during hot reload
export const Player: Model<IPlayer> =
  mongoose.models.Player || mongoose.model<IPlayer>("Player", PlayerSchema);

