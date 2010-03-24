
const PAD_SIZE_LIMIT = 1024*10;


function newpassprompt (dialog) {
    if ($('#newpass').attr("value") != $('#newpass_conf').attr("value")){
        $("#d_newpassprompt").wiggle()
        $("#newpassprompt_msg").html( 
            "<div class=\"warning\">" + 
            "Password doesn't match confirmation." + 
            "</div>"
        );
        return;
    } else if (!$('#newpass').attr("value")) {
        return;
    }
    password = $('#newpass').attr("value");
    dialog.close();
}


/*
jQuery Wiggle
Author: WonderGroup, Jordan Thomas
URL: http://labs.wondergroup.com/demos/mini-ui/index.html
License: MIT (http://en.wikipedia.org/wiki/MIT_License)
*/
jQuery.fn.wiggle = function(o) {
    var d = { speed: 25, wiggles: 3, travel: 5, callback: null };
    var o = jQuery.extend(d, o);
    
    return this.each( function() {
        var cache = this;
        var wrap = jQuery(this).wrap('<div class="wiggle-wrap"></div>').css("position","relative");
        var calls = 0;
        for (i=1;i<=o.wiggles;i++) {
            jQuery(this).animate({
                left: "-=" + o.travel
            }, o.speed).animate({
                left: "+=" + o.travel*2
            }, o.speed*2).animate({
                left: "-=" + o.travel
            }, o.speed, function() {
                calls++;
                if (jQuery(cache).parent().hasClass('wiggle-wrap')) {
                    jQuery(cache).parent().replaceWith(cache);
                }
                if (calls == o.wiggles && jQuery.isFunction(o.callback)) { o.callback(); }
            });
        }
    });
};



function passprompt (dialog) {
    if (!$('#pass').attr("value")) {
        return;
    }
    password = $('#pass').attr("value");
    if (decrypt()){
        dialog.close();
    } else {
        $("#d_passprompt").wiggle();
    }
}


function seeded (){
    $("#entropy").hide();
    $("#entropytext").hide();
    if (entropydialog){
        entropydialog.close();
    }
}


function decrypt(){
    var macwords = [];
    var macbytes = [];
    var cipherbytes = [];
    var salt = [];

    aes.asciiToBytes(ciphertext.slice(0, 8), salt);
    aes.asciiToBytes(ciphertext.slice(8, 24), macbytes);
    aes.bytesToWords(macbytes, macwords);
    aes.asciiToBytes(ciphertext.slice(24), cipherbytes);
    var cipher = new aes(generateKey(password, salt), OCB);
    var clear = cipher.decrypt(cipherbytes, "", macwords)
    if (clear == "" || clear.length < 40)
        return false;
    writekey = clear.slice(0, 40);
    $("#data").attr("value", clear.slice(40));
    return true;
}

/*
 * Retrieve a complete encrypted data package.
 */
function getpayload() {
    var iv = Random.random_words(4);
    var saltwords = Random.random_words(2);
    var salt = []
    aes.wordsToBytes(saltwords, salt);
    var cipher = new aes(generateKey(password, salt), OCB);
    var payload = [];
    var macwords = [];
    cipher.encrypt(iv, writekey + $("#data").attr("value"), payload, "", macwords);
    var macbytes = [];
    aes.wordsToBytes(macwords, macbytes);
    return aes.bytesToAscii(salt) + aes.bytesToAscii(macbytes) + aes.bytesToAscii(payload);
}


function entropytick () {
    var target = 90;
    if (Random.get_progress() < 1.0) {
        $("#entropy").css(
            "height", (Math.floor(Random.get_progress() * target))+"%"
        );
        setTimeout(entropytick, 5);
    }
}

function waitForEntropy (callback) {
    if (Random.is_ready())
        callback();
    else {
        if (!entropydialog){
            entropydialog = $('#d_entropy').modal(
                {
                    focus: true,
                    close: false
                }
            );
        }
        Random.addEventListener("seeded", function(){
            callback();
        });
    }
}


