fetch('https://gym-management-system-software-backend.onrender.com/api/whatsapp/real-status')
  .then(async res => {
    console.log('Status:', res.status);
    console.log('Text:', await res.text());
  })
  .catch(console.error);
