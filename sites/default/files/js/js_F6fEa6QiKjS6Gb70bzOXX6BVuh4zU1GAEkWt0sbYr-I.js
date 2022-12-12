(function ($, Drupal) {

  // Add regex support to the states API, see
  // https://evolvingweb.ca/blog/extending-form-api-states-regular-expressions
  Drupal.hpc_content_panes_states_extension = function(reference, value) {
    if ('regex' in reference) {
      return (new RegExp(reference.regex, reference.flags)).test(value);
    } else {
      return reference.indexOf(value) !== false;
    }
  }
  Drupal.behaviors.statesModification = {
    attach: function(context, settings) {
      if (Drupal.states) {
        Drupal.states.Dependent.comparisons.Object = Drupal.hpc_content_panes_states_extension;
      }
    }
  }

  Drupal.theme.prototype.table = function (header, rows, attributes) {
    // Creates table.
    var table = $('<table></table>')

    if (typeof attributes != 'undefined') {
      if (typeof attributes.classes != 'undefined') {
        table.addClass(attributes.classes);
      }
    }

    var tr = $('<tr></tr>') // Creates row.
    var th = $('<th></th>') // Creates table header cells.
    var td = $('<td></td>') // Creates table cells.

    var thead = tr.clone() // Creates header row.

    // Fills header row.
    header.forEach(function(d) {
      thead.append(th.clone().html(d));
    })

    // Attaches header row.
    table.append($('<thead></thead>').append(thead));

    //creates
    var tbody = $('<tbody></tbody>')

    // Fills out the table body.
    rows.forEach(function(d) {
      var row = tr.clone(); // Creates a row.
      d.forEach(function(e,j) {
        row.append(td.clone().html(e)) // Fills in the row.
      });
      tbody.append(row); // Puts row on the tbody.
    })
    table.append(tbody);
    var container = $('<div></div>').append(table);
    return container.html();
  }

  Drupal.theme.prototype.mapPlanCard = function(vars) {
    var container = $('<div></div>').addClass('map-plan-card-container');
    var header = $('<div></div>').addClass('modal-header');
    var content = $('<div></div>').addClass('modal-content');

    if (vars.next || vars.previous) {
      // Add a navigation footer.
      let navigation = $('<div></div>').addClass('navigation');

      let previous_link = $('<span></span>')
        .addClass('link')
        .addClass('previous')
        .html('<i class="material-icons">keyboard_arrow_left</i>');
      if (vars.previous) {
        previous_link
          .attr('data-location-id', vars.previous.location_id)
          .attr('title', vars.previous.location_name);
      }
      else {
        previous_link.addClass('disabled');
      }

      let next_link = $('<span></span>')
        .addClass('link')
        .addClass('next')
        .html('<i class="material-icons">keyboard_arrow_right</i>');
      if (vars.next) {
        next_link
          .attr('data-location-id', vars.next.location_id)
          .attr('title', vars.next.location_name);
      }
      else {
        next_link.addClass('disabled');
      }

      navigation.append(previous_link);
      navigation.append(next_link);

      if (vars.current_index != null && vars.total_count != null) {
        let counter = $('<span></span>')
          .addClass('counter')
          .html(Drupal.t('!current / !total', {
            '!current': vars.current_index,
            '!total': vars.total_count
          }));
        navigation.append(counter);
      }

      header.append(navigation);
    }

    // Add the title.
    if (vars.title) {
      header.append($('<div></div>').addClass('title').html(vars.title)); // Creates title div.
    }
    // Add the admin area.
    if (vars.location_data && typeof vars.location_data.admin_level != 'undefined') {

      var location_details = [];
      location_details.push(Drupal.t('Admin level !admin_level', {
        '!admin_level': vars.location_data.admin_level
      }));
      if (typeof vars.pcodes_enabled != 'undefined' && vars.pcodes_enabled == true && vars.location_data.hasOwnProperty('pcode') && vars.location_data.pcode && vars.location_data.pcode.length) {
        location_details.push(vars.location_data.pcode);
      }
      if (vars.location_data.object_count_label) {
        location_details.push(vars.location_data.object_count_label);
      }
      header.append($('<div></div>').addClass('admin-area').html(location_details.join(' | ')));
    }
    // Add the content.
    if (vars.content) {
      content.append($('<div></div>').addClass('content').html(vars.content)); // Creates content div.
    }
    // Add the subcontent.
    if (vars.subcontent) {
      content.append($('<div></div>').addClass('subcontent').html(vars.subcontent)); // Creates subcontent div.
    }

    $(container).append(header);
    $(container).append(content);
    return container[0].outerHTML;
  }

  Drupal.theme.prototype.mapDonutControlForm = function(state) {
    let legend = state.data[state.index].legend;
    var container = $('<div></div>').addClass('map-plan-card-settings-container');
    var header = $('<div></div>').addClass('modal-header');
    var content = $('<div></div>').addClass('modal-content donut-control-form');

    header.append($('<div></div>').addClass('title').html(Drupal.t('Map configuration'))); // Creates title div.

    // Add select form for the whole segment.
    var options = [];
    for (var metric_index of state.options.map_style_config.donut_whole_segments) {
      options.push({value: metric_index, label: legend[metric_index]});
    }
    $(content).append(Drupal.theme('donutControlOption', Drupal.t('Full segment'), 'donut-whole-segment', options, parseInt(state.active_donut_segments[0])));

    // Add select form for the partial segment.
    var options = [];
    for (var metric_index of state.options.map_style_config.donut_partial_segments) {
      options.push({value: metric_index, label: legend[metric_index]});
    }
    $(content).append(Drupal.theme('donutControlOption', Drupal.t('Partial segment'), 'donut-partial-segment', options, parseInt(state.active_donut_segments[1])));

    // Add a selector for the monitoring periods.
    if (state.options.map_style_config.donut_monitoring_periods.length > 1 && state.data[state.index].hasOwnProperty('location_variants')) {
      let partial_metric_index = $('.donut-partial-segment select', content).val();
      let options = Drupal.hpc_map.buildMonitoringPeriodOptions(state, partial_metric_index);
      $(content).append(Drupal.theme('donutControlOption', Drupal.t('Monitoring period'), 'monitoring-period', options, parseInt(state.active_monitoring_period)));
    }

    // Selector for the value that displays in the donut center.
    var options = [
      {value: 'percentage', label: Drupal.t('Proportion')},
      {value: 'partial', label: Drupal.t('Partial amount')},
      {value: 'full', label: Drupal.t('Full amount')}
    ];
    $(content).append(Drupal.theme('donutControlOption', Drupal.t('Display value'), 'donut-display-value', options, state.active_donut_display_value));

    // Add the apply button.
    let button = $('<button></button>').addClass('btn apply-donut-settings').html(Drupal.t('Apply settings'));
    $(content).append(button);

    $(container).append(header);
    $(container).append(content);

    // Add event handler for changes to the partial segment
    $('.donut-partial-segment select', container).change(function() {
      let control_form = $(this).parents('.donut-control-form');
      let partial_metric_index = parseInt($('.donut-partial-segment select', control_form).val());
      if (partial_metric_index && Drupal.hpc_map.metricIsMeasurement(state, partial_metric_index)) {
        // Get the options based on the selected metric item.
        let options = Drupal.hpc_map.buildMonitoringPeriodOptions(state, partial_metric_index);
        // Get the currently selected period to reset it if possible.
        let currently_selected = parseInt($(control_form).find('.monitoring-period select').val());
        // Build the new period dropdown and replace the old one.
        $(control_form).find('.monitoring-period').replaceWith(Drupal.theme('donutControlOption', Drupal.t('Monitoring period'), 'monitoring-period', options, is_valid_option(options, currently_selected) ? currently_selected : parseInt(state.active_monitoring_period)));
        // And refresh selectric.
        Drupal.attachBehaviors(control_form, Drupal.settings);
      }
    });
    return container[0];
  }

  // Theme a single select box and wrapper for the donut control form.
  Drupal.theme.prototype.donutControlOption = function(title, classes, options, selected_key) {
    var outer_wrapper = $('<div></div>').addClass('form-item').addClass(classes);
    $(outer_wrapper).append($('<label></label>').addClass('form-label').html(title));
    var inner_wrapper = $('<div></div>').addClass(classes);
    var select = $('<select></select>').addClass('form-select');
    for (var option of options) {
      var option_element = $('<option></option>').attr('value', option.value).html(option.label);
      if (typeof selected_key != 'undefined' && selected_key == option.value) {
        $(option_element).attr('selected', 'selected');
      }
      $(select).append(option_element);
    }

    $(inner_wrapper).append(select);
    $(outer_wrapper).append(inner_wrapper);
    return outer_wrapper;
  }



  Drupal.theme.prototype.number = function(amount, short) {
    var num = parseInt(amount);
    if (short) {
      return number_format_si(num, 1);
    }
    return number_format(num, 0);
  }

  Drupal.theme.prototype.amount = function(amount, include_prefix) {
    var num = parseInt(amount);
    var prefix = include_prefix ? ' USD' : '';
    return number_format_si(number, decimals)(num, 0) + prefix;
  }

  Drupal.theme.prototype.percent = function(ratio) {
    return number_format(ratio * 100, 1) + '%';
  }

  function number_format(number, decimals) {
    var decimal_format = 'point';
    let settings = Drupal.settings;
    let plan_settings = settings.hasOwnProperty('plan_settings') ? settings.plan_settings : null;
    if (plan_settings && plan_settings.hasOwnProperty('decimal_formatting')) {
      decimal_format = plan_settings.decimal_formatting;
    }
    dec_point = decimal_format == 'point' ? '.' : ',';
    thousands_sep = decimal_format == 'point' ? ',' : ' ';

    var n = !isFinite(+number) ? 0 : +number,
        prec = !isFinite(+decimals) ? 0 : Math.abs(decimals),
        sep = (typeof thousands_sep === 'undefined') ? ',' : thousands_sep,
        dec = (typeof dec_point === 'undefined') ? '.' : dec_point,
        toFixedFix = function (n, prec) {
            // Fix for IE parseFloat(0.55).toFixed(0) = 0;
            var k = Math.pow(10, prec);
            return Math.round(n * k) / k;
        },
        s = (prec ? toFixedFix(n, prec) : Math.round(n)).toString().split('.');
    if (s[0].length > 3) {
        s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
    }
    if ((s[1] || '').length < prec) {
        s[1] = s[1] || '';
        s[1] += new Array(prec - s[1].length + 1).join('0');
    }
    return s.join(dec);
  }

  function number_format_si(num, decimals) {
    var si = [
      { value: 1, symbol: "" },
      { value: 1E3, symbol: "k" },
      { value: 1E6, symbol: "M" },
      { value: 1E9, symbol: "G" },
      { value: 1E12, symbol: "T" },
      { value: 1E15, symbol: "P" },
      { value: 1E18, symbol: "E" }
    ];
    var rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
    var i;
    for (i = si.length - 1; i > 0; i--) {
      if (num >= si[i].value) {
        break;
      }
    }
    return number_format(num / si[i].value, decimals).replace(rx, "$1") + si[i].symbol;
  }

  function is_valid_option(options, value) {
    for (var option of options) {
      if (option.value == value) {
        return true;
      }
    }
    return false;
  }

})(jQuery, Drupal);
;
(function(c,q){var m="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";c.fn.imagesLoaded=function(f){function n(){var b=c(j),a=c(h);d&&(h.length?d.reject(e,b,a):d.resolve(e));c.isFunction(f)&&f.call(g,e,b,a)}function p(b){k(b.target,"error"===b.type)}function k(b,a){b.src===m||-1!==c.inArray(b,l)||(l.push(b),a?h.push(b):j.push(b),c.data(b,"imagesLoaded",{isBroken:a,src:b.src}),r&&d.notifyWith(c(b),[a,e,c(j),c(h)]),e.length===l.length&&(setTimeout(n),e.unbind(".imagesLoaded",
p)))}var g=this,d=c.isFunction(c.Deferred)?c.Deferred():0,r=c.isFunction(d.notify),e=g.find("img").add(g.filter("img")),l=[],j=[],h=[];c.isPlainObject(f)&&c.each(f,function(b,a){if("callback"===b)f=a;else if(d)d[b](a)});e.length?e.bind("load.imagesLoaded error.imagesLoaded",p).each(function(b,a){var d=a.src,e=c.data(a,"imagesLoaded");if(e&&e.src===d)k(a,e.isBroken);else if(a.complete&&a.naturalWidth!==q)k(a,0===a.naturalWidth||0===a.naturalHeight);else if(a.readyState||a.complete)a.src=m,a.src=d}):
n();return d?d.promise(g):g}})(jQuery);
;
(function ($) {

  // Attach behaviors.
  Drupal.behaviors.hpc_plan_ajax_switcher = {
    attach: function(context, settings) {

      $('.ajax-switcher', context).change(function(e) {
        var value = $(this).val();
        let url = $(this).data('url');
        let query_key = $(this).data('query-key');
        let args = $(this).data('args');
        let pane = $(this).parents('.pane-content');
        var pane_id = $(this).parents('.panel-pane').data('pid');
        if (!pane_id && $(this).parents('form.hpc-widget-form')) {
          // It seems we are in a configuration context.
          pane_id = $(this).parents('form.hpc-widget-form').data('pid');
        }
        $(this).addClass('loading');
        $(pane).addClass('loading');
        $(pane).append('<div class="loading throbber"></div>');

        var data = {
          pane_id: pane_id,
        };
        data[query_key] = value;

        if (typeof args == 'object') {
          $.extend(data, args);
        }

        // Prevent duplicate HTML ids in the returned markup.
        // @see drupal_html_id()
        data['ajax_html_ids[]'] = [];
        $('[id]').each(function () {
          data['ajax_html_ids[]'].push(this.id);
        });

        // Allow Drupal to return new JavaScript and CSS files to load without
        // returning the ones already loaded.
        // @see ajax_base_page_theme()
        // @see drupal_get_css()
        // @see drupal_get_js()
        data['ajax_page_state[theme]'] = Drupal.settings.ajaxPageState.theme;
        data['ajax_page_state[theme_token]'] = Drupal.settings.ajaxPageState.theme_token;
        for (var key in Drupal.settings.ajaxPageState.css) {
          data['ajax_page_state[css][' + key + ']'] = 1;
        }
        for (var key in Drupal.settings.ajaxPageState.js) {
          data['ajax_page_state[js][' + key + ']'] = 1;
        }

        $.ajax({
          url: url,
          data: data,
          method: 'post',
          success: function (response, status, jqXHR) {
            new Drupal.ajax(null, $(document.body), {url: ''}).success(response, status);
          },
          complete: function() {
            $(this).removeClass('loading');
            $(pane).removeClass('loading');
            $(pane).find('.loading.throbber').remove();
          }
        })
      });
    }
  }

})(jQuery, Drupal);
;
(function ($) {

/**
 * A progressbar object. Initialized with the given id. Must be inserted into
 * the DOM afterwards through progressBar.element.
 *
 * method is the function which will perform the HTTP request to get the
 * progress bar state. Either "GET" or "POST".
 *
 * e.g. pb = new progressBar('myProgressBar');
 *      some_element.appendChild(pb.element);
 */
Drupal.progressBar = function (id, updateCallback, method, errorCallback) {
  var pb = this;
  this.id = id;
  this.method = method || 'GET';
  this.updateCallback = updateCallback;
  this.errorCallback = errorCallback;

  // The WAI-ARIA setting aria-live="polite" will announce changes after users
  // have completed their current activity and not interrupt the screen reader.
  this.element = $('<div class="progress" aria-live="polite"></div>').attr('id', id);
  this.element.html('<div class="bar"><div class="filled"></div></div>' +
                    '<div class="percentage"></div>' +
                    '<div class="message">&nbsp;</div>');
};

/**
 * Set the percentage and status message for the progressbar.
 */
Drupal.progressBar.prototype.setProgress = function (percentage, message) {
  if (percentage >= 0 && percentage <= 100) {
    $('div.filled', this.element).css('width', percentage + '%');
    $('div.percentage', this.element).html(percentage + '%');
  }
  $('div.message', this.element).html(message);
  if (this.updateCallback) {
    this.updateCallback(percentage, message, this);
  }
};

/**
 * Start monitoring progress via Ajax.
 */
Drupal.progressBar.prototype.startMonitoring = function (uri, delay) {
  this.delay = delay;
  this.uri = uri;
  this.sendPing();
};

/**
 * Stop monitoring progress via Ajax.
 */
Drupal.progressBar.prototype.stopMonitoring = function () {
  clearTimeout(this.timer);
  // This allows monitoring to be stopped from within the callback.
  this.uri = null;
};

/**
 * Request progress data from server.
 */
Drupal.progressBar.prototype.sendPing = function () {
  if (this.timer) {
    clearTimeout(this.timer);
  }
  if (this.uri) {
    var pb = this;
    // When doing a post request, you need non-null data. Otherwise a
    // HTTP 411 or HTTP 406 (with Apache mod_security) error may result.
    $.ajax({
      type: this.method,
      url: this.uri,
      data: '',
      dataType: 'json',
      success: function (progress) {
        // Display errors.
        if (progress.status == 0) {
          pb.displayError(progress.data);
          return;
        }
        // Update display.
        pb.setProgress(progress.percentage, progress.message);
        // Schedule next timer.
        pb.timer = setTimeout(function () { pb.sendPing(); }, pb.delay);
      },
      error: function (xmlhttp) {
        pb.displayError(Drupal.ajaxError(xmlhttp, pb.uri));
      }
    });
  }
};

/**
 * Display errors on the page.
 */
Drupal.progressBar.prototype.displayError = function (string) {
  var error = $('<div class="messages error"></div>').html(string);
  $(this.element).before(error).hide();

  if (this.errorCallback) {
    this.errorCallback(this);
  }
};

})(jQuery);
;
/**
 * @file
 *
 * Implement a modal form.
 *
 * @see modal.inc for documentation.
 *
 * This javascript relies on the CTools ajax responder.
 */

