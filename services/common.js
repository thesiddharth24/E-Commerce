
//     exports.isAuth = (req,res,done) => {
//     if(req.user){
//         done()
//     }else{
//         res.send(401)
//     }
// };

const passport = require('passport');
exports.isAuth = (req,res,done) => {
    return passport.authenticate('jwt');
};

exports.sanitizeUser = (user) => {
    return ({id: user.id , role:user.role})
}