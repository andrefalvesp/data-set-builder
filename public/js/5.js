(function ($) {
  "use strict";
  $(window).one("load", function () {
    const iduser = testUser();
    $.ajax({
      type: 'GET',
      url: '/abstract',
      data: {'iduser': iduser},
      dataType: 'json',
      tryCount : 0,
      retryLimit : 3,
      success: function (response) {
        const {abstract, title, idarticle, nquestions} = response.rows[0];
        $("#idarticle").empty().append(idarticle);
        $("#title").empty().append(title);
        $("#abstract").empty().append(abstract);
        $("#nquestions").empty().append(nquestions);
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
//////////////////////////////////////////////////////////////////////////////////

  /*==================================================================
[ Validate ]*/
  var input = $('.validate-input .input100');

  $('#btnEnviar').on("click", function () {
    var check = true;

    for (var i = 0; i < input.length; i++) {
      if (validate(input[i]) === false) {
        showValidate(input[i]);
        check = false;
      }
    }

    if (check) {
      saveQA()
    }
    return check;

  });
  function saveQA () {
    const iduser = testUser();
    const idarticle = $("#idarticle").text()
    const questionen = $("#questionen").val()
    const answeren = $("#answeren").val()
    const questionpt = $("#questionpt").val()
    const answerpt = $("#answerpt").val()

    $.ajax({
      type: 'POST',
      url: '/question-answer/',
      data: {
        'iduser': iduser,
        'idarticle': idarticle,
        'questionen': questionen,
        'answeren': answeren,
        'questionpt': questionpt,
        'answerpt': answerpt
      },
      dataType: 'json',
      success: function (response) {
        window.location.href = './6-user.html'
      },
      error: function (jqXHR, textStatus, errorThrown) {
        console.log(textStatus, errorThrown);
      }
    });
  }

  function testUser(){
    const localStorage = window.localStorage
    const iduser = localStorage.getItem('iduser')
    if (iduser==null || iduser.trim().length===0){
      window.location.href = './1-login.html'
      throw new Error('No user found');
    }
    else 
      return iduser;
  }

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
  $(document).ready(function () {
    // Setup - add a text input to each footer cell
    $('#example thead tr')
        .clone(true)
        .addClass('filters')
        .appendTo('#example thead');

    var table = $('#example').DataTable({
      orderCellsTop: true,
      fixedHeader: true,
      initComplete: function () {
        var api = this.api();

        // For each column
        api
            .columns()
            .eq(0)
            .each(function (colIdx) {
              // Set the header cell to contain the input element
              var cell = $('.filters th').eq(
                  $(api.column(colIdx).header()).index()
              );
              var title = $(cell).text();
              $(cell).html('<input type="text" placeholder="' + title + '" />');

              // On every keypress in this input
              $(
                  'input',
                  $('.filters th').eq($(api.column(colIdx).header()).index())
              )
                  .off('keyup change')
                  .on('keyup change', function (e) {
                    e.stopPropagation();

                    // Get the search value
                    $(this).attr('title', $(this).val());
                    var regexr = '({search})'; //$(this).parents('th').find('select').val();

                    var cursorPosition = this.selectionStart;
                    // Search the column for that value
                    api
                        .column(colIdx)
                        .search(
                            this.value != ''
                                ? regexr.replace('{search}', '(((' + this.value + ')))')
                                : '',
                            this.value != '',
                            this.value == ''
                        )
                        .draw();

                    $(this)
                        .focus()[0]
                        .setSelectionRange(cursorPosition, cursorPosition);
                  });
            });
      },
    });
  });
})(jQuery);