(function ($) {
  // Make sure our objects are defined.
  Drupal.CTools = Drupal.CTools || {};
  Drupal.CTools.Modal = Drupal.CTools.Modal || {};

  /**
   * Display the modal
   *
   * @todo -- document the settings.
   */
  Drupal.CTools.Modal.show = function(choice) {
    var opts = {};

    if (choice && typeof choice == 'string' && Drupal.settings[choice]) {
      // This notation guarantees we are actually copying it.
      $.extend(true, opts, Drupal.settings[choice]);
    }
    else if (choice) {
      $.extend(true, opts, choice);
    }

    var defaults = {
      modalTheme: 'CToolsModalDialog',
      throbberTheme: 'CToolsModalThrobber',
      animation: 'show',
      animationSpeed: 'fast',
      modalSize: {
        type: 'scale',
        width: .8,
        height: .8,
        addWidth: 0,
        addHeight: 0,
        // How much to remove from the inner content to make space for the
        // theming.
        contentRight: 25,
        contentBottom: 45
      },
      modalOptions: {
        opacity: .55,
        background: '#fff'
      },
      modalClass: 'default'
    };

    var settings = {};
    $.extend(true, settings, defaults, Drupal.settings.CToolsModal, opts);

    if (Drupal.CTools.Modal.currentSettings && Drupal.CTools.Modal.currentSettings != settings) {
      Drupal.CTools.Modal.modal.remove();
      Drupal.CTools.Modal.modal = null;
    }

    Drupal.CTools.Modal.currentSettings = settings;

    var resize = function(e) {
      // When creating the modal, it actually exists only in a theoretical
      // place that is not in the DOM. But once the modal exists, it is in the
      // DOM so the context must be set appropriately.
      var context = e ? document : Drupal.CTools.Modal.modal;

      if (Drupal.CTools.Modal.currentSettings.modalSize.type == 'scale') {
        var width = $(window).width() * Drupal.CTools.Modal.currentSettings.modalSize.width;
        var height = $(window).height() * Drupal.CTools.Modal.currentSettings.modalSize.height;
      }
      else {
        var width = Drupal.CTools.Modal.currentSettings.modalSize.width;
        var height = Drupal.CTools.Modal.currentSettings.modalSize.height;
      }

      // Use the additionol pixels for creating the width and height.
      $('div.ctools-modal-content', context).css({
        'width': width + Drupal.CTools.Modal.currentSettings.modalSize.addWidth + 'px',
        'height': height + Drupal.CTools.Modal.currentSettings.modalSize.addHeight + 'px'
      });
      $('div.ctools-modal-content .modal-content', context).css({
        'width': (width - Drupal.CTools.Modal.currentSettings.modalSize.contentRight) + 'px',
        'height': (height - Drupal.CTools.Modal.currentSettings.modalSize.contentBottom) + 'px'
      });
    };

    if (!Drupal.CTools.Modal.modal) {
      Drupal.CTools.Modal.modal = $(Drupal.theme(settings.modalTheme));
      if (settings.modalSize.type == 'scale') {
        $(window).bind('resize', resize);
      }
    }

    resize();

    $('span.modal-title', Drupal.CTools.Modal.modal).html(Drupal.CTools.Modal.currentSettings.loadingText);
    Drupal.CTools.Modal.modalContent(Drupal.CTools.Modal.modal, settings.modalOptions, settings.animation, settings.animationSpeed, settings.modalClass);
    $('#modalContent .modal-content').html(Drupal.theme(settings.throbberTheme)).addClass('ctools-modal-loading');

    // Position autocomplete results based on the scroll position of the modal.
    $('#modalContent .modal-content').delegate('input.form-autocomplete', 'keyup', function() {
      $('#autocomplete').css('top', $(this).position().top + $(this).outerHeight() + $(this).offsetParent().filter('#modal-content').scrollTop());
    });
  };

  /**
   * Hide the modal
   */
  Drupal.CTools.Modal.dismiss = function() {
    if (Drupal.CTools.Modal.modal) {
      Drupal.CTools.Modal.unmodalContent(Drupal.CTools.Modal.modal);
    }
  };

  /**
   * Provide the HTML to create the modal dialog.
   */
  Drupal.theme.prototype.CToolsModalDialog = function () {
    var html = '';
    html += '<div id="ctools-modal">';
    html += '  <div class="ctools-modal-content">'; // panels-modal-content
    html += '    <div class="modal-header">';
    html += '      <a class="close" href="#">';
    html +=          Drupal.CTools.Modal.currentSettings.closeText + Drupal.CTools.Modal.currentSettings.closeImage;
    html += '      </a>';
    html += '      <span id="modal-title" class="modal-title">&nbsp;</span>';
    html += '    </div>';
    html += '    <div id="modal-content" class="modal-content">';
    html += '    </div>';
    html += '  </div>';
    html += '</div>';

    return html;
  };

  /**
   * Provide the HTML to create the throbber.
   */
  Drupal.theme.prototype.CToolsModalThrobber = function () {
    var html = '';
    html += '<div id="modal-throbber">';
    html += '  <div class="modal-throbber-wrapper">';
    html +=      Drupal.CTools.Modal.currentSettings.throbber;
    html += '  </div>';
    html += '</div>';

    return html;
  };

  /**
   * Figure out what settings string to use to display a modal.
   */
  Drupal.CTools.Modal.getSettings = function (object) {
    var match = $(object).attr('class').match(/ctools-modal-(\S+)/);
    if (match) {
      return match[1];
    }
  };

  /**
   * Click function for modals that can be cached.
   */
  Drupal.CTools.Modal.clickAjaxCacheLink = function () {
    Drupal.CTools.Modal.show(Drupal.CTools.Modal.getSettings(this));
    return Drupal.CTools.AJAX.clickAJAXCacheLink.apply(this);
  };

  /**
   * Handler to prepare the modal for the response
   */
  Drupal.CTools.Modal.clickAjaxLink = function () {
    Drupal.CTools.Modal.show(Drupal.CTools.Modal.getSettings(this));
    return false;
  };

  /**
   * Submit responder to do an AJAX submit on all modal forms.
   */
  Drupal.CTools.Modal.submitAjaxForm = function(e) {
    var $form = $(this);
    var url = $form.attr('action');

    setTimeout(function() { Drupal.CTools.AJAX.ajaxSubmit($form, url); }, 1);
    return false;
  };

  /**
   * Bind links that will open modals to the appropriate function.
   */
  Drupal.behaviors.ZZCToolsModal = {
    attach: function(context) {
      // Bind links
      // Note that doing so in this order means that the two classes can be
      // used together safely.
      /*
       * @todo remimplement the warm caching feature
       $('a.ctools-use-modal-cache', context).once('ctools-use-modal', function() {
         $(this).click(Drupal.CTools.Modal.clickAjaxCacheLink);
         Drupal.CTools.AJAX.warmCache.apply(this);
       });
        */

      $('area.ctools-use-modal, a.ctools-use-modal', context).once('ctools-use-modal', function() {
        var $this = $(this);
        $this.click(Drupal.CTools.Modal.clickAjaxLink);
        // Create a drupal ajax object
        var element_settings = {};
        if ($this.attr('href')) {
          element_settings.url = $this.attr('href');
          element_settings.event = 'click';
          element_settings.progress = { type: 'throbber' };
        }
        var base = $this.attr('href');
        Drupal.ajax[base] = new Drupal.ajax(base, this, element_settings);
      });

      // Bind buttons
      $('input.ctools-use-modal, button.ctools-use-modal', context).once('ctools-use-modal', function() {
        var $this = $(this);
        $this.click(Drupal.CTools.Modal.clickAjaxLink);
        var button = this;
        var element_settings = {};

        // AJAX submits specified in this manner automatically submit to the
        // normal form action.
        element_settings.url = Drupal.CTools.Modal.findURL(this);
        if (element_settings.url == '') {
          element_settings.url = $(this).closest('form').attr('action');
        }
        element_settings.event = 'click';
        element_settings.setClick = true;

        var base = $this.attr('id');
        Drupal.ajax[base] = new Drupal.ajax(base, this, element_settings);

        // Make sure changes to settings are reflected in the URL.
        $('.' + $(button).attr('id') + '-url').change(function() {
          Drupal.ajax[base].options.url = Drupal.CTools.Modal.findURL(button);
        });
      });

      // Bind our custom event to the form submit
      $('#modal-content form', context).once('ctools-use-modal', function() {
        var $this = $(this);
        var element_settings = {};

        element_settings.url = $this.attr('action');
        element_settings.event = 'submit';
        element_settings.progress = { 'type': 'throbber' };
        var base = $this.attr('id');

        Drupal.ajax[base] = new Drupal.ajax(base, this, element_settings);
        Drupal.ajax[base].form = $this;

        $('input[type=submit], button', this).click(function(event) {
          Drupal.ajax[base].element = this;
          this.form.clk = this;
          // Stop autocomplete from submitting.
          if (Drupal.autocompleteSubmit && !Drupal.autocompleteSubmit()) {
            return false;
          }
          // An empty event means we were triggered via .click() and
          // in jquery 1.4 this won't trigger a submit.
          // We also have to check jQuery version to prevent
          // IE8 + jQuery 1.4.4 to break on other events
          // bound to the submit button.
          if (jQuery.fn.jquery.substr(0, 3) === '1.4' && typeof event.bubbles === "undefined") {
            $(this.form).trigger('submit');
            return false;
          }
        });
      });

      // Bind a click handler to allow elements with the 'ctools-close-modal'
      // class to close the modal.
      $('.ctools-close-modal', context).once('ctools-close-modal')
        .click(function() {
          Drupal.CTools.Modal.dismiss();
          return false;
        });
    }
  };

  // The following are implementations of AJAX responder commands.

  /**
   * AJAX responder command to place HTML within the modal.
   */
  Drupal.CTools.Modal.modal_display = function(ajax, response, status) {
    var settings = response.settings || ajax.settings || Drupal.settings;
    // If the modal does not exist yet, create it.
    if ($('#modalContent').length == 0) {
      Drupal.CTools.Modal.show(Drupal.CTools.Modal.getSettings(ajax.element));
    }
    // If the modal exists run detachBehaviors before removing existing content.
    else {
      Drupal.detachBehaviors($('#modalContent'), settings, 'unload');
    }
    $('#modal-title').html(response.title);
    // Simulate an actual page load by scrolling to the top after adding the
    // content. This is helpful for allowing users to see error messages at the
    // top of a form, etc.
    $('#modal-content').html(response.output).scrollTop(0);
    $(document).trigger('CToolsAttachBehaviors', $('#modalContent'));

    // Attach behaviors within a modal dialog.
    Drupal.attachBehaviors($('#modalContent'), settings);

    if ($('#modal-content').hasClass('ctools-modal-loading')) {
      $('#modal-content').removeClass('ctools-modal-loading');
    }
    else {
      // If the modal was already shown, and we are simply replacing its
      // content, then focus on the first focusable element in the modal.
      // (When first showing the modal, focus will be placed on the close
      // button by the show() function called above.)
      $('#modal-content :focusable:first').focus();
    }
  };

  /**
   * AJAX responder command to dismiss the modal.
   */
  Drupal.CTools.Modal.modal_dismiss = function(command) {
    Drupal.CTools.Modal.dismiss();
    $('link.ctools-temporary-css').remove();
  };

  /**
   * Display loading
   */
  //Drupal.CTools.AJAX.commands.modal_loading = function(command) {
  Drupal.CTools.Modal.modal_loading = function(command) {
    Drupal.CTools.Modal.modal_display({
      output: Drupal.theme(Drupal.CTools.Modal.currentSettings.throbberTheme),
      title: Drupal.CTools.Modal.currentSettings.loadingText
    });
  };

  /**
   * Find a URL for an AJAX button.
   *
   * The URL for this gadget will be composed of the values of items by
   * taking the ID of this item and adding -url and looking for that
   * class. They need to be in the form in order since we will
   * concat them all together using '/'.
   */
  Drupal.CTools.Modal.findURL = function(item) {
    var url = '';
    var url_class = '.' + $(item).attr('id') + '-url';
    $(url_class).each(
      function() {
        var $this = $(this);
        if (url && $this.val()) {
          url += '/';
        }
        url += $this.val();
      });
    return url;
  };


  /**
   * modalContent
   * @param content string to display in the content box
   * @param css obj of css attributes
   * @param animation (fadeIn, slideDown, show)
   * @param speed (valid animation speeds slow, medium, fast or # in ms)
   * @param modalClass class added to div#modalContent
   */
  Drupal.CTools.Modal.modalContent = function(content, css, animation, speed, modalClass) {
    // If our animation isn't set, make it just show/pop
    if (!animation) {
      animation = 'show';
    }
    else {
      // If our animation isn't "fadeIn" or "slideDown" then it always is show
      if (animation != 'fadeIn' && animation != 'slideDown') {
        animation = 'show';
      }
    }

    if (!speed && 0 !== speed) {
      speed = 'fast';
    }

    // Build our base attributes and allow them to be overriden
    css = jQuery.extend({
      position: 'absolute',
      left: '0px',
      margin: '0px',
      background: '#000',
      opacity: '.55'
    }, css);

    // Add opacity handling for IE.
    css.filter = 'alpha(opacity=' + (100 * css.opacity) + ')';
    content.hide();

    // If we already have modalContent, remove it.
    if ($('#modalBackdrop').length) $('#modalBackdrop').remove();
    if ($('#modalContent').length) $('#modalContent').remove();

    // position code lifted from http://www.quirksmode.org/viewport/compatibility.html
    if (self.pageYOffset) { // all except Explorer
    var wt = self.pageYOffset;
    } else if (document.documentElement && document.documentElement.scrollTop) { // Explorer 6 Strict
      var wt = document.documentElement.scrollTop;
    } else if (document.body) { // all other Explorers
      var wt = document.body.scrollTop;
    }

    // Get our dimensions

    // Get the docHeight and (ugly hack) add 50 pixels to make sure we dont have a *visible* border below our div
    var docHeight = $(document).height() + 50;
    var docWidth = $(document).width();
    var winHeight = $(window).height();
    var winWidth = $(window).width();
    if( docHeight < winHeight ) docHeight = winHeight;

    // Create our divs
    $('body').append('<div id="modalBackdrop" class="backdrop-' + modalClass + '" style="z-index: 1000; display: none;"></div><div id="modalContent" class="modal-' + modalClass + '" style="z-index: 1001; position: absolute;">' + $(content).html() + '</div>');

    // Get a list of the tabbable elements in the modal content.
    var getTabbableElements = function () {
      var tabbableElements = $('#modalContent :tabbable'),
          radioButtons = tabbableElements.filter('input[type="radio"]');

      // The list of tabbable elements from jQuery is *almost* right. The
      // exception is with groups of radio buttons. The list from jQuery will
      // include all radio buttons, when in fact, only the selected radio button
      // is tabbable, and if no radio buttons in a group are selected, then only
      // the first is tabbable.
      if (radioButtons.length > 0) {
        // First, build up an index of which groups have an item selected or not.
        var anySelected = {};
        radioButtons.each(function () {
          var name = this.name;

          if (typeof anySelected[name] === 'undefined') {
            anySelected[name] = radioButtons.filter('input[name="' + name + '"]:checked').length !== 0;
          }
        });

        // Next filter out the radio buttons that aren't really tabbable.
        var found = {};
        tabbableElements = tabbableElements.filter(function () {
          var keep = true;

          if (this.type == 'radio') {
            if (anySelected[this.name]) {
              // Only keep the selected one.
              keep = this.checked;
            }
            else {
              // Only keep the first one.
              if (found[this.name]) {
                keep = false;
              }
              found[this.name] = true;
            }
          }

          return keep;
        });
      }

      return tabbableElements.get();
    };

    // Keyboard and focus event handler ensures only modal elements gain focus.
    modalEventHandler = function( event ) {
      target = null;
      if ( event ) { //Mozilla
        target = event.target;
      } else { //IE
        event = window.event;
        target = event.srcElement;
      }

      var parents = $(target).parents().get();
      for (var i = 0; i < parents.length; ++i) {
        var position = $(parents[i]).css('position');
        if (position == 'absolute' || position == 'fixed') {
          return true;
        }
      }

      if ($(target).is('#modalContent, body') || $(target).filter('*:visible').parents('#modalContent').length) {
        // Allow the event only if target is a visible child node
        // of #modalContent.
        return true;
      }
      else {
        getTabbableElements()[0].focus();
      }

      event.preventDefault();
    };
    $('body').bind( 'focus', modalEventHandler );
    $('body').bind( 'keypress', modalEventHandler );

    // Keypress handler Ensures you can only TAB to elements within the modal.
    // Based on the psuedo-code from WAI-ARIA 1.0 Authoring Practices section
    // 3.3.1 "Trapping Focus".
    modalTabTrapHandler = function (evt) {
      // We only care about the TAB key.
      if (evt.which != 9) {
        return true;
      }

      var tabbableElements = getTabbableElements(),
          firstTabbableElement = tabbableElements[0],
          lastTabbableElement = tabbableElements[tabbableElements.length - 1],
          singleTabbableElement = firstTabbableElement == lastTabbableElement,
          node = evt.target;

      // If this is the first element and the user wants to go backwards, then
      // jump to the last element.
      if (node == firstTabbableElement && evt.shiftKey) {
        if (!singleTabbableElement) {
          lastTabbableElement.focus();
        }
        return false;
      }
      // If this is the last element and the user wants to go forwards, then
      // jump to the first element.
      else if (node == lastTabbableElement && !evt.shiftKey) {
        if (!singleTabbableElement) {
          firstTabbableElement.focus();
        }
        return false;
      }
      // If this element isn't in the dialog at all, then jump to the first
      // or last element to get the user into the game.
      else if ($.inArray(node, tabbableElements) == -1) {
        // Make sure the node isn't in another modal (ie. WYSIWYG modal).
        var parents = $(node).parents().get();
        for (var i = 0; i < parents.length; ++i) {
          var position = $(parents[i]).css('position');
          if (position == 'absolute' || position == 'fixed') {
            return true;
          }
        }

        if (evt.shiftKey) {
          lastTabbableElement.focus();
        }
        else {
          firstTabbableElement.focus();
        }
      }
    };
    $('body').bind('keydown', modalTabTrapHandler);

    // Create our content div, get the dimensions, and hide it
    var modalContent = $('#modalContent').css('top','-1000px');
    var $modalHeader = modalContent.find('.modal-header');
    var mdcTop = wt + Math.max((winHeight / 2) - (modalContent.outerHeight() / 2), 0);
    var mdcLeft = ( winWidth / 2 ) - ( modalContent.outerWidth() / 2);
    $('#modalBackdrop').css(css).css('top', 0).css('height', docHeight + 'px').css('width', docWidth + 'px').show();
    modalContent.css({top: mdcTop + 'px', left: mdcLeft + 'px'}).hide()[animation](speed);

    // Bind a click for closing the modalContent
    modalContentClose = function(){close(); return false;};
    $('.close', $modalHeader).bind('click', modalContentClose);

    // Bind a keypress on escape for closing the modalContent
    modalEventEscapeCloseHandler = function(event) {
      if (event.keyCode == 27) {
        close();
        return false;
      }
    };

    $(document).bind('keydown', modalEventEscapeCloseHandler);

    // Per WAI-ARIA 1.0 Authoring Practices, initial focus should be on the
    // close button, but we should save the original focus to restore it after
    // the dialog is closed.
    var oldFocus = document.activeElement;
    $('.close', $modalHeader).focus();

    // Close the open modal content and backdrop
    function close() {
      // Unbind the events
      $(window).unbind('resize',  modalContentResize);
      $('body').unbind( 'focus', modalEventHandler);
      $('body').unbind( 'keypress', modalEventHandler );
      $('body').unbind( 'keydown', modalTabTrapHandler );
      $('.close', $modalHeader).unbind('click', modalContentClose);
      $(document).unbind('keydown', modalEventEscapeCloseHandler);
      $(document).trigger('CToolsCloseModalBehaviors', $('#modalContent'));
      $(document).trigger('CToolsDetachBehaviors', $('#modalContent'));

      // Closing animation.
      switch (animation) {
        case 'fadeIn':
          modalContent.fadeOut(speed, modalContentRemove);
          break;

        case 'slideDown':
          modalContent.slideUp(speed, modalContentRemove);
          break;

        case 'show':
          modalContent.hide(speed, modalContentRemove);
          break;
      }
    }

    // Remove the content.
    modalContentRemove = function () {
      $('#modalContent').remove();
      $('#modalBackdrop').remove();

      // Restore focus to where it was before opening the dialog.
      $(oldFocus).focus();
    };

    // Move and resize the modalBackdrop and modalContent on window resize.
    modalContentResize = function () {
      // Reset the backdrop height/width to get accurate document size.
      $('#modalBackdrop').css('height', '').css('width', '');

      // Position code lifted from:
      // http://www.quirksmode.org/viewport/compatibility.html
      if (self.pageYOffset) { // all except Explorer
        var wt = self.pageYOffset;
      } else if (document.documentElement && document.documentElement.scrollTop) { // Explorer 6 Strict
        var wt = document.documentElement.scrollTop;
      } else if (document.body) { // all other Explorers
        var wt = document.body.scrollTop;
      }

      // Get our heights
      var docHeight = $(document).height();
      var docWidth = $(document).width();
      var winHeight = $(window).height();
      var winWidth = $(window).width();
      if( docHeight < winHeight ) docHeight = winHeight;

      // Get where we should move content to
      var modalContent = $('#modalContent');
      var mdcTop = wt + Math.max((winHeight / 2) - (modalContent.outerHeight() / 2), 0);
      var mdcLeft = ( winWidth / 2 ) - ( modalContent.outerWidth() / 2);

      // Apply the changes
      $('#modalBackdrop').css('height', docHeight + 'px').css('width', docWidth + 'px').show();
      modalContent.css('top', mdcTop + 'px').css('left', mdcLeft + 'px').show();
    };
    $(window).bind('resize', modalContentResize);
  };

  /**
   * unmodalContent
   * @param content (The jQuery object to remove)
   * @param animation (fadeOut, slideUp, show)
   * @param speed (valid animation speeds slow, medium, fast or # in ms)
   */
  Drupal.CTools.Modal.unmodalContent = function(content, animation, speed)
  {
    // If our animation isn't set, make it just show/pop
    if (!animation) { var animation = 'show'; } else {
      // If our animation isn't "fade" then it always is show
      if (( animation != 'fadeOut' ) && ( animation != 'slideUp')) animation = 'show';
    }
    // Set a speed if we dont have one
    if ( !speed ) var speed = 'fast';

    // Unbind the events we bound
    $(window).unbind('resize', modalContentResize);
    $('body').unbind('focus', modalEventHandler);
    $('body').unbind('keypress', modalEventHandler);
    $('body').unbind( 'keydown', modalTabTrapHandler );
    var $modalContent = $('#modalContent');
    var $modalHeader = $modalContent.find('.modal-header');
    $('.close', $modalHeader).unbind('click', modalContentClose);
    $(document).unbind('keydown', modalEventEscapeCloseHandler);
    $(document).trigger('CToolsDetachBehaviors', $modalContent);

    // jQuery magic loop through the instances and run the animations or removal.
    content.each(function(){
      if ( animation == 'fade' ) {
        $('#modalContent').fadeOut(speed, function() {
          $('#modalBackdrop').fadeOut(speed, function() {
            $(this).remove();
          });
          $(this).remove();
        });
      } else {
        if ( animation == 'slide' ) {
          $('#modalContent').slideUp(speed,function() {
            $('#modalBackdrop').slideUp(speed, function() {
              $(this).remove();
            });
            $(this).remove();
          });
        } else {
          $('#modalContent').remove();
          $('#modalBackdrop').remove();
        }
      }
    });
  };

$(function() {
  Drupal.ajax.prototype.commands.modal_display = Drupal.CTools.Modal.modal_display;
  Drupal.ajax.prototype.commands.modal_dismiss = Drupal.CTools.Modal.modal_dismiss;
});

})(jQuery);
;
(function($) {

  Drupal.hpc_active_download = null;

  // Generic download-start function.
  // Credits to https://gist.github.com/DavidMah/3533415
  Drupal.hpc_start_download = function (download_id) {
    if (Drupal.hpc_active_download != download_id) {
      return;
    }
    var form = $('<form id="download-form-' + download_id + '"></form>').attr('action', '/downloads/' + download_id + '/download').attr('method', 'get');
    form.appendTo('body').submit().remove();
  }

  Drupal.hpc_check_download_status = function (download_id) {
    if (Drupal.hpc_active_download != download_id) {
      return;
    }
    $.ajax({
      url: '/downloads/' + download_id + '/check',
      type: "get"
    })
      .done(function(data) {
        var download_link_selector = '*[data-download-id="' + download_id + '"]';
        if (data.status == 'success') {
          // Start the actual file download.
          Drupal.hpc_downloads_set_panel_class(download_link_selector, false);
          Drupal.hpc_downloads_set_modal_footer(Drupal.t('Download generation finished.'), false);
          Drupal.hpc_downloads_set_modal_content(Drupal.t('The file should have been downloaded automatically to your computer. If this is not the case, you can also download it here directly: <a href="!url">Download link</a>', {'!url': '/downloads/' + download_id + '/download'}));
          Drupal.hpc_start_download(download_id);

        }
        else if (data.status == 'error') {
          // Show an error message.
          Drupal.hpc_downloads_set_modal_footer(Drupal.t('There was an error creating the download file.'), false);
          Drupal.hpc_downloads_set_panel_class(download_link_selector, false);
        }
        else if (data.status == 'pending') {
          // Try again a bit later.
          setTimeout(function() {
            Drupal.hpc_check_download_status(download_id);
          }, 1000);
        }
      });
  }

  Drupal.hpc_downloads_set_modal_content = function(message) {
    $('#modal-content .modal-content-inner').html('<p>' + message + '</p>');
  }
  Drupal.hpc_downloads_set_modal_footer = function(message, throbber = true) {
    $('.modal-footer .modal-footer-inner').html('<p>' + (throbber ? Drupal.settings['hpc-downloads'].throbberImage : '') + message + '</p>');
  }

  Drupal.hpc_downloads_set_panel_class = function(child_selector, class_status) {
    var panel_pane = $(child_selector).parents('.panel-pane');
    if (!panel_pane) {
      return;
    }
    if (class_status == true) {
      $(panel_pane).addClass('download-active');
    }
    else {
      $(panel_pane).removeClass('download-active');
    }
  }

  Drupal.hpc_downloads_inititate_download = function(download_link, options) {

    var page_title = $(download_link).data('page-title');
    var url = $(download_link).data('download-url');
    var type = $(download_link).data('download-type');
    var selector = $(download_link).data('download-selector');
    var task = $(download_link).data('download-task');
    var subtype = $(download_link).data('download-subtype');
    var pid = $(download_link).data('download-pid');
    var path = $(download_link).data('download-path');

    var pane_title = options.pane_title;

    Drupal.hpc_downloads_set_modal_content(Drupal.t('The download process has been started. Please note that generating the download file may take a few moments.'));
    Drupal.hpc_downloads_set_modal_footer(Drupal.t('Initiating download'));
    Drupal.attachBehaviors($('#modal-content')[0], settings);

    // Special logic to allow for an early closing of a modal window,
    // while the window content is still loaded. If the user closes the
    // modal before the window is fully loaded, We override the success
    // callback and prevent the content to be inserted into the dom once
    // the background callback finishes.
    $(document).on('CToolsDetachBehaviors', function() {
      // Find the active download pane, that's the one that has been markes
      // as active.
      var download_pane = $(this).find('.panel-pane.download-active');
      if (!download_pane) {
        // If we don't have it, that means we are currently not in charge.
        return;
      }
      var download_link = $(download_pane).find('.download-link');
      if (download_link) {
        Drupal.hpc_downloads_set_panel_class(download_link, false);
      }
      Drupal.hpc_active_download = null;
    });

    var json_settings = {
      maps: [],
      chloropleth_maps: [],
      form_selects: [],
    };

    // Assemble select values.
    $((selector ? selector : '#main-content') + ' select.form-select').each(function() {
      json_settings.form_selects.push({
        selector_id: $(this).parents('.panel-pane').attr('id'),
        name: $(this).attr('name'),
        value: $(this).val(),
      });
    });

    // Spot maps.
    if (typeof Drupal.hpc_map != 'undefined') {
      // If there is map data, capture the current state and pass it on to
      // the PDF generation.
      $.each(Drupal.hpc_map.states, function(key, value) {
        let selector_id = $('#' + key).parents('.panel-pane').attr('id');
        if (!selector_id) {
          return;
        }
        json_settings.maps.push({
          selector_id: selector_id,
          tab_index: value.index,
          variant_id: value.variant_id ? value.variant_id : null,
          location_id: value.active_location ? value.active_location.location_id : null,
          map_style: value.options.map_style ? value.options.map_style : null,
          active_donut_segments: value.active_donut_segments ? value.active_donut_segments : null,
          active_donut_display_value: value.active_donut_display_value ? value.active_donut_display_value : null,
        });
      });
    }

    // Chloropleth maps.
    if (typeof Drupal.hpc_map_chloropleth != 'undefined') {
      // If there is map data, capture the current state and pass it on to
      // the PDF generation.
      $.each(Drupal.hpc_map_chloropleth.states, function(key, value) {
        let selector_id = $('#' + key).parents('.panel-pane').attr('id');
        if (!selector_id) {
          return;
        }
        json_settings.chloropleth_maps.push({
          selector_id: selector_id,
          location_id: value.active_area ? value.active_area.properties.location_id : null
        });
      });
    }

    var arguments = {
      'url': url,
      'type': type,
      'page_title': page_title,
      'pane_title': pane_title,
      'json_settings': type == 'pdf' || type == 'screenshot' ? JSON.stringify(json_settings) : null,
      'selector': selector ? selector : null,
      'pid': pid ? pid : null,
      'task': task ? task : null,
      'subtype': subtype ? subtype : null,
      'path': path ? path : null,
    };

    if (typeof options.args == 'object') {
      arguments.element_options = options.args;
    }

    $.ajax({
      url: '/downloads/initiate',
      type: "get",
      data: arguments
    })
      .done(function(data) {
        if (data.hasOwnProperty('download_id')) {
          var download_id = data.download_id;
          Drupal.hpc_active_download = download_id;
          download_link.attr('data-download-id', download_id);
          Drupal.hpc_downloads_set_modal_footer(Drupal.t('Processing download'));
          setTimeout(function() {
            Drupal.hpc_check_download_status(download_id);
          }, 2000);
        }
        else {
          Drupal.hpc_active_download = null;
          Drupal.hpc_downloads_set_modal_footer(Drupal.t('There was an error initiating the download.'), false);
          $(download_link).css('opacity', 1);
        }
      })
      .fail(function() {
        Drupal.hpc_active_download = null;
        Drupal.hpc_downloads_set_modal_footer(Drupal.t('There was an error initiating the download.'), false);
        $(download_link).css('opacity', 1);
      });
  }

  Drupal.behaviors.hpc_downloads = {
    attach: function(context, settings) {

      $('body', context).click(function(e) {
        if ($(e.target).parents('.download-link-wrapper').length == 0) {
          $('.download-link-inner.show').removeClass('show');
        }
      });

      $('.download-icon', context).click(function() {
        $(this).parents('.download-link-wrapper').find('.download-link-inner').addClass('show');
      });

      $('.download-link', context).click(function() {
        $(this).parents('.download-link-wrapper').find('.download-link-inner').removeClass('show');
        var download_link = $(this);

        // Mark the pane as having an active download process.
        Drupal.hpc_downloads_set_panel_class(download_link, true);

        // Show the modal window.
        Drupal.CTools.Modal.show('hpc-download-modal');
        var modal_title = Drupal.t('Download');
        var pane_title = '';

        if ($(download_link).data('download-pane-title')) {
          // Pane title can either be set by a data attribute.
          pane_title = $(download_link).data('download-pane-title');
        }
        else {
          // Or we try to extract it from the parent panel pane.
          pane_title_element = $(download_link).parents('.panel-pane').find('.pane-title');
          if (pane_title_element.length && pane_title_element.text()) {

            pane_title = pane_title_element
              .clone()    //clone the element
              .children() //select all the children
              .remove()   //remove all the children
              .end()
              .text().trim();
          }
        }

        if (pane_title) {
          modal_title += ': ' + (pane_title.length > 44 ? pane_title.substring(0, 40) + ' ...' : pane_title);
        }
        $('#modal-title').html(modal_title);
        $('#modal-content').html('<div class="modal-content-inner"></div>');
        $('#modal-content').append('<div class="modal-footer"><div class="modal-footer-inner"></div><div class="modal-footer-meta"></div></div>');

        if ($(download_link).data('download-download-options')) {
          let download_options = $(download_link).data('download-download-options');
          let download_options_markup = $('<div>').addClass('download-options-wrapper');

          for (option_index in download_options) {

            let download_option = download_options[option_index];

            let option_button = $('<button>' + download_option.title + '</button>')
              .addClass('download-options-button')
              .attr('data-option-arguments', JSON.stringify(download_option.args));

            let option_button_wrapper = $('<div>')
              .addClass('download-option-button-wrapper')
              .append(option_button);

            if (typeof download_option.description != 'undefined' && download_option.description) {
              option_button_wrapper.append($('<p>', {text: download_option.description}).addClass('description'));
            }

            $(download_options_markup).append(option_button_wrapper);
          }

          Drupal.hpc_downloads_set_modal_content($(download_options_markup).html());
          $('#modal-content button.download-options-button').click(function() {
            var download_arguments = {pane_title: pane_title};
            download_arguments.args = $(this).data('option-arguments');
            Drupal.hpc_downloads_inititate_download(download_link, download_arguments);
          });
        }
        else {
          Drupal.hpc_downloads_inititate_download(download_link, {pane_title: pane_title});
        }
      });
    }
  };

})(jQuery, Drupal);
;
/**
 * @file
 * Custom scripts for theme.
 */

 (function ($, Drupal, window, document) {
  Drupal.behaviors.hpc_popover = {
    attach: function (context, setting) {
      // Make sure that we can use tables in tooltips and popups.
      var tooltipWhiteList = $.fn.tooltip.Constructor.DEFAULTS.whiteList;
      tooltipWhiteList.table = [/.*/];
      tooltipWhiteList.thead = [/.*/];
      tooltipWhiteList.tbody = [/.*/];
      tooltipWhiteList.tr = [/.*/];
      tooltipWhiteList.th = [/.*/];
      tooltipWhiteList.td = [/.*/];
      tooltipWhiteList.textarea = ['rows', 'cols'];
      tooltipWhiteList.svg = [/.*/];
      tooltipWhiteList.defs = [/.*/];
      tooltipWhiteList.style = [/.*/];
      tooltipWhiteList.g = [/.*/];
      tooltipWhiteList.circle = [/.*/];
      tooltipWhiteList.path = [/.*/];

      // Add tooltip behaviors and make sure the tooltip stays open while
      // hovering with the mouse.
      function checkTooltipVisibility(_this) {
        setTimeout(function () {
          if (!$(".tooltip:hover").length) {
            $(_this).tooltip("hide")
          }
          else {
            checkTooltipVisibility(_this);
          }
        }, 100);
      }
      $('[data-toggle="tooltip"]').once('tooltip').tooltip({
        html: true,
        trigger: 'manual'
      }).on("mouseenter", function () {
        var _this = this;
        $('.tooltip').not(_this).tooltip('hide');
        $(this).tooltip("show");
      }).on("mouseleave", function () {
        var _this = this;
        checkTooltipVisibility(_this);
      }).each(function(i, el) {
        var classes = $(el).attr('class').split(/\s+/);
        let exclude_classes = ['fa', 'fa-question-circle', 'material-icons', 'tooltip-processed'];
        $.each(classes, function(i, element_class) {
          if (exclude_classes.includes(element_class)) {
            return;
          }
          $(el).data('bs.tooltip').tip().addClass(element_class);
        });
      });

      // Add popover behaviors and make sure the tooltip stays open while
      // hovering with the mouse.
      function checkPopoverVisibility(_this) {
        setTimeout(function () {
          if (!$(".popover:hover").length) {
            $(_this).popover("hide")
          }
          else {
            checkPopoverVisibility(_this);
          }
        }, 100);
      }
      // Manual trigger, this is our default and we use an improved version of
      // a hover-trigger.
      $('[data-toggle="popover"][data-trigger="manual"]').once('popover').popover({
        html: true,
        container: 'body',
        trigger: 'manual'
      }).on("mouseenter", function () {
        var _this = this;
        $('.popover').not(_this).popover('hide');
        $(this).popover("show");
      }).on("mouseleave", function () {
        var _this = this;
        checkPopoverVisibility(_this);
      }).each(function(i, el) {
        var classes = $(el).attr('class').split(/\s+/);
        let exclude_classes = ['fa', 'fa-question-circle', 'material-icons', 'popover-processed', 'trigger',];
        $.each(classes, function(i, element_class) {
          if (exclude_classes.includes(element_class)) {
            return;
          }
          $(el).data('bs.popover').tip().addClass(element_class);
        });
        $(el).data('bs.popover').tip().addClass('popover-wrapper');
      });

      // Click trigger. The thing we need to handle here is the closing.
      $('[data-toggle="popover"][data-trigger="click"]').once('popover').popover({
        html: true,
        container: 'body',
        trigger: 'manual',
      }).on('click', function(e) {
        var _this = this;
        if ($(this).hasClass('active')) {
          // Clicked on currrently active trigger. Close the popup and exit.
          $(this).popover("hide");
          $(this).removeClass('active');
          return;
        }
        // Click on another trigger. Close open popups and open the targeted one.
        $('.popover').not(_this).popover('hide');
        $(this).popover("show");
        $(this).addClass('active');
        // Special handling for textareas.
        if ($($(this).data('bs.popover').tip()).find('textarea.selected')) {
          $($(this).data('bs.popover').tip()).find('textarea.selected').focus();
          $($(this).data('bs.popover').tip()).find('textarea.selected').select();
        }
      }).each(function(i, el) {
        var classes = $(el).attr('class').split(/\s+/);
        let exclude_classes = ['fa', 'fa-question-circle', 'material-icons', 'popover-processed', 'trigger',];
        $.each(classes, function(i, element_class) {
          if (exclude_classes.includes(element_class)) {
            return;
          }
          $(el).data('bs.popover').tip().addClass(element_class);
        });
        $(el).data('bs.popover').tip().addClass('popover-wrapper');
      });
      $(document).click(function(e) {
        // Close all popups when clicking anywhere outside the popup.
        if ($(e.target).is('.popover.trigger')) {
          return;
        }
        if (!$(e.target).parents('.popover-wrapper').length) {
          $('.popover-wrapper').popover('hide');
          $('.popover.trigger').removeClass('active');
        }
      });

      // Special admin candy: Copy API URL to the clipboard.
      $('.tooltip.api-url').once('tooltip').click(function () {
        // Taken from https://stackoverflow.com/a/33928558/368479
        // Copies a string to the clipboard. Must be called from within an
        // event handler such as click. May return false if it failed, but
        // this is not always possible. Browser support for Chrome 43+,
        // Firefox 42+, Safari 10+, Edge and IE 10+.
        // IE: The clipboard feature may be disabled by an administrator. By
        // default a prompt is shown the first time the clipboard is
        // used (per session).
        function copyToClipboard(text) {
          if (window.clipboardData && window.clipboardData.setData) {
            // IE specific code path to prevent textarea being shown while dialog is visible.
            return clipboardData.setData("Text", text);
          }
          else if (document.queryCommandSupported && document.queryCommandSupported("copy")) {
            var textarea = document.createElement("textarea");
            textarea.textContent = text;
            textarea.style.position = "fixed";  // Prevent scrolling to bottom of page in MS Edge.
            document.body.appendChild(textarea);
            textarea.select();
            try {
              return document.execCommand("copy");  // Security exception may be thrown by some browsers.
            }
            catch (ex) {
              console.warn("Copy to clipboard failed.", ex);
              return false;
            } finally {
              document.body.removeChild(textarea);
            }
          }
        }

        // Copy the API URL to the clipboard.
        var copy_text = $(this).data('original-title');
        var first_space = copy_text.indexOf(' ');
        copyToClipboard(first_space > 0 ? copy_text.substr(0, first_space) : copy_text);
      });
    }
  }
})(jQuery, Drupal, this, this.document);;
/*
  SortTable
  version 2
  7th April 2007
  Stuart Langridge, http://www.kryogenix.org/code/browser/sorttable/

  Instructions:
  Download this file
  Add <script src="sorttable.js"></script> to your HTML
  Add class="sortable" to any table you'd like to make sortable
  Click on the headers to sort

  Thanks to many, many people for contributions and suggestions.
  Licenced as X11: http://www.kryogenix.org/code/browser/licence.html
  This basically means: do what you want with it.
*/


