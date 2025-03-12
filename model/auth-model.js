const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstname: {
      type: String,
      required: [true, "User name is required"],
    },
    lastname: {
        type: String,
        required: [true, "User name is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@gmail\.com$/,
        "Please enter a valid email",
      ],
    },
    role: {
        type: String,
        enum: ['Branch Owner', 'Rider', 'Customer', 'Salesperson'],
        required: [true, "Selecting Role is required"],
    },

    phone: {
        type: String,
        required: [true, "PhoneNo is required"],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password should be at least 6 characters long"],
    },

    activePlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      default: null, 
    },

    planActivation: {
      type: String,
      default: null
    },

    planExpiry: {
      type: String, 
      default: null, 
    },

    assignedBranch: {
      type: String,
      default: null
    },

    hasMainBranch:{
      type: Boolean,
      default: false
    },

    business: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Business', 
    },
  },
  { timestamps: true }
);


const User = mongoose.model("User", userSchema);

module.exports = User;
