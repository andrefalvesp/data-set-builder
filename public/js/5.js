(function ($) {
  "use strict";
  $(window).one("load", function () {
    const iduser = testUser();

    $.ajax({
      type: 'GET',
      url: '/group',
      data: { 'iduser': iduser },
      dataType: 'json',
      tryCount : 0,
      retryLimit : 3,
      success: function (response) {
        const idgroup = response.rows[0].idgroup;
        $("#idgroup").empty().append(idgroup);
        buildHtmlTable(response.rows, $("#datatable"))
        buildComBoxItens()
        buildNQuestion(idgroup)

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

  function buildComBoxItens() {
    const list = [
        [ "0", "SELECT com operações aritméticas"]
        ,[ "1", "INNER JOIN"]
        ,[ "2", "WHERE -- ALL"]
        ,[ "3", "AVG / COUNT / MIN / MAX / SUM"]
        ,[ "4", "GROUP BY"]
        ,[ "5", "HAVING"]
        ,[ "6", "ORDER BY"]
        ,[ "7", "BETWEEN"]
        ,[ "8", "LIKE"]
        ,[ "9", "IS NULL/IS NOT NULL"]
        ,[ "10", "UNION"]
        ,[ "11", "INTERSECT"]
        ,[ "12", "EXCEPT"]
        ,[ "13", "IN / NOT IN"]
        ,[ "14", "ANY / SOME"]

    ];

    const n = 3;
    const newlist = list
        .map(x => ({ x, r: Math.random() }))
        .sort((a, b) => a.r - b.r)
        .map(a => a.x)
        .slice(0, n);

    $('#operation').empty();
    $.each(newlist, function (index, element) {
      $('#operation').append($('<option/>', {
        value: element[0],
        text: element[1]
      }));
    });
  }
  function buildNQuestion(idgroup) {
    $.ajax({
      type: 'GET',
      url: '/group/count',
      data: { 'idgroup': idgroup },
      dataType: 'json',
      tryCount : 0,
      retryLimit : 3,
      success: function (response) {
        $("#nquestions").empty().append(response);
      },
      error : function(jqXHR, xhr, textStatus, errorThrown ) {
          console.log(textStatus, errorThrown);
        }
    });
  }


// Builds the HTML Table out of myList.
  function buildHtmlTable(list, selector) {

    var columns = addAllColumnHeaders(list, selector);

    for (var i = 0; i < list.length; i++) {
      var row$ = $('<tr/>');
      for (var colIndex = 0; colIndex < columns.length; colIndex++) {
        var cellValue = list[i][columns[colIndex]];
        if (cellValue == null) cellValue = "";
        row$.append($('<td/>').html(cellValue));
      }
      $(selector).append(row$);
    }
  }

// Adds a header row to the table and returns the set of columns.
// Need to do union of keys from all records as some records may not contain
// all records.
  function addAllColumnHeaders(myList, selector) {
    var columnSet = [];
    var headerTr$ = $('<tr/>');

    for (var i = 0; i < myList.length; i++) {
      var rowHash = myList[i];
      for (var key in rowHash) {
        if ($.inArray(key, columnSet) == -1) {
          columnSet.push(key);
          headerTr$.append($('<th/>').html(key));
        }
      }
    }
    $(selector).append(headerTr$);

    return columnSet;
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