(function($) {
  var $h1 = $('h1');
  var $guests = $('#guests');
  var $modal = $('#myModal');
  var $lonelyMsg = $('#lonelyMessage');
  var $modalBody = $modal.find('.modal-body');
  var $modalNo = $modal.find('#modalNo');
  var $modalYes = $modal.find('#modalYes');
  
  var userData = null;
  var isUserActive = null;
  var guestCount = 0;

  var sessionid = $.cookie('sessionid');
  var socket = io.connect('http://localhost:8080');
  var users = {};
  
  var resetModal = function() {
    $modal.data('connectionId', null);
    $modalBody.html(null);
  }
  
  var hasGuests = function() {
    return (guestCount > 0);
  }
  
  socket.on('user.active', function (data) {
    var title = [data.firstname, ' ', data.lastname, '.'].join('');
    userData = data;
    isUserActive = true;
    
    console.log('user.active');
    console.log(data);
    
    $h1
      .html(title)
      .addClass('active');
  });
  
  socket.on('user.inactive', function() {
    console.log('user.inactive');
    isUserActive = false;
    $h1.removeClass('active');
  });
  
  socket.on('guest.active', function(data) {
    var guestName = [data.firstname, ' ', data.lastname].join('');
    var $guest = $guests.find('[data-userid="' + data.id + '"]');
    var markup = ['<li class="guest" data-userid="', 
      data.id, '">', 
      guestName, 
      '<button class="guest_connect_button" type="button">Connect</button></li>'].join('');
    
    // check if the guest already exists before creating them on the DOM
    if ($guest.length > 0) {
      return;
    }
    if ( userData && (userData.id === data.id)) {
      return;
    }
    
    guestCount++;
    $guests.append(markup);    
    $lonelyMsg.fadeOut();
    
    console.log('guest.active');
    console.log(data);
  });
  
  socket.on('guest.inactive', function(data) {
    var $guest = $guests.find('[data-userid="'+ data.id +'"]');
    $guest.remove();
    guestCount--;

    console.log('guest.inactive');
    console.log(data);
    
    if(!hasGuests()) {
      $lonelyMsg.fadeIn();
    }
  });
  
  socket.on('guest.disconnected', function(data){
    var $guest = $guests.find('[data-userid="'+ data.id +'"]');
    $guest.remove();
  });
  
  socket.on('guest.connect.request', function(data) {
    // TODO @paul -- fill this out 
  });
  
  socket.on('connect.already', function(data) {
    // TODO @paul -- fill this out
    console.log('connect.already');
    console.log(data);
    
    alert('already connected to '+ data.firstname + ' ' + data.lastname + '.' +'!');
  });
  
  socket.on('connect.request.send', function(data) {
    console.log('connect.request.send');
    console.log(data);
    
    var markup = [ 
        'Would you like to connect with',
        data.user.firstname,
        data.user.lastname + '.',
        '?'].join(' ');
    
    $modal.data('connectionId', data.connectionId);
    $modalBody.html(markup);
    $modal.modal('show');
  });
  
  
  $guests.delegate('.guest_connect_button', 'click', function(evt) {
    var $target = $(evt.currentTarget);
    var guestId = $target.parent('.guest').data('userid');
    
    socket.emit('connect.request', { id: guestId });
    console.log('try to connect with user id=' + guestId);
  });
  
  $modalNo.click(function(evt) {
    resetModal();
    $modal.modal('hide');
  });
  
  $modalYes.click(function(evt) {
    var connectionId = $modal.data('connectionId');
    
    resetModal();
    $modal.modal('hide');
    
    socket.emit('connect.request.confirm', {
      userId: userData.id,  
      connectionId: connectionId
    });
    
    console.log('clicked on modal confirm for connection id=' + connectionId);
  });
})(jQuery);