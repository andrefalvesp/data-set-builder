(function ($) {
    "use strict";
    $(window).one("load", function () {
        const iduser = testUser();
        $.ajax({
            type: 'GET',
            url: '/abstract',
            data: { 'iduser': iduser },
            dataType: 'json',
            tryCount : 0,
            retryLimit : 3,
            success: function (response) {
                const { idarticle, title, abstract, nquestions } = response.rows[0];
                if(nquestions>1){
                    window.location.replace("5-image-qa.html")
                }
                $("#idarticle").empty().append(idarticle);
                $("#title").empty().append(title);
                $("#abstract").empty().append(abstract);

            },
            error : function(jqXHR, xhr, textStatus, errorThrown ) {
                if (textStatus !== '') {
                    this.tryCount++;
                    if (this.tryCount <= this.retryLimit) {
                        //try again
                        $.ajax(this);
                        return;
                    }
                    return;
                }
                if (xhr.status === 500) {
                    //handle error
                    console.log(textStatus, errorThrown);

                } else {
                    console.log(textStatus, errorThrown);
                }
            }
        });
    });

    $('#btnRejeitar').on("click", function () {

        const iduser = testUser();
        const idArticle = $("#idarticle").text()

        $.ajax({
            type: 'POST',
            url: '/abstract/reject',
            data: { 'iduser': iduser, 'idArticle': idArticle },
            dataType: 'json',
            success: function (response) {
                window.location.href = './4-image.html'
            },
            error: function (jqXHR, textStatus, errorThrown) {
                window.location.href = './4-image.html'
                console.log(textStatus, errorThrown);
            }
        });
    });

    $('#btnAceitou').on("click", function () {

        const iduser = testUser();
        const idArticle = $("#idarticle").text()
        window.location.href = './5-image-qa.html'

    });

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