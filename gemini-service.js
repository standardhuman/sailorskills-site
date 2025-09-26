// Gemini AI Service for Inventory Extraction

class GeminiService {
    constructor() {
        this.apiKey = localStorage.getItem('gemini_api_key') || '';
        this.model = localStorage.getItem('gemini_model') || 'gemini-1.5-flash-8b';
        this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta';
        this.requestCount = 0;
        this.dailyLimit = 25;
        this.loadUsageStats();
    }

    // Set API Key
    setApiKey(key) {
        this.apiKey = key;
        localStorage.setItem('gemini_api_key', key);
    }

    // Set Model
    setModel(model) {
        this.model = model;
        localStorage.setItem('gemini_model', model);
    }

    // Load usage stats for the day
    loadUsageStats() {
        const today = new Date().toDateString();
        const storedDate = localStorage.getItem('gemini_usage_date');

        if (storedDate !== today) {
            // Reset counter for new day
            this.requestCount = 0;
            localStorage.setItem('gemini_usage_date', today);
            localStorage.setItem('gemini_usage_count', '0');
        } else {
            this.requestCount = parseInt(localStorage.getItem('gemini_usage_count') || '0');
        }
    }

    // Update usage stats
    updateUsageStats() {
        this.requestCount++;
        localStorage.setItem('gemini_usage_count', this.requestCount.toString());
    }

    // Check if API key is configured
    isConfigured() {
        return !!this.apiKey;
    }

    // Check if within daily limit
    canMakeRequest() {
        return this.requestCount < this.dailyLimit;
    }

