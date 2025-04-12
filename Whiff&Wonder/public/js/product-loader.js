class ProductLoader {
    constructor() {
        this.productCache = null;
    }

    async loadProductData(productId) {
        try {
            const response = await fetch('/data/items.json');
            if (!response.ok) {
                throw new Error('Failed to fetch products');
            }

            const products = await response.json();
            const product = products.find(p => p.id === productId);

            if (!product) {
                throw new Error('Product not found');
            }

            return product;
        } catch (error) {
            console.error('Error loading product:', error);
            throw error;
        }
    }

    generateStarsHtml(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        
        return '★'.repeat(fullStars) + 
               (hasHalfStar ? '⯨' : '') + 
               '☆'.repeat(emptyStars);
    }

    async updateProductUI(product) {
        // Update page title and meta
        document.title = `${product.name} - Whiff & Wonder`;
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.content = product.description || `Discover ${product.name} at Whiff & Wonder`;
        }

        // Update product details
        document.getElementById('productName').textContent = product.name;
        document.getElementById('productImage').src = product.image.startsWith('/') ? product.image : `/images/${product.image}`;
        document.getElementById('productImage').alt = product.name;
        document.getElementById('productPrice').textContent = product.price.toFixed(2);
        document.getElementById('productRating').textContent = `${product.rating}/5`;
        document.getElementById('productStars').innerHTML = this.generateStarsHtml(product.rating);
        
        // Display accords
        const accordsHtml = product.accords
            .map(accord => `<span class="accord" data-translate="${accord.toLowerCase()}">${accord}</span>`)
            .join('');
        document.getElementById('productAccords').innerHTML = accordsHtml;
        
        // Display notes
        document.getElementById('topNotes').textContent = product.notes.top.join(', ');
        document.getElementById('heartNotes').textContent = product.notes.heart.join(', ');
        document.getElementById('baseNotes').textContent = product.notes.base.join(', ');
        
        document.getElementById('productDescription').textContent = product.description || '';

        // Show product details and hide loading
        document.getElementById('loadingMessage').style.display = 'none';
        document.getElementById('productDetails').style.display = 'flex';

        // Apply translations if available
        if (typeof translatePage === 'function') {
            translatePage(localStorage.getItem('preferredLanguage') || 'en');
        }
    }

    showError(message) {
        document.getElementById('loadingMessage').style.display = 'none';
        const errorDiv = document.getElementById('errorMessage');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }

    async addToRecentViews(productId) {
        try {
            const response = await fetch('/api/user/recent-views', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ productId }),
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to save recent view');
            }
        } catch (error) {
            console.warn('Error saving recent view:', error);
            // Non-critical error, don't show to user
        }
    }

    async updateLikeButtonStatus(productId) {
        try {
            const response = await fetch('/api/user/likes', {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.likes.includes(productId)) {
                    const likeButton = document.getElementById('likeButton');
                    likeButton.classList.add('liked');
                    likeButton.style.color = '#ff4d4d';
                }
            }
        } catch (error) {
            console.warn('Error checking like status:', error);
            // Non-critical error, don't show to user
        }
    }
}

// Initialize ProductLoader
const productLoader = new ProductLoader();

// Initialize product loading
document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    if (!productId) {
        productLoader.showError('Product ID not specified');
        return;
    }

    try {
        const product = await productLoader.loadProductData(productId);
        await productLoader.updateProductUI(product);
        await productLoader.addToRecentViews(productId);
        await productLoader.updateLikeButtonStatus(productId);
    } catch (error) {
        console.error('Failed to load product:', error);
        productLoader.showError('Unable to load product details');
    }
});
