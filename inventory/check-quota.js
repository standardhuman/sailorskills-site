// Check actual quota status for the API key
const API_KEY = 'AIzaSyAlBkhti-IvArv6ejMXmWJfAkPVnAUXvog';

async function checkQuotaStatus() {
    console.log('Checking quota status for API key...');
    console.log('API Key:', API_KEY);
    console.log('-----------------------------------\n');

    // Try different API endpoints to understand the issue
    const tests = [
        {
            name: 'List Available Models',
            url: `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`,
            method: 'GET'
        },
        {
            name: 'Get Model Info',
            url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash?key=${API_KEY}`,
            method: 'GET'
        }
    ];

    // First, let's see what models are available
    for (const test of tests) {
        console.log(`Testing: ${test.name}`);
        try {
            const response = await fetch(test.url, { method: test.method });
            const data = await response.json();

            if (response.ok) {
                console.log('✅ Success');
                if (test.name === 'List Available Models') {
                    console.log('Available models:');
                    data.models?.forEach(model => {
                        console.log(`  - ${model.name}: ${model.displayName}`);
                        if (model.supportedGenerationMethods) {
                            console.log(`    Methods: ${model.supportedGenerationMethods.join(', ')}`);
                        }
                    });
                } else {
                    console.log('Response:', JSON.stringify(data, null, 2));
                }
            } else {
                console.log('❌ Failed');
                console.log('Error:', data.error?.message);
                console.log('Details:', JSON.stringify(data.error, null, 2));
            }
        } catch (error) {
            console.log('❌ Network error:', error.message);
        }
        console.log('-----------------------------------\n');
    }

    // Now try with the v1 endpoint (not beta)
    console.log('Testing v1 endpoint (non-beta):');
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: "Say hello"
                        }]
                    }]
                })
            }
        );

        const data = await response.json();

        if (response.ok) {
            console.log('✅ v1 endpoint works!');
            console.log('Response:', data.candidates?.[0]?.content?.parts?.[0]?.text);
        } else {
            console.log('❌ v1 endpoint failed');
            console.log('Error:', data.error?.message);

            // Check if it's really a quota issue or something else
            if (data.error?.code === 429 || data.error?.status === 'RESOURCE_EXHAUSTED') {
                console.log('\n⚠️  This appears to be a quota issue, but you just created the key...');
                console.log('Possible reasons:');
                console.log('1. The API key might be linked to a Google Cloud project with existing usage');
                console.log('2. There might be a shared quota across your Google account');
                console.log('3. The free tier might not be activated yet');
                console.log('\nSuggestions:');
                console.log('1. Try creating a new API key in Google AI Studio');
                console.log('2. Make sure you\'re not using a Google Cloud project key');
                console.log('3. Check if you have any other projects using Gemini API');
            }
        }
    } catch (error) {
        console.log('❌ Network error:', error.message);
    }

    console.log('\n-----------------------------------');
    console.log('Quota check complete\n');

    // Additional check for API key type
    if (API_KEY.startsWith('AIza')) {
        console.log('✅ This appears to be a Google AI Studio API key (correct type)');
    } else {
        console.log('⚠️  This might not be a Google AI Studio API key');
    }
}

checkQuotaStatus();