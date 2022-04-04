
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
            alert("Por favor, você deve confirmar a leitura das instruções antes de iniciar.");
            return;
        }
        window.location.href = './4-image.html'
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