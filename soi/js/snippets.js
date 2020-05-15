(function ($) {
  $(document).ready(function () {

    // Modal
    // Varianti

    // Modali standard
    // .js-modal-sm .js-modal-md .js-modal-lg

    // Modale full page
    // .js-modal-overlay

    // Modale helpdesk menu footer
    $('.js-ask-call').on('click', handleModal('.js-modal-sm'))

    // Modali sponsor list etc.
    $('.js-big-modal').on('click', handleModal('.js-modal-overlay'))

    function handleModal (modalClass) {
      return function (e) {
        e.preventDefault()
        const jModal = $(modalClass)
        jModal.addClass('active')
        const jModalHeader    = jModal.find('modal-header')
        const jModalContent   = jModal.find('modal-content')
        const jModalFooter    = jModal.find('modal-footer')
        const jModalListenRef = jModal.find('a').on('click', function (e) {
          e.preventDefault()
          jModal.removeClass('active')
          jModalListenRef.off('click')
        })
      }
    }

  })
}(jQuery))
