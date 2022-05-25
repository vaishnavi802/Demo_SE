const express = require('express');
const router = express.Router();
const {User, Temp} = require('../models/User.js');
const nodemailer = require('nodemailer');
const auth = require('../middleware/auth.js');

router.post('/users', async (req, res) => {
    try{
        const user = new User(req.body);
        await user.generateAuthToken();
        const temp = new Temp({userID: user._id});
        await temp.createRandomString();
        await user.save();
        await temp.save();
        res.send({user, temp});
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.ADMIN_EMAIL,
                pass: process.env.ADMIN_PASSWORD
            }
        });
        const link = user._id + '/' + temp.randomstring;
        const mailOptions = {
            from: "demoritv1421@gmail.com",
            to: user.email,
            subject: "Verify Your Email",
            html: '<p>Click <a href="http://localhost:3000/verifyemail/' + link + '">here</a> to verify your email</p>'
        }

        transporter.sendMail(mailOptions, function (err, data) {
            if(err){
                console.log(err);
            }
            else{
                console.log('Email Sent successfully');
                res.status(201)
            }
        });
    }
    catch (error) {
        console.log(error);
        res.status(400).send(error);
    }
})

router.post('/login', async(req, res) => {
    try{
        const check = await User.isUserVerified(req.body.email);
        if(check) {
            const user = await User.findByCredentials(req.body.email, req.body.password);
            const token = await user.generateAuthToken();
            res.send({user, token});
        }
        else{
            res.status(400).send('User not verified');
        }
    }
    catch (error) {
        console.log(error);
        res.status(400).send(error);
    }
})


router.get('/verifyemail/:id/:string', async (req, res) => {
    try{
        const user_id = req.params.id;
        const randomstring = req.params.string;
        console.log({user_id, randomstring});
        const temp = await Temp.findForVerification(user_id, randomstring);
        if(temp){
            const user = await User.VerifyUser(temp.userID);
            if(user){
                console.log('user verified');
                console.log({user});
                res.send('user verified');
            }
        }
    }
    catch (error) {
        console.log(error);
        res.status(400).send(error);
    }
})

router.get('/users/me', auth, async (req, res) => {
    res.send(req.user)
})

router.get('/users/me/logout', auth, async (req, res) => {
    try{
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token != req.token;
        });
        await req.user.save();
        res.send('logged out successfully');
    }
    catch (error) {
        res.status(500).send(error)
    }
})

module.exports = router;