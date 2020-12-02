document.addEventListener('DOMContentLoaded', () => {
  let app = firebase.app();

  fetch(
    'http://localhost:5001/cloud-functions-fireship-7327f/us-central1/api/dog'
  ).then(console.log);
});
