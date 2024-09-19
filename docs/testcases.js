// Define available time periods in milliseconds
const timePeriods = {
    'Minute': 60 * 1000,
    'Hour': 60 * 60 * 1000,
    'Day': 24 * 60 * 60 * 1000,
    'Week': 7 * 24 * 60 * 60 * 1000
  };
  
  // Function to fetch and process data for a given test type
  function fetchDataAndRenderChart(testType, selectedTimePeriod) {
    const dataFile = testType === 'unitTest' ? 'unit_test_data.json' : 'android_test_data.json';
    const timePeriodSelectId = testType === 'unitTest' ? 'timePeriodSelectUnit' : 'timePeriodSelectAndroid';
    const searchInputId = testType === 'unitTest' ? 'searchInputUnit' : 'searchInputAndroid';
    const chartCanvasId = testType === 'unitTest' ? 'testCasesChartUnit' : 'testCasesChartAndroid';
    const chartInstanceName = testType === 'unitTest' ? 'testCasesChartUnitInstance' : 'testCasesChartAndroidInstance';
    const allDatasetsName = testType === 'unitTest' ? 'allUnitDatasets' : 'allAndroidDatasets';
  
    fetch(dataFile)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        const caseData = data.cases;
  
        // Proceed only if caseData is an array
        if (!Array.isArray(caseData)) {
          throw new Error('Invalid data format: "cases" is not an array.');
        }
  
        // Aggregate data by test case and time period
        const aggregatedData = {};
  
        caseData.forEach(testCase => {
          const testName = `${testCase.classname}.${testCase.test_name}`;
          const timestamp = new Date(testCase.timestamp).getTime();
  
          // Calculate the time bucket based on the selected period
          const period = timePeriods[selectedTimePeriod];
          const timeBucket = Math.floor(timestamp / period) * period;
  
          if (!aggregatedData[testName]) {
            aggregatedData[testName] = {};
          }
          if (!aggregatedData[testName][timeBucket]) {
            aggregatedData[testName][timeBucket] = {
              totalRuns: 0,
              passed: 0,
              failed: 0,
              errors: 0,
              skipped: 0
            };
          }
  
          aggregatedData[testName][timeBucket].totalRuns += 1;
  
          switch (testCase.status) {
            case 'passed':
              aggregatedData[testName][timeBucket].passed += 1;
              break;
            case 'failed':
              aggregatedData[testName][timeBucket].failed += 1;
              break;
            case 'error':
              aggregatedData[testName][timeBucket].errors += 1;
              break;
            case 'skipped':
              aggregatedData[testName][timeBucket].skipped += 1;
              break;
          }
        });
  
        // Prepare data for charting
        const datasets = [];
        const allTimeBuckets = new Set();
  
        Object.keys(aggregatedData).forEach(testName => {
          const dataPoints = [];
          const timeBuckets = Object.keys(aggregatedData[testName]).sort((a, b) => a - b);
  
          timeBuckets.forEach(timeBucket => {
            const stats = aggregatedData[testName][timeBucket];
            const failureCount = stats.failed + stats.errors;
            const totalRuns = stats.totalRuns;
            const failurePercentage = (failureCount / totalRuns) * 100;
  
            dataPoints.push({
              x: new Date(parseInt(timeBucket)),
              y: failurePercentage,
              stats: stats
            });
  
            allTimeBuckets.add(parseInt(timeBucket));
          });
  
          datasets.push({
            label: testName,
            data: dataPoints,
            fill: false,
            borderColor: getRandomColor(),
            tension: 0.1
          });
        });
  
        // Store all datasets for filtering
        window[allDatasetsName] = datasets;
  
        // Limit the number of datasets displayed initially (e.g., top 5 test cases)
        const initialDatasets = getTopDatasets(datasets, 5);
  
        // Destroy existing chart if it exists and has a destroy method
        if (window[chartInstanceName] && typeof window[chartInstanceName].destroy === 'function') {
          window[chartInstanceName].destroy();
        }
  
        // Configure the chart
        const ctx = document.getElementById(chartCanvasId).getContext('2d');
  
        window[chartInstanceName] = new Chart(ctx, {
          type: 'line',
          data: {
            datasets: initialDatasets
          },
          options: {
            parsing: {
              xAxisKey: 'x',
              yAxisKey: 'y'
            },
            scales: {
              x: {
                type: 'time',
                time: {
                  unit: getTimeUnit(selectedTimePeriod)
                },
                title: {
                  display: true,
                  text: 'Time'
                }
              },
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: 'Failure Percentage (%)'
                }
              }
            },
            plugins: {
              tooltip: {
                mode: 'nearest',
                intersect: false,
                callbacks: {
                  title: function(context) {
                    const date = context[0].parsed.x;
                    return `Time: ${new Date(date).toLocaleString()}`;
                  },
                  label: function(context) {
                    const dataset = context.dataset;
                    const dataPoint = dataset.data[context.dataIndex];
                    const stats = dataPoint.stats;
                    const failureCount = stats.failed + stats.errors;
                    const totalRuns = stats.totalRuns;
                    const failurePercentage = ((failureCount / totalRuns) * 100).toFixed(2);
                    return [
                      `Test Case: ${dataset.label}`,
                      `Failures: ${failureCount}`,
                      `Passes: ${stats.passed}`,
                      `Total Runs: ${totalRuns}`,
                      `Failure %: ${failurePercentage}%`
                    ];
                  }
                }
              },
              legend: {
                display: false // Hide legend to avoid clutter
              },
              title: {
                display: true,
                text: 'Test Case Failure Percentage Over Time'
              }
            },
            interaction: {
              mode: 'nearest',
              intersect: false
            },
            elements: {
              point: {
                radius: 3
              }
            }
          }
        });
  
        // Event listener for time period selection and search input
        const timePeriodSelect = document.getElementById(timePeriodSelectId);
        const searchInput = document.getElementById(searchInputId);
  
        timePeriodSelect.addEventListener('change', function(e) {
          selectedTimePeriod = e.target.value;
          fetchDataAndRenderChart(testType, selectedTimePeriod); // Re-fetch data with new time period
        });
  
        searchInput.addEventListener('input', function(e) {
          const searchTerm = e.target.value.toLowerCase();
          // Filter datasets based on search term
          const filteredDatasets = window[allDatasetsName].filter(dataset => dataset.label.toLowerCase().includes(searchTerm));
          window[chartInstanceName].data.datasets = filteredDatasets;
          window[chartInstanceName].update();
        });
      })
      .catch(error => {
        console.error('Error loading test data:', error);
  
        // If a chart instance exists, destroy it
        if (window[chartInstanceName] && typeof window[chartInstanceName].destroy === 'function') {
          window[chartInstanceName].destroy();
        }
  
        // Optionally, display an error message on the page
        const chartContainer = document.getElementById(chartCanvasId).parentNode;
        chartContainer.innerHTML = `<p>Error loading test data: ${error.message}</p>`;
      });
  }
  
  // Function to get a random color for each dataset
  function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }
  
  // Function to get the appropriate time unit for Chart.js
  function getTimeUnit(timePeriod) {
    switch (timePeriod) {
      case 'Minute':
        return 'minute';
      case 'Hour':
        return 'hour';
      case 'Day':
        return 'day';
      case 'Week':
        return 'week';
      default:
        return 'day';
    }
  }
  
  // Function to get top N datasets based on average failure percentage
  function getTopDatasets(datasets, topN) {
    // Calculate average failure percentage for each dataset
    datasets.forEach(dataset => {
      const totalFailurePercentage = dataset.data.reduce((sum, dp) => sum + dp.y, 0);
      dataset.avgFailurePercentage = totalFailurePercentage / dataset.data.length;
    });
  
    // Sort datasets by average failure percentage in descending order
    datasets.sort((a, b) => b.avgFailurePercentage - a.avgFailurePercentage);
  
    // Return the top N datasets
    return datasets.slice(0, topN);
  }
  
  // Initial chart rendering
  document.addEventListener('DOMContentLoaded', function() {
    fetchDataAndRenderChart('unitTest', 'Minute');
    fetchDataAndRenderChart('androidTest', 'Minute');
  });
  