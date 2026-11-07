import mongoose, { Schema, Document, Model } from "mongoose";

export type UserRole = "player" | "coach" | "scout";

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [80, "Name cannot exceed 80 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [emailRegex, "Please enter a valid email address"],
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, "Password hash is required"],
      select: false, // Omit passwordHash by default on queries
    },
    role: {
      type: String,
      enum: {
        values: ["player", "coach", "scout"],
        message: "{VALUE} is not a supported role",
      },
      default: "player",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent re-compilation of model during hot reload
export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

