const User = require('../model/auth-model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createToken } = require('../config/jwt');
const secretKey = "DiverseDen";

async function signup(req, res) {
  const { firstname, lastname, email, role, phone, password } = req.body;
  
  try {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Email Already Taken" });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = new User({
          firstname, 
          lastname, 
          email, 
          role, 
          phone, 
          password: hashedPassword,
      });

      const newUser = await user.save();

      res.status(201).json({
        user: newUser,
        message: "User created successfully",
      });
  } 
  catch (error) {
    res.status(400).json({ message: error.message });
  }
};

async function login(req, res){
  const { email, password } = req.body;

  try{
      const user = await User.findOne({email});
      if(!user){
        return res.status(400).json({message: "User Not Found"})
      }

      const isPasswordValid = await bcrypt.compare(password, user.password)
      if(!isPasswordValid){
        return res.status(400).json({message: "Invalid Password"})
      }

      const {password: _, ...userInfo} = user.toObject();

      const token = createToken(user._id);
      res.status(201).json({
        user: userInfo,
        token,
        message: "Login Sucessful"
      })
  }
  catch(error){
    res.status(500).json({message: error.message})
  } 
}

async function verifyTokenRefresh(req, res) {
  const token = req.header("Authorization")?.split(" ")[1];
  if(!token){
      return res.status(401).json({
          message: "Access Denied! unauthorized user"
      })
  }

  try{

      const decoded = jwt.decode(token);
      if (!decoded) {
        return res.status(400).json({ message: "Invalid token." });
      }

      if (decoded.exp * 1000 < Date.now()) {
        return res.status(401).json({ message: "Token has expired." });
      }

      const verified = jwt.verify(token, secretKey);
      req.user = verified;
      const userId = req.user.id;
      const user = await User.findOne({_id: userId});
      if(!user){
        res.status(404).json({message: "No user Found!"})
      }

      const { password: _, ...userInfo } = user.toObject();
      res.status(201).json({
        user: userInfo,
        message: "User Data.."
      })
  }
  catch(error){
      res.status(400).json({message: error.message})
  }
}

// async function getUser(req, res) {
//   const { userId } = req.body
//   try {
//       const user = await User.findOne({_id: userId}); // Retrieve the logged-in user
//       if (!user) {
//           return res.status(404).json({ message: "User not found" });
//       }

//       res.status(200).json({user}); // Will automatically exclude businessId if not a Branch Owner
//   } catch (error) {
//       res.status(400).json({ message: error.message });
//   }
// }


module.exports = {
  signup: signup,
  login: login,
  verifyTokenRefresh: verifyTokenRefresh,
  // getUser: getUser
};
