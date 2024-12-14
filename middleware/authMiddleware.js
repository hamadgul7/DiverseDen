const jwt = require('jsonwebtoken');
const secretKey = "DiverseDen";

// function verifyToken(req, res, next){
//     const token = req.header("Authorization")?.split(" ")[1];
//     if(!token){
//         return res.status(401).json({
//             message: "Access Denied! unauthorized user"
//         })
//     }

//     try{
//         const decoded = jwt.verify(token, secretKey);
//         req.user = decoded;
//         next();
//     }
//     catch(error){
//         res.status(400).json({message: error.message})
//     }
// }

function verifyToken(req, res, next) {
    const authHeader = req.header("Authorization");
    // Check if the Authorization header exists
    if (!authHeader) {
        return res.status(401).json({
            message: "Access Denied! header empty",
        });
    }

    // Extract the token from the Bearer scheme
    const token = authHeader.split(" ")[1];
    if (!token) {
        return res.status(401).json({
            message: "Access Denied! Token missing",
        });
    }

    try {
        // Verify the token
        const decoded = jwt.verify(token, secretKey);

        // Attach the user information to the request object
        req.user = decoded;

        // Pass control to the next middleware or route
        next();
    } catch (error) {
        // Handle token verification errors
        return res.status(403).json({
            message: "Invalid or expired token",
            error: error.message,
        });
    }
}


module.exports = verifyToken;