function save() {
    var data = getpayload();
    if (data.length > PAD_SIZE_LIMIT){
        alert("Too much data to save. At the moment I'm limiting pad size to " + PAD_SIZE_LIMIT + " bytes.")
        return;
    }
    var dialog = $('#d_save').modal(
        {
            focus: true,
            close: false
        }
    );
    $.ajax({
        type: "POST",
        url: domain + "_save", 
        data: {
            name: name,
            key: writekey,
            data: data
        },
        success: function(ret){
            if (ret == "OK")
                setTimeout(
                    function(){
                        editingOff();
                        dialog.close();
                    }, 
                    500
                );
            else
                alert("Error - couldn't save!");
        },
        error: function(ret){
            dialog.close();
            alert("Error - couldn't save!");
        }
    })
}


/* Generates a random key with (theoretically) at least 128 bits of entropy */
function genkey(){
    var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:-.*";
    var char_entropy = 6; /* approximately log2(chars.length) */
    var key = "";
    var length = Math.ceil(128/char_entropy);
    var words = Random.random_words(length);
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


function generate () {
    var dialog = $('#d_keygen').modal(
        {
            focus: true,
            close: false
        }
    );
    var key = genkey();
    $("#generated_key").html(key);
    $('#b_generate_accept').click(function () {
        password = key;
        dialog.close();
    })
    $('#b_generate_cancel').click(function () {
        dialog.close();
        newprompt();
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
        msg = "Creating new pad. Choose a password:";
        $("#b_newpassprompt_cancel").hide();
    }
    $("#newpassprompt_msg").html(msg);
    var dialog = $('#d_newpassprompt').modal(
        {
            focus: true,
            close: false
        }
    );
    $('#newpass_conf').keypress(function (e) {
        if (e.which == 13){
            newpassprompt(dialog);
        }
        return true;
    })
    $("#b_generate").click(function(){
        dialog.close();
        waitForEntropy(generate);
    })
    $("#b_newpassprompt_cancel").click(function(){
        dialog.close();
    })
    $("#b_newpassprompt_go").click(function(){
        newpassprompt(dialog);
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


function editingOff(){
    editing = false;
    $("#b_editsave").html("edit");
    $("#data").attr("readonly", "true");
}


function editingOn(){
    editing = true;
    $("#b_editsave").html("save");
    $("#data").attr("readonly", "");
}


function run () {
    var domn = domain + name;
    document.title = domn;
    $("#header").html("<a href=\"" + domn + "\">" + domn + "</a>");

    $("#data").attr("value", "");
    if (ciphertext) {
        var dialog = $('#d_passprompt').modal(
            {
                focus: true,
                close: false
            }
        );
        $('#pass').keypress(function (e) {
            if (e.which == 13){
                passprompt(dialog);
            }
            return true;
        })
    } else if (writekey) {
        editingOn();
        newprompt();
    }
    /* Start collecting entropy immediately. By the time the user has typed a
     * password, we're likely to be ready to generate our IV.
     */
    Random.set_default_paranoia(8);
    Random.start_collectors();
    Random.addEventListener("seeded", seeded);
    setTimeout(entropytick, 10);

    /* Set up button events */
    if (ciphertext && !startsWith(document.location.href, domain)) {
        /* This is a local file */
        $("#b_changepass").hide();
        $("#b_editsave").hide();
        $("#entropy").hide();
        $("#entropytext").hide();
    } else {
        $("#b_editsave").click(
            function(){
                if (editing){
                    waitForEntropy(save);
                } else {
                    editingOn();
                }
            }
        );
        $("#b_changepass").click(
            function () {
                editingOn();
                newprompt("Changing password.");
            }
        );
    }
}

var editing = false;
var entropydialog = null;
var password="";
$(run);