    // Convert image to base64
    async imageToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // Extract inventory data from image
    async extractInventoryData(imageFile, extractionMode = 'comprehensive') {
        if (!this.isConfigured()) {
            throw new Error('Gemini API key not configured. Please set it in settings.');
        }

        if (!this.canMakeRequest()) {
            throw new Error(`Daily limit reached (${this.dailyLimit} requests). Resets at midnight PT.`);
        }

        // Convert image to base64
        const imageBase64 = await this.imageToBase64(imageFile);

        // Create extraction prompt based on mode
        const prompt = this.createExtractionPrompt(extractionMode);

        // Prepare the request
        const requestBody = {
            contents: [{
                parts: [
                    {
                        text: prompt
                    },
                    {
                        inline_data: {
                            mime_type: imageFile.type,
                            data: imageBase64
                        }
                    }
                ]
            }],
            generationConfig: {
                temperature: 0.1,
                topK: 1,
                topP: 0.95,
                maxOutputTokens: 2048,
                responseMimeType: "application/json"
            }
        };

        try {
            const response = await fetch(
                `${this.apiUrl}/models/${this.model}:generateContent?key=${this.apiKey}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestBody)
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Failed to process image');
            }

            const result = await response.json();
            this.updateUsageStats();

            // Extract the JSON response
            const extractedData = this.parseGeminiResponse(result);
            return extractedData;

        } catch (error) {
            console.error('Gemini API Error:', error);
            throw error;
        }
    }

    // Create extraction prompt based on mode
    createExtractionPrompt(mode) {
        const basePrompt = `Analyze this image and extract product/inventory information.
        Return the data as a JSON object with the following structure:
        {
            "items": [
                {
                    "name": "product name (required)",
                    "sku": "SKU or part number if visible",
                    "quantity": quantity as number (default to 1 if not visible),
                    "price": unit price as number (no currency symbols),
                    "category": "best guess category (e.g., 'anodes', 'tools', 'supplies')",
                    "supplier": "supplier/vendor name if visible",
                    "description": "brief description",
                    "url": "product URL if visible",
                    "notes": "any additional relevant info"
                }
            ],
            "source_type": "order|invoice|listing|receipt|other",
            "source_date": "date if visible (YYYY-MM-DD format)",
            "total_amount": total amount if this is an order/invoice
        }`;

        const modeInstructions = {
            comprehensive: `
                Extract ALL possible details from the image.
                Include product specifications, dimensions, materials, etc. in the description.
                Try to identify product categories accurately.
                If this is an anode, include material type (zinc/aluminum/magnesium) in the notes.`,
            essential: `
                Focus on key fields: name, SKU, quantity, and price.
                Include category and supplier if clearly visible.
                Keep descriptions brief.`,
            quick: `
                Extract only product names and quantities.
                Set other fields to null if not immediately obvious.
                Process quickly without deep analysis.`
        };

        return basePrompt + (modeInstructions[mode] || modeInstructions.comprehensive) + `

        Important:
        - If multiple products are visible, include all of them
        - Use null for fields that cannot be determined
        - Ensure quantities are numbers, not strings
        - Remove currency symbols from prices
        - Respond ONLY with valid JSON, no additional text`;
    }

    // Parse Gemini response
    parseGeminiResponse(response) {
        try {
            // Get the text from the response
            const text = response.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!text) {
                throw new Error('No text content in response');
            }

            // Parse the JSON
            const data = JSON.parse(text);

            // Validate and clean the data
            if (!data.items || !Array.isArray(data.items)) {
                data.items = [];
            }

            // Clean up each item
            data.items = data.items.map(item => ({
                name: item.name || 'Unknown Product',
                sku: item.sku || '',
                quantity: parseInt(item.quantity) || 1,
                price: parseFloat(item.price) || 0,
                category: item.category || 'uncategorized',
                supplier: item.supplier || '',
                description: item.description || '',
                url: item.url || '',
                notes: item.notes || ''
            }));

            return data;

        } catch (error) {
            console.error('Error parsing Gemini response:', error);
            return {
                items: [],
                error: 'Failed to parse extraction results'
            };
        }
    }

    // Process multiple images
    async processMultipleImages(files, extractionMode = 'comprehensive', onProgress) {
        const results = [];
        const total = files.length;

        for (let i = 0; i < total; i++) {
            if (onProgress) {
                onProgress(i, total, `Processing ${files[i].name}...`);
            }

            try {
                const data = await this.extractInventoryData(files[i], extractionMode);
                results.push({
                    file: files[i].name,
                    success: true,
                    data: data
                });
            } catch (error) {
                results.push({
                    file: files[i].name,
                    success: false,
                    error: error.message
                });
            }

            // Rate limiting: wait 12 seconds between requests (5 req/min limit)
            if (i < total - 1) {
                await this.delay(12000);
            }
        }

        return results;
    }

    // Utility: delay function
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Get usage stats
    getUsageStats() {
        return {
            used: this.requestCount,
            limit: this.dailyLimit,
            remaining: this.dailyLimit - this.requestCount,
            percentage: (this.requestCount / this.dailyLimit) * 100
        };
    }

    // Match extracted items with existing catalog
    async matchWithCatalog(items, supabase) {
        const matched = [];

        for (const item of items) {
            let match = null;

            // Try to find match by SKU
            if (item.sku) {
                const { data } = await supabase
                    .from('anodes_catalog')
                    .select('*')
                    .eq('sku', item.sku)
                    .single();

                if (data) {
                    match = data;
                }
            }

            // Try to find match by name similarity
            if (!match && item.name) {
                const { data } = await supabase
                    .from('anodes_catalog')
                    .select('*')
                    .ilike('name', `%${item.name}%`)
                    .limit(1)
                    .single();

                if (data) {
                    match = data;
                }
            }

            matched.push({
                ...item,
                catalogMatch: match,
                isAnode: match !== null || item.category?.toLowerCase().includes('anode')
            });
        }

        return matched;
    }

    // Validate API key
    async validateApiKey(key) {
        const testBody = {
            contents: [{
                parts: [{
                    text: "Respond with: {\"status\": \"ok\"}"
                }]
            }],
            generationConfig: {
                temperature: 0,
                maxOutputTokens: 50
            }
        };

        try {
            // Try with gemini-1.5-flash first (most compatible)
            const response = await fetch(
                `${this.apiUrl}/models/gemini-1.5-flash:generateContent?key=${key}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(testBody)
                }
            );

            if (response.ok) {
                return true;
            }

            // Log the error for debugging
            const errorData = await response.json();
            console.error('API Key validation error:', errorData);

            // Check if it's a quota error (which means key is valid but quota exceeded)
            if (response.status === 429) {
                return true; // Key is valid, just rate limited
            }

            return false;
        } catch (error) {
            console.error('API Key validation error:', error);
            return false;
        }
    }
}

// Export for use in other scripts
window.GeminiService = GeminiService;