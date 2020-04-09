(function ($) {

  $ && $(document).ready(function () {

    // ******************* Carousel main benefits *******************
    new Swiper(
      '.swiper-container-benefits',
      {
        slidesPerView: 1,
        loop: false,
        autoplay: false,
        pagination: {
          el: '.swiper-pagination-benefits',
        },
        breakpoints: {
          768: {
            slidesPerView: 2,
          },
          992: {
            slidesPerView: 3,
          },
        }
      })

    // ******************* Carousel partner logos *******************
    new Swiper(
      '.swiper-container-logos',
      {
        loop: false,
        autoplay: false,
        autoHeight: true,
        slidesPerView: 1,
        spaceBetween: 30,
        breakpoints: {
          576: {
            slidesPerView: 2,
          },
          768: {
            slidesPerView: 3,
          },
        },
      },
    );

    // // ******************* Carousel testimonials *******************
    new Swiper(
      '.swiper-container-testimonials',
      {
        slidesPerView: 1,
        loop: false,
        autoplay: false,
        pagination: {
          el: '.swiper-pagination-testimonials',
        },
        breakpoints: {
          768: {
            slidesPerView: 2,
          },
          992: {
            slidesPerView: 3,
          },
        }
      }
    );

    // ******************* FAQ selector *******************
    var active_bg = $('.faq-selector-active-bg');
    var active_slide_id = 0;
    $('.js-faq-selector').on('click', function () {
      var slide_id = parseInt(this.getAttribute('data-slide-to'));
      if (slide_id !== active_slide_id) {
        active_slide_id = slide_id;
        active_bg.toggleClass('doctor');
      }
    });

  });

}(jQuery));
