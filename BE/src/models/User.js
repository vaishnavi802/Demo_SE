const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const validator = require('validator');
const { log } = require('console');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Email is invalid');
            }
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 7
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    isAdminUser:{
        type: Boolean,
        default: false
    },
    isClubUser: {
        type: Boolean,
        default: false
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
})

const tempSchema = new mongoose.Schema({
    userID: {
        type: String,
        required: true
    },
    randomstring: {
        type: String,
        required: true
    }
})


userSchema.pre('save', async function(next) {
    const user = this;
    if(user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8);
    }
    next();
})

userSchema.methods.generateAuthToken = async function() {
    const user = this;
    const token = jwt.sign({_id: user._id}, process.env.SECRET_KEY);
    user.tokens = user.tokens.concat({token});
    await user.save();
    return token;
}

userSchema.statics.isUserVerified = async function(email) {
    const user = await User.findOne({email: email});
    if(!user) {
        throw new Error('User not found');
    }
    return user.isVerified;
}

userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({email: email});
    if(!user) {
        throw new Error('User not found');
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch) {
        throw new Error('Password is incorrect');
    }
    return user;
}

tempSchema.methods.createRandomString = async function() {
    const temp = this;
    const string = crypto.randomBytes(4).toString('hex');
    temp.randomstring = string;
    await temp.save();
    return string;
}

tempSchema.statics.findForVerification = async function (id, randomstring) {
    const temp = await Temp.findOne({userID: id, randomstring: randomstring});
    await Temp.deleteOne({userID: id, randomstring: randomstring});
    if(!temp){
        console.log('Temp not found');
    }
    else{
        return temp;
    }
}

userSchema.statics.VerifyUser = async function (id) {
    await User.findOneAndUpdate({_id: id}, {isVerified: true});
    const user = await User.findById(id);
    if(!user){
        console.log('User not found');
    }
    else{
        console.log('User Verified');
        return user;
    }
}


const User = mongoose.model('User', userSchema);
const Temp = mongoose.model('Temp', tempSchema);

module.exports = {User, Temp};