document.addEventListener('DOMContentLoaded', async () => {
    try {
        const products = await window.productService.getAllProducts();
        const productGrid = document.getElementById('productGrid');
        
        if (!productGrid) {
            console.warn('Product grid element not found');
            return;
        }

        productGrid.innerHTML = products.map(item => `
            <div class="product">
                <img src="${item.image}" alt="${item.name}" loading="lazy">
                <h3>${item.name}</h3>
                <div class="perfume-details">
                    <div class="notes">
                        <h4 data-translate="mainAccords">Main Accords</h4>
                        ${item.accords.map(accord => 
                            `<span class="accord" data-translate="${accord.toLowerCase()}">${accord}</span>`
                        ).join('')}
                    </div>
                    <div class="rating">
                        <span class="stars">${productService.generateStarsHtml(item.rating)}</span>
                        <span class="score">${item.rating}<span data-translate="ratingScore">/5</span></span>
                    </div>
                    <div class="notes-pyramid">
                        <p><strong data-translate="topNotes">Top Notes:</strong> ${item.notes.top.join(', ')}</p>
                        <p><strong data-translate="heartNotes">Heart Notes:</strong> ${item.notes.heart.join(', ')}</p>
                        <p><strong data-translate="baseNotes">Base Notes:</strong> ${item.notes.base.join(', ')}</p>
                    </div>
                </div>
                <button data-translate="fullReview" onclick="window.location.href='/product?id=${item.id}'">Full Review</button>
            </div>
        `).join('');

        // Apply translations after loading products
        if (typeof translatePage === 'function') {
            translatePage(localStorage.getItem('preferredLanguage') || 'en');
        }

        // Add filter functionality
        const filterPanel = document.createElement('div');
        filterPanel.id = 'filterPanel';
        filterPanel.className = 'filter-panel';
        filterPanel.innerHTML = `
            <div class="filter-group">
                <h3 data-translate="fragranceFamily">Fragrance Family</h3>
                <div class="filter-options">
                    <label><input type="checkbox" value="floral"> <span data-translate="floral">Floral</span></label>
                    <label><input type="checkbox" value="oriental"> <span data-translate="oriental">Oriental</span></label>
                    <label><input type="checkbox" value="woody"> <span data-translate="woody">Woody</span></label>
                    <label><input type="checkbox" value="fresh"> <span data-translate="fresh">Fresh</span></label>
                </div>
            </div>
            <div class="filter-group">
                <h3 data-translate="gender">Gender</h3>
                <div class="filter-options">
                    <label><input type="checkbox" value="women"> <span data-translate="women">Women</span></label>
                    <label><input type="checkbox" value="men"> <span data-translate="men">Men</span></label>
                    <label><input type="checkbox" value="unisex"> <span data-translate="unisex">Unisex</span></label>
                </div>
            </div>
            <div class="filter-group">
                <h3 data-translate="priceRange">Price Range</h3>
                <div class="filter-options">
                    <label><input type="checkbox" value="under50"> <span data-translate="under50">Under $50</span></label>
                    <label><input type="checkbox" value="50-100"> <span data-translate="between50And100">$50 - $100</span></label>
                    <label><input type="checkbox" value="100-200"> <span data-translate="between100And200">$100 - $200</span></label>
                    <label><input type="checkbox" value="over200"> <span data-translate="over200">Over $200</span></label>
                </div>
            </div>
        `;

        document.querySelector('header').after(filterPanel);

        // Add filter event listeners
        const filterInputs = filterPanel.querySelectorAll('input[type="checkbox"]');
        filterInputs.forEach(input => {
            input.addEventListener('change', () => {
                const selectedFilters = {
                    fragranceFamily: Array.from(filterPanel.querySelectorAll('.filter-group:nth-child(1) input:checked')).map(el => el.value),
                    gender: Array.from(filterPanel.querySelectorAll('.filter-group:nth-child(2) input:checked')).map(el => el.value),
                    priceRange: Array.from(filterPanel.querySelectorAll('.filter-group:nth-child(3) input:checked')).map(el => el.value)
                };

                const filteredProducts = products.filter(product => {
                    const matchesFamily = selectedFilters.fragranceFamily.length === 0 || 
                        product.accords.some(accord => selectedFilters.fragranceFamily.includes(accord.toLowerCase()));
                    const matchesGender = selectedFilters.gender.length === 0 || 
                        selectedFilters.gender.includes(product.gender);
                    const matchesPrice = selectedFilters.priceRange.length === 0 || 
                        selectedFilters.priceRange.some(range => {
                            switch (range) {
                                case 'under50': return product.price < 50;
                                case '50-100': return product.price >= 50 && product.price <= 100;
                                case '100-200': return product.price > 100 && product.price <= 200;
                                case 'over200': return product.price > 200;
                                default: return true;
                            }
                        });

                    return matchesFamily && matchesGender && matchesPrice;
                });

                // Update grid with filtered products
                productGrid.innerHTML = filteredProducts.length ? filteredProducts.map(item => `
                    <div class="product">
                        <img src="${item.image}" alt="${item.name}" loading="lazy">
                        <h3>${item.name}</h3>
                        <div class="perfume-details">
                            <div class="notes">
                                <h4 data-translate="mainAccords">Main Accords</h4>
                                ${item.accords.map(accord => 
                                    `<span class="accord" data-translate="${accord.toLowerCase()}">${accord}</span>`
                                ).join('')}
                            </div>
                            <div class="rating">
                                <span class="stars">${productService.generateStarsHtml(item.rating)}</span>
                                <span class="score">${item.rating}<span data-translate="ratingScore">/5</span></span>
                            </div>
                            <div class="notes-pyramid">
                                <p><strong data-translate="topNotes">Top Notes:</strong> ${item.notes.top.join(', ')}</p>
                                <p><strong data-translate="heartNotes">Heart Notes:</strong> ${item.notes.heart.join(', ')}</p>
                                <p><strong data-translate="baseNotes">Base Notes:</strong> ${item.notes.base.join(', ')}</p>
                            </div>
                        </div>
                        <button data-translate="fullReview" onclick="window.location.href='/product?id=${item.id}'">Full Review</button>
                    </div>
                `).join('') : '<p class="no-results">No products match the selected filters</p>';

                // Reapply translations
                if (typeof translatePage === 'function') {
                    translatePage(localStorage.getItem('preferredLanguage') || 'en');
                }
            });
        });

    } catch (error) {
        console.error('Error loading items:', error);
        const productGrid = document.getElementById('productGrid');
        if (productGrid) {
            productGrid.innerHTML = '<p class="error-message" data-translate="errorLoadingProducts">Error loading products. Please try again later.</p>';
        }
    }
});
