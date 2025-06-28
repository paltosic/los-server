document.getElementById('start-job-btn').addEventListener('click', () => {
    mp.trigger('startTaxiJob');
    document.getElementById('job-status').innerText = 'Status: Working';
    document.getElementById('start-job-btn').disabled = true;
    document.getElementById('stop-job-btn').disabled = false;
});

document.getElementById('stop-job-btn').addEventListener('click', () => {
    mp.trigger('stopTaxiJob');
    document.getElementById('job-status').innerText = 'Status: Not started';
    document.getElementById('start-job-btn').disabled = false;
    document.getElementById('stop-job-btn').disabled = true;
});

mp.events.add('taxiJobUpdate', (message) => {
    document.getElementById('job-info').innerText = message;
});
