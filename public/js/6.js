(function ($) {
    "use strict";

    $(window).one("load", function () {
        const iduser = testUser();
        $.ajax({
            type: 'GET',
            url: '/user/review',
            data: {'iduser': iduser},
            dataType: 'json',
            tryCount: 0,
            retryLimit: 3,
            success: function (response) {
                const {
                    email,
                    sumanswer,
                    sumscore,
                    score
                } = response.rows[0];

                $("#iduser").empty().append(iduser);
                $("#email").empty().append(email);
                $("#sumanswer").empty().append(sumanswer);
                $("#sumscore").empty().append(sumscore);
                $("#score").empty().append(" / " + score);

            },
            error: function (jqXHR, xhr, textStatus, errorThrown) {
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

    $(window).ajaxComplete(function () {
        const sumscore = parseInt($("#sumscore").text());
        const score = parseInt($("#score").text());
        if (sumscore >= score) {
            $("#btnContinuar").empty().append("Finalizar tarefa");
        }
    });

    function testUser() {
        const localStorage = window.localStorage
        const iduser = localStorage.getItem('iduser')
        if (iduser == null || iduser.trim().length === 0) {
            window.location.href = './1-login.html'
            throw new Error('No user found');
        } else
            return iduser;
    }

})(jQuery);