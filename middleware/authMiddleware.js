const jwt = require('jsonwebtoken');
const secretKey = "DiverseDen";



function verifyToken(req, res, next) {
    const authHeader = req.header("Authorization");
    if (!authHeader) {
        return res.status(401).json({
            message: "Access Denied! header empty",
        });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
        return res.status(401).json({
            message: "Access Denied! Token missing",
        });
    }

    try {
        const decoded = jwt.verify(token, secretKey);

        req.user = decoded;

        next();
    } catch (error) {
        return res.status(403).json({
            message: "Invalid or expired token",
            error: error.message,
        });
    }
}


module.exports = verifyToken;