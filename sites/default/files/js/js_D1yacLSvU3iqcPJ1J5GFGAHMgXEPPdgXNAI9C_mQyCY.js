(function ($) {

  // Taken from of https://stackoverflow.com/a/19015262
  function getScrollBarWidth () {
    var $outer = $('<div>').css({visibility: 'hidden', width: 100, overflow: 'scroll'}).appendTo('body'),
        widthWithScroll = $('<div>').css({width: '100%'}).appendTo($outer).outerWidth();
    $outer.remove();
    return 100 - widthWithScroll;
  };

  // Attach behaviors.
  Drupal.behaviors.hpc_disaggregation_modal = {
    attach: function(context, settings) {

      $('.disaggregation-modal-trigger span', context).css('cursor', 'pointer');
      $('.disaggregation-modal-trigger', context).css('cursor', 'pointer');
      $('.disaggregation-modal-trigger', context).click(function() {

        let page_url = $(this).data('path');
        let attachment_id = $(this).data('attachment-id');
        let metric = $(this).data('metric');
        let reporting_period = $(this).data('reporting-period');
        let icon = $(this).data('icon');

        // First show the modal, so that the users knows that something is
        // happening.
        Drupal.CTools.Modal.show('hpc-disaggregation-modal');

        $.ajax({
          url: '/modal-content/disaggregation/' + attachment_id + '/' + metric + '/' + reporting_period,
          type: "get"
        })
          .done(function(modal_settings) {
            $('#modalContent').addClass('disaggregation-modal');
            var modal_title = modal_settings.title;
            if (icon) {
              modal_title = icon + modal_title;
            }
            $('#modal-title').html(modal_title);
            if (modal_settings.reporting_period) {
              var options = { year: 'numeric', month: 'long', day: 'numeric' };
              let start_date = new Date(modal_settings.reporting_period.startDate).toLocaleDateString('en-US', options);
              let end_date = new Date(modal_settings.reporting_period.endDate).toLocaleDateString('en-US', options);
              $('.modal-header').append('<div class="reporting-period">' + Drupal.t('Monitoring period !n: !start_date - !end_date', {
                '!start_date': start_date,
                '!end_date': end_date,
                '!n': modal_settings.reporting_period.periodNumber
              }) + '</div>');
            }

            if (modal_settings.content.hasOwnProperty('message')) {
              $('#modal-content').html('<div class="modal-table-wrapper"><div class="message">' + modal_settings.content['message'] + '</div></div>');
              $('#modal-content .modal-table-wrapper .message').css('margin-top', '1rem');
            }

            if (modal_settings.content.hasOwnProperty('table_data')) {
              var table_data = modal_settings.content['table_data'];
              var table = Drupal.theme('table', table_data.header, table_data.rows, {'classes': 'pane-table sortable sticky-enabled disaggregation-modal-table'});
              $('#modal-content').html('<div class="modal-table-wrapper">' + table + '</div>');
              $('#modal-content').css('overflow-y', 'hidden');
              $('#modal-content .modal-table-wrapper').css('overflow-y', 'auto');
              $('#modal-content .modal-table-wrapper').css('overflow-x', 'auto');

              Drupal.attachBehaviors($('#modal-content')[0], settings);
              // Unbind the scroll event because it interferes with our own
              // positioning if the page is scrolled all the way to the bottom.
              $(window).unbind('scroll.drupal-tableheader', $('#modal-content .disaggregation-modal-table').data("drupal-tableheader").eventhandlerRecalculateStickyHeader);

              var body_scroll_top = document.documentElement.scrollTop || document.body.scrollTop;
              var modal_position = $('#modalContent').position();
              var sticky_header_top = modal_position.top - body_scroll_top + $('.modal-header .modal-title').height() + 1;

              // Get the scrollbar width.
              var scrollbar_width = $('#modal-content').height() < $('#modal-content .modal-table-wrapper').height() ? getScrollBarWidth() : 0;

              var main_table = $('#modal-content').find('.disaggregation-modal-table');
              var sticky_header = $('#modal-content').find('.sticky-header');
              $(sticky_header).addClass('pane-table');

              $('#modal-content .modal-table-wrapper').css('margin-top', $(sticky_header).height() + 'px');
              $('#modal-content .modal-table-wrapper table.sticky-enabled').css('margin-top', '-' + $(sticky_header).height() + 'px');

              // Adjust position and width.
              $(sticky_header).css('width', ($(main_table).find('tbody').width() + scrollbar_width) + 'px');
              $(sticky_header).css('top', (sticky_header_top - 15) + 'px');
              $(sticky_header).css('visibility', 'visible');

              // Hide the original table header.
              $(main_table).find('thead').css('visibility', 'hidden');

              // Special logic to work around the problem that you can't set overflow
              // hidden on fixed elements. We clip the header manually here and
              // reposition and reclip the header on scroll.
              var sticky_header_original_left = parseInt($(sticky_header).css('left').replace('px', ''));
              $(sticky_header).css('clip', 'rect(auto, ' + ($('#modal-content').width() - (scrollbar_width > 0 ? 15 : 0)) + 'px, auto, 0px)');
              $('#modal-content .modal-table-wrapper').scroll(function(e) {
                var scroll_left = $(e.target).scrollLeft();
                $(sticky_header).css('left', (sticky_header_original_left - scroll_left) + 'px');
                console.log($('#modal-content').width());
                $(sticky_header).css('clip', 'rect(auto, ' + ($('#modal-content').width() + scroll_left - (scrollbar_width > 0 ? 15 : 0)) + 'px, auto, ' + scroll_left + 'px)');
              });

              // Adjust column widths.
              $(main_table).find('tbody tr:first-child td').each(function(i, item) {
                $(sticky_header).find('thead tr th:nth-child(' + (i + 1) + ')').width($(item).width());
              });

              // And finally adjust the width of the last column, to assure good
              // looking positioning in the presence of a scrollbar.
              var last_column_width = $(sticky_header).find('thead tr th:last-child').width();
              var last_column_padding_right = parseInt($(sticky_header).find('thead tr th:last-child').css('padding-right').replace('px', ''));
              $(sticky_header).find('thead tr th:last-child').width((last_column_width + scrollbar_width) + 'px');
              $(sticky_header).find('thead tr th:last-child').css('padding-right', (last_column_padding_right + scrollbar_width) + 'px');
            }
          });

      });
    }
  }

})(jQuery, Drupal);
;
(function ($) {

 /**
  * Get the total displacement of given region.
  *
  * @param region
  *   Region name. Either "top" or "bottom".
  *
  * @return
  *   The total displacement of given region in pixels.
  */
  if (Drupal.overlay) {
    Drupal.overlay.getDisplacement = function (region) {
      var displacement = 0;
      var lastDisplaced = $('.overlay-displace-' + region + ':last');
      if (lastDisplaced.length) {
        displacement = lastDisplaced.offset().top + lastDisplaced.outerHeight();

        // In modern browsers (including IE9), when box-shadow is defined, use the
        // normal height.
        var cssBoxShadowValue = lastDisplaced.css('box-shadow');
        var boxShadow = (typeof cssBoxShadowValue !== 'undefined' && cssBoxShadowValue !== 'none');
        // In IE8 and below, we use the shadow filter to apply box-shadow styles to
        // the toolbar. It adds some extra height that we need to remove.
        if (!boxShadow && /DXImageTransform\.Microsoft\.Shadow/.test(lastDisplaced.css('filter'))) {
          displacement -= lastDisplaced[0].filters.item('DXImageTransform.Microsoft.Shadow').strength;
          displacement = Math.max(0, displacement);
        }
      }
      return displacement;
    };
  };

})(jQuery);
;
Drupal.settings.spotlight_settings = Drupal.settings.spotlight_settings || {};

