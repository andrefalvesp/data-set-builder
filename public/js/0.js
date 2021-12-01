(function ($) {
  "use strict";

  /*==================================================================
  [ Validate ]*/
  var input = $('.validate-input .input100');

  $('#save-btn').on('click', function () {
    var check = true;

    for (var i = 0; i < input.length; i++) {
      if (validate(input[i]) === false) {
        showValidate(input[i]);
        check = false;
      }
    }

    if (check) {
      saveUser(this)
      window.location.href = './1-login.html';
    }
    return check;
  });

  $('#cadastro-btn').on('click', function () {
    window.location.href = './1-login.html';
  });

  $('.validate-form .input100').each(function () {
    $(this).focus(function () {
      hideValidate(this);
    });
  });

  function validate(input) {
    if ($(input).attr('type') === 'email' || $(input).attr('name') === 'email') {
      if ($(input).val().trim().match(/^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{1,5}|[0-9]{1,3})(\]?)$/) == null) {
        return false;
      }
    }
    else {
      if ($(input).val().trim() === '') {
        return false;
      }
    }
  }

  function showValidate(input) {
    var thisAlert = $(input).parent();

    $(thisAlert).addClass('alert-validate');
  }

  function hideValidate(input) {
    var thisAlert = $(input).parent();

    $(thisAlert).removeClass('alert-validate');
  }

  function saveUser(form) {
    // Get some values from elements on the page:
    var $form = $(form),

      email = $("#email").val(),
      iduser = $("#iduser").val(),
      name = $("#name").val(),
      idteam = $("#idteam").val(),

      url = "/user"

    $.ajax({
      type: 'POST',
      url: url,
      data: { 'iduser': iduser, 'email': email, 'name':name, 'idteam':idteam, 'useragreetlce': true },
      dataType: 'json',
      success: function () {
        alert("Usuário cadastrado com sucesso.");
      },
      error: function (jqXHR, textStatus, errorThrown, response) {
        alert("Usuário não cadastrado. Por favor tente novamente." + response);
        console.log(textStatus, errorThrown);
      }
    });
  }

})(jQuery);