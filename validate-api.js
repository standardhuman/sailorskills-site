// Simple Node.js script to validate Gemini API key
const API_KEY = 'AIzaSyAlBkhti-IvArv6ejMXmWJfAkPVnAUXvog';

async function validateApiKey() {
    console.log('Testing Gemini API key:', API_KEY);
    console.log('-----------------------------------');

    const models = [
        'gemini-1.5-flash',
        'gemini-1.5-pro',
        'gemini-pro'
    ];

    for (const model of models) {
        console.log(`\nTesting model: ${model}`);

        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: "Reply with: OK"
                            }]
                        }]
                    })
                }
            );

            const data = await response.json();

            if (response.ok) {
                console.log(`✅ SUCCESS with ${model}`);
                console.log('Response:', data.candidates?.[0]?.content?.parts?.[0]?.text);
                return true;
            } else {
                console.log(`❌ FAILED with ${model}`);
                console.log('Error:', data.error?.message || 'Unknown error');
                console.log('Status:', data.error?.status || response.status);

                if (data.error?.details) {
                    console.log('Details:', JSON.stringify(data.error.details, null, 2));
                }
            }
        } catch (error) {
            console.log(`❌ Network error with ${model}:`, error.message);
        }
    }

    console.log('\n-----------------------------------');
    console.log('API Key validation complete');

    // Also test if it's a valid key format
    if (API_KEY.startsWith('AIza') && API_KEY.length === 39) {
        console.log('✅ Key format looks correct (AIza... with 39 chars)');
    } else {
        console.log('⚠️  Key format might be incorrect');
        console.log(`   Length: ${API_KEY.length} (expected 39)`);
        console.log(`   Prefix: ${API_KEY.substring(0, 4)} (expected AIza)`);
    }

    return false;
}

// Run the validation
validateApiKey().then(success => {
    if (!success) {
        console.log('\n⚠️  The API key appears to be invalid or there\'s an issue with the API');
        console.log('Please check:');
        console.log('1. You have the correct API key from https://aistudio.google.com/app/apikey');
        console.log('2. The API key is for Gemini (not other Google services)');
        console.log('3. You have not exceeded your quota');
    }
});