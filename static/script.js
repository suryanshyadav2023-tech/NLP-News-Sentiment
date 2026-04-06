if (positive + negative + neutral > 0) {
    const ctx = document.getElementById('sentimentChart').getContext('2d');

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Positive', 'Negative', 'Neutral'],
            datasets: [{
                data: [positive, negative, neutral],
                backgroundColor: [
                    '#3fb950', // green
                    '#f85149', // red
                    '#d29922'  // yellow
                ]
            }]
        },
        options: {
            plugins: {
                legend: {
                    labels: {
                        color: '#e6edf3'
                    }
                }
            }
        }
    });
}