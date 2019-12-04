function show(elementParent, require) {//console.log(window.location.href)
  

  var margin = { top: 10, right: 30, bottom: 30, left: 50 },
    width = 500 - margin.left - margin.right,
    height = 200 - margin.top - margin.bottom;

  var element = elementParent
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var x = d3.scaleTime().range([0, width]);
  var xAxis = d3.axisBottom().scale(x);
  element.append("g")
    .attr("transform", "translate(0," + height + ")")
    .attr("class", "Xaxis")

  var y = d3.scaleLinear().range([height, 0]);
  var yAxis = d3.axisLeft().scale(y);
  element.append("g")
    .attr("class", "Yaxis")

  var rawData;
  var dataSet = [];
  function updateData() {
    async.series([
      (callback) => {
        fetch(require).then((res) => {
          return res.json();
        }).then((data) => {
          rawData = { data: data["data"], time: data["time"] };
          console.log(rawData);
          callback(null, null)
        })

      },
      (callback) => {

        dataSet.push(rawData)
        if (dataSet.length >= 10) {
          dataSet.shift()
          x.domain([d3.min(dataSet, function (d) { return d.time }), d3.max(dataSet, function (d) { return d.time })]);
          element.selectAll(".Xaxis")
            .call(xAxis);

          y.domain([d3.min(dataSet, function (d) { return d.data }), d3.max(dataSet, function (d) { return d.data })]);
          element.selectAll(".Yaxis")
            .call(yAxis);

          var u = element.selectAll(".line")
            .data([dataSet], function (d) { return d.data });

          u
            .enter()
            .append("path")
            .attr("class", "line")
            .merge(u)
            .attr("d", d3.line()
              .x(function (d) { return x(d.time); })
              .y(function (d) { return y(d.data); })
            )
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
}
