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
        enum: ['Branch Owner', 'Rider', 'Customer'],
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
      type: Date,
      default: null
    },

    planExpiry: {
      type: Date, 
      default: null, 
    },

    business: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Business', 
    },
  },
  { timestamps: true }
);

// userSchema.methods.toJSON = function () {
//   const user = this.toObject();
//   if (user.role !== 'Branch Owner') {
//       delete user.business;
//   }
//   return user;
// };

const User = mongoose.model("User", userSchema);

module.exports = User;
