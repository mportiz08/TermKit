(function ($) {

var ov = termkit.outputView;

/**
 * Constructs node objects of the right class.
 */
ov.outputFactory = function () {

};

ov.outputFactory.prototype = {

  // Construct a tree of view objects.
  tree: function (objects) {
    var that = this;
    return oneOrMany(objects).map(function (node) { return that.construct(node); });
  },

  construct: function (properties) {
    var type = widgets[properties.type] || ov.outputNode,
        node = new type(properties),
        that = this;

    if (node.properties.children) {
      var nodes = node.properties.children.map(function (node) {
        return that.construct(node);
      });
      delete node.properties.children;
      node.add(nodes);
    }
    
    return node;
  },

};

var widgets = ov.outputFactory.widgets = {};

///////////////////////////////////////////////////////////////////////////////

/**
 * Widget: Base view
 */
widgets.view = function (properties) {
  
  // Initialize node.
  ov.outputNode.call(this, properties);
  
  this.$contents = this.$element.find('.contents');
  this.updateElement();
};

widgets.view.prototype = $.extend(new ov.outputNode(), {

});

/**
 * Widget: Text output
 */
widgets.text = function (properties) {
  
  // Initialize node.
  ov.outputNode.call(this, properties);
  
  this.$contents = this.$element.find('.contents');
  this.updateElement();
};

widgets.text.prototype = $.extend(new ov.outputNode(), {
  
  // Return active markup for this widget.
  $markup: function () {
    var $outputNode = $('<div class="termkitOutputNode widgetText"><div class="contents"></div></div>').data('controller', this);
    var that = this;
    return $outputNode;
  },

  // Update markup to match.
  updateElement: function () {
    this.$contents.text(this.properties.contents);
    this.$element.data('controller', this);
    
//    this.notify('view.callback', { raw: 'foo' });
  },
  
});

/**
 * Widget: HTML output
 */
widgets.html = function (properties) {
  
  // Initialize node.
  ov.outputNode.call(this, properties);
  
  this.$contents = this.$element.find('.contents');
  this.updateElement();
};

widgets.html.prototype = $.extend(new ov.outputNode(), {
  
  // Return active markup for this widget.
  $markup: function () {
    var $outputNode = $('<div class="termkitOutputNode widgetHTML"><div class="contents"></div></div>').data('controller', this);
    var that = this;
    return $outputNode;
  },

  // Update markup to match.
  updateElement: function () {
    this.$contents.html(this.properties.contents);
    this.$element.data('controller', this);
  },
  
});

/**
 * Widget: File icon.
 *
 * Icon loading is collectively throttled.
 */
widgets.icon = function (properties) {
  
  // Initialize node.
  ov.outputNode.call(this, properties);
  
  this.updateElement();
  
  this.queue();
};

// Process icon updates.
widgets.icon.queue = [];
widgets.icon.limit = 4;
widgets.icon.process = function () {
  if (widgets.icon.queue.length && widgets.icon.limit > 0) {
    widgets.icon.limit--;
    
    var icon = widgets.icon.queue.shift();
    icon.process();
  }
};

widgets.icon.prototype = $.extend(new ov.outputNode(), {
  
  // Return active markup for this widget.
  $markup: function () {
    var $outputNode = $('<div class="termkitOutputNode widgetIcon"></div>').data('controller', this);
    return $outputNode;
  },

  setDefaultIcon: function (callback) {
    // Set default icon.
    var image = new Image(),
        extension = (this.properties.stats.mode & 0x4000) ? '...' : this.properties.name.split('.').pop(),
        defaultUrl = 'termkit-icon-default:///' + encodeURIComponent(extension);

    image.onload = function () {
      callback && callback();
    };

    image.src = defaultUrl;
    if (!this.noDefault) {
      this.$element.css({
        background: 'url('+ defaultUrl +')',
        backgroundSize: '32px 32px',
      });
    }
  },
  
  setOwnIcon: function (callback) {
    var that = this;

    // Set file-specific icon.
    var image = new Image(),
        path = this.properties.path + '/' + this.properties.name,
        previewUrl = 'termkit-icon-preview:///' + encodeURIComponent(path);

    image.onload = function () {
      this.noDefault = true;

      that.$element.css({
        background: 'url('+ previewUrl +')'
      });
      callback && callback();
    };

    image.src = previewUrl;
  },
  
  // Queue icon updates to avoid choking webkit.
  queue: function () {
    widgets.icon.queue.push(this);
    widgets.icon.process();
  },
  
  // Process the icon update.
  process: function () {
    function yield() {
      widgets.icon.process();
    }
    
    this.setOwnIcon(yield);
    
    widgets.icon.limit++;
  },
  
  // Update markup to match.
  updateElement: function () {
    var that = this;

    this.setDefaultIcon();

    this.$element.data('controller', this);
  },
  
});

/**
 * Widget: File reference
 */
widgets.file = function (properties) {
  
  // Initialize node.
  ov.outputNode.call(this, properties);
  
  this.$icon = this.$element.find('.icon');
  this.$name = this.$element.find('.name');
  this.$meta = this.$element.find('.meta');

  this.icon = new widgets.icon(this.properties);
  this.$icon.append(this.icon.$element);
  this.icon.updateElement();

  this.updateElement();
};

widgets.file.prototype = $.extend(new ov.outputNode(), {
  
  // Return active markup for this widget.
  $markup: function () {
    var $outputNode = $('<div class="termkitOutputNode widgetFile" draggable="true"><div class="icon"></div><div class="name"></div><div class="meta"></div></div>').data('controller', this);
    var that = this;
    return $outputNode;
  },
  
  // Update markup to match.
  updateElement: function () {
    var that = this;

    this.$element.data('controller', this);

    // Set text labels.
    this.$name.text(this.properties.name);
    this.$meta.text(formatSize(this.properties.stats.size));
    
    if (this.properties.name[0] == '.') {
      this.$element.addClass('file-hidden');
    }
  },
  
});

/**
 * Widget: Image
 */
widgets.image = function (properties) {
  
  // Initialize node.
  ov.outputNode.call(this, properties);
  
  this.$img = this.$element.find('img');
  
  this.updateElement();
};

widgets.image.prototype = $.extend(new ov.outputNode(), {
  
  // Return active markup for this widget.
  $markup: function () {
    var $outputNode = $('<div class="termkitOutputNode widgetImage termkitLimitHeight" draggable="true"><img></div>').data('controller', this);
    var that = this;
    return $outputNode;
  },
  
  // Update markup to match.
  updateElement: function () {
    var that = this;

    this.$element.data('controller', this);

    if (this.properties.url) {
      this.$img[0].src = this.properties.url;
    }
  },
  
});

/**
 * Container: list
 */
widgets.list = function (properties) {
  
  // Initialize node.
  ov.outputNode.call(this, properties);

  this.updateElement();
};

widgets.list.prototype = $.extend(new ov.outputNode(), {
  
  // Return active markup for this widget.
  $markup: function () {
    var $outputNode = $('<div class="termkitOutputNode widgetList termkitLimitHeight"><div class="children"></div></div>').data('controller', this);
    var that = this;
    return $outputNode;
  },

  // Update markup to match.
  updateElement: function () {
    this.$element.data('controller', this);
  },
  
});

/**
 * Widget: Code output
 */
widgets.code = function (properties) {
  
  // Initialize node.
  ov.outputNode.call(this, properties);
  
  this.$contents = this.$element.find('.contents');
  this.$pre = this.$contents.find('pre');
  
  var brushes = {
    'text/x-applescript': 'applescript',
    'text/x-actionscript': 'as3',
    'text/x-shellscript': 'sh',
    'text/x-c': 'c',
    'text/x-c++': 'cpp',
    'text/x-csharpsrc': 'c#',
    'text/css': 'css',
    'text/x-diff': 'diff',
    'text/x-erlang': 'erl',
    'text/x-groovy': 'groovy',
    'text/x-java-source': 'java',
    'application/javascript': 'js',
    'application/json': 'js',
    'text/javascript': 'js',
    'application/x-perl': 'pl',
    'application/x-php': 'php',
    'text/x-python': 'py',
    'text/x-ruby': 'rb',
    'text/x-sass': 'sass',
    'text/x-scala': 'scala',
    'text/x-sql': 'sql',
    'text/xml': 'xml',
    
  };
  this.brush = brushes[properties.language];
  
  this.updateElement();
};

widgets.code.prototype = $.extend(new widgets.text(), {
  
  // Return active markup for this widget.
  $markup: function () {
    var $outputNode = $('<div class="termkitOutputNode widgetText widgetCode"><div class="contents"><pre></pre></div></div>').data('controller', this);
    var that = this;
    return $outputNode;
  },

  // Update markup to match.
  updateElement: function () {
    this.$contents.html('<pre></pre>');
    this.$pre = this.$contents.find('pre');
    
    this.$pre.text(this.properties.contents);
    this.$pre.attr('class', 'brush: ' + this.brush);

  	SyntaxHighlighter.highlight({}, this.$pre[0]);

    this.$element.data('controller', this);
  },
  
});

/**
 * Widget: Progress bar
 */
widgets.progress = function (properties) {
  
  // Initialize node.
  ov.outputNode.call(this, properties);

  this.bar = new termkit.progress();
  this.$element.append(this.bar.$element);

  this.updateElement();
};

widgets.progress.prototype = $.extend(new ov.outputNode(), {
  
  // Return active markup for this widget.
  $markup: function () {
    var $outputNode = $('<div class="termkitOutputNode widgetProgress"></div>').data('controller', this);
    return $outputNode;
  },
  
  // Update markup to match.
  updateElement: function () {

    this.bar.min = this.properties.min || 0;
    this.bar.max = this.properties.max || 100;
    this.bar.value = this.properties.value || 0;

    this.bar.updateElement();
  },
  
});

/**
 * Widget: Spinner
 */
widgets.spinner = function (properties) {
  
  // Initialize node.
  ov.outputNode.call(this, properties);

  this.spinner = new termkit.spinner();
  this.$element.append(this.spinner.$element);

  this.updateElement();
};

widgets.spinner.prototype = $.extend(new ov.outputNode(), {
  
  // Return active markup for this widget.
  $markup: function () {
    var $outputNode = $('<div class="termkitOutputNode widgetSpinner"></div>').data('controller', this);
    return $outputNode;
  },
  
  // Update markup to match.
  updateElement: function () {
    this.spinner.updateElement();
  },
  
});

/**
 * Widget: clear
 */
widgets.clear = function (properties) {
  
  // Initialize node.
  ov.outputNode.call(this, properties);
  
  this.$contents = this.$element.find('.contents');
  this.updateElement();
};

widgets.clear.prototype = $.extend(new ov.outputNode(), {
  
  // Return active markup for this widget.
  $markup: function () {
    var $clearheight = $(window).height();
    console.log($clearheight);
    var $outputNode = $('<div class="termkitOutputNode widgetClear"><div class="contents" style="height: ' + $clearheight + 'px;"></div></div>').data('controller', this);
    var that = this;
    return $outputNode;
  },

  // Update markup to match.
  updateElement: function () {
    this.$contents.html(this.properties.contents);
    this.$element.data('controller', this);
  },
  
});

})(jQuery);