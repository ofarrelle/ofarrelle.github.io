import data from "https://cdn.jsdelivr.net/npm/vega-datasets@2/+esm";
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

// ============= Datasets =============

const gapminder = await data['gapminder.json']();
console.log(gapminder);
const lifeExpect2000 = Array.from(
    d3.rollup(
        gapminder.filter(d => d.year === 2000),
        v => d3.mean(v, d => d.life_expect),
        d => d.cluster
    ),
    ([cluster, life_expect]) => ({ cluster, life_expect })
);
const countries2000 = gapminder
    .filter(d => d.year === 2000)
    .map(({ country, pop, life_expect, cluster }) => ({ country, pop, life_expect, cluster }));

const width = 500;
const height = 300;
const margin = { top: 20, right: 20, bottom: 40, left: 50 };

// ============= Shared Interaction Logic =============
let selectedCluster = null;

function updateSelection(cluster) {
    // if the same cluster is clicked again, deselect it
    // otherwise select the clicked cluster
    selectedCluster = selectedCluster === cluster ? null : cluster;

    // if selectedCluster is null, set opacity to 1 for all
    // otherwise, set opacity to 1 for selected cluster and 0.3 for others
    bars.style("opacity", bar =>
        selectedCluster === null || bar.cluster === selectedCluster ? 1 : 0.3
    );
    points.style("opacity", point =>
        selectedCluster === null || point.cluster === selectedCluster ? 1 : 0.3
    );
}

// ============= Bar Chart =============

const lifeScale = d3.scaleLinear()
    .domain([0, d3.max(lifeExpect2000, d => d.life_expect)])
    .range([margin.left, width - margin.right]);

const yScale = d3.scaleBand()
    .domain(lifeExpect2000.map(d => d.cluster))
    .range([margin.top, height - margin.bottom])
    .padding(0.2);

const colorScale = d3.scaleOrdinal(d3.schemeTableau10)
    .domain(lifeExpect2000.map(d => d.cluster))

const bar_container = d3.select('#bar-chart')
    .append('svg')
    .attr('width', width)
    .attr('height', height);

const bars = bar_container.selectAll('rect')
    .data(lifeExpect2000)
    .join('rect')
    .attr('x', lifeScale(0))
    .attr('width', d => lifeScale(d.life_expect) - lifeScale(0))
    .attr('y', d => yScale(d.cluster))
    .attr('height', yScale.bandwidth())
    .style('stroke', 'white')
    .style('fill', d => colorScale(d.cluster))
    .style('cursor', 'pointer')
    .style('opacity', 1)
    .on("click", (event, d) => {
        updateSelection(d.cluster) // send the clicked item's cluster to the update function
    });

bar_container.append('g')
    .attr('transform', `translate(0, ${height - margin.bottom})`)
    .call(d3.axisBottom(lifeScale));

bar_container.append('g')
    .attr('transform', `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(yScale));

// ============= Scatter Plot =============

const populationScale = d3.scaleLog()   // population varies a LOT → log scale
    .domain(d3.extent(countries2000, d => d.pop))
    .range([margin.left, width - margin.right]);

const scatterLifeScale = d3.scaleLinear()
    .domain(d3.extent(countries2000, d => d.life_expect))
    .range([height - margin.bottom, margin.top]);

const scatter_container = d3.select('#scatter-plot')
    .append('svg')
    .attr('width', width)
    .attr('height', height);

const points = scatter_container.selectAll("circle")
    .data(countries2000)
    .join("circle")
    .attr("cx", d => populationScale(d.pop))
    .attr("cy", d => scatterLifeScale(d.life_expect))
    .attr("r", 8)
    .attr("fill", d => colorScale(d.cluster))
    .style('cursor', 'pointer')
    .style('opacity', 1)
    .on("click", (event, d) => {
        updateSelection(d.cluster) // send the clicked item's cluster to the update function
    });

scatter_container.append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(d3.axisBottom(populationScale).ticks(6, "~s"))
    .append("text")
    .attr("x", width / 2)
    .attr("y", 40)
    .attr("text-anchor", "middle")
    .text("Population (log scale)")
    .style("fill", "white");

scatter_container.append("g")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(scatterLifeScale))
    .append("text")
    .attr("y", 0)
    .attr("x", 0)
    .attr("dy", `-${margin.left / 2}`)
    .attr("dx", `-${height - margin.bottom - 5}`)
    .attr("text-anchor", "start")
    .attr("transform",`rotate(-90)`)
    .text("Life Expectancy (year)")
    .style("fill", "white");

