var users = [];
var pages;
var currentAccount;
//var forgotPassAccount;

// Particle connectivity code
var particle;
var token = 'ed880e5f3f1f3ff58eb55857b566e4add8a2b93b';
var deviceID = '370040000351353530373132';

var tempTimer;
var timeTimer;
var modeTimer;
var motionTimer;

var isClock = true;

//var timeNow = "";
//var tempNow = "";
//var motionNow = "";
var modeNow = "";
var motionAndTempNow = "";

// Call back function for login success/failure
function loginSuccess(data) {
    
    

    // tell photon to start publishing 
    var publishEventPr = particle.publishEvent({
        name: 'sending',
        data: "start",
        auth: token,
        isPrivate: true
    });

    publishEventPr.then(
        function (data) {
            if (data.body.ok) {
                console.log("Event published succesfully (start)");
            }
        },
        function (err) {
            console.log("Failed to publish event (start): " + err);
        }
    );


    console.log('API call completed on promise resolve - logged in: ', data.body.access_token);
    token = data.body.access_token;

    console.log("logged in successfully!");

    //Recieves MODE from Particle
    particle.getEventStream({
        deviceId: deviceID,
        auth: token,
    }).then(function (stream) {
        stream.on('mode', function (data) {
            //Recieves PINGs from Particle
            if (data.data == "PING") {
                console.log("PING");
                // send push notification
                if (currentAccount.ping == true) {
                    alert("PING");
                }
            } else {
                console.log("mode recieved");
                modeNow = data.data;
                document.getElementById('currentModeStatus').innerHTML = modeNow;
            }


        });
    });

    var tempNow = "";
    var motionNow = "";
    var motionPrev = "no";
    //Recieves MOTION, TIME and TEMPERATURE from Particle
    particle.getEventStream({
        deviceId: deviceID,
        auth: token,
    }).then(function (stream) {
        stream.on('motionAndTemp', function (data) {
            console.log("temp and motion recieved");
            motionAndTemp = data.data;
            var fields = motionAndTemp.toString().split(';'); // parse data
            tempNow = fields[0];
            motionNow = fields[1];
            var timeNow = fields[2];
            console.log(tempNow);
            console.log(motionNow);

            if (currentAccount.motion == true) {
                if ((motionNow != motionPrev) && motionNow == "yes") {
                    // send push notification about motion change
                    alert("Motion detected!");
                }

            }

            if (currentAccount.temp == true) {
                if (tempNow < currentAccount.tempUnder) {
                    // send push notification about temp range transgression
                    alert("Cold Temperature Alert");
                } else if (tempNow > currentAccount.tempOver) {
                    alert("Hot Temperature Alert");
                }
            }

            document.getElementById('currentTempNum').innerHTML = tempNow;
            document.getElementById('motionStatIsDetect').innerHTML = motionNow;
            document.getElementById('currentTime').innerHTML = timeNow;
            //motionTimer = setInterval(updateMotion, 1010);

            motionPrev = motionNow;

        });
    });


}

function loginError(error) {
    alert("Cannot log in, please refresh");
    console.log('API call completed on promise fail - cannot log in: ', error);
}

window.onload = function () {
    console.log("Window Loaded successfully");
    pages = ["login", "passwordRecov", "signup", "thanks", "status", "settings"];
    // Initially hide all pages except for login page
    var x = document.getElementById('login');
    for (i = 0; i < pages.length; i++) {
        var n = document.getElementById(pages[i]);
        // don't hide current page!
        if (x != n) {
            n.style.display = 'none';
        }
    }

    // setup button functionality
    document.getElementById("loginButt").addEventListener("click", validate);
    document.getElementById("signUpButt").addEventListener("click", toSignUp);
    document.getElementById("forgotButt").addEventListener("click", toPassword);
    document.getElementById("recoverButt").addEventListener("click", sentPassword);
    document.getElementById("settingsButt").addEventListener("click", toSettings);
    document.getElementById("registerButt").addEventListener("click", create);
    document.getElementById("save").addEventListener("click", save);
    document.getElementById("logOutButt").addEventListener("click", toLogin);
    document.getElementById("back1").addEventListener("click", toLogin);
    document.getElementById("back2").addEventListener("click", toStatus);
    document.getElementById("back3").addEventListener("click", toLogin);
    document.getElementById("back4").addEventListener("click", toLogin);
    document.getElementById("toggleMode").addEventListener("click", switchMode);
};

