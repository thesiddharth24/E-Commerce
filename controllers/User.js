const { User } = require('./../models/User');

exports.fetchUserById = async (req, res) => {
    const {id} = req.user;
  try {
    const user = await User.findById(id , 'name email id')
    res.status(200).json({id:user.id,addresses:user.addresses,email:user.email,role:user.role});
  } catch (err) {
    res.status(400).json(err);
  }
};




  exports.updateUser = async(req,res) => {
    const {id} = req.params;

    try {
        const user = await User.findOneAndUpdate(id,req.body , {new: true} );
        res.status(201).json(user);
      } catch (err) {
        res.status(400).json(err);
      }
}