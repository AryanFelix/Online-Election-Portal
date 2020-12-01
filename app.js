//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose').set("debug",true);
const _ = require("lodash")
const nodemailer = require('nodemailer');


const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
mongoose.connect("mongodb+srv://admin-aryan:test123@election-database.xbzb6.mongodb.net/election?retryWrites=true&w=majority", {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false})

const voterSchema = {
    email: String,
    flag: Number
};
const voter = mongoose.model("voter", voterSchema);

const candidateSchema = {
    position: String,
    name: String,
    votes: Number
};
const candidate = mongoose.model("candidate", candidateSchema);

let msg = ""
let poslen = 3

app.get("/", function(req, res) {
    res.render("index", {msg: msg})
    return
})

app.get("/stulog", function(req, res) {
    res.render("stulog")
    return
})

let OTP = (Math.random().toFixed(6))*1000000

app.post("/otp", function(req, res) {
    console.log(req.body.email)
    console.log()
    const flag = 0
    const rec = req.body.email
    const len = rec.length
    const index = rec.indexOf("@")
    const service = rec.slice(index+1, len);
    voter.find({}, function(err, found) {
        if(!err) {
            console.log(found)
        }
    })
    if(service !== 'smit.smu.edu.in')
    {
        msg = 'Invalid/Unrecognized Email. Please Use The Email Provided By The University.'
        res.render('index', {msg: msg})
        return
    }
    else {
        voter.findOne({email: rec}, function(err, foundVoter) {
            if(!err) {
                console.log(foundVoter)
                if(!foundVoter) {
                    msg = 'Entered Email Wasn\'t Found In The Database. Please Try Again.'
                    res.render('index', {msg: msg})
                    return
                }
                else if(foundVoter.flag == 1) {
                    msg = 'You Have Already Voted Once. Thank You For Taking Part.'
                    res.render('index', {msg: msg})
                    return
                }
                else {
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
                            return
                        } 
                        else {
                            console.log('Email Sent: ' + info.response);
                            res.render("otp")
                            return
                        }
                    });
                }
            }
        })
    }
})

app.post("/vote", function(req, res) {
    let tempotp = req.body.otp
    if(tempotp == OTP){
        candidate.find({}, function(err, found) {
            if(!err) {
                let distinctPos = []
                count = 0
                distinctPos.push(found[0].position)
                for(var i=1; i<found.length; i++){
                    if(found[i].position != distinctPos[count]) {
                        distinctPos.push(found[i].position)
                        count++
                    }
                }
                poslen = count + 1
                res.render("vote", {found: found, distinctPos: distinctPos})
                return
            }
        })
    }
    else {
        msg = 'Invalid OTP'
        res.render('index', {msg: msg})
        return
    }
})



app.post("/", function(req, res) {
    for(let i=0; i<poslen; i++) {
        let reqid = req.body[i]
        console.log(poslen)
        console.log(reqid)
        candidate.findOneAndUpdate({_id: reqid},{$inc : {votes : 1}}, function(err, found){
            if(!err) {
                msg = "Thank You For Voting!"
                res.render("index", {msg: msg})
                return
            }
        })
    }
})


app.listen(3000, function(req, res) {
    console.log("Server Started on Port 3000")
})