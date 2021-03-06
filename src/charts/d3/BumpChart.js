var bumpchart = function (userConfig) {
  d3 = dex.charts.d3.d3v3;
  var chart;

  var defaults = {
    'parent': '#BumpChartParent',
    'id': 'BumpChartId',
    'class': 'BumpChartClass',
    'resizable': true,
    // Sample data...
    'csv': {
      'header': ["category", "sequence", "rank"],
      'data': [
        ["Team 1", 1, 1],
        ["Team 1", 2, 2],
        ["Team 1", 3, 3],
        ["Team 2", 1, 2],
        ["Team 2", 2, 1],
        ["Team 2", 3, 2],
        ["Team 3", 1, 3],
        ["Team 3", 2, 3],
        ["Team 3", 3, 1]
      ]
    },
    'width': "100%",
    'height': "100%",
    'margin': {
      'left': 140,
      'right': 160,
      'top': 50,
      'bottom': 50
    },
    'transform': "",
    'color': d3.scale.category10(),
    'format': d3.format("d"),
    'key': {'category': 0, 'x': 1, 'y': 2},
    'xAxisLabel': dex.config.text({
      'text': "X AxisTitle",
      'x': function () {
        return (chart.config.width - chart.config.margin.left -
          chart.config.margin.right) / 2;
      },
      'y': function (d) {
        return chart.config.height -
          (.5 * chart.config.margin.bottom);
      },
      'font': dex.config.font({
        'fontSize': '32px'
      }),
      'fill.fillColor' : 'steelblue',
      'anchor': 'middle'
    }),
    'label': dex.config.text({
      'x': 8,
      'dy': ".31em",
      'cursor': "pointer",
      'font': dex.config.font({
        'size': 16,
        'weight': 'bold',
      }),
      'fill.fillColor': function (d) {
        return chart.config.color(
          d.key);
      }
    }),
    'circle': dex.config.circle({
      'r': 6,
      'stroke': dex.config.stroke({
        'color': function (d) {
          return chart.config.color(d.key);
        },
        'width': 4,
      }),
      'fill.fillColor': 'white'
    }),
    'line': dex.config.line({
      'stroke' : dex.config.stroke({
        'color' : function(d) {
          return chart.config.color(d.key);
        },
        'width' : 3,
        //'dasharray' : "1 1"
      }),
      'fill.fillColor' : 'none'
    })
  };

  var chart = new dex.component(userConfig, defaults);

  chart.render = function render() {
    d3 = dex.charts.d3.d3v3;
    return chart.resize();
  };

  chart.update = function () {
    d3 = dex.charts.d3.d3v3;
    var chart = this;
    var config = chart.config;
    var csv = config.csv;
    var margin = config.margin;
    var width = config.width - margin.left - margin.right;
    var height = config.height - margin.top - margin.bottom;

    var categoryKey = dex.csv.getColumnName(csv, config.key.category);
    var xKey = dex.csv.getColumnName(csv, config.key.x);
    var yKey = dex.csv.getColumnName(csv, config.key.y);

    dex.console.log("cat", categoryKey, "x", xKey, "y", yKey);

    d3.selectAll(config.parent).selectAll("*").remove();

    var svg = d3.select(config.parent)
      .append("svg")
      .attr("id", config["id"])
      .attr("class", config["class"])
      .attr('width', config.width)
      .attr('height', config.height);

    var rootG = svg.append('g')
      .attr('transform', 'translate(' +
        (margin.left) + ',' +
        (margin.top) + ') ' +
        config.transform);

    var data = dex.csv.toJson(csv);
    //dex.console.log("JSON", JSON.stringify(data));

    var dataNest = d3.nest()
      .key(function (d) {
        return d[csv.header[0]];
      })
      .entries(data);

    data = dataNest;

    dex.console.log("DATA", data);

    var speed = 100;

    var x = d3.scale.linear()
      .range([0, width]);

    var clippingIndex = d3.scale.linear()
      .range([0, width]);

    var y = d3.scale.ordinal()
      .rangeRoundBands([height, 0], .1);

    var xAxis = d3.svg.axis()
      .scale(x)
      .tickSize(0)
      .tickFormat(d3.format("d"))
      .orient("bottom")
      .ticks(10);

    var xAxis1 = d3.svg.axis()
      .scale(x)
      .tickSize(0)
      .tickFormat(d3.format("d"))
      .orient("top")
      .ticks(10);

    var yAxis = d3.svg.axis()
      .scale(y)
      .tickSize(-width)
      .tickPadding(10)
      .tickFormat(d3.format("d"))
      .orient("left");

    var line = d3.svg.line()
      .x(function (d) {
        return x(+d[xKey]);
      })
      .y(function (d) {
        return y(+d[yKey]) + y.rangeBand() / 2;
      });

    var clip = svg.append("clipPath")
      .attr("id", "clip")
      .append("rect")
      .attr("width", 0)
      .attr("height", height);

    y.domain(d3.range(d3.min(data, function (series) {
        return d3.min(series.values, function (d) {
          return +d[yKey];
        });
      }),
        d3.max(data, function (series) {
          return d3.max(series.values, function (d) {
            return +d[yKey];
          });
        }) + 1)
        .reverse()
    );

    x.domain(d3.extent(data[0].values.map(function (d) {
      return +d[xKey];
    })));

    clippingIndex.domain([1, data[0].values.length]);

    //set y axis
    rootG.append("g")
      .attr("class", "y axis")
      .call(yAxis)
      .style('fill', 'none');

    //set bottom axis y
    rootG.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(" + 0 + "," + height + ")")
      .call(xAxis);

    //set top axis
    rootG.append("g")
      .attr("class", "x axis")
      .call(xAxis1);

    var key = rootG.selectAll(".key")
      .data(data)
      .enter().append("g")
      .attr("class", "key");

    var path = key.append("path")
      .attr("class", "line")
      .call(dex.config.configureLine, config.line)
      .attr("clip-path", function (d) {
        return "url(#clip)";
      })
      .attr("d", function (d) {
        return line(d.values);
      })
      .on("mouseover", function (d) {
        key.style("opacity", 0.2);
        key.filter(function (path) {
          return path.key === d.key;
        }).style("opacity", 1);
      })
      .on("mouseout", function (d) {
        key.style("opacity", 1);
      });

    var circleStart = key.append("circle")
      .call(dex.config.configureCircle, config.circle)
      .attr("cx", function (d) {
        return x(+d.values[0][xKey]);
      })
      .attr("cy", function (d) {
        return y(+d.values[0][yKey]) + y.rangeBand() / 2;
      })
      //    .style("fill", function(d) { return d.color; })
      .on("mouseover", function (d) {
        key.style("opacity", 0.2);
        key.filter(function (path) {
          return path.key === d.key;
        }).style("opacity", 1);
      })
      .on("mouseout", function (d) {
        key.style("opacity", 1);
      });

    var circleEnd = key.append("circle")
      .call(dex.config.configureCircle, config.circle)
      .attr("cx", function (d) {
        return x(+d.values[0][xKey]);
      })
      .attr("cy", function (d) {
        return y(+d.values[0][yKey]) + y.rangeBand() / 2;
      })
      .on("mouseover", function (d) {
        key.style("opacity", 0.2);
        key.filter(function (path) {
          return path.key === d.key;
        }).style("opacity", 1);
      })
      .on("mouseout", function (d) {
        key.style("opacity", 1);
      });


    // text label for the x axis
    rootG.append("text")
      .call(dex.config.configureText, config.xAxisLabel);

    var label = key.append("text")
      .attr("transform", function (d) {
        return "translate(" + (+x(d.values[0][xKey])) +
          "," + (+y(d.values[0][yKey]) + y.rangeBand() / 2) + ")";
      })
      .call(dex.config.configureText, config.label)
      .on("mouseover", function (d) {
        key.style("opacity", 0.2);
        key.filter(function (path) {
          return path.key === d.key;
        }).style("opacity", 1);
      })
      .on("mouseout", function (d) {
        key.style("opacity", 1);
      })
      .text(function (d) {
        return "" + d.values[0][yKey] + " " + d.key;
      });

    var xIndex = 1;

    var transition = d3.transition()
      .duration(speed)
      .each("start", function start() {

        label.transition()
          .duration(speed)
          .ease('linear')
          .attr("transform", function (d) {
            return "translate(" + x(+d.values[xIndex][xKey]) + "," + (y(+d.values[xIndex][yKey]) + y.rangeBand() / 2) + ")";
          })
          .text(function (d) {
            return " " + " " + d.key;
          });

        circleEnd.transition()
          .duration(speed)
          .ease('linear')
          .attr("cx", function (d) {
            return x(+(d.values[xIndex][xKey]));
          })
          .attr("cy", function (d) {
            return y(+(d.values[xIndex][yKey])) + y.rangeBand() / 2;
          });

        clip.transition()
          .duration(speed)
          .ease('linear')
          .attr("width", clippingIndex(xIndex + 1))
          .attr("height", height);

        xIndex += 1;

        if (xIndex !== data[0].values.length) transition = transition.transition().each("start", start);

      });
    // Allow method chaining
    return chart;
  };

  $(document).ready(function () {
    // Make the entire chart draggable.
    //$(chart.config.parent).draggable();
  });

  return chart;
}

module.exports = bumpchart;