(function ($) {

  /**
   * Form behavior for Spotlight
   */
  Drupal.behaviors.panopolySpotlight = {
    attach: function (context, settings) {
      if ($('.field-name-field-basic-spotlight-items', context).length) {
        $('.field-name-field-basic-spotlight-items', context).each(function() {
          var rotation_time = $(this).find('.panopoly-spotlight-buttons-wrapper').data('rotation-time'),
              $widget = $(this),
              $slides = $widget.find('.panopoly-spotlight'),
              $controls = $widget.find('.panopoly-spotlight-buttons-wrapper li'),
              current = 0,
              timer = null;

          function start() {
            if (timer === null) {
              timer = setTimeout(rotate, rotation_time);
            }
          }

          function stop() {
            if (timer !== null) {
              clearTimeout(timer);
              timer = null;
            }
          }

          function rotate() {
            // Increment the current slide.
            current++;
            if (current >= $controls.length) {
              current = 0;
            }

            // Click the control for the next slide.
            $controls.eq(current).children('a').trigger('click.panopoly-widgets-spotlight');
          }

          // Navigation is hidden by default, display it if JavaScript is enabled.
          $widget.find('.panopoly-spotlight-buttons-wrapper').css('display', 'block');

          // Hide all the slides but the first one.
          $slides.hide();
          $slides.eq(0).show();
          $controls.eq(0).addClass('active');

          // Bind the event for the slide numbers.
          $controls.once('panopoly-spotlight').children('a').bind('click.panopoly-widgets-spotlight', function (event) {
            var selector = $(this).attr('href');
            if (selector.indexOf('#') === 0) {
              event.preventDefault();

              // Mark the slide number as active.
              $controls.removeClass('active');
              $(this).parent().addClass('active');

              // Hide all slides but the selected one.
              $slides.hide();
              $slides.filter(selector).show();

              // Start the timer over if it's running.
              if (timer !== null) {
                stop();
                start();
              }

              return false;
            }
          });

          // Bind events to all the extra buttonts.
          $widget.find('.panopoly-spotlight-pause-play').once('panopoly-spotlight').bind('click.panopoly-widgets-spotlight', function(event) {
            event.preventDefault();
            if ($(this).hasClass('paused')) {
              start();
              $(this).text(Drupal.t('Pause'));
              $(this).removeClass('paused');
            }
            else {
              stop();
              $(this).text(Drupal.t('Play'));
              $(this).addClass('paused');
            }
          });
          if ($widget.find('.panopoly-spotlight-previous').length && $widget.find('.panopoly-spotlight-next').length) {
            $widget.find('.panopoly-spotlight-previous').once('panopoly-spotlight').bind('click.panopoly-widgets-spotlight', function (event) {
              event.preventDefault();
              $widget.find('.panopoly-spotlight-pause-play:not(.paused)').trigger('click.panopoly-widgets-spotlight');
              var activeControl = $($controls.filter('.active'));

              if (activeControl.prev().length != 0) {
                activeControl.prev().children('a').trigger('click.panopoly-widgets-spotlight');
              }
              else {
                $controls.last().children('a').trigger('click.panopoly-widgets-spotlight');
              }
            });
            $widget.find('.panopoly-spotlight-next').once('panopoly-spotlight').bind('click.panopoly-widgets-spotlight', function (event) {
              event.preventDefault();
              $widget.find('.panopoly-spotlight-pause-play:not(.paused)').trigger('click.panopoly-widgets-spotlight');
              var activeControl = $($controls.filter('.active'));

              if (activeControl.next().length != 0) {
                activeControl.next().children('a').trigger('click.panopoly-widgets-spotlight');
              }
              else {
                $controls.first().children('a').trigger('click.panopoly-widgets-spotlight');
              }
            });
          }

          start();
        });
      }
    }
  };

})(jQuery);
;
