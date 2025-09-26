// Simple direct test
const API_KEY = 'AIzaSyAlBkhti-IvArv6ejMXmWJfAkPVnAUXvog';

fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-8b:generateContent?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        contents: [{
            parts: [{ text: "Simply say: Hello" }]
        }]
    })
})
.then(res => res.json())
.then(data => {
    if (data.candidates) {
        console.log('✅ SUCCESS! API is working!');
        console.log('Response:', data.candidates[0]?.content?.parts?.[0]?.text);
    } else if (data.error) {
        console.log('❌ Error:', data.error.message);
        if (data.error.details) {
            console.log('Details:', JSON.stringify(data.error.details, null, 2));
        }
    }
})
.catch(err => console.error('Network error:', err));