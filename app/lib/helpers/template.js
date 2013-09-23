var hbs = require('hbs');

var blocks = {};

module.exports.registerHelpers = function() {
  hbs.registerHelper('extend', function(name, context) {
    var block = blocks[name];
    if(!block) {
      block = blocks[name] = [];
    }
    block.push(context.fn(this));
  });

  hbs.registerHelper('block', function(name){
    var val = (blocks[name] || [].join('\n'));
    //clear block
    blocks[name] = [];
    return val;
  });
  
  hbs.registerHelper('safe', function(name) {
    var val = (blocks[name] || [].join('\n'));
    blocks[name] = [];
    return hbs.handlebars.SafeString(val);
  })
  
};