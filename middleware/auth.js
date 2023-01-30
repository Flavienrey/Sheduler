module.exports = (req, res, next) => {
    try {
        if(!req?.session?.user){
            throw 'Invalid user ID';
        } else {
            next();
        }
    } catch {
        res.status(401).render("failedAuthentication");
    }
};