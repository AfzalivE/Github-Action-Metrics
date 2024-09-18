fetch('../test_data.json')
  .then(response => response.json())
  .then(data => {
    const timestamps = data.map(entry => new Date(entry.timestamp).toLocaleString());
    const passedTests = data.map(entry => entry.passed);
    const failedTests = data.map(entry => entry.failures + entry.errors);
    const testTimes = data.map(entry => entry.time);

    const ctx = document.getElementById('testResultsChart').getContext('2d');
    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: timestamps,
        datasets: [
          {
            label: 'Passed Tests',
            data: passedTests,
            borderColor: 'green',
            fill: false
          },
          {
            label: 'Failed Tests',
            data: failedTests,
            borderColor: 'red',
            fill: false
          },
          {
            label: 'Test Duration (s)',
            data: testTimes,
            borderColor: 'blue',
            fill: false,
            yAxisID: 'y-axis-time'
          }
        ]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true
          },
          'y-axis-time': {
            type: 'linear',
            position: 'right'
          }
        }
      }
    });
  })
  .catch(error => console.error('Error loading test data:', error));