var stIsIE = /*@cc_on!@*/false;

sorttable = {
  init: function() {
    // quit if this function has already been called
    if (arguments.callee.done) return;
    // flag this function so we don't do the same thing twice
    arguments.callee.done = true;
    // kill the timer
    if (_timer) clearInterval(_timer);

    if (!document.createElement || !document.getElementsByTagName) return;

    sorttable.DATE_RE = /^(\d\d?)[\/\.-](\d\d?)[\/\.-]((\d\d)?\d\d)$/;

    forEach(document.getElementsByTagName('table'), function(table) {
      if (table.className.search(/\bsortable\b/) != -1) {
        sorttable.makeSortable(table);
      }
    });

  },

  makeSortable: function(table) {
    if (table.getElementsByTagName('thead').length == 0) {
      // table doesn't have a tHead. Since it should have, create one and
      // put the first table row in it.
      the = document.createElement('thead');
      the.appendChild(table.rows[0]);
      table.insertBefore(the,table.firstChild);
    }
    // Safari doesn't support table.tHead, sigh
    if (table.tHead == null) table.tHead = table.getElementsByTagName('thead')[0];

    // Removed to support tables with multiple header rows.
    // if (table.tHead.rows.length != 1) return; // can't cope with two header rows

    // Sorttable v1 put rows with a class of "sortbottom" at the bottom (as
    // "total" rows, for example). This is B&R, since what you're supposed
    // to do is put them in a tfoot. So, if there are sortbottom rows,
    // for backwards compatibility, move them to tfoot (creating it if needed).
    sortbottomrows = [];
    for (var i=0; i<table.rows.length; i++) {
      if (table.rows[i].className.search(/\bsortbottom\b/) != -1) {
        sortbottomrows[sortbottomrows.length] = table.rows[i];
      }
    }
    if (sortbottomrows) {
      if (table.tFoot == null) {
        // table doesn't have a tfoot. Create one.
        tfo = document.createElement('tfoot');
        table.appendChild(tfo);
      }
      for (var i=0; i<sortbottomrows.length; i++) {
        tfo.appendChild(sortbottomrows[i]);
      }
      delete sortbottomrows;
    }

    // work through each column and calculate its type
    // Always take the last header row in case there are multiple.
    headrow = table.tHead.rows[table.tHead.rows.length - 1].cells;
    for (var i=0; i<headrow.length; i++) {
      // manually override the type with a sorttable_type attribute
      if (!headrow[i].className.match(/\bsorttable_nosort\b/)) { // skip this col
        mtch = headrow[i].className.match(/\bsorttable_([a-z0-9]+)\b/);
        if (mtch) { override = mtch[1]; }
        if (mtch && typeof sorttable["sort_"+override] == 'function') {
          headrow[i].sorttable_sortfunction = sorttable["sort_"+override];
        } else {
          headrow[i].sorttable_sortfunction = sorttable.guessType(table,i);
        }
        // make it clickable to sort
        headrow[i].sorttable_columnindex = i;
        headrow[i].sorttable_tbody = table.tBodies[0];
        dean_addEvent(headrow[i],"click", sorttable.innerSortFunction = function(e) {

          if (this.className.search(/\bsorttable_sorted\b/) != -1) {
            // if we're already sorted by this column, just
            // reverse the table, which is quicker
            sorttable.reverse(this.sorttable_tbody);
            this.className = this.className.replace('sorttable_sorted',
                                                    'sorttable_sorted_reverse');
            this.removeChild(document.getElementById('sorttable_sortfwdind'));
            sortrevind = document.createElement('span');
            sortrevind.id = "sorttable_sortrevind";
            sortrevind.innerHTML = stIsIE ? '&nbsp<font face="webdings">5</font>' : '&nbsp;&#x25B4;';
            this.appendChild(sortrevind);
            return;
          }
          if (this.className.search(/\bsorttable_sorted_reverse\b/) != -1) {
            // if we're already sorted by this column in reverse, just
            // re-reverse the table, which is quicker
            sorttable.reverse(this.sorttable_tbody);
            this.className = this.className.replace('sorttable_sorted_reverse',
                                                    'sorttable_sorted');
            this.removeChild(document.getElementById('sorttable_sortrevind'));
            sortfwdind = document.createElement('span');
            sortfwdind.id = "sorttable_sortfwdind";
            sortfwdind.innerHTML = stIsIE ? '&nbsp<font face="webdings">6</font>' : '&nbsp;&#x25BE;';
            this.appendChild(sortfwdind);
            return;
          }

          // remove sorttable_sorted classes
          theadrow = this.parentNode;
          forEach(theadrow.childNodes, function(cell) {
            if (cell.nodeType == 1) { // an element
              cell.className = cell.className.replace('sorttable_sorted_reverse','');
              cell.className = cell.className.replace('sorttable_sorted','');
            }
          });
          sortfwdind = document.getElementById('sorttable_sortfwdind');
          if (sortfwdind) { sortfwdind.parentNode.removeChild(sortfwdind); }
          sortrevind = document.getElementById('sorttable_sortrevind');
          if (sortrevind) { sortrevind.parentNode.removeChild(sortrevind); }

          this.className += ' sorttable_sorted';
          sortfwdind = document.createElement('span');
          sortfwdind.id = "sorttable_sortfwdind";
          sortfwdind.innerHTML = stIsIE ? '&nbsp<font face="webdings">6</font>' : '&nbsp;&#x25BE;';
          this.appendChild(sortfwdind);

          // build an array to sort. This is a Schwartzian transform thing,
          // i.e., we "decorate" each row with the actual sort key,
          // sort based on the sort keys, and then put the rows back in order
          // which is a lot faster because you only do getInnerText once per row
          row_array = [];
          col = this.sorttable_columnindex;
          rows = this.sorttable_tbody.rows;
          for (var j=0; j<rows.length; j++) {
            row_array[row_array.length] = [sorttable.getInnerText(rows[j].cells[col]), rows[j]];
          }
          /* If you want a stable sort, uncomment the following line */
          //sorttable.shaker_sort(row_array, this.sorttable_sortfunction);
          /* and comment out this one */
          row_array.sort(this.sorttable_sortfunction);

          tb = this.sorttable_tbody;
          for (var j=0; j<row_array.length; j++) {
            tb.appendChild(row_array[j][1]);
          }

          delete row_array;
        });
      }
    }
  },

  guessType: function(table, column) {
    // guess the type of a column based on its first non-blank row
    sortfn = sorttable.sort_alpha;
    for (var i=0; i<table.tBodies[0].rows.length; i++) {
      text = sorttable.getInnerText(table.tBodies[0].rows[i].cells[column]);
      if (text != '') {
        if (text.match(/^-?[�$�]?[\d,.]+%?$/)) {
          return sorttable.sort_numeric;
        }
        // check for a date: dd/mm/yyyy or dd/mm/yy
        // can have / or . or - as separator
        // can be mm/dd as well
        possdate = text.match(sorttable.DATE_RE)
        if (possdate) {
          // looks like a date
          first = parseInt(possdate[1]);
          second = parseInt(possdate[2]);
          if (first > 12) {
            // definitely dd/mm
            return sorttable.sort_ddmm;
          } else if (second > 12) {
            return sorttable.sort_mmdd;
          } else {
            // looks like a date, but we can't tell which, so assume
            // that it's dd/mm (English imperialism!) and keep looking
            sortfn = sorttable.sort_ddmm;
          }
        }
      }
    }
    return sortfn;
  },

  getInnerText: function(node) {
    // gets the text we want to use for sorting for a cell.
    // strips leading and trailing whitespace.
    // this is *not* a generic getInnerText function; it's special to sorttable.
    // for example, you can override the cell text with a customkey attribute.
    // it also gets .value for <input> fields.

    if (!node) return "";

    hasInputs = (typeof node.getElementsByTagName == 'function') &&
                 node.getElementsByTagName('input').length;

    if (node.getAttribute("sorttable_customkey") != null) {
      return node.getAttribute("sorttable_customkey");
    }
    else if (typeof node.textContent != 'undefined' && !hasInputs) {
      return node.textContent.replace(/^\s+|\s+$/g, '');
    }
    else if (typeof node.innerText != 'undefined' && !hasInputs) {
      return node.innerText.replace(/^\s+|\s+$/g, '');
    }
    else if (typeof node.text != 'undefined' && !hasInputs) {
      return node.text.replace(/^\s+|\s+$/g, '');
    }
    else {
      switch (node.nodeType) {
        case 3:
          if (node.nodeName.toLowerCase() == 'input') {
            return node.value.replace(/^\s+|\s+$/g, '');
          }
        case 4:
          return node.nodeValue.replace(/^\s+|\s+$/g, '');
          break;
        case 1:
        case 11:
          var innerText = '';
          for (var i = 0; i < node.childNodes.length; i++) {
            innerText += sorttable.getInnerText(node.childNodes[i]);
          }
          return innerText.replace(/^\s+|\s+$/g, '');
          break;
        default:
          return '';
      }
    }
  },

  reverse: function(tbody) {
    // reverse the rows in a tbody
    newrows = [];
    for (var i=0; i<tbody.rows.length; i++) {
      newrows[newrows.length] = tbody.rows[i];
    }
    for (var i=newrows.length-1; i>=0; i--) {
       tbody.appendChild(newrows[i]);
    }
    delete newrows;
  },

  /* sort functions
     each sort function takes two parameters, a and b
     you are comparing a[0] and b[0] */
  sort_numeric: function(a,b) {
    aa = parseFloat(a[0].replace(/[^0-9.-]/g,''));
    if (isNaN(aa)) aa = 0;
    bb = parseFloat(b[0].replace(/[^0-9.-]/g,''));
    if (isNaN(bb)) bb = 0;
    return aa-bb;
  },
  sort_alpha: function(a,b) {
    if (a[0].toLowerCase()==b[0].toLowerCase()) return 0;
    if (a[0].toLowerCase()<b[0].toLowerCase()) return -1;
    return 1;
  },
  sort_ddmm: function(a,b) {
    mtch = a[0].match(sorttable.DATE_RE);
    y = mtch[3]; m = mtch[2]; d = mtch[1];
    if (m.length == 1) m = '0'+m;
    if (d.length == 1) d = '0'+d;
    dt1 = y+m+d;
    mtch = b[0].match(sorttable.DATE_RE);
    y = mtch[3]; m = mtch[2]; d = mtch[1];
    if (m.length == 1) m = '0'+m;
    if (d.length == 1) d = '0'+d;
    dt2 = y+m+d;
    if (dt1==dt2) return 0;
    if (dt1<dt2) return -1;
    return 1;
  },
  sort_mmdd: function(a,b) {
    mtch = a[0].match(sorttable.DATE_RE);
    y = mtch[3]; d = mtch[2]; m = mtch[1];
    if (m.length == 1) m = '0'+m;
    if (d.length == 1) d = '0'+d;
    dt1 = y+m+d;
    mtch = b[0].match(sorttable.DATE_RE);
    y = mtch[3]; d = mtch[2]; m = mtch[1];
    if (m.length == 1) m = '0'+m;
    if (d.length == 1) d = '0'+d;
    dt2 = y+m+d;
    if (dt1==dt2) return 0;
    if (dt1<dt2) return -1;
    return 1;
  },

  shaker_sort: function(list, comp_func) {
    // A stable sort function to allow multi-level sorting of data
    // see: http://en.wikipedia.org/wiki/Cocktail_sort
    // thanks to Joseph Nahmias
    var b = 0;
    var t = list.length - 1;
    var swap = true;

    while(swap) {
        swap = false;
        for(var i = b; i < t; ++i) {
            if ( comp_func(list[i], list[i+1]) > 0 ) {
                var q = list[i]; list[i] = list[i+1]; list[i+1] = q;
                swap = true;
            }
        } // for
        t--;

        if (!swap) break;

        for(var i = t; i > b; --i) {
            if ( comp_func(list[i], list[i-1]) < 0 ) {
                var q = list[i]; list[i] = list[i-1]; list[i-1] = q;
                swap = true;
            }
        } // for
        b++;

    } // while(swap)
  }
}

