//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const _ = require("lodash")
const nodemailer = require('nodemailer');


const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

let msg = ""

app.get("/", function(req, res) {
    res.render("index", {msg: msg})
})

app.get("/stulog", function(req, res) {
    res.render("stulog")
})

let OTP = (Math.random().toFixed(6))*1000000

app.post("/otp", function(req, res) {
    console.log(req.body.email)
    const flag = 0
    const rec = req.body.email
    const len = rec.length
    const index = rec.indexOf("@")
    const service = rec.slice(index+1, len);
    if(service !== 'smit.smu.edu.in')
    {
        msg = 'Invalid/Unrecognized Email. Please Use The Email Provided By The University.'
        res.render('index', {msg: msg})
        return
    }
    
    var transport = nodemailer.createTransport({
        name: "smtp.mailtrap.io",
        host: "smtp.mailtrap.io",
        port: 2525,
        auth: {
          user: "6d53c54308dd2c",
          pass: "dd431d7727c793"
        }
    });
      
    var mailOptions = {
        from: '"Elect-ron Services"<>',
        to: JSON.stringify(req.body.email),
        subject: 'Verify OTP',
        text: JSON.stringify(OTP)
    };
      
    transport.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
            res.render('index')
        } 
        else {
            console.log('Email Sent: ' + info.response);
            res.render("otp")
        }
    });
})

app.post("/vote", function(req, res) {
    let tempotp = req.body.otp
    if(tempotp == OTP){
        res.render("vote")
    }
    else {
        msg = 'Invalid OTP'
        res.render('index', {msg: msg})
    }
})


app.listen(3000, function(req, res) {
    console.log("Server Started on Port 3000")
})