var admin = new person(
    "admin",
    "admin@admin.com",
    "admin",
    "1234",
    "987654321",
    "4321",

    // preferences
    true,
    false,
    false,
    65,
    75
)
users.push(admin);

// when mode button is pressed trigger photon to change modes
function switchMode() {
    isClock = !isClock;
    if (isClock == true) {
        document.getElementById('currentModeStatus').innerHTML = "Clock";
    } else {
        document.getElementById('currentModeStatus').innerHTML = "Kid";
    }
    // tell photon to stop publishing anything
    var publishEventPr = particle.publishEvent({
        name: 'modeChange',
        data: "switch",
        auth: token,
        isPrivate: true
    });

    publishEventPr.then(
        function (data) {
            if (data.body.ok) {
                console.log("Event published succesfully (switch)");
            }
        },
        function (err) {
            console.log("Failed to publish event (switch): " + err);
        }
    );
}

// loads saved preferences
function loadPreferences() {
    var isPing = currentAccount.ping;
    var isMotion = currentAccount.motion;
    var isTemp = currentAccount.temp;
    var tempUnder = currentAccount.tempUnder;
    var tempOver = currentAccount.tempOver;

    console.log(currentAccount.username);

    if (currentAccount.ping == true) {
        document.getElementById("ping").checked = true;
    } else {
        document.getElementById("ping").checked = false;
    }

    if (currentAccount.motion == true) {
        document.getElementById("motion").checked = true;
    } else {
        document.getElementById("motion").checked = false;
    }

    if (currentAccount.temp == true) {
        document.getElementById("temp").checked = true;
        document.getElementById("tempLow").value = currentAccount.tempUnder;
        document.getElementById("tempHigh").value = currentAccount.tempOver;
    } else {
        document.getElementById("temp").checked = false;
        document.getElementById("tempLow").value = currentAccount.tempUnder;
        document.getElementById("tempHigh").value = currentAccount.tempOver;
    }

}

//save preferences
function save() {
    setPing();
    setMotion();
    setTemp();

}

function setPing() {
    if (document.getElementById("ping").checked == true) {
        currentAccount.ping = true;

    } else {
        currentAccount.ping = false;
    }
}

function setMotion() {
    if (document.getElementById("motion").checked == true) {
        currentAccount.motion = true;

    } else {
        currentAccount.motion = false;
    }
}



function setTemp() {
    if (document.getElementById("temp").checked == true) {
        var q = document.getElementById("tempLow").value;
        var p = document.getElementById("tempHigh").value
        if (isNaN(q) || isNaN(p) || p <= q) {
            alert("Please input valid temperature range!");
        } else {
            alert("Preferences saved");
            currentAccount.temp = true;
            currentAccount.tempUnder = q;
            currentAccount.tempOver = p;
        }
    } else {
        alert("Preferences saved");
        currentAccount.temp = false;
    }
}

// Check if login information is correct when logging in
function validate() {
    var inputusername = document.getElementById("username").value;
    var inputpassword = document.getElementById("password").value;
    for (var i = 0; i < users.length; i++) {
        // if user exists and password is correct/matches with the user
        if (inputusername == users[i].username && inputpassword == users[i].password) {
            //set current account;
            currentAccount = users[i];
            toStatus();
            break;
            // if reach the end of the array without right login keys send alert
        } else if (i == users.length - 1) {
            alert("Your username or password is incorrect.");
        }
    }
}

// create new account object
function create() {

    var newname = document.getElementById("newName").value;
    var newemail = document.getElementById("newEmail").value;
    var newusername = document.getElementById("newUsername").value;
    var newpassword = document.getElementById("newPassword").value;
    var newpasswordcopy = document.getElementById("newPasswordcopy").value;
    var newphonenumber = document.getElementById("newPhone").value;
    var newNanoID = document.getElementById("newID").value;

    if (newpassword !== newpasswordcopy) {
        alert("Your password's must match!");
    } else if (newname == "" || newemail == "" || newusername == "" || newpassword == "" || newphonenumber == "" || newNanoID == "") {
        alert("Please fill in all the boxes!");
    } else {
        var peep = new person(newname, newemail, newusername, newpassword, newphonenumber, newNanoID, false, false, false, false, 65, 75);
        users.push(peep);
        alert("New account created!");
        toLogin();
    }

}

