(function ($) {
  "use strict";

  /*==================================================================
  [ Validate ]*/
  var input = $('.validate-input .input100');

  $('#login-btn').on('click', function () {
    var check = true;

    for (var i = 0; i < input.length; i++) {
      if (validate(input[i]) === false) {
        showValidate(input[i]);
        check = false;
      }
    }

    if (check) {
      validateUser(this)
    }

    return check;
  });

  $('#cadastro-btn').on('click', function () {
    window.location.href = './0-create-account.html';
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

  function validateUser(form) {
    // Get some values from elements on the page:
    var $form = $(form),
      email = $("#email").val(),
      iduser = $("#iduser").val(),
      url = "/user"

    $.ajax({
      type: 'GET',
      url: url,
      data: { 'iduser': iduser, 'email': email },
      dataType: 'json',
      success: function (response) {
        var rowCount = response.rowCount;
        const localStorage = window.localStorage
        if (rowCount === 1) {
          localStorage.setItem('iduser', iduser)
          localStorage.setItem('email', email)
          window.location.href = './3-instructions.html';
        }
        else {
          window.location.href = './2-user-not-found.html';
        }
      },
      error: function (jqXHR, textStatus, errorThrown) {
        console.log(textStatus, errorThrown);
      }
    });
  }

})(jQuery);