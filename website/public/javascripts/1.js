console.log(window.location.href)
var temperatureData = [];

var margin = { top: 10, right: 30, bottom: 30, left: 50 },
  width = 1000 - margin.left - margin.right,
  height = 400 - margin.top - margin.bottom;

var svg = d3.select("svg")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var x = d3.scaleLinear().range([0, width]);
var xAxis = d3.axisBottom().scale(x);
svg.append("g")
  .attr("transform", "translate(0," + height + ")")
  .attr("class", "Xaxis")

var y = d3.scaleLinear().range([height, 0]);
var yAxis = d3.axisLeft().scale(y);
svg.append("g")
  .attr("class", "Yaxis")


var temperature, humidity;
function updateData() {
  async.series([
    (callback) => {
      fetch(`temperature`).then((res) => {
        return res.json();
      }).then((data) => {
        temperature = { data: data["data"], time: data["time"] };
        console.log(temperature);
        callback(null, null)
      })

    },
    (callback) => {
      fetch(`humidity`).then((res) => {
        return res.json();
      }).then((data) => {
        humidity = { data: data["data"], time: data["time"] };
        console.log(humidity);
        callback(null, null)
      })

    },
    (callback) => {

      temperatureData.push(temperature)
      if (temperatureData.length >= 10) {
        temperatureData.shift()
        x.domain([d3.min(temperatureData, function (d) { return d.time }), d3.max(temperatureData, function (d) { return d.time })]);
        svg.selectAll(".Xaxis")
          .call(xAxis);

        y.domain([d3.min(temperatureData, function (d) { return d.data }), d3.max(temperatureData, function (d) { return d.data })]);
        svg.selectAll(".Yaxis")
          .call(yAxis);

        var u = svg.selectAll(".lineTest")
          .data([temperatureData], function (d) { return d.data });

        u
          .enter()
          .append("path")
          .attr("class", "lineTest")
        u.merge(u)
        u.attr("d", d3.line()
          .x(function (d) { return x(d.time); })
          .y(function (d) { return y(d.data); }))
          .attr("fill", "none")
          .attr("stroke", "steelblue")
          .attr("stroke-width", 2.5)
      }
      callback(null, null);
    },
    (callback) => {
      setTimeout(updateData, 2000);
      callback(null, null);
    }

  ])
}
updateData();

