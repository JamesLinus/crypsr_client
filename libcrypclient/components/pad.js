
"use strict";
/*jslint indent: 2, bitwise: false, nomen: false, plusplus: false, white: false, regexp: false */


var Data = {
    PAD_SIZE_LIMIT: 1024 * 10,

    data: {},
    password: null,

    /* Initialize a new data locker */
    init: function(password, writekey) {
        this.clear();
        this.password = password;
        if (writekey.length !== 40)
            throw "Write key must be 40 characters."
        this.data["writekey"] = writekey;
    },

    unpack_cleartext: function(clear){
        this.data = JSON.parse(clear);
        return true;
    },

    pack_cleartext: function(){
        return JSON.stringify(this.data);
    },

    /* Load an existing data locker. */
    decrypt:  function(password, ciphertext){
        this.clear();
        this.password = password;
        try {
            var clear = sjcl.decrypt(this.password, ciphertext);
        } catch (err){
            return false;
        }
        return this.unpack_cleartext(clear);
    },

    clear: function(){
        this.data = {};
        this.password = null;
    },

    /* version: optional specifier for older packings */
    encrypt: function (iv, salt){
        var params = {};
        if (!iv)
            params.iv = sjcl.random.randomWords(4);
        if (!salt)
            params.salt = sjcl.random.randomWords(2);
        return sjcl.encrypt(this.password, this.pack_cleartext());
    }
};


function check_newpass (dialog) {
    if ($('#newpass').attr("value") != $('#newpass_conf').attr("value")){
        $("#d_newpassprompt").wiggle();
        $("#newpassprompt_msg").html( 
            "<div class=\"warning\">" + 
            "Password doesn't match confirmation." + 
            "</div>"
        );
        return;
    } else if (!$('#newpass').attr("value")) {
        return;
    }
    var password = $('#newpass').attr("value");
    if (new_writekey)
        Data.init(password, new_writekey);
    else
        Data.init(password, Data.data["writekey"]);
    on_change();
    List.close_dialog(dialog);
}


function passprompt (dialog) {
    if (!$('#pass').attr("value")) {
        return;
    }
    var password = $('#pass').attr("value");
    if (Data.decrypt(password, ciphertext)){
        List.init(Data.data["pad"], on_change, save);
        List.close_dialog(dialog);
    } else {
        $("#d_passprompt").wiggle();
    }
}


function seeded (){
    if (entropydialog){
        List.close_dialog(entropydialog);
    }
}


function entropytick () {
    var target = 90;
    if (sjcl.random.getProgress() < 1.0) {
        $("#entropybar").css(
            "width", (Math.floor(sjcl.random.getProgress() * target))+"%"
        );
        setTimeout(entropytick, 5);
    }
}


function waitForEntropy (callback) {
    if (sjcl.random.isReady())
        callback();
    else {
        if (!entropydialog){
            entropydialog = List.open_dialog('#d_entropy');
        }
        sjcl.random.addEventListener("seeded", function(){
            callback();
        });
    }
}


function _save() {
    var dialog = List.open_dialog('#d_save');
    load_data();
    var crypted = Data.encrypt();
    if (crypted.length > Data.PAD_SIZE_LIMIT){
        List.close_dialog(dialog);
        alert("Too much data to save. At the moment I'm limiting pad size to " + Data.PAD_SIZE_LIMIT + " bytes.")
        return;
    }
    $.ajax({
        type: "POST",
        url: domain + "_save", 
        data: {
            name: name,
            key: Data.data["writekey"],
            data: crypted
        },
        success: function(ret){
            if (ret == "OK"){
                setTimeout(
                    function(){
                        List.close_dialog(dialog);
                    }, 
                    200
                );
                $("#save").removeClass('active');
                changed = false;
            } else {
                List.close_dialog(dialog);
                alert("Error - couldn't save!");
            }
        },
        error: function(ret){
            List.close_dialog(dialog);
            alert("Error - couldn't save!");
        }
    })
}

