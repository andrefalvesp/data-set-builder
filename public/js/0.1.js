
(function ($) {
    "use strict";
    $("#btn1").click(function () {
        testcheck();
    });
    $("#inst").show(function () {
        testUser();
    });

    function testcheck() {
        if (!$("#ckb1").is(":checked")) {
            //alert("Por favor, você deve confirmar a leitura das instruções antes de iniciar.");
            //return;
            window.location.href = './0-create-account.html';
        } else {
            window.location.href = './0-create-account.html';
        }
    }
    function testUser(){
        const localStorage = window.localStorage
        const iduser = localStorage.getItem('iduser')
        if (iduser==null || iduser.trim().length==0){
          window.location.href = './1-login.html'
          throw new Error('No user found');
        }
        else 
          return iduser;
    }
})(jQuery);