/* ******************************************************************
   Supporting functions: bundled here to avoid depending on a library
   ****************************************************************** */

// Dean Edwards/Matthias Miller/John Resig

/* for Mozilla/Opera9 */
if (document.addEventListener) {
    document.addEventListener("DOMContentLoaded", sorttable.init, false);
}

/* for Internet Explorer */
/*@cc_on @*/
/*@if (@_win32)
    document.write("<script id=__ie_onload defer src=javascript:void(0)><\/script>");
    var script = document.getElementById("__ie_onload");
    script.onreadystatechange = function() {
        if (this.readyState == "complete") {
            sorttable.init(); // call the onload handler
        }
    };
/*@end @*/

/* for Safari */
if (/WebKit/i.test(navigator.userAgent)) { // sniff
    var _timer = setInterval(function() {
        if (/loaded|complete/.test(document.readyState)) {
            sorttable.init(); // call the onload handler
        }
    }, 10);
}

/* for other browsers */
window.onload = sorttable.init;

// written by Dean Edwards, 2005
// with input from Tino Zijdel, Matthias Miller, Diego Perini

// http://dean.edwards.name/weblog/2005/10/add-event/

function dean_addEvent(element, type, handler) {
  if (element.addEventListener) {
    element.addEventListener(type, handler, false);
  } else {
    // assign each event handler a unique ID
    if (!handler.$$guid) handler.$$guid = dean_addEvent.guid++;
    // create a hash table of event types for the element
    if (!element.events) element.events = {};
    // create a hash table of event handlers for each element/event pair
    var handlers = element.events[type];
    if (!handlers) {
      handlers = element.events[type] = {};
      // store the existing event handler (if there is one)
      if (element["on" + type]) {
        handlers[0] = element["on" + type];
      }
    }
    // store the event handler in the hash table
    handlers[handler.$$guid] = handler;
    // assign a global event handler to do all the work
    element["on" + type] = handleEvent;
  }
};
// a counter used to create unique IDs
dean_addEvent.guid = 1;

