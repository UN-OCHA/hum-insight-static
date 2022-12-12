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
