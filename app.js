//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose').set("debug", true);
const _ = require("lodash")
const nodemailer = require('nodemailer');


const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static("public"));
mongoose.connect("ENTER MONGODB SRV LINK HERE", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
})

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

const adminSchema = {
    username: String,
    password: String
};
const admin = mongoose.model("admin", adminSchema);

let msg = ""
let poslen = 3

app.get("/", function (req, res) {
    msg = ""
    res.render("index", {
        msg: msg
    })
    return
})

app.get("/stulog", function (req, res) {
    res.render("stulog")
    return
})

let OTP = (Math.random().toFixed(6)) * 1000000

app.post("/otp", function (req, res) {
    console.log(req.body.email)
    console.log()
    const flag = 0
    const rec = req.body.email
    const len = rec.length
    const index = rec.indexOf("@")
    const service = rec.slice(index + 1, len);
    voter.find({}, function (err, found) {
        if (!err) {
            console.log(found)
        }
    })
    if (service !== 'smit.smu.edu.in') {
        msg = 'Invalid/Unrecognized Email. Please Use The Email Provided By The University.'
        res.render('index', {
            msg: msg
        })
        return
    } else {
        voter.findOne({
            email: rec
        }, function (err, foundVoter) {
            if (!err) {
                console.log(foundVoter)
                if (!foundVoter) {
                    msg = 'Entered Email Wasn\'t Found In The Database. Please Try Again.'
                    res.render('index', {
                        msg: msg
                    })
                    return
                } else if (foundVoter.flag == 1) {
                    msg = 'You Have Already Voted Once. Thank You For Taking Part.'
                    res.render('index', {
                        msg: msg
                    })
                    return
                } else {
                    var transport = nodemailer.createTransport({
                        service: "gmail",
                        auth: {
                            user: "ENTER USER EMAIL HERE",
                            pass: "ENTER USER PASSWORD"
                        }
                    });

                    var mailOptions = {
                        from: '"Elect-ron Services"<>',
                        to: JSON.stringify(req.body.email),
                        subject: 'Verify OTP',
                        text: JSON.stringify(OTP)
                    };

                    voter.findOneAndUpdate({
                        email: rec
                    }, {
                        flag: 1
                    }, function (err, found) {})

                    transport.sendMail(mailOptions, function (error, info) {
                        if (error) {
                            console.log(error);
                            res.render('index', {
                                msg: msg
                            })
                            return
                        } else {
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

app.post("/vote", function (req, res) {
    let tempotp = req.body.otp
    if (tempotp == OTP) {
        candidate.find({}, function (err, found) {
            if (!err) {
                let distinctPos = []
                count = 0
                distinctPos.push(found[0].position)
                for (var i = 1; i < found.length; i++) {
                    let flag = 0
                    for (var j = 0; j < count + 1; j++) {
                        if (found[i].position == distinctPos[j]) {
                            flag = 1
                        }
                    }
                    if (flag == 0) {
                        distinctPos.push(found[i].position)
                        count++
                    }
                }
                poslen = count + 1
                res.render("vote", {
                    found: found,
                    distinctPos: distinctPos
                })
                return
            }
        })
    } else {
        msg = 'Invalid OTP'
        res.render('index', {
            msg: msg
        })
        return
    }
})



app.post("/results", function (req, res) {
    for (let i = 0; i < poslen; i++) {
        let reqid = req.body[i]
        console.log(poslen)
        console.log(reqid)
        candidate.findOneAndUpdate({
            _id: reqid
        }, {
            $inc: {
                votes: 1
            }
        }, function (err, found) {})
    }
    msg = 'Thank You For Voting! Check The Tally For Current Results.'
    res.render('index', {
        msg: msg
    })
})

app.get("/tally", function (req, res) {
    candidate.find({}, function (err, found) {
        if (!err) {
            let distinctPos = []
            count = 0
            distinctPos.push(found[0].position)
            for (var i = 1; i < found.length; i++) {
                let flag = 0
                for (var j = 0; j < count + 1; j++) {
                    if (found[i].position == distinctPos[j]) {
                        flag = 1
                    }
                }
                if (flag == 0) {
                    distinctPos.push(found[i].position)
                    count++
                }
            }
            poslen = count + 1
            res.render("result", {
                found: found,
                distinctPos: distinctPos
            })
            return
        }
    })
})

app.get("/admlog", function (req, res) {
    res.render("admlog")
    return
})

app.post("/adminverify", function (req, res) {
    user = req.body.username
    pass = req.body.pass
    admin.findOne({
        username: user
    }, function (err, found) {
        if (!err) {
            if (found.password == pass) {
                msg = ""
                res.render("manage", {
                    msg: msg
                })
                return
            } else {
                msg = "Invalid Credentials. Please Try Again."
                res.render("index", {
                    msg: msg
                })
                return
            }
        }
    })
})

app.get("/addcan", function (req, res) {
    res.render("candidate")
    return
})

app.post("/addingcan", function (req, res) {
    name = req.body.name
    pos = req.body.position
    candidate.findOne({
        name: name
    }, function (err, found) {
        if (!err) {
            if (found) {
                msg = "Candidate Already Exists"
                res.render("manage", {
                    msg: msg
                })
                return
            } else {
                let candi = new candidate({
                    position: pos,
                    name: name,
                    votes: 0
                })
                candi.save()
                msg = "Candidate Created"
                res.render("manage", {
                    msg: msg
                })
                return
            }
        }
    })
})

app.get("/remcan", function (req, res) {
    res.render("removecandidate")
    return
})

app.post("/removingcan", function (req, res) {
    name = req.body.name
    pos = req.body.position
    candidate.findOne({
        name: name,
        position: pos
    }, function (err, found) {
        if (!err) {
            if (!found) {
                msg = "Candidate Does Not Exist"
                res.render("manage", {
                    msg: msg
                })
                return
            } else {
                candidate.deleteOne({
                    name: name,
                    position: pos
                }, function (err) {
                    if (!err) {
                        msg = "Candidate Successfully Deleted"
                        res.render("manage", {
                            msg: msg
                        })
                        return
                    } else {
                        console.log(err)
                    }
                })
            }
        }
    })
})

app.post("/reset", function (req, res) {
    candidate.updateMany({}, {
        votes: 0
    }, function (err) {})
    voter.updateMany({}, {
        flag: 0
    }, function (err) {})
    msg = "Votes Have Been Reset."
    res.render("manage", {
        msg: msg
    })
    return
})

app.listen(3000, function (req, res) {
    console.log("Server Started on Port 3000")
})
