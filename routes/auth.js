const jwt = require("jsonwebtoken");

const verifyToken = (req,res,next)=>{
    const authHeader = req.headers.token
    if(authHeader){
        const token = authHeader.split(" ")[1];
        jwt.verify(token, process.env.JWT_SECRET, (err,user) => { 
            if(err) 
                return res.status(403).json("Token is not valid");
            req.user = user;
            next(); //leave this function and go to router
        });

    } else{
        return res.status(401).json("youre not authenticated");
    }
};

module.exports = verifyToken