// send password
function sentPassword() {
    var inputemail = document.getElementById("recoverEmail").value;
    var inputname = document.getElementById("recoverName").value;
    for (var k = 0; k < users.length; k++) {
        if (inputemail == users[k].email && inputname == users[k].username) {
            forgotPassAccount = users[k];
            var one = "Your password is ";
            var two = one.concat(users[k].password);
            alert(two);
            toThanks;
            break;
        } else if (k == users.length - 1) {
            alert("Please input an existing email");
        }
    }

}

// creates a new user object 
function person(name, email, username, password, phonenumber, nanoID, ping, motion, temp, tempUnder, tempOver) {
    this.name = name;
    this.email = email;
    this.username = username;
    this.password = password;
    this.phonenumber = phonenumber;
    this.nanoID = nanoID;
    // Save preferences (init default)
    this.ping = ping;
    this.motion = motion;
    this.temp = temp;
    this.tempUnder = tempUnder;
    this.tempOver = tempOver;

}

// Navigation functions
function toLogin() {

    var i;
    var x = document.getElementById('login');
    // if hidden, show, then hide everything else
    if (x.style.display === 'none') {
        x.style.display = 'block';
        for (i = 0; i < pages.length; i = i + 1) {
            var n = document.getElementById(pages[i]);
            // don't hide current page!
            if (x !== n) {
                n.style.display = 'none';
            }

        }
    } else { // if shown, hide
        x.style.display = 'none';
    }

    // tell photon to stop publishing anything
    var publishEventPr = particle.publishEvent({
        name: 'sending',
        data: "stop",
        auth: token,
        isPrivate: true
    });

    publishEventPr.then(
        function (data) {
            if (data.body.ok) {
                console.log("Event published succesfully ");
            }
        },
        function (err) {
            console.log("Failed to publish event: " + err);
        }
    );
}

function toPassword() {
    var x = document.getElementById('passwordRecov');
    // if hidden, show, then hide everything else
    if (x.style.display === 'none') {
        x.style.display = 'block';
        for (i = 0; i < pages.length; i = i + 1) {
            var n = document.getElementById(pages[i]);
            // don't hide current page!
            if (x !== n) {
                n.style.display = 'none';
            }

        }
    } else { // if shown, hide
        x.style.display = 'none';
    }
}

function toSignUp() {
    var x = document.getElementById('signup');
    // if hidden, show, then hide everything else
    if (x.style.display === 'none') {
        x.style.display = 'block';
        for (i = 0; i < pages.length; i++) {
            var n = document.getElementById(pages[i]);
            // don't hide current page!
            if (x != n) {
                n.style.display = 'none';
            }

        }
    } else { // if shown, hide
        x.style.display = 'none';
    }
}

function toStatus() {
    // login to particle.io
    particle = new Particle();
    particle.login({
        username: 'isabelle.xu@wustl.edu',
        password: 'sunshine_98'
    }).then(loginSuccess, loginError);


    //var currentname = window.currentAccount.first;
    //document.getElementById("welcome").innerHTML = currentname;
    var x = document.getElementById('status');

    // if hidden, show, then hide everything else
    if (x.style.display === 'none') {
        x.style.display = 'block';
        for (i = 0; i < pages.length; i++) {
            var n = document.getElementById(pages[i]);
            // don't hide current page!
            if (x != n) {
                n.style.display = 'none';
            }

        }
    } else { // if shown, hide
        x.style.display = 'none';
    }

}

function toThanks() {
    var x = document.getElementById('thanks');
    // if hidden, show, then hide everything else
    if (x.style.display === 'none') {
        x.style.display = 'block';
        // "send" password
        var str1 = "Your password is ";
        var str2 = window.forgotPassAccount.password;
        var res = str1.concat(str2);
        alert(res);
        for (i = 0; i < pages.length; i = i + 1) {
            var n = document.getElementById(pages[i]);
            // don't hide current page!
            if (x !== n) {
                n.style.display = 'none';
            }

        }
    } else { // if shown, hide
        x.style.display = 'none';
    }

}

function toSettings() {
    //document.getElementById("currentID").innerHTML = window.currentAccount.ID;
    var x = document.getElementById('settings');
    var i;
    // if hidden, show, then hide everything else
    if (x.style.display === 'none') {
        x.style.display = 'block';
        for (i = 0; i < pages.length; i = i + 1) {
            var n = document.getElementById(pages[i]);
            // don't hide current page!
            if (x !== n) {
                n.style.display = 'none';
            }

        }
    } else { // if shown, hide
        x.style.display = 'none';
    }
    loadPreferences();
}
