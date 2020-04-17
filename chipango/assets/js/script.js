(function ($) {

  $ && $(document).ready(function () {

    new Swiper(
      '.swiper-container-primary',
      {
        slidesPerView: 1,
        loop: false,
        autoplay: false,
        navigation: {
          nextEl: '.swiper-button-next-primary',
          prevEl: '.swiper-button-prev-primary',
        },
      });

    new Swiper(
      '.swiper-container-secondary',
      {
        loop: false,
        autoplay: false,
        autoHeight: true,
        slidesPerView: 2,
        spaceBetween: 0,
        navigation: {
          nextEl: '.swiper-button-next-secondary',
          prevEl: '.swiper-button-prev-secondary',
        },
        breakpoints: {
          576: {
            slidesPerView: 3,
          },
          768: {
            slidesPerView: 6,
          },
        },
      },
    );

    // // ******************* Carousel testimonials *******************
    // new Swiper(
    //   '.swiper-container-testimonials',
    //   {
    //     slidesPerView: 1,
    //     loop: false,
    //     autoplay: false,
    //     pagination: {
    //       el: '.swiper-pagination-testimonials',
    //     },
    //     breakpoints: {
    //       768: {
    //         slidesPerView: 2,
    //       },
    //       992: {
    //         slidesPerView: 3,
    //       },
    //     }
    //   }
    // );

  });

}(jQuery));
