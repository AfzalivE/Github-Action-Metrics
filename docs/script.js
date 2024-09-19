function fetchDataAndCreateChart(dataFile, chartCanvasId, chartTitle) {
  fetch(dataFile)
    .then(response => response.json())
    .then(data => {
      const suiteData = data.suites;

      const timestamps = suiteData.map(entry => new Date(entry.timestamp).toLocaleString());
      const passedTests = suiteData.map(entry => entry.passed);
      const failedTests = suiteData.map(entry => entry.failures + entry.errors);
      const testTimes = suiteData.map(entry => entry.time);
      const statuses = suiteData.map(entry => entry.status);

      // Create datasets
      const datasets = [
        {
          label: 'Passed Tests',
          data: passedTests,
          borderColor: 'green',
          backgroundColor: 'green',
          fill: false,
          yAxisID: 'y-axis-tests'
        },
        {
          label: 'Failed Tests',
          data: failedTests,
          borderColor: 'red',
          backgroundColor: 'red',
          fill: false,
          yAxisID: 'y-axis-tests'
        },
        {
          label: 'Test Duration (s)',
          data: testTimes,
          borderColor: 'blue',
          backgroundColor: 'blue',
          fill: false,
          yAxisID: 'y-axis-time'
        }
      ];

      // Chart configuration
      const chartConfig = {
        type: 'line',
        data: {
          labels: timestamps,
          datasets: datasets
        },
        options: {
          scales: {
            'y-axis-tests': {
              type: 'linear',
              position: 'left',
              beginAtZero: true,
              title: {
                display: true,
                text: 'Number of Tests'
              }
            },
            'y-axis-time': {
              type: 'linear',
              position: 'right',
              beginAtZero: true,
              grid: {
                drawOnChartArea: false
              },
              title: {
                display: true,
                text: 'Duration (s)'
              }
            }
          },
          plugins: {
            tooltip: {
              callbacks: {
                afterBody: function (context) {
                  const index = context[0].dataIndex;
                  const status = statuses[index];
                  return `Status: ${status}`;
                }
              }
            },
            legend: {
              position: 'top'
            },
            title: {
              display: true,
              text: chartTitle
            }
          }
        }
      };

      const ctx = document.getElementById(chartCanvasId).getContext('2d');

      // Create the chart
      const chart = new Chart(ctx, chartConfig);
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

// Fetch and create charts for unit tests and Android tests
fetchDataAndCreateChart('unit_test_data.json', 'unitTestChart', 'Unit Test Suite Results Over Time');
fetchDataAndCreateChart('android_test_data.json', 'androidTestChart', 'Android Test Suite Results Over Time');