function removeEvent(element, type, handler) {
  if (element.removeEventListener) {
    element.removeEventListener(type, handler, false);
  } else {
    // delete the event handler from the hash table
    if (element.events && element.events[type]) {
      delete element.events[type][handler.$$guid];
    }
  }
};

function handleEvent(event) {
  var returnValue = true;
  // grab the event object (IE uses a global event object)
  event = event || fixEvent(((this.ownerDocument || this.document || this).parentWindow || window).event);
  // get a reference to the hash table of event handlers
  var handlers = this.events[event.type];
  // execute each event handler
  for (var i in handlers) {
    this.$$handleEvent = handlers[i];
    if (this.$$handleEvent(event) === false) {
      returnValue = false;
    }
  }
  return returnValue;
};

function fixEvent(event) {
  // add W3C standard event methods
  event.preventDefault = fixEvent.preventDefault;
  event.stopPropagation = fixEvent.stopPropagation;
  return event;
};
fixEvent.preventDefault = function() {
  this.returnValue = false;
};
fixEvent.stopPropagation = function() {
  this.cancelBubble = true;
}

// Dean's forEach: http://dean.edwards.name/base/forEach.js
/*
  forEach, version 1.0
  Copyright 2006, Dean Edwards
  License: http://www.opensource.org/licenses/mit-license.php
*/

