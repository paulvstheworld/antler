(function($) {
  var $h1 = $('h1');
  var $guests = $('#guests');
  var $lonelyMsg = $('#lonelyMessage');
  
  var userData = null;
  var isUserActive = null;
  var guestCount = 0;

  var sessionid = $.cookie('sessionid');
  var socket = io.connect('http://localhost:8080');
  var users = {};
  
  var hasGuests = function() {
    return (guestCount > 0);
  };
  
  var getGuestContainer = function(id) {
    return $guests.find('[data-userid="'+ id +'"]');
  };
  
  var removeGuestContainerClasses = function($guestContainer) {
    $guestContainer.removeClass('alert-info alert-success alert-warning alert-danger');
  }
  
  var setGuestConnected = function(id) {
    var $guestContainer = $guests.find('[data-userid="'+ id +'"]');
    removeGuestContainerClasses($guestContainer);
    $guestContainer.addClass('alert-success');
    $guestContainer.addClass('connected');
  }
  
  var setGuestRequested = function(id, connectionId) {
    var $guestContainer = getGuestContainer(id);
    var $guestConfirmButton = $guestContainer.find('.guest_confirm_button')
    removeGuestContainerClasses($guestContainer);
    $guestContainer.addClass('alert-warning');
    $guestContainer.addClass('confirm');
    $guestConfirmButton.data('connectionId', connectionId);
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
    
    //window.location.href = '/reconnect';
  });
  
  
  socket.on('guest.active', function(data) {
    var guestName = [data.firstname, ' ', data.lastname].join('');
    var $guest = $guests.find('[data-userid="' + data.id + '"]');
    var markup = ['<li class="guest alert-info" data-userid="', data.id, '">', 
      guestName, 
      '<button class="guest_connect_button" type="button">Connect</button>',
      '<button class="guest_confirm_button" type="button">Confirm</button>',
      '<span class="check">&#x2713;</span>',
      '</li>'].join('');
    
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
    console.log('connect.already');
    console.log(data);
    // message showing already connected   
    
    setGuestConnected(data.id);
    
    console.log('already connected to '+ data.firstname + ' ' + data.lastname + '.' +'!');
  });
  
  
  socket.on('connect.request.send', function(data) {
    console.log('connect.request.send');
    console.log(data);
    
    var markup = [ 
        'Would you like to connect with',
        data.user.firstname,
        data.user.lastname + '.',
        '?'].join(' ');
    
    setGuestRequested(data.user.id, data.connectionId);
  });
  
  socket.on('connect.request.confirmed', function(data) {
    setGuestConnected(data.userId);
  })
  
  
  $guests.delegate('.guest_connect_button', 'click', function(evt) {
    var $target = $(evt.currentTarget);
    var guestId = $target.parent('.guest').data('userid');
    var $guestContainer = getGuestContainer(guestId);
    removeGuestContainerClasses($guestContainer);
    $guestContainer.addClass('alert-warning');
    
    $target.text('Request Sent');
    $target.attr('disabled', 'disabled');
    
    socket.emit('connect.request', { id: guestId });
    console.log('try to connect with user id=' + guestId);
  });
  
  
  $guests.delegate('.guest_confirm_button', 'click', function(evt) {
    var $target = $(evt.currentTarget);
    var guestId = $target.parent('.guest').data('userid');
    var connectionId = $target.data('connectionId');
    
    console.log('confirming');
    
    socket.emit('connect.request.confirm', {
      userId: userData.id,  
      connectionId: connectionId
    });
  });
  
})(jQuery);