function save() {
    waitForEntropy(_save);
}

/* Generates a random key with (theoretically) at least 128 bits of entropy */
function genkey(){
    var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:-.*";
    var char_entropy = 6; /* approximately log2(chars.length) */
    var key = "";
    var length = Math.ceil(128/char_entropy);
    var words = sjcl.random.randomWords(length);
    for (i=0; i < length; i++){
        /* Chop the most significant byte to make it more convenient to work
         * with */
        var offset = words[i]&0x0fffffff;
        offset = (offset/0x0fffffff) * chars.length;
        offset = Math.floor(offset);
        key = key + chars[offset];
    }
    return key;
}


function generate (msg) {
    var dialog = List.open_dialog('#d_keygen');
    var key = genkey();
    $("#generated_key").html(key);
    $('#b_generate_accept').click(function () {
        Data.password = key;
        List.close_dialog(dialog);
        on_change();
    })
    $('#b_generate_cancel').click(function () {
        List.close_dialog(dialog);
        newprompt(msg);
    })
    $('#b_generate_regen').click(function () {
        key = genkey();
        $("#generated_key").html(key);
    })
}

function newprompt (msg) {
    if (msg)
        $("#b_newpassprompt_cancel").show();
    else {
        msg = "Creating new list. Choose a password:";
        $("#b_newpassprompt_cancel").hide();
    }
    $("#newpassprompt_msg").html(msg);
    var dialog = List.open_dialog('#d_newpassprompt');
    $('#newpass_conf').keypress(function (e) {
        if (e.which == 13){
            check_newpass(dialog);
        }
        return true;
    })
    $("#b_generate").click(function(){
        List.close_dialog(dialog);
        waitForEntropy(function(){generate(msg)});
    })
    $("#b_newpassprompt_cancel").click(function(){
        List.close_dialog(dialog);
    })
    $("#b_newpassprompt_go").click(function(){
        check_newpass(dialog);
        return true;
    })
}

function startsWith(a, b){
    if (!a || !b)
        return false
    else if (a.length < b.length)
        return false;
    else if (a.slice(0, b.length) == b)
        return true;
}


function run () {
    var domn = domain + name;
    document.title = domn;
    $("#header").html("<a href=\"" + domn + "\">" + domn + "</a>");
    if (ciphertext) {
        var dialog = List.open_dialog('#d_passprompt');
        $('#pass').keypress(function (e) {
            if (e.which == 13){
                passprompt(dialog);
            }
            return true;
        })
    } else if (new_writekey) {
        List.init(null, on_change, save);
        newprompt();
    }

    /* Start collecting entropy immediately. By the time the user has typed a
     * password, we're likely to be ready to generate our IV.
     */
    sjcl.random.setDefaultParanoia(8);
    sjcl.random.startCollectors();
    sjcl.random.addEventListener("seeded", seeded);
    setTimeout(entropytick, 10);

    /* Set up button events */
    if (ciphertext && !startsWith(document.location.href, domain)) {
        /* This is a local file */
        $("#changepass").hide();
    } else {
        $("#save").click(
            function(){
                save();
            }
        );
        $("#m_changepass").click(
            function () {
                newprompt("Changing password.");
            }
        );
        /* Set up menu  */
        $('#topmenu').hover(  
            function () {  
                $('#submenu', this).slideDown(100);  
            },   
            function () {  
                $('#submenu', this).slideUp(100);           
            }  
        );  
    }
    $("#hprompt").click(
        function(){
            List.help();
        }
    );
    $(window).bind('beforeunload', function() {
        if (changed){
            return 'You have unsaved data.';
        }
    });

}


function load_data(){
    Data.data["pad"] = List.serialize();
}


function on_change(){
    if (!changed){
        $("#save").addClass('active');
        $("#save").effect("pulsate", {times: 1}, 300);
    }
    changed = true;
}


var changed = false;
var entropydialog = null;