// array-like enumeration
if (!Array.forEach) { // mozilla already supports this
  Array.forEach = function(array, block, context) {
    for (var i = 0; i < array.length; i++) {
      block.call(context, array[i], i, array);
    }
  };
}

// generic enumeration
Function.prototype.forEach = function(object, block, context) {
  for (var key in object) {
    if (typeof this.prototype[key] == "undefined") {
      block.call(context, object[key], key, object);
    }
  }
};

// character enumeration
String.forEach = function(string, block, context) {
  Array.forEach(string.split(""), function(chr, index) {
    block.call(context, chr, index, string);
  });
};

// globally resolve forEach enumeration
var forEach = function(object, block, context) {
  if (object) {
    var resolve = Object; // default
    if (object instanceof Function) {
      // functions have a "length" property
      resolve = Function;
    } else if (object.forEach instanceof Function) {
      // the object implements a custom forEach method so use that
      object.forEach(block, context);
      return;
    } else if (typeof object == "string") {
      // the object is a string
      resolve = String;
    } else if (typeof object.length == "number") {
      // the object is array-like
      resolve = Array;
    }
    resolve.forEach(object, block, context);
  }
};
;
(function ($) {

/**
 * Attaches sticky table headers.
 */
Drupal.behaviors.tableHeader = {
  attach: function (context, settings) {
    if (!$.support.positionFixed) {
      return;
    }

    $('table.sticky-enabled', context).once('tableheader', function () {
      $(this).data("drupal-tableheader", new Drupal.tableHeader(this));
    });
  }
};

/**
 * Constructor for the tableHeader object. Provides sticky table headers.
 *
 * @param table
 *   DOM object for the table to add a sticky header to.
 */
Drupal.tableHeader = function (table) {
  var self = this;

  this.originalTable = $(table);
  this.originalHeader = $(table).children('thead');
  this.originalHeaderCells = this.originalHeader.find('> tr > th');
  this.displayWeight = null;

  // React to columns change to avoid making checks in the scroll callback.
  this.originalTable.bind('columnschange', function (e, display) {
    // This will force header size to be calculated on scroll.
    self.widthCalculated = (self.displayWeight !== null && self.displayWeight === display);
    self.displayWeight = display;
  });

  // Clone the table header so it inherits original jQuery properties. Hide
  // the table to avoid a flash of the header clone upon page load.
  this.stickyTable = $('<table class="sticky-header"/>')
    .insertBefore(this.originalTable)
    .css({ position: 'fixed', top: '0px' });
  this.stickyHeader = this.originalHeader.clone(true)
    .hide()
    .appendTo(this.stickyTable);
  this.stickyHeaderCells = this.stickyHeader.find('> tr > th');

  this.originalTable.addClass('sticky-table');
  $(window)
    .bind('scroll.drupal-tableheader', $.proxy(this, 'eventhandlerRecalculateStickyHeader'))
    .bind('resize.drupal-tableheader', { calculateWidth: true }, $.proxy(this, 'eventhandlerRecalculateStickyHeader'))
    // Make sure the anchor being scrolled into view is not hidden beneath the
    // sticky table header. Adjust the scrollTop if it does.
    .bind('drupalDisplaceAnchor.drupal-tableheader', function () {
      window.scrollBy(0, -self.stickyTable.outerHeight());
    })
    // Make sure the element being focused is not hidden beneath the sticky
    // table header. Adjust the scrollTop if it does.
    .bind('drupalDisplaceFocus.drupal-tableheader', function (event) {
      if (self.stickyVisible && event.clientY < (self.stickyOffsetTop + self.stickyTable.outerHeight()) && event.$target.closest('sticky-header').length === 0) {
        window.scrollBy(0, -self.stickyTable.outerHeight());
      }
    })
    .triggerHandler('resize.drupal-tableheader');

  // We hid the header to avoid it showing up erroneously on page load;
  // we need to unhide it now so that it will show up when expected.
  this.stickyHeader.show();
};

/**
 * Call the header offset function to prevent use of eval().
 *
 * @param accessor
 *   The callback function name.
 * @return
 *   The callback result.
 */
Drupal.tableHeader.callHeaderOffsetFunction = function(accessor) {
  accessor = accessor.split('.');
  var callback = window;
  for (var i = 0, len = accessor.length - 1; i < len; i++) {
    if (typeof callback[accessor[i]] != 'function' && typeof callback[accessor[i]] != 'object') {
      return 0;
    }
    callback = callback[accessor[i]];
  }
  if (typeof callback[accessor[accessor.length - 1]] === "function") {
    return callback[accessor[accessor.length - 1]]();
  }
  return 0;
};

/**
 * Event handler: recalculates position of the sticky table header.
 *
 * @param event
 *   Event being triggered.
 */
Drupal.tableHeader.prototype.eventhandlerRecalculateStickyHeader = function (event) {
  var self = this;
  var calculateWidth = event.data && event.data.calculateWidth;

  // Reset top position of sticky table headers to the current top offset.
  this.stickyOffsetTop = Drupal.settings.tableHeaderOffset ? Drupal.tableHeader.callHeaderOffsetFunction(Drupal.settings.tableHeaderOffset) : 0;
  this.stickyTable.css('top', this.stickyOffsetTop + 'px');

  // Save positioning data.
  var viewHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
  if (calculateWidth || this.viewHeight !== viewHeight) {
    this.viewHeight = viewHeight;
    this.vPosition = this.originalTable.offset().top - 4 - this.stickyOffsetTop;
    this.hPosition = this.originalTable.offset().left;
    this.vLength = this.originalTable[0].clientHeight - 100;
    calculateWidth = true;
  }

  // Track horizontal positioning relative to the viewport and set visibility.
  var hScroll = document.documentElement.scrollLeft || document.body.scrollLeft;
  var vOffset = (document.documentElement.scrollTop || document.body.scrollTop) - this.vPosition;
  this.stickyVisible = vOffset > 0 && vOffset < this.vLength;
  this.stickyTable.css({ left: (-hScroll + this.hPosition) + 'px', visibility: this.stickyVisible ? 'visible' : 'hidden' });

  // Only perform expensive calculations if the sticky header is actually
  // visible or when forced.
  if (this.stickyVisible && (calculateWidth || !this.widthCalculated)) {
    this.widthCalculated = true;
    var $that = null;
    var $stickyCell = null;
    var display = null;
    var cellWidth = null;
    // Resize header and its cell widths.
    // Only apply width to visible table cells. This prevents the header from
    // displaying incorrectly when the sticky header is no longer visible.
    for (var i = 0, il = this.originalHeaderCells.length; i < il; i += 1) {
      $that = $(this.originalHeaderCells[i]);
      $stickyCell = this.stickyHeaderCells.eq($that.index());
      display = $that.css('display');
      if (display !== 'none') {
        cellWidth = $that.css('width');
        // Exception for IE7.
        if (cellWidth === 'auto') {
          cellWidth = $that[0].clientWidth + 'px';
        }
        $stickyCell.css({'width': cellWidth, 'display': display});
      }
      else {
        $stickyCell.css('display', 'none');
      }
    }
    this.stickyTable.css('width', this.originalTable.outerWidth());
  }
};

})(jQuery);
;
(function ($) {

  // Attach behaviors.
  Drupal.behaviors.hpc_plan_year_selector = {
    attach: function(context, settings) {
      $('.plan-year-selector-wrapper select', context).change(function() {
        var plan_url = $(this).val();
        window.location = plan_url;
      });
    }
  }

})(jQuery, Drupal);
;
(function ($) {
  Drupal.behaviors.bu = {
    attach: function (context) {
      if (context == document) {
        var e = document.createElement("script");
        e.setAttribute("type", "text/javascript");
        $buoop = {
        vs: {
          i:Drupal.settings.bu['ie'],
          f:Drupal.settings.bu['firefox'],
          o:Drupal.settings.bu['opera'],
          s:Drupal.settings.bu['safari'],
          c:Drupal.settings.bu['chrome'],
        },
        insecure:Drupal.settings.bu['insecure'],
        unsupported:Drupal.settings.bu['unsupported'],
        mobile:Drupal.settings.bu['mobile'],
        style:Drupal.settings.bu['position'],
        text: Drupal.settings.bu['text'],
        reminder: Drupal.settings.bu['reminder'],
        reminderClosed: Drupal.settings.bu['reminder_closed'],
        test: Drupal.settings.bu['debug'],
        newwindow: Drupal.settings.bu['blank'],
        noclose: Drupal.settings.bu['hide_ignore'],
        }
        e.setAttribute("src", Drupal.settings.bu['source']);
        document.body.appendChild(e);
      }
    }
  }
})(jQuery);
;
/*! Selectric ϟ v1.13.0 (2017-08-21) - git.io/tjl9sQ - Copyright (c) 2017 Leonardo Santos - MIT License */
!function(e){"function"==typeof define&&define.amd?define(["jquery"],e):"object"==typeof module&&module.exports?module.exports=function(t,s){return void 0===s&&(s="undefined"!=typeof window?require("jquery"):require("jquery")(t)),e(s),s}:e(jQuery)}(function(e){"use strict";var t=e(document),s=e(window),l=["a","e","i","o","u","n","c","y"],i=[/[\xE0-\xE5]/g,/[\xE8-\xEB]/g,/[\xEC-\xEF]/g,/[\xF2-\xF6]/g,/[\xF9-\xFC]/g,/[\xF1]/g,/[\xE7]/g,/[\xFD-\xFF]/g],n=function(t,s){var l=this;l.element=t,l.$element=e(t),l.state={multiple:!!l.$element.attr("multiple"),enabled:!1,opened:!1,currValue:-1,selectedIdx:-1,highlightedIdx:-1},l.eventTriggers={open:l.open,close:l.close,destroy:l.destroy,refresh:l.refresh,init:l.init},l.init(s)};n.prototype={utils:{isMobile:function(){return/android|ip(hone|od|ad)/i.test(navigator.userAgent)},escapeRegExp:function(e){return e.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")},replaceDiacritics:function(e){for(var t=i.length;t--;)e=e.toLowerCase().replace(i[t],l[t]);return e},format:function(e){var t=arguments;return(""+e).replace(/\{(?:(\d+)|(\w+))\}/g,function(e,s,l){return l&&t[1]?t[1][l]:t[s]})},nextEnabledItem:function(e,t){for(;e[t=(t+1)%e.length].disabled;);return t},previousEnabledItem:function(e,t){for(;e[t=(t>0?t:e.length)-1].disabled;);return t},toDash:function(e){return e.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase()},triggerCallback:function(t,s){var l=s.element,i=s.options["on"+t],n=[l].concat([].slice.call(arguments).slice(1));e.isFunction(i)&&i.apply(l,n),e(l).trigger("selectric-"+this.toDash(t),n)},arrayToClassname:function(t){var s=e.grep(t,function(e){return!!e});return e.trim(s.join(" "))}},init:function(t){var s=this;if(s.options=e.extend(!0,{},e.fn.selectric.defaults,s.options,t),s.utils.triggerCallback("BeforeInit",s),s.destroy(!0),s.options.disableOnMobile&&s.utils.isMobile())return void(s.disableOnMobile=!0);s.classes=s.getClassNames();var l=e("<input/>",{class:s.classes.input,readonly:s.utils.isMobile()}),i=e("<div/>",{class:s.classes.items,tabindex:-1}),n=e("<div/>",{class:s.classes.scroll}),a=e("<div/>",{class:s.classes.prefix,html:s.options.arrowButtonMarkup}),o=e("<span/>",{class:"label"}),r=s.$element.wrap("<div/>").parent().append(a.prepend(o),i,l),u=e("<div/>",{class:s.classes.hideselect});s.elements={input:l,items:i,itemsScroll:n,wrapper:a,label:o,outerWrapper:r},s.options.nativeOnMobile&&s.utils.isMobile()&&(s.elements.input=void 0,u.addClass(s.classes.prefix+"-is-native"),s.$element.on("change",function(){s.refresh()})),s.$element.on(s.eventTriggers).wrap(u),s.originalTabindex=s.$element.prop("tabindex"),s.$element.prop("tabindex",-1),s.populate(),s.activate(),s.utils.triggerCallback("Init",s)},activate:function(){var e=this,t=e.elements.items.closest(":visible").children(":hidden").addClass(e.classes.tempshow),s=e.$element.width();t.removeClass(e.classes.tempshow),e.utils.triggerCallback("BeforeActivate",e),e.elements.outerWrapper.prop("class",e.utils.arrayToClassname([e.classes.wrapper,e.$element.prop("class").replace(/\S+/g,e.classes.prefix+"-$&"),e.options.responsive?e.classes.responsive:""])),e.options.inheritOriginalWidth&&s>0&&e.elements.outerWrapper.width(s),e.unbindEvents(),e.$element.prop("disabled")?(e.elements.outerWrapper.addClass(e.classes.disabled),e.elements.input&&e.elements.input.prop("disabled",!0)):(e.state.enabled=!0,e.elements.outerWrapper.removeClass(e.classes.disabled),e.$li=e.elements.items.removeAttr("style").find("li"),e.bindEvents()),e.utils.triggerCallback("Activate",e)},getClassNames:function(){var t=this,s=t.options.customClass,l={};return e.each("Input Items Open Disabled TempShow HideSelect Wrapper Focus Hover Responsive Above Below Scroll Group GroupLabel".split(" "),function(e,i){var n=s.prefix+i;l[i.toLowerCase()]=s.camelCase?n:t.utils.toDash(n)}),l.prefix=s.prefix,l},setLabel:function(){var t=this,s=t.options.labelBuilder;if(t.state.multiple){var l=e.isArray(t.state.currValue)?t.state.currValue:[t.state.currValue];l=0===l.length?[0]:l;var i=e.map(l,function(s){return e.grep(t.lookupItems,function(e){return e.index===s})[0]});i=e.grep(i,function(t){return i.length>1||0===i.length?""!==e.trim(t.value):t}),i=e.map(i,function(l){return e.isFunction(s)?s(l):t.utils.format(s,l)}),t.options.multiple.maxLabelEntries&&(i.length>=t.options.multiple.maxLabelEntries+1?(i=i.slice(0,t.options.multiple.maxLabelEntries),i.push(e.isFunction(s)?s({text:"..."}):t.utils.format(s,{text:"..."}))):i.slice(i.length-1)),t.elements.label.html(i.join(t.options.multiple.separator))}else{var n=t.lookupItems[t.state.currValue];t.elements.label.html(e.isFunction(s)?s(n):t.utils.format(s,n))}},populate:function(){var t=this,s=t.$element.children(),l=t.$element.find("option"),i=l.filter(":selected"),n=l.index(i),a=0,o=t.state.multiple?[]:0;i.length>1&&t.state.multiple&&(n=[],i.each(function(){n.push(e(this).index())})),t.state.currValue=~n?n:o,t.state.selectedIdx=t.state.currValue,t.state.highlightedIdx=t.state.currValue,t.items=[],t.lookupItems=[],s.length&&(s.each(function(s){var l=e(this);if(l.is("optgroup")){var i={element:l,label:l.prop("label"),groupDisabled:l.prop("disabled"),items:[]};l.children().each(function(s){var l=e(this);i.items[s]=t.getItemData(a,l,i.groupDisabled||l.prop("disabled")),t.lookupItems[a]=i.items[s],a++}),t.items[s]=i}else t.items[s]=t.getItemData(a,l,l.prop("disabled")),t.lookupItems[a]=t.items[s],a++}),t.setLabel(),t.elements.items.append(t.elements.itemsScroll.html(t.getItemsMarkup(t.items))))},getItemData:function(t,s,l){var i=this;return{index:t,element:s,value:s.val(),className:s.prop("class"),text:s.html(),slug:e.trim(i.utils.replaceDiacritics(s.html())),selected:s.prop("selected"),disabled:l}},getItemsMarkup:function(t){var s=this,l="<ul>";return e.isFunction(s.options.listBuilder)&&s.options.listBuilder&&(t=s.options.listBuilder(t)),e.each(t,function(t,i){void 0!==i.label?(l+=s.utils.format('<ul class="{1}"><li class="{2}">{3}</li>',s.utils.arrayToClassname([s.classes.group,i.groupDisabled?"disabled":"",i.element.prop("class")]),s.classes.grouplabel,i.element.prop("label")),e.each(i.items,function(e,t){l+=s.getItemMarkup(t.index,t)}),l+="</ul>"):l+=s.getItemMarkup(i.index,i)}),l+"</ul>"},getItemMarkup:function(t,s){var l=this,i=l.options.optionsItemBuilder,n={value:s.value,text:s.text,slug:s.slug,index:s.index};return l.utils.format('<li data-index="{1}" class="{2}">{3}</li>',t,l.utils.arrayToClassname([s.className,t===l.items.length-1?"last":"",s.disabled?"disabled":"",s.selected?"selected":""]),e.isFunction(i)?l.utils.format(i(s,this.$element,t),s):l.utils.format(i,n))},unbindEvents:function(){var e=this;e.elements.wrapper.add(e.$element).add(e.elements.outerWrapper).add(e.elements.input).off(".sl")},bindEvents:function(){var t=this;t.elements.outerWrapper.on("mouseenter.sl mouseleave.sl",function(s){e(this).toggleClass(t.classes.hover,"mouseenter"===s.type),t.options.openOnHover&&(clearTimeout(t.closeTimer),"mouseleave"===s.type?t.closeTimer=setTimeout(e.proxy(t.close,t),t.options.hoverIntentTimeout):t.open())}),t.elements.wrapper.on("click.sl",function(e){t.state.opened?t.close():t.open(e)}),t.options.nativeOnMobile&&t.utils.isMobile()||(t.$element.on("focus.sl",function(){t.elements.input.focus()}),t.elements.input.prop({tabindex:t.originalTabindex,disabled:!1}).on("keydown.sl",e.proxy(t.handleKeys,t)).on("focusin.sl",function(e){t.elements.outerWrapper.addClass(t.classes.focus),t.elements.input.one("blur",function(){t.elements.input.blur()}),t.options.openOnFocus&&!t.state.opened&&t.open(e)}).on("focusout.sl",function(){t.elements.outerWrapper.removeClass(t.classes.focus)}).on("input propertychange",function(){var s=t.elements.input.val(),l=new RegExp("^"+t.utils.escapeRegExp(s),"i");clearTimeout(t.resetStr),t.resetStr=setTimeout(function(){t.elements.input.val("")},t.options.keySearchTimeout),s.length&&e.each(t.items,function(e,s){if(!s.disabled&&l.test(s.text)||l.test(s.slug))return void t.highlight(e)})})),t.$li.on({mousedown:function(e){e.preventDefault(),e.stopPropagation()},click:function(){return t.select(e(this).data("index")),!1}})},handleKeys:function(t){var s=this,l=t.which,i=s.options.keys,n=e.inArray(l,i.previous)>-1,a=e.inArray(l,i.next)>-1,o=e.inArray(l,i.select)>-1,r=e.inArray(l,i.open)>-1,u=s.state.highlightedIdx,p=n&&0===u||a&&u+1===s.items.length,c=0;if(13!==l&&32!==l||t.preventDefault(),n||a){if(!s.options.allowWrap&&p)return;n&&(c=s.utils.previousEnabledItem(s.lookupItems,u)),a&&(c=s.utils.nextEnabledItem(s.lookupItems,u)),s.highlight(c)}if(o&&s.state.opened)return s.select(u),void(s.state.multiple&&s.options.multiple.keepMenuOpen||s.close());r&&!s.state.opened&&s.open()},refresh:function(){var e=this;e.populate(),e.activate(),e.utils.triggerCallback("Refresh",e)},setOptionsDimensions:function(){var e=this,t=e.elements.items.closest(":visible").children(":hidden").addClass(e.classes.tempshow),s=e.options.maxHeight,l=e.elements.items.outerWidth(),i=e.elements.wrapper.outerWidth()-(l-e.elements.items.width());!e.options.expandToItemText||i>l?e.finalWidth=i:(e.elements.items.css("overflow","scroll"),e.elements.outerWrapper.width(9e4),e.finalWidth=e.elements.items.width(),e.elements.items.css("overflow",""),e.elements.outerWrapper.width("")),e.elements.items.width(e.finalWidth).height()>s&&e.elements.items.height(s),t.removeClass(e.classes.tempshow)},isInViewport:function(){var e=this;if(!0===e.options.forceRenderAbove)e.elements.outerWrapper.addClass(e.classes.above);else if(!0===e.options.forceRenderBelow)e.elements.outerWrapper.addClass(e.classes.below);else{var t=s.scrollTop(),l=s.height(),i=e.elements.outerWrapper.offset().top,n=e.elements.outerWrapper.outerHeight(),a=i+n+e.itemsHeight<=t+l,o=i-e.itemsHeight>t,r=!a&&o,u=!r;e.elements.outerWrapper.toggleClass(e.classes.above,r),e.elements.outerWrapper.toggleClass(e.classes.below,u)}},detectItemVisibility:function(t){var s=this,l=s.$li.filter("[data-index]");s.state.multiple&&(t=e.isArray(t)&&0===t.length?0:t,t=e.isArray(t)?Math.min.apply(Math,t):t);var i=l.eq(t).outerHeight(),n=l[t].offsetTop,a=s.elements.itemsScroll.scrollTop(),o=n+2*i;s.elements.itemsScroll.scrollTop(o>a+s.itemsHeight?o-s.itemsHeight:n-i<a?n-i:a)},open:function(s){var l=this;if(l.options.nativeOnMobile&&l.utils.isMobile())return!1;l.utils.triggerCallback("BeforeOpen",l),s&&(s.preventDefault(),l.options.stopPropagation&&s.stopPropagation()),l.state.enabled&&(l.setOptionsDimensions(),e("."+l.classes.hideselect,"."+l.classes.open).children().selectric("close"),l.state.opened=!0,l.itemsHeight=l.elements.items.outerHeight(),l.itemsInnerHeight=l.elements.items.height(),l.elements.outerWrapper.addClass(l.classes.open),l.elements.input.val(""),s&&"focusin"!==s.type&&l.elements.input.focus(),setTimeout(function(){t.on("click.sl",e.proxy(l.close,l)).on("scroll.sl",e.proxy(l.isInViewport,l))},1),l.isInViewport(),l.options.preventWindowScroll&&t.on("mousewheel.sl DOMMouseScroll.sl","."+l.classes.scroll,function(t){var s=t.originalEvent,i=e(this).scrollTop(),n=0;"detail"in s&&(n=-1*s.detail),"wheelDelta"in s&&(n=s.wheelDelta),"wheelDeltaY"in s&&(n=s.wheelDeltaY),"deltaY"in s&&(n=-1*s.deltaY),(i===this.scrollHeight-l.itemsInnerHeight&&n<0||0===i&&n>0)&&t.preventDefault()}),l.detectItemVisibility(l.state.selectedIdx),l.highlight(l.state.multiple?-1:l.state.selectedIdx),l.utils.triggerCallback("Open",l))},close:function(){var e=this;e.utils.triggerCallback("BeforeClose",e),t.off(".sl"),e.elements.outerWrapper.removeClass(e.classes.open),e.state.opened=!1,e.utils.triggerCallback("Close",e)},change:function(){var t=this;t.utils.triggerCallback("BeforeChange",t),t.state.multiple?(e.each(t.lookupItems,function(e){t.lookupItems[e].selected=!1,t.$element.find("option").prop("selected",!1)}),e.each(t.state.selectedIdx,function(e,s){t.lookupItems[s].selected=!0,t.$element.find("option").eq(s).prop("selected",!0)}),t.state.currValue=t.state.selectedIdx,t.setLabel(),t.utils.triggerCallback("Change",t)):t.state.currValue!==t.state.selectedIdx&&(t.$element.prop("selectedIndex",t.state.currValue=t.state.selectedIdx).data("value",t.lookupItems[t.state.selectedIdx].text),t.setLabel(),t.utils.triggerCallback("Change",t))},highlight:function(e){var t=this,s=t.$li.filter("[data-index]").removeClass("highlighted");t.utils.triggerCallback("BeforeHighlight",t),void 0===e||-1===e||t.lookupItems[e].disabled||(s.eq(t.state.highlightedIdx=e).addClass("highlighted"),t.detectItemVisibility(e),t.utils.triggerCallback("Highlight",t))},select:function(t){var s=this,l=s.$li.filter("[data-index]");if(s.utils.triggerCallback("BeforeSelect",s,t),void 0!==t&&-1!==t&&!s.lookupItems[t].disabled){if(s.state.multiple){s.state.selectedIdx=e.isArray(s.state.selectedIdx)?s.state.selectedIdx:[s.state.selectedIdx];var i=e.inArray(t,s.state.selectedIdx);-1!==i?s.state.selectedIdx.splice(i,1):s.state.selectedIdx.push(t),l.removeClass("selected").filter(function(t){return-1!==e.inArray(t,s.state.selectedIdx)}).addClass("selected")}else l.removeClass("selected").eq(s.state.selectedIdx=t).addClass("selected");s.state.multiple&&s.options.multiple.keepMenuOpen||s.close(),s.change(),s.utils.triggerCallback("Select",s,t)}},destroy:function(e){var t=this;t.state&&t.state.enabled&&(t.elements.items.add(t.elements.wrapper).add(t.elements.input).remove(),e||t.$element.removeData("selectric").removeData("value"),t.$element.prop("tabindex",t.originalTabindex).off(".sl").off(t.eventTriggers).unwrap().unwrap(),t.state.enabled=!1)}},e.fn.selectric=function(t){return this.each(function(){var s=e.data(this,"selectric");s&&!s.disableOnMobile?"string"==typeof t&&s[t]?s[t]():s.init(t):e.data(this,"selectric",new n(this,t))})},e.fn.selectric.defaults={onChange:function(t){e(t).change()},maxHeight:300,keySearchTimeout:500,arrowButtonMarkup:'<b class="button">&#x25be;</b>',disableOnMobile:!1,nativeOnMobile:!0,openOnFocus:!0,openOnHover:!1,hoverIntentTimeout:500,expandToItemText:!1,responsive:!1,preventWindowScroll:!0,inheritOriginalWidth:!1,allowWrap:!0,forceRenderAbove:!1,forceRenderBelow:!1,stopPropagation:!0,optionsItemBuilder:"{text}",labelBuilder:"{text}",listBuilder:!1,keys:{previous:[37,38],next:[39,40],select:[9,13,27],open:[13,32,37,38,39,40],close:[9,27]},customClass:{prefix:"selectric",camelCase:!1},multiple:{separator:", ",keepMenuOpen:!0,maxLabelEntries:!1}}});;
