fetch('test_data.json')
  .then(response => response.json())
  .then(data => {
    const suiteData = data.suites;

    // Extract data for charting
    const timestamps = suiteData.map(entry => new Date(entry.timestamp).toLocaleString());
    const passedTests = suiteData.map(entry => entry.passed);
    const failedTests = suiteData.map(entry => entry.failures + entry.errors);
    const testTimes = suiteData.map(entry => entry.time);
    const statuses = suiteData.map(entry => entry.status);

    const ctx = document.getElementById('testResultsChart').getContext('2d');

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
              afterBody: function(context) {
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
            text: 'Test Suite Results Over Time'
          }
        }
      }
    };

    // Create the chart
    const chart = new Chart(ctx, chartConfig);
  })
  .catch(error => console.error('Error loading test data:', error));
