// URL Scraper Service for Product Pages

class URLScraper {
    constructor() {
        // Use a CORS proxy for fetching external URLs
        this.corsProxy = 'https://corsproxy.io/?';
    }

    // Extract product info from URL
    async extractFromURL(url) {
        try {
            // Validate URL
            if (!this.isValidURL(url)) {
                throw new Error('Invalid URL format');
            }

            // Determine the site type
            const siteType = this.detectSiteType(url);

            // For now, we'll take a screenshot approach using Puppeteer/Playwright on server
            // But since we're client-side, we'll use a different approach

            // Try to fetch the page content
            const response = await fetch(this.corsProxy + encodeURIComponent(url));

            if (!response.ok) {
                throw new Error(`Failed to fetch URL: ${response.status}`);
            }

            const html = await response.text();

            // Extract structured data from HTML
            const extractedData = this.parseHTML(html, siteType, url);

            return {
                success: true,
                data: extractedData,
                url: url,
                requiresScreenshot: false
            };

        } catch (error) {
            console.error('URL extraction error:', error);

            // Fallback: suggest taking a screenshot
            return {
                success: false,
                error: error.message,
                url: url,
                requiresScreenshot: true,
                message: 'Could not fetch directly. Please take a screenshot of the product page instead.'
            };
        }
    }

    // Validate URL
    isValidURL(string) {
        try {
            const url = new URL(string);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch {
            return false;
        }
    }

    // Detect site type from URL
    detectSiteType(url) {
        const urlLower = url.toLowerCase();

        if (urlLower.includes('amazon.com')) {
            return 'amazon';
        } else if (urlLower.includes('boatzincs.com')) {
            return 'boatzincs';
        } else if (urlLower.includes('ebay.com')) {
            return 'ebay';
        } else if (urlLower.includes('westmarine.com')) {
            return 'westmarine';
        } else if (urlLower.includes('defender.com')) {
            return 'defender';
        } else {
            return 'generic';
        }
    }

    // Parse HTML content
    parseHTML(html, siteType, url) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        let productData = {
            url: url,
            source_type: 'website',
            items: []
        };

        try {
            // Try to find JSON-LD structured data first
            const jsonLdScripts = doc.querySelectorAll('script[type="application/ld+json"]');
            for (const script of jsonLdScripts) {
                try {
                    const data = JSON.parse(script.textContent);
                    if (data['@type'] === 'Product' || data.type === 'Product') {
                        productData.items.push(this.parseStructuredData(data, url));
                    }
                } catch (e) {
                    console.error('Failed to parse JSON-LD:', e);
                }
            }

            // If no structured data, try site-specific parsing
            if (productData.items.length === 0) {
                switch (siteType) {
                    case 'amazon':
                        productData.items.push(this.parseAmazon(doc, url));
                        break;
                    case 'boatzincs':
                        productData.items.push(this.parseBoatzincs(doc, url));
                        break;
                    default:
                        productData.items.push(this.parseGeneric(doc, url));
                }
            }

        } catch (error) {
            console.error('HTML parsing error:', error);
        }

        // Filter out empty items
        productData.items = productData.items.filter(item => item && item.name);

        return productData;
    }

    // Parse structured data
    parseStructuredData(data, url) {
        return {
            name: data.name || '',
            sku: data.sku || data.mpn || '',
            price: this.extractPrice(data.offers),
            description: data.description || '',
            brand: data.brand?.name || data.brand || '',
            category: 'product',
            supplier: new URL(url).hostname.replace('www.', ''),
            url: url,
            image: data.image?.[0] || data.image || '',
            quantity: 1
        };
    }

    // Parse Amazon product page
    parseAmazon(doc, url) {
        const item = {
            url: url,
            supplier: 'Amazon',
            quantity: 1
        };

        // Try to extract ASIN from URL
        const asinMatch = url.match(/\/dp\/([A-Z0-9]{10})/);
        if (asinMatch) {
            item.sku = asinMatch[1];
        }

        // Product title
        const title = doc.querySelector('#productTitle, [data-feature-name="title"] span, h1.a-size-large');
        if (title) {
            item.name = title.textContent.trim();
        }

        // Price
        const priceElement = doc.querySelector('.a-price-whole, #priceblock_dealprice, #priceblock_saleprice, #priceblock_ourprice, .a-price.a-text-price.a-size-medium.apexPriceToPay, .a-price-range');
        if (priceElement) {
            item.price = this.parsePrice(priceElement.textContent);
        }

        // Brand
        const brand = doc.querySelector('#bylineInfo, a#brand, .po-brand .po-break-word');
        if (brand) {
            item.brand = brand.textContent.replace(/^Brand:\s*/, '').trim();
        }

        // Description
        const features = doc.querySelectorAll('#feature-bullets li span.a-list-item');
        if (features.length > 0) {
            item.description = Array.from(features)
                .map(f => f.textContent.trim())
                .filter(t => t && !t.includes('Make sure this fits'))
                .join('; ');
        }

        return item;
    }

    // Parse Boatzincs product page
    parseBoatzincs(doc, url) {
        const item = {
            url: url,
            supplier: 'Boatzincs',
            category: 'anodes',
            quantity: 1
        };

        // Product title
        const title = doc.querySelector('h1, .product-title');
        if (title) {
            item.name = title.textContent.trim();
        }

        // SKU
        const sku = doc.querySelector('.sku, .product-sku');
        if (sku) {
            item.sku = sku.textContent.replace(/SKU:\s*/, '').trim();
        }

        // Price
        const price = doc.querySelector('.price, .product-price');
        if (price) {
            item.price = this.parsePrice(price.textContent);
        }

        return item;
    }

    // Generic parser
    parseGeneric(doc, url) {
        const item = {
            url: url,
            supplier: new URL(url).hostname.replace('www.', ''),
            quantity: 1
        };

        // Try common selectors
        const title = doc.querySelector('h1, [itemprop="name"], .product-name, .product-title');
        if (title) {
            item.name = title.textContent.trim();
        }

        const price = doc.querySelector('[itemprop="price"], .price, .product-price, .cost');
        if (price) {
            item.price = this.parsePrice(price.textContent);
        }

        const sku = doc.querySelector('[itemprop="sku"], .sku, .product-sku');
        if (sku) {
            item.sku = sku.textContent.trim();
        }

        return item;
    }

    // Extract price from offers object
    extractPrice(offers) {
        if (!offers) return 0;

        if (typeof offers.price === 'number') {
            return offers.price;
        }

        if (typeof offers.price === 'string') {
            return this.parsePrice(offers.price);
        }

        if (Array.isArray(offers) && offers[0]?.price) {
            return this.extractPrice(offers[0]);
        }

        return 0;
    }

    // Parse price string to number
    parsePrice(priceString) {
        if (!priceString) return 0;

        const cleaned = priceString.toString()
            .replace(/[^0-9.,]/g, '')
            .replace(',', '');

        return parseFloat(cleaned) || 0;
    }

    // Alternative: Use screenshot service
    async captureScreenshot(url) {
        // This would require a server-side service
        // For now, we'll return a message to take a manual screenshot

        return {
            success: false,
            message: 'Please take a screenshot of the product page and upload it'
        };
    }
}

// Export for use
window.URLScraper = URLScraper;