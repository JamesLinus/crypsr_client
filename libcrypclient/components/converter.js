

var data = null;
var writekey = null;
var cleartext = null;


function seeded () {

}


function decrypt () {


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


function convert(data) {


}


function decrypt(password){
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
    cleartext = clear.slice(40);
    return true;
}

function encrypt (data){
    var params = {};
    params.iv = sjcl.random.randomWords(4);
    params.salt = sjcl.random.randomWords(2);
    return sjcl.encrypt(
                $("#password").attr("value"), 
                JSON.stringify(data)
            );
}

function upload(){
    var data =  {
        'writekey': writekey,
        'pad': [
            {
                'txt': cleartext
            }
        ]
    }
    var ciphertext = encrypt(data);
    $.ajax({
        type: "POST",
        url: domain + "_save", 
        data: {
            name: name,
            key: writekey,
            data: ciphertext
        },
        success: function(ret){
            if (ret == "OK"){
                $("#done_section").show();
            } else
                alert("Error - couldn't save!");
        },
        error: function(ret){
            alert("Error - couldn't save!");
        }
    })
}


function go (){
    if (decrypt($("#password").attr("value"))){
        $("#password_msg").hide();
        $("#password").attr("disabled", "disabled");
        $("#entropy_section").show();
        if (sjcl.random.isReady()){
            upload();
        } else {
            sjcl.random.addEventListener("seeded", upload);
        }
    } else {
        $("#password_msg").show();
    }
}


function run () {
    /* Start collecting entropy immediately. By the time the user has typed a
     * password, we're likely to be ready to generate our IV.
     */
    sjcl.random.setDefaultParanoia(8);
    sjcl.random.startCollectors();
    setTimeout(entropytick, 10);

    $('#password').keypress(function (e) {
        if (e.which == 13){
            go();
        }
        return true;
    })
    $('#go').click(function (e) {
        go();
    })
    $("#password").focus();

}
